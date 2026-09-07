"""CFAR (Constant False Alarm Rate) anomaly detector for sonar imagery.

Implements CA-CFAR (Cell-Averaging CFAR) from first principles as a
pre-CNN anomaly proposal generator. This produces candidate ROIs before
the neural network runs — forming the first stage of a genuine two-stage
detector architecture.

Architecture note: CFAR operates on the preprocessed sonar image and
identifies statistically anomalous regions based on local background
statistics. These proposals are passed to the YOLOv8-seg model for
classification and refined segmentation. The CFAR agreement score is
then used as one component of the confidence fusion module.

Reference:
    Rohling, H. (1983). "Radar CFAR Thresholding in Clutter and Multiple
    Target Situations." IEEE Transactions on Aerospace and Electronic
    Systems, AES-19(4), 608-621.

The same principle applies to sonar: the acoustic return from a man-made
object (e.g., ghost net, pipe) will be significantly stronger than the
surrounding seafloor clutter. CA-CFAR detects these anomalies by
comparing each cell's power against an adaptive threshold derived from
the surrounding training cells.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class CFARDetection:
    """A single CFAR anomaly detection (candidate ROI).

    Attributes:
        row: Row index (ping number) of the detection center.
        col: Column index (sample number) of the detection center.
        power: Signal power at the detection cell.
        threshold: Adaptive threshold used for this cell.
        snr_db: Signal-to-noise ratio in dB (detection power / background).
    """

    row: int
    col: int
    power: float
    threshold: float
    snr_db: float


def ca_cfar_2d(
    image: NDArray[np.float32],
    guard_cells: int = 4,
    training_cells: int = 16,
    false_alarm_rate: float = 0.001,
) -> list[CFARDetection]:
    """Cell-Averaging CFAR detector for 2D sonar imagery.

    Slides a window across the image where each cell under test (CUT) is
    surrounded by:
    1. Guard cells — a buffer zone that prevents target energy from leaking
       into the background estimate.
    2. Training cells — used to estimate the local background noise power.

    The adaptive threshold is:
        threshold = alpha * mean(training_cells)

    where alpha is derived from the desired false alarm rate (Pfa):
        alpha = N * (Pfa^(-1/N) - 1)
        N = number of training cells

    A detection is declared when: CUT_power > threshold

    Window layout (1D cross-section):
        [training | guard | CUT | guard | training]

    In 2D, this forms a rectangular annulus around the CUT.

    Args:
        image: 2D float32 sonar image (should be preprocessed — speckle
               filtered and contrast-normalised).
        guard_cells: Number of guard cells on each side of the CUT (in both
                     dimensions). These cells are excluded from background
                     estimation.
        training_cells: Number of training cells on each side (beyond the
                        guard cells). These cells estimate the background.
        false_alarm_rate: Desired probability of false alarm (Pfa). Lower
                          values = fewer false positives but may miss weak
                          targets. Typical range: 1e-2 to 1e-4.

    Returns:
        List of CFARDetection objects, one per detected anomaly cell.

    Raises:
        ValueError: If guard_cells or training_cells are < 1.
    """
    if guard_cells < 1:
        raise ValueError(f"guard_cells must be ≥ 1, got {guard_cells}")
    if training_cells < 1:
        raise ValueError(f"training_cells must be ≥ 1, got {training_cells}")

    logger.info(
        "cfar_start",
        shape=image.shape,
        guard=guard_cells,
        training=training_cells,
        pfa=false_alarm_rate,
    )

    rows, cols = image.shape
    margin = guard_cells + training_cells
    img = image.astype(np.float64)

    # ── Compute threshold multiplier (alpha) from Pfa ────────
    # For CA-CFAR with N training cells:
    #   alpha = N * (Pfa^(-1/N) - 1)
    # This ensures the expected false alarm rate equals Pfa under
    # the assumption of exponentially distributed noise (Swerling-0).
    outer_size = 2 * (guard_cells + training_cells) + 1
    inner_size = 2 * guard_cells + 1
    n_training = outer_size ** 2 - inner_size ** 2
    alpha = n_training * (false_alarm_rate ** (-1.0 / n_training) - 1.0)

    logger.info("cfar_alpha", alpha=alpha, n_training=n_training)

    detections: list[CFARDetection] = []

    # ── Slide the CFAR window across the image ───────────────
    # Use integral image for fast sum computation
    integral = np.cumsum(np.cumsum(img, axis=0), axis=1)

    def _rect_sum(r1: int, c1: int, r2: int, c2: int) -> float:
        """Sum of image values in rectangle [r1:r2, c1:c2] using integral image."""
        r2 = min(r2, rows) - 1
        c2 = min(c2, cols) - 1
        r1 = max(r1, 0)
        c1 = max(c1, 0)
        val = integral[r2, c2]
        if r1 > 0:
            val -= integral[r1 - 1, c2]
        if c1 > 0:
            val -= integral[r2, c1 - 1]
        if r1 > 0 and c1 > 0:
            val += integral[r1 - 1, c1 - 1]
        return float(val)

    for i in range(margin, rows - margin):
        for j in range(margin, cols - margin):
            cut_power = img[i, j]

            # Outer rectangle (training + guard + CUT)
            outer_sum = _rect_sum(
                i - margin, j - margin,
                i + margin + 1, j + margin + 1,
            )

            # Inner rectangle (guard + CUT) — to be subtracted
            inner_sum = _rect_sum(
                i - guard_cells, j - guard_cells,
                i + guard_cells + 1, j + guard_cells + 1,
            )

            # Training cell sum = outer - inner
            training_sum = outer_sum - inner_sum

            # Background estimate
            background_mean = training_sum / n_training if n_training > 0 else 1.0
            threshold = alpha * background_mean

            if cut_power > threshold and background_mean > 0:
                snr_db = 10.0 * np.log10(cut_power / background_mean) if background_mean > 0 else 0.0
                detections.append(
                    CFARDetection(
                        row=i,
                        col=j,
                        power=float(cut_power),
                        threshold=float(threshold),
                        snr_db=float(snr_db),
                    )
                )

    logger.info("cfar_done", raw_detections=len(detections))

    # ── Cluster nearby detections ────────────────────────────
    # CFAR produces per-pixel detections — cluster them into ROI proposals
    clustered = _cluster_detections(detections, min_distance=guard_cells * 2)
    logger.info("cfar_clustered", proposals=len(clustered))

    return clustered


def _cluster_detections(
    detections: list[CFARDetection],
    min_distance: int = 8,
) -> list[CFARDetection]:
    """Cluster nearby CFAR detections into single ROI proposals.

    Uses simple non-maximum suppression: keep only the strongest detection
    within each min_distance × min_distance neighbourhood.

    Args:
        detections: Raw per-pixel CFAR detections.
        min_distance: Minimum distance between cluster centers.

    Returns:
        Clustered detections (one per ROI proposal).
    """
    if not detections:
        return []

    # Sort by power (descending) for greedy NMS
    sorted_dets = sorted(detections, key=lambda d: d.power, reverse=True)
    kept: list[CFARDetection] = []
    suppressed = set()

    for i, det in enumerate(sorted_dets):
        if i in suppressed:
            continue

        kept.append(det)

        # Suppress all weaker detections within min_distance
        for j in range(i + 1, len(sorted_dets)):
            if j in suppressed:
                continue
            other = sorted_dets[j]
            if (
                abs(det.row - other.row) < min_distance
                and abs(det.col - other.col) < min_distance
            ):
                suppressed.add(j)

    return kept
