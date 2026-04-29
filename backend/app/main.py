from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import text

from app.api.error_handlers import register_error_handlers
from app.api.middleware import RequestContextMiddleware
from app.api.router import api_router
from app.core.config import settings, validate_critical_environment
from app.core.logging import configure_logging
from app.db.session import SessionLocal
from app.integrations.registry import integration_registry


configure_logging(settings.log_level)
validate_critical_environment(settings)


def _parse_cors_origins(raw_origins: str) -> list[str]:
    return [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]

app = FastAPI(
    title=settings.app_name,
    debug=settings.app_debug,
    version="0.1.0",
)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(settings.cors_origins),
    allow_origin_regex=r"^https://link-shop-navy-[a-z0-9-]+\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_error_handlers(app)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"service": settings.app_name, "status": "ok"}


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
def readiness_check() -> JSONResponse:
    checks = {
        "database": "ok",
        "config": "ok",
        "integrations": "ok",
    }

    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
    except Exception:
        checks["database"] = "error"

    if not settings.auth_secret_key.get_secret_value().strip():
        checks["config"] = "error"

    if not integration_registry:
        checks["integrations"] = "error"

    status_code = 200 if all(value == "ok" for value in checks.values()) else 503
    payload = {
        "status": "ready" if status_code == 200 else "not_ready",
        "checks": checks,
        "meta": {
            "app_env": settings.app_env,
            "debug": settings.app_debug,
            "registered_integrations": len(integration_registry),
        },
    }
    return JSONResponse(payload, status_code=status_code)


@app.get("/oauth/callback", tags=["oauth"], include_in_schema=False)
def oauth_callback_alias(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None),
) -> RedirectResponse:
    from urllib.parse import urlencode
    params: dict[str, str] = {}
    if code:
        params["code"] = code
    if state:
        params["state"] = state
    if error:
        params["error"] = error
    if error_description:
        params["error_description"] = error_description
    qs = f"?{urlencode(params)}" if params else ""
    return RedirectResponse(url=f"/api/integrations/mercado-livre/callback{qs}", status_code=302)


app.include_router(api_router, prefix="/api")
