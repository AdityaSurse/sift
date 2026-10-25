import collections
import logging
import time
from typing import Callable

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.schemas import ErrorDetail, ErrorResponse

logger = logging.getLogger(__name__)


class IPRateLimiterMiddleware(BaseHTTPMiddleware):
    """In-memory sliding-window rate limiter per client IP address.
    
    Why: Protects search and database query capacity from abusive scrapers or denial-of-service bursts
    without requiring an external Redis infrastructure dependency.
    """

    def __init__(self, app: FastAPI, rate_limit_per_minute: int = 60) -> None:
        super().__init__(app)
        self.rate_limit = rate_limit_per_minute
        self._ip_history: dict[str, collections.deque[float]] = {}
        self._last_cleanup = time.monotonic()

    def _get_client_ip(self, request: Request) -> str:
        """Extracts the true client IP respecting reverse-proxy X-Forwarded-For headers."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "127.0.0.1"

    def _cleanup_stale_ips(self, now: float) -> None:
        """Removes inactive client IPs to maintain constant memory usage."""
        if now - self._last_cleanup < 300.0:  # Cleanup every 5 minutes
            return
        self._last_cleanup = now
        stale_ips = [ip for ip, deq in self._ip_history.items() if not deq or now - deq[-1] > 60.0]
        for ip in stale_ips:
            del self._ip_history[ip]

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        # Exempt health and OpenAPI documentation from rate limiting
        exempt_prefixes = ("/health", "/docs", "/redoc", "/openapi.json")
        if request.url.path.startswith(exempt_prefixes):
            return await call_next(request)

        now = time.monotonic()
        client_ip = self._get_client_ip(request)

        # Get or create timestamp deque
        if client_ip not in self._ip_history:
            self._ip_history[client_ip] = collections.deque()
        history = self._ip_history[client_ip]

        # Purge entries older than 60 seconds
        while history and now - history[0] >= 60.0:
            history.popleft()

        # Check rate violation
        if len(history) >= self.rate_limit:
            retry_after = int(max(1, 60.0 - (now - history[0])))
            payload = ErrorResponse(
                error=ErrorDetail(
                    code="RATE_LIMIT_EXCEEDED",
                    message="Too many requests. Please slow down and try again later.",
                    details={"limit_per_minute": self.rate_limit, "retry_after_seconds": retry_after},
                )
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content=payload.model_dump(),
                headers={"Retry-After": str(retry_after)},
            )

        history.append(now)
        self._cleanup_stale_ips(now)

        return await call_next(request)


# ---------------------------------------------------------------------------
# Consistent Error Handlers
# ---------------------------------------------------------------------------

def map_status_to_error_code(status_code: int) -> str:
    """Derives standard error code strings from HTTP status codes."""
    mapping = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
    }
    return mapping.get(status_code, f"HTTP_{status_code}")


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Converts FastAPI HTTPExceptions into standardized ErrorResponse bodies."""
    code = map_status_to_error_code(exc.status_code)
    payload = ErrorResponse(
        error=ErrorDetail(
            code=code,
            message=str(exc.detail),
            details=getattr(exc, "details", None),
        )
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=payload.model_dump(),
        headers=exc.headers,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Converts Pydantic parameter validation failures into uniform ErrorResponse objects."""
    # Simplify validation error entries for client consumption
    simplified_errors = []
    for err in exc.errors():
        field_path = " -> ".join(str(loc) for loc in err.get("loc", []))
        simplified_errors.append({
            "field": field_path,
            "issue": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error"),
        })

    payload = ErrorResponse(
        error=ErrorDetail(
            code="VALIDATION_ERROR",
            message="Request parameter validation failed.",
            details=simplified_errors,
        )
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT if hasattr(status, "HTTP_422_UNPROCESSABLE_CONTENT") else 422,
        content=payload.model_dump(),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catches unhandled server errors, logs detailed diagnostics, and returns clean error payloads."""
    logger.exception("Unhandled server exception on %s %s: %s", request.method, request.url.path, exc)
    payload = ErrorResponse(
        error=ErrorDetail(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred. Please try again later.",
            details=None,
        )
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=payload.model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Registers uniform error formatters with the FastAPI instance."""
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
