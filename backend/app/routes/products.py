from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.product import ProductListItem, ProductRead, ProductSearchResponse
from app.services.pagination_service import PaginationService
from app.services.product_service import ProductService


router = APIRouter()


@router.get("", response_model=PaginatedResponse[ProductListItem])
def list_products(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ProductListItem]:
    products = ProductService.list_products(db)
    items, total = PaginationService.slice_items(products, page, pageSize)
    normalized_page, normalized_page_size = PaginationService.normalize(page, pageSize)
    return PaginatedResponse[ProductListItem](
        data=[ProductListItem.model_validate(product) for product in items],
        meta=PaginationMeta(page=normalized_page, page_size=normalized_page_size, total=total),
    )


@router.get("/search", response_model=ProductSearchResponse)
def search_products(
    q: str = Query(default=""),
    category: str = Query(default=""),
    storeId: str = Query(default=""),
    minPrice: Decimal | None = Query(default=None),
    maxPrice: Decimal | None = Query(default=None),
    minDiscount: int = Query(default=0, ge=0),
    sort: str = Query(default="relevance"),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=12, ge=1, le=100),
    ids: str = Query(default=""),
    db: Session = Depends(get_db),
) -> ProductSearchResponse:
    product_ids = [value for value in ids.split(",") if value] or None
    payload = ProductService.search_catalog(
        db,
        query=q,
        category=category,
        store_id=storeId,
        min_price=minPrice,
        max_price=maxPrice,
        min_discount=minDiscount,
        sort=sort,
        page=page,
        page_size=pageSize,
        product_ids=product_ids,
    )
    return ProductSearchResponse.model_validate(payload)


@router.get("/by-slug/{slug}", response_model=ProductRead)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)) -> ProductRead:
    product = ProductService.get_product_by_slug(db, slug)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return ProductRead.model_validate(product)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: str, db: Session = Depends(get_db)) -> ProductRead:
    product = ProductService.get_product_by_id(db, product_id)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return ProductRead.model_validate(product)
