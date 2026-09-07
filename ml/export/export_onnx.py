"""ONNX export script for YOLOv8 sonar detection model.

Converts PyTorch .pt model weights to ONNX format with dynamic axis support
for edge deployment (e.g. NVIDIA Jetson, Triton, ONNX Runtime).
"""

from __future__ import annotations

import argparse
from pathlib import Path


def export_to_onnx(
    weights_path: Path,
    output_path: Path | None = None,
    imgsz: int = 640,
    opset: int = 12,
    simplify: bool = True,
) -> Path:
    """Export PyTorch YOLO model to ONNX format.

    Args:
        weights_path: Path to PyTorch model weights (.pt).
        output_path: Target ONNX path (optional).
        imgsz: Square input image size.
        opset: ONNX opset version.
        simplify: Apply ONNX-Simplifier optimization pass.

    Returns:
        Path to generated ONNX model file.
    """
    from ultralytics import YOLO

    if not weights_path.exists():
        raise FileNotFoundError(f"Weights file not found: {weights_path}")

    print(f"Loading PyTorch model from {weights_path}...")
    model = YOLO(str(weights_path))

    print(f"Exporting to ONNX (imgsz={imgsz}, opset={opset}, simplify={simplify})...")
    exported_file = model.export(
        format="onnx",
        imgsz=imgsz,
        opset=opset,
        simplify=simplify,
        dynamic=True,
    )

    exported_path = Path(exported_file)
    if output_path and output_path != exported_path:
        exported_path.rename(output_path)
        exported_path = output_path

    print(f"✅ Successfully exported ONNX model to: {exported_path}")
    return exported_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Export YOLO PyTorch model to ONNX")
    parser.add_argument(
        "--weights", type=Path, default=Path("weights/best.pt"), help="Path to .pt file"
    )
    parser.add_argument(
        "--output", type=Path, default=None, help="Target ONNX path"
    )
    parser.add_argument("--imgsz", type=int, default=640, help="Input size")
    parser.add_argument("--opset", type=int, default=12, help="ONNX opset version")
    args = parser.parse_args()

    if args.weights.exists():
        export_to_onnx(args.weights, args.output, args.imgsz, args.opset)
    else:
        print(f"Weights file {args.weights} not found. Skipping export.")


if __name__ == "__main__":
    main()
