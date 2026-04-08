from decimal import Decimal

from pydantic import BaseModel

from app.schemas.offer import OfferRead


class ProductRankingPreviewRead(BaseModel):
    product_id: str
    offers_count: int
    lowest_price: Decimal | None
    best_offer_id: str | None
    best_offer_score: float | None
    best_offer_reason: str | None
    offers: list[OfferRead]
