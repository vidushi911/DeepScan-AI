import React from 'react';
import { 
  DashedArrowDoodle, 
  AuvDroneIllustration, 
  GhostNetSticker, 
  FishDoodle, 
  AnchorDoodle, 
  BubblesDoodle, 
  StickerBadge 
} from './DoodleIcons';
import { Play, Sparkles, Waves, ShieldCheck, Cpu } from 'lucide-react';

interface HeroSectionProps {
  onTryDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onTryDemo }) => {
  return (
    <section className="relative pt-6 pb-20 px-4 sonar-grid-bg overflow-hidden">
      {/* Background Ambient Bubbles */}
      <div className="absolute top-10 left-[8%] opacity-70 animate-float pointer-events-none">
        <BubblesDoodle />
      </div>
      <div className="absolute top-24 right-[10%] opacity-60 animate-float-delayed pointer-events-none">
        <BubblesDoodle />
      </div>
      <div className="absolute bottom-10 left-[4%] opacity-50 pointer-events-none">
        <FishDoodle />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headlines & CTA */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
          {/* Top Tagline Badges */}
          <div className="flex flex-wrap gap-2.5 mb-6">
            <StickerBadge 
              text="Side-Scan Sonar AI" 
              variant="blue" 
              icon={<Waves className="w-4 h-4 text-white" />} 
              rotate="-2deg" 
            />
            <StickerBadge 
              text="AI-Verified" 
              variant="green" 
              icon={<ShieldCheck className="w-4 h-4 text-emerald-900" />} 
              rotate="3deg" 
            />
            <StickerBadge 
              text="Edge-Ready Model" 
              variant="yellow" 
              icon={<Cpu className="w-4 h-4 text-slate-900" />} 
              rotate="-4deg" 
            />
          </div>

          {/* Main Headline */}
          <h1 className="font-peachy text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6">
            The AI Eyes of the <span className="text-[#305CDE] underline decoration-wavy decoration-[#FEE440] underline-offset-8">Ocean Floor</span>.
          </h1>

          {/* Subtitle */}
          <p className="font-body text-lg sm:text-xl text-slate-700 font-medium max-w-2xl leading-relaxed mb-8">
            DeepScan AI automatically detects ghost nets, shipwrecks, subsea pipelines, and toxic seafloor debris from raw side-scan sonar acoustic imagery in <span className="font-bold text-slate-900 underline decoration-[#00E676] decoration-2">under 1.8 seconds per tile</span> with 98.4% precision.
          </p>

          {/* CTA Button Group with Dashed Arrow Doodle */}
          <div className="relative flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
            <button
              onClick={() => {
                onTryDemo();
                const el = document.getElementById('live-demo');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group font-peachy font-extrabold text-xl bg-[#305CDE] hover:bg-[#2D68C4] text-white px-8 py-4 rounded-full border-3.5 border-slate-900 shadow-[6px_6px_0px_#1E293B] hover:shadow-[9px_9px_0px_#1E293B] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
            >
              <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
              <span>Try the Live Demo</span>
              <Sparkles className="w-5 h-5 text-[#FEE440] animate-spin" style={{ animationDuration: '4s' }} />
            </button>

            {/* Hand-drawn Dashed Arrow Doodle pointing at CTA button */}
            <div className="hidden sm:flex items-center gap-2 -mt-4">
              <DashedArrowDoodle className="transform -rotate-12 animate-pulse" />
              <span className="font-peachy text-xs font-bold text-[#305CDE] bg-white px-2 py-1 rounded-md border-1.5 border-slate-900 shadow-[2px_2px_0px_#1E293B] rotate-2">
                Click to Test Live Sonar Log!
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="w-full pt-4 border-t-2 border-slate-900/20 grid grid-cols-3 gap-4 text-slate-800">
            <div>
              <div className="font-peachy text-3xl font-extrabold text-[#305CDE]">98.4%</div>
              <div className="font-body text-xs font-semibold text-slate-600">Model Precision</div>
            </div>
            <div>
              <div className="font-peachy text-3xl font-extrabold text-slate-900">&lt;1.8s</div>
              <div className="font-body text-xs font-semibold text-slate-600">Tile Inference</div>
            </div>
            <div>
              <div className="font-peachy text-3xl font-extrabold text-[#00E676] stroke-slate-900">42 FPS</div>
              <div className="font-body text-xs font-semibold text-slate-600">Jetson Orin Speed</div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Illustration & Floating Stickers */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          {/* Main Scalloped Card Hero Container */}
          <div className="relative bg-white border-4 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_#1E293B] w-full max-w-md hover:rotate-1 transition-transform">
            {/* Top Polaroid Title Bar */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#FF5964] border-1.5 border-slate-900" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#FEE440] border-1.5 border-slate-900" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#00E676] border-1.5 border-slate-900" />
                <span className="font-peachy font-bold text-xs text-slate-600 ml-1">AUV_Sonar_Stream_004.xtf</span>
              </div>
              <span className="font-peachy font-bold text-xs bg-[#00E676] text-emerald-950 px-2 py-0.5 rounded-full border border-slate-900">
                LIVE SWEEP
              </span>
            </div>

            {/* Central AUV Submarine & Sonar Sweep Illustration */}
            <div className="relative bg-[#1A397B] border-3 border-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden min-h-[240px]">
              {/* Sonar Waterfall Grid */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#B5C7EB_1px,transparent_1px)] [background-size:16px_16px]" />

              <AuvDroneIllustration className="z-10 animate-float" />

              {/* Seafloor Graphic Strip */}
              <div className="w-full flex items-center justify-between px-2 pt-2 border-t-2 border-dashed border-[#B5C7EB]/40 z-10 text-[10px] font-mono text-[#B5C7EB]">
                <span>DEPTH: 48.5M</span>
                <span className="text-[#FEE440] font-bold">ANOMALY DETECTED</span>
                <span>PING: #18,450</span>
              </div>
            </div>

            {/* Bottom Caption */}
            <div className="mt-4 flex items-center justify-between font-peachy text-sm font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#305CDE]" />
                Side-Scan Waterfall
              </span>
              <span className="text-[#305CDE] underline">View Target Poly</span>
            </div>

            {/* Floating Sticker Badges overlaying Hero Card */}
            <div className="absolute -top-6 -right-6 z-20">
              <GhostNetSticker className="rotate-12 hover:scale-110 transition-transform cursor-pointer" />
            </div>

            <div className="absolute -bottom-5 -left-6 z-20">
              <StickerBadge 
                text="Live Detection" 
                variant="yellow" 
                rotate="-8deg" 
                icon={<Sparkles className="w-4 h-4 text-slate-900" />} 
              />
            </div>

            <div className="absolute top-1/2 -right-8 z-20 hidden sm:block">
              <StickerBadge 
                text="Geo-Tagged" 
                variant="periwinkle" 
                rotate="5deg" 
              />
            </div>

            <div className="absolute -top-4 left-6 z-20">
              <AnchorDoodle className="-rotate-12" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
