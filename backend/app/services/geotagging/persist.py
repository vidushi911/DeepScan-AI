"""Persist geotagged detections to the PostGIS database.

This module writes the final geotagged detection results to the database,
creating Detection ORM records with proper GEOGRAPHY geometry columns.
"""

from __future__ import annotations

import uuid

from geoalchemy2.shape import from_shape
from shapely.geometry import Point, box

from app.core.logging import get_logger
from app.db.models import Detection
from app.services.geotagging.engine import GeotaggedDetection

logger = get_logger(__name__)


def persist_detections(
    survey_id: str,
    geotagged: list[GeotaggedDetection],
) -> list[str]:
    """Write geotagged detections to the database.

    Uses a synchronous session since this is called from a Celery task.

    Args:
        survey_id: UUID string of the parent survey.
        geotagged: List of geotagged detections to persist.

    Returns:
        List of detection UUID strings that were created.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings

    settings = get_settings()
    sync_url = settings.database_url.replace("+asyncpg", "+psycopg2")
    sync_engine = create_engine(sync_url)

    detection_ids: list[str] = []

    with Session(sync_engine) as session:
        for geo_det in geotagged:
            det = geo_det.detection
            det_id = uuid.uuid4()

            # Build PostGIS geometry from lat/lon
            geom = None
            bbox_geom = None

            if geo_det.latitude != 0.0 and geo_det.longitude != 0.0:
                point = Point(geo_det.longitude, geo_det.latitude)
                geom = from_shape(point, srid=4326)

                if geo_det.bbox_lat_lon:
                    min_lat, min_lon, max_lat, max_lon = geo_det.bbox_lat_lon
                    bbox_polygon = box(min_lon, min_lat, max_lon, max_lat)
                    bbox_geom = from_shape(bbox_polygon, srid=4326)

            # Extract score breakdown from raw_output
            fused = det.raw_output.get("fused_confidence", det.model_confidence * 100)
            shadow = det.raw_output.get("shadow_score", 0.0)
            cfar = det.raw_output.get("cfar_score", 0.0)

            x1, y1, x2, y2 = det.bbox_pixels

            db_detection = Detection(
                id=det_id,
                survey_id=uuid.UUID(survey_id),
                geom=geom,
                bbox_geom=bbox_geom,
                class_label=det.class_label,
                confidence=float(fused),
                model_confidence=float(det.model_confidence * 100),
                shadow_score=float(shadow),
                cfar_score=float(cfar),
                width_m=geo_det.width_m,
                height_m=geo_det.height_m,
                pixel_x=x1,
                pixel_y=y1,
                pixel_w=x2 - x1,
                pixel_h=y2 - y1,
                reviewed_status="pending",
            )
            session.add(db_detection)
            detection_ids.append(str(det_id))

        session.commit()

    logger.info(
        "detections_persisted",
        survey_id=survey_id,
        count=len(detection_ids),
    )

    return detection_ids
