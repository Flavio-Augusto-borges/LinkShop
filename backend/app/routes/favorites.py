from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.favorite import FavoriteCreate, FavoriteRead
from app.services.favorite_service import FavoriteService


router = APIRouter()


@router.get("/favorites", response_model=list[FavoriteRead])
def list_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FavoriteRead]:
    favorites = FavoriteService.list_favorites(db, current_user)
    return [FavoriteRead.model_validate(favorite) for favorite in favorites]


@router.post("/favorites", response_model=FavoriteRead, status_code=status.HTTP_201_CREATED)
def add_favorite(
    payload: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoriteRead:
    favorite = FavoriteService.add_favorite(db, current_user, payload.product_id)
    return FavoriteRead.model_validate(favorite)


@router.delete("/favorites/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    removed = FavoriteService.remove_favorite(db, current_user, product_id)

    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
