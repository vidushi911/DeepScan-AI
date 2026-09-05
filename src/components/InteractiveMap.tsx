import React, { useEffect, useRef } from 'react';
import type { SonarDetection } from '../types/sonar';
import { MapPin, Compass } from 'lucide-react';
import L from 'leaflet';

interface InteractiveMapProps {
  detections: SonarDetection[];
  auvTrack: { lat: number; lng: number }[];
  selectedDetection: SonarDetection | null;
  onSelectDetection: (det: SonarDetection) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  detections,
  auvTrack,
  selectedDetection,
  onSelectDetection,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map around first detection or track
    const centerLat = detections.length > 0 ? detections[0].lat : 56.418;
    const centerLng = detections.length > 0 ? detections[0].lng : 3.211;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: true,
      });

      // Add OpenStreetMap tile layer with ocean contrast tint
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | DeepScan AI',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Draw AUV Survey Track Line
    if (auvTrack.length > 1) {
      const trackLatLngs = auvTrack.map((pt) => [pt.lat, pt.lng] as [number, number]);
      const polyline = L.polyline(trackLatLngs, {
        color: '#305CDE',
        weight: 4,
        dashArray: '6, 8',
      }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    // Add Markers per Detection
    detections.forEach((det) => {
      // Pin color based on confidence tier
      const color =
        det.confidence >= 80 ? '#00E676' : det.confidence >= 50 ? '#FEE440' : '#FF5964';

      const customIcon = L.divIcon({
        className: 'custom-sonar-pin',
        html: `
          <div style="
            background-color: ${color};
            border: 2.5px solid #1E293B;
            border-radius: 9999px;
            padding: 4px 8px;
            font-family: Fredoka, sans-serif;
            font-size: 11px;
            font-weight: 800;
            color: #1E293B;
            box-shadow: 3px 3px 0px #1E293B;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            transform: translate(-50%, -100%);
          ">
            <span>📍 ${det.confidence}%</span>
          </div>
        `,
        iconSize: [60, 30],
        iconAnchor: [30, 30],
      });

      const marker = L.marker([det.lat, det.lng], { icon: customIcon }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div style="font-family: Inter, sans-serif; padding: 4px; max-width: 200px;">
          <div style="font-family: Fredoka; font-size: 14px; font-weight: 700; color: #1E293B; margin-bottom: 2px;">
            ${det.classLabel}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            Depth: ${det.depthMeters}m | Geo: ${det.lat.toFixed(3)}°, ${det.lng.toFixed(3)}°
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #305CDE;">
            Fused Score: ${det.confidence}%
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectDetection(det);
      });

      markersRef.current[det.id] = marker;
    });
  }, [detections, auvTrack, onSelectDetection]);

  // Center selected detection if updated
  useEffect(() => {
    if (selectedDetection && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [selectedDetection.lat, selectedDetection.lng],
        15,
        { animate: true }
      );
      const marker = markersRef.current[selectedDetection.id];
      if (marker) marker.openPopup();
    }
  }, [selectedDetection]);

  return (
    <div className="bg-white border-3.5 border-slate-900 rounded-3xl p-5 shadow-[6px_6px_0px_#1E293B]">
      {/* Map Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b-2 border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#305CDE] text-white flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h3 className="font-peachy text-xl font-extrabold text-slate-900">
              Interactive Leaflet GIS Map View
            </h3>
            <p className="font-body text-xs text-slate-600">
              Real-time survey track line & geotagged hazard marker pins color-coded by confidence.
            </p>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-2 font-peachy text-xs font-bold">
          <span className="flex items-center gap-1 bg-[#00E676] text-emerald-950 px-2 py-0.5 rounded-full border border-slate-900">
            ● &gt;80% High
          </span>
          <span className="flex items-center gap-1 bg-[#FEE440] text-slate-900 px-2 py-0.5 rounded-full border border-slate-900">
            ● 50-80% Mid
          </span>
          <span className="flex items-center gap-1 bg-[#FF5964] text-white px-2 py-0.5 rounded-full border border-slate-900">
            ● &lt;50% Low
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-80 sm:h-96 rounded-2xl border-3 border-slate-900 shadow-inner z-0 overflow-hidden" 
      />

      {/* Selected Location Info Strip */}
      {selectedDetection && (
        <div className="mt-3 bg-[#B5C7EB]/40 p-3 rounded-2xl border-2 border-slate-900 flex items-center justify-between font-peachy text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#305CDE]" />
            Focused Pin: {selectedDetection.classLabel} ({selectedDetection.lat.toFixed(4)}°N, {selectedDetection.lng.toFixed(4)}°E)
          </span>
          <span className="text-[#305CDE] underline cursor-pointer" onClick={() => onSelectDetection(selectedDetection)}>
            Inspect Score Breakdown →
          </span>
        </div>
      )}
    </div>
  );
};
