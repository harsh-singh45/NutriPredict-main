import re
from datetime import datetime, timedelta, timezone

import pytest

from app.core.security import hash_reset_token
from app.models.password_reset_token import PasswordResetToken
from app.services.email.console_sender import ConsoleEmailSender
from tests.conftest import signup_and_verify


@pytest.fixture(autouse=True)
def _clear_sent_emails():
    ConsoleEmailSender.sent_emails.clear()
    yield
    ConsoleEmailSender.sent_emails.clear()


def _extract_token_from_last_email():
    assert ConsoleEmailSender.sent_emails, "No email was sent"
    body = ConsoleEmailSender.sent_emails[-1]["body"]
    match = re.search(r"token=([\w\-]+)", body)
    assert match, f"No reset token found in email body: {body}"
    return match.group(1)


def test_forgot_password_returns_generic_message_for_unknown_email(client):
    resp = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
    assert resp.status_code == 200
    assert "sent instructions" in resp.json()["message"]
    # No account exists, so nothing should actually be emailed.
    assert ConsoleEmailSender.sent_emails == []


def test_forgot_password_returns_same_message_for_known_email(client):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex", "email": "alex@example.com", "password": "supersecret1"},
    )
    unknown = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
    known = client.post("/api/v1/auth/forgot-password", json={"email": "alex@example.com"})

    # Identical response either way — the whole point is not leaking which emails are registered.
    assert unknown.json() == known.json()


def test_forgot_password_sends_email_for_known_user(client):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex", "email": "alex@example.com", "password": "supersecret1"},
    )
    ConsoleEmailSender.sent_emails.clear()  # discard the signup verification email

    resp = client.post("/api/v1/auth/forgot-password", json={"email": "alex@example.com"})

    assert resp.status_code == 200
    assert len(ConsoleEmailSender.sent_emails) == 1
    assert ConsoleEmailSender.sent_emails[0]["to"] == "alex@example.com"
    assert "reset" in ConsoleEmailSender.sent_emails[0]["subject"].lower()


def test_full_reset_flow_changes_password(client):
    signup_and_verify(client, "Alex", "alex@example.com", "original-pw1")
    client.post("/api/v1/auth/forgot-password", json={"email": "alex@example.com"})
    token = _extract_token_from_last_email()

    reset_resp = client.post(
        "/api/v1/auth/reset-password", json={"token": token, "new_password": "new-password-1"}
    )
    assert reset_resp.status_code == 200

    old_login = client.post(
        "/api/v1/auth/login", json={"email": "alex@example.com", "password": "original-pw1"}
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/v1/auth/login", json={"email": "alex@example.com", "password": "new-password-1"}
    )
    assert new_login.status_code == 200


def test_reset_token_can_only_be_used_once(client):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex", "email": "alex@example.com", "password": "original-pw1"},
    )
    client.post("/api/v1/auth/forgot-password", json={"email": "alex@example.com"})
    token = _extract_token_from_last_email()

    first = client.post(
        "/api/v1/auth/reset-password", json={"token": token, "new_password": "new-password-1"}
    )
    assert first.status_code == 200

    second = client.post(
        "/api/v1/auth/reset-password", json={"token": token, "new_password": "another-password-2"}
    )
    assert second.status_code == 400


def test_reset_rejects_garbage_token(client):
    resp = client.post(
        "/api/v1/auth/reset-password", json={"token": "not-a-real-token", "new_password": "whatever123"}
    )
    assert resp.status_code == 400


def test_reset_rejects_short_new_password(client):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex", "email": "alex@example.com", "password": "original-pw1"},
    )
    client.post("/api/v1/auth/forgot-password", json={"email": "alex@example.com"})
    token = _extract_token_from_last_email()

    resp = client.post("/api/v1/auth/reset-password", json={"token": token, "new_password": "short"})
    assert resp.status_code == 422


def test_reset_rejects_expired_token(client, db_session):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex", "email": "alex@example.com", "password": "original-pw1"},
    )
    client.post("/api/v1/auth/forgot-password", json={"email": "alex@example.com"})
    token = _extract_token_from_last_email()

    record = (
        db_session.query(PasswordResetToken)
        .filter_by(token_hash=hash_reset_token(token))
        .first()
    )
    record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/reset-password", json={"token": token, "new_password": "new-password-1"}
    )
    assert resp.status_code == 400
