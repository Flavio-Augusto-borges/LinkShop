from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Store(Base):
    __tablename__ = "stores"
    __table_args__ = (
        CheckConstraint("char_length(code) > 0", name="store_code_not_blank"),
        Index("ix_stores_active_name", "is_active", "name"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    code: Mapped[str] = mapped_column(String(60), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    affiliate_network: Mapped[str] = mapped_column(String(60), nullable=False, default="custom")
    base_url: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    offers = relationship("Offer", back_populates="store")
    click_events = relationship("ClickEvent", back_populates="store")
