export type DetectionClass = 
  | 'ghost_net'
  | 'shipwreck'
  | 'corroded_pipe'
  | 'sunken_container'
  | 'anchor_chain'
  | 'plastic_debris'
  | 'metal_drum';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface ScoreBreakdown {
  modelSoftmax: number;      // 0 to 100
  shadowConsistency: number; // 0 to 100
  cfarAgreement: number;     // 0 to 100
  fusedScore: number;        // 0 to 100
}

export interface SonarDetection {
  id: string;
  classLabel: string;
  rawClass: DetectionClass;
  confidence: number; // 0 to 100
  confidenceTier: ConfidenceTier;
  lat: number;
  lng: number;
  depthMeters: number;
  lengthMeters: number;
  widthMeters: number;
  boundingPoly: { x: number; y: number; width: number; height: number }; // Percentage 0-100 of tile
  scoreBreakdown: ScoreBreakdown;
  isCfarCandidateOnly: boolean; // For CFAR comparison toggle
  status: 'pending' | 'confirmed' | 'rejected';
  timestamp: string;
  locationName: string;
  croppedPatchBg: string; // Color gradient / pattern representing patch
}

export interface SurveyDataset {
  id: string;
  name: string;
  fileType: string;
  fileSize: string;
  timestamp: string;
  locationName: string;
  pingCount: number;
  surveyLengthKm: number;
  auvTrack: { lat: number; lng: number }[];
  detections: SonarDetection[];
  rawNoiseTileUrl?: string;
  filteredTileUrl?: string;
}

export interface PipelineStage {
  id: number;
  name: string;
  label: string;
  detail: string;
  durationMs: number;
}

export interface BenchmarkSpec {
  device: string;
  chipset: string;
  powerWatts: string;
  precision: string;
  fps: number;
  latencyMs: number;
  modelSizeMB: number;
  status: string;
}
