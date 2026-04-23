from datetime import datetime, timezone
from decimal import Decimal
from io import BytesIO
from urllib.error import HTTPError

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ExternalServiceError
from app.integrations.catalog.mercado_livre_provider import MercadoLivreCatalogProvider
from app.integrations.catalog.types import (
    CatalogOfferPayload,
    CatalogProductPayload,
    CatalogSearchItem,
    CatalogSearchResult,
)
from app.models.offer import Offer
from app.models.product import Product
from app.services.mercado_livre_catalog_sync_service import MercadoLivreCatalogSyncService
from tests.factories import build_user


class _FakeMercadoLivreProvider:
    provider_name = "mercado-livre-catalog"

    def search_products(self, *, query: str, limit: int = 10, access_token: str | None = None) -> CatalogSearchResult:
        _ = access_token
        return CatalogSearchResult(
            provider=self.provider_name,
            query=query,
            items=[
                CatalogSearchItem(
                    marketplace="mercado-livre",
                    external_id="MLB999999",
                    title="Galaxy S24 256 GB",
                    category_id="MLB1055",
                    thumbnail_url="https://http2.mlstatic.com/test.jpg",
                    canonical_url="https://www.mercadolivre.com.br/p/MLB999999",
                    brand="Samsung",
                    condition="new",
                    currency_id="BRL",
                    price=Decimal("3499.00"),
                    original_price=Decimal("3999.00"),
                )
            ],
        )

    def fetch_product_details(
        self,
        *,
        external_id: str | None = None,
        product_url: str | None = None,
        access_token: str | None = None,
    ) -> CatalogProductPayload:
        _ = access_token
        reference = external_id or "MLB999999"
        now = datetime.now(timezone.utc)
        return CatalogProductPayload(
            marketplace="mercado-livre",
            external_id=reference,
            title="Galaxy S24 256 GB",
            category_id="MLB1055",
            category_name="Celulares",
            thumbnail_url="https://http2.mlstatic.com/test.jpg",
            canonical_url=f"https://www.mercadolivre.com.br/p/{reference}",
            brand="Samsung",
            condition="new",
            currency_id="BRL",
            description="Produto sincronizado de teste",
            is_active=True,
            last_synced_at=now,
            offers=[
                CatalogOfferPayload(
                    marketplace="mercado-livre",
                    external_id=reference,
                    seller_id="12345",
                    seller_name="Samsung Oficial",
                    title="Galaxy S24 256 GB",
                    price=Decimal("3499.00"),
                    original_price=Decimal("3999.00"),
                    product_url=f"https://www.mercadolivre.com.br/p/{reference}",
                    available_quantity=10,
                    status="active",
                    condition="new",
                    currency_id="BRL",
                    is_active=True,
                    fetched_at=now,
                )
            ],
        )


def test_mercado_livre_catalog_sync_persists_product_and_offer(db_session: Session) -> None:
    previous_provider = MercadoLivreCatalogSyncService.provider
    MercadoLivreCatalogSyncService.provider = _FakeMercadoLivreProvider()
    try:
        result = MercadoLivreCatalogSyncService.sync_product_by_external_id(db_session, external_id="MLB999999")
    finally:
        MercadoLivreCatalogSyncService.provider = previous_provider

    product = db_session.scalar(
        select(Product).where(Product.marketplace == "mercado-livre", Product.external_id == "MLB999999")
    )
    offer = db_session.scalar(select(Offer).where(Offer.external_offer_id == "MLB999999"))

    assert result["provider"] == "mercado-livre-catalog"
    assert result["product_status"] == "created"
    assert product is not None
    assert product.name == "Galaxy S24 256 GB"
    assert product.title == "Galaxy S24 256 GB"
    assert product.category_id == "MLB1055"
    assert product.canonical_url == "https://www.mercadolivre.com.br/p/MLB999999"
    assert offer is not None
    assert offer.marketplace == "mercado-livre"
    assert offer.product_url == "https://www.mercadolivre.com.br/p/MLB999999"
    assert offer.available_quantity == 10
    assert offer.affiliate_url == "https://www.mercadolivre.com.br/p/MLB999999"


def test_admin_mercado_livre_search_requires_admin(client: TestClient) -> None:
    response = client.get("/api/admin/catalog/mercado-livre/search?q=iphone&limit=1")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_admin_mercado_livre_search_uses_stable_admin_route(
    client: TestClient,
    db_session: Session,
) -> None:
    db_session.add(
        build_user(
            id="admin-1",
            name="Admin",
            email="admin@linkshop.dev",
            password="123456",
            role="admin",
        )
    )
    db_session.commit()

    login_response = client.post(
        "/api/auth/login",
        json={"email": "admin@linkshop.dev", "password": "123456"},
    )
    token = login_response.json()["access_token"]

    previous_provider = MercadoLivreCatalogSyncService.provider
    MercadoLivreCatalogSyncService.provider = _FakeMercadoLivreProvider()
    try:
        response = client.get(
            "/api/admin/catalog/mercado-livre/search?q=galaxy&limit=1",
            headers={"Authorization": f"Bearer {token}"},
        )
    finally:
        MercadoLivreCatalogSyncService.provider = previous_provider

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "mercado-livre-catalog"
    assert payload["query"] == "galaxy"
    assert payload["items"][0]["external_id"] == "MLB999999"


def test_mercado_livre_provider_http_error_becomes_structured_external_error(
    monkeypatch,
) -> None:
    def raise_http_error(*args, **kwargs):
        raise HTTPError(
            url="https://api.mercadolibre.com/sites/MLB/search",
            code=403,
            msg="Forbidden",
            hdrs=None,
            fp=BytesIO(b'{"message":"forbidden"}'),
        )

    monkeypatch.setattr("app.integrations.catalog.mercado_livre_provider.urlopen", raise_http_error)

    provider = MercadoLivreCatalogProvider()

    try:
        provider.search_products(query="iphone", limit=1)
    except ExternalServiceError as exc:
        assert exc.code == "MERCADO_LIVRE_HTTP_ERROR"
        assert exc.status_code == 502
        assert "HTTP 403" in exc.message
    else:
        raise AssertionError("Expected ExternalServiceError")
