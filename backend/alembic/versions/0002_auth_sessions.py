"""add auth sessions

Revision ID: 0002_auth_sessions
Revises: 0001_baseline
Create Date: 2026-04-03
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_auth_sessions"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("refresh_token_hash", sa.String(length=255), nullable=False),
        sa.Column("refresh_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "char_length(refresh_token_hash) > 0",
            name="ck_auth_sessions_auth_session_refresh_token_hash_not_blank",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_auth_sessions_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_auth_sessions"),
        sa.UniqueConstraint("refresh_token_hash", name="uq_auth_sessions_refresh_token_hash"),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"], unique=False)
    op.create_index(
        "ix_auth_sessions_user_revoked",
        "auth_sessions",
        ["user_id", "revoked_at"],
        unique=False,
    )
    op.create_index(
        "ix_auth_sessions_refresh_expires_at",
        "auth_sessions",
        ["refresh_expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_auth_sessions_refresh_expires_at", table_name="auth_sessions")
    op.drop_index("ix_auth_sessions_user_revoked", table_name="auth_sessions")
    op.drop_index("ix_auth_sessions_user_id", table_name="auth_sessions")
    op.drop_table("auth_sessions")
