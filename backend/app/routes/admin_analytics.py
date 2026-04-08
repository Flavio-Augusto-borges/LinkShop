from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError
from app.core.config import settings
from app.db.session import get_db
from app.schemas.admin_analytics import (
    AlertAnalyticsRead,
    AlertEventAdminRead,
    ClickAnalyticsRead,
    ClickEventAdminRead,
)
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.services.alert_analytics_service import AlertAnalyticsService
from app.services.click_analytics_service import ClickAnalyticsService


router = APIRouter()


def ensure_admin_analytics_available() -> None:
    if not settings.app_debug:
        raise ForbiddenError("Admin analytics endpoints are only available in development mode")


@router.get("/analytics/clicks", response_model=ClickAnalyticsRead)
def get_click_analytics(
    periodDays: int = Query(default=30, ge=1, le=365, alias="periodDays"),
    db: Session = Depends(get_db),
) -> ClickAnalyticsRead:
    ensure_admin_analytics_available()
    payload = ClickAnalyticsService.get_click_analytics(db, period_days=periodDays)
    return ClickAnalyticsRead.model_validate(payload)


@router.get("/analytics/alerts", response_model=AlertAnalyticsRead)
def get_alert_analytics(
    periodDays: int = Query(default=30, ge=1, le=365, alias="periodDays"),
    db: Session = Depends(get_db),
) -> AlertAnalyticsRead:
    ensure_admin_analytics_available()
    payload = AlertAnalyticsService.get_alert_analytics(db, period_days=periodDays)
    return AlertAnalyticsRead.model_validate(payload)


@router.get("/analytics/click-events", response_model=PaginatedResponse[ClickEventAdminRead])
def get_click_events(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ClickEventAdminRead]:
    ensure_admin_analytics_available()
    payload = ClickAnalyticsService.list_click_events(db, page=page, page_size=pageSize)
    return PaginatedResponse[ClickEventAdminRead](
        data=[ClickEventAdminRead.model_validate(item) for item in payload["items"]],
        meta=PaginationMeta(page=payload["page"], page_size=payload["page_size"], total=payload["total"]),
    )


@router.get("/analytics/alert-events", response_model=PaginatedResponse[AlertEventAdminRead])
def get_alert_events(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AlertEventAdminRead]:
    ensure_admin_analytics_available()
    payload = AlertAnalyticsService.list_alert_events(db, page=page, page_size=pageSize)
    return PaginatedResponse[AlertEventAdminRead](
        data=[AlertEventAdminRead.model_validate(item) for item in payload["items"]],
        meta=PaginationMeta(page=payload["page"], page_size=payload["page_size"], total=payload["total"]),
    )
