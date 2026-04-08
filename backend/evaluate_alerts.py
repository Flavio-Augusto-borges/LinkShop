from app.db.session import SessionLocal
from app.services.alert_evaluation_service import AlertEvaluationService


def run_evaluation() -> None:
    with SessionLocal() as session:
        result = AlertEvaluationService.evaluate_active_watches(session)
        print("Alert evaluation completed:")
        print(f"  evaluated: {result['evaluated']}")
        print(f"  triggered: {result['triggered']}")

        for event in result["events"]:
            print(f"  - {event.reason}: {event.message}")


if __name__ == "__main__":
    run_evaluation()
