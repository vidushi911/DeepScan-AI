import React, { useState } from 'react';
import { SAMPLE_DATASETS } from '../data/sampleData';
import type { SonarDetection } from '../types/sonar';
import { ReportsTable } from '../components/ReportsTable';
import { ManualReviewPanel } from '../components/ManualReviewPanel';
import { FileText } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [detections, setDetections] = useState<SonarDetection[]>(
    SAMPLE_DATASETS.flatMap(ds => ds.detections)
  );

  const handleUpdateStatus = (id: string, newStatus: 'confirmed' | 'rejected') => {
    setDetections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#305CDE] mb-1">
            <FileText className="w-4 h-4" />
            <span>Module 04 / Data Export & Annotation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            WGS84 GIS Anomaly Data & Export Center
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Export structured JSON & CSV hydrographic reports or validate active learning retraining samples.
          </p>
        </div>
      </div>

      {/* Reports Table & Exporter */}
      <ReportsTable
        detections={detections}
        onSelectDetection={() => {}}
      />

      {/* Human-in-the-loop Active Learning Panel */}
      <ManualReviewPanel
        detections={detections}
        onUpdateDetectionStatus={handleUpdateStatus}
      />
    </div>
  );
};
