from fastapi.testclient import TestClient

from tests.helpers import login_and_get_session


def test_register_and_me_flow(client: TestClient) -> None:
    register_response = client.post(
        "/api/auth/register",
        json={"name": "Nova Pessoa", "email": "nova@linkshop.dev", "password": "123456"},
    )

    assert register_response.status_code == 201
    payload = register_response.json()
    assert payload["token_type"] == "bearer"
    assert payload["user"]["email"] == "nova@linkshop.dev"

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {payload['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == "nova@linkshop.dev"


def test_login_refresh_and_logout_flow(client: TestClient) -> None:
    session = login_and_get_session(client)

    assert session["refresh_token"]
    assert session["access_expires_at"]
    assert session["refresh_expires_at"]

    refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": session["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    refreshed = refresh_response.json()
    assert refreshed["access_token"] != session["access_token"]
    assert refreshed["refresh_token"] != session["refresh_token"]

    logout_response = client.post(
        "/api/auth/logout",
        json={"refresh_token": refreshed["refresh_token"]},
        headers={"Authorization": f"Bearer {refreshed['access_token']}"},
    )
    assert logout_response.status_code == 204

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {refreshed['access_token']}"},
    )
    assert me_response.status_code == 401

    second_refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refreshed["refresh_token"]},
    )
    assert second_refresh_response.status_code == 401
