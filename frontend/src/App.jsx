import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import OverviewPage from './pages/OverviewPage';
import LiveRiskMapPage from './pages/LiveRiskMapPage';
import PredictionPage from './pages/PredictionPage';
import SatelliteViewPage from './pages/SatelliteViewPage';
import EnvironmentalPage from './pages/EnvironmentalPage';
import EarthquakePage from './pages/EarthquakePage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [predictionPreset, setPredictionPreset] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ healthy: true });

  useEffect(() => {
    async function checkBackend() {
      try {
        const data = await api.getHealth();
        setSystemStatus({ healthy: data.status === 'healthy' });
      } catch (err) {
        setSystemStatus({ healthy: false });
      }
    }
    checkBackend();
  }, []);

  const handleSelectLocationForPrediction = (pointData) => {
    setPredictionPreset(pointData);
    setActiveTab('prediction');
  };

  return (
    <div className="min-h-screen bg-[#05130E] text-slate-100 flex flex-col font-sans">
      <Header systemStatus={systemStatus} />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'overview' && (
          <OverviewPage onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'risk-map' && (
          <LiveRiskMapPage onSelectForPrediction={handleSelectLocationForPrediction} />
        )}
        {activeTab === 'prediction' && (
          <PredictionPage initialValues={predictionPreset} />
        )}
        {activeTab === 'satellite' && (
          <SatelliteViewPage />
        )}
        {activeTab === 'environmental' && (
          <EnvironmentalPage />
        )}
        {activeTab === 'earthquakes' && (
          <EarthquakePage />
        )}
        {activeTab === 'performance' && (
          <ModelPerformancePage />
        )}
        {activeTab === 'history' && (
          <PredictionHistoryPage />
        )}
      </main>

      <footer className="glass-panel border-t border-emerald-900/40 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div>
            EarthGuardian AI © 2026 • Multi-Hazard Disaster Risk Assessment Research Prototype
          </div>
          <div className="font-mono text-emerald-400 font-semibold">
            Powered by PyTorch • FastAPI • Leaflet • USGS GeoJSON • Open-Meteo • NASA GIBS
          </div>
        </div>
      </footer>
    </div>
  );
}
