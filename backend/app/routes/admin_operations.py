from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ForbiddenError
from app.db.session import get_db
from app.schemas.operations import AdminOperationalSummaryRead
from app.services.operational_diagnostics_service import OperationalDiagnosticsService


router = APIRouter()


def ensure_admin_operations_available() -> None:
    if not settings.app_debug:
        raise ForbiddenError("Admin operational endpoints are only available in development mode")


@router.get("/operations/summary", response_model=AdminOperationalSummaryRead)
def get_operational_summary(db: Session = Depends(get_db)) -> AdminOperationalSummaryRead:
    ensure_admin_operations_available()
    payload = OperationalDiagnosticsService.get_summary(db)
    return AdminOperationalSummaryRead.model_validate(payload)
