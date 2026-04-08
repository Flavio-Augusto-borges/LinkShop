from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundError
from app.models.alert_config import AlertConfig
from app.models.offer import Offer
from app.models.price_history import PriceHistory
from app.models.price_watch import PriceWatch
from app.models.product import Product
from app.models.user import User


class PriceWatchService:
    @staticmethod
    def list_watches(db: Session, user: User) -> list[dict]:
        stmt = (
            select(PriceWatch)
            .where(PriceWatch.user_id == user.id)
            .options(
                joinedload(PriceWatch.product),
                joinedload(PriceWatch.alert_config),
            )
            .order_by(PriceWatch.updated_at.desc())
        )
        watches = list(db.scalars(stmt).unique().all())
        return [PriceWatchService._serialize_watch(db, watch) for watch in watches]

    @staticmethod
    def create_watch(
        db: Session,
        user: User,
        product_id: str,
        target_price: Decimal | None,
        notify_on_price_drop: bool,
        notify_on_new_best_offer: bool,
    ) -> dict:
        product = db.scalar(select(Product).where(Product.id == product_id, Product.is_active.is_(True)))

        if not product:
            raise NotFoundError("Product not found", code="PRODUCT_NOT_FOUND")

        current_price = PriceWatchService._get_current_price(db, product_id)
        best_offer = PriceWatchService._get_best_offer(db, product_id)
        watch = db.scalar(
            select(PriceWatch)
            .where(PriceWatch.user_id == user.id, PriceWatch.product_id == product_id)
            .options(joinedload(PriceWatch.alert_config), joinedload(PriceWatch.product))
        )

        if watch:
            watch.is_active = True
            if current_price is not None:
                watch.last_known_price = current_price
            watch.last_best_offer_id = best_offer.id if best_offer else None
            PriceWatchService._ensure_alert_config(
                watch,
                updates={
                    "target_price": target_price,
                    "notify_on_price_drop": notify_on_price_drop,
                    "notify_on_new_best_offer": notify_on_new_best_offer,
                },
            )
            db.commit()
            db.refresh(watch)
            return PriceWatchService._serialize_watch(db, watch)

        watch = PriceWatch(
            user_id=user.id,
            product_id=product_id,
            is_active=True,
            last_known_price=current_price,
            last_best_offer_id=best_offer.id if best_offer else None,
        )
        db.add(watch)
        db.flush()

        alert_config = AlertConfig(
            price_watch_id=watch.id,
            target_price=target_price,
            notify_on_price_drop=notify_on_price_drop,
            notify_on_new_best_offer=notify_on_new_best_offer,
        )
        db.add(alert_config)
        db.commit()

        watch = db.scalar(
            select(PriceWatch)
            .where(PriceWatch.id == watch.id)
            .options(joinedload(PriceWatch.product), joinedload(PriceWatch.alert_config))
        )
        return PriceWatchService._serialize_watch(db, watch)

    @staticmethod
    def update_watch(
        db: Session,
        user: User,
        watch_id: str,
        *,
        updates: dict,
    ) -> dict | None:
        watch = db.scalar(
            select(PriceWatch)
            .where(PriceWatch.id == watch_id, PriceWatch.user_id == user.id)
            .options(joinedload(PriceWatch.product), joinedload(PriceWatch.alert_config))
        )

        if not watch:
            return None

        if "is_active" in updates:
            watch.is_active = updates["is_active"]

        if watch.is_active:
            current_price = PriceWatchService._get_current_price(db, watch.product_id)
            best_offer = PriceWatchService._get_best_offer(db, watch.product_id)
            if current_price is not None:
                watch.last_known_price = current_price
            watch.last_best_offer_id = best_offer.id if best_offer else None

        PriceWatchService._ensure_alert_config(
            watch,
            updates=updates,
        )

        db.commit()
        db.refresh(watch)
        return PriceWatchService._serialize_watch(db, watch)

    @staticmethod
    def remove_watch(db: Session, user: User, watch_id: str) -> bool:
        watch = db.scalar(
            select(PriceWatch).where(PriceWatch.id == watch_id, PriceWatch.user_id == user.id)
        )

        if not watch:
            return False

        db.delete(watch)
        db.commit()
        return True

    @staticmethod
    def _ensure_alert_config(
        watch: PriceWatch,
        *,
        updates: dict,
    ) -> None:
        if not watch.alert_config:
            watch.alert_config = AlertConfig(
                target_price=updates.get("target_price"),
                notify_on_price_drop=updates.get("notify_on_price_drop", True),
                notify_on_new_best_offer=updates.get("notify_on_new_best_offer", True),
            )
            return

        if "target_price" in updates:
            watch.alert_config.target_price = updates["target_price"]

        if "notify_on_price_drop" in updates:
            watch.alert_config.notify_on_price_drop = updates["notify_on_price_drop"]

        if "notify_on_new_best_offer" in updates:
            watch.alert_config.notify_on_new_best_offer = updates["notify_on_new_best_offer"]

    @staticmethod
    def _serialize_watch(db: Session, watch: PriceWatch) -> dict:
        current_price = PriceWatchService._get_current_price(db, watch.product_id)
        lowest_recent_price = db.scalar(
            select(func.min(PriceHistory.price)).where(PriceHistory.product_id == watch.product_id)
        )

        return {
            "id": watch.id,
            "user_id": watch.user_id,
            "product_id": watch.product_id,
            "is_active": watch.is_active,
            "last_known_price": watch.last_known_price,
            "current_price": current_price,
            "lowest_recent_price": lowest_recent_price,
            "created_at": watch.created_at,
            "updated_at": watch.updated_at,
            "product": watch.product,
            "alert_config": watch.alert_config,
        }

    @staticmethod
    def _get_current_price(db: Session, product_id: str) -> Decimal | None:
        return db.scalar(
            select(func.min(Offer.price)).where(Offer.product_id == product_id, Offer.is_active.is_(True))
        )

    @staticmethod
    def _get_best_offer(db: Session, product_id: str) -> Offer | None:
        return db.scalar(
            select(Offer)
            .where(Offer.product_id == product_id, Offer.is_active.is_(True))
            .order_by(Offer.price.asc(), Offer.created_at.desc())
        )
