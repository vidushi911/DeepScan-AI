import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveScanStrip } from '../components/LiveScanStrip';
import { SplitFeatures } from '../components/SplitFeatures';
import { AlertSignup } from '../components/AlertSignup';
import type { SonarDetection } from '../types/sonar';
import { 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  Waves, 
  Activity
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectDetection = (_det: SonarDetection) => {
    navigate('/results');
  };

  return (
    <div className="space-y-0">
      {/* Sleek Enterprise Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 sonar-grid-periwinkle overflow-hidden border-b border-slate-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="tech-badge tech-badge-blue">
                <Waves className="w-3.5 h-3.5" />
                Side-Scan Sonar AI Platform
              </span>
              <span className="tech-badge tech-badge-green">
                <ShieldCheck className="w-3.5 h-3.5" />
                Validated 98.4% Precision
              </span>
              <span className="tech-badge tech-badge-amber">
                <Cpu className="w-3.5 h-3.5" />
                Edge Jetson Compatible
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              The AI Eyes of the <span className="text-[#305CDE] underline decoration-blue-300 decoration-wavy underline-offset-8">Ocean Floor</span>.
            </h1>

            {/* Subhead */}
            <p className="text-lg text-slate-700 font-normal leading-relaxed max-w-2xl">
              DeepScan AI parses side-scan acoustic sonar pings to automatically isolate ghost nets, shipwrecks, corroded subsea pipelines, and seafloor hazards in <span className="font-semibold text-slate-900">under 1.8 seconds per tile</span>.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/upload')}
                className="bg-[#305CDE] hover:bg-[#2D68C4] text-white px-7 py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2.5"
              >
                <span>Process Sonar Log File</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/results')}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-6 py-3.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-[#305CDE]" />
                <span>View Live Detection Feed</span>
              </button>
            </div>

            {/* Metric Highlights Strip */}
            <div className="pt-6 border-t border-slate-900/10 grid grid-cols-3 gap-6 text-slate-900">
              <div>
                <div className="text-3xl font-extrabold text-[#305CDE]">98.4%</div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">Model Precision</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900">&lt;1.8s</div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">Tile Inference Speed</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-emerald-600">42 FPS</div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">Jetson Orin Speed</div>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Sonar Radar Dashboard Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-lg tech-card-dark p-6 space-y-4 shadow-2xl">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse" />
                  AUV Sonar Telemetry Stream #004
                </div>
                <span className="text-[11px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  18.4 kHz
                </span>
              </div>

              {/* Central Radar Display */}
              <div className="relative h-64 bg-[#0A192F] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                {/* Radar Grid Circles */}
                <div className="absolute w-48 h-48 rounded-full border border-blue-500/20" />
                <div className="absolute w-32 h-32 rounded-full border border-blue-500/20" />
                <div className="absolute w-16 h-16 rounded-full border border-blue-500/20" />

                {/* Sweeping Radar Line */}
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(48,92,222,0.4)_360deg)] rounded-full animate-radar-sweep pointer-events-none" />

                {/* Simulated Target Ping */}
                <div className="absolute top-16 right-20 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-emerald-500/40 mt-1">
                    GHOST_NET (96%)
                  </span>
                </div>

                <div className="absolute bottom-16 left-16 flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-amber-500/40 mt-1">
                    PIPE_DEBRIS (84%)
                  </span>
                </div>
              </div>

              {/* Bottom Quick Controls */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                <span>LAT: 56.418° N</span>
                <span>LON: 3.211° E</span>
                <span className="text-emerald-400 font-bold">48.5m DEPTH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "Where We're Scanning" Live Telemetry Strip */}
      <LiveScanStrip onSelectDetection={handleSelectDetection} />

      {/* Split Feature System Architecture */}
      <SplitFeatures />

      {/* Email Anomaly Alert Signup */}
      <AlertSignup />
    </div>
  );
};
