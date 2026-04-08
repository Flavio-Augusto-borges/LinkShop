from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.offer import OfferRead
from app.schemas.store import StoreRead


class ProductListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name: str
    brand: str
    category: str
    description: str
    thumbnail_url: str
    popularity_score: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProductRead(ProductListItem):
    offers: list[OfferRead] = []


class CatalogItemRead(BaseModel):
    product: ProductListItem
    offers: list[OfferRead]
    best_offer: OfferRead | None
    best_offer_score: float | None = None
    best_offer_reason: str | None = None
    lowest_price: Decimal
    highest_price: Decimal
    best_discount_percentage: int
    store_ids: list[str]


class ProductSearchResponse(BaseModel):
    items: list[CatalogItemRead]
    total: int
    page: int
    page_size: int
    available_categories: list[str]
    available_stores: list[StoreRead]
