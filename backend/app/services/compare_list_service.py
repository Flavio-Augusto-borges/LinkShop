from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.compare_list_item import CompareListItem
from app.models.offer import Offer
from app.models.product import Product
from app.models.user import User


class CompareListService:
    @staticmethod
    def list_items(db: Session, user: User) -> list[CompareListItem]:
        stmt = (
            select(CompareListItem)
            .where(CompareListItem.user_id == user.id)
            .options(
                joinedload(CompareListItem.product),
                joinedload(CompareListItem.offer).joinedload(Offer.store),
            )
            .order_by(CompareListItem.updated_at.desc())
        )
        return list(db.scalars(stmt).unique().all())

    @staticmethod
    def add_item(db: Session, user: User, product_id: str, offer_id: str, quantity: int) -> CompareListItem:
        product = db.scalar(select(Product).where(Product.id == product_id, Product.is_active.is_(True)))
        offer = db.scalar(select(Offer).where(Offer.id == offer_id, Offer.is_active.is_(True)))

        if not product:
            raise NotFoundError("Product not found", code="PRODUCT_NOT_FOUND")

        if not offer:
            raise NotFoundError("Offer not found", code="OFFER_NOT_FOUND")

        if offer.product_id != product_id:
            raise BusinessRuleError("Offer does not belong to product", code="OFFER_PRODUCT_MISMATCH")

        item = db.scalar(
            select(CompareListItem).where(
                CompareListItem.user_id == user.id,
                CompareListItem.product_id == product_id,
            )
        )

        if item:
            item.offer_id = offer_id
            item.quantity = quantity
            db.commit()
            db.refresh(item)
        else:
            item = CompareListItem(
                user_id=user.id,
                product_id=product_id,
                offer_id=offer_id,
                quantity=quantity,
            )
            db.add(item)
            db.commit()
            db.refresh(item)

        return db.scalar(
            select(CompareListItem)
            .where(CompareListItem.id == item.id)
            .options(
                joinedload(CompareListItem.product),
                joinedload(CompareListItem.offer).joinedload(Offer.store),
            )
        )

    @staticmethod
    def update_quantity(db: Session, user: User, item_id: str, quantity: int) -> CompareListItem | None:
        item = db.scalar(
            select(CompareListItem)
            .where(CompareListItem.id == item_id, CompareListItem.user_id == user.id)
        )

        if not item:
            return None

        item.quantity = quantity
        db.commit()
        db.refresh(item)

        return db.scalar(
            select(CompareListItem)
            .where(CompareListItem.id == item.id)
            .options(
                joinedload(CompareListItem.product),
                joinedload(CompareListItem.offer).joinedload(Offer.store),
            )
        )

    @staticmethod
    def remove_item(db: Session, user: User, item_id: str) -> bool:
        item = db.scalar(
            select(CompareListItem)
            .where(CompareListItem.id == item_id, CompareListItem.user_id == user.id)
        )

        if not item:
            return False

        db.delete(item)
        db.commit()
        return True
