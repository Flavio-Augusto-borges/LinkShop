from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.store import StoreRead
from app.services.store_service import StoreService


router = APIRouter()


@router.get("", response_model=list[StoreRead])
def list_stores(db: Session = Depends(get_db)) -> list[StoreRead]:
    stores = StoreService.list_stores(db)
    return [StoreRead.model_validate(store) for store in stores]
