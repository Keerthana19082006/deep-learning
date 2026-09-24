import React, { useState, useEffect } from 'react';
import { Globe2, Activity, Cpu, ShieldAlert, Clock } from 'lucide-react';

export default function Header({ systemStatus }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass-panel border-b border-emerald-900/40 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title and Branding */}
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-700 rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/40">
            <Globe2 className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white font-outfit">
                EARTHGUARDIAN <span className="text-emerald-400">AI</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                v2.1 Hybrid
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Multi-Hazard Disaster Risk Prediction Using Satellite Imagery and Temporal Analysis
            </p>
          </div>
        </div>

        {/* Live Metrics & UTC Clock */}
        <div className="flex items-center gap-6 text-xs">
          <div className="hidden lg:flex items-center gap-2 bg-navy-950/80 px-3 py-1.5 rounded-lg border border-emerald-900/50">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-slate-200">{timeStr || 'UTC Live'}</span>
          </div>

          <div className="flex items-center gap-2 bg-navy-950/80 px-3 py-1.5 rounded-lg border border-emerald-900/50">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Engine:</span>
            <span className="font-semibold text-emerald-400">PyTorch Transformer</span>
          </div>

          <div className="flex items-center gap-2 bg-navy-950/80 px-3 py-1.5 rounded-lg border border-emerald-900/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-200">
              {systemStatus?.healthy ? 'System Online' : 'Active'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
