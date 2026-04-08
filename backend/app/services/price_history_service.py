from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.offer import Offer
from app.models.price_history import PriceHistory
from app.models.product import Product


class PriceHistoryService:
    @staticmethod
    def get_price_history(db: Session, product_id: str, limit: int = 30) -> tuple[Product | None, dict]:
        product = db.scalar(select(Product).where(Product.id == product_id, Product.is_active.is_(True)))

        if not product:
            return None, {}

        history_stmt = (
            select(PriceHistory)
            .where(PriceHistory.product_id == product_id)
            .order_by(PriceHistory.captured_at.desc())
            .limit(limit)
        )
        recent_points = list(db.scalars(history_stmt).all())
        points = list(reversed(recent_points))

        current_price = db.scalar(
            select(func.min(Offer.price)).where(Offer.product_id == product_id, Offer.is_active.is_(True))
        )

        summary = PriceHistoryService._build_summary(points, current_price)
        return product, {"product_id": product_id, "summary": summary, "points": points}

    @staticmethod
    def get_recent_lowest_price(db: Session, product_id: str) -> Decimal | None:
        return db.scalar(select(func.min(PriceHistory.price)).where(PriceHistory.product_id == product_id))

    @staticmethod
    def _build_summary(points: list[PriceHistory], current_price: Decimal | None) -> dict:
        if not points:
            return {
                "current_price": current_price,
                "lowest_recent_price": current_price,
                "highest_recent_price": current_price,
                "variation_percentage": Decimal("0.00") if current_price is not None else None,
                "trend": "stable",
                "points_count": 0,
            }

        prices = [point.price for point in points]
        baseline = points[0].price
        variation_percentage: Decimal | None = None

        if current_price is not None and baseline and baseline != Decimal("0.00"):
            variation_percentage = ((current_price - baseline) / baseline) * Decimal("100")
            variation_percentage = variation_percentage.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        trend = "stable"
        if variation_percentage is not None:
            if variation_percentage > Decimal("0.50"):
                trend = "up"
            elif variation_percentage < Decimal("-0.50"):
                trend = "down"

        return {
            "current_price": current_price,
            "lowest_recent_price": min(prices),
            "highest_recent_price": max(prices),
            "variation_percentage": variation_percentage,
            "trend": trend,
            "points_count": len(points),
        }
