import React, { useEffect, useState } from 'react';
import { CloudRain, TrendingUp, Calendar, Activity, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { api } from '../services/api';

export default function EnvironmentalPage() {
  const [summary, setSummary] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getDatasetSummary();
        setSummary(data);
        if (data?.sample_rows) {
          // Sort samples by date
          const sorted = [...data.sample_rows].sort((a, b) => new Date(a.date) - new Date(b.date));
          setTimeSeriesData(sorted);
        }
      } catch (err) {
        console.error("Error loading environmental time-series data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-emerald-400" /> Temporal Environmental & Index Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sequence time-series data consumed by the PyTorch Temporal Transformer Encoder block for trend analysis over time.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-navy-950 px-3 py-1.5 rounded-lg border border-emerald-900/40 text-xs font-mono text-emerald-400">
          <Calendar className="w-4 h-4 text-slate-400" /> 7-Day & Historical Temporal Windows
        </div>
      </div>

      {/* Grid of Time Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Rainfall (mm) vs Date */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2"><CloudRain className="w-4 h-4 text-teal-400" /> Rainfall (mm) vs Date</span>
            <span className="text-xs text-slate-500 font-mono">Hydro-Meteorological Trend</span>
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#17372B" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0E231B', borderColor: '#17372B', color: '#FFF' }} />
                <Area type="monotone" dataKey="rainfall_mm" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Temperature (°C) vs Date */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-400" /> Temperature (°C) vs Date</span>
            <span className="text-xs text-slate-500 font-mono">Thermal Anomaly Tracking</span>
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#17372B" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0E231B', borderColor: '#17372B', color: '#FFF' }} />
                <Line type="monotone" dataKey="temperature_c" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: NDVI & NDWI Satellite Indices vs Date */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2"><BarChart2 className="w-4 h-4 text-emerald-400" /> NDVI & NDWI Spectral Indices vs Date</span>
            <span className="text-xs text-slate-500 font-mono">Vegetation & Water Saturation</span>
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#17372B" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} domain={[-0.5, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#0E231B', borderColor: '#17372B', color: '#FFF' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="ndvi" name="NDVI (Vegetation)" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ndwi" name="NDWI (Water Content)" stroke="#34D399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Earthquake Magnitude vs Date */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-red-400" /> Seismic Magnitude (M) vs Date</span>
            <span className="text-xs text-slate-500 font-mono">Focal Activity History</span>
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#17372B" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} domain={[0, 8]} />
                <Tooltip contentStyle={{ backgroundColor: '#0E231B', borderColor: '#17372B', color: '#FFF' }} />
                <Line type="stepAfter" dataKey="earthquake_magnitude" name="Magnitude (M)" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
