import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAMPLE_DATASETS } from '../data/sampleData';
import type { SonarDetection, SurveyDataset } from '../types/sonar';
import { InteractiveMap } from '../components/InteractiveMap';
import { Map, ArrowRight, FileText } from 'lucide-react';

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDataset, setSelectedDataset] = useState<SurveyDataset>(SAMPLE_DATASETS[0]);
  const [selectedDetection, setSelectedDetection] = useState<SonarDetection | null>(SAMPLE_DATASETS[0].detections[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#305CDE] mb-1">
            <Map className="w-4 h-4" />
            <span>Module 03 / Bathymetric GIS Mapping</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Spatial Geotagging & Survey Track GIS View
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Interactive Leaflet map displaying AUV survey tracks, WGS84 bathymetric coordinates, and confidence-coded marker pins.
          </p>
        </div>

        {/* Dataset Switcher */}
        <div className="flex items-center gap-3">
          <select
            value={selectedDataset.id}
            onChange={(e) => {
              const ds = SAMPLE_DATASETS.find(d => d.id === e.target.value);
              if (ds) {
                setSelectedDataset(ds);
                setSelectedDetection(ds.detections[0] || null);
              }
            }}
            className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#305CDE] shadow-sm cursor-pointer"
          >
            {SAMPLE_DATASETS.map((ds) => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>

          <button
            onClick={() => navigate('/reports')}
            className="bg-[#305CDE] hover:bg-[#2D68C4] text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Data Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Map Component Container */}
      <InteractiveMap
        detections={selectedDataset.detections}
        auvTrack={selectedDataset.auvTrack}
        selectedDetection={selectedDetection}
        onSelectDetection={(det) => setSelectedDetection(det)}
      />
    </div>
  );
};
