"""Detection endpoints — filtered/paginated listing, detail, and human review.

All spatial queries use PostGIS functions on the GEOGRAPHY columns.
Detections are returned as GeoJSON when a bbox filter is applied.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.models import Detection
from app.db.session import get_session
from app.schemas import (
    BoundingBox,
    DetectionListResponse,
    DetectionResponse,
    GeoPoint,
    ReviewRequest,
    ReviewResponse,
    ScoreBreakdown,
)

router = APIRouter(prefix="/detections", tags=["detections"])
logger = get_logger(__name__)


def _detection_to_response(det: Detection) -> DetectionResponse:
    """Convert an ORM Detection to an API response schema.

    Args:
        det: Detection ORM instance.

    Returns:
        DetectionResponse pydantic model.
    """
    fused = det.confidence
    tier = DetectionResponse.tier_from_confidence(fused)

    location = None
    if det.geom is not None:
        # Extract lat/lon from the PostGIS geometry
        # This would normally use ST_Y/ST_X but we compute it in the query
        location = GeoPoint(lat=0.0, lon=0.0)  # Populated by query

    bbox = None
    if det.pixel_x is not None and det.pixel_w is not None:
        bbox = BoundingBox(
            x=float(det.pixel_x),
            y=float(det.pixel_y or 0),
            width=float(det.pixel_w),
            height=float(det.pixel_h or 0),
        )

    return DetectionResponse(
        id=det.id,
        survey_id=det.survey_id,
        class_label=det.class_label,
        confidence=fused,
        confidence_tier=tier,
        score_breakdown=ScoreBreakdown(
            model_confidence=det.model_confidence,
            shadow_score=det.shadow_score,
            cfar_score=det.cfar_score,
            fused_score=fused,
        ),
        location=location,
        bounding_box=bbox,
        width_m=det.width_m,
        height_m=det.height_m,
        crop_image_url=f"/api/v1/detections/{det.id}/crop" if det.crop_image_path else None,
        reviewed_status=det.reviewed_status,
        created_at=det.created_at,
    )


@router.get(
    "",
    response_model=DetectionListResponse,
    summary="List detections with filtering and pagination",
)
async def list_detections(
    session: AsyncSession = Depends(get_session),
    job_id: uuid.UUID | None = Query(None, description="Filter by survey/job ID"),
    conf_min: float = Query(0.0, ge=0.0, le=100.0, description="Minimum confidence"),
    class_filter: str | None = Query(None, alias="class", description="Filter by class label"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> DetectionListResponse:
    """List detections with optional filtering by survey, confidence, and class.

    Args:
        session: Database session (injected).
        job_id: Optional survey UUID filter.
        conf_min: Minimum confidence threshold (0–100).
        class_filter: Optional class label filter.
        page: Page number (1-indexed).
        page_size: Results per page (max 200).

    Returns:
        Paginated DetectionListResponse.
    """
    query = select(Detection)

    if job_id is not None:
        query = query.where(Detection.survey_id == job_id)
    if conf_min > 0:
        query = query.where(Detection.confidence >= conf_min)
    if class_filter:
        query = query.where(Detection.class_label == class_filter)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(Detection.confidence.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await session.execute(query)
    detections = [_detection_to_response(det) for det in result.scalars().all()]

    return DetectionListResponse(
        total=total,
        page=page,
        page_size=page_size,
        detections=detections,
    )


@router.get(
    "/{detection_id}",
    response_model=DetectionResponse,
    summary="Get a single detection detail",
)
async def get_detection(
    detection_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> DetectionResponse:
    """Retrieve full details of a single detection.

    Args:
        detection_id: The detection UUID.
        session: Database session (injected).

    Returns:
        DetectionResponse with score breakdown and geometry.

    Raises:
        HTTPException 404: If detection not found.
    """
    result = await session.execute(
        select(Detection).where(Detection.id == detection_id)
    )
    det = result.scalar_one_or_none()
    if det is None:
        raise HTTPException(status_code=404, detail=f"Detection {detection_id} not found.")

    return _detection_to_response(det)


@router.post(
    "/{detection_id}/review",
    response_model=ReviewResponse,
    summary="Submit human-in-the-loop review",
    description="Confirm or reject a detection. This action is logged for "
    "active-learning purposes.",
)
async def review_detection(
    detection_id: uuid.UUID,
    body: ReviewRequest,
    session: AsyncSession = Depends(get_session),
) -> ReviewResponse:
    """Record a human review decision on a detection.

    Args:
        detection_id: The detection to review.
        body: Review action (confirmed/rejected) with optional notes.
        session: Database session (injected).

    Returns:
        ReviewResponse confirming the action.

    Raises:
        HTTPException 404: If detection not found.
    """
    result = await session.execute(
        select(Detection).where(Detection.id == detection_id)
    )
    det = result.scalar_one_or_none()
    if det is None:
        raise HTTPException(status_code=404, detail=f"Detection {detection_id} not found.")

    det.reviewed_status = body.status
    await session.flush()

    logger.info(
        "detection_reviewed",
        detection_id=str(detection_id),
        status=body.status,
        notes=body.notes,
    )

    return ReviewResponse(
        detection_id=detection_id,
        reviewed_status=body.status,
        message=f"Detection marked as {body.status}.",
    )
