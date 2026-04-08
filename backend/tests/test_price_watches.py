from fastapi.testclient import TestClient


def test_price_watch_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post(
        "/api/me/price-watches",
        json={
            "product_id": "product-1",
            "target_price": 4299.0,
            "notify_on_price_drop": True,
            "notify_on_new_best_offer": True,
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    created_watch = create_response.json()
    assert created_watch["product_id"] == "product-1"

    list_response = client.get("/api/me/price-watches", headers=auth_headers)
    assert list_response.status_code == 200
    items = list_response.json()
    assert len(items) == 1
    assert items[0]["alert_config"]["target_price"] == 4299.0

    update_response = client.patch(
        f"/api/me/price-watches/{created_watch['id']}",
        json={"is_active": False},
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["is_active"] is False
