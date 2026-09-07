"""Celery tasks — the sonar processing pipeline.

Pipeline stages (executed as a task chain):
  ingest_file → preprocess → detect → score_and_filter → geotag → persist → notify

Each stage updates the survey status and progress in the database.
On failure, the survey is marked as 'failed' with the error detail —
no silent failures.
"""

from __future__ import annotations

import traceback
import uuid
from datetime import datetime, timezone
from pathlib import Path

from celery import shared_task

from app.core.logging import get_logger

logger = get_logger(__name__)


def _update_survey_status(
    survey_id: str,
    status: str,
    progress: int,
    error_detail: str | None = None,
) -> None:
    """Update the survey record status synchronously (for use in Celery tasks).

    Uses a synchronous database session since Celery tasks are synchronous.

    Args:
        survey_id: UUID string of the survey.
        status: New pipeline stage name.
        progress: Progress percentage (0-100).
        error_detail: Error message if status is 'failed'.
    """
    # Import here to avoid circular imports and to use sync session
    from sqlalchemy import create_engine, update
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.db.models import Survey

    settings = get_settings()
    # Convert async URL to sync URL
    sync_url = settings.database_url.replace("+asyncpg", "+psycopg2")
    sync_engine = create_engine(sync_url)

    with Session(sync_engine) as session:
        stmt = (
            update(Survey)
            .where(Survey.id == uuid.UUID(survey_id))
            .values(
                status=status,
                progress_percent=progress,
                error_detail=error_detail,
                completed_at=(
                    datetime.now(timezone.utc)
                    if status in ("done", "failed")
                    else None
                ),
            )
        )
        session.execute(stmt)
        session.commit()


@shared_task(
    bind=True,
    name="app.workers.tasks.process_survey_pipeline",
    max_retries=2,
    default_retry_delay=30,
)
def process_survey_pipeline(self: object, survey_id: str, file_path: str) -> dict:
    """Execute the full sonar processing pipeline for a survey.

    Pipeline stages:
    1. Ingest — parse the sonar file into a normalised internal format
    2. Preprocess — speckle filter, slant-range correction, CLAHE
    3. Detect — run CFAR anomaly proposals + YOLOv8-seg inference
    4. Score — fuse model confidence, shadow geometry, CFAR agreement
    5. Geotag — convert pixel detections to lat/lon coordinates
    6. Persist — save detections to the database
    7. Notify — mark job as done

    Args:
        self: Celery task instance (for retry support).
        survey_id: UUID string of the survey to process.
        file_path: Path to the uploaded sonar file on disk.

    Returns:
        Dict with processing summary (detection count, duration, etc.).
    """
    logger.info("pipeline_started", survey_id=survey_id, file_path=file_path)
    start_time = datetime.now(timezone.utc)

    try:
        # ── Stage 1: Ingest ──────────────────────────────────
        _update_survey_status(survey_id, "ingesting", 10)
        logger.info("stage_ingest", survey_id=survey_id)
        from app.services.sonar_ingest.adapter import ingest_sonar_file
        sonar_data = ingest_sonar_file(Path(file_path))

        # ── Stage 2: Preprocess ──────────────────────────────
        _update_survey_status(survey_id, "preprocessing", 25)
        logger.info("stage_preprocess", survey_id=survey_id)
        from app.services.preprocessing.pipeline import preprocess_sonar
        processed = preprocess_sonar(sonar_data)

        # ── Stage 3: Detect ──────────────────────────────────
        _update_survey_status(survey_id, "detecting", 45)
        logger.info("stage_detect", survey_id=survey_id)
        from app.services.detection.detector import run_detection
        raw_detections = run_detection(processed)

        # ── Stage 4: Score & Filter ──────────────────────────
        _update_survey_status(survey_id, "scoring", 60)
        logger.info("stage_score", survey_id=survey_id)
        from app.services.scoring.fusion import score_and_filter
        scored_detections = score_and_filter(raw_detections, processed)

        # ── Stage 5: Geotag ──────────────────────────────────
        _update_survey_status(survey_id, "geotagging", 75)
        logger.info("stage_geotag", survey_id=survey_id)
        from app.services.geotagging.engine import geotag_detections
        geotagged = geotag_detections(scored_detections, sonar_data)

        # ── Stage 6: Persist ─────────────────────────────────
        _update_survey_status(survey_id, "persisting", 90)
        logger.info("stage_persist", survey_id=survey_id, count=len(geotagged))
        from app.services.geotagging.persist import persist_detections
        persist_detections(survey_id, geotagged)

        # ── Stage 7: Done ────────────────────────────────────
        _update_survey_status(survey_id, "done", 100)
        elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
        logger.info(
            "pipeline_completed",
            survey_id=survey_id,
            detections=len(geotagged),
            elapsed_s=elapsed,
        )

        return {
            "survey_id": survey_id,
            "status": "done",
            "detection_count": len(geotagged),
            "elapsed_seconds": round(elapsed, 2),
        }

    except Exception as exc:
        tb = traceback.format_exc()
        logger.error(
            "pipeline_failed",
            survey_id=survey_id,
            error=str(exc),
            traceback=tb,
        )
        _update_survey_status(survey_id, "failed", 0, error_detail=str(exc))
        return {
            "survey_id": survey_id,
            "status": "failed",
            "error": str(exc),
        }
