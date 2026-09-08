"""Ghost Net Hunter — FastAPI application entrypoint.

This module assembles the FastAPI app, registers all route handlers,
configures middleware (CORS, rate limiting), and sets up structured logging.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
import io
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
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

    @app.post("/api/v1/local-predict")
    async def local_predict(file: UploadFile = File(...)) -> dict:
        """Run pipeline inference locally without Postgres, Redis, or Celery."""
        if not file.filename:
            raise HTTPException(status_code=400, detail="A file is required.")

        try:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            settings = get_settings()
            model_path = settings.pipeline_weights_path
            if not model_path.exists():
                model_path = Path(__file__).resolve().parents[1] / "models" / "pipeline_real" / "best_fixed.pt"
            if not model_path.exists():
                raise HTTPException(status_code=503, detail="Pipeline model weights are not available.")

            from ultralytics import YOLO

            result = YOLO(str(model_path)).predict(
                source=image,
                imgsz=settings.model_input_size,
                conf=settings.confidence_threshold,
                verbose=False,
            )[0]
            height, width = result.orig_shape
            detections = []
            if result.boxes is not None:
                for box, confidence, class_id in zip(
                    result.boxes.xyxy.tolist(),
                    result.boxes.conf.tolist(),
                    result.boxes.cls.tolist(),
                ):
                    x1, y1, x2, y2 = box
                    score = round(float(confidence) * 100)
                    detections.append({
                        "id": f"DET-{uuid.uuid4().hex[:8].upper()}",
                        "classLabel": str(result.names[int(class_id)]),
                        "rawClass": str(result.names[int(class_id)]).lower().replace(" ", "_"),
                        "confidence": score,
                        "confidenceTier": "high" if score >= 80 else "medium" if score >= 50 else "low",
                        "lat": 0,
                        "lng": 0,
                        "depthMeters": 0,
                        "lengthMeters": 0,
                        "widthMeters": 0,
                        "boundingPoly": {
                            "x": x1 / width * 100,
                            "y": y1 / height * 100,
                            "width": (x2 - x1) / width * 100,
                            "height": (y2 - y1) / height * 100,
                        },
                        "scoreBreakdown": {
                            "modelSoftmax": score,
                            "shadowConsistency": score,
                            "cfarAgreement": score,
                            "fusedScore": score,
                        },
                        "isCfarCandidateOnly": False,
                        "status": "pending",
                        "timestamp": "",
                        "locationName": f"{file.filename} (local pipeline model)",
                        "croppedPatchBg": "from-slate-950 via-cyan-950 to-slate-900",
                    })

            return {
                "id": f"local-{uuid.uuid4().hex[:8]}",
                "name": file.filename,
                "fileType": Path(file.filename).suffix.upper(),
                "fileSize": str(len(contents)),
                "timestamp": "",
                "locationName": "Local pipeline inference",
                "pingCount": 0,
                "surveyLengthKm": 0,
                "auvTrack": [],
                "detections": detections,
                "mode": "local-pipeline-model",
            }
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Local pipeline inference failed: {error}") from error

    # Health/metrics at root level (no version prefix)
    app.include_router(health_router)

    return app


# Module-level app instance for uvicorn
app = create_app()
