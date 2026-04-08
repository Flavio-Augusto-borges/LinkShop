from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PriceHistoryPointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    offer_id: str
    product_id: str
    captured_at: datetime
    price: Decimal
    original_price: Decimal | None
    shipping_cost: Decimal | None
    availability: str


class PriceHistorySummaryRead(BaseModel):
    current_price: Decimal | None
    lowest_recent_price: Decimal | None
    highest_recent_price: Decimal | None
    variation_percentage: Decimal | None
    trend: str
    points_count: int


class PriceHistoryResponse(BaseModel):
    product_id: str
    summary: PriceHistorySummaryRead
    points: list[PriceHistoryPointRead]
