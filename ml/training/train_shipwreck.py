"""Train and evaluate a YOLOv8 shipwreck detector on Roboflow sonar data."""

from __future__ import annotations

import os
from pathlib import Path

from roboflow import Roboflow
from ultralytics import YOLO

WORKSPACE = "dae-hyeok-lee"
PROJECT_NAME = "side-scan-sonar"
VERSION = 1
BASE_MODEL = "yolov8n.pt"
RUN_NAME = "wreck_specialist"
RUNS_DIR = Path(os.getenv("RUNS_DIR", "/content/runs"))
EPOCHS = int(os.getenv("EPOCHS", "50"))
IMGSZ = int(os.getenv("IMGSZ", "640"))
BATCH = int(os.getenv("BATCH", "16"))
PATIENCE = int(os.getenv("PATIENCE", "10"))
DEVICE = os.getenv("DEVICE", "0")


def download_dataset():
    api_key = os.environ["ROBOFLOW_API_KEY"]
    rf = Roboflow(api_key=api_key)
    project = rf.workspace(WORKSPACE).project(PROJECT_NAME)
    return project.version(VERSION).download("yolov8")


def train_model(data_yaml_path: str) -> Path:
    model = YOLO(BASE_MODEL)
    model.train(
        data=data_yaml_path,
        epochs=EPOCHS,
        imgsz=IMGSZ,
        batch=BATCH,
        name=RUN_NAME,
        project=str(RUNS_DIR),
        patience=PATIENCE,
        device=DEVICE,
    )
    return RUNS_DIR / RUN_NAME / "weights" / "best.pt"


def evaluate_model(weights_path: Path, data_yaml_path: str) -> None:
    model = YOLO(str(weights_path))
    metrics = model.val(data=data_yaml_path, split="test")
    print(f"mAP50:     {metrics.box.map50:.4f}")
    print(f"mAP50-95:  {metrics.box.map:.4f}")
    print(f"Precision: {metrics.box.mp:.4f}")
    print(f"Recall:    {metrics.box.mr:.4f}")


def run_predictions(weights_path: Path, test_images_dir: str) -> None:
    YOLO(str(weights_path)).predict(source=test_images_dir, conf=0.25, save=True)


def main() -> None:
    dataset = download_dataset()
    data_yaml = str(Path(dataset.location) / "data.yaml")
    best_weights = train_model(data_yaml)
    evaluate_model(best_weights, data_yaml)
    run_predictions(best_weights, str(Path(dataset.location) / "test" / "images"))
    print(f"\nDone. Trained weights saved at: {best_weights}")
    print("Copy best.pt to backend/models/wreck_specialist/best.pt for DeepScan.")


if __name__ == "__main__":
    main()
