"""YOLOv8-seg inference wrapper and U-Net refinement hook.

This module wraps Ultralytics YOLOv8-seg for sonar debris detection.
It also provides a documented interface for swapping in a U-Net
refinement head for pixel-precise net mask generation.

Architecture:
- Primary: YOLOv8-seg (edge-optimised, fast inference)
- Refinement: U-Net hook (optional, for pixel-precise masks)

The detector accepts preprocessed sonar tiles and returns raw detection
objects that are then scored by the fusion module.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol

import numpy as np
from numpy.typing import NDArray

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.preprocessing.pipeline import PreprocessedData

logger = get_logger(__name__)


@dataclass
class RawDetection:
    """A single raw detection from the model before scoring.

    Attributes:
        class_label: Predicted class name (e.g. 'ghost_net', 'pipe', 'wreck').
        model_confidence: Raw model confidence (0–1 scale).
        bbox_pixels: (x1, y1, x2, y2) bounding box in pixel coordinates.
        mask: Optional binary segmentation mask (same size as input).
        shadow_region: Optional detected shadow region mask.
    """

    class_label: str
    model_confidence: float
    bbox_pixels: tuple[int, int, int, int]
    mask: NDArray[np.uint8] | None = None
    shadow_region: NDArray[np.uint8] | None = None
    raw_output: dict[str, Any] = field(default_factory=dict)


class SegmentationModel(Protocol):
    """Protocol for pluggable segmentation models (YOLOv8-seg, U-Net, etc.)."""

    def predict(
        self,
        image: NDArray[np.float32],
        confidence_threshold: float,
    ) -> list[RawDetection]:
        """Run inference on a sonar tile.

        Args:
            image: Preprocessed sonar tile.
            confidence_threshold: Minimum detection confidence.

        Returns:
            List of raw detections.
        """
        ...


class YOLOv8SegDetector:
    """YOLOv8-seg inference wrapper.

    Loads the model once at first use (lazy loading) and runs segmentation
    inference on preprocessed sonar tiles.

    The model is expected to be fine-tuned on sonar debris classes via
    transfer learning from COCO-pretrained weights. See ml/training/ for
    the training pipeline.
    """

    def __init__(self, weights_path: Path | None = None) -> None:
        """Initialise the detector.

        Args:
            weights_path: Path to the YOLOv8-seg weights file (.pt).
                          If None, uses the configured default.
        """
        self._weights_path = weights_path or get_settings().pipeline_weights_path
        self._model: Any = None

    def _load_model(self) -> None:
        """Lazy-load the YOLO model on first inference call."""
        if self._model is not None:
            return

        if not self._weights_path.exists():
            logger.warning(
                "yolo_weights_not_found",
                path=str(self._weights_path),
                msg="Pipeline model weights are required for production. "
                "Train and mount the model using ml/training/train_yolo.py.",
            )
            raise FileNotFoundError(
                f"Pipeline model not found at {self._weights_path}. "
                "Set PIPELINE_WEIGHTS_PATH or add pipeline_real/best_fixed.pt."
            )
        else:
            from ultralytics import YOLO
            self._model = YOLO(str(self._weights_path))

        logger.info("yolo_model_loaded", weights=str(self._weights_path))

    def predict(
        self,
        image: NDArray[np.float32],
        confidence_threshold: float = 0.25,
    ) -> list[RawDetection]:
        """Run YOLOv8-seg inference on a sonar tile.

        Args:
            image: Preprocessed sonar tile (H×W float32, 0–1 range).
            confidence_threshold: Minimum detection confidence.

        Returns:
            List of RawDetection objects.
        """
        self._load_model()

        # Convert to uint8 RGB for YOLO (expects 3-channel input)
        if image.ndim == 2:
            img_uint8 = (np.clip(image, 0, 1) * 255).astype(np.uint8)
            img_rgb = np.stack([img_uint8] * 3, axis=-1)
        else:
            img_rgb = (np.clip(image, 0, 1) * 255).astype(np.uint8)

        settings = get_settings()
        results = self._model.predict(
            source=img_rgb,
            imgsz=settings.model_input_size,
            conf=confidence_threshold,
            verbose=False,
        )

        detections: list[RawDetection] = []
        if not results:
            return detections

        result = results[0]
        names = result.names or {}

        if result.boxes is not None:
            for idx, (box, conf, cls_id) in enumerate(zip(
                result.boxes.xyxy.cpu().numpy(),
                result.boxes.conf.cpu().numpy(),
                result.boxes.cls.cpu().numpy(),
            )):
                x1, y1, x2, y2 = map(int, box)
                label = str(names.get(int(cls_id), f"class_{int(cls_id)}"))

                # Extract segmentation mask if available
                mask = None
                if result.masks is not None and idx < len(result.masks):
                    mask = result.masks[idx].data.cpu().numpy().astype(np.uint8)
                    if mask.ndim == 3:
                        mask = mask.squeeze(0)

                detections.append(
                    RawDetection(
                        class_label=label.lower().replace(" ", "_"),
                        model_confidence=float(conf),
                        bbox_pixels=(x1, y1, x2, y2),
                        mask=mask,
                    )
                )

        logger.info("yolo_inference_done", detections=len(detections))
        return detections


class UNetRefinementHook:
    """U-Net refinement interface for pixel-precise net mask generation.

    SWAP-IN POINT: This is a documented interface for adding a U-Net
    segmentation head that refines YOLO bounding box detections into
    pixel-precise masks. This is particularly useful for ghost nets,
    which have irregular, web-like shapes that bounding boxes represent
    poorly.

    To implement:
    1. Train a U-Net on sonar patches cropped around YOLO detections
    2. Implement the predict() method to accept a cropped patch and
       return a binary mask
    3. Register the hook in the detection pipeline via config
    """

    def __init__(self, weights_path: Path | None = None) -> None:
        """Initialise the U-Net refinement model.

        Args:
            weights_path: Path to U-Net weights. None = disabled.
        """
        self._weights_path = weights_path
        self._model: Any = None
        self._enabled = weights_path is not None and weights_path.exists()

    @property
    def enabled(self) -> bool:
        """Whether the U-Net refinement is available."""
        return self._enabled

    def refine_mask(
        self,
        patch: NDArray[np.float32],
        coarse_mask: NDArray[np.uint8] | None,
    ) -> NDArray[np.uint8] | None:
        """Refine a coarse detection mask using U-Net.

        Args:
            patch: Cropped sonar image patch around the detection.
            coarse_mask: Initial mask from YOLO (or None).

        Returns:
            Refined binary mask, or None if U-Net is disabled.
        """
        if not self._enabled:
            return coarse_mask

        # TODO: Implement U-Net forward pass when weights are available
        logger.info("unet_refinement_placeholder", shape=patch.shape)
        return coarse_mask


# Module-level singletons
_detector: YOLOv8SegDetector | None = None
_unet_hook: UNetRefinementHook | None = None


def get_detector() -> YOLOv8SegDetector:
    """Get or create the singleton YOLOv8-seg detector."""
    global _detector
    if _detector is None:
        _detector = YOLOv8SegDetector()
    return _detector


def run_detection(preprocessed: PreprocessedData) -> list[RawDetection]:
    """Run the full detection pipeline on preprocessed sonar data.

    1. Run YOLOv8-seg on the preprocessed image
    2. Optionally refine masks with U-Net
    3. Return raw detections (not yet scored)

    Args:
        preprocessed: Output of the preprocessing pipeline.

    Returns:
        List of raw detections ready for confidence scoring.
    """
    detector = get_detector()
    settings = get_settings()

    detections = detector.predict(
        preprocessed.image,
        confidence_threshold=settings.confidence_threshold,
    )

    # Optional U-Net refinement
    global _unet_hook
    if _unet_hook is None:
        _unet_hook = UNetRefinementHook()

    if _unet_hook.enabled:
        for det in detections:
            x1, y1, x2, y2 = det.bbox_pixels
            patch = preprocessed.image[y1:y2, x1:x2]
            det.mask = _unet_hook.refine_mask(patch, det.mask)

    logger.info("detection_pipeline_done", total=len(detections))
    return detections
