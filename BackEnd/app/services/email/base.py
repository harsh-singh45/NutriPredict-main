"""
Small plug-in seam for sending email, same idea as
app/services/prediction_engine/. Nothing in this codebase can actually send
real email yet (no SMTP/SendGrid/SES credentials configured) — the default
ConsoleEmailSender just logs what would have been sent, which is enough to
develop and test the password-reset flow end-to-end. Swap in a real sender
via EMAIL_BACKEND once you have a provider.
"""
from abc import ABC, abstractmethod


class BaseEmailSender(ABC):
    @abstractmethod
    def send(self, *, to: str, subject: str, body: str) -> None:
        """Send a plain-text email. Raise on failure; callers don't catch
        exceptions from this, so a broken email backend surfaces loudly
        instead of silently failing to deliver a password reset."""
        raise NotImplementedError
