from datetime import datetime
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CompareListItem(Base):
    __tablename__ = "compare_list_items"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_compare_list_user_product"),
        CheckConstraint("quantity > 0", name="compare_list_quantity_positive"),
        Index("ix_compare_list_user_updated_at", "user_id", "updated_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    offer_id: Mapped[str] = mapped_column(String(36), ForeignKey("offers.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="compare_list_items")
    product = relationship("Product", back_populates="compare_list_items")
    offer = relationship("Offer", back_populates="compare_list_items")
