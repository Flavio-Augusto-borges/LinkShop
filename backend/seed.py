from datetime import datetime, timezone
from decimal import Decimal

from app.core.security import hash_password
from sqlalchemy import inspect

from app.db.session import SessionLocal, engine
from app.models.alert_config import AlertConfig
from app.models.alert_event import AlertEvent
from app.models.auth_session import AuthSession
from app.models.click_event import ClickEvent
from app.models.compare_list_item import CompareListItem
from app.models.favorite import Favorite
from app.models.offer import Offer
from app.models.price_history import PriceHistory
from app.models.price_watch import PriceWatch
from app.models.product import Product
from app.models.store import Store
from app.models.user import User


def seed_users() -> list[User]:
    return [
        User(
            id="user-admin-1",
            name="Equipe LinkShop",
            email="admin@linkshop.dev",
            password_hash=hash_password("123456"),
            role="admin",
        ),
        User(
            id="user-1",
            name="Usuario Demo",
            email="user@linkshop.dev",
            password_hash=hash_password("123456"),
            role="user",
        ),
    ]


def seed_stores() -> list[Store]:
    return [
        Store(
            id="store-amazon",
            code="amazon",
            name="Amazon",
            affiliate_network="in-house",
            base_url="https://www.amazon.com.br/",
            is_active=True,
        ),
        Store(
            id="store-mercado-livre",
            code="mercado-livre",
            name="Mercado Livre",
            affiliate_network="custom",
            base_url="https://www.mercadolivre.com.br/",
            is_active=True,
        ),
        Store(
            id="store-shopee",
            code="shopee",
            name="Shopee",
            affiliate_network="custom",
            base_url="https://shopee.com.br/",
            is_active=True,
        ),
    ]


def seed_products() -> list[Product]:
    return [
        Product(
            id="product-iphone-15-128",
            slug="iphone-15-128gb",
            name="Apple iPhone 15 128GB",
            brand="Apple",
            category="Smartphones",
            description="Smartphone Apple com tela OLED e camera principal avancada.",
            thumbnail_url="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
            popularity_score=98,
            is_active=True,
        ),
        Product(
            id="product-galaxy-s24-256",
            slug="galaxy-s24-256gb",
            name="Samsung Galaxy S24 256GB",
            brand="Samsung",
            category="Smartphones",
            description="Smartphone premium Samsung com foco em camera, tela e performance.",
            thumbnail_url="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf",
            popularity_score=95,
            is_active=True,
        ),
    ]


def seed_offers() -> list[Offer]:
    return [
        Offer(
            id="offer-iphone-amazon",
            product_id="product-iphone-15-128",
            store_id="store-amazon",
            external_offer_id="iphone15-amz",
            seller_name="Amazon Brasil",
            title="Apple iPhone 15 128GB",
            affiliate_url="https://www.amazon.com.br/",
            landing_url="https://www.amazon.com.br/",
            price=Decimal("4399.00"),
            original_price=Decimal("4799.00"),
            currency="BRL",
            shipping_cost=Decimal("0.00"),
            installment_text="10x sem juros",
            availability="in_stock",
            is_featured=True,
            is_active=True,
        ),
        Offer(
            id="offer-iphone-mercado-livre",
            product_id="product-iphone-15-128",
            store_id="store-mercado-livre",
            external_offer_id="iphone15-ml",
            seller_name="Loja Oficial Apple",
            title="iPhone 15 128GB Apple",
            affiliate_url="https://www.mercadolivre.com.br/",
            landing_url="https://www.mercadolivre.com.br/",
            price=Decimal("4329.00"),
            original_price=Decimal("4699.00"),
            currency="BRL",
            shipping_cost=Decimal("0.00"),
            installment_text="12x de R$ 360,75",
            availability="in_stock",
            is_featured=True,
            is_active=True,
        ),
        Offer(
            id="offer-galaxy-amazon",
            product_id="product-galaxy-s24-256",
            store_id="store-amazon",
            external_offer_id="galaxys24-amz",
            seller_name="Amazon Brasil",
            title="Samsung Galaxy S24 256GB",
            affiliate_url="https://www.amazon.com.br/",
            landing_url="https://www.amazon.com.br/",
            price=Decimal("3599.00"),
            original_price=Decimal("4199.00"),
            currency="BRL",
            shipping_cost=Decimal("0.00"),
            installment_text="10x sem juros",
            availability="in_stock",
            is_featured=True,
            is_active=True,
        ),
        Offer(
            id="offer-galaxy-shopee",
            product_id="product-galaxy-s24-256",
            store_id="store-shopee",
            external_offer_id="galaxys24-shp",
            seller_name="Samsung Oficial",
            title="Galaxy S24 256GB Samsung",
            affiliate_url="https://shopee.com.br/",
            landing_url="https://shopee.com.br/",
            price=Decimal("3499.00"),
            original_price=Decimal("3999.00"),
            currency="BRL",
            shipping_cost=Decimal("14.90"),
            installment_text="Parcelamento via cartao",
            availability="low_stock",
            is_featured=False,
            is_active=True,
        ),
    ]


def seed_favorites() -> list[Favorite]:
    return [
        Favorite(
            id="favorite-user-1-iphone",
            user_id="user-1",
            product_id="product-iphone-15-128",
        )
    ]


def seed_compare_list_items() -> list[CompareListItem]:
    return [
        CompareListItem(
            id="compare-user-1-iphone",
            user_id="user-1",
            product_id="product-iphone-15-128",
            offer_id="offer-iphone-mercado-livre",
            quantity=1,
        )
    ]


def seed_price_history() -> list[PriceHistory]:
    points = [
        ("history-iphone-1", "offer-iphone-amazon", "product-iphone-15-128", "2026-03-20T12:00:00+00:00", "4599.00", "4899.00"),
        ("history-iphone-2", "offer-iphone-mercado-livre", "product-iphone-15-128", "2026-03-24T12:00:00+00:00", "4499.00", "4799.00"),
        ("history-iphone-3", "offer-iphone-amazon", "product-iphone-15-128", "2026-03-28T12:00:00+00:00", "4429.00", "4799.00"),
        ("history-iphone-4", "offer-iphone-mercado-livre", "product-iphone-15-128", "2026-04-01T12:00:00+00:00", "4329.00", "4699.00"),
        ("history-galaxy-1", "offer-galaxy-amazon", "product-galaxy-s24-256", "2026-03-20T12:00:00+00:00", "3899.00", "4299.00"),
        ("history-galaxy-2", "offer-galaxy-shopee", "product-galaxy-s24-256", "2026-03-24T12:00:00+00:00", "3799.00", "4099.00"),
        ("history-galaxy-3", "offer-galaxy-amazon", "product-galaxy-s24-256", "2026-03-28T12:00:00+00:00", "3699.00", "4199.00"),
        ("history-galaxy-4", "offer-galaxy-shopee", "product-galaxy-s24-256", "2026-04-01T12:00:00+00:00", "3499.00", "3999.00"),
    ]

    return [
        PriceHistory(
            id=history_id,
            offer_id=offer_id,
            product_id=product_id,
            captured_at=datetime.fromisoformat(captured_at).astimezone(timezone.utc),
            price=Decimal(price),
            original_price=Decimal(original_price),
            shipping_cost=Decimal("0.00"),
            availability="in_stock",
        )
        for history_id, offer_id, product_id, captured_at, price, original_price in points
    ]


def seed_price_watches() -> list[PriceWatch]:
    return [
        PriceWatch(
            id="watch-user-1-iphone",
            user_id="user-1",
            product_id="product-iphone-15-128",
            is_active=True,
            last_known_price=Decimal("4399.00"),
            last_best_offer_id="offer-iphone-mercado-livre",
        )
    ]


def seed_alert_configs() -> list[AlertConfig]:
    return [
        AlertConfig(
            id="alert-watch-user-1-iphone",
            price_watch_id="watch-user-1-iphone",
            target_price=Decimal("4299.00"),
            notify_on_price_drop=True,
            notify_on_new_best_offer=True,
        )
    ]


def seed_click_events() -> list[ClickEvent]:
    return [
        ClickEvent(
            id="click-1",
            user_id="user-1",
            product_id="product-iphone-15-128",
            offer_id="offer-iphone-mercado-livre",
            store_id="store-mercado-livre",
            source="ofertas",
            referrer="http://localhost:3000/ofertas/iphone-15-128gb",
        ),
        ClickEvent(
            id="click-2",
            user_id="user-1",
            product_id="product-iphone-15-128",
            offer_id="offer-iphone-amazon",
            store_id="store-amazon",
            source="lista",
            referrer="http://localhost:3000/lista",
        ),
        ClickEvent(
            id="click-3",
            user_id=None,
            product_id="product-galaxy-s24-256",
            offer_id="offer-galaxy-shopee",
            store_id="store-shopee",
            source="buscar",
            referrer="http://localhost:3000/buscar?q=galaxy",
        ),
    ]


def seed_alert_events() -> list[AlertEvent]:
    return [
        AlertEvent(
            id="alert-event-1",
            price_watch_id="watch-user-1-iphone",
            user_id="user-1",
            product_id="product-iphone-15-128",
            offer_id="offer-iphone-mercado-livre",
            status="triggered",
            reason="price_drop",
            message="Preco caiu e ultrapassou o limiar configurado.",
            current_price=Decimal("4329.00"),
            target_price=Decimal("4299.00"),
            previous_price=Decimal("4499.00"),
            triggered=True,
        ),
        AlertEvent(
            id="alert-event-2",
            price_watch_id="watch-user-1-iphone",
            user_id="user-1",
            product_id="product-iphone-15-128",
            offer_id="offer-iphone-mercado-livre",
            status="triggered",
            reason="new_best_offer",
            message="Nova melhor oferta detectada para o produto acompanhado.",
            current_price=Decimal("4329.00"),
            target_price=Decimal("4299.00"),
            previous_price=Decimal("4399.00"),
            triggered=True,
        ),
    ]


def run_seed() -> None:
    existing_tables = set(inspect(engine).get_table_names())
    required_tables = {
        "users",
        "products",
        "stores",
        "offers",
        "favorites",
        "compare_list_items",
        "price_history",
        "price_watches",
        "alert_configs",
        "alert_events",
        "click_events",
    }

    if not required_tables.issubset(existing_tables):
        raise RuntimeError(
            "Database schema is not up to date. Run 'alembic -c backend/alembic.ini upgrade head' before seeding."
        )

    with SessionLocal() as session:
        session.query(AlertEvent).delete()
        session.query(AlertConfig).delete()
        session.query(ClickEvent).delete()
        session.query(AuthSession).delete()
        session.query(PriceWatch).delete()
        session.query(PriceHistory).delete()
        session.query(CompareListItem).delete()
        session.query(Favorite).delete()
        session.query(Offer).delete()
        session.query(Product).delete()
        session.query(Store).delete()
        session.query(User).delete()

        session.add_all(seed_users())
        session.add_all(seed_stores())
        session.add_all(seed_products())
        session.add_all(seed_offers())
        session.add_all(seed_price_history())
        session.add_all(seed_favorites())
        session.add_all(seed_compare_list_items())
        session.add_all(seed_price_watches())
        session.add_all(seed_alert_configs())
        session.add_all(seed_click_events())
        session.add_all(seed_alert_events())
        session.commit()


if __name__ == "__main__":
    run_seed()
    print("Seed concluido com sucesso.")
