from datetime import datetime

from pydantic import BaseModel


class MercadoLivreOAuthStatusRead(BaseModel):
    provider: str
    is_configured: bool
    is_connected: bool
    connection_source: str
    auth_base_url: str
    redirect_uri: str | None = None
    account_id: str | None = None
    account_name: str | None = None
    scopes: str | None = None
    connected_at: datetime | None = None
    access_token_expires_at: datetime | None = None
    last_error_code: str | None = None
    last_error_message: str | None = None


class MercadoLivreOAuthAuthorizeRead(BaseModel):
    provider: str
    authorization_url: str
    redirect_uri: str


class MercadoLivreOAuthCodeExchangeInput(BaseModel):
    code: str


class MercadoLivreOAuthConnectionRead(BaseModel):
    provider: str
    account_id: str | None = None
    account_name: str | None = None
    connected_at: datetime | None = None
    access_token_expires_at: datetime | None = None
    scopes: str | None = None
