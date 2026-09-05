import React, { useState } from 'react';
import type { SonarDetection } from '../types/sonar';
import { CheckCircle2, XCircle, RefreshCw, Database } from 'lucide-react';

interface ManualReviewPanelProps {
  detections: SonarDetection[];
  onUpdateDetectionStatus: (id: string, newStatus: 'confirmed' | 'rejected') => void;
}

export const ManualReviewPanel: React.FC<ManualReviewPanelProps> = ({
  detections,
  onUpdateDetectionStatus,
}) => {
  const [retrainingCount, setRetrainingCount] = useState(14); // Initial count

  const handleReview = (id: string, status: 'confirmed' | 'rejected') => {
    onUpdateDetectionStatus(id, status);
    setRetrainingCount((prev) => prev + 1);
  };

  return (
    <div className="bg-white border-3.5 border-slate-900 rounded-3xl p-6 shadow-[6px_6px_0px_#1E293B]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b-2 border-slate-900 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00E676] text-emerald-950 font-peachy text-xs font-bold border border-slate-900 mb-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Active Learning Loop</span>
          </div>
          <h3 className="font-peachy text-2xl font-extrabold text-slate-900">
            Human-in-the-Loop Verification & Retraining
          </h3>
          <p className="font-body text-xs text-slate-600">
            Confirm valid targets or reject false alarms to feed annotated sonar patches into the edge retraining pipeline.
          </p>
        </div>

        {/* Retraining Counter Badge */}
        <div className="flex items-center gap-2 bg-[#FEE440] px-4 py-2 rounded-full border-2.5 border-slate-900 shadow-[3px_3px_0px_#1E293B] font-peachy font-extrabold text-slate-900 text-sm shrink-0">
          <Database className="w-4 h-4 text-slate-900" />
          <span>Labeled for retraining: <span className="text-[#305CDE] text-lg">{retrainingCount}</span></span>
        </div>
      </div>

      {/* Review Queue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {detections.map((det) => (
          <div
            key={det.id}
            className="p-4 rounded-2xl border-2 border-slate-900 bg-slate-50 flex items-center justify-between gap-3 shadow-[2px_2px_0px_#1E293B]"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-slate-500">{det.id}</span>
                <span className="font-peachy font-extrabold text-sm text-slate-900">{det.classLabel}</span>
              </div>
              <p className="font-body text-xs text-slate-600">
                Confidence: <span className="font-bold text-[#305CDE]">{det.confidence}%</span> | Geo: {det.lat.toFixed(3)}°, {det.lng.toFixed(3)}°
              </p>
            </div>

            {/* Decision Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReview(det.id, 'confirmed')}
                className={`p-2 rounded-xl border-2 border-slate-900 transition-all font-peachy font-bold text-xs flex items-center gap-1 ${
                  det.status === 'confirmed'
                    ? 'bg-[#00E676] text-emerald-950 shadow-[2px_2px_0px_#1E293B]'
                    : 'bg-white hover:bg-emerald-50 text-slate-700'
                }`}
                title="Confirm Detection"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Confirm</span>
              </button>

              <button
                onClick={() => handleReview(det.id, 'rejected')}
                className={`p-2 rounded-xl border-2 border-slate-900 transition-all font-peachy font-bold text-xs flex items-center gap-1 ${
                  det.status === 'rejected'
                    ? 'bg-[#FF5964] text-white shadow-[2px_2px_0px_#1E293B]'
                    : 'bg-white hover:bg-red-50 text-slate-700'
                }`}
                title="Reject False Positive"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="hidden sm:inline">Reject</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
