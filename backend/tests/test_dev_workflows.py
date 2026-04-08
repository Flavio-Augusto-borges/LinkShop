from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.alert_event import AlertEvent
from app.models.integration_sync_run import IntegrationSyncRun
from app.models.price_history import PriceHistory


def test_offer_sync_trigger_creates_history(client: TestClient, db_session: Session) -> None:
    before_history = db_session.scalar(select(func.count(PriceHistory.id))) or 0

    response = client.post("/api/dev/sync/offers?provider=mock-marketplace")

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "mock-marketplace"
    assert payload["processed"] == 4
    assert payload["history_created"] >= 4

    after_history = db_session.scalar(select(func.count(PriceHistory.id))) or 0
    assert after_history > before_history

    latest_run = db_session.scalar(select(IntegrationSyncRun).order_by(IntegrationSyncRun.started_at.desc()))
    assert latest_run is not None
    assert latest_run.provider == "mock-marketplace"
    assert latest_run.history_created >= 4


def test_json_feed_sync_trigger_and_latest_run_endpoint(client: TestClient, db_session: Session) -> None:
    response = client.post("/api/dev/sync/offers?provider=json-feed")

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "json-feed"
    assert payload["processed"] == 2
    assert payload["status"] in {"success", "partial_success"}
    assert payload["source_reference"]

    latest_response = client.get("/api/admin/integrations/sync-runs/latest")
    assert latest_response.status_code == 200
    latest_payload = latest_response.json()
    assert latest_payload["provider"] == "json-feed"
    assert latest_payload["processed"] == 2

    runs_response = client.get("/api/admin/integrations/sync-runs?page=1&pageSize=10")
    assert runs_response.status_code == 200
    assert runs_response.json()["meta"]["total"] >= 1


def test_alert_evaluation_trigger_creates_events(
    client: TestClient,
    db_session: Session,
    create_price_watch,
) -> None:
    create_price_watch(
        id="watch-alert-1",
        product_id="product-1",
        last_known_price="4599.00",
        last_best_offer_id="offer-2",
        target_price="4400.00",
        notify_on_price_drop=True,
        notify_on_new_best_offer=True,
    )

    response = client.post("/api/dev/evaluate-alerts")

    assert response.status_code == 200
    payload = response.json()
    assert payload["evaluated"] >= 1
    assert payload["triggered"] >= 1
    assert len(payload["events"]) >= 1

    total_events = db_session.scalar(select(func.count(AlertEvent.id))) or 0
    assert total_events >= 1


def test_admin_analytics_endpoints_expose_data(
    client: TestClient,
    auth_headers: dict[str, str],
    create_price_watch,
) -> None:
    client.get("/api/redirect/offer-1?source=search", headers=auth_headers, follow_redirects=False)
    create_price_watch(
        id="watch-analytics-1",
        product_id="product-1",
        last_known_price="4599.00",
        last_best_offer_id="offer-2",
        target_price="4400.00",
        notify_on_price_drop=True,
        notify_on_new_best_offer=True,
    )
    client.post("/api/dev/evaluate-alerts")

    clicks_response = client.get("/api/admin/analytics/clicks?periodDays=30")
    alerts_response = client.get("/api/admin/analytics/alerts?periodDays=30")
    click_events_response = client.get("/api/admin/analytics/click-events?page=1&pageSize=10")
    alert_events_response = client.get("/api/admin/analytics/alert-events?page=1&pageSize=10")

    assert clicks_response.status_code == 200
    assert alerts_response.status_code == 200
    assert click_events_response.status_code == 200
    assert alert_events_response.status_code == 200

    assert clicks_response.json()["total_clicks"] >= 1
    assert alerts_response.json()["total_alerts"] >= 1
    assert click_events_response.json()["meta"]["total"] >= 1
    assert alert_events_response.json()["meta"]["total"] >= 1


def test_admin_operations_summary_exposes_runtime_and_persistent_metrics(
    client: TestClient,
    auth_headers: dict[str, str],
    create_price_watch,
) -> None:
    client.post("/api/auth/login", json={"email": "user@linkshop.dev", "password": "123456"})
    client.get("/api/redirect/offer-1?source=search", headers=auth_headers, follow_redirects=False)
    client.post(
        "/api/sync/anonymous",
        json={
            "anonymous_session_id": "anon-1",
            "favorites": [{"product_id": "product-1"}],
            "compare_list": [{"product_id": "product-1", "offer_id": "offer-1", "quantity": 1}],
            "price_watches": [],
        },
        headers=auth_headers,
    )
    create_price_watch(
        id="watch-ops-1",
        product_id="product-1",
        last_known_price="4599.00",
        last_best_offer_id="offer-2",
        target_price="4400.00",
        notify_on_price_drop=True,
        notify_on_new_best_offer=True,
    )
    client.post("/api/dev/evaluate-alerts")

    response = client.get("/api/admin/operations/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["runtime"]["requests"]["api"] >= 1
    assert payload["runtime"]["flows"]["auth.login"]["metrics"]["successes"] >= 1
    assert payload["runtime"]["flows"]["redirect.tracking"]["metrics"]["clicks_registered"] >= 1
    assert payload["runtime"]["flows"]["sync.anonymous"]["metrics"]["successes"] >= 1
    assert payload["runtime"]["flows"]["alerts.evaluate"]["metrics"]["watches_evaluated"] >= 1
    assert payload["persistent"]["total_click_events"] >= 1
