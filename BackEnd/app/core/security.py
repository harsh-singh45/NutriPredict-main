"""
JWT helpers for issuing/verifying session tokens, password hashing for the
real signup/login flow, and password-reset token helpers. Uses `bcrypt`
directly rather than passlib — one less dependency, and avoids a
well-known passlib/bcrypt version compatibility issue.
"""
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> uuid.UUID | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        # Malformed hash (e.g. empty string) — treat as "does not match"
        # rather than raising, so a bad stored value can't crash login.
        return False


def generate_reset_token() -> str:
    """A high-entropy, URL-safe token to email to the user. Not stored
    directly — see hash_reset_token()."""
    return secrets.token_urlsafe(32)


def generate_otp_code() -> str:
    """A 6-digit numeric code, zero-padded (e.g. '004821'), for the user to
    type in by hand during signup verification."""
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_reset_token(token: str) -> str:
    """
    Plain SHA-256, not bcrypt, and deliberately so: this token is already
    high-entropy random data (not a user-chosen password), so it doesn't
    need bcrypt's slow, salted hashing — and unlike a password hash, we
    need to look this up by exact value in the database (`WHERE token_hash
    = ...`), which requires a deterministic hash.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

