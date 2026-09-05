import React from 'react';
import { EdgeBenchmarkPanel } from '../components/EdgeBenchmarkPanel';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { LimitationsCard } from '../components/LimitationsCard';
import { Cpu } from 'lucide-react';

export const BenchmarksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Page Title Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#305CDE] mb-1">
          <Cpu className="w-4 h-4" />
          <span>Module 05 / Embedded Hardware & Analytics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Edge Hardware Benchmarks & Statistical Analytics
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Subsea submersible ARM hardware specifications, TensorRT INT8 quantization metrics, and technical disclosures.
        </p>
      </div>

      {/* Edge Benchmark Table */}
      <EdgeBenchmarkPanel />

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Technical Disclosures */}
      <LimitationsCard />
    </div>
  );
};
