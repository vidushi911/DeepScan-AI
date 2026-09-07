"""YOLOv8-seg training runner for sonar debris detection.

Prepares dataset configuration YAML and runs fine-tuning of YOLOv8-seg on
sonar debris dataset (ghost nets, pipes, cylinders, wrecks).
"""

from __future__ import annotations

import argparse
from pathlib import Path
import yaml


def create_dataset_yaml(output_path: Path, data_root: Path) -> None:
    """Create YOLO dataset configuration file."""
    config = {
        "path": str(data_root.absolute()),
        "train": "train/images",
        "val": "valid/images",
        "test": "test/images",
        "names": {
            0: "ghost_net",
            1: "pipe",
            2: "cylinder",
            3: "wreck",
        },
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        yaml.dump(config, f, default_flow_style=False)
    print(f"Created dataset YAML at {output_path}")


def train_model(
    data_yaml: Path,
    epochs: int = 50,
    imgsz: int = 640,
    batch: int = 16,
    weights: str = "yolov8n-seg.pt",
    project: str = "runs/train",
    name: str = "ghost_net_hunter",
) -> None:
    """Run Ultralytics YOLOv8 training."""
    from ultralytics import YOLO

    model = YOLO(weights)
    print(f"Starting YOLOv8-seg training with {weights} for {epochs} epochs...")

    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project=project,
        name=name,
        patience=10,
        save=True,
    )
    print("Training complete! Model saved.")
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Train YOLOv8-seg on Sonar Debris")
    parser.add_argument("--data-root", type=Path, default=Path("data/sonar_debris"))
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--weights", type=str, default="yolov8n-seg.pt")
    args = parser.parse_args()

    yaml_path = args.data_root / "sonar_debris.yaml"
    create_dataset_yaml(yaml_path, args.data_root)
    
    if (args.data_root / "train/images").exists():
        train_model(
            data_yaml=yaml_path,
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            weights=args.weights,
        )
    else:
        print(f"Dataset images not found at {args.data_root / 'train/images'}. YAML written for future training.")


if __name__ == "__main__":
    main()
