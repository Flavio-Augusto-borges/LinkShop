from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.compare_list import CompareListCreate, CompareListItemRead, CompareListUpdate
from app.services.compare_list_service import CompareListService


router = APIRouter()


@router.get("/compare-list", response_model=list[CompareListItemRead])
def list_compare_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CompareListItemRead]:
    items = CompareListService.list_items(db, current_user)
    return [CompareListItemRead.model_validate(item) for item in items]


@router.post("/compare-list", response_model=CompareListItemRead, status_code=status.HTTP_201_CREATED)
def add_compare_item(
    payload: CompareListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompareListItemRead:
    item = CompareListService.add_item(
        db,
        current_user,
        product_id=payload.product_id,
        offer_id=payload.offer_id,
        quantity=payload.quantity,
    )
    return CompareListItemRead.model_validate(item)


@router.patch("/compare-list/{item_id}", response_model=CompareListItemRead)
def update_compare_item(
    item_id: str,
    payload: CompareListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompareListItemRead:
    item = CompareListService.update_quantity(db, current_user, item_id, payload.quantity)

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compare list item not found")

    return CompareListItemRead.model_validate(item)


@router.delete("/compare-list/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_compare_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    removed = CompareListService.remove_item(db, current_user, item_id)

    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compare list item not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
