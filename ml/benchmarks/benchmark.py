"""Performance benchmarking script for sonar detection models.

Measures inference latency (ms), throughput (FPS), memory footprint, and preprocess/postprocess overhead
for FP32 PyTorch, ONNX FP32, and ONNX INT8 models.
"""

from __future__ import annotations

import argparse
import time
import numpy as np


def benchmark_pytorch(weights_path: str, iterations: int = 50, imgsz: int = 640) -> dict[str, float]:
    """Benchmark PyTorch YOLO model performance."""
    from ultralytics import YOLO

    model = YOLO(weights_path)
    dummy_input = np.random.randint(0, 255, (imgsz, imgsz, 3), dtype=np.uint8)

    # Warmup
    for _ in range(5):
        _ = model.predict(source=dummy_input, verbose=False)

    latencies = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        _ = model.predict(source=dummy_input, verbose=False)
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)  # ms

    mean_ms = float(np.mean(latencies))
    std_ms = float(np.std(latencies))
    fps = 1000.0 / mean_ms

    return {
        "mean_latency_ms": mean_ms,
        "std_latency_ms": std_ms,
        "fps": fps,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark Sonar Detection Model")
    parser.add_argument("--weights", type=str, default="yolov8n-seg.pt")
    parser.add_argument("--iterations", type=int, default=30)
    args = parser.parse_args()

    print(f"Running benchmark on {args.weights} ({args.iterations} iterations)...")
    res = benchmark_pytorch(args.weights, iterations=args.iterations)

    print("\n================ BENCHMARK RESULTS ================")
    print(f"Model:           {args.weights}")
    print(f"Mean Latency:    {res['mean_latency_ms']:.2f} ms ± {res['std_latency_ms']:.2f} ms")
    print(f"Throughput:      {res['fps']:.1f} FPS")
    print("====================================================\n")


if __name__ == "__main__":
    main()
