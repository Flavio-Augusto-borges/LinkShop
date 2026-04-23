from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.integration_auth import (
    MercadoLivreOAuthAuthorizeRead,
    MercadoLivreOAuthCodeExchangeInput,
    MercadoLivreOAuthConnectionRead,
    MercadoLivreOAuthStatusRead,
)
from app.services.mercado_livre_oauth_service import MercadoLivreOAuthService


router = APIRouter()


@router.get("/integrations/mercado-livre/oauth/status", response_model=MercadoLivreOAuthStatusRead)
def get_mercado_livre_oauth_status(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> MercadoLivreOAuthStatusRead:
    _ = current_user
    return MercadoLivreOAuthStatusRead.model_validate(MercadoLivreOAuthService.get_status(db))


@router.get("/integrations/mercado-livre/oauth/authorize", response_model=MercadoLivreOAuthAuthorizeRead)
def get_mercado_livre_authorize_url(
    current_user: User = Depends(get_current_admin_user),
) -> MercadoLivreOAuthAuthorizeRead:
    payload = MercadoLivreOAuthService.build_authorization_url(initiated_by_user_id=current_user.id)
    return MercadoLivreOAuthAuthorizeRead.model_validate(payload)


@router.post(
    "/integrations/mercado-livre/oauth/exchange-code",
    response_model=MercadoLivreOAuthConnectionRead,
    status_code=status.HTTP_201_CREATED,
)
def exchange_mercado_livre_code(
    payload: MercadoLivreOAuthCodeExchangeInput,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> MercadoLivreOAuthConnectionRead:
    _ = current_user
    connection = MercadoLivreOAuthService.exchange_code(db, code=payload.code)
    return MercadoLivreOAuthConnectionRead(
        provider=connection.provider,
        account_id=connection.external_user_id,
        account_name=connection.external_user_name,
        connected_at=connection.connected_at,
        access_token_expires_at=connection.access_token_expires_at,
        scopes=connection.scopes,
    )


@router.post("/integrations/mercado-livre/oauth/refresh", response_model=MercadoLivreOAuthConnectionRead)
def refresh_mercado_livre_connection(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> MercadoLivreOAuthConnectionRead:
    _ = current_user
    connection = MercadoLivreOAuthService.refresh_connection(db)
    return MercadoLivreOAuthConnectionRead(
        provider=connection.provider,
        account_id=connection.external_user_id,
        account_name=connection.external_user_name,
        connected_at=connection.connected_at,
        access_token_expires_at=connection.access_token_expires_at,
        scopes=connection.scopes,
    )


@router.delete("/integrations/mercado-livre/oauth/connection", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_mercado_livre_connection(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> None:
    _ = current_user
    MercadoLivreOAuthService.disconnect(db)
