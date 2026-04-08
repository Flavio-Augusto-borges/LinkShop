from app.integrations.adapters.base import BaseOfferAdapter
from app.integrations.adapters.normalizer import normalize_external_offer
from app.integrations.types import ExternalOfferPayload, NormalizedOfferPayload


class MockMarketplaceAdapter(BaseOfferAdapter):
    def normalize(self, payload: ExternalOfferPayload) -> NormalizedOfferPayload:
        return normalize_external_offer(payload)
