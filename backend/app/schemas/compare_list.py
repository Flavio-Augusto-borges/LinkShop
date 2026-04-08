from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.offer import OfferRead
from app.schemas.product import ProductListItem


class CompareListCreate(BaseModel):
    product_id: str
    offer_id: str
    quantity: int = Field(default=1, ge=1)


class CompareListUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CompareListItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    product_id: str
    offer_id: str
    quantity: int
    added_at: datetime
    updated_at: datetime
    product: ProductListItem
    offer: OfferRead
