import React from 'react';
import { SonarWaveDoodle, StickerBadge, FishDoodle, CoralDoodle } from './DoodleIcons';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1A397B] text-white pt-16 pb-12 px-4 border-t-4 border-slate-900 relative overflow-hidden">
      {/* Background Decorative Doodles */}
      <div className="absolute top-8 left-[5%] opacity-20 pointer-events-none">
        <FishDoodle />
      </div>
      <div className="absolute bottom-8 right-[5%] opacity-20 pointer-events-none">
        <CoralDoodle />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b-2 border-white/20">
          {/* Brand & Mission Statement */}
          <div className="md:col-span-6 flex flex-col items-start">
            <div className="flex items-center gap-2.5 mb-4">
              <SonarWaveDoodle className="w-8 h-8" />
              <span className="font-peachy text-3xl font-extrabold text-white">
                DeepScan<span className="text-[#FEE440]">.AI</span>
              </span>
              <StickerBadge text="Clean Oceans" variant="green" rotate="-4deg" className="text-xs py-0.5" />
            </div>

            <p className="font-body text-sm text-blue-100 max-w-md leading-relaxed mb-6">
              Our mission is to empower marine conservationists, navies, and oceanographic research teams with real-time AI sonar vision to remove toxic ghost nets, locate shipwrecks, and map seafloor marine debris worldwide.
            </p>

            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center text-white hover:bg-[#305CDE] hover:border-white transition-all font-mono font-bold text-xs">
                GH
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center text-white hover:bg-[#305CDE] hover:border-white transition-all font-mono font-bold text-xs">
                X
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center text-white hover:bg-[#305CDE] hover:border-white transition-all font-mono font-bold text-xs">
                IN
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 font-peachy">
            <h4 className="text-lg font-bold text-[#FEE440] mb-4">Product Modules</h4>
            <ul className="space-y-2.5 text-sm text-blue-100">
              <li><a href="#how-it-works" className="hover:text-white hover:underline">YOLOv8 Acoustic Net</a></li>
              <li><a href="#noise-filter" className="hover:text-white hover:underline">Lee & Frost Despeckler</a></li>
              <li><a href="#live-demo" className="hover:text-white hover:underline">Interactive Dashboard</a></li>
              <li><a href="#reports-export" className="hover:text-white hover:underline">WGS84 GeoJSON Exporter</a></li>
              <li><a href="#edge-specs" className="hover:text-white hover:underline">Jetson Orin Benchmarks</a></li>
            </ul>
          </div>

          {/* Contact & Standards */}
          <div className="md:col-span-3 font-peachy">
            <h4 className="text-lg font-bold text-[#FEE440] mb-4">Acoustic Standards</h4>
            <div className="space-y-2 text-xs font-body text-blue-200">
              <p>✓ Compliant with IHO S-44 Hydrographic Survey Standards</p>
              <p>✓ Tested on Klein 4000 & Edgetech 4125 Side-Scan Pings</p>
              <p>✓ WGS84 Bathymetric Coordinate Projection</p>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between font-peachy text-xs text-blue-200 gap-4">
          <div className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Heart className="w-4 h-4 text-[#FF5964] fill-[#FF5964]" />
            <span>for Ocean Preservation & Deep-Sea Exploration.</span>
          </div>

          <div>
            © {new Date().getFullYear()} DeepScan AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
