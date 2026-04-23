"""add integration connections

Revision ID: 0006_integration_connections
Revises: 0005_mercado_livre_catalog_v1
Create Date: 2026-04-23
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_integration_connections"
down_revision = "0005_mercado_livre_catalog_v1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "integration_connections",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("external_user_id", sa.String(length=120), nullable=True),
        sa.Column("external_user_name", sa.String(length=255), nullable=True),
        sa.Column("token_type", sa.String(length=30), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("scopes", sa.Text(), nullable=True),
        sa.Column("access_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_refreshed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error_code", sa.String(length=80), nullable=True),
        sa.Column("last_error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("char_length(provider) > 0", name="integration_connection_provider_not_blank"),
        sa.PrimaryKeyConstraint("id", name="pk_integration_connections"),
        sa.UniqueConstraint("provider", name="uq_integration_connections_provider"),
    )
    op.create_index("ix_integration_connections_provider", "integration_connections", ["provider"], unique=False)
    op.create_index(
        "ix_integration_connections_provider_status",
        "integration_connections",
        ["provider", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_integration_connections_provider_status", table_name="integration_connections")
    op.drop_index("ix_integration_connections_provider", table_name="integration_connections")
    op.drop_table("integration_connections")
