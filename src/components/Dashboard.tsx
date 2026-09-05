import React, { useState, useEffect } from 'react';
import { SAMPLE_DATASETS, PIPELINE_STAGES } from '../data/sampleData';
import type { SonarDetection, SurveyDataset } from '../types/sonar';
import { NoiseFilterSlider } from './NoiseFilterSlider';
import { InteractiveMap } from './InteractiveMap';
import { ReportsTable } from './ReportsTable';
import { ManualReviewPanel } from './ManualReviewPanel';
import { EdgeBenchmarkPanel } from './EdgeBenchmarkPanel';
import { AnalyticsCharts } from './AnalyticsCharts';
import { LimitationsCard } from './LimitationsCard';
import { StickerBadge } from './DoodleIcons';
import { 
  UploadCloud, 
  SlidersHorizontal, 
  Layers, 
  Crosshair, 
  MapPin 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Dashboard: React.FC = () => {
  // Active Dataset
  const [selectedDataset, setSelectedDataset] = useState<SurveyDataset>(SAMPLE_DATASETS[0]);
  
  // Pipeline Processing Simulation State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [pipelineProgress, setPipelineProgress] = useState<number>(100); // %
  const [logMessages, setLogMessages] = useState<string[]>([
    'System ready. Telemetry stream connected.',
    'Loaded preset: North Sea Sector 7B — Ghost Net Sweep',
  ]);

  // Detections State (Allows manual review confirmation/rejection)
  const [detections, setDetections] = useState<SonarDetection[]>(SAMPLE_DATASETS[0].detections);
  const [selectedDetection, setSelectedDetection] = useState<SonarDetection | null>(SAMPLE_DATASETS[0].detections[0]);

  // Controls & Toggles
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(35); // Filter < 35%
  const [showCfarOnly, setShowCfarOnly] = useState<boolean>(false); // Toggle CFAR vs Fused

  // Update detections when dataset changes
  useEffect(() => {
    setDetections(selectedDataset.detections);
    setSelectedDetection(selectedDataset.detections[0] || null);
    setLogMessages((prev) => [
      ...prev,
      `Switched dataset to: ${selectedDataset.name}`,
    ]);
  }, [selectedDataset]);

  // Trigger File Upload Processing Pipeline Simulator
  const triggerSimulatedUpload = (dataset: SurveyDataset) => {
    setIsProcessing(true);
    setCurrentStageIdx(0);
    setPipelineProgress(0);
    setSelectedDataset(dataset);

    const stages = PIPELINE_STAGES;
    let step = 0;

    const interval = setInterval(() => {
      if (step < stages.length) {
        setCurrentStageIdx(step);
        setPipelineProgress(Math.round(((step + 1) / stages.length) * 100));
        setLogMessages((prev) => [
          ...prev,
          `[${step + 1}/${stages.length}] ${stages[step].label}: ${stages[step].detail}`,
        ]);
        step++;
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        setLogMessages((prev) => [
          ...prev,
          '✓ Pipeline execution complete! 4 anomalies geotagged & fused.',
        ]);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    }, 600);
  };

  // Filter visible detections based on confidence threshold and CFAR toggle
  const visibleDetections = detections.filter((d) => {
    if (d.confidence < confidenceThreshold) return false;
    if (!showCfarOnly && d.isCfarCandidateOnly) return false;
    return true;
  });

  const handleUpdateStatus = (id: string, newStatus: 'confirmed' | 'rejected') => {
    setDetections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
    if (selectedDetection?.id === id) {
      setSelectedDetection((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <section id="live-demo" className="py-16 px-4 bg-[#A8C3BC] scalloped-seafoam-top relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <StickerBadge text="Interactive Production UI" variant="yellow" rotate="-3deg" className="mb-3" />
          <h2 className="font-peachy text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Live AI Sonar Inspection <span className="text-[#305CDE] underline decoration-wavy decoration-white">Dashboard</span>
          </h2>
          <p className="font-body text-base text-slate-800 font-medium mt-3">
            Upload raw side-scan sonar pings, filter acoustic noise, inspect bounding masks with fused confidence scores, and export GIS reports.
          </p>
        </div>

        {/* Main Dashboard Scalloped Collage Container */}
        <div className="space-y-8">
          {/* Module 1: Upload & Pipeline Processing Control Center */}
          <div className="bg-white border-3.5 border-slate-900 rounded-3xl p-6 shadow-[7px_7px_0px_#1E293B]">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-6">
              {/* Drag and Drop Zone */}
              <div className="w-full lg:w-7/12">
                <div className="border-3 border-dashed border-[#305CDE] rounded-2xl p-6 bg-[#B5C7EB]/20 hover:bg-[#B5C7EB]/40 transition-colors text-center relative flex flex-col items-center justify-center">
                  <UploadCloud className="w-12 h-12 text-[#305CDE] mb-3 animate-bounce" />
                  <h4 className="font-peachy text-xl font-bold text-slate-900 mb-1">
                    Drag & Drop Sonar Log Files (.xtf, .jsf, .tiff, .png)
                  </h4>
                  <p className="font-body text-xs text-slate-600 mb-4 max-w-md">
                    Or select from our pre-loaded subsea survey missions to test the live processing pipeline instantly:
                  </p>

                  {/* Preset Dataset Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {SAMPLE_DATASETS.map((ds) => (
                      <button
                        key={ds.id}
                        disabled={isProcessing}
                        onClick={() => triggerSimulatedUpload(ds)}
                        className={`font-peachy text-xs font-bold px-3 py-1.5 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] hover:-translate-y-0.5 transition-all ${
                          selectedDataset.id === ds.id
                            ? 'bg-[#305CDE] text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        ⚡ Test: {ds.locationName}
                      </button>
                    ))}
                  </div>

                  {/* Supported File Format Chips */}
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500">
                    <span className="bg-slate-200 px-2 py-0.5 rounded border border-slate-300">.XTF (Triton)</span>
                    <span className="bg-slate-200 px-2 py-0.5 rounded border border-slate-300">.JSF (EdgeTech)</span>
                    <span className="bg-slate-200 px-2 py-0.5 rounded border border-slate-300">.TIFF (GeoTIFF)</span>
                    <span className="bg-slate-200 px-2 py-0.5 rounded border border-slate-300">.PNG (Raster)</span>
                  </div>
                </div>
              </div>

              {/* Live Pipeline Multi-stage Progress & Status Ticker */}
              <div className="w-full lg:w-5/12 bg-slate-900 text-white rounded-2xl p-5 border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between min-h-[260px]">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3 font-peachy text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isProcessing ? 'bg-[#FEE440] animate-ping' : 'bg-[#00E676]'}`} />
                      PIPELINE STATUS
                    </span>
                    <span className="font-mono text-[#FEE440]">{pipelineProgress}% COMPLETE</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700 mb-4">
                    <div
                      className="bg-gradient-to-r from-[#305CDE] via-[#00E676] to-[#FEE440] h-full transition-all duration-300"
                      style={{ width: `${pipelineProgress}%` }}
                    />
                  </div>

                  {/* Current Active Pipeline Stage Label */}
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 mb-3">
                    <div className="font-peachy text-xs font-bold text-[#00E676] mb-0.5">
                      Stage {PIPELINE_STAGES[currentStageIdx]?.id || 6}/6: {PIPELINE_STAGES[currentStageIdx]?.label}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {PIPELINE_STAGES[currentStageIdx]?.detail}
                    </div>
                  </div>
                </div>

                {/* Simulated Telemetry Stream Log Ticker Box */}
                <div className="bg-black/80 rounded-xl p-2.5 font-mono text-[10px] text-emerald-400 h-24 overflow-y-auto space-y-1 border border-slate-800">
                  {logMessages.map((msg, i) => (
                    <div key={i} className="leading-tight">
                      &gt; {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: Interactive Sonar Tile Inspection & Fused Score Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Sonar Tile Display with Bounding Boxes & Controls */}
            <div className="lg:col-span-8 bg-white border-3.5 border-slate-900 rounded-3xl p-6 shadow-[6px_6px_0px_#1E293B] flex flex-col justify-between">
              {/* Controls Bar: Confidence Threshold Slider & CFAR Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b-2 border-slate-900 pb-4">
                {/* Confidence Threshold Slider */}
                <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
                  <SlidersHorizontal className="w-4 h-4 text-[#305CDE]" />
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between text-[11px] font-peachy font-extrabold text-slate-800 gap-2">
                      <span>Confidence Threshold:</span>
                      <span className="text-[#305CDE] text-xs font-mono">{confidenceThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="95"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      className="w-36 h-2 accent-[#305CDE] cursor-pointer"
                    />
                  </div>
                </div>

                {/* CFAR vs Fused Toggle (Differentiator #9) */}
                <button
                  onClick={() => setShowCfarOnly(!showCfarOnly)}
                  className={`font-peachy text-xs font-extrabold px-3.5 py-2 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] transition-all flex items-center gap-2 ${
                    showCfarOnly
                      ? 'bg-[#FF5964] text-white'
                      : 'bg-[#FEE440] text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{showCfarOnly ? 'Showing Raw CFAR Candidates' : 'Showing Fused Detections'}</span>
                </button>
              </div>

              {/* Sonar Waterfall Canvas with Bounding Boxes */}
              <div className="relative bg-[#1A397B] rounded-2xl h-96 overflow-hidden border-3 border-slate-900 shadow-inner flex items-center justify-center">
                {/* Sonar Pings Grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#305CDE20_1px,transparent_1px),linear-gradient(to_bottom,#305CDE20_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* Center Swath Divider Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-dashed bg-[#FEE440]/60 z-0" />

                {/* Render Visible Detections as Interactive Bounding Boxes */}
                {visibleDetections.map((det) => {
                  const isSelected = selectedDetection?.id === det.id;
                  const boxColor =
                    det.confidence >= 80 ? 'border-[#00E676] text-[#00E676] bg-[#00E676]/15' :
                    det.confidence >= 50 ? 'border-[#FEE440] text-[#FEE440] bg-[#FEE440]/15' :
                    'border-[#FF5964] text-[#FF5964] bg-[#FF5964]/15';

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
                      className={`absolute border-3 rounded-xl transition-all cursor-pointer z-10 flex flex-col justify-between p-1.5 group ${boxColor} ${
                        isSelected ? 'ring-4 ring-white shadow-[0_0_25px_rgba(254,228,64,0.6)] scale-[1.02]' : 'hover:scale-[1.01]'
                      }`}
                    >
                      {/* Box Top Label Badge */}
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold bg-slate-950/90 text-white px-1.5 py-0.5 rounded border border-slate-700 w-fit">
                        <span>{det.id} ({det.confidence}%)</span>
                      </div>

                      {/* Box Center Mask Contour */}
                      <div className="border border-dashed border-white/50 rounded flex items-center justify-center py-1">
                        <Crosshair className="w-3.5 h-3.5 opacity-80 group-hover:rotate-90 transition-transform" />
                      </div>

                      {/* Box Bottom Class Tag */}
                      <div className="text-[9px] font-peachy font-extrabold truncate bg-slate-900/90 text-white px-1 rounded">
                        {det.classLabel}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sonar Metadata Strip */}
              <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-peachy font-bold text-slate-700 gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
                  Active Mission: {selectedDataset.name}
                </span>
                <span className="font-mono text-slate-600">
                  {visibleDetections.length} Anomaly Bounding Boxes Visible
                </span>
              </div>
            </div>

            {/* Right: Selected Detection Cropped Patch & Fused Score Breakdown Side Panel */}
            <div className="lg:col-span-4 bg-white border-3.5 border-slate-900 rounded-3xl p-5 shadow-[6px_6px_0px_#1E293B] flex flex-col justify-between">
              {selectedDetection ? (
                <div>
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
                    <span className="font-peachy font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-[#305CDE]" />
                      Selected Anomaly Patch
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-peachy font-extrabold text-xs border border-slate-900 ${
                      selectedDetection.confidence >= 80 ? 'bg-[#00E676] text-emerald-950' : 'bg-[#FEE440] text-slate-900'
                    }`}>
                      {selectedDetection.confidence}% Conf.
                    </span>
                  </div>

                  {/* Cropped Image Patch Preview */}
                  <div className={`h-40 rounded-2xl border-2.5 border-slate-900 bg-gradient-to-tr ${selectedDetection.croppedPatchBg} p-3 flex flex-col justify-between mb-4 relative overflow-hidden shadow-inner`}>
                    <div className="flex justify-between items-start">
                      <span className="font-peachy text-xs font-extrabold text-white bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                        {selectedDetection.classLabel}
                      </span>
                      <span className="font-mono text-[10px] text-amber-200 bg-black/60 px-1.5 py-0.5 rounded">
                        {selectedDetection.id}
                      </span>
                    </div>

                    <div className="border border-dashed border-[#FEE440] rounded-xl h-16 flex items-center justify-center bg-black/30">
                      <span className="font-mono text-xs text-[#FEE440] font-bold">Cropped Patch Matrix</span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-300">
                      <span>Depth: {selectedDetection.depthMeters}m</span>
                      <span>Dim: {selectedDetection.lengthMeters}m × {selectedDetection.widthMeters}m</span>
                    </div>
                  </div>

                  {/* Fused Score Breakdown Mini Bar Chart (Differentiator #3) */}
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-900 mb-4 shadow-[2px_2px_0px_#1E293B]">
                    <div className="font-peachy font-bold text-xs text-slate-900 mb-3 flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span>Fused Confidence Score Formula</span>
                      <span className="text-[#305CDE] font-mono font-extrabold">
                        {selectedDetection.scoreBreakdown.fusedScore}%
                      </span>
                    </div>

                    <div className="space-y-2.5 font-body text-[11px] text-slate-700">
                      {/* Model Softmax */}
                      <div>
                        <div className="flex justify-between font-peachy font-bold mb-0.5">
                          <span>Model Softmax Score:</span>
                          <span className="font-mono text-slate-900">{selectedDetection.scoreBreakdown.modelSoftmax}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-400">
                          <div className="bg-[#305CDE] h-full" style={{ width: `${selectedDetection.scoreBreakdown.modelSoftmax}%` }} />
                        </div>
                      </div>

                      {/* Shadow Consistency */}
                      <div>
                        <div className="flex justify-between font-peachy font-bold mb-0.5">
                          <span>Acoustic Shadow Consistency:</span>
                          <span className="font-mono text-slate-900">{selectedDetection.scoreBreakdown.shadowConsistency}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-400">
                          <div className="bg-[#00E676] h-full" style={{ width: `${selectedDetection.scoreBreakdown.shadowConsistency}%` }} />
                        </div>
                      </div>

                      {/* CFAR Agreement */}
                      <div>
                        <div className="flex justify-between font-peachy font-bold mb-0.5">
                          <span>CFAR Candidate Agreement:</span>
                          <span className="font-mono text-slate-900">{selectedDetection.scoreBreakdown.cfarAgreement}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-400">
                          <div className="bg-[#FEE440] h-full" style={{ width: `${selectedDetection.scoreBreakdown.cfarAgreement}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Geotag Coordinates */}
                  <div className="bg-[#B5C7EB]/40 p-3 rounded-xl border border-slate-900 font-mono text-xs text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#305CDE]" />
                      WGS84 Position:
                    </span>
                    <span className="font-bold">{selectedDetection.lat.toFixed(4)}°N, {selectedDetection.lng.toFixed(4)}°E</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 font-peachy text-slate-500">
                  Select an anomaly box on the sonar canvas to view its score breakdown.
                </div>
              )}
            </div>
          </div>

          {/* Module 3: Before / After Noise Filter Interactive Slider Viewer */}
          <NoiseFilterSlider />

          {/* Module 4: Interactive GIS Map View */}
          <InteractiveMap
            detections={visibleDetections}
            auvTrack={selectedDataset.auvTrack}
            selectedDetection={selectedDetection}
            onSelectDetection={(det) => setSelectedDetection(det)}
          />

          {/* Module 5: Sortable Reports Table + JSON / CSV Exporter */}
          <ReportsTable
            detections={visibleDetections}
            onSelectDetection={(det) => setSelectedDetection(det)}
          />

          {/* Module 6: Manual Review & Active Learning Mode */}
          <ManualReviewPanel
            detections={detections}
            onUpdateDetectionStatus={handleUpdateStatus}
          />

          {/* Module 7: Edge Deployment Benchmark Panel */}
          <EdgeBenchmarkPanel />

          {/* Module 8: Mission Analytics & Histograms */}
          <AnalyticsCharts />

          {/* Module 9: Technical Limitations & Integrity Transparency Card */}
          <LimitationsCard />
        </div>
      </div>
    </section>
  );
};
