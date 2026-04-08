from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.click_event import ClickEvent


def test_redirect_tracks_click_and_redirects(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
) -> None:
    response = client.get(
        "/api/redirect/offer-1?source=product-page",
        headers={
            **auth_headers,
            "referer": "http://localhost:3000/ofertas/iphone-15-128gb",
            "user-agent": "pytest",
        },
        follow_redirects=False,
    )

    assert response.status_code == 307
    assert response.headers["location"] == "https://www.amazon.com.br/"

    events = list(db_session.scalars(select(ClickEvent)).all())
    assert len(events) == 1
    assert events[0].offer_id == "offer-1"
    assert events[0].product_id == "product-1"
    assert events[0].store_id == "store-amazon"
    assert events[0].source == "product-page"
