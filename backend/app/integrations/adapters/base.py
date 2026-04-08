from abc import ABC, abstractmethod

from app.integrations.types import ExternalOfferPayload, NormalizedOfferPayload


class BaseOfferAdapter(ABC):
    @abstractmethod
    def normalize(self, payload: ExternalOfferPayload) -> NormalizedOfferPayload:
        raise NotImplementedError
