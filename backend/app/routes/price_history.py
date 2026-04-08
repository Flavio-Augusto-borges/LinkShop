from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.price_history import PriceHistoryResponse
from app.services.price_history_service import PriceHistoryService


router = APIRouter()


@router.get("/{product_id}/price-history", response_model=PriceHistoryResponse)
def get_price_history(
    product_id: str,
    limit: int = Query(default=30, ge=1, le=120),
    db: Session = Depends(get_db),
) -> PriceHistoryResponse:
    product, payload = PriceHistoryService.get_price_history(db, product_id, limit=limit)

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return PriceHistoryResponse.model_validate(payload)
