import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

export const AnalyticsCharts: React.FC = () => {
  const classBreakdown = [
    { label: 'Ghost Nets & Gear', count: 42, pct: 38, color: 'bg-[#FF5964]' },
    { label: 'Corroded Pipelines', count: 28, pct: 25, color: 'bg-[#305CDE]' },
    { label: 'Shipwrecks & Wreckage', count: 18, pct: 16, color: 'bg-[#FEE440]' },
    { label: 'Sunken Containers', count: 14, pct: 13, color: 'bg-[#00E676]' },
    { label: 'Plastic & Metal Debris', count: 9, pct: 8, color: 'bg-[#B5C7EB]' },
  ];

  const confidenceHistogram = [
    { range: '90-100%', count: 54, color: 'bg-[#00E676]' },
    { range: '80-89%', count: 32, color: 'bg-emerald-400' },
    { range: '70-79%', count: 15, color: 'bg-[#FEE440]' },
    { range: '50-69%', count: 8, color: 'bg-amber-400' },
    { range: '<50%', count: 2, color: 'bg-[#FF5964]' },
  ];

  return (
    <div className="bg-white border-3.5 border-slate-900 rounded-3xl p-6 shadow-[6px_6px_0px_#1E293B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b-2 border-slate-900 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEE440] text-slate-900 font-peachy text-xs font-bold border border-slate-900 mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Mission Analytics</span>
          </div>
          <h3 className="font-peachy text-2xl font-extrabold text-slate-900">
            Acoustic Detection Analytics & Histograms
          </h3>
          <p className="font-body text-xs text-slate-600">
            Statistical breakdown of seafloor anomalies across 54.8 km² surveyed ocean bathymetry.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-2xl border-2 border-slate-900 font-peachy text-xs font-bold text-slate-800">
          <TrendingUp className="w-4 h-4 text-[#305CDE]" />
          <span>2.03 Detections / km²</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Detections Per Class Bar Chart */}
        <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <div className="flex items-center justify-between font-peachy font-bold text-sm text-slate-900 mb-4 border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-[#305CDE]" />
              Detections by Anomaly Class
            </span>
            <span className="text-xs text-slate-500 font-mono">Total: 111</span>
          </div>

          <div className="space-y-3 font-body text-xs text-slate-700">
            {classBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between font-peachy font-bold text-xs text-slate-800 mb-1">
                  <span>{item.label}</span>
                  <span className="font-mono">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className={`h-full ${item.color} transition-all duration-500`} 
                    style={{ width: `${item.pct}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Confidence Distribution Histogram */}
        <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <div className="flex items-center justify-between font-peachy font-bold text-sm text-slate-900 mb-4 border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Confidence Distribution Histogram
            </span>
            <span className="text-xs text-slate-500 font-mono">Mean: 91.2%</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2 border-b-2 border-slate-900 font-peachy text-xs font-bold text-slate-700">
            {confidenceHistogram.map((item) => (
              <div key={item.range} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="font-mono text-[10px] text-slate-600 group-hover:scale-110 transition-transform">
                  {item.count}
                </span>
                <div 
                  className={`w-full ${item.color} border-2 border-slate-900 rounded-t-lg transition-all duration-500 shadow-[2px_0px_0px_#1E293B]`}
                  style={{ height: `${(item.count / 54) * 100}%` }}
                />
                <span className="text-[10px] text-slate-600 font-mono">{item.range}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center font-peachy text-[11px] text-slate-500">
            High confidence skew (&gt;80% threshold) driven by shadow validation.
          </div>
        </div>
      </div>
    </div>
  );
};
