"""Unit tests for confidence fusion scoring module."""

import numpy as np
from app.services.scoring.fusion import ConfidenceFusionModule, RawDetection, ScoredDetection


def test_confidence_fusion_scoring() -> None:
    """Test confidence fusion calculation produces calibrated scores."""
    fusion = ConfidenceFusionModule()

    raw_det = RawDetection(
        class_label="ghost_net",
        model_confidence=0.85,
        bbox_pixels=(100, 100, 200, 200),
    )

    image = np.full((500, 500), 0.2, dtype=np.float32)
    # Add highlight and shadow region
    image[100:200, 100:200] = 0.9  # Highlight
    image[100:200, 200:300] = 0.02  # Shadow

    cfar_mask = np.zeros((500, 500), dtype=np.uint8)
    cfar_mask[120:180, 120:180] = 1

    scored = fusion.score_detections(
        detections=[raw_det],
        image=image,
        cfar_mask=cfar_mask,
        altitude_m=10.0,
        slant_range_m=75.0,
    )

    assert len(scored) == 1
    det = scored[0]
    assert 0.0 <= det.final_score <= 100.0
    assert det.shadow_score >= 0.0
    assert det.cfar_score >= 0.0
