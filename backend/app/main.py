"""Ghost Net Hunter — FastAPI application entrypoint.

This module assembles the FastAPI app, registers all route handlers,
configures middleware (CORS, rate limiting), and sets up structured logging.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.detections import router as detections_router
from app.api.health import router as health_router
from app.api.jobs import router as jobs_router
from app.api.reports import router as reports_router
from app.api.uploads import router as uploads_router
from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging

logger = get_logger(__name__)

# Rate limiter (backed by in-memory store; swap to Redis in production)
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup/shutdown lifecycle.

    Startup:
    - Configure structured logging
    - Ensure upload/crop directories exist
    - Log readiness

    Shutdown:
    - Clean up resources
    """
    settings = get_settings()
    setup_logging(log_level=settings.log_level, log_format=settings.log_format)
    logger.info("app_starting", version="1.0.0")

    # Ensure storage directories exist
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.crop_dir.mkdir(parents=True, exist_ok=True)

    logger.info("app_ready", api_port=settings.api_port)
    yield
    logger.info("app_shutting_down")


def create_app() -> FastAPI:
    """Factory function that creates and configures the FastAPI application.

    Returns:
        A fully configured FastAPI instance.
    """
    settings = get_settings()

    app = FastAPI(
        title="Ghost Net Hunter API",
        description=(
            "End-to-end sonar debris detection system. Ingest side-scan sonar "
            "data, detect marine debris (ghost nets, pipes, shipwrecks), and "
            "generate geotagged confidence-scored reports."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # ── CORS ─────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    # ── Rate Limiting ────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── Global Exception Handler ─────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch-all handler that logs unhandled exceptions with context.

        Never returns a bare 500 without structured logging.
        """
        logger.error(
            "unhandled_exception",
            path=request.url.path,
            method=request.method,
            error_type=type(exc).__name__,
            error=str(exc),
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. See server logs for details."},
        )

    # ── Route Registration (versioned under /api/v1) ─────────
    app.include_router(uploads_router, prefix="/api/v1")
    app.include_router(jobs_router, prefix="/api/v1")
    app.include_router(detections_router, prefix="/api/v1")
    app.include_router(reports_router, prefix="/api/v1")

    # Health/metrics at root level (no version prefix)
    app.include_router(health_router)

    return app


# Module-level app instance for uvicorn
app = create_app()
