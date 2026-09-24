import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function RiskBadge({ level, probability, size = "md" }) {
  const normalized = level ? level.toUpperCase() : "LOW";

  const isLg = size === "lg";
  const isSm = size === "sm";

  if (normalized === "HIGH") {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full font-bold bg-red-950/80 text-red-400 border border-red-500/50 risk-high-pulse ${isLg ? 'px-4 py-2 text-base' : isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
        <ShieldAlert className={isLg ? "w-5 h-5 text-red-400" : "w-4 h-4 text-red-400"} />
        <span>HIGH RISK</span>
        {probability !== undefined && (
          <span className="bg-red-900/60 text-red-200 px-2 py-0.5 rounded-md text-xs font-mono ml-1">
            {typeof probability === 'number' ? (probability * 100).toFixed(1) + '%' : probability}
          </span>
        )}
      </div>
    );
  }

  if (normalized === "MEDIUM") {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/50 ${isLg ? 'px-4 py-2 text-base' : isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
        <AlertTriangle className={isLg ? "w-5 h-5 text-amber-400" : "w-4 h-4 text-amber-400"} />
        <span>MEDIUM RISK</span>
        {probability !== undefined && (
          <span className="bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-md text-xs font-mono ml-1">
            {typeof probability === 'number' ? (probability * 100).toFixed(1) + '%' : probability}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 ${isLg ? 'px-4 py-2 text-base' : isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      <ShieldCheck className={isLg ? "w-5 h-5 text-emerald-400" : "w-4 h-4 text-emerald-400"} />
      <span>LOW RISK</span>
      {probability !== undefined && (
        <span className="bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-md text-xs font-mono ml-1">
          {typeof probability === 'number' ? (probability * 100).toFixed(1) + '%' : probability}
        </span>
      )}
    </div>
  );
}
