from datetime import datetime
from typing import Any

from pydantic import BaseModel


class OperationalErrorRead(BaseModel):
    message: str
    code: str | None = None
    request_id: str | None = None
    occurred_at: datetime
    context: dict[str, Any] | None = None


class FlowMetricsRead(BaseModel):
    metrics: dict[str, int]
    last_error: OperationalErrorRead | None = None


class RequestMetricsRead(BaseModel):
    total: int
    api: int
    failed: int
    server_error: int


class RuntimeMetricsRead(BaseModel):
    generated_at: datetime
    uptime_seconds: int
    requests: RequestMetricsRead
    flows: dict[str, FlowMetricsRead]
    last_error: dict[str, Any] | None = None


class LatestSyncRunRead(BaseModel):
    id: str
    provider: str
    status: str
    processed: int
    failed: int
    error_count: int
    warning_count: int
    started_at: datetime
    finished_at: datetime | None


class LatestClickEventRead(BaseModel):
    id: str
    product_id: str
    offer_id: str
    store_id: str
    source: str
    created_at: datetime


class LatestAlertEventRead(BaseModel):
    id: str
    product_id: str
    offer_id: str | None
    reason: str
    status: str
    triggered: bool
    created_at: datetime


class PersistentOperationalRead(BaseModel):
    total_sync_runs: int
    total_click_events: int
    total_alert_events: int
    latest_sync_run: LatestSyncRunRead | None
    latest_click_event: LatestClickEventRead | None
    latest_alert_event: LatestAlertEventRead | None


class AdminOperationalSummaryRead(BaseModel):
    runtime: RuntimeMetricsRead
    persistent: PersistentOperationalRead
