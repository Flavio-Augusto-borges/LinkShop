from datetime import datetime

from pydantic import BaseModel


class OfferSyncSummary(BaseModel):
    provider: str
    source_reference: str | None = None
    status: str
    processed: int
    created: int
    updated: int
    unchanged: int
    failed: int
    history_created: int
    warning_count: int
    error_count: int
    warnings: list[str]
    errors: list[str]
    started_at: datetime
    finished_at: datetime


class IntegrationSyncRunRead(BaseModel):
    id: str
    provider: str
    source_reference: str | None
    status: str
    processed: int
    created: int
    updated: int
    unchanged: int
    failed: int
    history_created: int
    warning_count: int
    error_count: int
    warning_summary: str | None
    error_summary: str | None
    started_at: datetime
    finished_at: datetime | None
    created_at: datetime
