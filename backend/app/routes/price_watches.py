from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.price_watch import PriceWatchCreate, PriceWatchRead, PriceWatchUpdate
from app.services.price_watch_service import PriceWatchService


router = APIRouter()


@router.get("/price-watches", response_model=list[PriceWatchRead])
def list_price_watches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PriceWatchRead]:
    watches = PriceWatchService.list_watches(db, current_user)
    return [PriceWatchRead.model_validate(watch) for watch in watches]


@router.post("/price-watches", response_model=PriceWatchRead, status_code=status.HTTP_201_CREATED)
def create_price_watch(
    payload: PriceWatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PriceWatchRead:
    watch = PriceWatchService.create_watch(
        db,
        current_user,
        product_id=payload.product_id,
        target_price=payload.target_price,
        notify_on_price_drop=payload.notify_on_price_drop,
        notify_on_new_best_offer=payload.notify_on_new_best_offer,
    )
    return PriceWatchRead.model_validate(watch)


@router.patch("/price-watches/{watch_id}", response_model=PriceWatchRead)
def update_price_watch(
    watch_id: str,
    payload: PriceWatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PriceWatchRead:
    updates = payload.model_dump(exclude_unset=True)
    watch = PriceWatchService.update_watch(
        db,
        current_user,
        watch_id,
        updates=updates,
    )

    if not watch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price watch not found")

    return PriceWatchRead.model_validate(watch)


@router.delete("/price-watches/{watch_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_price_watch(
    watch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    removed = PriceWatchService.remove_watch(db, current_user, watch_id)

    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price watch not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
