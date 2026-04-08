from dataclasses import dataclass

from app.integrations.adapters.base import BaseOfferAdapter
from app.integrations.adapters.json_feed_adapter import JsonFeedAdapter
from app.integrations.adapters.mock_marketplace_adapter import MockMarketplaceAdapter
from app.integrations.providers.base import BaseMarketplaceProvider
from app.integrations.providers.json_feed_provider import JsonFeedProvider
from app.integrations.providers.mock_marketplace_provider import MockMarketplaceProvider


@dataclass(frozen=True)
class RegisteredIntegration:
    provider: BaseMarketplaceProvider
    adapter: BaseOfferAdapter


integration_registry: dict[str, RegisteredIntegration] = {
    MockMarketplaceProvider.provider_name: RegisteredIntegration(
        provider=MockMarketplaceProvider(),
        adapter=MockMarketplaceAdapter(),
    ),
    JsonFeedProvider.provider_name: RegisteredIntegration(
        provider=JsonFeedProvider(),
        adapter=JsonFeedAdapter(),
    )
}
