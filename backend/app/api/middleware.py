import logging
import time
from uuid import uuid4

from app.core.observability import observability_registry
from app.core.request_context import request_id_context
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


logger = logging.getLogger("linkshop.request")


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        request.state.request_id = request_id
        token = request_id_context.set(request_id)
        start = time.perf_counter()

        try:
            response = await call_next(request)
        finally:
            request_id_context.reset(token)

        duration_ms = (time.perf_counter() - start) * 1000
        observability_registry.record_request(path=request.url.path, status_code=response.status_code)
        response.headers["X-Request-ID"] = request_id
        client_ip = request.client.host if request.client else "-"
        logger.info(
            "method=%s path=%s status=%s duration_ms=%.2f client_ip=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            client_ip,
        )
        return response
