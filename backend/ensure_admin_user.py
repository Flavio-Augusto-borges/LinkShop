from app.db.session import SessionLocal
from app.services.auth_service import AuthService


ADMIN_EMAIL = "admin@linkshop.com"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME = "LinkShop Admin"


def run() -> None:
    with SessionLocal() as session:
        user, created = AuthService.ensure_admin_user(
            session,
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            name=ADMIN_NAME,
        )

    if created:
        print(f"Admin user created: {user.email}")
    else:
        print(f"Admin user already exists: {user.email}")


if __name__ == "__main__":
    run()
