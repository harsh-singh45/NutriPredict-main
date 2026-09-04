import html
import re
import requests

from app.services.email.base import BaseEmailSender


class ElasticEmailSender(BaseEmailSender):
    API_URL = "https://api.elasticemail.com/v4/emails/transactional"

    def __init__(self) -> None:
        from app.core.config import settings

        self.api_key = settings.ELASTIC_EMAIL_API_KEY
        self.from_address = settings.EMAIL_FROM_ADDRESS

    def send(self, *, to: str, subject: str, body: str) -> None:
        html_body = html.escape(body).replace("\n", "<br>")

        url_pattern = r"(https?://[^\s<]+)"

        html_body = re.sub(
            url_pattern,
            r'<a href="\1">\1</a>',
            html_body,
        )

        payload = {
            "Recipients": {
                "To": [to]
            },
            "Content": {
                "Body": [
                    {
                        "ContentType": "HTML",
                        "Charset": "utf-8",
                        "Content": html_body,
                    },
                    {
                        "ContentType": "PlainText",
                        "Charset": "utf-8",
                        "Content": body,
                    },
                ],
                "From": self.from_address,
                "Subject": subject,
            },
        }

        response = requests.post(
            self.API_URL,
            headers={
                "X-ElasticEmail-ApiKey": self.api_key,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30,
        )

        if not response.ok:
            print("Elastic Email status:", response.status_code)
            print("Elastic Email response:", response.text)

        response.raise_for_status()