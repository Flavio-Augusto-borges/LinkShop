import logging

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_current_auth_context
from app.core.exceptions import UnauthorizedError
from app.core.observability import observability_registry
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthLoginInput, AuthLogoutInput, AuthRefreshInput, AuthRegisterInput, AuthTokenRead
from app.schemas.user import UserRead
from app.services.auth_service import AuthContext, AuthService


router = APIRouter()
logger = logging.getLogger("linkshop.auth")


@router.post("/register", response_model=AuthTokenRead, status_code=status.HTTP_201_CREATED)
def register(payload: AuthRegisterInput, request: Request, db: Session = Depends(get_db)) -> AuthTokenRead:
    observability_registry.record_flow_request("auth.register")
    request_id = getattr(request.state, "request_id", None)
    try:
        user = AuthService.register(db, payload)
        token_payload = AuthService.build_token_response(db, user)
    except Exception as exc:
        observability_registry.record_flow_failure(
            "auth.register",
            message="Registration failed",
            code=getattr(exc, "code", None),
            request_id=request_id,
        )
        logger.warning(
            "event=auth.register.failure code=%s",
            getattr(exc, "code", exc.__class__.__name__),
        )
        raise

    observability_registry.record_flow_success("auth.register")
    logger.info("event=auth.register.success user_id=%s", user.id)
    return AuthTokenRead.model_validate(token_payload)


@router.post("/login", response_model=AuthTokenRead)
def login(payload: AuthLoginInput, request: Request, db: Session = Depends(get_db)) -> AuthTokenRead:
    observability_registry.record_flow_request("auth.login")
    request_id = getattr(request.state, "request_id", None)
    user = AuthService.login(db, payload)

    if not user:
        observability_registry.record_flow_failure(
            "auth.login",
            message="Invalid credentials",
            code="INVALID_CREDENTIALS",
            request_id=request_id,
        )
        logger.warning("event=auth.login.failure reason=invalid_credentials")
        raise UnauthorizedError("Invalid email or password", code="INVALID_CREDENTIALS")

    token_payload = AuthService.build_token_response(db, user)
    observability_registry.record_flow_success("auth.login")
    logger.info("event=auth.login.success user_id=%s", user.id)
    return AuthTokenRead.model_validate(token_payload)


@router.post("/refresh", response_model=AuthTokenRead)
def refresh(payload: AuthRefreshInput, request: Request, db: Session = Depends(get_db)) -> AuthTokenRead:
    observability_registry.record_flow_request("auth.refresh")
    request_id = getattr(request.state, "request_id", None)
    token_response = AuthService.refresh_session(db, payload.refresh_token)

    if not token_response:
        observability_registry.record_flow_failure(
            "auth.refresh",
            message="Invalid refresh token",
            code="INVALID_REFRESH_TOKEN",
            request_id=request_id,
        )
        logger.warning("event=auth.refresh.failure reason=invalid_refresh_token")
        raise UnauthorizedError("Refresh token is invalid or expired", code="INVALID_REFRESH_TOKEN")

    observability_registry.record_flow_success("auth.refresh")
    logger.info("event=auth.refresh.success user_id=%s", token_response["user"].id)
    return AuthTokenRead.model_validate(token_response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    payload: AuthLogoutInput,
    request: Request,
    auth_context: AuthContext | None = Depends(get_optional_current_auth_context),
    db: Session = Depends(get_db),
) -> Response:
    observability_registry.record_flow_request("auth.logout")
    request_id = getattr(request.state, "request_id", None)
    revoked = AuthService.revoke_session(
        db,
        current_session=auth_context.session if auth_context else None,
        refresh_token=payload.refresh_token,
    )

    if not revoked:
        observability_registry.record_flow_failure(
            "auth.logout",
            message="No active session found",
            code="SESSION_NOT_FOUND",
            request_id=request_id,
        )
        logger.warning("event=auth.logout.failure reason=session_not_found")
        raise UnauthorizedError("No active session found to revoke", code="SESSION_NOT_FOUND")

    observability_registry.record_flow_success("auth.logout")
    logger.info("event=auth.logout.success user_id=%s", auth_context.user.id if auth_context else "unknown")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
