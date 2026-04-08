"""baseline schema

Revision ID: 0001_baseline
Revises: None
Create Date: 2026-04-02
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("brand", sa.String(length=120), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=False),
        sa.Column("popularity_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("popularity_score >= 0", name="ck_products_product_popularity_non_negative"),
        sa.PrimaryKeyConstraint("id", name="pk_products"),
    )
    op.create_index("ix_products_slug", "products", ["slug"], unique=True)
    op.create_index("ix_products_name", "products", ["name"], unique=False)
    op.create_index("ix_products_brand", "products", ["brand"], unique=False)
    op.create_index("ix_products_category", "products", ["category"], unique=False)
    op.create_index("ix_products_active_popularity", "products", ["is_active", "popularity_score"], unique=False)

    op.create_table(
        "stores",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("code", sa.String(length=60), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("affiliate_network", sa.String(length=60), nullable=False, server_default="custom"),
        sa.Column("base_url", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("char_length(code) > 0", name="ck_stores_store_code_not_blank"),
        sa.PrimaryKeyConstraint("id", name="pk_stores"),
    )
    op.create_index("ix_stores_code", "stores", ["code"], unique=True)
    op.create_index("ix_stores_active_name", "stores", ["is_active", "name"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("role IN ('user', 'admin')", name="ck_users_user_role_valid"),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "offers",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("store_id", sa.String(length=36), nullable=False),
        sa.Column("external_offer_id", sa.String(length=120), nullable=True),
        sa.Column("seller_name", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("affiliate_url", sa.Text(), nullable=False),
        sa.Column("landing_url", sa.Text(), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("original_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="BRL"),
        sa.Column("shipping_cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("installment_text", sa.String(length=120), nullable=True),
        sa.Column("availability", sa.String(length=30), nullable=False, server_default="in_stock"),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("price > 0", name="ck_offers_offer_price_positive"),
        sa.CheckConstraint(
            "original_price IS NULL OR original_price >= price",
            name="ck_offers_offer_original_price_gte_price",
        ),
        sa.CheckConstraint("shipping_cost IS NULL OR shipping_cost >= 0", name="ck_offers_offer_shipping_non_negative"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_offers_product_id_products"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], name="fk_offers_store_id_stores"),
        sa.PrimaryKeyConstraint("id", name="pk_offers"),
        sa.UniqueConstraint("store_id", "external_offer_id", name="uq_offers_store_external_offer"),
    )
    op.create_index("ix_offers_product_id", "offers", ["product_id"], unique=False)
    op.create_index("ix_offers_store_id", "offers", ["store_id"], unique=False)
    op.create_index("ix_offers_price", "offers", ["price"], unique=False)
    op.create_index("ix_offers_product_active_price", "offers", ["product_id", "is_active", "price"], unique=False)

    op.create_table(
        "favorites",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_favorites_product_id_products"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_favorites_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_favorites"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_favorites_user_product"),
    )
    op.create_index("ix_favorites_user_id", "favorites", ["user_id"], unique=False)
    op.create_index("ix_favorites_product_id", "favorites", ["product_id"], unique=False)
    op.create_index("ix_favorites_user_created_at", "favorites", ["user_id", "created_at"], unique=False)

    op.create_table(
        "compare_list_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("offer_id", sa.String(length=36), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("quantity > 0", name="ck_compare_list_items_compare_list_quantity_positive"),
        sa.ForeignKeyConstraint(["offer_id"], ["offers.id"], name="fk_compare_list_items_offer_id_offers"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_compare_list_items_product_id_products"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_compare_list_items_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_compare_list_items"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_compare_list_user_product"),
    )
    op.create_index("ix_compare_list_items_user_id", "compare_list_items", ["user_id"], unique=False)
    op.create_index("ix_compare_list_items_product_id", "compare_list_items", ["product_id"], unique=False)
    op.create_index("ix_compare_list_items_offer_id", "compare_list_items", ["offer_id"], unique=False)
    op.create_index("ix_compare_list_user_updated_at", "compare_list_items", ["user_id", "updated_at"], unique=False)

    op.create_table(
        "price_history",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("offer_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("original_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("shipping_cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("availability", sa.String(length=30), nullable=False, server_default="in_stock"),
        sa.CheckConstraint("price > 0", name="ck_price_history_price_history_price_positive"),
        sa.CheckConstraint(
            "original_price IS NULL OR original_price >= price",
            name="ck_price_history_price_history_original_price_gte_price",
        ),
        sa.CheckConstraint(
            "shipping_cost IS NULL OR shipping_cost >= 0",
            name="ck_price_history_price_history_shipping_non_negative",
        ),
        sa.ForeignKeyConstraint(["offer_id"], ["offers.id"], name="fk_price_history_offer_id_offers"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_price_history_product_id_products"),
        sa.PrimaryKeyConstraint("id", name="pk_price_history"),
    )
    op.create_index("ix_price_history_captured_at", "price_history", ["captured_at"], unique=False)
    op.create_index("ix_price_history_offer_id", "price_history", ["offer_id"], unique=False)
    op.create_index("ix_price_history_product_id", "price_history", ["product_id"], unique=False)
    op.create_index("ix_price_history_product_captured_at", "price_history", ["product_id", "captured_at"], unique=False)
    op.create_index("ix_price_history_offer_captured_at", "price_history", ["offer_id", "captured_at"], unique=False)

    op.create_table(
        "click_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("offer_id", sa.String(length=36), nullable=False),
        sa.Column("store_id", sa.String(length=36), nullable=False),
        sa.Column("source", sa.String(length=120), nullable=False, server_default="direct"),
        sa.Column("referrer", sa.Text(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("char_length(source) > 0", name="ck_click_events_click_event_source_not_blank"),
        sa.ForeignKeyConstraint(["offer_id"], ["offers.id"], name="fk_click_events_offer_id_offers"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_click_events_product_id_products"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], name="fk_click_events_store_id_stores"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_click_events_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_click_events"),
    )
    op.create_index("ix_click_events_user_id", "click_events", ["user_id"], unique=False)
    op.create_index("ix_click_events_product_id", "click_events", ["product_id"], unique=False)
    op.create_index("ix_click_events_offer_id", "click_events", ["offer_id"], unique=False)
    op.create_index("ix_click_events_store_id", "click_events", ["store_id"], unique=False)
    op.create_index("ix_click_events_source", "click_events", ["source"], unique=False)
    op.create_index("ix_click_events_created_at", "click_events", ["created_at"], unique=False)
    op.create_index("ix_click_events_source_created_at", "click_events", ["source", "created_at"], unique=False)

    op.create_table(
        "price_watches",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_known_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("last_best_offer_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "last_known_price IS NULL OR last_known_price > 0",
            name="ck_price_watches_price_watch_last_known_positive",
        ),
        sa.ForeignKeyConstraint(["last_best_offer_id"], ["offers.id"], name="fk_price_watches_last_best_offer_id_offers"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_price_watches_product_id_products"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_price_watches_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_price_watches"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_price_watches_user_product"),
    )
    op.create_index("ix_price_watches_user_id", "price_watches", ["user_id"], unique=False)
    op.create_index("ix_price_watches_product_id", "price_watches", ["product_id"], unique=False)
    op.create_index("ix_price_watches_last_best_offer_id", "price_watches", ["last_best_offer_id"], unique=False)
    op.create_index("ix_price_watches_user_active", "price_watches", ["user_id", "is_active"], unique=False)

    op.create_table(
        "alert_configs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("price_watch_id", sa.String(length=36), nullable=False),
        sa.Column("target_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("notify_on_price_drop", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("notify_on_new_best_offer", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("target_price IS NULL OR target_price > 0", name="ck_alert_configs_alert_config_target_positive"),
        sa.ForeignKeyConstraint(["price_watch_id"], ["price_watches.id"], name="fk_alert_configs_price_watch_id_price_watches"),
        sa.PrimaryKeyConstraint("id", name="pk_alert_configs"),
        sa.UniqueConstraint("price_watch_id", name="uq_alert_configs_price_watch"),
    )
    op.create_index("ix_alert_configs_price_watch_id", "alert_configs", ["price_watch_id"], unique=False)

    op.create_table(
        "alert_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("price_watch_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("offer_id", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="triggered"),
        sa.Column("reason", sa.String(length=50), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("current_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("target_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("previous_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("triggered", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "current_price IS NULL OR current_price > 0",
            name="ck_alert_events_alert_event_current_price_positive",
        ),
        sa.CheckConstraint(
            "target_price IS NULL OR target_price > 0",
            name="ck_alert_events_alert_event_target_price_positive",
        ),
        sa.CheckConstraint(
            "previous_price IS NULL OR previous_price > 0",
            name="ck_alert_events_alert_event_previous_price_positive",
        ),
        sa.ForeignKeyConstraint(["offer_id"], ["offers.id"], name="fk_alert_events_offer_id_offers"),
        sa.ForeignKeyConstraint(["price_watch_id"], ["price_watches.id"], name="fk_alert_events_price_watch_id_price_watches"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_alert_events_product_id_products"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_alert_events_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_alert_events"),
    )
    op.create_index("ix_alert_events_price_watch_id", "alert_events", ["price_watch_id"], unique=False)
    op.create_index("ix_alert_events_user_id", "alert_events", ["user_id"], unique=False)
    op.create_index("ix_alert_events_product_id", "alert_events", ["product_id"], unique=False)
    op.create_index("ix_alert_events_offer_id", "alert_events", ["offer_id"], unique=False)
    op.create_index("ix_alert_events_reason", "alert_events", ["reason"], unique=False)
    op.create_index("ix_alert_events_reason_created_at", "alert_events", ["reason", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_alert_events_reason_created_at", table_name="alert_events")
    op.drop_index("ix_alert_events_reason", table_name="alert_events")
    op.drop_index("ix_alert_events_offer_id", table_name="alert_events")
    op.drop_index("ix_alert_events_product_id", table_name="alert_events")
    op.drop_index("ix_alert_events_user_id", table_name="alert_events")
    op.drop_index("ix_alert_events_price_watch_id", table_name="alert_events")
    op.drop_table("alert_events")

    op.drop_index("ix_alert_configs_price_watch_id", table_name="alert_configs")
    op.drop_table("alert_configs")

    op.drop_index("ix_price_watches_user_active", table_name="price_watches")
    op.drop_index("ix_price_watches_last_best_offer_id", table_name="price_watches")
    op.drop_index("ix_price_watches_product_id", table_name="price_watches")
    op.drop_index("ix_price_watches_user_id", table_name="price_watches")
    op.drop_table("price_watches")

    op.drop_index("ix_click_events_source_created_at", table_name="click_events")
    op.drop_index("ix_click_events_created_at", table_name="click_events")
    op.drop_index("ix_click_events_source", table_name="click_events")
    op.drop_index("ix_click_events_store_id", table_name="click_events")
    op.drop_index("ix_click_events_offer_id", table_name="click_events")
    op.drop_index("ix_click_events_product_id", table_name="click_events")
    op.drop_index("ix_click_events_user_id", table_name="click_events")
    op.drop_table("click_events")

    op.drop_index("ix_price_history_offer_captured_at", table_name="price_history")
    op.drop_index("ix_price_history_product_captured_at", table_name="price_history")
    op.drop_index("ix_price_history_product_id", table_name="price_history")
    op.drop_index("ix_price_history_offer_id", table_name="price_history")
    op.drop_index("ix_price_history_captured_at", table_name="price_history")
    op.drop_table("price_history")

    op.drop_index("ix_compare_list_user_updated_at", table_name="compare_list_items")
    op.drop_index("ix_compare_list_items_offer_id", table_name="compare_list_items")
    op.drop_index("ix_compare_list_items_product_id", table_name="compare_list_items")
    op.drop_index("ix_compare_list_items_user_id", table_name="compare_list_items")
    op.drop_table("compare_list_items")

    op.drop_index("ix_favorites_user_created_at", table_name="favorites")
    op.drop_index("ix_favorites_product_id", table_name="favorites")
    op.drop_index("ix_favorites_user_id", table_name="favorites")
    op.drop_table("favorites")

    op.drop_index("ix_offers_product_active_price", table_name="offers")
    op.drop_index("ix_offers_price", table_name="offers")
    op.drop_index("ix_offers_store_id", table_name="offers")
    op.drop_index("ix_offers_product_id", table_name="offers")
    op.drop_table("offers")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_stores_active_name", table_name="stores")
    op.drop_index("ix_stores_code", table_name="stores")
    op.drop_table("stores")

    op.drop_index("ix_products_active_popularity", table_name="products")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_index("ix_products_brand", table_name="products")
    op.drop_index("ix_products_name", table_name="products")
    op.drop_index("ix_products_slug", table_name="products")
    op.drop_table("products")
