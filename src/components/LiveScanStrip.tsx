import React from 'react';
import { SAMPLE_DATASETS } from '../data/sampleData';
import type { SonarDetection } from '../types/sonar';
import { Radio, MapPin, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

interface LiveScanStripProps {
  onSelectDetection: (det: SonarDetection) => void;
}

export const LiveScanStrip: React.FC<LiveScanStripProps> = ({ onSelectDetection }) => {
  // Extract all detections from sample datasets
  const allDetections = SAMPLE_DATASETS.flatMap(ds => ds.detections);

  return (
    <section className="relative bg-[#2D68C4] text-white py-16 px-4 scalloped-top">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#305CDE] border-2 border-white/40 text-xs font-peachy font-bold mb-3 shadow-[2px_2px_0px_#1E293B]">
              <Radio className="w-3.5 h-3.5 text-[#00E676] animate-pulse" />
              <span>Real-Time Acoustic Telemetry</span>
            </div>
            <h2 className="font-peachy text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Where We're <span className="text-[#FEE440] underline decoration-wavy decoration-[#305CDE]">Scanning</span> Right Now
            </h2>
            <p className="font-body text-blue-100 text-base max-w-xl mt-2">
              Autonomous survey vehicles streaming live side-scan sonar feeds across global oceans and coastal shelves.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-peachy font-bold bg-[#1A397B] px-4 py-2 rounded-full border-2 border-white/30">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-ping" />
            <span>3 Survey Vessels Online</span>
          </div>
        </div>

        {/* Horizontal Scrollable Detection Cards Strip */}
        <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x scrollbar-thin scrollbar-thumb-blue-300">
          {allDetections.map((det) => (
            <div
              key={det.id}
              onClick={() => onSelectDetection(det)}
              className="snap-start flex-shrink-0 w-80 bg-white text-slate-900 rounded-3xl p-5 border-3.5 border-slate-900 shadow-[6px_6px_0px_#1E293B] hover:shadow-[9px_9px_0px_#1E293B] hover:-translate-y-1.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Top Info Bar */}
                <div className="flex items-center justify-between text-xs font-peachy font-bold text-slate-500 mb-3 border-b-2 border-dashed border-slate-200 pb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#305CDE]" />
                    {det.timestamp}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] border border-slate-900 font-extrabold ${
                    det.confidence >= 90
                      ? 'bg-[#00E676] text-emerald-950'
                      : det.confidence >= 70
                      ? 'bg-[#FEE440] text-slate-900'
                      : 'bg-[#FF5964] text-white'
                  }`}>
                    {det.confidence}% Conf.
                  </span>
                </div>

                {/* Sonar Tile Thumbnail with Bounding Box Overlay */}
                <div className="relative bg-[#1A397B] rounded-2xl h-40 overflow-hidden mb-4 border-2 border-slate-900 flex items-center justify-center group-hover:border-[#305CDE] transition-colors">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#B5C7EB15_1px,transparent_1px),linear-gradient(to_bottom,#B5C7EB15_1px,transparent_1px)] bg-[size:14px_14px]" />

                  {/* Simulated Acoustic Shadow & Target */}
                  <div className={`w-3/4 h-3/4 rounded-xl bg-gradient-to-tr ${det.croppedPatchBg} border-2 border-dashed border-[#FEE440] relative flex items-center justify-center`}>
                    <div className="w-8 h-8 rounded-full border-2 border-[#FF5964] animate-ping opacity-75" />
                    <div className="absolute top-1 right-1 bg-[#FF5964] text-white text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-900">
                      {det.id}
                    </div>
                  </div>

                  {/* Lat/Lon Overlay Badge */}
                  <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur text-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FEE440]" />
                    {det.lat.toFixed(3)}°N, {det.lng.toFixed(3)}°E
                  </div>
                </div>

                {/* Class Title */}
                <h3 className="font-peachy text-xl font-bold text-slate-900 group-hover:text-[#305CDE] transition-colors mb-1 line-clamp-1">
                  {det.classLabel}
                </h3>
                <p className="font-body text-xs text-slate-600 mb-3">
                  Location: <span className="font-semibold text-slate-800">{det.locationName}</span> (Depth: {det.depthMeters}m)
                </p>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between font-peachy text-xs font-bold text-[#305CDE]">
                <span className="flex items-center gap-1 text-slate-700">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FF5964]" />
                  {det.lengthMeters}m × {det.widthMeters}m
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Inspect Tile <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
