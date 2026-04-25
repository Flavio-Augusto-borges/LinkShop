from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from app.models.offer import Offer


@dataclass(frozen=True)
class RankedOffer:
    offer: Offer
    ranking_score: float
    quality_score: float
    reason: str
    breakdown: dict[str, float]


class OfferRankingService:
    WEIGHTS = {
        "price": 0.38,
        "discount": 0.18,
        "shipping": 0.10,
        "availability": 0.16,
        "freshness": 0.10,
        "store_reliability": 0.06,
        "completeness": 0.02,
    }

    AVAILABILITY_SCORE = {
        "in_stock": 100.0,
        "low_stock": 70.0,
        "out_of_stock": 0.0,
    }

    AVAILABILITY_PENALTY = {
        "in_stock": 1.0,
        "low_stock": 0.9,
        "out_of_stock": 0.25,
    }

    STORE_RELIABILITY = {
        "amazon": 98.0,
        "mercado-livre": 95.0,
        "shopee": 88.0,
    }

    FACTOR_LABELS = {
        "price": "preco competitivo",
        "discount": "desconto atrativo",
        "shipping": "frete favoravel",
        "availability": "boa disponibilidade",
        "freshness": "sincronizacao recente",
        "store_reliability": "loja confiavel",
        "completeness": "dados completos",
    }

    @staticmethod
    def rank_offers(offers: list[Offer]) -> list[Offer]:
        if not offers:
            return []

        now = datetime.now(timezone.utc)
        minimum_total_cost = min(OfferRankingService._total_cost(offer) for offer in offers)
        ranked_offers: list[RankedOffer] = []

        for offer in offers:
            ranked = OfferRankingService._rank_single_offer(
                offer=offer,
                minimum_total_cost=minimum_total_cost,
                now=now,
            )
            OfferRankingService._attach_ranking_metadata(offer, ranked)
            ranked_offers.append(ranked)

        ranked_offers.sort(
            key=lambda entry: (
                -entry.ranking_score,
                OfferRankingService._total_cost(entry.offer),
                -OfferRankingService._discount_percentage(entry.offer),
                entry.offer.created_at,
            )
        )
        return [entry.offer for entry in ranked_offers]

    @staticmethod
    def _rank_single_offer(*, offer: Offer, minimum_total_cost: Decimal, now: datetime) -> RankedOffer:
        price_component = OfferRankingService._price_component(offer, minimum_total_cost)
        discount_component = OfferRankingService._discount_component(offer)
        shipping_component = OfferRankingService._shipping_component(offer)
        availability_component = OfferRankingService._availability_component(offer)
        freshness_component = OfferRankingService._freshness_component(offer, now)
        reliability_component = OfferRankingService._store_reliability_component(offer)
        completeness_component = OfferRankingService._completeness_component(offer)

        components = {
            "price": price_component,
            "discount": discount_component,
            "shipping": shipping_component,
            "availability": availability_component,
            "freshness": freshness_component,
            "store_reliability": reliability_component,
            "completeness": completeness_component,
        }

        quality_score = sum(components[key] * weight for key, weight in OfferRankingService.WEIGHTS.items())
        penalty = OfferRankingService._availability_penalty(offer)
        ranking_score = quality_score * penalty
        ranking_score = max(0.0, min(100.0, ranking_score))
        quality_score = max(0.0, min(100.0, quality_score))

        reason = OfferRankingService._build_reason(offer, components, penalty)
        weighted_breakdown = {
            key: round(value * OfferRankingService.WEIGHTS[key], 2) for key, value in components.items()
        }

        return RankedOffer(
            offer=offer,
            ranking_score=round(ranking_score, 2),
            quality_score=round(quality_score, 2),
            reason=reason,
            breakdown=weighted_breakdown,
        )

    @staticmethod
    def _attach_ranking_metadata(offer: Offer, ranked_offer: RankedOffer) -> None:
        offer.ranking_score = ranked_offer.ranking_score
        offer.quality_score = ranked_offer.quality_score
        offer.ranking_reason = ranked_offer.reason
        offer.ranking_breakdown = ranked_offer.breakdown

    @staticmethod
    def _price_component(offer: Offer, minimum_total_cost: Decimal) -> float:
        total_cost = OfferRankingService._total_cost(offer)
        if total_cost <= Decimal("0.00"):
            return 0.0
        ratio = float(minimum_total_cost / total_cost)
        return max(0.0, min(100.0, ratio * 100.0))

    @staticmethod
    def _discount_component(offer: Offer) -> float:
        discount = OfferRankingService._discount_percentage(offer)
        normalized = min(discount, 50.0) / 50.0
        return round(normalized * 100.0, 2)

    @staticmethod
    def _shipping_component(offer: Offer) -> float:
        shipping = float(offer.shipping_cost or Decimal("0.00"))
        price = float(offer.price)
        if price <= 0:
            return 0.0
        ratio = shipping / price
        return max(0.0, 100.0 - min(100.0, ratio * 1000.0))

    @staticmethod
    def _availability_component(offer: Offer) -> float:
        return OfferRankingService.AVAILABILITY_SCORE.get(offer.availability, 40.0)

    @staticmethod
    def _freshness_component(offer: Offer, now: datetime) -> float:
        if offer.last_synced_at is None:
            return 20.0

        last_synced_at = offer.last_synced_at
        if last_synced_at.tzinfo is None:
            last_synced_at = last_synced_at.replace(tzinfo=timezone.utc)
        else:
            last_synced_at = last_synced_at.astimezone(timezone.utc)

        age_hours = max(0.0, (now - last_synced_at).total_seconds() / 3600.0)
        if age_hours <= 24:
            return 100.0
        if age_hours >= 168:
            return 0.0
        return round(100.0 - ((age_hours - 24.0) / (168.0 - 24.0) * 100.0), 2)

    @staticmethod
    def _store_reliability_component(offer: Offer) -> float:
        store_code = offer.store.code if getattr(offer, "store", None) else ""
        return OfferRankingService.STORE_RELIABILITY.get(store_code, 80.0)

    @staticmethod
    def _completeness_component(offer: Offer) -> float:
        fields: list[Any] = [
            offer.seller_name,
            offer.title,
            offer.affiliate_url,
            offer.external_offer_id,
            offer.landing_url,
        ]
        completed = sum(1 for entry in fields if entry and str(entry).strip())
        return round((completed / len(fields)) * 100.0, 2)

    @staticmethod
    def _availability_penalty(offer: Offer) -> float:
        return OfferRankingService.AVAILABILITY_PENALTY.get(offer.availability, 0.8)

    @staticmethod
    def _build_reason(offer: Offer, components: dict[str, float], penalty: float) -> str:
        ordered_factors = sorted(components.items(), key=lambda entry: entry[1], reverse=True)
        best_labels = [OfferRankingService.FACTOR_LABELS[key] for key, _ in ordered_factors[:2]]
        base_reason = ", ".join(best_labels)

        if offer.availability == "out_of_stock":
            return f"{base_reason}; disponibilidade reduz o ranking."
        if penalty < 1.0:
            return f"{base_reason}; oferta com disponibilidade limitada."
        return base_reason

    @staticmethod
    def _total_cost(offer: Offer) -> Decimal:
        shipping = offer.shipping_cost or Decimal("0.00")
        return offer.price + shipping

    @staticmethod
    def _discount_percentage(offer: Offer) -> float:
        if offer.original_price is None or offer.original_price <= Decimal("0.00") or offer.original_price <= offer.price:
            return 0.0
        return float(((offer.original_price - offer.price) / offer.original_price) * Decimal("100"))
