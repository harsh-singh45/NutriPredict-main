import logging

from app.services.email.base import BaseEmailSender

logger = logging.getLogger("nutripredict.email")


class ConsoleEmailSender(BaseEmailSender):
    """
    Development default: logs the email instead of delivering it, and keeps
    a copy in `sent_emails` (class-level, so it survives across instances)
    so tests can assert on what would have been sent — see
    tests/test_password_reset.py for how the reset-token flow is verified
    end-to-end without any real email infrastructure.
    """

    sent_emails: list[dict] = []

    def send(self, *, to: str, subject: str, body: str) -> None:
        message = {"to": to, "subject": subject, "body": body}
        ConsoleEmailSender.sent_emails.append(message)
        logger.info("=== EMAIL (console backend, not actually sent) ===")
        logger.info("To: %s", to)
        logger.info("Subject: %s", subject)
        logger.info("%s", body)
        logger.info("=== END EMAIL ===")
