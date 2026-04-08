import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.observability import observability_registry
from app.db.session import get_db
from app.models.user import User
from app.schemas.compare_list import CompareListItemRead
from app.schemas.favorite import FavoriteRead
from app.schemas.price_watch import PriceWatchRead
from app.schemas.sync import SyncAnonymousInput, SyncAnonymousResponse
from app.services.sync_service import SyncService


router = APIRouter()
logger = logging.getLogger("linkshop.sync")


@router.post("/anonymous", response_model=SyncAnonymousResponse)
def sync_anonymous_state(
    payload: SyncAnonymousInput,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SyncAnonymousResponse:
    observability_registry.record_flow_request("sync.anonymous")
    request_id = getattr(request.state, "request_id", None)

    try:
        result = SyncService.sync_anonymous_state(db, current_user, payload)
    except Exception as exc:
        observability_registry.record_flow_failure(
            "sync.anonymous",
            message="Anonymous sync failed",
            code=getattr(exc, "code", None),
            request_id=request_id,
            context={
                "user_id": current_user.id,
                "favorites": len(payload.favorites),
                "compare_list": len(payload.compare_list),
                "price_watches": len(payload.price_watches),
            },
        )
        logger.exception(
            "event=sync.anonymous.failure user_id=%s favorites=%s compare_list=%s price_watches=%s",
            current_user.id,
            len(payload.favorites),
            len(payload.compare_list),
            len(payload.price_watches),
        )
        raise

    observability_registry.record_flow_success("sync.anonymous")
    observability_registry.record_flow_metric("sync.anonymous", "favorites_result", len(result["favorites"]))
    observability_registry.record_flow_metric("sync.anonymous", "compare_list_result", len(result["compare_list"]))
    observability_registry.record_flow_metric("sync.anonymous", "price_watches_result", len(result["price_watches"]))
    logger.info(
        "event=sync.anonymous.success user_id=%s favorites=%s compare_list=%s price_watches=%s",
        current_user.id,
        len(result["favorites"]),
        len(result["compare_list"]),
        len(result["price_watches"]),
    )

    return SyncAnonymousResponse(
        favorites=[FavoriteRead.model_validate(item) for item in result["favorites"]],
        compare_list=[CompareListItemRead.model_validate(item) for item in result["compare_list"]],
        price_watches=[PriceWatchRead.model_validate(item) for item in result["price_watches"]],
    )
