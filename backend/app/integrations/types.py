from decimal import Decimal

from pydantic import BaseModel, Field


class ExternalOfferPayload(BaseModel):
    product_id: str
    store_code: str
    external_offer_id: str
    seller_name: str
    title: str
    affiliate_url: str
    landing_url: str | None = None
    price: Decimal = Field(gt=0)
    original_price: Decimal | None = Field(default=None, gt=0)
    currency: str = "BRL"
    shipping_cost: Decimal | None = Field(default=None, ge=0)
    installment_text: str | None = None
    availability: str = "in_stock"
    is_featured: bool = False
    is_active: bool = True


class ProviderFetchResult(BaseModel):
    provider: str
    offers: list[ExternalOfferPayload]
    source_reference: str | None = None
    warnings: list[str] = Field(default_factory=list)


class NormalizedOfferPayload(BaseModel):
    product_id: str
    store_code: str
    external_offer_id: str
    seller_name: str
    title: str
    affiliate_url: str
    landing_url: str | None = None
    price: Decimal
    original_price: Decimal | None = None
    currency: str = "BRL"
    shipping_cost: Decimal | None = None
    installment_text: str | None = None
    availability: str = "in_stock"
    is_featured: bool = False
    is_active: bool = True


class SyncErrorEntry(BaseModel):
    stage: str
    message: str
    external_offer_id: str | None = None
    product_id: str | None = None
    store_code: str | None = None
