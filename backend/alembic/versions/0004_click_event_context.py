"""add click event context fields

Revision ID: 0004_click_event_context
Revises: 0003_integration_sync_runs
Create Date: 2026-04-18
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_click_event_context"
down_revision = "0003_integration_sync_runs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("click_events", sa.Column("position", sa.Integer(), nullable=True))
    op.add_column("click_events", sa.Column("category", sa.String(length=120), nullable=True))
    op.add_column("click_events", sa.Column("search_term", sa.String(length=255), nullable=True))
    op.add_column("click_events", sa.Column("section_type", sa.String(length=120), nullable=True))

    op.create_index("ix_click_events_category", "click_events", ["category"], unique=False)
    op.create_index("ix_click_events_section_type", "click_events", ["section_type"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_click_events_section_type", table_name="click_events")
    op.drop_index("ix_click_events_category", table_name="click_events")

    op.drop_column("click_events", "section_type")
    op.drop_column("click_events", "search_term")
    op.drop_column("click_events", "category")
    op.drop_column("click_events", "position")
