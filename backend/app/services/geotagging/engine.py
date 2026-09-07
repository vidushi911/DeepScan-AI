"""Geotagging engine — convert pixel-space detections to real-world WGS84 coordinates.

This module performs the critical pixel-to-lat/lon conversion using:
- Per-ping navigation metadata (lat, lon, heading, altitude)
- Slant range geometry (oblique sonar beam angle)
- Across-track offset math
- pyproj Geod for accurate geodetic forward projection

DESIGN CHOICE: We use pyproj's geodetic (ellipsoidal) forward computation
instead of flat-earth approximation. This is important because flat-earth
approximation introduces significant positioning errors at large across-track
distances (>100m) and at high latitudes. This is a common accuracy bug in
DIY sonar tools that we deliberately avoid.

The math:
1. Determine which ping (image row) the detection center falls on.
2. Compute the across-track ground range from the pixel column:
     - across_track_slant_range = pixel_col * (max_slant_range / num_samples)
     - across_track_ground_range = sqrt(slant_range^2 - altitude^2)
3. Determine port/starboard side (left/right of nadir).
4. Use pyproj Geod.fwd() to compute the lat/lon at the given bearing
   (heading ± 90°) and distance (across-track ground range).
5. Compute real-world bbox dimensions using ground resolution.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from pyproj import Geod

from app.core.logging import get_logger
from app.services.detection.detector import RawDetection
from app.services.sonar_ingest.adapter import PingMetadata, SonarData

logger = get_logger(__name__)

# WGS84 ellipsoid for geodetic computations
_geod = Geod(ellps="WGS84")


@dataclass
class GeotaggedDetection:
    """A detection with real-world geographic coordinates.

    Attributes:
        detection: The original raw detection.
        latitude: WGS84 latitude of the detection centroid.
        longitude: WGS84 longitude of the detection centroid.
        width_m: Real-world width in meters.
        height_m: Real-world height in meters (along-track).
        bbox_lat_lon: Bounding box as (min_lat, min_lon, max_lat, max_lon).
        ping_index: Index of the ping this detection maps to.
        across_track_m: Across-track distance from nadir in meters.
    """

    detection: RawDetection
    latitude: float
    longitude: float
    width_m: float
    height_m: float
    bbox_lat_lon: tuple[float, float, float, float] | None = None
    ping_index: int = 0
    across_track_m: float = 0.0


def pixel_to_ground_range(
    pixel_col: int,
    num_samples: int,
    max_slant_range_m: float,
    altitude_m: float,
) -> float:
    """Convert a pixel column to across-track ground range in meters.

    Step 1: Compute slant range for this pixel:
        slant_range = pixel_col * (max_slant_range / num_samples)

    Step 2: Convert slant range to ground range:
        ground_range = sqrt(slant_range^2 - altitude^2)

    If slant_range < altitude, the pixel is in the water column
    (between the towfish and the seafloor) and ground_range = 0.

    Args:
        pixel_col: Column index in the sonar image.
        num_samples: Total number of samples (columns) per ping.
        max_slant_range_m: Maximum slant range setting in meters.
        altitude_m: Towfish altitude above the seafloor.

    Returns:
        Ground range in meters (0 if in water column).
    """
    if num_samples <= 0:
        return 0.0

    slant_range = pixel_col * (max_slant_range_m / num_samples)

    if slant_range <= altitude_m:
        return 0.0  # Water column

    return math.sqrt(slant_range ** 2 - altitude_m ** 2)


def compute_geo_position(
    ping_meta: PingMetadata,
    across_track_m: float,
    is_port: bool = False,
) -> tuple[float, float]:
    """Compute lat/lon from ping navigation and across-track offset.

    Uses pyproj Geod.fwd() for accurate geodetic forward projection on the
    WGS84 ellipsoid. This avoids the flat-earth approximation error.

    The bearing is computed as:
    - Starboard: heading + 90° (right side of travel direction)
    - Port: heading - 90° (left side of travel direction)

    Args:
        ping_meta: Navigation metadata for the ping.
        across_track_m: Across-track ground range in meters.
        is_port: True if the detection is on the port (left) side.

    Returns:
        (latitude, longitude) in WGS84 decimal degrees.
    """
    if ping_meta.latitude == 0.0 and ping_meta.longitude == 0.0:
        logger.warning("no_nav_data", ping=ping_meta.ping_number)
        return 0.0, 0.0

    # Bearing: perpendicular to heading direction
    if is_port:
        bearing = (ping_meta.heading_deg - 90.0) % 360.0
    else:
        bearing = (ping_meta.heading_deg + 90.0) % 360.0

    # Geodetic forward projection (lon, lat, back_azimuth)
    # pyproj Geod.fwd expects (lon, lat) order
    lon, lat, _ = _geod.fwd(
        ping_meta.longitude,
        ping_meta.latitude,
        bearing,
        across_track_m,
    )

    return float(lat), float(lon)


def compute_bbox_geo(
    center_lat: float,
    center_lon: float,
    width_m: float,
    height_m: float,
    heading_deg: float,
) -> tuple[float, float, float, float]:
    """Compute geographic bounding box corners from center point and dimensions.

    Uses geodetic offsets in 4 cardinal directions relative to the heading.

    Args:
        center_lat: Centroid latitude.
        center_lon: Centroid longitude.
        width_m: Width in meters (across-track).
        height_m: Height in meters (along-track).
        heading_deg: Heading direction in degrees.

    Returns:
        (min_lat, min_lon, max_lat, max_lon) bounding box.
    """
    half_w = width_m / 2.0
    half_h = height_m / 2.0

    # Along-track: heading direction
    fwd_lon, fwd_lat, _ = _geod.fwd(center_lon, center_lat, heading_deg, half_h)
    aft_lon, aft_lat, _ = _geod.fwd(center_lon, center_lat, (heading_deg + 180) % 360, half_h)

    # Across-track: perpendicular to heading
    stbd_lon, stbd_lat, _ = _geod.fwd(center_lon, center_lat, (heading_deg + 90) % 360, half_w)
    port_lon, port_lat, _ = _geod.fwd(center_lon, center_lat, (heading_deg - 90) % 360, half_w)

    min_lat = min(fwd_lat, aft_lat, stbd_lat, port_lat)
    max_lat = max(fwd_lat, aft_lat, stbd_lat, port_lat)
    min_lon = min(fwd_lon, aft_lon, stbd_lon, port_lon)
    max_lon = max(fwd_lon, aft_lon, stbd_lon, port_lon)

    return (min_lat, min_lon, max_lat, max_lon)


def geotag_detections(
    detections: list[RawDetection],
    sonar_data: SonarData,
) -> list[GeotaggedDetection]:
    """Convert all pixel-space detections to geotagged coordinates.

    For each detection:
    1. Map the detection's center pixel to a ping (row) and sample (column)
    2. Look up the ping's navigation metadata
    3. Compute across-track ground range from the column position
    4. Use geodetic forward projection to get lat/lon
    5. Compute real-world dimensions from ground resolution

    Args:
        detections: Scored detections with pixel coordinates.
        sonar_data: Original sonar data with per-ping navigation.

    Returns:
        List of GeotaggedDetection objects with lat/lon coordinates.
    """
    if not sonar_data.ping_metadata:
        logger.warning(
            "no_ping_metadata",
            msg="Cannot geotag without navigation metadata. "
            "Detections will have zero coordinates.",
        )
        return [
            GeotaggedDetection(
                detection=det,
                latitude=0.0,
                longitude=0.0,
                width_m=0.0,
                height_m=0.0,
            )
            for det in detections
        ]

    num_pings = len(sonar_data.ping_metadata)
    num_samples = sonar_data.samples_per_ping or sonar_data.image.shape[1]
    ground_res = sonar_data.ground_resolution_m

    geotagged: list[GeotaggedDetection] = []

    for det in detections:
        x1, y1, x2, y2 = det.bbox_pixels
        center_x = (x1 + x2) / 2.0
        center_y = (y1 + y2) / 2.0

        # Map to ping index (clamped to valid range)
        ping_idx = int(np.clip(center_y, 0, num_pings - 1))
        ping_meta = sonar_data.ping_metadata[ping_idx]

        # Determine port/starboard
        # Convention: if the image is a single-channel (combined), the left
        # half is port and right half is starboard. If separate channels,
        # the channel metadata indicates which side.
        midpoint = num_samples / 2
        is_port = center_x < midpoint

        # Across-track pixel distance from nadir
        if sonar_data.channel == "combined":
            across_track_px = abs(center_x - midpoint)
        else:
            across_track_px = center_x  # Single-side image

        # Convert pixel to ground range
        across_track_m = pixel_to_ground_range(
            pixel_col=int(across_track_px),
            num_samples=num_samples // 2 if sonar_data.channel == "combined" else num_samples,
            max_slant_range_m=sonar_data.range_m,
            altitude_m=ping_meta.altitude_m,
        )

        # Compute lat/lon
        lat, lon = compute_geo_position(ping_meta, across_track_m, is_port)

        # Real-world dimensions
        width_m = (x2 - x1) * ground_res
        height_m = (y2 - y1) * ground_res

        # Geographic bounding box
        bbox_geo = None
        if lat != 0.0 and lon != 0.0:
            bbox_geo = compute_bbox_geo(
                lat, lon, width_m, height_m, ping_meta.heading_deg
            )

        geotagged.append(
            GeotaggedDetection(
                detection=det,
                latitude=lat,
                longitude=lon,
                width_m=round(width_m, 3),
                height_m=round(height_m, 3),
                bbox_lat_lon=bbox_geo,
                ping_index=ping_idx,
                across_track_m=round(across_track_m, 3),
            )
        )

        logger.debug(
            "detection_geotagged",
            lat=lat,
            lon=lon,
            across_track_m=across_track_m,
            class_label=det.class_label,
        )

    logger.info("geotagging_done", total=len(geotagged))
    return geotagged
