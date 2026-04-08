from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PriceWatch(Base):
    __tablename__ = "price_watches"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_price_watches_user_product"),
        CheckConstraint("last_known_price IS NULL OR last_known_price > 0", name="price_watch_last_known_positive"),
        Index("ix_price_watches_user_active", "user_id", "is_active"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_known_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    last_best_offer_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("offers.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="price_watches")
    product = relationship("Product", back_populates="price_watches")
    last_best_offer = relationship("Offer", foreign_keys=[last_best_offer_id])
    alert_config = relationship("AlertConfig", back_populates="price_watch", cascade="all, delete-orphan", uselist=False)
    alert_events = relationship("AlertEvent", back_populates="price_watch", cascade="all, delete-orphan")
