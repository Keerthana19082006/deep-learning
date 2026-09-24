import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, MapPin, RefreshCw, Search, Info, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function EarthquakePage() {
  const [lat, setLat] = useState(27.7172);
  const [lon, setLon] = useState(85.3240);
  const [radius, setRadius] = useState(500);
  const [minMag, setMinMag] = useState(3.0);
  const [quakes, setQuakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEarthquakeData();
  }, []);

  async function fetchEarthquakeData() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEarthquakes(lat, lon, radius, minMag);
      if (data?.events) {
        setQuakes(data.events);
      }
    } catch (err) {
      setError("Failed to query USGS Earthquake GeoJSON API. Check connection.");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEarthquakeData();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-400" /> USGS Live Seismic Activity Monitoring
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time GeoJSON seismic event feed powered directly by the United States Geological Survey (USGS) API.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-navy-950 px-3 py-1.5 rounded-lg border border-emerald-900/40 text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="number" step="0.0001" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))}
              placeholder="Lat" className="w-20 bg-transparent text-white focus:outline-none font-mono"
            />
            <span className="text-slate-600">/</span>
            <input
              type="number" step="0.0001" value={lon} onChange={(e) => setLon(parseFloat(e.target.value))}
              placeholder="Lon" className="w-20 bg-transparent text-white focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 bg-navy-950 px-3 py-1.5 rounded-lg border border-emerald-900/40 text-xs">
            <span className="text-slate-400">Min M:</span>
            <input
              type="number" step="0.5" value={minMag} onChange={(e) => setMinMag(parseFloat(e.target.value))}
              className="w-12 bg-transparent text-white focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Query USGS Feed
          </button>
        </form>
      </div>

      {/* Warning Disclaimer Box */}
      <div className="bg-navy-950/80 border border-amber-500/40 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-200">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-300">EARTHQUAKE RISK ASSESSMENT NOTICE</h4>
          <p className="text-amber-200/80 leading-relaxed mt-0.5">
            Earthquakes cannot be deterministically predicted before occurrence. EarthGuardian AI analyzes historical fault proximity, focal depth vectors, and seismic magnitude distributions to provide a probabilistic <strong>Earthquake Risk Assessment</strong>.
          </p>
        </div>
      </div>

      {/* Quakes Table Feed */}
      <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-red-400 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Live Earthquake Events ({quakes.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Radius: {radius} km</span>
        </div>

        {quakes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/80 text-slate-400 border-b border-emerald-900/40">
                <tr>
                  <th className="p-3">Magnitude</th>
                  <th className="p-3">Location / Place</th>
                  <th className="p-3">Depth</th>
                  <th className="p-3">Coordinates (Lat, Lon)</th>
                  <th className="p-3">Time (UTC)</th>
                  <th className="p-3">Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950 text-slate-200 font-mono">
                {quakes.map((q) => (
                  <tr key={q.id} className="hover:bg-navy-800/40">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        q.magnitude >= 6.0 ? 'bg-red-950 text-red-400 border border-red-800' :
                        q.magnitude >= 4.5 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-navy-800 text-slate-300'
                      }`}>
                        M {q.magnitude}
                      </span>
                    </td>
                    <td className="p-3 font-sans font-medium text-white">{q.place}</td>
                    <td className="p-3">{q.depth_km} km</td>
                    <td className="p-3">{q.latitude}, {q.longitude}</td>
                    <td className="p-3 text-slate-400">{q.time}</td>
                    <td className="p-3">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                        {q.magnitude >= 5.5 ? 'HIGH RISK ZONE' : 'SEISMIC REGION'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            {loading ? 'Fetching USGS GeoJSON earthquake events...' : 'No earthquakes detected within selected radius and minimum magnitude threshold.'}
          </div>
        )}
      </div>
    </div>
  );
}
