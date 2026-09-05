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

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---
Built for Ocean Preservation & Subsea Hydrographic Research.
