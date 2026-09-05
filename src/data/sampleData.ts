import type { SurveyDataset, BenchmarkSpec, PipelineStage } from '../types/sonar';

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 1, name: 'nav_parse', label: 'Parsing nav metadata', detail: 'Reading sensor orientation & bathymetry logs', durationMs: 400 },
  { id: 2, name: 'speckle_filter', label: 'Speckle filtering (Lee/Frost)', detail: 'Applying adaptive spatial noise suppression', durationMs: 600 },
  { id: 3, name: 'cfar_proposal', label: 'CFAR proposal generation', detail: 'Constant False Alarm Rate candidate extraction', durationMs: 500 },
  { id: 4, name: 'yolo_inference', label: 'Running YOLO-seg acoustic model', detail: 'Deep convolutional feature segmentation', durationMs: 700 },
  { id: 5, name: 'score_fusion', label: 'Fusing confidence scores', detail: 'Combining softmax, shadow consistency & CFAR agreement', durationMs: 400 },
  { id: 6, name: 'geotag_export', label: 'Geotagging & Report ready', detail: 'Projecting to WGS84 coordinates & generating GeoJSON', durationMs: 300 },
];

export const SAMPLE_DATASETS: SurveyDataset[] = [
  {
    id: 'ds-north-sea-07',
    name: 'North Sea Sector 7B — Ghost Net Sweep',
    fileType: 'XTF (eXtended Triton Format)',
    fileSize: '142.8 MB',
    timestamp: '2026-09-04 14:22:10 UTC',
    locationName: 'North Sea Shelf (Sector 7B)',
    pingCount: 18450,
    surveyLengthKm: 14.2,
    auvTrack: [
      { lat: 56.415, lng: 3.205 },
      { lat: 56.418, lng: 3.211 },
      { lat: 56.422, lng: 3.218 },
      { lat: 56.426, lng: 3.224 },
      { lat: 56.430, lng: 3.230 }
    ],
    detections: [
      {
        id: 'DET-101',
        classLabel: 'Tangled Ghost Gillnet',
        rawClass: 'ghost_net',
        confidence: 96,
        confidenceTier: 'high',
        lat: 56.4182,
        lng: 3.2114,
        depthMeters: 48.5,
        lengthMeters: 18.4,
        widthMeters: 6.2,
        boundingPoly: { x: 22, y: 18, width: 26, height: 28 },
        scoreBreakdown: {
          modelSoftmax: 97,
          shadowConsistency: 95,
          cfarAgreement: 96,
          fusedScore: 96
        },
        isCfarCandidateOnly: false,
        status: 'pending',
        timestamp: '14:22:38 UTC',
        locationName: 'North Sea Sector 7B',
        croppedPatchBg: 'from-amber-950 via-slate-900 to-amber-900'
      },
      {
        id: 'DET-102',
        classLabel: 'Abandoned Trawl Cable',
        rawClass: 'ghost_net',
        confidence: 84,
        confidenceTier: 'high',
        lat: 56.4225,
        lng: 3.2189,
        depthMeters: 51.2,
        lengthMeters: 34.0,
        widthMeters: 1.8,
        boundingPoly: { x: 62, y: 44, width: 22, height: 35 },
        scoreBreakdown: {
          modelSoftmax: 86,
          shadowConsistency: 82,
          cfarAgreement: 85,
          fusedScore: 84
        },
        isCfarCandidateOnly: false,
        status: 'pending',
        timestamp: '14:28:05 UTC',
        locationName: 'North Sea Sector 7B',
        croppedPatchBg: 'from-slate-950 via-cyan-950 to-slate-900'
      },
      {
        id: 'DET-103',
        classLabel: 'Corroded Metal Drum',
        rawClass: 'metal_drum',
        confidence: 68,
        confidenceTier: 'medium',
        lat: 56.4241,
        lng: 3.2208,
        depthMeters: 52.8,
        lengthMeters: 2.1,
        widthMeters: 1.5,
        boundingPoly: { x: 12, y: 68, width: 14, height: 16 },
        scoreBreakdown: {
          modelSoftmax: 65,
          shadowConsistency: 72,
          cfarAgreement: 68,
          fusedScore: 68
        },
        isCfarCandidateOnly: false,
        status: 'pending',
        timestamp: '14:31:12 UTC',
        locationName: 'North Sea Sector 7B',
        croppedPatchBg: 'from-stone-900 via-amber-950 to-slate-900'
      },
      {
        id: 'DET-104',
        classLabel: 'Acoustic Ripple False Positive',
        rawClass: 'plastic_debris',
        confidence: 42,
        confidenceTier: 'low',
        lat: 56.4278,
        lng: 3.2267,
        depthMeters: 49.1,
        lengthMeters: 4.5,
        widthMeters: 3.2,
        boundingPoly: { x: 74, y: 15, width: 16, height: 18 },
        scoreBreakdown: {
          modelSoftmax: 48,
          shadowConsistency: 35,
          cfarAgreement: 44,
          fusedScore: 42
        },
        isCfarCandidateOnly: true, // Only shown in raw CFAR mode
        status: 'pending',
        timestamp: '14:36:40 UTC',
        locationName: 'North Sea Sector 7B',
        croppedPatchBg: 'from-blue-950 via-slate-900 to-blue-900'
      }
    ]
  },
  {
    id: 'ds-baltic-sea-03',
    name: 'Baltic Sea Trench — Wreckage & Debris',
    fileType: 'JSF (Edgetech Sonar Format)',
    fileSize: '210.4 MB',
    timestamp: '2026-09-03 09:15:44 UTC',
    locationName: 'Baltic Basin (54.89° N)',
    pingCount: 24100,
    surveyLengthKm: 18.6,
    auvTrack: [
      { lat: 54.890, lng: 19.335 },
      { lat: 54.892, lng: 19.340 },
      { lat: 54.896, lng: 19.348 },
      { lat: 54.901, lng: 19.356 }
    ],
    detections: [
      {
        id: 'DET-201',
        classLabel: 'Sunken Cargo Container',
        rawClass: 'sunken_container',
        confidence: 94,
        confidenceTier: 'high',
        lat: 54.8921,
        lng: 19.3402,
        depthMeters: 82.0,
        lengthMeters: 12.2,
        widthMeters: 2.4,
        boundingPoly: { x: 30, y: 25, width: 35, height: 30 },
        scoreBreakdown: {
          modelSoftmax: 96,
          shadowConsistency: 93,
          cfarAgreement: 93,
          fusedScore: 94
        },
        isCfarCandidateOnly: false,
        status: 'pending',
        timestamp: '09:18:02 UTC',
        locationName: 'Baltic Trench',
        croppedPatchBg: 'from-sky-950 via-slate-950 to-sky-900'
      },
      {
        id: 'DET-202',
        classLabel: 'Wooden Vessel Hull Fragment',
        rawClass: 'shipwreck',
        confidence: 92,
        confidenceTier: 'high',
        lat: 54.8964,
        lng: 19.3481,
        depthMeters: 86.4,
        lengthMeters: 24.8,
        widthMeters: 8.5,
        boundingPoly: { x: 15, y: 55, width: 40, height: 35 },
        scoreBreakdown: {
          modelSoftmax: 94,
          shadowConsistency: 91,
          cfarAgreement: 91,
          fusedScore: 92
        },
        isCfarCandidateOnly: false,
        status: 'pending',
        timestamp: '09:24:19 UTC',
        locationName: 'Baltic Trench',
        croppedPatchBg: 'from-amber-950 via-yellow-950 to-slate-950'
      },
      {
        id: 'DET-203',
        classLabel: 'Submerged Plastic crate Cluster',
        rawClass: 'plastic_debris',
        confidence: 76,
        confidenceTier: 'medium',
        lat: 54.9008,
        lng: 19.3552,
        depthMeters: 79.2,
        lengthMeters: 5.6,
        widthMeters: 4.1,
        boundingPoly: { x: 65, y: 20, width: 22, height: 24 },
        scoreBreakdown: {
          modelSoftmax: 78,
          shadowConsistency: 74,
          cfarAgreement: 76,
          fusedScore: 76
        },
        isCfarCandidateOnly: false,
        status: 'pending',
        timestamp: '09:31:05 UTC',
        locationName: 'Baltic Trench',
        croppedPatchBg: 'from-emerald-950 via-teal-950 to-slate-950'
      }
    ]
  },
  {
    id: 'ds-gulf-pipeline-01',
    name: 'Gulf of Mexico — Pipeline Inspection',
    fileType: 'TIFF (GeoTIFF Raster)',
    fileSize: '312.0 MB',
    timestamp: '2026-09-02 18:40:00 UTC',
    locationName: 'Mississippi Canyon (28.34° N)',
    pingCount: 31000,
    surveyLengthKm: 22.0,
    auvTrack: [
      { lat: 28.338, lng: -89.110 },
      { lat: 28.341, lng: -89.104 },
      { lat: 28.346, lng: -89.095 },
      { lat: 28.350, lng: -89.088 }
    ],
    detections: [
      {
        id: 'DET-301',
        classLabel: 'Corroded Subsea Pipeline Segment',
        rawClass: 'corroded_pipe',
        confidence: 98,
        confidenceTier: 'high',
        lat: 28.3412,
        lng: -89.1041,
        depthMeters: 142.0,
        lengthMeters: 120.0,
        widthMeters: 1.2,
        boundingPoly: { x: 10, y: 10, width: 80, height: 20 },
        scoreBreakdown: {
          modelSoftmax: 99,
          shadowConsistency: 97,
          cfarAgreement: 98,
          fusedScore: 98
        },
        isCfarCandidateOnly: false,
        status: 'pending',
        timestamp: '18:43:10 UTC',
        locationName: 'Gulf Mississippi Canyon',
        croppedPatchBg: 'from-indigo-950 via-slate-950 to-blue-950'
      },
      {
        id: 'DET-302',
        classLabel: 'Heavy Anchor Chain Debris',
        rawClass: 'anchor_chain',
        confidence: 88,
        confidenceTier: 'high',
        lat: 28.3458,
        lng: -89.0953,
        depthMeters: 138.5,
        lengthMeters: 16.5,
        widthMeters: 0.8,
        boundingPoly: { x: 45, y: 48, width: 30, height: 38 },
        scoreBreakdown: {
          modelSoftmax: 89,
          shadowConsistency: 87,
          cfarAgreement: 88,
          fusedScore: 88
        },
        isCfarCandidateOnly: false,
        status: 'pending',
        timestamp: '18:50:22 UTC',
        locationName: 'Gulf Mississippi Canyon',
        croppedPatchBg: 'from-stone-900 via-amber-950 to-slate-900'
      }
    ]
  }
];

export const BENCHMARK_METRICS: BenchmarkSpec[] = [
  {
    device: 'NVIDIA Jetson Orin Nano',
    chipset: '6-core ARM v8.2, 1024 CUDA Cores',
    powerWatts: '7.5W – 15W',
    precision: 'INT8 Quantized',
    fps: 42.4,
    latencyMs: 23.5,
    modelSizeMB: 14.2,
    status: 'Optimal Edge Target'
  },
  {
    device: 'NVIDIA Jetson AGX Orin',
    chipset: '12-core ARM v8.2, 2048 CUDA Cores',
    powerWatts: '15W – 50W',
    precision: 'INT8 Quantized',
    fps: 118.6,
    latencyMs: 8.4,
    modelSizeMB: 14.2,
    status: 'High-Speed Survey'
  },
  {
    device: 'Intel Core i7-13700H CPU',
    chipset: 'Laptop CPU (No Discrete GPU)',
    powerWatts: '45W',
    precision: 'FP32 Unquantized',
    fps: 18.1,
    latencyMs: 55.2,
    modelSizeMB: 56.8,
    status: 'Fallback Mode'
  },
  {
    device: 'NVIDIA RTX 4090 Workstation',
    chipset: '24GB VRAM Cloud Server',
    powerWatts: '350W',
    precision: 'FP16 Half',
    fps: 340.0,
    latencyMs: 2.9,
    modelSizeMB: 28.4,
    status: 'Cloud Baseline'
  }
];

export const KNOWN_LIMITATIONS = [
  {
    title: 'Thermocline Acoustic Refraction',
    description: 'Sharp water temperature stratification layers can bend sonar rays, creating ghosting artifacts near shallow shelf edges.',
    mitigation: 'Fused with altimeter depth data to flag refraction-prone pings automatically.'
  },
  {
    title: 'Training Data Scarcity for Deep-Sea Carbon Debris',
    description: 'Non-metallic composite materials have acoustic impedance close to seabed silt, lowering raw softmax confidence.',
    mitigation: 'Shadow-consistency validation compensates by detecting shadow cast patterns.'
  },
  {
    title: 'GPS Position Drift in Deep Submersibles',
    description: 'USBL acoustic positioning can accumulate ~0.5m drift per hour when submersed below 200m depth.',
    mitigation: 'Dead-reckoning Kalman smoothing aligns detection coordinates with bathymetric maps.'
  }
];
