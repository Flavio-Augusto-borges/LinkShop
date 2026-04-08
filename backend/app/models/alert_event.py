from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AlertEvent(Base):
    __tablename__ = "alert_events"
    __table_args__ = (
        CheckConstraint("current_price IS NULL OR current_price > 0", name="alert_event_current_price_positive"),
        CheckConstraint("target_price IS NULL OR target_price > 0", name="alert_event_target_price_positive"),
        CheckConstraint("previous_price IS NULL OR previous_price > 0", name="alert_event_previous_price_positive"),
        Index("ix_alert_events_reason_created_at", "reason", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    price_watch_id: Mapped[str] = mapped_column(String(36), ForeignKey("price_watches.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    offer_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("offers.id"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="triggered")
    reason: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    current_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    target_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    previous_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    triggered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    price_watch = relationship("PriceWatch", back_populates="alert_events")
    user = relationship("User", back_populates="alert_events")
    product = relationship("Product", back_populates="alert_events")
    offer = relationship("Offer", back_populates="alert_events")
