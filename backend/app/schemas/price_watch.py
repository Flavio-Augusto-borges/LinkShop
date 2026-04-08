from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductListItem


class AlertConfigRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    price_watch_id: str
    target_price: Decimal | None
    notify_on_price_drop: bool
    notify_on_new_best_offer: bool
    last_triggered_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PriceWatchCreate(BaseModel):
    product_id: str
    target_price: Decimal | None = None
    notify_on_price_drop: bool = True
    notify_on_new_best_offer: bool = True


class PriceWatchUpdate(BaseModel):
    is_active: bool | None = None
    target_price: Decimal | None = None
    notify_on_price_drop: bool | None = None
    notify_on_new_best_offer: bool | None = None


class PriceWatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    product_id: str
    is_active: bool
    last_known_price: Decimal | None
    current_price: Decimal | None
    lowest_recent_price: Decimal | None
    created_at: datetime
    updated_at: datetime
    product: ProductListItem
    alert_config: AlertConfigRead
