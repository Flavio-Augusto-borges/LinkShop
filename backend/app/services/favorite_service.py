from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundError
from app.models.favorite import Favorite
from app.models.product import Product
from app.models.user import User


class FavoriteService:
    @staticmethod
    def list_favorites(db: Session, user: User) -> list[Favorite]:
        stmt = (
            select(Favorite)
            .where(Favorite.user_id == user.id)
            .options(joinedload(Favorite.product))
            .order_by(Favorite.created_at.desc())
        )
        return list(db.scalars(stmt).unique().all())

    @staticmethod
    def add_favorite(db: Session, user: User, product_id: str) -> Favorite:
        product = db.scalar(select(Product).where(Product.id == product_id, Product.is_active.is_(True)))

        if not product:
            raise NotFoundError("Product not found", code="PRODUCT_NOT_FOUND")

        favorite = db.scalar(
            select(Favorite).where(Favorite.user_id == user.id, Favorite.product_id == product_id)
        )

        if favorite:
            return favorite

        favorite = Favorite(user_id=user.id, product_id=product_id)
        db.add(favorite)
        db.commit()
        db.refresh(favorite)
        db.refresh(product)
        favorite.product = product
        return favorite

    @staticmethod
    def remove_favorite(db: Session, user: User, product_id: str) -> bool:
        result = db.execute(
            delete(Favorite).where(Favorite.user_id == user.id, Favorite.product_id == product_id)
        )
        db.commit()
        return result.rowcount > 0
