from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.factories import build_offer


def test_health_and_readiness(client: TestClient) -> None:
    health = client.get("/health")
    ready = client.get("/health/ready")

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert "X-Request-ID" in health.headers
    assert ready.status_code == 200
    assert ready.json()["status"] == "ready"
    assert ready.json()["checks"]["database"] == "ok"
    assert ready.json()["checks"]["config"] == "ok"
    assert ready.json()["checks"]["integrations"] == "ok"
    assert ready.json()["meta"]["registered_integrations"] >= 1


def test_products_list_is_paginated(client: TestClient) -> None:
    response = client.get("/api/products?page=1&pageSize=1")

    assert response.status_code == 200
    payload = response.json()
    assert "data" in payload
    assert "meta" in payload
    assert payload["meta"]["page"] == 1
    assert payload["meta"]["page_size"] == 1
    assert payload["meta"]["total"] == 2
    assert len(payload["data"]) == 1
    assert payload["data"][0]["slug"] == "iphone-15-128gb"


def test_offers_ranking_prefers_quality_not_only_lowest_price(client: TestClient, db_session: Session) -> None:
    db_session.add(
        build_offer(
            id="offer-low-price-out-stock",
            product_id="product-1",
            store_id="store-shopee",
            external_offer_id="offer-low-price-out-stock-ext",
            title="Oferta barata, sem estoque",
            seller_name="Shopee Parceiro",
            affiliate_url="https://shopee.com.br/",
            landing_url="https://shopee.com.br/",
            price="4099.00",
            original_price="4299.00",
            shipping_cost="19.90",
            availability="out_of_stock",
            is_featured=False,
        )
    )
    db_session.commit()

    response = client.get("/api/offers?productId=product-1")
    assert response.status_code == 200

    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["id"] == "offer-1"
    assert payload[0]["ranking_score"] is not None
    assert payload[0]["ranking_reason"]
    assert all(offer["availability"] != "out_of_stock" for offer in payload)


def test_catalog_search_hides_products_without_publicly_available_offers(client: TestClient, db_session: Session) -> None:
    db_session.add(
        build_offer(
            id="offer-product-iphone-15-128-out-stock",
            product_id="product-iphone-15-128",
            store_id="store-mercado-livre",
            external_offer_id="offer-product-iphone-15-128-out-stock-ext",
            title="Apple iPhone 15 128GB sem estoque",
            seller_name="Mercado Livre",
            affiliate_url="https://www.mercadolivre.com.br/",
            landing_url="https://www.mercadolivre.com.br/",
            price="3999.00",
            original_price="4299.00",
            availability="out_of_stock",
            is_featured=True,
        )
    )
    db_session.commit()

    response = client.get("/api/products/search?q=iphone")

    assert response.status_code == 200
    payload = response.json()
    slugs = [item["product"]["slug"] for item in payload["items"]]

    assert "iphone-15-128gb" in slugs
    assert "apple-iphone-15-128gb" not in slugs


def test_admin_ranking_preview_endpoint(client: TestClient) -> None:
    response = client.get("/api/admin/ranking/products/product-1")
    assert response.status_code == 200

    payload = response.json()
    assert payload["product_id"] == "product-1"
    assert payload["offers_count"] >= 1
    assert payload["best_offer_id"] is not None
    assert payload["best_offer_score"] is not None
    assert len(payload["offers"]) >= 1
