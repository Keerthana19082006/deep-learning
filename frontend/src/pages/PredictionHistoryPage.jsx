import React, { useEffect, useState } from 'react';
import { History, Search, RefreshCw, Database } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { api } from '../services/api';

export default function PredictionHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterHazard, setFilterHazard] = useState('ALL');

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await api.getPredictionHistory(50);
      if (data?.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Error loading prediction history:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredHistory = filterHazard === 'ALL'
    ? history
    : history.filter(item => item.hazard_type.toUpperCase() === filterHazard.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" /> SQLite Persistent Prediction Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical audit trial of user prediction queries stored in local SQLite database (`earthguardian.db`).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {['ALL', 'Flood', 'Landslide', 'Earthquake'].map((h) => (
              <button
                key={h}
                onClick={() => setFilterHazard(h)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  filterHazard === h
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-navy-950/60 text-slate-400 border-emerald-900/40 hover:bg-navy-800'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          <button
            onClick={loadHistory}
            className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-semibold rounded-lg border border-emerald-800/40 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Database className="w-4 h-4" /> Prediction Database Log Records ({filteredHistory.length})
          </h3>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/80 text-slate-400 border-b border-emerald-900/40">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Coordinates</th>
                  <th className="p-3">Hazard</th>
                  <th className="p-3">Rainfall / Slope</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Probability</th>
                  <th className="p-3">Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950 text-slate-200 font-mono">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-navy-800/40">
                    <td className="p-3 text-slate-500">#{item.id}</td>
                    <td className="p-3 text-slate-300">{item.timestamp?.replace('T', ' ').substring(0, 19)}</td>
                    <td className="p-3">{item.latitude}, {item.longitude}</td>
                    <td className="p-3 font-sans font-bold text-emerald-300">{item.hazard_type}</td>
                    <td className="p-3">{item.rainfall_mm}mm / {item.slope_deg}°</td>
                    <td className="p-3">
                      <RiskBadge level={item.risk_level} size="sm" />
                    </td>
                    <td className="p-3 font-bold text-white">{(item.probability * 100).toFixed(1)}%</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">{item.model_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            {loading ? 'Loading prediction database log history...' : 'No historical predictions recorded in SQLite database yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
