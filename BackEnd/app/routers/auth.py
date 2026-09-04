from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_otp_code,
    generate_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from app.database import get_db
from app.deps import get_current_user
from app.models.email_verification_code import EmailVerificationCode
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    VerifyEmailRequest,
)
from app.services.email.registry import get_email_sender

router = APIRouter(prefix="/auth", tags=["auth"])

# Always the same message, whether or not the email is registered — the
# alternative (revealing which emails have accounts) is a classic
# account-enumeration vulnerability.
_FORGOT_PASSWORD_MESSAGE = (
    "If an account exists for that email, we've sent instructions to reset the password."
)
_RESEND_VERIFICATION_MESSAGE = "If that account needs verifying, we've sent a new code."

OTP_EXPIRE_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


def _issue_and_send_otp(db: Session, user: User) -> None:
    code = generate_otp_code()
    db.add(
        EmailVerificationCode(
            user_id=user.id,
            code_hash=hash_reset_token(code),  # generic sha256 hash, same helper as reset tokens
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES),
        )
    )
    db.commit()

    get_email_sender().send(
        to=user.email,
        subject="Verify your NutriPredict email",
        body=(
            f"Hi {user.name},\n\n"
            f"Your NutriPredict verification code is:\n\n"
            f"    {code}\n\n"
            f"This code expires in {OTP_EXPIRE_MINUTES} minutes. If you didn't "
            f"sign up for NutriPredict, you can ignore this email."
        ),
    )


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> SignupResponse:
    """
    Creates a new, unverified account and emails a 6-digit code. No
    access_token is issued here — the account can't log in until
    POST /auth/verify-email succeeds. 409s if the email is already
    registered (verified or not).
    """
    existing = db.scalars(select(User).where(User.email == payload.email)).first()
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _issue_and_send_otp(db, user)

    return SignupResponse(
        message="Account created. Check your email for a 6-digit verification code.",
        email=user.email,
    )


@router.post("/verify-email", response_model=TokenResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Verifies the OTP and, on success, logs the user in immediately (returns
    a normal TokenResponse) — no need to make them log in again right after
    proving they own the email.
    """
    user = db.scalars(select(User).where(User.email == payload.email)).first()
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")

    if user.is_verified:
        token = create_access_token(user.id)
        return TokenResponse(access_token=token, user=user)

    otp = db.scalars(
        select(EmailVerificationCode)
        .where(EmailVerificationCode.user_id == user.id, EmailVerificationCode.used_at.is_(None))
        .order_by(EmailVerificationCode.created_at.desc())
    ).first()

    now = datetime.now(timezone.utc)
    if otp is None or otp.expires_at < now or otp.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Request a new one.",
        )

    if hash_reset_token(payload.code) != otp.code_hash:
        otp.attempts += 1
        db.commit()
        remaining = max(0, OTP_MAX_ATTEMPTS - otp.attempts)
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect code. {remaining} attempt(s) remaining before you'll need a new one.",
        )

    otp.used_at = now
    user.is_verified = True
    db.commit()

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)) -> MessageResponse:
    """Always the same generic message — doesn't reveal whether the email exists or is already verified."""
    user = db.scalars(select(User).where(User.email == payload.email)).first()
    if user is not None and not user.is_verified:
        _issue_and_send_otp(db, user)

    return MessageResponse(message=_RESEND_VERIFICATION_MESSAGE)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Logs in with email + password. Checks credentials before verification
    status, so "wrong password" always reads as 401 regardless of whether
    the account happens to be verified yet — only a *correct* password on
    an unverified account surfaces the 403 "please verify" case.
    """
    user = db.scalars(select(User).where(User.email == payload.email)).first()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in.",
        )

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    """
    Always returns the same generic message, regardless of whether the
    email is registered. If it is, a reset link is emailed (via whichever
    EMAIL_BACKEND is configured — "console" by default, which logs it
    instead of actually sending it; see services/email/).
    """
    user = db.scalars(select(User).where(User.email == payload.email)).first()

    if user is not None:
        raw_token = generate_reset_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        )
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_reset_token(raw_token),
                expires_at=expires_at,
            )
        )
        db.commit()

        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        get_email_sender().send(
            to=user.email,
            subject="Reset your NutriPredict password",
            body=(
                f"Hi {user.name},\n\n"
                f"Someone requested a password reset for your NutriPredict account. "
                f"If this was you, click the link below within "
                f"{settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes:\n\n"
                f"{reset_link}\n\n"
                f"If you didn't request this, you can safely ignore this email."
            ),
        )

    return MessageResponse(message=_FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    token_hash = hash_reset_token(payload.token)
    reset_token = db.scalars(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    ).first()

    now = datetime.now(timezone.utc)
    if reset_token is None or reset_token.used_at is not None or reset_token.expires_at < now:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="This reset link is invalid or has expired")

    user = db.get(User, reset_token.user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="This reset link is invalid or has expired")

    user.hashed_password = hash_password(payload.new_password)
    reset_token.used_at = now
    db.commit()

    return MessageResponse(message="Your password has been reset. You can now log in.")


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """
    Change password for an already-authenticated user (Profile page). Uses
    the same hash_password/verify_password primitives as the forgot/reset
    flow, but requires the current password rather than an emailed token —
    the standard pattern for "change my password" when you're already
    logged in (GitHub, Google, etc. all work this way): proving you know
    the current password is a reasonable bar, and emailing yourself a link
    while already authenticated would just be extra friction with no real
    security benefit here.
    """
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return MessageResponse(message="Your password has been changed.")
