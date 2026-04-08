from datetime import datetime
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ClickEvent(Base):
    __tablename__ = "click_events"
    __table_args__ = (
        CheckConstraint("char_length(source) > 0", name="click_event_source_not_blank"),
        Index("ix_click_events_created_at", "created_at"),
        Index("ix_click_events_source_created_at", "source", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    offer_id: Mapped[str] = mapped_column(String(36), ForeignKey("offers.id"), nullable=False, index=True)
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id"), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(120), nullable=False, default="direct", index=True)
    referrer: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="click_events")
    product = relationship("Product", back_populates="click_events")
    offer = relationship("Offer", back_populates="click_events")
    store = relationship("Store", back_populates="click_events")
