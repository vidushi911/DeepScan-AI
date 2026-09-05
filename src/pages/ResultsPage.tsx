import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAMPLE_DATASETS } from '../data/sampleData';
import type { SonarDetection, SurveyDataset } from '../types/sonar';
import { 
  Crosshair, 
  SlidersHorizontal, 
  Layers, 
  MapPin, 
  ArrowRight, 
  Activity 
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDataset, setSelectedDataset] = useState<SurveyDataset>(SAMPLE_DATASETS[0]);
  const [selectedDetection, setSelectedDetection] = useState<SonarDetection | null>(SAMPLE_DATASETS[0].detections[0]);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(35);
  const [showCfarOnly, setShowCfarOnly] = useState<boolean>(false);

  const visibleDetections = selectedDataset.detections.filter((d) => {
    if (d.confidence < confidenceThreshold) return false;
    if (!showCfarOnly && d.isCfarCandidateOnly) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Title & Mission Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#305CDE] mb-1">
            <Crosshair className="w-4 h-4" />
            <span>Module 02 / Feature Isolation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Acoustic Detection Overlay & Score Matrix
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Inspect segmented sonar anomaly boxes, adjust confidence thresholds, and evaluate fused score breakdowns.
          </p>
        </div>

        {/* Dataset Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={selectedDataset.id}
            onChange={(e) => {
              const ds = SAMPLE_DATASETS.find(d => d.id === e.target.value);
              if (ds) {
                setSelectedDataset(ds);
                setSelectedDetection(ds.detections[0] || null);
              }
            }}
            className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#305CDE] shadow-sm cursor-pointer"
          >
            {SAMPLE_DATASETS.map((ds) => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>

          <button
            onClick={() => navigate('/map')}
            className="bg-[#305CDE] hover:bg-[#2D68C4] text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>View GIS Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Sonar Waterfall Canvas Display */}
        <div className="lg:col-span-8 tech-card p-6 flex flex-col justify-between space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            {/* Confidence Slider */}
            <div className="flex items-center gap-3 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
              <SlidersHorizontal className="w-4 h-4 text-[#305CDE]" />
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 gap-3">
                  <span>Confidence Threshold:</span>
                  <span className="text-[#305CDE] font-mono font-bold">{confidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="95"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="w-36 h-1.5 accent-[#305CDE] cursor-pointer"
                />
              </div>
            </div>

            {/* CFAR vs Fused Toggle */}
            <button
              onClick={() => setShowCfarOnly(!showCfarOnly)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                showCfarOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{showCfarOnly ? 'CFAR Candidates (High False Alarms)' : 'Fused High-Precision Detections'}</span>
            </button>
          </div>

          {/* Sonar Canvas Box */}
          <div className="relative bg-[#0A192F] rounded-2xl h-96 overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            {/* Sonar Waterfall Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(48,92,222,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(48,92,222,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />

            {/* Swath Center Line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-r border-dashed border-blue-500/40 z-0" />

            {/* Render Bounding Boxes */}
            {visibleDetections.map((det) => {
              const isSelected = selectedDetection?.id === det.id;
              const boxStyle =
                det.confidence >= 80 ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10' :
                det.confidence >= 50 ? 'border-amber-400 text-amber-400 bg-amber-500/10' :
                'border-red-400 text-red-400 bg-red-500/10';

              return (
                <div
                  key={det.id}
                  onClick={() => setSelectedDetection(det)}
                  style={{
                    left: `${det.boundingPoly.x}%`,
                    top: `${det.boundingPoly.y}%`,
                    width: `${det.boundingPoly.width}%`,
                    height: `${det.boundingPoly.height}%`,
                  }}
                  className={`absolute border-2 rounded-lg transition-all cursor-pointer z-10 flex flex-col justify-between p-1.5 group ${boxStyle} ${
                    isSelected ? 'ring-4 ring-white shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-[1.02]' : 'hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold bg-slate-950/90 text-white px-1.5 py-0.5 rounded border border-slate-700 w-fit">
                    <span>{det.id} ({det.confidence}%)</span>
                  </div>

                  <div className="border border-dashed border-white/40 rounded flex items-center justify-center py-1">
                    <Crosshair className="w-3.5 h-3.5 opacity-80 group-hover:rotate-90 transition-transform" />
                  </div>

                  <div className="text-[9px] font-semibold truncate bg-slate-900/90 text-white px-1 rounded">
                    {det.classLabel}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Metrics */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1">
            <span>SURVEY: {selectedDataset.locationName}</span>
            <span>{visibleDetections.length} ANOMALIES ACTIVE</span>
          </div>
        </div>

        {/* Right: Selected Anomaly Score Breakdown Matrix */}
        <div className="lg:col-span-4 tech-card p-6 flex flex-col justify-between space-y-4">
          {selectedDetection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#305CDE]" />
                  Anomaly Score Breakdown
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedDetection.confidence >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedDetection.confidence}% Fused
                </span>
              </div>

              {/* Cropped Image Patch Preview */}
              <div className={`h-36 rounded-xl border border-slate-300 bg-gradient-to-tr ${selectedDetection.croppedPatchBg} p-3 flex flex-col justify-between shadow-inner`}>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                    {selectedDetection.classLabel}
                  </span>
                  <span className="font-mono text-[10px] text-amber-200 bg-black/60 px-1.5 py-0.5 rounded">
                    {selectedDetection.id}
                  </span>
                </div>

                <div className="border border-dashed border-white/40 rounded h-14 flex items-center justify-center bg-black/30">
                  <span className="font-mono text-xs text-[#FEE440] font-semibold">Cropped Patch Matrix</span>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-slate-300">
                  <span>Depth: {selectedDetection.depthMeters}m</span>
                  <span>Size: {selectedDetection.lengthMeters}m × {selectedDetection.widthMeters}m</span>
                </div>
              </div>

              {/* Fused Score Breakdown Mini Bar Chart */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span>Fused Score Breakdown</span>
                  <span className="text-[#305CDE] font-mono font-bold">
                    {selectedDetection.scoreBreakdown.fusedScore}%
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div>
                    <div className="flex justify-between font-medium mb-0.5 text-[11px]">
                      <span>Model Softmax:</span>
                      <span className="font-mono font-bold">{selectedDetection.scoreBreakdown.modelSoftmax}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#305CDE] h-full" style={{ width: `${selectedDetection.scoreBreakdown.modelSoftmax}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-0.5 text-[11px]">
                      <span>Acoustic Shadow Check:</span>
                      <span className="font-mono font-bold">{selectedDetection.scoreBreakdown.shadowConsistency}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${selectedDetection.scoreBreakdown.shadowConsistency}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-0.5 text-[11px]">
                      <span>CFAR Candidate Agreement:</span>
                      <span className="font-mono font-bold">{selectedDetection.scoreBreakdown.cfarAgreement}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${selectedDetection.scoreBreakdown.cfarAgreement}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Geotag Info */}
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs font-mono text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[#305CDE] font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  WGS84 Lat/Lon:
                </span>
                <span className="font-bold">{selectedDetection.lat.toFixed(4)}°N, {selectedDetection.lng.toFixed(4)}°E</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">
              Click any bounding box on the sonar canvas to view its score breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
