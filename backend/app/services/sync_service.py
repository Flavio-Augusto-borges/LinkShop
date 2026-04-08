from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.alert_config import AlertConfig
from app.models.compare_list_item import CompareListItem
from app.models.favorite import Favorite
from app.models.offer import Offer
from app.models.price_watch import PriceWatch
from app.models.product import Product
from app.models.user import User
from app.schemas.sync import SyncAnonymousInput, SyncCompareListItemInput, SyncPriceWatchInput
from app.services.compare_list_service import CompareListService
from app.services.favorite_service import FavoriteService
from app.services.price_watch_service import PriceWatchService


class SyncService:
    @staticmethod
    def sync_anonymous_state(db: Session, user: User, payload: SyncAnonymousInput) -> dict:
        SyncService._merge_favorites(db, user, payload.favorites)
        SyncService._merge_compare_list(db, user, payload.compare_list)
        SyncService._merge_price_watches(db, user, payload.price_watches)
        db.commit()

        return {
            "favorites": FavoriteService.list_favorites(db, user),
            "compare_list": CompareListService.list_items(db, user),
            "price_watches": PriceWatchService.list_watches(db, user),
        }

    @staticmethod
    def _merge_favorites(db: Session, user: User, favorites: list) -> None:
        seen_product_ids = set()

        for favorite in favorites:
            if favorite.product_id in seen_product_ids:
                continue

            seen_product_ids.add(favorite.product_id)
            product = db.scalar(select(Product).where(Product.id == favorite.product_id, Product.is_active.is_(True)))

            if not product:
                continue

            exists = db.scalar(
                select(Favorite).where(Favorite.user_id == user.id, Favorite.product_id == favorite.product_id)
            )

            if exists:
                continue

            db.add(
                Favorite(
                    user_id=user.id,
                    product_id=favorite.product_id,
                    created_at=favorite.created_at or datetime.now(timezone.utc),
                )
            )

    @staticmethod
    def _merge_compare_list(db: Session, user: User, items: list[SyncCompareListItemInput]) -> None:
        existing_items = {
            item.product_id: item
            for item in db.scalars(
                select(CompareListItem)
                .where(CompareListItem.user_id == user.id)
                .options(joinedload(CompareListItem.offer))
            ).all()
        }

        for item in items:
            product = db.scalar(select(Product).where(Product.id == item.product_id, Product.is_active.is_(True)))
            offer = db.scalar(
                select(Offer).where(
                    Offer.id == item.offer_id,
                    Offer.product_id == item.product_id,
                    Offer.is_active.is_(True),
                )
            )

            if not product or not offer:
                continue

            existing = existing_items.get(item.product_id)

            if not existing:
                created = CompareListItem(
                    user_id=user.id,
                    product_id=item.product_id,
                    offer_id=item.offer_id,
                    quantity=item.quantity,
                    added_at=item.added_at or datetime.now(timezone.utc),
                )
                db.add(created)
                db.flush()
                existing_items[item.product_id] = created
                continue

            existing_quantity = existing.quantity
            existing.offer_id = SyncService._select_compare_offer_id(existing, offer, item)
            existing.quantity = max(existing_quantity, item.quantity)

            if item.added_at:
                existing.added_at = min(existing.added_at, item.added_at)

    @staticmethod
    def _select_compare_offer_id(existing: CompareListItem, incoming_offer: Offer, incoming_item: SyncCompareListItemInput) -> str:
        if incoming_item.quantity > existing.quantity:
            return incoming_offer.id

        if incoming_item.quantity < existing.quantity:
            return existing.offer_id

        existing_offer = existing.offer

        if existing_offer and incoming_offer.price < existing_offer.price:
            return incoming_offer.id

        if existing_offer and incoming_offer.price > existing_offer.price:
            return existing.offer_id

        if incoming_item.added_at and incoming_item.added_at >= existing.added_at:
            return incoming_offer.id

        return existing.offer_id

    @staticmethod
    def _merge_price_watches(db: Session, user: User, watches: list[SyncPriceWatchInput]) -> None:
        existing_watches = {
            watch.product_id: watch
            for watch in db.scalars(
                select(PriceWatch)
                .where(PriceWatch.user_id == user.id)
                .options(joinedload(PriceWatch.alert_config))
            ).all()
        }

        for watch in watches:
            product = db.scalar(select(Product).where(Product.id == watch.product_id, Product.is_active.is_(True)))

            if not product:
                continue

            existing = existing_watches.get(watch.product_id)

            if not existing:
                created = PriceWatch(
                    user_id=user.id,
                    product_id=watch.product_id,
                    is_active=watch.is_active,
                    last_known_price=watch.last_known_price,
                )
                db.add(created)
                db.flush()
                created.alert_config = AlertConfig(
                    target_price=watch.target_price,
                    notify_on_price_drop=watch.notify_on_price_drop,
                    notify_on_new_best_offer=watch.notify_on_new_best_offer,
                    last_triggered_at=watch.last_triggered_at,
                )
                existing_watches[watch.product_id] = created
                continue

            existing.is_active = existing.is_active or watch.is_active
            existing.last_known_price = SyncService._select_last_known_price(existing, watch)

            if not existing.alert_config:
                existing.alert_config = AlertConfig()

            existing.alert_config.target_price = SyncService._select_target_price(
                existing.alert_config.target_price,
                watch.target_price,
            )
            existing.alert_config.notify_on_price_drop = (
                existing.alert_config.notify_on_price_drop or watch.notify_on_price_drop
            )
            existing.alert_config.notify_on_new_best_offer = (
                existing.alert_config.notify_on_new_best_offer or watch.notify_on_new_best_offer
            )
            existing.alert_config.last_triggered_at = SyncService._select_latest_datetime(
                existing.alert_config.last_triggered_at,
                watch.last_triggered_at,
            )

    @staticmethod
    def _select_target_price(existing_target: Decimal | None, incoming_target: Decimal | None) -> Decimal | None:
        candidates = [value for value in [existing_target, incoming_target] if value is not None and value > 0]
        return min(candidates) if candidates else None

    @staticmethod
    def _select_last_known_price(existing: PriceWatch, incoming: SyncPriceWatchInput) -> Decimal | None:
        if incoming.last_known_price is None:
            return existing.last_known_price

        if incoming.updated_at is None:
            return existing.last_known_price or incoming.last_known_price

        existing_updated_at = existing.updated_at

        if incoming.updated_at >= existing_updated_at:
            return incoming.last_known_price

        return existing.last_known_price

    @staticmethod
    def _select_latest_datetime(existing_value: datetime | None, incoming_value: datetime | None) -> datetime | None:
        if not existing_value:
            return incoming_value
        if not incoming_value:
            return existing_value
        return max(existing_value, incoming_value)
