from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.store import StoreRead


class OfferRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    store_id: str
    seller_name: str
    title: str
    affiliate_url: str
    landing_url: str | None
    price: Decimal
    original_price: Decimal | None
    currency: str
    shipping_cost: Decimal | None
    installment_text: str | None
    availability: str
    is_featured: bool
    is_active: bool
    last_synced_at: datetime
    ranking_score: float | None = None
    quality_score: float | None = None
    ranking_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    store: StoreRead
