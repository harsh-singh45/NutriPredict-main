from tests.conftest import signup_and_verify


def test_signup_creates_unverified_account_without_a_token(client):
    resp = client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex Rivera", "email": "alex@example.com", "password": "supersecret1"},
    )
    assert resp.status_code == 201

    body = resp.json()
    assert body == {
        "message": "Account created. Check your email for a 6-digit verification code.",
        "email": "alex@example.com",
    }
    assert "access_token" not in body


def test_signup_rejects_duplicate_email(client):
    payload = {"name": "Alex", "email": "alex@example.com", "password": "supersecret1"}
    first = client.post("/api/v1/auth/signup", json=payload)
    second = client.post("/api/v1/auth/signup", json={**payload, "name": "Someone Else"})

    assert first.status_code == 201
    assert second.status_code == 409


def test_signup_rejects_short_password(client):
    resp = client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex", "email": "alex@example.com", "password": "short"},
    )
    assert resp.status_code == 422


def test_signup_rejects_invalid_email(client):
    resp = client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex", "email": "not-an-email", "password": "supersecret1"},
    )
    assert resp.status_code == 422


def test_signup_rejects_missing_name(client):
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": "alex@example.com", "password": "supersecret1"},
    )
    assert resp.status_code == 422


def test_login_blocked_before_verification(client):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex", "email": "alex@example.com", "password": "supersecret1"},
    )
    resp = client.post(
        "/api/v1/auth/login", json={"email": "alex@example.com", "password": "supersecret1"}
    )
    assert resp.status_code == 403


def test_login_succeeds_after_verification(client):
    data = signup_and_verify(client, "Alex", "alex@example.com", "supersecret1")
    assert data["user"]["email"] == "alex@example.com"
    assert data["user"]["is_verified"] is True

    resp = client.post(
        "/api/v1/auth/login", json={"email": "alex@example.com", "password": "supersecret1"}
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_rejects_wrong_password_even_if_unverified(client):
    """Wrong password should read as 401, not 403 — don't let a failed
    password guess also confirm whether an account is verified."""
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Alex", "email": "alex@example.com", "password": "supersecret1"},
    )
    resp = client.post(
        "/api/v1/auth/login", json={"email": "alex@example.com", "password": "wrong-password"}
    )
    assert resp.status_code == 401


def test_login_rejects_unknown_email(client):
    resp = client.post(
        "/api/v1/auth/login", json={"email": "nobody@example.com", "password": "whatever123"}
    )
    assert resp.status_code == 401


def test_token_grants_access_to_protected_route(client, auth_headers):
    resp = client.get("/api/v1/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


def test_protected_route_without_token_is_rejected(client):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 401


def test_protected_route_with_garbage_token_is_rejected(client):
    resp = client.get("/api/v1/users/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401
