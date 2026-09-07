"""INT8 post-training quantization script using ONNX Runtime.

Quantizes FP32 ONNX model to INT8 representation for edge deployment on low-power
embedded devices (NVIDIA Jetson, Raspberry Pi 5, AUV onboard edge computers).
"""

from __future__ import annotations

import argparse
from pathlib import Path


def quantize_onnx_int8(onnx_input_path: Path, onnx_output_path: Path) -> Path:
    """Quantize FP32 ONNX model to INT8 precision.

    Args:
        onnx_input_path: Input FP32 ONNX model.
        onnx_output_path: Output INT8 ONNX model path.

    Returns:
        Path to quantized ONNX model.
    """
    try:
        from onnxruntime.quantization import QuantType, quantize_dynamic
    except ImportError as e:
        print("ONNX Runtime quantization module not installed: pip install onnxruntime")
        raise e

    if not onnx_input_path.exists():
        raise FileNotFoundError(f"Input ONNX file not found: {onnx_input_path}")

    print(f"Quantizing {onnx_input_path} to INT8 dynamic precision...")
    quantize_dynamic(
        model_input=str(onnx_input_path),
        model_output=str(onnx_output_path),
        weight_type=QuantType.QUInt8,
    )

    size_fp32 = onnx_input_path.stat().st_size / (1024 * 1024)
    size_int8 = onnx_output_path.stat().st_size / (1024 * 1024)

    print(f"✅ Quantization complete!")
    print(f"   FP32 Size: {size_fp32:.2f} MB")
    print(f"   INT8 Size: {size_int8:.2f} MB ({((1 - size_int8 / size_fp32) * 100):.1f}% reduction)")

    return onnx_output_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Quantize ONNX model to INT8")
    parser.add_argument("--input", type=Path, default=Path("weights/model.onnx"))
    parser.add_argument("--output", type=Path, default=Path("weights/model_int8.onnx"))
    args = parser.parse_args()

    if args.input.exists():
        quantize_onnx_int8(args.input, args.output)
    else:
        print(f"Input file {args.input} not found.")


if __name__ == "__main__":
    main()
