"""Job status endpoint — poll processing progress for a survey.

Returns the current pipeline stage, progress percentage, and any error details.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Survey
from app.db.session import get_session
from app.schemas import JobStatusResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get(
    "/{job_id}",
    response_model=JobStatusResponse,
    summary="Get job processing status",
    description="Returns the current status, progress %, and error details "
    "for a survey processing job.",
)
async def get_job_status(
    job_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    """Retrieve the processing status of a survey job.

    Args:
        job_id: The survey/job UUID (these are currently 1:1).
        session: Database session (injected).

    Returns:
        JobStatusResponse with current pipeline stage and progress.

    Raises:
        HTTPException 404: If no survey matches the given ID.
    """
    result = await session.execute(
        select(Survey).where(Survey.id == job_id)
    )
    survey = result.scalar_one_or_none()
    if survey is None:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")

    return JobStatusResponse(
        job_id=survey.id,
        survey_id=survey.id,
        status=survey.status,
        progress_percent=survey.progress_percent,
        error_detail=survey.error_detail,
        created_at=survey.uploaded_at,
        completed_at=survey.completed_at,
    )
