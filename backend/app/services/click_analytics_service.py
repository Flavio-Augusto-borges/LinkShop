from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.click_event import ClickEvent
from app.models.offer import Offer
from app.models.product import Product
from app.models.store import Store
from app.services.pagination_service import PaginationService


class ClickAnalyticsService:
    @staticmethod
    def get_click_analytics(db: Session, period_days: int = 30) -> dict[str, object]:
        start_at = datetime.now(timezone.utc) - timedelta(days=period_days)
        period_filter = ClickEvent.created_at >= start_at

        total_clicks = db.scalar(select(func.count(ClickEvent.id)).where(period_filter)) or 0

        top_products = db.execute(
            select(
                ClickEvent.product_id,
                Product.name,
                func.count(ClickEvent.id).label("count"),
            )
            .join(Product, Product.id == ClickEvent.product_id)
            .where(period_filter)
            .group_by(ClickEvent.product_id, Product.name)
            .order_by(func.count(ClickEvent.id).desc(), Product.name.asc())
            .limit(5)
        ).all()

        top_offers = db.execute(
            select(
                ClickEvent.offer_id,
                Offer.title,
                func.count(ClickEvent.id).label("count"),
            )
            .join(Offer, Offer.id == ClickEvent.offer_id)
            .where(period_filter)
            .group_by(ClickEvent.offer_id, Offer.title)
            .order_by(func.count(ClickEvent.id).desc(), Offer.title.asc())
            .limit(5)
        ).all()

        top_stores = db.execute(
            select(
                ClickEvent.store_id,
                Store.name,
                func.count(ClickEvent.id).label("count"),
            )
            .join(Store, Store.id == ClickEvent.store_id)
            .where(period_filter)
            .group_by(ClickEvent.store_id, Store.name)
            .order_by(func.count(ClickEvent.id).desc(), Store.name.asc())
            .limit(5)
        ).all()

        clicks_by_source = db.execute(
            select(
                ClickEvent.source,
                func.count(ClickEvent.id).label("count"),
            )
            .where(period_filter)
            .group_by(ClickEvent.source)
            .order_by(func.count(ClickEvent.id).desc(), ClickEvent.source.asc())
        ).all()

        clicks_by_day = db.execute(
            select(
                func.date(ClickEvent.created_at).label("day"),
                func.count(ClickEvent.id).label("count"),
            )
            .where(period_filter)
            .group_by(func.date(ClickEvent.created_at))
            .order_by(func.date(ClickEvent.created_at).asc())
        ).all()

        return {
            "period_days": period_days,
            "total_clicks": int(total_clicks),
            "top_products": [
                {"id": row[0], "label": row[1], "count": int(row[2])}
                for row in top_products
            ],
            "top_offers": [
                {"id": row[0], "label": row[1], "count": int(row[2])}
                for row in top_offers
            ],
            "top_stores": [
                {"id": row[0], "label": row[1], "count": int(row[2])}
                for row in top_stores
            ],
            "clicks_by_source": [
                {"source": row[0], "count": int(row[1])}
                for row in clicks_by_source
            ],
            "clicks_by_day": [
                {"date": ClickAnalyticsService._ensure_date(row[0]), "count": int(row[1])}
                for row in clicks_by_day
            ],
        }

    @staticmethod
    def _ensure_date(value: date | str | datetime) -> date:
        if isinstance(value, date) and not isinstance(value, datetime):
            return value
        if isinstance(value, datetime):
            return value.date()
        return date.fromisoformat(str(value))

    @staticmethod
    def list_click_events(db: Session, *, page: int, page_size: int) -> dict[str, object]:
        normalized_page, normalized_page_size = PaginationService.normalize(page, page_size)
        stmt = (
            select(ClickEvent)
            .join(Product, Product.id == ClickEvent.product_id)
            .join(Offer, Offer.id == ClickEvent.offer_id)
            .join(Store, Store.id == ClickEvent.store_id)
            .order_by(ClickEvent.created_at.desc(), ClickEvent.id.desc())
        )
        events = list(db.scalars(stmt).all())
        items, total = PaginationService.slice_items(events, normalized_page, normalized_page_size)

        return {
            "items": [
                {
                    "id": event.id,
                    "user_id": event.user_id,
                    "product_id": event.product_id,
                    "product_name": event.product.name,
                    "offer_id": event.offer_id,
                    "offer_title": event.offer.title,
                    "store_id": event.store_id,
                    "store_name": event.store.name,
                    "source": event.source,
                    "position": event.position,
                    "category": event.category,
                    "search_term": event.search_term,
                    "section_type": event.section_type,
                    "referrer": event.referrer,
                    "created_at": event.created_at,
                }
                for event in items
            ],
            "total": total,
            "page": normalized_page,
            "page_size": normalized_page_size,
        }
