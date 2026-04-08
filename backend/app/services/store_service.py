from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.store import Store


class StoreService:
    @staticmethod
    def list_stores(db: Session) -> list[Store]:
        stmt = select(Store).where(Store.is_active.is_(True)).order_by(Store.name.asc())
        return list(db.scalars(stmt).all())
