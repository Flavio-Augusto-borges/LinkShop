import logging
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_optional_current_user
from app.db.session import get_db
from app.models.user import User
from app.core.observability import observability_registry
from app.services.click_event_service import ClickEventService


router = APIRouter()
logger = logging.getLogger("linkshop.redirect")


@router.get("/{offer_id}")
def redirect_to_offer(
    offer_id: str,
    request: Request,
    source: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_current_user),
) -> RedirectResponse:
    observability_registry.record_flow_request("redirect.tracking")
    request_id = getattr(request.state, "request_id", None)
    offer = ClickEventService.get_active_offer(db, offer_id)

    if not offer:
        observability_registry.record_flow_failure(
            "redirect.tracking",
            message="Offer not found for redirect",
            code="OFFER_NOT_FOUND",
            request_id=request_id,
            context={"offer_id": offer_id},
        )
        logger.warning("event=redirect.failure offer_id=%s reason=offer_not_found", offer_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )

    resolved_source = ClickEventService.resolve_source(
        source=source,
        referrer=request.headers.get("referer"),
    )

    ClickEventService.register_click(
        db,
        offer=offer,
        user=user,
        source=resolved_source,
        referrer=request.headers.get("referer"),
        user_agent=request.headers.get("user-agent"),
    )

    observability_registry.record_flow_success("redirect.tracking")
    observability_registry.record_flow_metric("redirect.tracking", "clicks_registered", 1)
    affiliate_host = urlparse(offer.affiliate_url).netloc or "unknown"
    logger.info(
        "event=redirect.success offer_id=%s product_id=%s store_id=%s user_id=%s source=%s affiliate_host=%s",
        offer.id,
        offer.product_id,
        offer.store_id,
        user.id if user else "anonymous",
        resolved_source,
        affiliate_host,
    )
    return RedirectResponse(url=offer.affiliate_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
