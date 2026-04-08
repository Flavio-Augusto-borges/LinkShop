from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    affiliate_network: str
    base_url: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
