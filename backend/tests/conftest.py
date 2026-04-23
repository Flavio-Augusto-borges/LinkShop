from collections.abc import Generator
from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.observability import observability_registry
from app.db.base import Base
from app.main import app
from tests.factories import (
    build_alert_config,
    build_offer,
    build_price_history,
    build_price_watch,
    build_product,
    build_store,
    build_user,
)
from tests.helpers import build_auth_headers


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )

    @event.listens_for(engine, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record) -> None:
        _ = connection_record
        dbapi_connection.create_function("char_length", 1, lambda value: len(value or ""))

    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as session:
        session.add_all(
            [
                build_user(),
                build_store(
                    id="store-amazon",
                    code="amazon",
                    name="Amazon",
                    base_url="https://www.amazon.com.br/",
                ),
                build_store(
                    id="store-mercado-livre",
                    code="mercado-livre",
                    name="Mercado Livre",
                    base_url="https://www.mercadolivre.com.br/",
                ),
                build_store(
                    id="store-shopee",
                    code="shopee",
                    name="Shopee",
                    base_url="https://shopee.com.br/",
                ),
                build_product(
                    id="product-1",
                    slug="iphone-15-128gb",
                    name="Apple iPhone 15 128GB",
                    brand="Apple",
                    description="Smartphone premium",
                    thumbnail_url="https://example.com/iphone.jpg",
                    popularity_score=98,
                ),
                build_product(
                    id="product-2",
                    slug="galaxy-s24-256gb",
                    name="Samsung Galaxy S24 256GB",
                    brand="Samsung",
                    description="Smartphone Android premium",
                    thumbnail_url="https://example.com/galaxy.jpg",
                    popularity_score=92,
                ),
                build_product(
                    id="product-iphone-15-128",
                    slug="apple-iphone-15-128gb",
                    name="Apple iPhone 15 128GB",
                    brand="Apple",
                    description="Produto compativel com provider mock",
                    thumbnail_url="https://example.com/iphone-provider.jpg",
                    popularity_score=96,
                ),
                build_product(
                    id="product-galaxy-s24-256",
                    slug="samsung-galaxy-s24-256gb",
                    name="Samsung Galaxy S24 256GB",
                    brand="Samsung",
                    description="Produto compativel com provider mock",
                    thumbnail_url="https://example.com/galaxy-provider.jpg",
                    popularity_score=94,
                ),
                build_offer(
                    id="offer-1",
                    product_id="product-1",
                    store_id="store-amazon",
                    external_offer_id="offer-1-ext",
                    title="Apple iPhone 15 128GB",
                    seller_name="Amazon Brasil",
                    affiliate_url="https://www.amazon.com.br/",
                    landing_url="https://www.amazon.com.br/",
                    price="4399.00",
                    original_price="4799.00",
                    is_featured=True,
                ),
                build_offer(
                    id="offer-2",
                    product_id="product-2",
                    store_id="store-amazon",
                    external_offer_id="offer-2-ext",
                    title="Samsung Galaxy S24 256GB",
                    seller_name="Amazon Brasil",
                    affiliate_url="https://www.amazon.com.br/",
                    landing_url="https://www.amazon.com.br/",
                    price="3599.00",
                    original_price="3999.00",
                ),
            ]
        )
        session.flush()
        session.add_all(
            [
                build_price_history(
                    offer_id="offer-1",
                    product_id="product-1",
                    price="4399.00",
                    original_price="4799.00",
                ),
                build_price_history(
                    offer_id="offer-1",
                    product_id="product-1",
                    price="4499.00",
                    original_price="4899.00",
                ),
            ]
        )
        session.commit()
        yield session

    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def client(db_session: Session, monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    observability_registry.reset()

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr("app.main.SessionLocal", lambda: db_session)

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client: TestClient) -> dict[str, str]:
    return build_auth_headers(client)


@pytest.fixture()
def create_price_watch(db_session: Session) -> callable:
    def _create_price_watch(
        *,
        id: str = "watch-1",
        user_id: str = "user-1",
        product_id: str = "product-1",
        last_known_price: str | None = "4599.00",
        last_best_offer_id: str | None = "offer-1",
        target_price: str | None = "4300.00",
        notify_on_price_drop: bool = True,
        notify_on_new_best_offer: bool = True,
    ):
        watch = build_price_watch(
            id=id,
            user_id=user_id,
            product_id=product_id,
            last_known_price=last_known_price,
            last_best_offer_id=last_best_offer_id,
        )
        db_session.add(watch)
        db_session.flush()
        db_session.add(
            build_alert_config(
                price_watch_id=watch.id,
                target_price=target_price,
                notify_on_price_drop=notify_on_price_drop,
                notify_on_new_best_offer=notify_on_new_best_offer,
            )
        )
        db_session.commit()
        db_session.refresh(watch)
        return watch

    return _create_price_watch
