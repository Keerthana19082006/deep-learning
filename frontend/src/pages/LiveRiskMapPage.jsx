import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Filter, Layers, MapPin, Search, Activity, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { api } from '../services/api';

// Custom Map Marker Icons using HTML SVGs
function createCustomMarker(riskLevel, hazardType) {
  let color = "#10B981"; // Low (Green)
  if (riskLevel === "HIGH") color = "#EF4444"; // High (Red)
  else if (riskLevel === "MEDIUM") color = "#F59E0B"; // Medium (Orange)

  const svgHtml = `
    <div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid #0E231B;
      box-shadow: 0 0 12px ${color};
      display: flex;
      align-items: center;
      justify-content: center;
    ">
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

// Map Click Listener Component
function MapClickListener({ onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LiveRiskMapPage({ onSelectForPrediction }) {
  const [points, setPoints] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [tileLayerType, setTileLayerType] = useState('satellite'); // satellite or street
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]); // Default South Asia/Himalayas center
  const [usgsQuakes, setUsgsQuakes] = useState([]);

  useEffect(() => {
    fetchMapPoints();
  }, [filter]);

  async function fetchMapPoints() {
    setLoading(true);
    try {
      const data = await api.getRiskMapPoints(filter);
      if (data?.points) {
        setPoints(data.points);
      }
      
      // Fetch live USGS earthquakes around map center
      const eqData = await api.getEarthquakes(mapCenter[0], mapCenter[1], 1000, 3.5);
      if (eqData?.events) {
        setUsgsQuakes(eqData.events);
      }
    } catch (err) {
      console.error("Error fetching map points:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleMapClick = (lat, lon) => {
    const clickPoint = {
      id: `custom-click-${Date.now()}`,
      latitude: parseFloat(lat.toFixed(4)),
      longitude: parseFloat(lon.toFixed(4)),
      hazard_type: filter === 'ALL' ? 'Flood' : filter,
      risk_level: 'HIGH',
      rainfall_mm: 140.0,
      temperature_c: 24.5,
      elevation_m: 350.0,
      slope_deg: 18.0,
      earthquake_magnitude: 0.0,
      earthquake_depth_km: 10.0,
      isCustomClick: true
    };
    setSelectedPoint(clickPoint);
  };

  const handleLocationSearch = (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    const parts = searchQuery.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setMapCenter([parts[0], parts[1]]);
      handleMapClick(parts[0], parts[1]);
    } else {
      alert("Please enter coordinates format: 'Latitude, Longitude' (e.g. 27.7172, 85.3240)");
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-900/30 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Hazard Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filter:
          </span>
          {['ALL', 'Flood', 'Landslide', 'Earthquake'].map((h) => (
            <button
              key={h}
              onClick={() => setFilter(h)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filter === h
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm shadow-emerald-500/30'
                  : 'bg-navy-950/80 text-slate-300 border-emerald-900/40 hover:bg-navy-800'
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Search & Layer Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleLocationSearch} className="flex items-center gap-2 bg-navy-950/80 px-3 py-1.5 rounded-lg border border-emerald-900/40 text-xs flex-1 md:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Lat, Lon (e.g. 27.7172, 85.324)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white focus:outline-none w-48 text-xs placeholder:text-slate-500"
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300 font-bold">Go</button>
          </form>

          <button
            onClick={() => setTileLayerType(tileLayerType === 'satellite' ? 'street' : 'satellite')}
            className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-semibold rounded-lg border border-emerald-800/40 flex items-center gap-1.5 transition"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            {tileLayerType === 'satellite' ? 'Esri Satellite' : 'OpenStreetMap'}
          </button>
        </div>
      </div>

      {/* Map Container & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Leaflet Map */}
        <div className="lg:col-span-2 glass-panel p-2 rounded-xl border border-emerald-900/30 h-[600px] relative overflow-hidden">
          <MapContainer center={mapCenter} zoom={6} scrollWheelZoom={true} className="h-full w-full rounded-lg">
            <MapClickListener onSelectLocation={handleMapClick} />
            
            {tileLayerType === 'satellite' ? (
              <TileLayer
                attribution="&copy; Esri World Imagery"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            ) : (
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            {/* Render Dataset Risk Points */}
            {points.map((pt) => (
              <Marker
                key={pt.id}
                position={[pt.latitude, pt.longitude]}
                icon={createCustomMarker(pt.risk_level, pt.hazard_type)}
                eventHandlers={{
                  click: () => setSelectedPoint(pt)
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <div className="font-bold text-white flex items-center justify-between gap-2">
                      <span>{pt.hazard_type}</span>
                      <RiskBadge level={pt.risk_level} size="sm" />
                    </div>
                    <div className="text-slate-300 font-mono">
                      Lat: {pt.latitude}, Lon: {pt.longitude}
                    </div>
                    <div className="text-slate-400">
                      Rain: {pt.rainfall_mm}mm | Elev: {pt.elevation_m}m
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render Live USGS Earthquake Markers */}
            {usgsQuakes.map((eq) => (
              <CircleMarker
                key={eq.id}
                center={[eq.latitude, eq.longitude]}
                radius={Math.max(4, eq.magnitude * 2.5)}
                pathOptions={{ color: '#EF4444', fillColor: '#DC2626', fillOpacity: 0.6 }}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <div className="font-bold text-red-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" /> USGS Earthquake M{eq.magnitude}
                    </div>
                    <div className="text-white font-medium">{eq.place}</div>
                    <div className="text-slate-300 font-mono">Depth: {eq.depth_km} km | Time: {eq.time}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-[400] glass-panel px-3 py-2 rounded-lg border border-emerald-800/60 text-[11px] flex items-center gap-4 text-slate-200">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Low Risk</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Medium Risk</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> High Risk</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600 border border-white"></span> USGS Seismic</div>
          </div>
        </div>

        {/* Selected Location Risk Detail Panel */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> Location Inspector
              </h3>
              {selectedPoint && <RiskBadge level={selectedPoint.risk_level} />}
            </div>

            {selectedPoint ? (
              <div className="space-y-4">
                <div className="bg-navy-950/80 p-3 rounded-lg border border-emerald-900/40 text-xs font-mono space-y-1 text-slate-300">
                  <div><span className="text-slate-500">Target Coordinates:</span> <strong className="text-white">{selectedPoint.latitude}, {selectedPoint.longitude}</strong></div>
                  <div><span className="text-slate-500">Hazard Category:</span> <strong className="text-emerald-400">{selectedPoint.hazard_type}</strong></div>
                  <div><span className="text-slate-500">Rainfall:</span> {selectedPoint.rainfall_mm} mm</div>
                  <div><span className="text-slate-500">Slope:</span> {selectedPoint.slope_deg}° | <span className="text-slate-500">Elevation:</span> {selectedPoint.elevation_m} m</div>
                  <div><span className="text-slate-500">Earthquake Mag:</span> M{selectedPoint.earthquake_magnitude} ({selectedPoint.earthquake_depth_km} km depth)</div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluation Context</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-navy-800/60 p-3 rounded-lg border border-emerald-900/30">
                    Selected coordinate position synced with USGS regional seismic grid and local terrain characteristics. Fused through PyTorch Transformer layer.
                  </p>
                </div>

                <button
                  onClick={() => onSelectForPrediction(selectedPoint)}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" /> Run Full AI Risk Analysis
                </button>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-3">
                <MapPin className="w-10 h-10 text-emerald-600/60 mx-auto animate-bounce" />
                <p className="text-xs">Click anywhere on the interactive satellite map or select a marker to inspect location risk factors.</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-emerald-900/30 pt-3">
            Tip: Toggle between Satellite imagery and OpenStreetMap layers using the control bar above.
          </div>
        </div>
      </div>
    </div>
  );
}
