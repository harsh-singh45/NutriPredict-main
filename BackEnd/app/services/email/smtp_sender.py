"""
>>> FILL THIS IN WHEN A REAL EMAIL PROVIDER IS CHOSEN. <<<

Template for sending real email over SMTP (works with Gmail SMTP, SES SMTP
interface, Mailgun SMTP, Postmark SMTP, etc. — anything that speaks SMTP).
If using a provider's HTTP API instead (SendGrid, Resend, etc.), write a
sibling class following the same BaseEmailSender interface instead of this
one; the shape doesn't matter, only that send() works.

Steps to activate:
  1. Fill in the SMTP settings below (host/port/credentials), typically
     read from app.core.config.settings — add the fields there.
  2. Uncomment the registration in registry.py.
  3. Set EMAIL_BACKEND=smtp in .env.
"""
import smtplib
from email.mime.text import MIMEText

from app.services.email.base import BaseEmailSender


class SMTPEmailSender(BaseEmailSender):
    def __init__(self) -> None:
        from app.core.config import settings
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_address = settings.EMAIL_FROM_ADDRESS
        # raise NotImplementedError(
        #     "SMTPEmailSender is a template — fill in SMTP settings and "
        #     "remove this line once configured."
        # )

    def send(self, *, to: str, subject: str, body: str) -> None:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = self.from_address
        msg["To"] = to

        with smtplib.SMTP(self.host, self.port) as server:
            server.starttls()
            server.login(self.username, self.password)
            server.sendmail(self.from_address, [to], msg.as_string())
