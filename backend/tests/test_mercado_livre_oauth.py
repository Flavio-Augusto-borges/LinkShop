from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.mercado_livre_oauth_service import MercadoLivreOAuthService
from tests.factories import build_user


def test_admin_mercado_livre_oauth_status_requires_admin(client: TestClient) -> None:
    response = client.get("/api/admin/integrations/mercado-livre/oauth/status")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_admin_mercado_livre_oauth_authorize_returns_url(client: TestClient, db_session: Session) -> None:
    db_session.add(
        build_user(
            id="admin-ml-oauth",
            name="Admin",
            email="admin.oauth@linkshop.dev",
            password="123456",
            role="admin",
        )
    )
    db_session.commit()

    original_app_id = settings.mercado_livre_app_id
    original_client_secret = settings.mercado_livre_client_secret
    original_redirect_uri = settings.mercado_livre_redirect_uri
    original_scope = settings.mercado_livre_oauth_scope
    try:
        settings.mercado_livre_app_id = "123456"
        settings.mercado_livre_client_secret = SecretStr("secret-abc")
        settings.mercado_livre_redirect_uri = "https://linkshop-backend.onrender.com/api/integrations/mercado-livre/callback"
        settings.mercado_livre_oauth_scope = ""

        login_response = client.post(
            "/api/auth/login",
            json={"email": "admin.oauth@linkshop.dev", "password": "123456"},
        )
        token = login_response.json()["access_token"]

        response = client.get(
            "/api/admin/integrations/mercado-livre/oauth/authorize",
            headers={"Authorization": f"Bearer {token}"},
        )
    finally:
        settings.mercado_livre_app_id = original_app_id
        settings.mercado_livre_client_secret = original_client_secret
        settings.mercado_livre_redirect_uri = original_redirect_uri
        settings.mercado_livre_oauth_scope = original_scope

    assert response.status_code == 200
    payload = response.json()
    parsed = urlparse(payload["authorization_url"])
    query = parse_qs(parsed.query)

    assert payload["provider"] == "mercado-livre"
    assert payload["redirect_uri"] == "https://linkshop-backend.onrender.com/api/integrations/mercado-livre/callback"
    assert query["client_id"] == ["123456"]
    assert query["redirect_uri"] == ["https://linkshop-backend.onrender.com/api/integrations/mercado-livre/callback"]
    assert query["response_type"] == ["code"]
    assert "state" in query


def test_mercado_livre_callback_redirects_back_to_admin(client: TestClient, monkeypatch) -> None:
    original_frontend_url = settings.frontend_app_url
    settings.frontend_app_url = "http://127.0.0.1:3000"

    def fake_handle_callback(db, *, code: str, state: str):
        _ = db
        assert code == "code-123"
        assert state == "signed-state"
        return SimpleNamespace(provider="mercado-livre")

    monkeypatch.setattr(MercadoLivreOAuthService, "handle_callback", fake_handle_callback)

    try:
        response = client.get(
            "/api/integrations/mercado-livre/callback?code=code-123&state=signed-state",
            follow_redirects=False,
        )
    finally:
        settings.frontend_app_url = original_frontend_url

    assert response.status_code == 302
    assert response.headers["location"] == "http://127.0.0.1:3000/admin/integracoes/mercado-livre?oauth=connected"
