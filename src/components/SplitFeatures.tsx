import React from 'react';
import { StickerBadge } from './DoodleIcons';
import { Cpu, ShieldCheck, MapPin, Layout, Tag } from 'lucide-react';

export const SplitFeatures: React.FC = () => {
  const modules = [
    {
      title: 'YOLOv8 Acoustic Detection Model',
      description: 'Custom convolutional network trained on over 45,000 synthetic & real side-scan sonar tiles for low-contrast acoustic backscatter.',
      priceTag: '98.4% Precision',
      tagColor: 'bg-[#FEE440] text-slate-900',
      icon: <Cpu className="w-5 h-5 text-[#305CDE]" />
    },
    {
      title: 'Confidence & Noise Filtering Module',
      description: 'Lee & Frost adaptive spatial despeckling coupled with acoustic shadow-consistency verification to eliminate false positive seafloor ripples.',
      priceTag: '<1.8s / Tile',
      tagColor: 'bg-[#00E676] text-emerald-950',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />
    },
    {
      title: 'Geotagging & Reporting Engine',
      description: 'Fused sensor telemetry (USBL, altimeter, Kalman dead-reckoning) projecting raw sonar pings to high-accuracy WGS84 GeoJSON & CSV schemas.',
      priceTag: 'Sub-meter Geo',
      tagColor: 'bg-[#B5C7EB] text-slate-900',
      icon: <MapPin className="w-5 h-5 text-indigo-600" />
    },
    {
      title: 'Edge-Optimized Offline Dashboard',
      description: 'Zero-cloud dependency stack running natively on NVIDIA Jetson hardware aboard research submersibles with WebSocket real-time updates.',
      priceTag: 'Edge-Ready',
      tagColor: 'bg-[#FF5964] text-white',
      icon: <Layout className="w-5 h-5 text-[#FF5964]" />
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sonar-grid-bg">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <StickerBadge text="Architected for Research Vessels" variant="blue" rotate="-2deg" className="mb-3" />
          <h2 className="font-peachy text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Built for the <span className="text-[#305CDE] underline decoration-wavy decoration-[#FEE440]">Deep Ocean</span>
          </h2>
          <p className="font-body text-base sm:text-lg text-slate-700 font-medium mt-3">
            Four specialized modules working in lockstep to replace hours of manual sonar chart inspection with instantaneous, validated AI detection.
          </p>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: 4 Core Modules with Price-Tag Style Stat Callouts */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {modules.map((mod, _idx) => (
              <div
                key={mod.title}
                className="bg-white border-3.5 border-slate-900 rounded-3xl p-5 shadow-[5px_5px_0px_#1E293B] hover:shadow-[8px_8px_0px_#1E293B] hover:-translate-y-1 transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 border-2 border-slate-900 flex items-center justify-center shrink-0">
                      {mod.icon}
                    </div>
                    <h3 className="font-peachy text-xl font-bold text-slate-900 group-hover:text-[#305CDE] transition-colors">
                      {mod.title}
                    </h3>
                  </div>

                  {/* Price Tag Style Stat Callout Badge */}
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border-2 border-slate-900 font-peachy font-extrabold text-xs shadow-[2px_2px_0px_#1E293B] shrink-0 rotate-2 ${mod.tagColor}`}>
                    <Tag className="w-3 h-3" />
                    <span>{mod.priceTag}</span>
                  </div>
                </div>

                <p className="font-body text-xs sm:text-sm text-slate-600 pl-13 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column: Illustrated Side-Scan Sonar Polaroid Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[9px_9px_0px_#1E293B] w-full max-w-lg -rotate-1 hover:rotate-0 transition-transform">
              {/* Polaroid Top Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
                <div className="font-peachy font-bold text-sm text-slate-800 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#305CDE]" />
                  Acoustic Target Overlay #DET-101
                </div>
                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  56.418°N, 3.211°E
                </span>
              </div>

              {/* Sonar Canvas Box */}
              <div className="relative bg-[#1A397B] border-3 border-slate-900 rounded-2xl h-80 overflow-hidden flex items-center justify-center">
                {/* Sonar Waterfall Scan Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#305CDE30_1px,transparent_1px)] bg-[size:100%_12px]" />

                {/* Simulated Target: Ghost Net & Acoustic Shadow */}
                <div className="relative w-64 h-48 border-3 border-[#FF5964] rounded-2xl bg-amber-950/40 p-3 shadow-inner flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-white bg-[#FF5964] px-2 py-0.5 rounded border border-slate-900 w-fit">
                    <span>CLASS: GHOST_GILLNET</span>
                  </div>

                  {/* Internal Bounding Mask Lines */}
                  <div className="border-2 border-dashed border-[#FEE440] rounded-xl h-24 my-auto relative flex items-center justify-center overflow-hidden">
                    <span className="font-mono text-xs text-[#FEE440] bg-slate-900/80 px-2 py-0.5 rounded border border-[#FEE440]">
                      YOLO-Seg Mask (96%)
                    </span>
                  </div>

                  {/* Acoustic Shadow Vector */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-200">
                    <span>Shadow Ratio: 1.84</span>
                    <span>Length: 18.4m</span>
                  </div>
                </div>

                {/* Score Tooltip Overlay (Polaroid Callout) */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border-2.5 border-slate-900 rounded-2xl p-3 shadow-[4px_4px_0px_#1E293B] max-w-[200px]">
                  <div className="font-peachy text-xs font-bold text-slate-900 mb-1 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>Fused Score</span>
                    <span className="text-[#00E676] font-extrabold text-sm">96.4%</span>
                  </div>
                  <div className="space-y-1 text-[10px] font-body text-slate-700">
                    <div className="flex justify-between"><span>Softmax:</span><span className="font-bold">97%</span></div>
                    <div className="flex justify-between"><span>Shadow Check:</span><span className="font-bold">95%</span></div>
                    <div className="flex justify-between"><span>CFAR Agreement:</span><span className="font-bold">96%</span></div>
                  </div>
                </div>
              </div>

              {/* Bottom Caption & Badges */}
              <div className="mt-4 flex items-center justify-between">
                <p className="font-peachy text-xs font-bold text-slate-600">
                  Designed to delight ocean research teams
                </p>
                <StickerBadge text="AI-Verified" variant="green" rotate="3deg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
