from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.offer import OfferRead
from app.services.offer_service import OfferService


router = APIRouter()


@router.get("", response_model=list[OfferRead])
def list_offers(
    productId: str | None = Query(default=None, alias="productId"),
    db: Session = Depends(get_db),
) -> list[OfferRead]:
    offers = OfferService.list_offers(db, product_id=productId)
    return [OfferRead.model_validate(offer) for offer in offers]
