from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.observability import observability_registry
from app.models.alert_event import AlertEvent
from app.models.click_event import ClickEvent
from app.models.integration_sync_run import IntegrationSyncRun


class OperationalDiagnosticsService:
    @staticmethod
    def get_summary(db: Session) -> dict[str, object]:
        runtime = observability_registry.snapshot()

        latest_sync = db.scalar(select(IntegrationSyncRun).order_by(desc(IntegrationSyncRun.started_at)).limit(1))
        latest_click = db.scalar(select(ClickEvent).order_by(desc(ClickEvent.created_at)).limit(1))
        latest_alert = db.scalar(
            select(AlertEvent)
            .where(AlertEvent.triggered.is_(True))
            .order_by(desc(AlertEvent.created_at))
            .limit(1)
        )

        total_sync_runs = db.scalar(select(func.count(IntegrationSyncRun.id))) or 0
        total_click_events = db.scalar(select(func.count(ClickEvent.id))) or 0
        total_alert_events = db.scalar(select(func.count(AlertEvent.id))) or 0

        return {
            "runtime": runtime,
            "persistent": {
                "total_sync_runs": int(total_sync_runs),
                "total_click_events": int(total_click_events),
                "total_alert_events": int(total_alert_events),
                "latest_sync_run": latest_sync,
                "latest_click_event": latest_click,
                "latest_alert_event": latest_alert,
            },
        }
