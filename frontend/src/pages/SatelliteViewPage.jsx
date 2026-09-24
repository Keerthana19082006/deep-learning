import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Satellite, MapPin, Calendar, Layers, RefreshCw, CheckCircle, Eye, Compass, Sun, CloudRain } from 'lucide-react';
import { api } from '../services/api';

// Custom Map Target Pin Icon
const targetIcon = L.divIcon({
  html: `
    <div style="
      background-color: #10B981;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid #05130E;
      box-shadow: 0 0 16px #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">
      <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
    </div>
  `,
  className: 'satellite-target-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

// Map Controller for smooth flyTo animation and invalidateSize fixing map rendering bugs
function MapController({ center, activeLayer }) {
  const map = useMap();
  useEffect(() => {
    // Invalidate size ensures Leaflet calculates container dimensions properly after flex/grid render
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    if (center && center[0] && center[1]) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 1.2 });
    }

    return () => clearTimeout(timer);
  }, [center, activeLayer, map]);
  return null;
}

// Map Click Listener to pick coordinates on click
function MapClickListener({ onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function SatelliteViewPage() {
  const [lat, setLat] = useState(27.7172);
  const [lon, setLon] = useState(85.3240);
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3); // NASA GIBS daily observations are indexed with ~2-3 days lag
    return d.toISOString().split('T')[0];
  });
  const [satData, setSatData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeLayer, setActiveLayer] = useState('esri'); // 'esri' | 'nasa_true_color' | 'nasa_modis'

  useEffect(() => {
    loadSatelliteInfo(lat, lon, targetDate);
  }, []);

  async function loadSatelliteInfo(targetLat = lat, targetLon = lon, dateStr = targetDate) {
    setLoading(true);
    try {
      const [satRes, wRes] = await Promise.all([
        api.getSatelliteData(targetLat, targetLon, dateStr),
        api.getWeather(targetLat, targetLon)
      ]);
      setSatData(satRes);
      setWeather(wRes);
    } catch (err) {
      console.error("Satellite view error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    loadSatelliteInfo(lat, lon, targetDate);
  };

  const handleMapClick = (clickLat, clickLon) => {
    const formattedLat = parseFloat(clickLat.toFixed(4));
    const formattedLon = parseFloat(clickLon.toFixed(4));
    setLat(formattedLat);
    setLon(formattedLon);
    loadSatelliteInfo(formattedLat, formattedLon, targetDate);
  };

  // Tile URL resolution
  const getTileUrl = () => {
    if (activeLayer === 'nasa_true_color' && satData?.layers?.nasa_gibs_true_color) {
      return satData.layers.nasa_gibs_true_color;
    }
    if (activeLayer === 'nasa_modis' && satData?.layers?.nasa_gibs_modis_terra) {
      return satData.layers.nasa_gibs_modis_terra;
    }
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  };

  const getAttribution = () => {
    if (activeLayer === 'esri') return '&copy; Esri World Imagery Satellite';
    if (activeLayer === 'nasa_true_color') return '&copy; NASA GIBS VIIRS TrueColor Earth Observation';
    return '&copy; NASA GIBS MODIS Terra Imagery';
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Satellite className="w-5 h-5 text-emerald-400" /> NASA GIBS & Esri Satellite Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Interactive Earth Observation Web Map Service — Click anywhere on the map or enter coordinates to fetch live satellite imagery and surface parameters.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Coordinates input */}
          <div className="flex items-center gap-2 bg-navy-950/90 px-3 py-2 rounded-lg border border-emerald-900/50 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
              placeholder="Latitude"
              className="w-20 bg-transparent text-white focus:outline-none font-mono font-semibold"
            />
            <span className="text-slate-600">/</span>
            <input
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
              placeholder="Longitude"
              className="w-20 bg-transparent text-white focus:outline-none font-mono font-semibold"
            />
          </div>

          {/* Date picker */}
          <div className="flex items-center gap-2 bg-navy-950/90 px-3 py-2 rounded-lg border border-emerald-900/50 text-xs">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => {
                setTargetDate(e.target.value);
                loadSatelliteInfo(lat, lon, e.target.value);
              }}
              className="bg-transparent text-white focus:outline-none font-medium cursor-pointer"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-2 shadow-md shadow-emerald-500/20"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Layers className="w-4 h-4" />} Inspect
          </button>
        </form>
      </div>

      {/* Layer Selector Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Eye className="w-3.5 h-3.5 text-emerald-400" /> Satellite Layer:
        </span>
        
        <button
          onClick={() => setActiveLayer('esri')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-2 ${
            activeLayer === 'esri'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
              : 'bg-navy-950/80 text-slate-300 border-emerald-900/40 hover:bg-navy-800'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" /> Esri High-Res World Imagery
        </button>

        <button
          onClick={() => setActiveLayer('nasa_true_color')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-2 ${
            activeLayer === 'nasa_true_color'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
              : 'bg-navy-950/80 text-slate-300 border-emerald-900/40 hover:bg-navy-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" /> NASA GIBS VIIRS TrueColor ({targetDate})
        </button>

        <button
          onClick={() => setActiveLayer('nasa_modis')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-2 ${
            activeLayer === 'nasa_modis'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
              : 'bg-navy-950/80 text-slate-300 border-emerald-900/40 hover:bg-navy-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> NASA MODIS Terra TrueColor
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Leaflet Satellite Map (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-2 rounded-xl border border-emerald-900/30 h-[520px] relative overflow-hidden">
          <MapContainer
            center={[lat, lon]}
            zoom={7}
            minZoom={3}
            maxZoom={18}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
          >
            <MapController center={[lat, lon]} activeLayer={activeLayer} />
            <MapClickListener onSelectLocation={handleMapClick} />
            
            {/* Always render Esri satellite as base background */}
            <TileLayer
              attribution="&copy; Esri World Imagery"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />

            {/* Render NASA GIBS layer overlay if selected */}
            {activeLayer !== 'esri' && (
              <TileLayer
                key={`${activeLayer}-${targetDate}`}
                attribution={getAttribution()}
                url={getTileUrl()}
                maxZoom={18}
                maxNativeZoom={9}
                opacity={0.9}
              />
            )}

            <Marker position={[lat, lon]} icon={targetIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-bold text-emerald-400 flex items-center gap-1">
                    <Satellite className="w-3.5 h-3.5 text-emerald-400" /> Target Satellite Grid
                  </div>
                  <div className="text-white font-mono">
                    Lat: {lat.toFixed(4)}, Lon: {lon.toFixed(4)}
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Observation Date: {targetDate}
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-[400] glass-panel px-3 py-1.5 rounded-lg border border-emerald-800/80 text-xs font-mono text-emerald-300 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Target: {lat.toFixed(4)}°, {lon.toFixed(4)}°
          </div>

          {/* Map Status Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-[400] glass-panel px-4 py-2 rounded-lg border border-emerald-800/70 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{satData?.status_note || 'Satellite Map Active.'}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Click map to reposition
            </span>
          </div>
        </div>

        {/* Environmental & ML Extraction Panel (1 Col) */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-900/40 pb-3 text-emerald-400 flex items-center justify-between">
              <span>Environmental Conditions</span>
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
            </h3>

            {weather?.current ? (
              <div className="bg-navy-950/90 p-4 rounded-xl border border-emerald-900/40 text-xs space-y-2.5 font-mono">
                <div className="flex justify-between border-b border-emerald-900/40 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-400" /> Temperature:</span>
                  <span className="text-white font-bold">{weather.current.temperature_c} °C</span>
                </div>
                <div className="flex justify-between border-b border-emerald-900/40 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5 text-emerald-400" /> Precipitation:</span>
                  <span className="text-emerald-400 font-bold">{weather.current.precipitation_mm} mm</span>
                </div>
                <div className="flex justify-between border-b border-emerald-900/40 pb-1.5">
                  <span className="text-slate-400">Relative Humidity:</span>
                  <span className="text-slate-200">{weather.current.humidity_pct} %</span>
                </div>
                <div className="flex justify-between border-b border-emerald-900/40 pb-1.5">
                  <span className="text-slate-400">Surface Pressure:</span>
                  <span className="text-slate-200">{weather.current.pressure_hpa} hPa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Wind Velocity:</span>
                  <span className="text-slate-200">{weather.current.wind_speed_kmh} km/h</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading environmental weather data...
              </div>
            )}

            <div className="bg-navy-950/90 p-4 rounded-xl border border-emerald-900/40 space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Satellite className="w-3.5 h-3.5 text-emerald-400" /> PyTorch Spatial Extraction
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Convolves multi-spectral 3x64x64 satellite tile matrices to generate a 64-D spatial risk embedding vector, combined with tabular environmental sensors inside the EarthGuardian Hybrid Transformer.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 border-t border-emerald-900/30 pt-3">
            Tip: You can switch between Esri High-Resolution World Imagery and NASA GIBS daily observation layers above.
          </div>
        </div>
      </div>
    </div>
  );
}
