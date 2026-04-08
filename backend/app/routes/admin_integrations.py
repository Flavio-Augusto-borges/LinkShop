from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.session import get_db
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.integration_sync import IntegrationSyncRunRead
from app.services.offer_sync_service import OfferSyncService


router = APIRouter()


def ensure_admin_integrations_available() -> None:
    if not settings.app_debug:
        raise ForbiddenError("Admin integration endpoints are only available in development mode")


@router.get("/integrations/sync-runs", response_model=PaginatedResponse[IntegrationSyncRunRead])
def list_integration_sync_runs(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[IntegrationSyncRunRead]:
    ensure_admin_integrations_available()
    payload = OfferSyncService.list_sync_runs(db, page=page, page_size=pageSize)
    return PaginatedResponse[IntegrationSyncRunRead](
        data=[IntegrationSyncRunRead.model_validate(item) for item in payload["items"]],
        meta=PaginationMeta(page=payload["page"], page_size=payload["page_size"], total=payload["total"]),
    )


@router.get("/integrations/sync-runs/latest", response_model=IntegrationSyncRunRead)
def get_latest_integration_sync_run(db: Session = Depends(get_db)) -> IntegrationSyncRunRead:
    ensure_admin_integrations_available()
    latest = OfferSyncService.get_latest_sync_run(db)
    if not latest:
        raise NotFoundError("No integration sync run found", code="INTEGRATION_SYNC_RUN_NOT_FOUND")
    return IntegrationSyncRunRead.model_validate(latest)
