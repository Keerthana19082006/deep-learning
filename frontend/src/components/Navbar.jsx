import React from 'react';
import { LayoutDashboard, Map, Calculator, Satellite, CloudRain, Activity, LineChart, History } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: '1. Overview', icon: LayoutDashboard },
  { id: 'risk-map', label: '2. Live Risk Map', icon: Map },
  { id: 'prediction', label: '3. Disaster Prediction', icon: Calculator },
  { id: 'satellite', label: '4. Satellite View', icon: Satellite },
  { id: 'environmental', label: '5. Environmental Data', icon: CloudRain },
  { id: 'earthquakes', label: '6. Earthquake Activity', icon: Activity },
  { id: 'performance', label: '7. Model Performance', icon: LineChart },
  { id: 'history', label: '8. Prediction History', icon: History }
];

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="bg-navy-950/90 backdrop-blur border-b border-emerald-900/40 px-4 sticky top-[73px] z-40">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-emerald-950/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
