from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.compare_list import CompareListItemRead
from app.schemas.favorite import FavoriteRead
from app.schemas.price_watch import PriceWatchRead


class SyncFavoriteInput(BaseModel):
    product_id: str
    created_at: datetime | None = None


class SyncCompareListItemInput(BaseModel):
    product_id: str
    offer_id: str
    quantity: int = Field(default=1, ge=1)
    added_at: datetime | None = None


class SyncPriceWatchInput(BaseModel):
    product_id: str
    is_active: bool = True
    last_known_price: Decimal | None = None
    target_price: Decimal | None = None
    notify_on_price_drop: bool = True
    notify_on_new_best_offer: bool = True
    last_triggered_at: datetime | None = None
    updated_at: datetime | None = None


class SyncAnonymousInput(BaseModel):
    anonymous_session_id: str
    favorites: list[SyncFavoriteInput] = []
    compare_list: list[SyncCompareListItemInput] = []
    price_watches: list[SyncPriceWatchInput] = []


class SyncAnonymousResponse(BaseModel):
    favorites: list[FavoriteRead]
    compare_list: list[CompareListItemRead]
    price_watches: list[PriceWatchRead]
