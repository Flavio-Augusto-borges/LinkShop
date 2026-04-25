from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.offer import Offer
from app.services.offer_ranking_service import OfferRankingService
from app.services.product_service import ProductService


class OfferService:
    @staticmethod
    def list_offers(db: Session, product_id: str | None = None) -> list[Offer]:
        stmt = (
            select(Offer)
            .where(Offer.is_active.is_(True))
            .options(joinedload(Offer.store))
            .order_by(Offer.created_at.desc())
        )

        if product_id:
            stmt = stmt.where(Offer.product_id == product_id)

        offers = [
            offer
            for offer in db.scalars(stmt).unique().all()
            if ProductService._is_offer_publicly_visible(offer)
        ]

        if product_id:
            return OfferRankingService.rank_offers(offers)

        grouped_by_product: dict[str, list[Offer]] = {}
        for offer in offers:
            bucket = grouped_by_product.get(offer.product_id, [])
            bucket.append(offer)
            grouped_by_product[offer.product_id] = bucket

        ranked: list[Offer] = []
        for product_offers in grouped_by_product.values():
            ranked.extend(OfferRankingService.rank_offers(product_offers))

        ranked.sort(
            key=lambda offer: (
                -float(getattr(offer, "ranking_score", 0.0)),
                offer.price,
                offer.created_at,
            )
        )
        return ranked

    @staticmethod
    def get_product_ranking_preview(db: Session, product_id: str) -> dict[str, object]:
        offers = OfferService.list_offers(db, product_id=product_id)
        best_offer = offers[0] if offers else None
        lowest_price = min((offer.price for offer in offers), default=None)

        return {
            "product_id": product_id,
            "offers_count": len(offers),
            "lowest_price": lowest_price,
            "best_offer_id": best_offer.id if best_offer else None,
            "best_offer_score": float(getattr(best_offer, "ranking_score", 0.0)) if best_offer else None,
            "best_offer_reason": str(getattr(best_offer, "ranking_reason", "")) if best_offer else None,
            "offers": offers,
        }
