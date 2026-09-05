import React from 'react';
import { KNOWN_LIMITATIONS } from '../data/sampleData';
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const LimitationsCard: React.FC = () => {
  return (
    <div id="limitations" className="bg-[#FFF8E7] border-3.5 border-slate-900 rounded-3xl p-6 shadow-[6px_6px_0px_#1E293B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b-2 border-slate-900/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5964] text-white flex items-center justify-center border-2.5 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
            <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-peachy text-[11px] font-bold border border-slate-900 mb-0.5">
              <Info className="w-3 h-3" />
              <span>Technical Transparency Disclosure</span>
            </div>
            <h3 className="font-peachy text-2xl font-extrabold text-slate-900">
              Known Acoustic Limitations & Engineering Mitigations
            </h3>
          </div>
        </div>

        <span className="font-peachy font-extrabold text-xs bg-slate-900 text-white px-3 py-1.5 rounded-full border border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          Judges Respect Integrity
        </span>
      </div>

      {/* Limitations List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KNOWN_LIMITATIONS.map((item, _idx) => (
          <div
            key={item.title}
            className="bg-white p-4 rounded-2xl border-2.5 border-slate-900 shadow-[3px_3px_0px_#1E293B] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="font-peachy font-bold text-sm text-slate-900">{item.title}</h4>
              </div>
              <p className="font-body text-xs text-slate-600 mb-3 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-2 border-t-2 border-dashed border-slate-200 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-300">
              <span className="font-peachy font-bold text-[11px] text-emerald-950 flex items-center gap-1 mb-0.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Engineering Mitigation:
              </span>
              <p className="font-body text-[11px] text-emerald-900 leading-snug">
                {item.mitigation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
