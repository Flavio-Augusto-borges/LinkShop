from fastapi.testclient import TestClient


def test_sync_anonymous_state_merges_user_data(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/sync/anonymous",
        json={
            "anonymous_session_id": "anon-session-1",
            "favorites": [
                {"product_id": "product-2"},
                {"product_id": "product-2"},
            ],
            "compare_list": [
                {"product_id": "product-2", "offer_id": "offer-2", "quantity": 2},
            ],
            "price_watches": [
                {
                    "product_id": "product-2",
                    "is_active": True,
                    "last_known_price": 3699.0,
                    "target_price": 3499.0,
                    "notify_on_price_drop": True,
                    "notify_on_new_best_offer": True,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["favorites"]) == 1
    assert payload["favorites"][0]["product_id"] == "product-2"
    assert len(payload["compare_list"]) == 1
    assert payload["compare_list"][0]["product_id"] == "product-2"
    assert payload["compare_list"][0]["quantity"] == 2
    assert len(payload["price_watches"]) == 1
    assert payload["price_watches"][0]["product_id"] == "product-2"
