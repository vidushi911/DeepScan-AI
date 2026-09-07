"""Speckle noise reduction filters for side-scan sonar imagery.

Sonar images suffer from multiplicative speckle noise caused by coherent
imaging. This module implements two adaptive speckle filters from first
principles — no black-box library calls.

References:
- Lee, J.S. (1980). "Digital Image Enhancement and Noise Filtering by
  Use of Local Statistics." IEEE TPAMI, 2(2), 165-168.
- Frost, V.S., et al. (1982). "A Model for Radar Images and Its
  Application to Adaptive Digital Filtering of Multiplicative Noise."
  IEEE TPAMI, 4(2), 157-166.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from app.core.logging import get_logger

logger = get_logger(__name__)


def lee_filter(
    image: NDArray[np.float32],
    window_size: int = 7,
) -> NDArray[np.float32]:
    """Adaptive Lee speckle filter.

    The Lee filter reduces speckle noise while preserving edges by using
    local statistics (mean and variance) within a sliding window. It adapts
    the degree of smoothing based on the local coefficient of variation:

        filtered(x,y) = mean + k * (pixel - mean)

    where k = max(0, 1 - (noise_var / local_var))

    In homogeneous regions (low local_var), k → 0 → output ≈ local mean (strong smoothing).
    Near edges (high local_var), k → 1 → output ≈ original pixel (preserves detail).

    The noise variance is estimated from the overall image statistics, assuming
    multiplicative noise with unit mean (standard speckle model for SAR/sonar).

    Args:
        image: 2D float32 sonar image (intensity values).
        window_size: Size of the sliding analysis window (must be odd, ≥3).

    Returns:
        Filtered image with reduced speckle noise.

    Raises:
        ValueError: If window_size is even or < 3.
    """
    if window_size < 3 or window_size % 2 == 0:
        raise ValueError(f"window_size must be odd and ≥ 3, got {window_size}")

    logger.info("lee_filter_start", shape=image.shape, window=window_size)

    img = image.astype(np.float64)
    half = window_size // 2
    rows, cols = img.shape
    output = np.zeros_like(img)

    # Estimate overall noise variance using the multiplicative speckle model.
    # For multiplicative noise with unit mean: Var(noise) = Var(I) / Mean(I)^2
    # This is the "coefficient of variation squared" of the entire image.
    global_mean = np.mean(img)
    global_var = np.var(img)
    if global_mean > 0:
        noise_var = global_var / (global_mean ** 2)
    else:
        noise_var = 1.0

    # Compute local statistics using cumulative sums for efficiency (O(1) per pixel)
    # Pad the image to handle boundaries
    padded = np.pad(img, half, mode="reflect")

    # Integral image for fast local sum computation
    integral = np.cumsum(np.cumsum(padded, axis=0), axis=1)
    integral_sq = np.cumsum(np.cumsum(padded ** 2, axis=0), axis=1)

    n = window_size * window_size

    for i in range(rows):
        for j in range(cols):
            # Window boundaries in the padded image
            r1, c1 = i, j
            r2, c2 = i + window_size, j + window_size

            # Local sum and sum of squares via integral images
            local_sum = (
                integral[r2, c2]
                - integral[r1, c2]
                - integral[r2, c1]
                + integral[r1, c1]
            )
            local_sum_sq = (
                integral_sq[r2, c2]
                - integral_sq[r1, c2]
                - integral_sq[r2, c1]
                + integral_sq[r1, c1]
            )

            local_mean = local_sum / n
            local_var = (local_sum_sq / n) - (local_mean ** 2)
            local_var = max(local_var, 0.0)  # Numerical safety

            # Adaptive weighting factor
            if local_var > 0:
                k = max(0.0, 1.0 - (noise_var / (local_var / max(local_mean ** 2, 1e-10))))
            else:
                k = 0.0

            k = np.clip(k, 0.0, 1.0)
            output[i, j] = local_mean + k * (padded[i + half, j + half] - local_mean)

    result = output.astype(np.float32)
    logger.info("lee_filter_done", output_mean=float(np.mean(result)))
    return result


def frost_filter(
    image: NDArray[np.float32],
    window_size: int = 7,
    damping_factor: float = 2.0,
) -> NDArray[np.float32]:
    """Frost adaptive speckle filter.

    The Frost filter uses an exponentially weighted kernel where the weights
    decay with distance from the center pixel. The decay rate adapts to local
    statistics — faster decay (less smoothing) in heterogeneous regions
    (edges), slower decay (more smoothing) in homogeneous regions.

    The kernel weight at distance d from center:
        w(d) = exp(-damping * Ci^2 * d)

    where Ci = local_std / local_mean is the local coefficient of variation.

    Reference:
        Frost, V.S., et al. (1982). "A Model for Radar Images and Its
        Application to Adaptive Digital Filtering of Multiplicative Noise."
        IEEE TPAMI, 4(2), 157-166.

    Args:
        image: 2D float32 sonar image.
        window_size: Sliding window size (must be odd, ≥3).
        damping_factor: Controls the exponential decay rate. Higher values
                        preserve more detail but reduce less noise.

    Returns:
        Filtered image.

    Raises:
        ValueError: If window_size is even or < 3.
    """
    if window_size < 3 or window_size % 2 == 0:
        raise ValueError(f"window_size must be odd and ≥ 3, got {window_size}")

    logger.info(
        "frost_filter_start",
        shape=image.shape,
        window=window_size,
        damping=damping_factor,
    )

    img = image.astype(np.float64)
    half = window_size // 2
    rows, cols = img.shape
    output = np.zeros_like(img)

    # Precompute distance matrix for the window
    y_coords, x_coords = np.mgrid[-half : half + 1, -half : half + 1]
    distances = np.sqrt(x_coords.astype(np.float64) ** 2 + y_coords.astype(np.float64) ** 2)

    padded = np.pad(img, half, mode="reflect")

    for i in range(rows):
        for j in range(cols):
            window = padded[i : i + window_size, j : j + window_size]

            local_mean = np.mean(window)
            local_std = np.std(window)

            if local_mean > 0:
                ci_squared = (local_std / local_mean) ** 2
            else:
                ci_squared = 0.0

            # Exponential kernel weighted by local statistics
            weights = np.exp(-damping_factor * ci_squared * distances)
            weight_sum = np.sum(weights)

            if weight_sum > 0:
                output[i, j] = np.sum(weights * window) / weight_sum
            else:
                output[i, j] = padded[i + half, j + half]

    result = output.astype(np.float32)
    logger.info("frost_filter_done", output_mean=float(np.mean(result)))
    return result
