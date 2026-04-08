import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.observability import observability_registry
from app.models.alert_config import AlertConfig
from app.models.alert_event import AlertEvent
from app.models.offer import Offer
from app.models.price_history import PriceHistory
from app.models.price_watch import PriceWatch
from app.services.offer_ranking_service import OfferRankingService


logger = logging.getLogger("linkshop.alerts")


class AlertEvaluationService:
    @staticmethod
    def evaluate_active_watches(db: Session) -> dict[str, object]:
        observability_registry.record_flow_request("alerts.evaluate")
        try:
            stmt = (
                select(PriceWatch)
                .where(PriceWatch.is_active.is_(True))
                .options(
                    joinedload(PriceWatch.alert_config),
                    joinedload(PriceWatch.product),
                )
                .order_by(PriceWatch.updated_at.desc())
            )
            watches = list(db.scalars(stmt).unique().all())
            events: list[AlertEvent] = []

            for watch in watches:
                events.extend(AlertEvaluationService._evaluate_watch(db, watch))

            db.commit()

            observability_registry.record_flow_success("alerts.evaluate")
            observability_registry.record_flow_metric("alerts.evaluate", "watches_evaluated", len(watches))
            observability_registry.record_flow_metric("alerts.evaluate", "alerts_triggered", len(events))
            logger.info(
                "event=alerts.evaluate.success evaluated=%s triggered=%s",
                len(watches),
                len(events),
            )
            return {
                "evaluated": len(watches),
                "triggered": len(events),
                "events": events,
            }
        except Exception as exc:
            observability_registry.record_flow_failure(
                "alerts.evaluate",
                message="Alert evaluation failed",
                code=getattr(exc, "code", None),
            )
            logger.exception("event=alerts.evaluate.failure")
            raise

    @staticmethod
    def _evaluate_watch(db: Session, watch: PriceWatch) -> list[AlertEvent]:
        alert_config = watch.alert_config
        if not alert_config:
            return []

        best_offer = AlertEvaluationService._get_best_offer(db, watch.product_id)
        current_price = best_offer.price if best_offer else None
        previous_price = watch.last_known_price
        recent_lowest_price = AlertEvaluationService._get_recent_lowest_price(db, watch.product_id)

        triggered_events: list[AlertEvent] = []

        if current_price is not None and alert_config.target_price is not None and current_price <= alert_config.target_price:
            triggered_events.append(
                AlertEvaluationService._build_event(
                    watch=watch,
                    offer=best_offer,
                    reason="target_price_reached",
                    message=(
                        f"Preco atual {current_price} atingiu ou ficou abaixo do alvo {alert_config.target_price}."
                    ),
                    current_price=current_price,
                    target_price=alert_config.target_price,
                    previous_price=previous_price,
                )
            )

        if (
            current_price is not None
            and previous_price is not None
            and alert_config.notify_on_price_drop
            and AlertEvaluationService._is_relevant_drop(previous_price, current_price)
        ):
            triggered_events.append(
                AlertEvaluationService._build_event(
                    watch=watch,
                    offer=best_offer,
                    reason="price_drop",
                    message=(
                        f"Preco caiu de {previous_price} para {current_price} e ultrapassou o limiar configurado."
                    ),
                    current_price=current_price,
                    target_price=alert_config.target_price,
                    previous_price=previous_price,
                )
            )

        if (
            best_offer
            and alert_config.notify_on_new_best_offer
            and watch.last_best_offer_id
            and watch.last_best_offer_id != best_offer.id
        ):
            triggered_events.append(
                AlertEvaluationService._build_event(
                    watch=watch,
                    offer=best_offer,
                    reason="new_best_offer",
                    message=f"Nova melhor oferta detectada para o produto acompanhado: {best_offer.title}.",
                    current_price=current_price,
                    target_price=alert_config.target_price,
                    previous_price=previous_price,
                )
            )

        for event in triggered_events:
            db.add(event)

        if triggered_events:
            alert_config.last_triggered_at = datetime.now(timezone.utc)

        if current_price is not None:
            watch.last_known_price = current_price

        watch.last_best_offer_id = best_offer.id if best_offer else None
        watch.updated_at = datetime.now(timezone.utc)

        if recent_lowest_price is not None and watch.last_known_price is None:
            watch.last_known_price = recent_lowest_price

        return triggered_events

    @staticmethod
    def _get_best_offer(db: Session, product_id: str) -> Offer | None:
        stmt = (
            select(Offer)
            .where(Offer.product_id == product_id, Offer.is_active.is_(True))
            .options(joinedload(Offer.store))
        )
        offers = list(db.scalars(stmt).unique().all())
        ranked = OfferRankingService.rank_offers(offers)
        return ranked[0] if ranked else None

    @staticmethod
    def _get_recent_lowest_price(db: Session, product_id: str) -> Decimal | None:
        stmt = (
            select(PriceHistory.price)
            .where(PriceHistory.product_id == product_id)
            .order_by(PriceHistory.captured_at.desc())
            .limit(10)
        )
        recent_prices = list(db.scalars(stmt).all())
        return min(recent_prices) if recent_prices else None

    @staticmethod
    def _is_relevant_drop(previous_price: Decimal, current_price: Decimal) -> bool:
        if previous_price <= Decimal("0.00") or current_price >= previous_price:
            return False

        variation = ((previous_price - current_price) / previous_price) * Decimal("100")
        normalized_variation = variation.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        threshold = Decimal(str(settings.alert_price_drop_threshold_percentage))
        return normalized_variation >= threshold

    @staticmethod
    def _build_event(
        *,
        watch: PriceWatch,
        offer: Offer | None,
        reason: str,
        message: str,
        current_price: Decimal | None,
        target_price: Decimal | None,
        previous_price: Decimal | None,
    ) -> AlertEvent:
        return AlertEvent(
            price_watch_id=watch.id,
            user_id=watch.user_id,
            product_id=watch.product_id,
            offer_id=offer.id if offer else None,
            status="triggered",
            reason=reason,
            message=message,
            current_price=current_price,
            target_price=target_price,
            previous_price=previous_price,
            triggered=True,
            created_at=datetime.now(timezone.utc),
        )
