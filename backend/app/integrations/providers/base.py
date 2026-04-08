from abc import ABC, abstractmethod

from app.integrations.types import ProviderFetchResult


class BaseMarketplaceProvider(ABC):
    provider_name: str

    @abstractmethod
    def fetch_offers(self) -> ProviderFetchResult:
        raise NotImplementedError
