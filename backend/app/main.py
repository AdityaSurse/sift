import logging

from fastapi import Depends, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin import router as admin_router
from app.api.middleware import IPRateLimiterMiddleware, register_exception_handlers
from app.api.routes import router as api_router
from app.api.schemas import HealthResponse
from app.core.config import get_settings
from app.db.session import get_db

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize Sentry error reporting if DSN is configured
if settings.sift_sentry_dsn:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=settings.sift_sentry_dsn,
            environment=settings.sift_env,
            traces_sample_rate=0.1,
        )
        logger.info("Sentry monitoring initialized successfully.")
    except ImportError:
        logger.warning("sentry-sdk not installed; continuing with standard logging.")

app = FastAPI(
    title="Sift API",
    description="Polite job-discovery engine API aggregating direct company career postings and ATS feeds.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# 1. Register uniform error format handlers
register_exception_handlers(app)

# 2. CORS configuration restricted to the frontend application origin
# Why: Restricting allow_origins to the configured frontend prevents cross-origin unauthorized scraping
allowed_origins = [settings.sift_frontend_origin]
if "localhost" in settings.sift_frontend_origin:
    allowed_origins.append(settings.sift_frontend_origin.replace("localhost", "127.0.0.1"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# 3. In-memory per-IP sliding-window rate limiter
app.add_middleware(
    IPRateLimiterMiddleware,
    rate_limit_per_minute=settings.sift_api_rate_limit_per_minute,
)

# 4. Include discovery and jobs endpoints
app.include_router(api_router)
app.include_router(admin_router)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health status check",
    description="Verifies API runtime health and confirms active PostgreSQL database connectivity.",
)
async def health_check(session: AsyncSession = Depends(get_db)) -> HealthResponse | JSONResponse:
    """Verifies server health and database connectivity via non-blocking ping query."""
    try:
        await session.execute(text("SELECT 1;"))
        db_status = "connected"
    except Exception as e:
        logger.error("Health check database probe failed: %s", e)
        db_status = "disconnected"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "environment": settings.sift_env,
                "database": db_status,
                "version": "0.1.0",
            },
        )

    return HealthResponse(
        status="healthy",
        environment=settings.sift_env,
        database=db_status,
        version="0.1.0",
    )
