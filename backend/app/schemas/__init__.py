"""Pydantic v2 request/response schemas for the Ghost Net Hunter API.

These schemas define the contract between the frontend and backend.
They are separate from the ORM models to allow independent evolution
of the API surface and the database schema.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════
# Survey schemas
# ═══════════════════════════════════════════════════════════════

class SurveyUploadResponse(BaseModel):
    """Response after a successful file upload."""
    id: uuid.UUID
    job_id: uuid.UUID
    filename: str
    status: str = "queued"
    message: str = "File accepted and processing job enqueued."


class JobStatusResponse(BaseModel):
    """Current status of a processing job."""
    job_id: uuid.UUID
    survey_id: uuid.UUID
    status: str
    progress_percent: int = Field(ge=0, le=100)
    error_detail: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class SurveySummary(BaseModel):
    """Lightweight survey listing item."""
    id: uuid.UUID
    original_filename: str
    file_type: str
    status: str
    progress_percent: int
    uploaded_at: datetime
    completed_at: datetime | None = None
    detection_count: int = 0


# ═══════════════════════════════════════════════════════════════
# Detection schemas
# ═══════════════════════════════════════════════════════════════

class ScoreBreakdown(BaseModel):
    """Individual components of the fused confidence score."""
    model_confidence: float = Field(ge=0.0, le=100.0)
    shadow_score: float = Field(ge=0.0, le=100.0)
    cfar_score: float = Field(ge=0.0, le=100.0)
    fused_score: float = Field(ge=0.0, le=100.0)


class BoundingBox(BaseModel):
    """Pixel-space bounding box (normalised 0–100%)."""
    x: float
    y: float
    width: float
    height: float


class GeoPoint(BaseModel):
    """WGS84 geographic coordinate."""
    lat: float = Field(ge=-90.0, le=90.0)
    lon: float = Field(ge=-180.0, le=180.0)


class DetectionResponse(BaseModel):
    """Full detection detail returned by the API."""
    id: uuid.UUID
    survey_id: uuid.UUID
    class_label: str
    confidence: float = Field(ge=0.0, le=100.0)
    confidence_tier: Literal["high", "medium", "low"]
    score_breakdown: ScoreBreakdown
    location: GeoPoint | None = None
    bounding_box: BoundingBox | None = None
    width_m: float | None = None
    height_m: float | None = None
    crop_image_url: str | None = None
    reviewed_status: Literal["pending", "confirmed", "rejected"] = "pending"
    created_at: datetime

    @staticmethod
    def tier_from_confidence(conf: float) -> Literal["high", "medium", "low"]:
        """Derive the confidence tier from a numeric score.

        Args:
            conf: Confidence value 0–100.

        Returns:
            'high' if ≥80, 'medium' if ≥50, 'low' otherwise.
        """
        if conf >= 80.0:
            return "high"
        if conf >= 50.0:
            return "medium"
        return "low"


class DetectionListResponse(BaseModel):
    """Paginated list of detections with metadata."""
    total: int
    page: int
    page_size: int
    detections: list[DetectionResponse]


class ReviewRequest(BaseModel):
    """Human-in-the-loop review action on a detection."""
    status: Literal["confirmed", "rejected"]
    notes: str | None = None


class ReviewResponse(BaseModel):
    """Acknowledgement of a review action."""
    detection_id: uuid.UUID
    reviewed_status: str
    message: str


# ═══════════════════════════════════════════════════════════════
# Report schemas
# ═══════════════════════════════════════════════════════════════

class ReportRequest(BaseModel):
    """Filters for report generation."""
    format: Literal["json", "csv"] = "json"
    conf_min: float = Field(default=0.0, ge=0.0, le=100.0)
    class_filter: str | None = None


# ═══════════════════════════════════════════════════════════════
# GeoJSON schemas (for map display)
# ═══════════════════════════════════════════════════════════════

class GeoJSONFeatureProperties(BaseModel):
    """Properties embedded in each GeoJSON feature."""
    detection_id: str
    class_label: str
    confidence: float
    confidence_tier: str
    reviewed_status: str
    width_m: float | None = None
    height_m: float | None = None


class GeoJSONFeature(BaseModel):
    """A single GeoJSON Feature."""
    type: Literal["Feature"] = "Feature"
    geometry: dict  # GeoJSON geometry object
    properties: GeoJSONFeatureProperties


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection for the map endpoint."""
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[GeoJSONFeature]


# ═══════════════════════════════════════════════════════════════
# Health / Metrics
# ═══════════════════════════════════════════════════════════════

class HealthResponse(BaseModel):
    """API health check response."""
    status: Literal["ok", "degraded", "error"]
    version: str
    db_connected: bool
    redis_connected: bool
    model_loaded: bool
