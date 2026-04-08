"""add integration sync runs

Revision ID: 0003_integration_sync_runs
Revises: 0002_auth_sessions
Create Date: 2026-04-03
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_integration_sync_runs"
down_revision = "0002_auth_sessions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "integration_sync_runs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("source_reference", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("processed", sa.Integer(), nullable=False),
        sa.Column("created", sa.Integer(), nullable=False),
        sa.Column("updated", sa.Integer(), nullable=False),
        sa.Column("unchanged", sa.Integer(), nullable=False),
        sa.Column("failed", sa.Integer(), nullable=False),
        sa.Column("history_created", sa.Integer(), nullable=False),
        sa.Column("warning_count", sa.Integer(), nullable=False),
        sa.Column("error_count", sa.Integer(), nullable=False),
        sa.Column("warning_summary", sa.Text(), nullable=True),
        sa.Column("error_summary", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("processed >= 0", name="integration_sync_runs_processed_non_negative"),
        sa.CheckConstraint("created >= 0", name="integration_sync_runs_created_non_negative"),
        sa.CheckConstraint("updated >= 0", name="integration_sync_runs_updated_non_negative"),
        sa.CheckConstraint("unchanged >= 0", name="integration_sync_runs_unchanged_non_negative"),
        sa.CheckConstraint("failed >= 0", name="integration_sync_runs_failed_non_negative"),
        sa.CheckConstraint("history_created >= 0", name="integration_sync_runs_history_non_negative"),
        sa.CheckConstraint("warning_count >= 0", name="integration_sync_runs_warning_count_non_negative"),
        sa.CheckConstraint("error_count >= 0", name="integration_sync_runs_error_count_non_negative"),
        sa.CheckConstraint(
            "status IN ('success', 'partial_success', 'failed')",
            name="integration_sync_runs_status_valid",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_integration_sync_runs"),
    )
    op.create_index("ix_integration_sync_runs_provider", "integration_sync_runs", ["provider"], unique=False)
    op.create_index(
        "ix_integration_sync_runs_provider_started_at",
        "integration_sync_runs",
        ["provider", "started_at"],
        unique=False,
    )
    op.create_index(
        "ix_integration_sync_runs_status_started_at",
        "integration_sync_runs",
        ["status", "started_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_integration_sync_runs_status_started_at", table_name="integration_sync_runs")
    op.drop_index("ix_integration_sync_runs_provider_started_at", table_name="integration_sync_runs")
    op.drop_index("ix_integration_sync_runs_provider", table_name="integration_sync_runs")
    op.drop_table("integration_sync_runs")
