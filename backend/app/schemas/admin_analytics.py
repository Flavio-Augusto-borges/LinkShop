from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class AnalyticsCountItem(BaseModel):
    id: str
    label: str
    count: int


class AnalyticsSourceItem(BaseModel):
    source: str
    count: int


class AnalyticsTimeBucket(BaseModel):
    date: date
    count: int


class ClickAnalyticsRead(BaseModel):
    period_days: int
    total_clicks: int
    top_products: list[AnalyticsCountItem]
    top_offers: list[AnalyticsCountItem]
    top_stores: list[AnalyticsCountItem]
    clicks_by_source: list[AnalyticsSourceItem]
    clicks_by_day: list[AnalyticsTimeBucket]


class AlertAnalyticsRead(BaseModel):
    period_days: int
    total_alerts: int
    alerts_by_reason: list[AnalyticsSourceItem]
    top_products: list[AnalyticsCountItem]
    top_watches: list[AnalyticsCountItem]
    alerts_by_day: list[AnalyticsTimeBucket]


class ClickEventAdminRead(BaseModel):
    id: str
    user_id: str | None
    product_id: str
    product_name: str
    offer_id: str
    offer_title: str
    store_id: str
    store_name: str
    source: str
    position: int | None
    category: str | None
    search_term: str | None
    section_type: str | None
    referrer: str | None
    created_at: datetime


class AlertEventAdminRead(BaseModel):
    id: str
    price_watch_id: str
    user_id: str
    product_id: str
    product_name: str
    offer_id: str | None
    reason: str
    status: str
    message: str
    current_price: Decimal | None
    target_price: Decimal | None
    previous_price: Decimal | None
    triggered: bool
    created_at: datetime
