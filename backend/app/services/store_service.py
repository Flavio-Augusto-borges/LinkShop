from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.store import Store


class StoreService:
    BASE_STORES: tuple[dict[str, str], ...] = (
        {
            "id": "store-amazon",
            "code": "amazon",
            "name": "Amazon",
            "affiliate_network": "in-house",
            "base_url": "https://www.amazon.com.br/",
        },
        {
            "id": "store-mercado-livre",
            "code": "mercado-livre",
            "name": "Mercado Livre",
            "affiliate_network": "custom",
            "base_url": "https://www.mercadolivre.com.br/",
        },
        {
            "id": "store-shopee",
            "code": "shopee",
            "name": "Shopee",
            "affiliate_network": "custom",
            "base_url": "https://shopee.com.br/",
        },
    )

    @staticmethod
    def list_stores(db: Session) -> list[Store]:
        stmt = select(Store).where(Store.is_active.is_(True)).order_by(Store.name.asc())
        return list(db.scalars(stmt).all())

    @staticmethod
    def ensure_base_stores(db: Session) -> dict[str, int]:
        created = 0

        for payload in StoreService.BASE_STORES:
            store = db.scalar(select(Store).where(Store.code == payload["code"]))
            if store:
                continue

            db.add(
                Store(
                    id=payload["id"],
                    code=payload["code"],
                    name=payload["name"],
                    affiliate_network=payload["affiliate_network"],
                    base_url=payload["base_url"],
                    is_active=True,
                )
            )
            created += 1

        if created:
            db.commit()

        return {
            "created": created,
            "existing": len(StoreService.BASE_STORES) - created,
            "total": len(StoreService.BASE_STORES),
        }
