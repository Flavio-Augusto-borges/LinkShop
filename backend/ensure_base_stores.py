from app.db.session import SessionLocal
from app.services.store_service import StoreService


def run() -> None:
    with SessionLocal() as session:
        summary = StoreService.ensure_base_stores(session)

    print(
        "Base stores ensured: "
        f"created={summary['created']} "
        f"existing={summary['existing']} "
        f"total={summary['total']}"
    )


if __name__ == "__main__":
    run()
