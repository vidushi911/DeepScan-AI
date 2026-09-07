"""SQLAlchemy ORM models with PostGIS geometry columns.

Tables:
- surveys: uploaded sonar files and their processing status
- detections: individual debris/anomaly detections with geospatial data

All geometry columns use the GEOGRAPHY type for accurate geodetic distance
calculations (great-circle, not planar). GIST indexes are created for fast
spatial queries.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geography
from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class Survey(Base):
    """A single sonar survey file upload and its processing lifecycle."""

    __tablename__ = "surveys"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    file_type: Mapped[str] = mapped_column(String(16), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    vehicle_meta: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        Enum(
            "queued", "ingesting", "preprocessing", "detecting",
            "scoring", "geotagging", "persisting", "done", "failed",
            name="survey_status",
        ),
        default="queued",
        nullable=False,
    )
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationship
    detections: Mapped[list[Detection]] = relationship(
        "Detection", back_populates="survey", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Survey id={self.id} filename={self.original_filename} status={self.status}>"


class Detection(Base):
    """A single detected debris object with geospatial coordinates and scoring.

    The geom column stores the centroid as a GEOGRAPHY(Point, 4326) for accurate
    geodetic queries. The bbox_geom stores the detection's bounding polygon.
    """

    __tablename__ = "detections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    survey_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False
    )

    # Geospatial columns (GEOGRAPHY for accurate geodetic math)
    geom = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=True
    )
    bbox_geom = mapped_column(
        Geography(geometry_type="POLYGON", srid=4326), nullable=True
    )

    # Classification
    class_label: Mapped[str] = mapped_column(String(64), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # Score breakdown (the fusion components)
    model_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    shadow_score: Mapped[float] = mapped_column(Float, default=0.0)
    cfar_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Physical dimensions in meters
    width_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    height_m: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Image data
    crop_image_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Pixel coordinates in the source image (for traceability)
    pixel_x: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pixel_y: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pixel_w: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pixel_h: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Human-in-the-loop review
    reviewed_status: Mapped[str] = mapped_column(
        Enum("pending", "confirmed", "rejected", name="review_status"),
        default="pending",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationship
    survey: Mapped[Survey] = relationship("Survey", back_populates="detections")

    def __repr__(self) -> str:
        return f"<Detection id={self.id} class={self.class_label} conf={self.confidence:.1f}>"


# Spatial indexes for fast geospatial queries
Index("idx_detections_geom", Detection.geom, postgresql_using="gist")
Index("idx_detections_bbox_geom", Detection.bbox_geom, postgresql_using="gist")
Index("idx_detections_survey_id", Detection.survey_id)
Index("idx_detections_confidence", Detection.confidence)
