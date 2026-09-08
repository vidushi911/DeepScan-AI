"""Inference API for the pipeline and wreck YOLO models trained in Colab."""

import io
import os
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

MODEL_INPUT_SIZE = int(os.getenv("MODEL_INPUT_SIZE", "640"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
MODEL_ROOT = Path(__file__).resolve().parent / "models"

app = FastAPI(title="DeepScan AI Inference API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@dataclass(frozen=True)
class AgentConfig:
    name: str
    display_name: str
    model_path: Path


AGENT_REGISTRY = (
    AgentConfig(
        "pipeline",
        "Subsea pipeline specialist",
        Path(os.getenv("PIPELINE_MODEL_PATH", str(MODEL_ROOT / "pipeline_real" / "best_fixed.pt"))),
    ),
    AgentConfig(
        "wreck",
        "Wreck specialist",
        Path(os.getenv("WRECK_MODEL_PATH", str(MODEL_ROOT / "wreck_specialist" / "best.pt"))),
    ),
)


class YOLODetectionAgent:
    def __init__(self, config: AgentConfig):
        self.config = config
        self.model: Any = None

    def load(self) -> None:
        if self.model is not None:
            return
        if not self.config.model_path.exists():
            raise RuntimeError(f"{self.config.display_name} model not found at {self.config.model_path}.")
        from ultralytics import YOLO
        self.model = YOLO(str(self.config.model_path))

    def predict(self, image: Image.Image, filename: str) -> list[dict[str, Any]]:
        self.load()
        result = self.model.predict(source=image, imgsz=MODEL_INPUT_SIZE, conf=CONFIDENCE_THRESHOLD, verbose=False)[0]
        return decode_output(result, filename, self.config.name)


class MultiAgentOrchestrator:
    def __init__(self, configs: tuple[AgentConfig, ...]):
        self.agents = {config.name: YOLODetectionAgent(config) for config in configs}

    def predict(self, image: Image.Image, filename: str) -> tuple[list[dict[str, Any]], dict[str, str]]:
        detections: list[dict[str, Any]] = []
        statuses: dict[str, str] = {}
        with ThreadPoolExecutor(max_workers=len(self.agents)) as executor:
            jobs = {executor.submit(agent.predict, image, filename): name for name, agent in self.agents.items()}
            for job in as_completed(jobs):
                name = jobs[job]
                try:
                    detections.extend(job.result())
                    statuses[name] = "completed"
                except Exception as error:
                    statuses[name] = f"error: {error}"
        if not detections and any(status.startswith("error:") for status in statuses.values()):
            raise RuntimeError("All model agents failed: " + "; ".join(f"{name}={status}" for name, status in statuses.items()))
        return detections, statuses


orchestrator = MultiAgentOrchestrator(AGENT_REGISTRY)


def preprocess(contents: bytes) -> Image.Image:
    return Image.open(io.BytesIO(contents)).convert("RGB")


def decode_output(output: Any, filename: str, model_name: str) -> list[dict[str, Any]]:
    detections: list[dict[str, Any]] = []
    if output.boxes is None:
        return detections
    names = output.names
    image_height, image_width = output.orig_shape
    for box, confidence, class_id in zip(output.boxes.xyxy.tolist(), output.boxes.conf.tolist(), output.boxes.cls.tolist()):
            label = str(names[int(class_id)]).strip().lower().replace(" ", "_")
            score = float(confidence * 100)
            x1, y1, x2, y2 = box
            detections.append({
                "id": f"DET-{uuid.uuid4().hex[:8].upper()}", "classLabel": label.replace("_", " ").title(),
                "rawClass": label, "confidence": round(score), "confidenceTier": "high" if score >= 80 else "medium" if score >= 50 else "low",
                "lat": 0, "lng": 0, "depthMeters": 0, "lengthMeters": 0, "widthMeters": 0,
                "boundingPoly": {"x": float(x1) / image_width * 100, "y": float(y1) / image_height * 100,
                                 "width": float(x2 - x1) / image_width * 100, "height": float(y2 - y1) / image_height * 100},
                "scoreBreakdown": {"modelSoftmax": round(score), "shadowConsistency": round(score), "cfarAgreement": round(score), "fusedScore": round(score)},
                "isCfarCandidateOnly": False, "status": "pending", "timestamp": "", "locationName": f"{filename} ({model_name})", "croppedPatchBg": "from-slate-950 via-cyan-950 to-slate-900",
            })
    return detections


@app.get("/health")
def health() -> dict[str, Any]:
    all_models_exist = all(config.model_path.exists() for config in AGENT_REGISTRY)
    return {
        "status": "ok" if all_models_exist else "degraded",
        "agents": len(AGENT_REGISTRY),
        "all_models_exist": all_models_exist,
    }


@app.get("/agents")
def agents() -> list[dict[str, Any]]:
    return [
        {"name": config.name, "display_name": config.display_name, "model_path": str(config.model_path), "model_exists": config.model_path.exists()}
        for config in AGENT_REGISTRY
    ]


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file is required.")
    try:
        contents = await file.read()
        image = preprocess(contents)
        detections, agent_statuses = orchestrator.predict(image, file.filename)
        return {"id": f"upload-{uuid.uuid4().hex[:8]}", "name": file.filename, "fileType": Path(file.filename).suffix.upper(), "fileSize": "", "timestamp": "", "locationName": "Uploaded survey", "pingCount": 0, "surveyLengthKm": 0, "auvTrack": [], "detections": detections, "agent_statuses": agent_statuses}
    except Exception as error:
        if "model not found" in str(error).lower():
            raise HTTPException(
                status_code=503,
                detail=(
                    "A configured sonar model is unavailable. Add pipeline weights under "
                    "backend/models/pipeline_real/best_fixed.pt or set PIPELINE_MODEL_PATH."
                ),
            ) from error
        raise HTTPException(status_code=500, detail=str(error)) from error