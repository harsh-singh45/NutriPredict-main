import os

# Point at a dedicated test database BEFORE importing the app, since
# app.core.config reads DATABASE_URL at import time.
os.environ.setdefault(
    "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/nutripredict_test"
)
os.environ.setdefault("JWT_SECRET", "test-secret")

import re

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.services.email.console_sender import ConsoleEmailSender

_engine = create_engine(os.environ["DATABASE_URL"], future=True)
_TestSessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False, future=True)


@pytest.fixture(scope="session", autouse=True)
def _create_test_schema():
    Base.metadata.create_all(_engine)
    yield
    Base.metadata.drop_all(_engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    """Truncate all tables and clear captured emails between tests so they stay isolated."""
    ConsoleEmailSender.sent_emails.clear()
    yield
    with _engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    ConsoleEmailSender.sent_emails.clear()


@pytest.fixture
def db_session():
    session = _TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    def _override_get_db():
        session = _TestSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_profile() -> dict:
    return {
        "age": 29,
        "gender": "Male",
        "height": 175,
        "weight": 78,
        "disease_type": "None",
        "severity": "None",
        "physical_activity_level": "Moderate",
        "weekly_exercise_hours": 4,
        "daily_caloric_intake": 2200,
        "cholesterol_mg_dl": 180,
        "blood_pressure_mmhg": 120,
        "glucose_mg_dl": 90,
        "dietary_restrictions": "None",
        "allergies": [],
        "preferred_cuisine": "Indian",
        "adherence_to_diet_plan": 75,
        "dietary_nutrient_imbalance_score": 25,
    }


def _extract_otp_for(email: str) -> str:
    """
    Pulls the most recent 6-digit verification code emailed to `email` out
    of the console email sender's captured output — the same trick
    test_password_reset.py uses to get the reset token, applied to OTPs.
    """
    for sent in reversed(ConsoleEmailSender.sent_emails):
        if sent["to"] == email and "verification code" in sent["body"]:
            match = re.search(r"\b(\d{6})\b", sent["body"])
            if match:
                return match.group(1)
    raise AssertionError(f"No verification code email found for {email}")


def signup_and_verify(client, name: str, email: str, password: str) -> dict:
    """
    Full signup -> extract OTP -> verify flow, returning the TokenResponse
    body (access_token + user). Use this in any test that needs a working,
    logged-in account — plain POST /auth/signup alone no longer returns a
    usable session, since new accounts start unverified.
    """
    signup_resp = client.post(
        "/api/v1/auth/signup", json={"name": name, "email": email, "password": password}
    )
    assert signup_resp.status_code == 201, signup_resp.text

    otp = _extract_otp_for(email)
    verify_resp = client.post("/api/v1/auth/verify-email", json={"email": email, "code": otp})
    assert verify_resp.status_code == 200, verify_resp.text
    return verify_resp.json()


@pytest.fixture
def auth_headers(client):
    data = signup_and_verify(client, "Test User", "test@example.com", "correct-horse-1")
    return {"Authorization": f"Bearer {data['access_token']}"}
