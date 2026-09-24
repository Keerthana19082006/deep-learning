import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ShieldCheck, Cpu, ArrowRight, RefreshCw, Info, CheckCircle2 } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import EarlyWarningBanner from '../components/EarlyWarningBanner';
import { api } from '../services/api';

export default function PredictionPage({ initialValues }) {
  const [formData, setFormData] = useState({
    latitude: initialValues?.latitude || 27.7172,
    longitude: initialValues?.longitude || 85.3240,
    hazard_type: initialValues?.hazard_type || 'Flood',
    rainfall_mm: initialValues?.rainfall_mm || 165.0,
    temperature_c: initialValues?.temperature_c || 26.5,
    elevation_m: initialValues?.elevation_m || 120.0,
    ndvi: initialValues?.ndvi || 0.35,
    ndwi: initialValues?.ndwi || 0.48,
    slope_deg: initialValues?.slope_deg || 6.5,
    earthquake_magnitude: initialValues?.earthquake_magnitude || 0.0,
    earthquake_depth_km: initialValues?.earthquake_depth_km || 10.0
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hazard_type' ? value : parseFloat(value) || 0
    }));
  };

  const handlePreset = (presetName) => {
    if (presetName === 'high_flood') {
      setFormData({
        latitude: 14.5995, longitude: 120.9842, hazard_type: 'Flood',
        rainfall_mm: 240.0, temperature_c: 29.0, elevation_m: 15.0,
        ndvi: 0.40, ndwi: 0.68, slope_deg: 2.0, earthquake_magnitude: 0.0, earthquake_depth_km: 10.0
      });
    } else if (presetName === 'high_landslide') {
      setFormData({
        latitude: 27.9878, longitude: 86.9250, hazard_type: 'Landslide',
        rainfall_mm: 190.0, temperature_c: 14.0, elevation_m: 1450.0,
        ndvi: 0.22, ndwi: 0.35, slope_deg: 38.5, earthquake_magnitude: 2.1, earthquake_depth_km: 12.5
      });
    } else if (presetName === 'high_earthquake') {
      setFormData({
        latitude: 35.6762, longitude: 139.6503, hazard_type: 'Earthquake',
        rainfall_mm: 15.0, temperature_c: 18.0, elevation_m: 45.0,
        ndvi: 0.30, ndwi: 0.10, slope_deg: 5.0, earthquake_magnitude: 6.7, earthquake_depth_km: 12.5
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.predictRisk(formData);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to execute prediction. Please verify API backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Presets Bar */}
      <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" /> Multi-Hazard Risk Prediction Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Input environmental parameters or select preset scenarios to evaluate risk probability using the hybrid classifier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">Presets:</span>
          <button onClick={() => handlePreset('high_flood')} className="px-2.5 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/60 rounded text-xs font-semibold">
            Heavy Flood
          </button>
          <button onClick={() => handlePreset('high_landslide')} className="px-2.5 py-1 bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-800 rounded text-xs font-semibold">
            Steep Landslide
          </button>
          <button onClick={() => handlePreset('high_earthquake')} className="px-2.5 py-1 bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 rounded text-xs font-semibold">
            Seismic Quake
          </button>
        </div>
      </div>

      {/* Early Warning Banner if Result is High Risk */}
      {result?.early_warning && (
        <EarlyWarningBanner
          warningData={{
            hazard_type: result.hazard_type,
            location: { lat: result.latitude, lon: result.longitude },
            probability: result.probability,
            factors: result.contributing_factors,
            timestamp: new Date().toLocaleString()
          }}
        />
      )}

      {/* Main Grid: Form vs Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prediction Form (7 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 glass-panel p-6 rounded-xl border border-emerald-900/30 space-y-4">
          <div className="border-b border-emerald-900/40 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
              Parameter Inputs
            </h3>
            <span className="text-xs text-slate-500 font-mono">14 Feature Vectors</span>
          </div>

          {/* Hazard Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Hazard Type</label>
            <div className="grid grid-cols-3 gap-3">
              {['Flood', 'Landslide', 'Earthquake'].map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setFormData(prev => ({ ...prev, hazard_type: h }))}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    formData.hazard_type === h
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-navy-950/60 text-slate-400 border-emerald-900/40 hover:bg-navy-800'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Lat/Lon */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Latitude</label>
              <input
                type="number" step="0.0001" name="latitude" value={formData.latitude} onChange={handleChange}
                className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Longitude</label>
              <input
                type="number" step="0.0001" name="longitude" value={formData.longitude} onChange={handleChange}
                className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Environmental Numerical Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Rainfall (mm)</label>
              <input
                type="number" step="0.1" name="rainfall_mm" value={formData.rainfall_mm} onChange={handleChange}
                className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Temperature (°C)</label>
              <input
                type="number" step="0.1" name="temperature_c" value={formData.temperature_c} onChange={handleChange}
                className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Elevation (m)</label>
              <input
                type="number" step="1" name="elevation_m" value={formData.elevation_m} onChange={handleChange}
                className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">NDVI Index (-1 to 1)</label>
              <input
                type="number" step="0.01" name="ndvi" value={formData.ndvi} onChange={handleChange}
                className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">NDWI Index (-1 to 1)</label>
              <input
                type="number" step="0.01" name="ndwi" value={formData.ndwi} onChange={handleChange}
                className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Slope Incline (°)</label>
              <input
                type="number" step="0.1" name="slope_deg" value={formData.slope_deg} onChange={handleChange}
                className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Seismic Section */}
          <div className="bg-navy-950/60 p-3 rounded-lg border border-emerald-900/40 space-y-3">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">Seismic Activity Factors</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Earthquake Magnitude (M)</label>
                <input
                  type="number" step="0.1" name="earthquake_magnitude" value={formData.earthquake_magnitude} onChange={handleChange}
                  className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Focal Depth (km)</label>
                <input
                  type="number" step="0.1" name="earthquake_depth_km" value={formData.earthquake_depth_km} onChange={handleChange}
                  className="w-full bg-navy-950 border border-emerald-900/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {error && <div className="text-xs text-red-400 bg-red-950/60 p-3 rounded border border-red-800">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Evaluating Model Logic...' : 'Compute AI Risk Level'}
          </button>
        </form>

        {/* Prediction Results Display (5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-xl border border-emerald-900/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-emerald-900/40 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
                Risk Output Assessment
              </h3>
              <span className="text-xs text-slate-500 font-mono">PyTorch Hybrid</span>
            </div>

            {result ? (
              <div className="space-y-5">
                <div className="text-center p-6 bg-navy-950/90 rounded-xl border border-emerald-900/50 space-y-3">
                  <RiskBadge level={result.risk_level} probability={result.probability} size="lg" />
                  <div className="text-3xl font-extrabold text-white font-outfit">
                    {result.probability_percentage} <span className="text-xs font-normal text-slate-400">Probability</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Hazard Classification: <strong className="text-emerald-300">{result.hazard_type}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Contributing Environmental Factors
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {result.contributing_factors.map((factor, idx) => (
                      <li key={idx} className="bg-navy-950/60 p-2.5 rounded-lg border border-emerald-900/40 text-slate-200 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {formData.hazard_type === 'Earthquake' && (
                  <div className="bg-amber-950/40 p-3 rounded-lg border border-amber-800/40 text-[11px] text-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Notice:</strong> This is a statistical seismic risk assessment based on magnitude and depth observations, NOT a deterministic earthquake prediction.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 space-y-3">
                <Cpu className="w-12 h-12 text-emerald-600/60 mx-auto" />
                <p className="text-xs">Fill parameters and click "Compute AI Risk Level" to evaluate multi-hazard prediction probabilities.</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-emerald-900/30 pt-3">
            Engine Version: {result?.model_version || 'EarthGuardian Hybrid PyTorch v2.1'}
          </div>
        </div>
      </div>
    </div>
  );
}
