import React, { useState } from 'react';
import type { SonarDetection } from '../types/sonar';
import { FileText, Download, Filter, ArrowUpDown } from 'lucide-react';

interface ReportsTableProps {
  detections: SonarDetection[];
  onSelectDetection: (det: SonarDetection) => void;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({ detections, onSelectDetection }) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [sortField, setSortField] = useState<'confidence' | 'timestamp' | 'depth'>('confidence');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Unique classes for filter dropdown
  const classOptions = Array.from(new Set(detections.map((d) => d.classLabel)));

  // Filter & Sort Logic
  const filtered = detections.filter((d) => {
    if (filterClass === 'all') return true;
    return d.classLabel === filterClass;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField === 'confidence' ? 'confidence' : sortField === 'depth' ? 'depthMeters' : 'timestamp'];
    let valB = b[sortField === 'confidence' ? 'confidence' : sortField === 'depth' ? 'depthMeters' : 'timestamp'];
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Download JSON Exporter
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(detections, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `DeepScan_AI_Sonar_Report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download CSV Exporter
  const exportCSV = () => {
    const headers = ['ID', 'ClassLabel', 'ConfidencePercent', 'Latitude', 'Longitude', 'DepthMeters', 'LengthMeters', 'WidthMeters', 'Status', 'Timestamp'];
    const rows = detections.map(d => [
      d.id,
      `"${d.classLabel}"`,
      d.confidence,
      d.lat,
      d.lng,
      d.depthMeters,
      d.lengthMeters,
      d.widthMeters,
      d.status,
      `"${d.timestamp}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `DeepScan_AI_Sonar_Report_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="reports-export" className="bg-white border-3.5 border-slate-900 rounded-3xl p-6 shadow-[6px_6px_0px_#1E293B]">
      {/* Table Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b-2 border-slate-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FEE440] text-slate-900 flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-peachy text-2xl font-extrabold text-slate-900">
              Sonar Anomaly Reports & Exporter
            </h3>
          </div>
          <p className="font-body text-xs text-slate-600 mt-1">
            Structured WGS84 GIS export format suitable for GIS software (ArcGIS, QGIS) & marine survey logs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-2xl border-2 border-slate-900 font-peachy text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-[#305CDE]" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Classes ({detections.length})</option>
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Export JSON Button */}
          <button
            onClick={exportJSON}
            className="font-peachy font-bold text-xs bg-[#305CDE] hover:bg-[#2D68C4] text-white px-3.5 py-2 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] hover:shadow-[4px_4px_0px_#1E293B] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="font-peachy font-bold text-xs bg-[#00E676] hover:bg-emerald-400 text-emerald-950 px-3.5 py-2 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] hover:shadow-[4px_4px_0px_#1E293B] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto rounded-2xl border-2.5 border-slate-900 shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#B5C7EB]/50 border-b-2.5 border-slate-900 font-peachy text-xs font-extrabold text-slate-900">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Object Classification</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-[#305CDE]"
                onClick={() => { setSortField('confidence'); setSortAsc(!sortAsc); }}
              >
                <div className="flex items-center gap-1">
                  <span>Confidence</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">WGS84 Lat / Lon</th>
              <th className="py-3 px-4">Depth</th>
              <th className="py-3 px-4">Dimensions (L × W)</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100 font-body text-xs text-slate-800">
            {sorted.map((det) => (
              <tr 
                key={det.id} 
                className="hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => onSelectDetection(det)}
              >
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{det.id}</td>
                <td className="py-3 px-4">
                  <span className="font-peachy font-bold text-slate-900 group-hover:text-[#305CDE] transition-colors">
                    {det.classLabel}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-peachy font-extrabold border ${
                    det.confidence >= 80
                      ? 'bg-[#00E676] text-emerald-950 border-slate-900'
                      : det.confidence >= 50
                      ? 'bg-[#FEE440] text-slate-900 border-slate-900'
                      : 'bg-[#FF5964] text-white border-slate-900'
                  }`}>
                    {det.confidence}%
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">
                  {det.lat.toFixed(4)}°N, {det.lng.toFixed(4)}°E
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">{det.depthMeters}m</td>
                <td className="py-3 px-4 font-mono text-slate-600">{det.lengthMeters}m × {det.widthMeters}m</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full font-peachy font-bold text-[10px] border ${
                    det.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                      : det.status === 'rejected'
                      ? 'bg-red-100 text-red-900 border-red-500'
                      : 'bg-amber-100 text-amber-900 border-amber-500'
                  }`}>
                    {det.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-peachy font-bold text-[#305CDE]">
                  Inspect →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
