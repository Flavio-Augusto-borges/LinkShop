from decimal import Decimal, ROUND_HALF_UP

from app.integrations.types import ExternalOfferPayload, NormalizedOfferPayload


def normalize_money(value: Decimal | None) -> Decimal | None:
    if value is None:
        return None
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def normalize_external_offer(payload: ExternalOfferPayload) -> NormalizedOfferPayload:
    return NormalizedOfferPayload(
        product_id=payload.product_id.strip(),
        store_code=payload.store_code.strip().lower(),
        external_offer_id=payload.external_offer_id.strip(),
        seller_name=payload.seller_name.strip(),
        title=payload.title.strip(),
        affiliate_url=payload.affiliate_url.strip(),
        landing_url=payload.landing_url.strip() if payload.landing_url else None,
        price=normalize_money(payload.price) or Decimal("0.00"),
        original_price=normalize_money(payload.original_price),
        currency=payload.currency.strip().upper(),
        shipping_cost=normalize_money(payload.shipping_cost),
        installment_text=payload.installment_text.strip() if payload.installment_text else None,
        availability=payload.availability.strip().lower(),
        is_featured=payload.is_featured,
        is_active=payload.is_active,
    )
