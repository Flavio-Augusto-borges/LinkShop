from decimal import Decimal

from app.integrations.providers.base import BaseMarketplaceProvider
from app.integrations.types import ExternalOfferPayload, ProviderFetchResult


class MockMarketplaceProvider(BaseMarketplaceProvider):
    provider_name = "mock-marketplace"

    def fetch_offers(self) -> ProviderFetchResult:
        return ProviderFetchResult(
            provider=self.provider_name,
            source_reference="memory://mock-marketplace",
            offers=[
                ExternalOfferPayload(
                    product_id="product-iphone-15-128",
                    store_code="amazon",
                    external_offer_id="iphone15-amz",
                    seller_name="Amazon Brasil",
                    title="Apple iPhone 15 128GB",
                    affiliate_url="https://www.amazon.com.br/",
                    landing_url="https://www.amazon.com.br/",
                    price=Decimal("4349.00"),
                    original_price=Decimal("4699.00"),
                    shipping_cost=Decimal("0.00"),
                    installment_text="10x sem juros",
                    availability="in_stock",
                    is_featured=True,
                ),
                ExternalOfferPayload(
                    product_id="product-iphone-15-128",
                    store_code="mercado-livre",
                    external_offer_id="iphone15-ml",
                    seller_name="Loja Oficial Apple",
                    title="iPhone 15 128GB Apple",
                    affiliate_url="https://www.mercadolivre.com.br/",
                    landing_url="https://www.mercadolivre.com.br/",
                    price=Decimal("4299.00"),
                    original_price=Decimal("4599.00"),
                    shipping_cost=Decimal("0.00"),
                    installment_text="12x de R$ 358,25",
                    availability="in_stock",
                    is_featured=True,
                ),
                ExternalOfferPayload(
                    product_id="product-galaxy-s24-256",
                    store_code="amazon",
                    external_offer_id="galaxys24-amz",
                    seller_name="Amazon Brasil",
                    title="Samsung Galaxy S24 256GB",
                    affiliate_url="https://www.amazon.com.br/",
                    landing_url="https://www.amazon.com.br/",
                    price=Decimal("3559.00"),
                    original_price=Decimal("4099.00"),
                    shipping_cost=Decimal("0.00"),
                    installment_text="10x sem juros",
                    availability="in_stock",
                    is_featured=True,
                ),
                ExternalOfferPayload(
                    product_id="product-galaxy-s24-256",
                    store_code="shopee",
                    external_offer_id="galaxys24-shp",
                    seller_name="Samsung Oficial",
                    title="Galaxy S24 256GB Samsung",
                    affiliate_url="https://shopee.com.br/",
                    landing_url="https://shopee.com.br/",
                    price=Decimal("3479.00"),
                    original_price=Decimal("3959.00"),
                    shipping_cost=Decimal("12.90"),
                    installment_text="Parcelamento via cartao",
                    availability="low_stock",
                    is_featured=False,
                ),
            ],
        )
