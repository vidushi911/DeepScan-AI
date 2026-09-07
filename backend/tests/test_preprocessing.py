"""Unit tests for sonar preprocessing services (Lee, Frost, Slant-Range, CLAHE, CFAR)."""

import numpy as np
import pytest

from app.services.preprocessing.speckle_filter import lee_filter, frost_filter
from app.services.preprocessing.cfar import cfar_2d_ca
from app.services.preprocessing.pipeline import PreprocessingPipeline, PreprocessingConfig


def test_lee_filter() -> None:
    """Test Lee speckle filter output properties."""
    img = np.random.uniform(0.1, 0.9, (100, 100)).astype(np.float32)
    filtered = lee_filter(img, window_size=5, noise_var=0.04)

    assert filtered.shape == img.shape
    assert filtered.dtype == np.float32
    assert np.all(filtered >= 0.0)
    assert np.all(filtered <= 1.0)


def test_frost_filter() -> None:
    """Test Frost speckle filter output properties."""
    img = np.random.uniform(0.1, 0.9, (100, 100)).astype(np.float32)
    filtered = frost_filter(img, window_size=5, damping_factor=2.0)

    assert filtered.shape == img.shape
    assert filtered.dtype == np.float32
    assert np.all(filtered >= 0.0)


def test_cfar_detector() -> None:
    """Test 2D CA-CFAR anomaly detection on bright synthetic target."""
    img = np.full((100, 100), 0.2, dtype=np.float32)
    # Add a bright anomaly target
    img[45:55, 45:55] = 0.95

    mask, snr_map = cfar_2d_ca(
        img,
        guard_cells=2,
        ref_cells=5,
        pfa=1e-3,
    )

    assert mask.shape == img.shape
    assert snr_map.shape == img.shape
    # Anomaly center should trigger detection
    assert np.sum(mask[48:52, 48:52]) > 0


def test_preprocessing_pipeline() -> None:
    """Test full sonar preprocessing pipeline execution."""
    pipeline = PreprocessingPipeline(PreprocessingConfig(speckle_filter="lee", clahe_clip_limit=2.0))
    raw_img = np.random.uniform(0.05, 0.8, (200, 200)).astype(np.float32)

    result = pipeline.process(raw_img, slant_range_m=75.0, altitude_m=10.0)

    assert result.image.shape == (200, 200)
    assert result.cfar_mask.shape == (200, 200)
    assert len(result.cfar_proposals) >= 0
