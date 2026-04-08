from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ForbiddenError
from app.db.session import get_db
from app.schemas.ranking import ProductRankingPreviewRead
from app.services.offer_service import OfferService


router = APIRouter()


def ensure_admin_ranking_available() -> None:
    if not settings.app_debug:
        raise ForbiddenError("Admin ranking endpoints are only available in development mode")


@router.get("/ranking/products/{product_id}", response_model=ProductRankingPreviewRead)
def get_product_ranking_preview(product_id: str, db: Session = Depends(get_db)) -> ProductRankingPreviewRead:
    ensure_admin_ranking_available()
    payload = OfferService.get_product_ranking_preview(db, product_id=product_id)
    return ProductRankingPreviewRead.model_validate(payload)
