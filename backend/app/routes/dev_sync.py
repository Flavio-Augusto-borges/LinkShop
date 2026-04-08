from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError
from app.core.config import settings
from app.db.session import get_db
from app.schemas.offer_sync import OfferSyncSummary
from app.services.offer_sync_service import OfferSyncService


router = APIRouter()


@router.post("/sync/offers", response_model=OfferSyncSummary)
def trigger_offer_sync(
    provider: str = Query(default="mock-marketplace"),
    db: Session = Depends(get_db),
) -> OfferSyncSummary:
    if not settings.app_debug:
        raise ForbiddenError("Offer sync trigger is only available in development mode")

    summary = OfferSyncService.sync_provider(db, provider)
    return OfferSyncSummary.model_validate(summary)
