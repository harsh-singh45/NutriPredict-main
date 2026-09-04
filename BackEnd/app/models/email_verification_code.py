import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmailVerificationCode(Base):
    """
    One row per issued signup OTP. Like PasswordResetToken, we store a
    hash of the code, never the code itself. Unlike the reset token (a
    long random string embedded in a URL), this is a short 6-digit code a
    user types by hand — small enough that it's brute-forceable if someone
    could try unlimited guesses, which is exactly what `attempts` guards
    against: once it hits MAX_ATTEMPTS (see routers/auth.py), the code is
    dead and the user has to request a new one.
    """

    __tablename__ = "email_verification_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
