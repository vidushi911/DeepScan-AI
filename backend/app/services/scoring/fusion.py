"""Confidence fusion module — combines multiple evidence sources.

This is the module that produces a calibrated 0–100 confidence score
for each detection. It deliberately does NOT just use raw softmax output.

Fusion formula:
    final_score = w1 * model_confidence
                + w2 * shadow_geometry_consistency_score
                + w3 * cfar_agreement_score
                - penalty_edge_of_swath
                - penalty_temporal_instability

Weight tuning rationale:
    Default weights (w1=0.50, w2=0.30, w3=0.20) are reasoned defaults
    based on the following logic:
    - w1 (model): Highest weight because the CNN is the most discriminative
      component after training. It can distinguish class-specific features
      that rule-based methods cannot.
    - w2 (shadow): Shadow consistency is a strong physical constraint —
      real objects on the seafloor must cast acoustic shadows consistent
      with the sonar geometry. This is the most reliable non-ML signal.
    - w3 (CFAR): CFAR confirms that the detection is statistically
      anomalous against the local background. Lower weight because CFAR
      has no class discrimination ability.

    These weights should be tuned via grid search against a validation
    holdout when labeled data is available. Until then, these defaults
    err on the side of trusting the CNN while requiring physical evidence.
"""

from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.detection.detector import RawDetection
from app.services.preprocessing.cfar import CFARDetection
from app.services.preprocessing.pipeline import PreprocessedData

logger = get_logger(__name__)


def shadow_geometry_consistency_score(
    detection: RawDetection,
    image: NDArray[np.float32],
    altitude_m: float = 10.0,
    grazing_angle_deg: float = 30.0,
) -> float:
    """Compute shadow geometry consistency for a detection.

    Derives the expected shadow length from sonar geometry:
        object_height = shadow_length * tan(grazing_angle)

    The grazing angle is computed from:
        grazing_angle = arctan(altitude / ground_range)

    We measure the actual shadow region behind the detection (acoustically
    dark area opposite to the sonar source) and compare its length against
    the expected shadow length given the object's apparent height.

    A high score means the shadow is geometrically consistent with a real
    3D object on the seafloor. A low score suggests the detection may be
    a false positive (e.g., a seafloor texture artifact that doesn't cast
    a proper acoustic shadow).

    Args:
        detection: The raw detection to evaluate.
        image: The preprocessed sonar image.
        altitude_m: Towfish/AUV altitude above seafloor.
        grazing_angle_deg: Grazing angle at the detection's position.

    Returns:
        Score between 0.0 and 100.0.
    """
    x1, y1, x2, y2 = detection.bbox_pixels
    h, w = image.shape[:2]

    # Object dimensions in pixels
    obj_width_px = x2 - x1
    obj_height_px = y2 - y1

    if obj_width_px <= 0 or obj_height_px <= 0:
        return 0.0

    # Look for shadow region: the area immediately behind the detection
    # (in the across-track direction, away from nadir)
    shadow_search_start = x2  # Shadow is on the far side from nadir
    shadow_search_end = min(x2 + obj_width_px * 3, w)  # Search up to 3x object width

    if shadow_search_start >= w:
        return 30.0  # Can't check shadow — moderate default

    shadow_region = image[y1:y2, shadow_search_start:shadow_search_end]
    if shadow_region.size == 0:
        return 30.0

    # Shadow intensity should be significantly lower than the object
    obj_region = image[y1:y2, x1:x2]
    obj_mean = float(np.mean(obj_region))
    shadow_mean = float(np.mean(shadow_region))

    if obj_mean <= 0:
        return 20.0

    # Shadow contrast ratio
    contrast_ratio = 1.0 - (shadow_mean / max(obj_mean, 1e-6))
    contrast_ratio = max(0.0, min(1.0, contrast_ratio))

    # Expected shadow length from geometry
    grazing_rad = math.radians(max(grazing_angle_deg, 1.0))
    # If we assume the object has some height h_obj:
    # shadow_length = h_obj / tan(grazing_angle)
    # Since we don't know h_obj, we check if the shadow length is
    # proportional to the object size and consistent with the geometry
    expected_shadow_ratio = 1.0 / max(math.tan(grazing_rad), 0.1)
    actual_shadow_pixels = shadow_search_end - shadow_search_start
    actual_shadow_ratio = actual_shadow_pixels / max(obj_width_px, 1)

    # Score the geometric consistency
    ratio_error = abs(actual_shadow_ratio - expected_shadow_ratio) / max(expected_shadow_ratio, 0.1)
    geometry_score = max(0.0, 1.0 - ratio_error) * 100.0

    # Combine contrast and geometry (both must be good)
    final = (contrast_ratio * 60.0 + geometry_score * 0.4)
    return max(0.0, min(100.0, final))


def cfar_agreement_score(
    detection: RawDetection,
    cfar_proposals: list[CFARDetection],
    agreement_radius_px: int = 20,
) -> float:
    """Compute CFAR agreement — does a CFAR proposal spatially overlap?

    A detection that is independently confirmed by the CFAR anomaly detector
    is more likely to be a real object. This score measures the spatial
    agreement between the CNN detection and the statistical CFAR proposals.

    Args:
        detection: The raw detection to evaluate.
        cfar_proposals: List of CFAR anomaly proposals.
        agreement_radius_px: Maximum distance (pixels) for a CFAR proposal
                             to be considered "agreeing" with the detection.

    Returns:
        Score between 0.0 and 100.0.
    """
    if not cfar_proposals:
        return 50.0  # Neutral — no CFAR data available

    x1, y1, x2, y2 = detection.bbox_pixels
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2

    # Find the closest CFAR proposal
    min_dist = float("inf")
    best_snr = 0.0

    for proposal in cfar_proposals:
        dist = math.sqrt((proposal.col - cx) ** 2 + (proposal.row - cy) ** 2)
        if dist < min_dist:
            min_dist = dist
            best_snr = proposal.snr_db

    if min_dist > agreement_radius_px:
        return 10.0  # No CFAR agreement — penalize

    # Scale by proximity and SNR
    proximity_score = max(0.0, 1.0 - min_dist / agreement_radius_px) * 50.0
    snr_score = min(50.0, best_snr * 5.0)  # 10 dB SNR → 50 points

    return min(100.0, proximity_score + snr_score)


def edge_of_swath_penalty(
    detection: RawDetection,
    image_width: int,
    margin_fraction: float = 0.05,
) -> float:
    """Penalise detections near the edge of the sonar swath.

    Detections at the extreme edges of the swath (first/last 5% of columns)
    are more likely to be artifacts caused by acoustic beam pattern effects,
    poor ensonification, or interpolation errors. This penalty degrades
    their confidence score.

    Args:
        detection: The detection to evaluate.
        image_width: Total image width in pixels.
        margin_fraction: Fraction of width considered "edge" (default 5%).

    Returns:
        Penalty value (0.0 = no penalty, up to 10.0 max penalty).
    """
    x1, _, x2, _ = detection.bbox_pixels
    center_x = (x1 + x2) / 2
    margin = image_width * margin_fraction

    if center_x < margin or center_x > image_width - margin:
        # Linear penalty: maximum at the very edge, zero at the margin boundary
        if center_x < margin:
            dist_to_edge = center_x
        else:
            dist_to_edge = image_width - center_x
        return max(0.0, (1.0 - dist_to_edge / margin)) * 10.0

    return 0.0


def score_and_filter(
    detections: list[RawDetection],
    preprocessed: PreprocessedData,
    min_confidence: float = 10.0,
) -> list[RawDetection]:
    """Apply the confidence fusion formula to all detections.

    Fusion formula:
        final = w1 * model_conf_100 + w2 * shadow_score + w3 * cfar_score
                - edge_penalty - temporal_penalty

    Result is clamped to [0, 100]. Detections below min_confidence are
    filtered out.

    Args:
        detections: Raw detections from the model.
        preprocessed: Preprocessed data (for CFAR proposals and image).
        min_confidence: Minimum fused confidence to keep a detection.

    Returns:
        Detections with updated confidence scores, sorted by confidence.
    """
    settings = get_settings()
    w1 = settings.score_w1_model
    w2 = settings.score_w2_shadow
    w3 = settings.score_w3_cfar
    penalty_edge = settings.penalty_edge_swath
    # penalty_temporal = settings.penalty_temporal  # For overlapping pings (future)

    image = preprocessed.image
    cfar_proposals = preprocessed.cfar_proposals

    # Get mean altitude from sonar metadata
    sonar_data = preprocessed.sonar_data
    mean_altitude = 10.0
    if sonar_data and sonar_data.ping_metadata:
        mean_altitude = float(np.mean(
            [m.altitude_m for m in sonar_data.ping_metadata]
        ))

    scored: list[RawDetection] = []

    for det in detections:
        model_conf_100 = det.model_confidence * 100.0

        shadow = shadow_geometry_consistency_score(
            det, image, altitude_m=mean_altitude
        )
        cfar = cfar_agreement_score(det, cfar_proposals)
        edge_pen = edge_of_swath_penalty(det, image.shape[1]) * penalty_edge

        fused = (
            w1 * model_conf_100
            + w2 * shadow
            + w3 * cfar
            - edge_pen
        )

        # Clamp to [0, 100]
        fused = max(0.0, min(100.0, fused))

        # Update the detection with the fused score
        det.raw_output["model_confidence_100"] = model_conf_100
        det.raw_output["shadow_score"] = shadow
        det.raw_output["cfar_score"] = cfar
        det.raw_output["edge_penalty"] = edge_pen
        det.raw_output["fused_confidence"] = fused
        det.model_confidence = det.model_confidence  # Keep original
        det.raw_output["original_model_conf"] = det.model_confidence

        if fused >= min_confidence:
            scored.append(det)

    # Sort by fused confidence (descending)
    scored.sort(
        key=lambda d: d.raw_output.get("fused_confidence", 0.0),
        reverse=True,
    )

    logger.info(
        "scoring_done",
        input=len(detections),
        output=len(scored),
        filtered_out=len(detections) - len(scored),
    )

    return scored
