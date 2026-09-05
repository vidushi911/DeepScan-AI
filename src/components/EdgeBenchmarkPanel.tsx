import React from 'react';
import { BENCHMARK_METRICS } from '../data/sampleData';
import { Cpu, Zap, Gauge, HardDrive, CheckCircle2 } from 'lucide-react';

export const EdgeBenchmarkPanel: React.FC = () => {
  return (
    <div id="edge-specs" className="bg-white border-3.5 border-slate-900 rounded-3xl p-6 shadow-[6px_6px_0px_#1E293B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b-2 border-slate-900 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#305CDE] text-white font-peachy text-xs font-bold border border-slate-900 mb-1">
            <Cpu className="w-3.5 h-3.5 text-[#FEE440]" />
            <span>Hardware Validation</span>
          </div>
          <h3 className="font-peachy text-2xl font-extrabold text-slate-900">
            Edge Deployment & Quantization Benchmarks
          </h3>
          <p className="font-body text-xs text-slate-600">
            Real-world performance specs on embedded ARM subsea computers (No satellite connectivity required).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#00E676] px-3.5 py-1.5 rounded-2xl border-2 border-slate-900 font-peachy font-extrabold text-xs text-emerald-950 shadow-[2px_2px_0px_#1E293B]">
          <Zap className="w-4 h-4 fill-emerald-950" />
          <span>7.5W Low-Power Jetson Target</span>
        </div>
      </div>

      {/* Benchmark Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {BENCHMARK_METRICS.map((bench) => (
          <div
            key={bench.device}
            className={`p-4 rounded-2xl border-2.5 border-slate-900 flex flex-col justify-between transition-all ${
              bench.status.includes('Optimal')
                ? 'bg-[#A8C3BC]/40 shadow-[4px_4px_0px_#1E293B] ring-2 ring-[#305CDE]'
                : 'bg-slate-50 shadow-[2px_2px_0px_#1E293B]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-peachy font-extrabold text-sm text-slate-900 line-clamp-1">{bench.device}</span>
                {bench.status.includes('Optimal') && (
                  <span className="bg-[#00E676] text-emerald-950 text-[10px] font-peachy font-extrabold px-1.5 py-0.5 rounded border border-slate-900">
                    TARGET
                  </span>
                )}
              </div>

              <p className="font-body text-[11px] text-slate-500 mb-3">{bench.chipset}</p>

              {/* Metrics List */}
              <div className="space-y-2 font-mono text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-500"><Gauge className="w-3 h-3 text-[#305CDE]" /> Throughput:</span>
                  <span className="font-bold text-[#305CDE]">{bench.fps} FPS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-500"><Zap className="w-3 h-3 text-amber-500" /> Latency:</span>
                  <span className="font-bold text-slate-900">{bench.latencyMs} ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-500"><HardDrive className="w-3 h-3 text-emerald-500" /> Weights:</span>
                  <span className="font-bold text-slate-900">{bench.modelSizeMB} MB</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-peachy font-bold text-slate-600">
              <span>{bench.precision}</span>
              <span className="text-slate-900 font-extrabold">{bench.powerWatts}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quantization Callout Box */}
      <div className="bg-[#B5C7EB]/30 p-4 rounded-2xl border-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 font-body text-xs text-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FEE440] border-2 border-slate-900 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <span className="font-peachy font-bold text-sm text-slate-900 block">
              INT8 TensorRT Quantization Compression (4.0× Reduction)
            </span>
            <span>Weights compressed from 56.8 MB (FP32) down to 14.2 MB with zero precision loss (&lt;0.2% mAP delta).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
