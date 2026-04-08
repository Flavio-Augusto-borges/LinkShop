from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AlertConfig(Base):
    __tablename__ = "alert_configs"
    __table_args__ = (
        UniqueConstraint("price_watch_id", name="uq_alert_configs_price_watch"),
        CheckConstraint("target_price IS NULL OR target_price > 0", name="alert_config_target_positive"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    price_watch_id: Mapped[str] = mapped_column(String(36), ForeignKey("price_watches.id"), nullable=False, index=True)
    target_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    notify_on_price_drop: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_on_new_best_offer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    price_watch = relationship("PriceWatch", back_populates="alert_config")
