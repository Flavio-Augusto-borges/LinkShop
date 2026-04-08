from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.click_event import ClickEvent
from app.models.offer import Offer
from app.models.user import User


class ClickEventService:
    @staticmethod
    def resolve_source(*, source: str | None, referrer: str | None) -> str:
        if source and source.strip():
            return source.strip().lower()

        if referrer:
            parsed = urlparse(referrer)
            if parsed.netloc:
                return parsed.netloc.lower()

        return "direct"

    @staticmethod
    def get_active_offer(db: Session, offer_id: str) -> Offer | None:
        stmt = (
            select(Offer)
            .where(Offer.id == offer_id, Offer.is_active.is_(True))
            .options(joinedload(Offer.product), joinedload(Offer.store))
        )
        return db.scalar(stmt)

    @staticmethod
    def register_click(
        db: Session,
        *,
        offer: Offer,
        user: User | None,
        source: str,
        referrer: str | None,
        user_agent: str | None,
    ) -> ClickEvent:
        event = ClickEvent(
            user_id=user.id if user else None,
            product_id=offer.product_id,
            offer_id=offer.id,
            store_id=offer.store_id,
            source=source,
            referrer=referrer,
            user_agent=user_agent,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
