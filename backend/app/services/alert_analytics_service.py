from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.alert_event import AlertEvent
from app.models.price_watch import PriceWatch
from app.models.product import Product
from app.services.pagination_service import PaginationService


class AlertAnalyticsService:
    @staticmethod
    def get_alert_analytics(db: Session, period_days: int = 30) -> dict[str, object]:
        start_at = datetime.now(timezone.utc) - timedelta(days=period_days)
        period_filter = AlertEvent.created_at >= start_at

        total_alerts = db.scalar(
            select(func.count(AlertEvent.id)).where(period_filter, AlertEvent.triggered.is_(True))
        ) or 0

        alerts_by_reason = db.execute(
            select(AlertEvent.reason, func.count(AlertEvent.id).label("count"))
            .where(period_filter, AlertEvent.triggered.is_(True))
            .group_by(AlertEvent.reason)
            .order_by(func.count(AlertEvent.id).desc(), AlertEvent.reason.asc())
        ).all()

        top_products = db.execute(
            select(
                AlertEvent.product_id,
                Product.name,
                func.count(AlertEvent.id).label("count"),
            )
            .join(Product, Product.id == AlertEvent.product_id)
            .where(period_filter, AlertEvent.triggered.is_(True))
            .group_by(AlertEvent.product_id, Product.name)
            .order_by(func.count(AlertEvent.id).desc(), Product.name.asc())
            .limit(5)
        ).all()

        top_watches = db.execute(
            select(
                AlertEvent.price_watch_id,
                Product.name,
                func.count(AlertEvent.id).label("count"),
            )
            .join(PriceWatch, PriceWatch.id == AlertEvent.price_watch_id)
            .join(Product, Product.id == AlertEvent.product_id)
            .where(period_filter, AlertEvent.triggered.is_(True))
            .group_by(AlertEvent.price_watch_id, Product.name)
            .order_by(func.count(AlertEvent.id).desc(), Product.name.asc())
            .limit(5)
        ).all()

        alerts_by_day = db.execute(
            select(
                func.date(AlertEvent.created_at).label("day"),
                func.count(AlertEvent.id).label("count"),
            )
            .where(period_filter, AlertEvent.triggered.is_(True))
            .group_by(func.date(AlertEvent.created_at))
            .order_by(func.date(AlertEvent.created_at).asc())
        ).all()

        return {
            "period_days": period_days,
            "total_alerts": int(total_alerts),
            "alerts_by_reason": [
                {"source": row[0], "count": int(row[1])}
                for row in alerts_by_reason
            ],
            "top_products": [
                {"id": row[0], "label": row[1], "count": int(row[2])}
                for row in top_products
            ],
            "top_watches": [
                {"id": row[0], "label": row[1], "count": int(row[2])}
                for row in top_watches
            ],
            "alerts_by_day": [
                {"date": AlertAnalyticsService._ensure_date(row[0]), "count": int(row[1])}
                for row in alerts_by_day
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
    def list_alert_events(db: Session, *, page: int, page_size: int) -> dict[str, object]:
        normalized_page, normalized_page_size = PaginationService.normalize(page, page_size)
        stmt = (
            select(AlertEvent)
            .join(Product, Product.id == AlertEvent.product_id)
            .join(PriceWatch, PriceWatch.id == AlertEvent.price_watch_id)
            .order_by(AlertEvent.created_at.desc(), AlertEvent.id.desc())
        )
        events = list(db.scalars(stmt).all())
        items, total = PaginationService.slice_items(events, normalized_page, normalized_page_size)

        return {
            "items": [
                {
                    "id": event.id,
                    "price_watch_id": event.price_watch_id,
                    "user_id": event.user_id,
                    "product_id": event.product_id,
                    "product_name": event.product.name,
                    "offer_id": event.offer_id,
                    "reason": event.reason,
                    "status": event.status,
                    "message": event.message,
                    "current_price": event.current_price,
                    "target_price": event.target_price,
                    "previous_price": event.previous_price,
                    "triggered": event.triggered,
                    "created_at": event.created_at,
                }
                for event in items
            ],
            "total": total,
            "page": normalized_page,
            "page_size": normalized_page_size,
        }
