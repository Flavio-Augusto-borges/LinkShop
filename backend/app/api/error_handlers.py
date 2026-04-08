import logging
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppError
from app.core.observability import observability_registry


logger = logging.getLogger("linkshop.api")


def _build_error_payload(
    request: Request,
    *,
    code: str,
    message: str,
    details: object | None = None,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "error": {
            "code": code,
            "message": message,
        },
        "meta": {
            "request_id": getattr(request.state, "request_id", None),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "path": request.url.path,
        },
    }

    if details is not None:
        payload["error"]["details"] = details

    return payload


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        observability_registry.record_flow_failure(
            "api.errors",
            message=exc.message,
            code=exc.code,
            request_id=request_id,
            context={"path": request.url.path, "method": request.method},
        )
        logger.warning(
            "Application error on %s %s: code=%s message=%s request_id=%s",
            request.method,
            request.url.path,
            exc.code,
            exc.message,
            request_id,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_build_error_payload(request, code=exc.code, message=exc.message),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        details = [
            {
                "loc": list(error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            }
            for error in exc.errors()
        ]
        observability_registry.record_flow_failure(
            "api.errors",
            message="Request validation failed",
            code="REQUEST_VALIDATION_ERROR",
            request_id=request_id,
            context={"path": request.url.path, "method": request.method, "error_count": len(details)},
        )
        logger.warning(
            "Validation error on %s %s: errors=%s request_id=%s",
            request.method,
            request.url.path,
            len(details),
            request_id,
        )
        return JSONResponse(
            status_code=422,
            content=_build_error_payload(
                request,
                code="REQUEST_VALIDATION_ERROR",
                message="Request validation failed",
                details=details,
            ),
        )

    @app.exception_handler(IntegrityError)
    async def handle_integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        observability_registry.record_flow_failure(
            "api.errors",
            message="Database constraint violation",
            code="DATABASE_CONSTRAINT_VIOLATION",
            request_id=request_id,
            context={"path": request.url.path, "method": request.method},
        )
        logger.warning(
            "Integrity error on %s %s: %s request_id=%s",
            request.method,
            request.url.path,
            exc,
            request_id,
        )
        return JSONResponse(
            status_code=409,
            content=_build_error_payload(
                request,
                code="DATABASE_CONSTRAINT_VIOLATION",
                message="The operation violated a database constraint",
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        code = f"HTTP_{exc.status_code}"
        message = exc.detail if isinstance(exc.detail, str) else "HTTP error"
        if exc.status_code >= 500:
            observability_registry.record_flow_failure(
                "api.errors",
                message=message,
                code=code,
                request_id=request_id,
                context={"path": request.url.path, "method": request.method, "status_code": exc.status_code},
            )
        logger.warning(
            "HTTP error on %s %s: status=%s message=%s request_id=%s",
            request.method,
            request.url.path,
            exc.status_code,
            message,
            request_id,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_build_error_payload(request, code=code, message=message),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        observability_registry.record_flow_failure(
            "api.errors",
            message="Unhandled internal server error",
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
            context={"path": request.url.path, "method": request.method},
        )
        logger.exception(
            "Unhandled error on %s %s request_id=%s",
            request.method,
            request.url.path,
            request_id,
            exc_info=exc,
        )
        return JSONResponse(
            status_code=500,
            content=_build_error_payload(
                request,
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected error occurred",
            ),
        )
