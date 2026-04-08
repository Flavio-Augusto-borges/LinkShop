from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PriceHistory(Base):
    __tablename__ = "price_history"
    __table_args__ = (
        CheckConstraint("price > 0", name="price_history_price_positive"),
        CheckConstraint(
            "original_price IS NULL OR original_price >= price",
            name="price_history_original_price_gte_price",
        ),
        CheckConstraint("shipping_cost IS NULL OR shipping_cost >= 0", name="price_history_shipping_non_negative"),
        Index("ix_price_history_product_captured_at", "product_id", "captured_at"),
        Index("ix_price_history_offer_captured_at", "offer_id", "captured_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    offer_id: Mapped[str] = mapped_column(String(36), ForeignKey("offers.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    original_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    shipping_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    availability: Mapped[str] = mapped_column(String(30), nullable=False, default="in_stock")

    product = relationship("Product", back_populates="price_history_entries")
    offer = relationship("Offer", back_populates="price_history_entries")
