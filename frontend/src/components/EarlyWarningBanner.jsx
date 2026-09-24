import React from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';

export default function EarlyWarningBanner({ warningData }) {
  if (!warningData) return null;

  const { hazard_type, location, probability, factors, timestamp } = warningData;

  return (
    <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-2 border-red-500/80 rounded-xl p-5 shadow-2xl shadow-red-950/50 mb-6 text-white animate-pulse-subtle">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-red-700/50 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600/30 rounded-lg border border-red-500/50">
            <ShieldAlert className="w-8 h-8 text-red-400 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wide text-red-100 flex items-center gap-2">
              ⚠ HIGH RISK DETECTED
              <span className="bg-red-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold uppercase">CRITICAL WARNING</span>
            </h2>
            <p className="text-red-200 text-sm font-medium">
              Hazard Target: <span className="font-bold text-white uppercase">{hazard_type || 'Multi-Hazard Anomaly'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono bg-black/40 px-4 py-2 rounded-lg border border-red-500/30">
          <div>
            <span className="text-red-300 block">PROBABILITY</span>
            <span className="text-lg font-bold text-red-400">{probability ? (probability * 100).toFixed(1) + '%' : 'HIGH'}</span>
          </div>
          <div className="border-l border-red-800 h-8"></div>
          <div>
            <span className="text-red-300 block">TIMESTAMP</span>
            <span className="text-white">{timestamp || new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {location && (
        <div className="text-sm font-medium text-red-200 mb-3 flex items-center gap-2">
          <span className="bg-red-900/60 text-red-300 px-2 py-0.5 rounded text-xs">Coordinates</span>
          <span className="font-mono text-white">Lat: {location.lat}, Lon: {location.lon}</span>
        </div>
      )}

      {factors && factors.length > 0 && (
        <div className="mb-4 bg-black/30 rounded-lg p-3 border border-red-800/40">
          <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Primary Contributing Factors
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-red-100">
            {factors.map((f, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs bg-red-950/90 text-red-200/90 p-2.5 rounded-md border border-red-800/60 font-sans">
        <Info className="w-4 h-4 text-red-400 shrink-0" />
        <span>
          <strong>DISCLAIMER:</strong> This system is an experimental AI-based risk assessment tool and should not replace official emergency warnings or government civil protection advisories.
        </span>
      </div>
    </div>
  );
}
