from fastapi.testclient import TestClient


def login_and_get_session(
    client: TestClient,
    *,
    email: str = "user@linkshop.dev",
    password: str = "123456",
) -> dict:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    response.raise_for_status()
    return response.json()


def login_and_get_token(
    client: TestClient,
    *,
    email: str = "user@linkshop.dev",
    password: str = "123456",
) -> str:
    return login_and_get_session(client, email=email, password=password)["access_token"]


def build_auth_headers(
    client: TestClient,
    *,
    email: str = "user@linkshop.dev",
    password: str = "123456",
) -> dict[str, str]:
    token = login_and_get_token(client, email=email, password=password)
    return {"Authorization": f"Bearer {token}"}
