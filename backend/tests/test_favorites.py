from fastapi.testclient import TestClient


def test_favorites_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post(
        "/api/me/favorites",
        json={"product_id": "product-1"},
        headers=auth_headers,
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/me/favorites", headers=auth_headers)
    assert list_response.status_code == 200
    items = list_response.json()
    assert len(items) == 1
    assert items[0]["product_id"] == "product-1"

    delete_response = client.delete("/api/me/favorites/product-1", headers=auth_headers)
    assert delete_response.status_code == 204
