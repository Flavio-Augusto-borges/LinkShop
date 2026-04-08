from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserRead


class AuthRegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=255)


class AuthLoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=255)


class AuthTokenRead(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead
    access_expires_at: datetime
    refresh_expires_at: datetime
    expires_at: datetime | None = None


class AuthRefreshInput(BaseModel):
    refresh_token: str = Field(min_length=20, max_length=512)


class AuthLogoutInput(BaseModel):
    refresh_token: str | None = Field(default=None, min_length=20, max_length=512)
