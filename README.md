# DeepScan AI — AI Underwater Sonar Marine Debris & Anomaly Detection System

DeepScan AI is an enterprise-grade oceanographic intelligence platform that analyzes side-scan sonar imagery to automatically detect ghost nets, shipwrecks, corroded subsea pipelines, and hazardous seafloor marine debris.

## 🌊 Color Palette & Design System
- **Soft Periwinkle (`#B5C7EB`)**: Backgrounds & light section highlights
- **Deep Ocean Blue (`#305CDE`)**: Primary CTAs & active indicators
- **Seafoam / Sage (`#A8C3BC`)**: Secondary accents & terrain sections
- **Mid Ocean Blue (`#2D68C4`)**: Headers, navigation bars & dark contrast blocks

## 🚀 Key Modules & Multi-Page Features
- **Overview Page (`/`)**: System architecture overview, mission metrics (98.4% precision, <1.8s/tile, 42 FPS), live scan strip, email anomaly alert system.
- **Upload & Pipeline Page (`/upload`)**: Drag-and-drop file upload (.XTF, .JSF, .TIFF, .PNG), live multi-stage telemetry pipeline simulator, interactive Before/After Lee & Frost despeckling slider.
- **Detection Results Page (`/results`)**: High-resolution sonar waterfall canvas, confidence threshold slider, CFAR candidate vs final fused detections toggle, click-to-inspect score breakdown matrix.
- **GIS Bathymetric Map (`/map`)**: Leaflet GIS map with AUV survey tracks, bathymetric coordinates, depth telemetry popups, and confidence-tier colored pins.
- **Reports & Export Center (`/reports`)**: Sortable WGS84 GIS data table, JSON & CSV file exports, active-learning human-in-the-loop retraining queue.
- **Edge Specs & Hardware (`/benchmarks`)**: Jetson Orin Nano (7.5W) vs AGX vs CPU throughput benchmarks, INT8 TensorRT quantization metrics, technical limitations disclosure.

## 🛠️ Getting Started

### Installation
```bash
npm install
```

Copy `.env.example` to `.env` before using Docker Compose.

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Run the ML backend

Copy the two Ultralytics `.pt` files from Colab into these paths:

```text
backend/models/wreck_specialist/best.pt
backend/models/pipeline_real/best_fixed.pt
```

The production worker uses the subsea pipeline detector at `pipeline_real/best_fixed.pt` by default. The legacy `/predict` service registers both the pipeline and shipwreck agents. Override `PIPELINE_WEIGHTS_PATH` for the async worker or `PIPELINE_MODEL_PATH` for the legacy service when the model is mounted elsewhere.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

In a second terminal, run the frontend from the repository root:

```bash
npm run dev
```

The upload page sends files to the async processing API at `http://localhost:8000/api/v1/uploads`, polls the pipeline job, and loads persisted detections from `/api/v1/detections`.

Set `VITE_API_URL` when the API runs elsewhere. `/health` reports database and Redis readiness; `/agents` reports model file status for the legacy service.

Use `/agents` to inspect every configured model agent and its file status. Each prediction response also includes `agent_statuses`.

Raw `.XTF` and `.JSF` parsing is not included yet because it depends on the sonar vendor format. The current model input is an image such as PNG, JPG, TIFF, or PBM. The Colab code trains the pipeline model on one class (`Pipeline`); the wreck model uses the class names stored in its Roboflow-trained weights.

---
Built for Ocean Preservation & Subsea Hydrographic Research.
