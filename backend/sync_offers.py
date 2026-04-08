import sys

from app.db.session import SessionLocal
from app.services.offer_sync_service import OfferSyncService


def run_sync(provider: str = "mock-marketplace") -> None:
    with SessionLocal() as session:
        summary = OfferSyncService.sync_provider(session, provider)
        print("Offer sync completed:")
        for key, value in summary.items():
            print(f"  {key}: {value}")


if __name__ == "__main__":
    selected_provider = sys.argv[1] if len(sys.argv) > 1 else "mock-marketplace"
    run_sync(selected_provider)
