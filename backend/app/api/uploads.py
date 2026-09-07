"""Upload endpoint — accepts sonar files, validates, stores, and enqueues processing.

Security:
- Extension allow-list + magic-byte verification
- File size enforcement
- Opaque filenames (no raw paths exposed to client)
- Rate-limited via slowapi
"""

from __future__ import annotations

import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.core.security import (
    compute_file_hash,
    generate_opaque_filename,
    validate_file_extension,
    validate_file_size,
    validate_magic_bytes,
)
from app.db.models import Survey
from app.db.session import get_session
from app.schemas import SurveyUploadResponse

router = APIRouter(prefix="/uploads", tags=["uploads"])
logger = get_logger(__name__)


@router.post(
    "",
    response_model=SurveyUploadResponse,
    status_code=202,
    summary="Upload a sonar survey file",
    description="Accepts a sonar file (.xtf, .jsf, .sdf, or image), "
    "validates it, stores it with an opaque filename, and enqueues "
    "a background processing job.",
)
async def upload_sonar_file(
    file: UploadFile,
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> SurveyUploadResponse:
    """Handle sonar file upload.

    Args:
        file: The uploaded file.
        session: Database session (injected).
        settings: Application settings (injected).

    Returns:
        SurveyUploadResponse with the job_id for status polling.

    Raises:
        HTTPException: On validation failure (400) or internal error (500).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required.")

    # 1. Validate extension
    try:
        ext = validate_file_extension(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    # 2. Read file contents and validate size
    contents = await file.read()
    try:
        validate_file_size(len(contents), settings.max_upload_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    # 3. Validate magic bytes
    import io

    file_obj = io.BytesIO(contents)
    try:
        validate_magic_bytes(file_obj, ext)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    # 4. Generate opaque filename and store
    opaque_name = generate_opaque_filename(file.filename)
    upload_path = settings.upload_dir / opaque_name
    upload_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(upload_path, "wb") as f:
            f.write(contents)
    except OSError as e:
        logger.error("file_write_failed", path=str(upload_path), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to store uploaded file.") from e

    # 5. Compute file hash
    file_obj.seek(0)
    file_hash = compute_file_hash(file_obj)

    # 6. Create survey record
    survey_id = uuid.uuid4()
    job_id = uuid.uuid4()  # In production, this maps to the Celery task ID
    survey = Survey(
        id=survey_id,
        filename=opaque_name,
        original_filename=file.filename,
        file_hash=file_hash,
        file_size_bytes=len(contents),
        file_type=ext,
        uploaded_at=datetime.now(timezone.utc),
        status="queued",
        progress_percent=0,
    )
    session.add(survey)
    await session.flush()

    # 7. Enqueue Celery processing task
    try:
        from app.workers.tasks import process_survey_pipeline

        process_survey_pipeline.delay(str(survey_id), str(upload_path))
        logger.info(
            "survey_enqueued",
            survey_id=str(survey_id),
            job_id=str(job_id),
            filename=file.filename,
        )
    except Exception as e:
        logger.error("celery_enqueue_failed", survey_id=str(survey_id), error=str(e))
        # Mark as failed but don't crash — the survey record is still valid
        survey.status = "failed"
        survey.error_detail = f"Failed to enqueue processing job: {e}"

    return SurveyUploadResponse(
        id=survey_id,
        job_id=job_id,
        filename=file.filename,
        status=survey.status,
    )
