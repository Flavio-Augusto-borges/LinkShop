from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.core.exceptions import BusinessRuleError
from app.services.mercado_livre_oauth_service import MercadoLivreOAuthService


router = APIRouter()


@router.get("/mercado-livre/callback")
def mercado_livre_callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None, alias="error_description"),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    frontend_target = settings.frontend_app_url.rstrip("/") + "/admin/integracoes/mercado-livre"

    if error:
        query = urlencode(
            {
                "oauth": "error",
                "oauth_code": error,
                "oauth_message": (error_description or error).strip(),
            }
        )
        return RedirectResponse(url=f"{frontend_target}?{query}", status_code=302)

    if not code or not state:
        raise BusinessRuleError(
            "Mercado Livre callback requires code and state parameters",
            code="MERCADO_LIVRE_CALLBACK_INVALID",
        )

    try:
        MercadoLivreOAuthService.handle_callback(db, code=code, state=state)
    except Exception as exc:
        message = getattr(exc, "message", str(exc)).strip() or "Mercado Livre callback failed."
        error_code = getattr(exc, "code", "MERCADO_LIVRE_CALLBACK_ERROR")
        query = urlencode({"oauth": "error", "oauth_code": error_code, "oauth_message": message})
        return RedirectResponse(url=f"{frontend_target}?{query}", status_code=302)

    query = urlencode({"oauth": "connected"})
    return RedirectResponse(url=f"{frontend_target}?{query}", status_code=302)
