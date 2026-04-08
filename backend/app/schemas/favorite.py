from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductListItem


class FavoriteCreate(BaseModel):
    product_id: str


class FavoriteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    product_id: str
    created_at: datetime
    product: ProductListItem
