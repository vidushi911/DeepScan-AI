"""Sonar preprocessing pipeline — orchestrates all preprocessing stages.

Pipeline:
1. Slant-range correction — remove geometric distortion
2. Speckle reduction — Lee or Frost filter (configurable)
3. CLAHE contrast normalisation
4. CFAR anomaly proposal generation

Each stage is independently testable and configurable.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np
from numpy.typing import NDArray

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.preprocessing.cfar import CFARDetection, ca_cfar_2d
from app.services.preprocessing.speckle_filter import frost_filter, lee_filter
from app.services.sonar_ingest.adapter import SonarData

logger = get_logger(__name__)


@dataclass
class PreprocessedData:
    """Output of the preprocessing pipeline.

    Attributes:
        image: The fully preprocessed sonar image.
        original_image: The original unprocessed image (for reference).
        cfar_proposals: CFAR anomaly detection proposals.
        sonar_data: Reference to the source SonarData (for metadata access).
    """

    image: NDArray[np.float32]
    original_image: NDArray[np.float32]
    cfar_proposals: list[CFARDetection] = field(default_factory=list)
    sonar_data: SonarData | None = None


def slant_range_correction(
    image: NDArray[np.float32],
    altitude_m: float = 10.0,
    max_range_m: float = 75.0,
) -> NDArray[np.float32]:
    """Remove geometric distortion caused by the oblique sonar beam angle.

    Side-scan sonar measures slant range (direct acoustic path length), but
    the seafloor is at ground range (horizontal distance). The relationship:

        ground_range = sqrt(slant_range^2 - altitude^2)

    Near nadir (directly below the towfish), the slant range ≈ altitude,
    so ground range ≈ 0. This creates a compressed zone (water column) that
    must be removed and the remaining data must be resampled to uniform
    ground-range spacing.

    This correction:
    1. Computes the ground-range for each slant-range sample
    2. Resamples the image to uniformly spaced ground-range pixels
    3. Removes the water column artifact

    Args:
        image: 2D sonar image (pings × slant_range_samples).
        altitude_m: Towfish altitude above the seafloor (meters).
        max_range_m: Maximum slant range of the sonar (meters).

    Returns:
        Ground-range corrected image with uniform pixel spacing.
    """
    logger.info(
        "slant_range_correction",
        shape=image.shape,
        altitude=altitude_m,
        max_range=max_range_m,
    )

    rows, cols = image.shape
    output_cols = cols  # Keep same width; could resize

    # Compute slant range for each sample
    slant_ranges = np.linspace(0, max_range_m, cols)

    # Compute ground range: gr = sqrt(sr^2 - alt^2) where sr > alt
    # Samples with slant_range < altitude are in the water column
    valid_mask = slant_ranges > altitude_m
    ground_ranges = np.zeros_like(slant_ranges)
    ground_ranges[valid_mask] = np.sqrt(
        slant_ranges[valid_mask] ** 2 - altitude_m ** 2
    )

    # Determine uniform ground-range sampling
    max_ground_range = ground_ranges[valid_mask][-1] if np.any(valid_mask) else max_range_m
    uniform_ground = np.linspace(0, max_ground_range, output_cols)

    # Build interpolation mapping: for each output pixel, find the
    # corresponding input pixel via inverse mapping
    corrected = np.zeros((rows, output_cols), dtype=np.float32)

    for i in range(rows):
        # Interpolate: output ground-range → input slant-range index
        corrected[i] = np.interp(
            uniform_ground,
            ground_ranges[valid_mask],
            image[i, valid_mask],
            left=0.0,
            right=0.0,
        )

    logger.info("slant_range_correction_done", output_shape=corrected.shape)
    return corrected


def apply_clahe(
    image: NDArray[np.float32],
    clip_limit: float = 2.0,
    tile_grid_size: tuple[int, int] = (8, 8),
) -> NDArray[np.float32]:
    """Apply CLAHE (Contrast Limited Adaptive Histogram Equalisation).

    CLAHE is preferred over naive histogram equalisation because it avoids
    over-amplifying noise in low-contrast regions. It divides the image into
    tiles and applies localised histogram equalisation with a contrast limit
    that prevents excessive amplification.

    Design choice: We use CLAHE instead of global histogram equalisation
    specifically because sonar images have spatially varying contrast —
    near-range returns are much stronger than far-range, and CLAHE handles
    this gracefully.

    Args:
        image: 2D float32 image (values will be normalised to 0-255 for CLAHE).
        clip_limit: Threshold for contrast limiting (higher = more contrast).
        tile_grid_size: Size of the grid for localised processing.

    Returns:
        Contrast-normalised float32 image.
    """
    logger.info("clahe_start", clip_limit=clip_limit, tiles=tile_grid_size)

    # Normalise to 0-255 uint8 for OpenCV CLAHE
    img_min = np.min(image)
    img_max = np.max(image)
    if img_max - img_min > 0:
        normalised = ((image - img_min) / (img_max - img_min) * 255).astype(np.uint8)
    else:
        normalised = np.zeros_like(image, dtype=np.uint8)

    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    enhanced = clahe.apply(normalised)

    # Convert back to float32 in 0-1 range
    result = enhanced.astype(np.float32) / 255.0
    logger.info("clahe_done", output_range=(float(np.min(result)), float(np.max(result))))
    return result


def preprocess_sonar(sonar_data: SonarData) -> PreprocessedData:
    """Execute the full preprocessing pipeline on ingested sonar data.

    Pipeline order (important — each step depends on the previous):
    1. Slant-range correction (geometric fix)
    2. Speckle reduction (noise reduction)
    3. CLAHE (contrast normalisation)
    4. CFAR (anomaly proposals)

    Args:
        sonar_data: Ingested and parsed sonar data.

    Returns:
        PreprocessedData with corrected image and CFAR proposals.
    """
    settings = get_settings()
    logger.info(
        "preprocessing_pipeline_start",
        format=sonar_data.source_format,
        shape=sonar_data.image.shape,
    )

    image = sonar_data.image.copy()
    original = image.copy()

    # ── Stage 1: Slant-range correction ──────────────────────
    mean_altitude = np.mean(
        [m.altitude_m for m in sonar_data.ping_metadata]
    ) if sonar_data.ping_metadata else 10.0

    image = slant_range_correction(
        image,
        altitude_m=float(mean_altitude),
        max_range_m=sonar_data.range_m,
    )

    # ── Stage 2: Speckle reduction ───────────────────────────
    if settings.speckle_filter == "frost":
        image = frost_filter(
            image,
            window_size=settings.lee_window_size,  # Reuse window size config
            damping_factor=settings.frost_damping,
        )
    else:
        image = lee_filter(
            image,
            window_size=settings.lee_window_size,
        )

    # ── Stage 3: CLAHE ───────────────────────────────────────
    image = apply_clahe(image)

    # ── Stage 4: CFAR anomaly proposals ──────────────────────
    cfar_proposals = ca_cfar_2d(
        image,
        guard_cells=settings.cfar_guard_cells,
        training_cells=settings.cfar_training_cells,
        false_alarm_rate=settings.cfar_false_alarm_rate,
    )

    logger.info(
        "preprocessing_pipeline_done",
        proposals=len(cfar_proposals),
        output_shape=image.shape,
    )

    return PreprocessedData(
        image=image,
        original_image=original,
        cfar_proposals=cfar_proposals,
        sonar_data=sonar_data,
    )
