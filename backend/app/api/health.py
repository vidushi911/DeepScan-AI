"""Health and metrics endpoints — liveness/readiness and Prometheus-format metrics.

/health checks database and Redis connectivity.
/metrics exposes Prometheus-compatible counters and gauges.
"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from prometheus_client import (
    CollectorRegistry,
    Counter,
    Gauge,
    generate_latest,
)

from app.core.logging import get_logger

router = APIRouter(tags=["observability"])
logger = get_logger(__name__)

# ── Prometheus Metrics ───────────────────────────────────────
registry = CollectorRegistry()

SURVEYS_PROCESSED = Counter(
    "ghostnet_surveys_processed_total",
    "Total number of surveys fully processed",
    registry=registry,
)
SURVEYS_FAILED = Counter(
    "ghostnet_surveys_failed_total",
    "Total number of surveys that failed processing",
    registry=registry,
)
DETECTIONS_CREATED = Counter(
    "ghostnet_detections_created_total",
    "Total number of detections created",
    ["class_label"],
    registry=registry,
)
ACTIVE_JOBS = Gauge(
    "ghostnet_active_jobs",
    "Number of currently processing survey jobs",
    registry=registry,
)


@router.get(
    "/health",
    summary="Liveness and readiness check",
    description="Verifies database and Redis connectivity. Returns 'ok', "
    "'degraded', or 'error'.",
)
async def health_check() -> dict:
    """Check system health by probing database and Redis.

    Returns:
        Dict with status, version, and connectivity flags.
    """
    db_ok = False
    redis_ok = False

    # Check database
    try:
        from app.db.session import engine

        async with engine.connect() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        db_ok = True
    except Exception as e:
        logger.warning("health_db_check_failed", error=str(e))

    # Check Redis
    try:
        import redis as redis_lib

        from app.core.config import get_settings

        settings = get_settings()
        r = redis_lib.from_url(settings.redis_url, socket_timeout=2)
        r.ping()
        redis_ok = True
    except Exception as e:
        logger.warning("health_redis_check_failed", error=str(e))

    status = "ok" if (db_ok and redis_ok) else ("degraded" if (db_ok or redis_ok) else "error")

    return {
        "status": status,
        "version": "1.0.0",
        "db_connected": db_ok,
        "redis_connected": redis_ok,
    }


@router.get(
    "/metrics",
    summary="Prometheus-format metrics",
    response_class=PlainTextResponse,
)
async def metrics() -> PlainTextResponse:
    """Expose Prometheus-compatible metrics.

    Returns:
        Plain text in Prometheus exposition format.
    """
    return PlainTextResponse(
        content=generate_latest(registry).decode("utf-8"),
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )
