from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.offer import Offer
from app.models.product import Product
from app.models.store import Store
from app.services.offer_ranking_service import OfferRankingService


def calculate_discount_percentage(price: Decimal, original_price: Decimal | None) -> int:
    if original_price is None or original_price <= 0 or original_price <= price:
        return 0

    return int(round(((original_price - price) / original_price) * 100))


class ProductService:
    @staticmethod
    def list_products(db: Session) -> list[Product]:
        stmt = (
            select(Product)
            .where(Product.is_active.is_(True))
            .order_by(Product.popularity_score.desc(), Product.name.asc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_product_by_id(db: Session, product_id: str) -> Product | None:
        stmt = (
            select(Product)
            .where(Product.id == product_id, Product.is_active.is_(True))
            .options(selectinload(Product.offers).selectinload(Offer.store))
        )
        product = db.scalar(stmt)
        if product:
            active_offers = [offer for offer in product.offers if offer.is_active]
            inactive_offers = [offer for offer in product.offers if not offer.is_active]
            product.offers = OfferRankingService.rank_offers(active_offers) + inactive_offers
        return product

    @staticmethod
    def get_product_by_slug(db: Session, slug: str) -> Product | None:
        stmt = (
            select(Product)
            .where(Product.slug == slug, Product.is_active.is_(True))
            .options(selectinload(Product.offers).selectinload(Offer.store))
        )
        product = db.scalar(stmt)
        if product:
            active_offers = [offer for offer in product.offers if offer.is_active]
            inactive_offers = [offer for offer in product.offers if not offer.is_active]
            product.offers = OfferRankingService.rank_offers(active_offers) + inactive_offers
        return product

    @staticmethod
    def search_catalog(
        db: Session,
        *,
        query: str = "",
        category: str = "",
        store_id: str = "",
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        min_discount: int = 0,
        sort: str = "relevance",
        page: int = 1,
        page_size: int = 12,
        product_ids: list[str] | None = None,
    ) -> dict:
        stmt = (
            select(Product)
            .where(Product.is_active.is_(True))
            .options(selectinload(Product.offers).selectinload(Offer.store))
        )

        if product_ids:
            stmt = stmt.where(Product.id.in_(product_ids))

        products = list(db.scalars(stmt).unique().all())
        items = [ProductService._build_catalog_item(product) for product in products]
        filtered_items = ProductService._filter_catalog_items(
            items,
            query=query,
            category=category,
            store_id=store_id,
            min_price=min_price,
            max_price=max_price,
            min_discount=min_discount,
        )
        sorted_items = ProductService._sort_catalog_items(filtered_items, sort)

        start_index = max((page - 1) * page_size, 0)
        paginated_items = sorted_items[start_index : start_index + page_size]
        available_categories = sorted({product.category for product in products})
        available_stores = list(
            db.scalars(select(Store).where(Store.is_active.is_(True)).order_by(Store.name.asc())).all()
        )

        return {
            "items": paginated_items,
            "total": len(filtered_items),
            "page": page,
            "page_size": page_size,
            "available_categories": available_categories,
            "available_stores": available_stores,
        }

    @staticmethod
    def _build_catalog_item(product: Product) -> dict:
        offers = OfferRankingService.rank_offers([offer for offer in product.offers if offer.is_active])
        lowest_price = min((offer.price for offer in offers), default=Decimal("0.00"))
        highest_price = max((offer.price for offer in offers), default=Decimal("0.00"))
        best_offer = offers[0] if offers else None
        best_offer_score = float(getattr(best_offer, "ranking_score", 0.0)) if best_offer else None
        best_offer_reason = str(getattr(best_offer, "ranking_reason", "")) if best_offer else None
        best_discount_percentage = max(
            [calculate_discount_percentage(offer.price, offer.original_price) for offer in offers] or [0]
        )

        return {
            "product": product,
            "offers": offers,
            "best_offer": best_offer,
            "lowest_price": lowest_price,
            "highest_price": highest_price,
            "best_offer_score": best_offer_score,
            "best_offer_reason": best_offer_reason,
            "best_discount_percentage": best_discount_percentage,
            "store_ids": list(dict.fromkeys(offer.store.code for offer in offers)),
        }

    @staticmethod
    def _filter_catalog_items(
        items: list[dict],
        *,
        query: str,
        category: str,
        store_id: str,
        min_price: Decimal | None,
        max_price: Decimal | None,
        min_discount: int,
    ) -> list[dict]:
        normalized_query = query.strip().lower()
        filtered_items: list[dict] = []

        for item in items:
            product = item["product"]
            haystack = " ".join([product.name, product.brand, product.category]).lower()

            matches_query = not normalized_query or normalized_query in haystack
            matches_category = not category or product.category == category
            matches_store = not store_id or store_id in item["store_ids"]
            matches_min_price = min_price is None or item["lowest_price"] >= min_price
            matches_max_price = max_price is None or item["lowest_price"] <= max_price
            matches_discount = item["best_discount_percentage"] >= min_discount

            if (
                matches_query
                and matches_category
                and matches_store
                and matches_min_price
                and matches_max_price
                and matches_discount
            ):
                filtered_items.append(item)

        return filtered_items

    @staticmethod
    def _sort_catalog_items(items: list[dict], sort: str) -> list[dict]:
        def relevance_score(item: dict) -> int:
            return (
                item["product"].popularity_score
                + len(item["offers"]) * 5
                + item["best_discount_percentage"]
                + int(item.get("best_offer_score") or 0)
            )

        if sort == "lowest-price":
            return sorted(items, key=lambda item: (item["lowest_price"], -item["product"].popularity_score))
        if sort == "highest-price":
            return sorted(items, key=lambda item: (-item["lowest_price"], -item["product"].popularity_score))
        if sort == "best-discount":
            return sorted(items, key=lambda item: (-item["best_discount_percentage"], item["lowest_price"]))
        if sort == "popularity":
            return sorted(items, key=lambda item: (-item["product"].popularity_score, item["lowest_price"]))

        return sorted(items, key=lambda item: (-relevance_score(item), item["lowest_price"]))
