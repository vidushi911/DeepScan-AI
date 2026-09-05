import React, { useState } from 'react';
import { Sparkles, SlidersHorizontal, Eye } from 'lucide-react';

export const NoiseFilterSlider: React.FC = () => {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0-100

  return (
    <div id="noise-filter" className="bg-white border-3.5 border-slate-900 rounded-3xl p-6 shadow-[6px_6px_0px_#1E293B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b-2 border-slate-900 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEE440] text-slate-900 font-peachy text-xs font-bold border border-slate-900 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            <span>Core Differentiator</span>
          </div>
          <h3 className="font-peachy text-2xl font-extrabold text-slate-900">
            Before / After Noise Filtering Viewer
          </h3>
          <p className="font-body text-xs text-slate-600">
            Drag the interactive slider to compare raw noisy sonar acoustic backscatter against Lee & Frost despeckled output.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#B5C7EB]/40 px-3 py-1.5 rounded-xl border border-slate-900 font-peachy text-xs font-bold text-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-[#305CDE]" />
          <span>Drag Slider to Compare</span>
        </div>
      </div>

      {/* Interactive Split Comparison Container */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl border-3 border-slate-900 overflow-hidden select-none touch-none">
        {/* Left Side: Filtered Image (After) */}
        <div className="absolute inset-0 bg-[#0F2859] flex items-center justify-center">
          {/* Filtered Clean Sonar Visual */}
          <div className="absolute inset-0 bg-[radial-gradient(#305CDE_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
          
          <div className="relative z-10 text-center max-w-sm p-4">
            <div className="w-56 h-40 bg-gradient-to-tr from-amber-950/90 via-slate-900 to-amber-900 rounded-2xl border-3 border-[#00E676] shadow-[0_0_20px_rgba(0,230,118,0.3)] relative mx-auto flex flex-col justify-between p-3">
              <span className="font-peachy font-extrabold text-xs text-[#00E676] bg-slate-950 px-2 py-0.5 rounded border border-[#00E676] w-fit">
                LEE/FROST FILTERED (98.4% SNR)
              </span>
              <div className="border-2 border-dashed border-[#FEE440] rounded-xl h-20 flex items-center justify-center bg-[#00E676]/10">
                <span className="font-mono text-xs text-[#FEE440] font-bold">Target Outline Clear</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-300">Speckle Index: 0.12 (Suppressed)</span>
            </div>
            <p className="font-peachy text-xs font-bold text-emerald-400 mt-3 bg-slate-900/90 px-3 py-1 rounded-full border border-emerald-500 inline-block">
              ✨ Despeckled Output (Noise Eliminated)
            </p>
          </div>
        </div>

        {/* Right Side: Raw Noisy Image (Before) - Clipped by Slider */}
        <div 
          className="absolute inset-0 bg-[#2D3748] flex items-center justify-center overflow-hidden border-r-3 border-[#FEE440]"
          style={{ width: `${sliderPos}%` }}
        >
          <div className="absolute inset-0 w-[100vw] h-full flex items-center justify-center bg-[#1A202C]">
            {/* High Noise Speckle Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_2px,transparent_2px)] [background-size:8px_8px] opacity-70" />
            
            <div className="relative z-10 text-center max-w-sm p-4">
              <div className="w-56 h-40 bg-slate-800/80 rounded-2xl border-3 border-red-400 relative mx-auto flex flex-col justify-between p-3">
                <span className="font-peachy font-extrabold text-xs text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-red-400 w-fit">
                  RAW UNFILTERED SONAR TILE
                </span>
                <div className="border-2 border-dashed border-red-500 rounded-xl h-20 flex items-center justify-center bg-red-500/10">
                  <span className="font-mono text-xs text-red-300 font-bold">High Speckle Noise</span>
                </div>
                <span className="font-mono text-[10px] text-red-300">Speckle Index: 0.84 (Raw)</span>
              </div>
              <p className="font-peachy text-xs font-bold text-red-400 mt-3 bg-slate-900/90 px-3 py-1 rounded-full border border-red-500 inline-block">
                ⚠️ Raw Acoustic Backscatter Noise
              </p>
            </div>
          </div>
        </div>

        {/* Center Divider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-[#FEE440] cursor-ew-resize z-20 flex items-center justify-center"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-10 h-10 rounded-full bg-[#FEE440] border-3 border-slate-900 shadow-[3px_3px_0px_#1E293B] flex items-center justify-center text-slate-900 hover:scale-110 transition-transform">
            <Eye className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Invisible Range Input Overlay for Drag Controls */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
        />
      </div>

      {/* Footer Metrics */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-peachy font-bold text-slate-700 gap-2">
        <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
          ◀ Left: Raw Sonar (High False Alarm Rate)
        </span>
        <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          Right: Lee-Filter Despeckled (Clean CFAR Signals) ▶
        </span>
      </div>
    </div>
  );
};
