from datetime import datetime
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class IntegrationSyncRun(Base):
    __tablename__ = "integration_sync_runs"
    __table_args__ = (
        CheckConstraint("processed >= 0", name="integration_sync_runs_processed_non_negative"),
        CheckConstraint("created >= 0", name="integration_sync_runs_created_non_negative"),
        CheckConstraint("updated >= 0", name="integration_sync_runs_updated_non_negative"),
        CheckConstraint("unchanged >= 0", name="integration_sync_runs_unchanged_non_negative"),
        CheckConstraint("failed >= 0", name="integration_sync_runs_failed_non_negative"),
        CheckConstraint("history_created >= 0", name="integration_sync_runs_history_non_negative"),
        CheckConstraint("warning_count >= 0", name="integration_sync_runs_warning_count_non_negative"),
        CheckConstraint("error_count >= 0", name="integration_sync_runs_error_count_non_negative"),
        CheckConstraint(
            "status IN ('success', 'partial_success', 'failed')",
            name="integration_sync_runs_status_valid",
        ),
        Index("ix_integration_sync_runs_provider_started_at", "provider", "started_at"),
        Index("ix_integration_sync_runs_status_started_at", "status", "started_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    provider: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    source_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="success")
    processed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unchanged: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    history_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
