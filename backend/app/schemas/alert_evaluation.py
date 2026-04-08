from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class AlertEvaluationEventRead(BaseModel):
    watch_id: str
    product_id: str
    offer_id: str | None
    reason: str
    status: str
    message: str
    current_price: Decimal | None
    target_price: Decimal | None
    previous_price: Decimal | None
    triggered: bool
    created_at: datetime


class AlertEvaluationSummary(BaseModel):
    evaluated: int
    triggered: int
    events: list[AlertEvaluationEventRead]
