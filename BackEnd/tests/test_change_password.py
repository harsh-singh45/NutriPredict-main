from tests.conftest import signup_and_verify


def test_change_password_requires_auth(client):
    resp = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "whatever", "new_password": "new-password-1"},
    )
    assert resp.status_code == 401


def test_change_password_succeeds_with_correct_current_password(client, auth_headers):
    resp = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "correct-horse-1", "new_password": "new-password-2"},
        headers=auth_headers,
    )
    assert resp.status_code == 200


def test_new_password_works_for_login_after_change(client, auth_headers):
    client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "correct-horse-1", "new_password": "new-password-2"},
        headers=auth_headers,
    )

    old_login = client.post(
        "/api/v1/auth/login", json={"email": "test@example.com", "password": "correct-horse-1"}
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/v1/auth/login", json={"email": "test@example.com", "password": "new-password-2"}
    )
    assert new_login.status_code == 200


def test_change_password_rejects_wrong_current_password(client, auth_headers):
    resp = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "totally-wrong", "new_password": "new-password-2"},
        headers=auth_headers,
    )
    assert resp.status_code == 401


def test_change_password_rejects_short_new_password(client, auth_headers):
    resp = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "correct-horse-1", "new_password": "short"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_change_password_does_not_affect_other_users(client, sample_profile):
    a = signup_and_verify(client, "A", "a@example.com", "password-a1")
    signup_and_verify(client, "B", "b@example.com", "password-b1")
    headers_a = {"Authorization": f"Bearer {a['access_token']}"}

    client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "password-a1", "new_password": "new-password-a2"},
        headers=headers_a,
    )

    b_login = client.post(
        "/api/v1/auth/login", json={"email": "b@example.com", "password": "password-b1"}
    )
    assert b_login.status_code == 200
