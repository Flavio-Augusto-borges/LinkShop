import base64
import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = settings.auth_secret_key.get_secret_value().encode("utf-8")
    password_bytes = password.encode("utf-8")
    return hashlib.pbkdf2_hmac("sha256", password_bytes, salt, 100_000).hex()


def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)


@dataclass(frozen=True)
class AccessTokenPayload:
    user_id: str
    session_id: str
    expires_at: datetime
    token_type: str = "access"


@dataclass(frozen=True)
class RefreshTokenBundle:
    token: str
    token_hash: str
    expires_at: datetime


def _base64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")


def _base64url_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(f"{raw}{padding}".encode("utf-8"))


def _sign(value: str) -> str:
    return hmac.new(
        settings.auth_secret_key.get_secret_value().encode("utf-8"),
        msg=value.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()


def create_access_token(user_id: str, session_id: str) -> tuple[str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_ttl_minutes)
    payload = {
        "sub": user_id,
        "sid": session_id,
        "typ": "access",
        "exp": int(expires_at.timestamp()),
    }
    encoded_payload = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _sign(encoded_payload)
    return f"{encoded_payload}.{signature}", expires_at


def decode_access_token(token: str) -> AccessTokenPayload | None:
    try:
        encoded_payload, signature = token.split(".", maxsplit=1)
    except ValueError:
        return None

    expected_signature = _sign(encoded_payload)
    if not hmac.compare_digest(signature, expected_signature):
        return None

    try:
        payload = json.loads(_base64url_decode(encoded_payload))
    except (json.JSONDecodeError, ValueError):
        return None

    if payload.get("typ") != "access":
        return None

    try:
        expires_at = datetime.fromtimestamp(int(payload["exp"]), tz=timezone.utc)
    except (KeyError, TypeError, ValueError, OSError):
        return None

    if expires_at <= datetime.now(timezone.utc):
        return None

    user_id = payload.get("sub")
    session_id = payload.get("sid")
    if not isinstance(user_id, str) or not isinstance(session_id, str):
        return None

    return AccessTokenPayload(user_id=user_id, session_id=session_id, expires_at=expires_at)


def create_refresh_token(session_id: str) -> RefreshTokenBundle:
    secret = secrets.token_urlsafe(32)
    token = f"{session_id}.{secret}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_ttl_days)
    return RefreshTokenBundle(token=token, token_hash=hash_refresh_token(token), expires_at=expires_at)


def hash_refresh_token(token: str) -> str:
    return hmac.new(
        settings.auth_secret_key.get_secret_value().encode("utf-8"),
        msg=token.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()


def extract_session_id_from_refresh_token(token: str) -> str | None:
    try:
        session_id, _ = token.split(".", maxsplit=1)
    except ValueError:
        return None

    return session_id or None


def verify_refresh_token(token: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_refresh_token(token), expected_hash)
