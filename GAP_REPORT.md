# DeepScan AI Requirements Gap Report

Date: 2026-09-08

## Executive finding

The repository contains most of the intended processing modules, but the website currently uses a separate legacy `/predict` path. Real uploads therefore bypass the production ingest, preprocessing, CFAR scoring, geotagging, persistence, and report API under `/api/v1`.

The product is best described as a functional prototype with an incomplete end-to-end integration, not yet a validated operational sonar cleanup system.

## Requirement status

| Requirement | Status | Evidence / gap |
|---|---|---|
| Side-scan sonar ingestion | Partial | XTF parsing exists through `pyxtf`; JSF and SDF are explicitly stub/basic binary parsers; image uploads can read a companion CSV. Vendor-format validation and parser fixtures are missing. |
| Speckle/noise reduction | Implemented in code | Lee/Frost filters, CLAHE, slant-range correction, and CFAR are present. There are unit tests, but no measured quality benchmark on representative sonar data. |
| Motion/dropout handling | Missing/partial | Heave, pitch, roll compensation and dropout repair are not implemented as a dedicated stage. The pipeline only consumes whatever navigation metadata the parser provides. |
| Object detection | Partial | A YOLOv8-seg wrapper exists and a `best.pt` wreck model is present. The active legacy API registers only the wreck model; there is no verified multi-class ghost-net/pipe/container model registry or mask response. |
| Semantic segmentation / ghost-net masks | Missing | The U-Net refinement hook is a placeholder and returns the coarse mask. The legacy `/predict` response contains boxes only. |
| Confidence scoring | Implemented in code, unvalidated | Model, shadow, CFAR, and edge penalties are fused into 0-100. Calibration metrics, threshold selection, precision/recall, and false-positive evaluation are missing. |
| Geotagging | Partial | WGS84 projection is implemented when per-ping navigation exists. Images without a companion metadata CSV intentionally produce zero coordinates; JSF/SDF stubs also produce zero navigation. |
| Reports | Partial | Backend JSON/CSV report endpoints and a frontend exporter exist. The frontend currently exports local state rather than downloading the persisted backend report, and report rows omit some required spatial/bounding fields. |
| UI upload and live results | Partial | Upload, map, results, and report screens exist. Real upload previously called legacy `/predict`; async job progress, backend detection retrieval, and failure recovery were not connected. |
| Edge deployment | Partial | Benchmark UI and INT8 export scripts exist. There is no verified ONNX/TensorRT runtime path in the production worker and no reproducible edge benchmark artifact. |
| Production operations | Missing/partial | Celery, Redis, Postgres/PostGIS, rate limiting, and health checks are scaffolded. Deployment needs a tested compose run, migrations, worker startup checks, model loading checks, and observability validation. |

## Highest-priority alignment work

1. Keep one inference contract: frontend uploads to `/api/v1/uploads`, polls `/api/v1/jobs/{id}`, then reads `/api/v1/detections?job_id={survey_id}`.
2. Replace the active legacy model registry with the trained sonar model set, including ghost-net, pipe, wreck, and debris classes, and return masks where trained.
3. Treat missing navigation as an explicit `geotag_status=unavailable`, not a valid coordinate of `(0, 0)`.
4. Add real XTF/JSF fixtures and an end-to-end test covering upload, worker completion, detection retrieval, and JSON/CSV report downloads.
5. Add motion compensation/dropout handling and evaluate the pipeline on a labeled holdout set with precision, recall, mAP/IoU, false-positive rate, latency, and memory measurements.

## Current change

The web upload flow is being connected to the async `/api/v1` pipeline. Demo presets remain local fixtures; only actual file uploads use the production job path.
