from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError
from app.core.config import settings
from app.db.session import get_db
from app.schemas.alert_evaluation import AlertEvaluationEventRead, AlertEvaluationSummary
from app.services.alert_evaluation_service import AlertEvaluationService


router = APIRouter()


@router.post("/evaluate-alerts", response_model=AlertEvaluationSummary)
def trigger_alert_evaluation(db: Session = Depends(get_db)) -> AlertEvaluationSummary:
    if not settings.app_debug:
        raise ForbiddenError("Alert evaluation trigger is only available in development mode")

    result = AlertEvaluationService.evaluate_active_watches(db)

    return AlertEvaluationSummary(
        evaluated=int(result["evaluated"]),
        triggered=int(result["triggered"]),
        events=[
            AlertEvaluationEventRead(
                watch_id=event.price_watch_id,
                product_id=event.product_id,
                offer_id=event.offer_id,
                reason=event.reason,
                status=event.status,
                message=event.message,
                current_price=event.current_price,
                target_price=event.target_price,
                previous_price=event.previous_price,
                triggered=event.triggered,
                created_at=event.created_at,
            )
            for event in result["events"]
        ],
    )
