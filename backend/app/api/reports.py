"""Report generation endpoint — download filtered detection data as JSON or CSV.

The report includes all detection fields plus score breakdown components.
"""

from __future__ import annotations

import csv
import io
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Detection
from app.db.session import get_session

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get(
    "/{job_id}",
    summary="Download a structured report for a survey",
    description="Returns detection data as JSON or CSV. Supports filtering by "
    "minimum confidence and class label.",
)
async def download_report(
    job_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    format: str = Query("json", regex="^(json|csv)$", description="Output format"),
    conf_min: float = Query(0.0, ge=0.0, le=100.0),
    class_filter: str | None = Query(None, alias="class"),
) -> StreamingResponse:
    """Generate and stream a detection report.

    Args:
        job_id: Survey UUID to generate the report for.
        session: Database session (injected).
        format: 'json' or 'csv'.
        conf_min: Minimum confidence threshold.
        class_filter: Optional class label filter.

    Returns:
        StreamingResponse with the report data.

    Raises:
        HTTPException 404: If no detections found for the given survey.
    """
    query = select(Detection).where(Detection.survey_id == job_id)
    if conf_min > 0:
        query = query.where(Detection.confidence >= conf_min)
    if class_filter:
        query = query.where(Detection.class_label == class_filter)

    query = query.order_by(Detection.confidence.desc())
    result = await session.execute(query)
    detections = result.scalars().all()

    if not detections:
        raise HTTPException(
            status_code=404,
            detail=f"No detections found for survey {job_id} with the given filters.",
        )

    rows = []
    for det in detections:
        rows.append({
            "detection_id": str(det.id),
            "survey_id": str(det.survey_id),
            "class_label": det.class_label,
            "confidence": det.confidence,
            "model_confidence": det.model_confidence,
            "shadow_score": det.shadow_score,
            "cfar_score": det.cfar_score,
            "width_m": det.width_m,
            "height_m": det.height_m,
            "reviewed_status": det.reviewed_status,
            "created_at": det.created_at.isoformat() if det.created_at else None,
        })

    if format == "csv":
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
        buffer.seek(0)

        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=report_{job_id}.csv"
            },
        )

    # JSON format
    import json

    json_content = json.dumps({"survey_id": str(job_id), "detections": rows}, indent=2)
    return StreamingResponse(
        iter([json_content]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=report_{job_id}.json"
        },
    )
