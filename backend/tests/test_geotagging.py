"""Unit tests for geotagging engine (pixel-to-WGS84 lat/lon conversion)."""

import pytest
from app.services.geotagging.engine import GeotaggingEngine, GeotaggedDetection
from app.services.sonar_ingest.adapter import PingMetadata


def test_geotagging_offset_math() -> None:
    """Test geodetic forward projection math from pixel coordinates."""
    engine = GeotaggingEngine()

    pings = [
        PingMetadata(
            ping_number=i,
            latitude=37.7749,
            longitude=-122.4194,
            heading_deg=90.0,  # Eastward heading
            altitude_m=10.0,
            slant_range_m=75.0,
        )
        for i in range(100)
    ]

    bbox = (200, 40, 250, 60)  # Bounding box near ping 50
    result = engine.geotag_bbox(
        bbox_pixels=bbox,
        ping_metadata=pings,
        num_samples=1000,
        class_label="ghost_net",
        confidence=88.5,
    )

    assert result.latitude != 0.0
    assert result.longitude != 0.0
    # Coordinates should be close to origin point
    assert abs(result.latitude - 37.7749) < 0.01
    assert abs(result.longitude - (-122.4194)) < 0.01
