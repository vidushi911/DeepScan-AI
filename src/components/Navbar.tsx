import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  UploadCloud, 
  Crosshair, 
  Map, 
  FileText, 
  Cpu, 
  Radio, 
  Menu, 
  X, 
  ChevronRight
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { path: '/upload', label: 'Upload & Pipeline', icon: <UploadCloud className="w-4 h-4" /> },
    { path: '/results', label: 'Detection Results', icon: <Crosshair className="w-4 h-4" /> },
    { path: '/map', label: 'GIS Map', icon: <Map className="w-4 h-4" /> },
    { path: '/reports', label: 'Reports & Export', icon: <FileText className="w-4 h-4" /> },
    { path: '/benchmarks', label: 'Edge Specs', icon: <Cpu className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#305CDE] flex items-center justify-center border border-blue-400/40 shadow-inner group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-[#00E676] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              DeepScan<span className="text-[#305CDE]">.AI</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                PRO v2.4
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
              Acoustic Anomaly Recognition System
            </span>
          </div>
        </NavLink>

        {/* Desktop Multi-Page Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#305CDE] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/upload')}
            className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-[#305CDE] hover:bg-[#2D68C4] text-white px-4 py-2 rounded-xl shadow-md transition-all hover:shadow-blue-500/25 active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Process Sonar Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0F172A] border-b border-slate-800 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#305CDE] text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};
