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

The backend currently runs the shipwreck inference agent only. Add future models to `AGENT_REGISTRY` in `backend/main.py`; each agent has its own name, display name, and model path. Override `WRECK_MODEL_PATH` if you use a different location.

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

The upload page sends image files to `http://localhost:8000/predict`.

The frontend sends uploaded images to `http://localhost:8000/predict`. Set `VITE_API_URL` when the API runs elsewhere. `/health` reports whether the shipwreck model file is available.

Use `/agents` to inspect every configured model agent and its file status. Each prediction response also includes `agent_statuses`.

Raw `.XTF` and `.JSF` parsing is not included yet because it depends on the sonar vendor format. The current model input is an image such as PNG, JPG, TIFF, or PBM. The Colab code trains the pipeline model on one class (`Pipeline`); the wreck model uses the class names stored in its Roboflow-trained weights.

---
Built for Ocean Preservation & Subsea Hydrographic Research.
