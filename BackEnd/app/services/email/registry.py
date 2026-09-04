from functools import lru_cache

from app.core.config import settings
from app.services.email.base import BaseEmailSender
from app.services.email.console_sender import ConsoleEmailSender

# Once SMTPEmailSender (or another real provider) is configured, uncomment:
from app.services.email.smtp_sender import SMTPEmailSender
from app.services.email.elastic_email_sender import ElasticEmailSender

_REGISTRY: dict[str, type[BaseEmailSender]] = {
    # "console": ConsoleEmailSender,
    # "smtp": SMTPEmailSender,
    "elastic": ElasticEmailSender,
}


@lru_cache
def get_email_sender() -> BaseEmailSender:
    sender_cls = _REGISTRY.get(settings.EMAIL_BACKEND)
    if sender_cls is None:
        available = ", ".join(sorted(_REGISTRY))
        raise ValueError(f"Unknown EMAIL_BACKEND={settings.EMAIL_BACKEND!r}. Available: {available}")
    return sender_cls()
