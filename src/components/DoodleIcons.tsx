import React from 'react';

// Dashed Arrow Doodle pointing at CTA
export const DashedArrowDoodle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    width="90" 
    height="60" 
    viewBox="0 0 90 60" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`inline-block ${className}`}
  >
    <path 
      d="M10 45 C 30 55, 60 40, 75 18" 
      stroke="#305CDE" 
      strokeWidth="3.5" 
      strokeDasharray="6 6" 
      strokeLinecap="round" 
    />
    <path 
      d="M60 15 L 78 16 L 72 32" 
      stroke="#305CDE" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

// Sonar Wave Doodle
export const SonarWaveDoodle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={className}>
    <circle cx="20" cy="20" r="16" stroke="#2D68C4" strokeWidth="3" strokeDasharray="4 4" />
    <circle cx="20" cy="20" r="10" stroke="#305CDE" strokeWidth="2.5" />
    <circle cx="20" cy="20" r="4" fill="#FF5964" />
  </svg>
);

// Fish Doodle
export const FishDoodle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="48" height="32" viewBox="0 0 48 32" fill="none" className={className}>
    <path 
      d="M 6 16 C 14 6, 32 6, 42 16 C 32 26, 14 26, 6 16 Z" 
      fill="#FEE440" 
      stroke="#1E293B" 
      strokeWidth="2.5" 
    />
    <path d="M 6 16 L 0 6 L 0 26 Z" fill="#FEE440" stroke="#1E293B" strokeWidth="2.5" />
    <circle cx="34" cy="14" r="2.5" fill="#1E293B" />
  </svg>
);

// Submarine / AUV Drone Illustration
export const AuvDroneIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative inline-block ${className}`}>
    <svg width="260" height="150" viewBox="0 0 260 150" fill="none">
      {/* Sonar Cone Sweep Pattern */}
      <polygon 
        points="130,75 20,145 240,145" 
        fill="url(#sonarGradient)" 
        opacity="0.4" 
      />
      <line x1="130" y1="75" x2="20" y2="145" stroke="#305CDE" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="130" y1="75" x2="240" y2="145" stroke="#305CDE" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M 50 120 Q 130 100 210 120" stroke="#305CDE" strokeWidth="2" strokeDasharray="3 3" fill="none" />

      {/* AUV Hull */}
      <rect x="70" y="45" width="120" height="46" rx="23" fill="#305CDE" stroke="#1E293B" strokeWidth="3.5" />
      {/* Front Dome */}
      <path d="M 190 45 A 23 23 0 0 1 190 91 Z" fill="#FEE440" stroke="#1E293B" strokeWidth="3.5" />
      {/* Sensor Lens */}
      <circle cx="198" cy="68" r="8" fill="#00E676" stroke="#1E293B" strokeWidth="2" />
      {/* Propeller Fins */}
      <rect x="52" y="58" width="18" height="20" rx="4" fill="#FF5964" stroke="#1E293B" strokeWidth="2.5" />
      <path d="M 45 42 L 55 68 L 45 94" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
      {/* Antenna */}
      <line x1="130" y1="45" x2="130" y2="20" stroke="#1E293B" strokeWidth="3" />
      <circle cx="130" cy="16" r="6" fill="#FF5964" stroke="#1E293B" strokeWidth="2" />
      
      {/* Side Windows / Decals */}
      <circle cx="105" cy="68" r="7" fill="#B5C7EB" stroke="#1E293B" strokeWidth="2" />
      <circle cx="135" cy="68" r="7" fill="#B5C7EB" stroke="#1E293B" strokeWidth="2" />
      <circle cx="165" cy="68" r="7" fill="#B5C7EB" stroke="#1E293B" strokeWidth="2" />

      <defs>
        <linearGradient id="sonarGradient" x1="130" y1="75" x2="130" y2="145" gradientUnits="userSpaceOnUse">
          <stop stopColor="#305CDE" stopOpacity="0.8" />
          <stop offset="1" stopColor="#00E676" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// Ghost Net Tangled Doodle Sticker
export const GhostNetSticker: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative inline-flex items-center justify-center p-3 bg-red-100 border-3 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#1E293B] ${className}`}>
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M 6 12 L 38 12 M 6 22 L 38 22 M 6 32 L 38 32" stroke="#FF5964" strokeWidth="2.5" strokeDasharray="3 3" />
      <path d="M 12 6 L 12 38 M 22 6 L 22 38 M 32 6 L 32 38" stroke="#FF5964" strokeWidth="2.5" strokeDasharray="3 3" />
      <circle cx="22" cy="22" r="14" stroke="#1E293B" strokeWidth="3" fill="#FF5964" fillOpacity="0.2" />
      <path d="M 14 14 L 30 30 M 30 14 L 14 30" stroke="#FF5964" strokeWidth="3" />
    </svg>
    <div className="absolute -top-3 -right-3 bg-[#FF5964] text-white text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
      HAZARD
    </div>
  </div>
);

// Coral & Sea Life Sticker
export const CoralDoodle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
    <path 
      d="M 12 40 C 12 28, 6 22, 10 14 C 14 6, 20 18, 22 26 C 24 16, 32 8, 36 16 C 38 24, 30 30, 32 40 Z" 
      fill="#A8C3BC" 
      stroke="#1E293B" 
      strokeWidth="3" 
    />
    <circle cx="16" cy="18" r="3" fill="#305CDE" />
    <circle cx="28" cy="22" r="3" fill="#FF5964" />
  </svg>
);

// Anchor Sticker
export const AnchorDoodle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="36" height="40" viewBox="0 0 36 40" fill="none" className={className}>
    <circle cx="18" cy="8" r="4" stroke="#1E293B" strokeWidth="3" fill="#FFF" />
    <line x1="18" y1="12" x2="18" y2="34" stroke="#1E293B" strokeWidth="3.5" />
    <line x1="8" y1="18" x2="28" y2="18" stroke="#1E293B" strokeWidth="3.5" />
    <path d="M 4 26 C 4 38, 32 38, 32 26" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
  </svg>
);

// Bubble Group
export const BubblesDoodle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="36" height="50" viewBox="0 0 36 50" fill="none" className={className}>
    <circle cx="12" cy="40" r="7" fill="#FFFFFF" fillOpacity="0.8" stroke="#1E293B" strokeWidth="2" />
    <circle cx="24" cy="24" r="5" fill="#FFFFFF" fillOpacity="0.8" stroke="#1E293B" strokeWidth="2" />
    <circle cx="14" cy="10" r="3.5" fill="#FFFFFF" fillOpacity="0.8" stroke="#1E293B" strokeWidth="1.5" />
  </svg>
);

// Rotated Sticker Badge Component
export const StickerBadge: React.FC<{
  text: string;
  variant?: 'yellow' | 'red' | 'green' | 'blue' | 'periwinkle';
  icon?: React.ReactNode;
  rotate?: string;
  className?: string;
}> = ({ text, variant = 'yellow', icon, rotate = '-3deg', className = '' }) => {
  const bgClasses = {
    yellow: 'bg-[#FEE440] text-slate-900',
    red: 'bg-[#FF5964] text-white',
    green: 'bg-[#00E676] text-slate-900',
    blue: 'bg-[#305CDE] text-white',
    periwinkle: 'bg-[#B5C7EB] text-slate-900',
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2.5 border-slate-900 font-peachy text-sm font-bold shadow-[3px_3px_0px_#1E293B] ${bgClasses[variant]} ${className}`}
      style={{ transform: `rotate(${rotate})` }}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};
