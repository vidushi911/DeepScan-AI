import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAMPLE_DATASETS, PIPELINE_STAGES } from '../data/sampleData';
import type { SurveyDataset } from '../types/sonar';
import { NoiseFilterSlider } from '../components/NoiseFilterSlider';
import { 
  UploadCloud, 
  ArrowRight, 
  Terminal 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDataset, setSelectedDataset] = useState<SurveyDataset>(SAMPLE_DATASETS[0]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(5); // Default 100%
  const [pipelineProgress, setPipelineProgress] = useState<number>(100);
  const [logMessages, setLogMessages] = useState<string[]>([
    'System initialized. Hydrographic receiver standing by.',
    'Loaded dataset: North Sea Sector 7B — Ghost Net Sweep',
    '✓ Hydrographic telemetry verified. 4 anomalies isolated.',
  ]);

  const triggerUploadSimulator = (dataset: SurveyDataset) => {
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
          `✓ Pipeline execution complete! Geotagged ${dataset.detections.length} anomalies. Ready for results review.`,
        ]);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
    }, 550);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#305CDE] mb-1">
            <UploadCloud className="w-4 h-4" />
            <span>Module 01 / Pipeline Intake</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Sonar Log File Upload & Despeckling Pipeline
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload raw side-scan sonar files (.XTF, .JSF, .TIFF) to run Lee & Frost noise filtering and YOLOv8 feature proposals.
          </p>
        </div>

        <button
          onClick={() => navigate('/results')}
          className="bg-[#305CDE] hover:bg-[#2D68C4] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <span>View Detection Results</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Upload Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Drag and Drop Zone */}
        <div className="lg:col-span-7 tech-card p-6 flex flex-col justify-between space-y-6">
          <div className="border-2 border-dashed border-[#305CDE]/50 rounded-2xl p-8 bg-blue-50/50 hover:bg-blue-50 transition-colors text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#305CDE]/10 text-[#305CDE] flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Drag & Drop Sonar Files Here
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mb-6">
              Supports eXtended Triton Format (.XTF), EdgeTech (.JSF), GeoTIFF rasters (.TIFF), and PNG sonar waterfalls.
            </p>

            {/* Test Preset Buttons */}
            <div className="w-full space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Or select pre-loaded survey mission logs:
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {SAMPLE_DATASETS.map((ds) => (
                  <button
                    key={ds.id}
                    disabled={isProcessing}
                    onClick={() => triggerUploadSimulator(ds)}
                    className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all ${
                      selectedDataset.id === ds.id
                        ? 'bg-[#305CDE] text-white border-[#305CDE] shadow-md'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    ⚡ {ds.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Supported Format Chips */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-2 border-t border-slate-200">
            <span>FORMATS: .XTF | .JSF | .TIFF | .PNG</span>
            <span>MAX SIZE: 2.5 GB</span>
          </div>
        </div>

        {/* Live Telemetry Stream Ticker */}
        <div className="lg:col-span-5 tech-card-dark p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-semibold">
              <span className="flex items-center gap-2 text-slate-200">
                <Terminal className="w-4 h-4 text-[#00E676]" />
                PIPELINE EXECUTOR
              </span>
              <span className="font-mono text-emerald-400 font-bold">{pipelineProgress}% COMPLETE</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
              <div
                className="bg-[#305CDE] h-full transition-all duration-300"
                style={{ width: `${pipelineProgress}%` }}
              />
            </div>

            {/* Current Active Stage */}
            <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 mb-4">
              <div className="text-xs font-bold text-emerald-400 mb-0.5">
                Stage {PIPELINE_STAGES[currentStageIdx]?.id || 6}/6: {PIPELINE_STAGES[currentStageIdx]?.label}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {PIPELINE_STAGES[currentStageIdx]?.detail}
              </div>
            </div>
          </div>

          {/* Terminal Console Logs */}
          <div className="bg-black/90 rounded-xl p-3 font-mono text-xs text-emerald-400 h-36 overflow-y-auto space-y-1 border border-slate-800">
            {logMessages.map((msg, i) => (
              <div key={i} className="leading-tight">
                &gt; {msg}
              </div>
            ))}
          </div>

          {/* Action Link to Results */}
          <button
            onClick={() => navigate('/results')}
            disabled={isProcessing}
            className="w-full bg-[#00E676] hover:bg-emerald-400 text-emerald-950 font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Proceed to Detection Results</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Before / After Noise Filtering Viewer Component */}
      <NoiseFilterSlider />
    </div>
  );
};
