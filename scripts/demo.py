"""End-to-End Ghost Net Hunter Demonstration script.

Generates a synthetic side-scan sonar waterfall image with realistic ghost net
and pipeline debris targets, runs the complete ingestion -> speckle filtering ->
slant-range correction -> CLAHE -> CA-CFAR anomaly detection -> YOLOv8-seg ->
physics confidence fusion -> pyproj geotagging pipeline, and prints the JSON report.
"""

from __future__ import annotations

import json
from pathlib import Path
import cv2
import numpy as np


from ml.synthetic.generator import SyntheticSonarGenerator
from app.services.sonar_ingest.adapter import ingest_sonar_file, PingMetadata
from app.services.preprocessing.pipeline import preprocess_sonar
from app.services.detection.detector import run_detection
from app.services.scoring.fusion import score_and_filter
from app.services.geotagging.engine import geotag_detections, GeotaggedDetection


def run_demo() -> None:
    print("=================================================================")
    print("   GHOST NET HUNTER — END-TO-END SONAR DEBRIS PIPELINE DEMO     ")
    print("=================================================================\n")

    # Step 1: Generate synthetic sonar tile
    print("[1/5] Generating synthetic side-scan sonar waterfall image...")
    gen = SyntheticSonarGenerator(height=600, width=800, range_m=75.0, altitude_m=12.0)
    synth_img, synth_targets = gen.generate_sample(num_targets=2)
    
    demo_dir = Path("demo_output")
    demo_dir.mkdir(exist_ok=True)
    img_path = demo_dir / "sample_sonar.png"

    # Save as 8-bit PNG sonar image
    cv2.imwrite(str(img_path), (synth_img * 255).astype("uint8"))

    # Companion CSV with navigation metadata
    csv_path = demo_dir / "sample_sonar.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("ping_number,latitude,longitude,heading,altitude,slant_range\n")
        for i in range(600):
            f.write(f"{i},37.7749,-122.4194,90.0,12.0,75.0\n")

    print(f"   -> Saved sonar sample to {img_path}")
    print(f"   -> Created synthetic targets: {[t.target_type for t in synth_targets]}")

    # Step 2: Ingest & Parse
    print("\n[2/5] Ingesting sonar data & parsing navigation headers...")
    sonar_data = ingest_sonar_file(img_path)
    print(f"   -> Parsed image: shape={sonar_data.image.shape}, ground res={sonar_data.ground_resolution_m:.3f} m/px")

    # Step 3: Preprocessing Pipeline (Speckle filter + Slant Range + CLAHE + CA-CFAR)
    print("\n[3/5] Executing sonar preprocessing pipeline...")
    preprocessed = preprocess_sonar(sonar_data)
    print(f"   -> Lee speckle noise reduction applied")
    print(f"   -> CA-CFAR anomaly proposals found: {len(preprocessed.cfar_proposals)}")

    # Step 4: YOLOv8-seg Detection & Scoring Fusion
    print("\n[4/5] Running YOLOv8-seg neural detection & confidence fusion...")
    raw_dets = run_detection(preprocessed)
    scored_dets = score_and_filter(raw_dets, preprocessed, min_confidence=10.0)
    print(f"   -> Raw detections: {len(raw_dets)}, Scored detections: {len(scored_dets)}")

    # Step 5: Geotagging & Reporting
    print("\n[5/5] Geotagging detections with WGS84 coordinates & generating report...")
    final_geotagged = geotag_detections(scored_dets, sonar_data)

    report = {
        "survey_name": "Demo Sonar Mission 01",
        "total_pings": sonar_data.num_pings,
        "range_m": sonar_data.range_m,
        "detections_found": len(final_geotagged),
        "results": [
            {
                "class": d.detection.class_label,
                "confidence_score": round(d.detection.model_confidence * 100, 1),
                "latitude": round(d.latitude, 6),
                "longitude": round(d.longitude, 6),
                "across_track_m": round(d.across_track_m, 2),
                "bbox_px": d.detection.bbox_pixels,
            }
            for d in final_geotagged
        ],
    }

    report_path = demo_dir / "detection_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ DEMO COMPLETE! Final Report written to {report_path}:")
    print("-----------------------------------------------------------------")
    print(json.dumps(report, indent=2))
    print("-----------------------------------------------------------------")



if __name__ == "__main__":
    run_demo()
