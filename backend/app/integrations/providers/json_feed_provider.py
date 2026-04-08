import json
from pathlib import Path

from pydantic import ValidationError

from app.core.config import settings
from app.core.exceptions import BusinessRuleError
from app.integrations.providers.base import BaseMarketplaceProvider
from app.integrations.types import ExternalOfferPayload, ProviderFetchResult


class JsonFeedProvider(BaseMarketplaceProvider):
    provider_name = "json-feed"

    def fetch_offers(self) -> ProviderFetchResult:
        feed_path = Path(settings.integration_json_feed_path)

        if not feed_path.is_absolute():
            feed_path = Path.cwd() / feed_path

        if not feed_path.exists():
            raise BusinessRuleError(
                f"JSON feed file not found at '{feed_path}'",
                code="JSON_FEED_NOT_FOUND",
            )

        try:
            raw_payload = json.loads(feed_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise BusinessRuleError("JSON feed is not valid JSON", code="JSON_FEED_INVALID") from exc

        if not isinstance(raw_payload, dict):
            raise BusinessRuleError("JSON feed root must be an object", code="JSON_FEED_INVALID")

        raw_offers = raw_payload.get("offers", [])
        warnings = raw_payload.get("warnings", [])

        if not isinstance(raw_offers, list):
            raise BusinessRuleError("JSON feed field 'offers' must be a list", code="JSON_FEED_INVALID")

        offers: list[ExternalOfferPayload] = []

        for item in raw_offers:
            try:
                offers.append(ExternalOfferPayload.model_validate(item))
            except ValidationError as exc:
                raise BusinessRuleError(
                    f"Invalid offer payload in JSON feed: {exc.errors()[0]['msg']}",
                    code="JSON_FEED_ITEM_INVALID",
                ) from exc

        normalized_warnings = [str(entry) for entry in warnings if entry]
        source_reference = str(feed_path)

        return ProviderFetchResult(
            provider=self.provider_name,
            offers=offers,
            source_reference=source_reference,
            warnings=normalized_warnings,
        )
