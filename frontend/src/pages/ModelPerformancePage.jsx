import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { LineChart as LineChartIcon, RefreshCw, CheckCircle2, TrendingUp, Cpu, Award, Zap } from 'lucide-react';
import { api } from '../services/api';

export default function ModelPerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  async function loadPerformanceData() {
    setLoading(true);
    try {
      const data = await api.getModelPerformance();
      setMetrics(data);
    } catch (err) {
      console.error("Error loading model metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleRetrain = async () => {
    setTraining(true);
    setTrainStatus("Training PyTorch CNN & Temporal Transformer hybrid model on multi-hazard dataset...");
    try {
      const res = await api.trainModel();
      setTrainStatus(res.message);
      await loadPerformanceData();
    } catch (err) {
      setTrainStatus("Training failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setTraining(false);
    }
  };

  // Convert loss history to chart array
  const lossChartData = metrics?.loss_history?.train_loss ? metrics.loss_history.train_loss.map((tLoss, idx) => ({
    epoch: idx + 1,
    train_loss: tLoss,
    val_loss: metrics.loss_history.val_loss[idx] || tLoss,
    val_acc: metrics.loss_history.val_acc ? metrics.loss_history.val_acc[idx] * 100 : 0
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-emerald-400" /> Empirical Model Evaluation & Loss Curves
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculated on test split metrics for the PyTorch Temporal Transformer and Ensemble classifier.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={training}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
        >
          {training ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {training ? 'Training Model...' : 'Re-Train Hybrid Model'}
        </button>
      </div>

      {trainStatus && (
        <div className="bg-navy-950/80 p-3 rounded-lg border border-emerald-500/40 text-xs text-emerald-200 font-mono">
          {trainStatus}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-emerald-900/30 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Accuracy</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {metrics ? (metrics.accuracy * 100).toFixed(1) + '%' : '--'}
          </div>
          <span className="text-[10px] text-slate-500">Overall Precision Rate</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-900/30 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Precision</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {metrics ? (metrics.precision * 100).toFixed(1) + '%' : '--'}
          </div>
          <span className="text-[10px] text-slate-500">Weighted Precision</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-900/30 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recall</span>
          <div className="text-2xl font-bold text-teal-400 font-mono">
            {metrics ? (metrics.recall * 100).toFixed(1) + '%' : '--'}
          </div>
          <span className="text-[10px] text-slate-500">Sensitivity Score</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-900/30 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">F1 Score</span>
          <div className="text-2xl font-bold text-emerald-300 font-mono">
            {metrics ? (metrics.f1_score * 100).toFixed(1) + '%' : '--'}
          </div>
          <span className="text-[10px] text-slate-500">Harmonic Mean</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-900/30 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ROC-AUC</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {metrics ? metrics.roc_auc.toFixed(3) : '--'}
          </div>
          <span className="text-[10px] text-slate-500">Area Under Curve</span>
        </div>
      </div>

      {/* Loss Curves & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training vs Validation Loss Curve */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> PyTorch Training vs Validation Loss Curve
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lossChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#17372B" />
                <XAxis dataKey="epoch" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0E231B', borderColor: '#17372B', color: '#FFF' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="train_loss" name="Training Loss" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="val_loss" name="Validation Loss" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix Table */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-900/30 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Confusion Matrix (Actual vs Predicted)
          </h3>
          {metrics?.confusion_matrix ? (
            <div className="space-y-3">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-emerald-900/40">
                    <th className="p-2 text-left">Actual \ Pred</th>
                    <th className="p-2 text-emerald-400">LOW</th>
                    <th className="p-2 text-amber-400">MEDIUM</th>
                    <th className="p-2 text-red-400">HIGH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950 text-slate-200">
                  {['LOW', 'MEDIUM', 'HIGH'].map((label, rIdx) => (
                    <tr key={label}>
                      <td className="p-2 text-left font-bold text-slate-300 font-sans">{label}</td>
                      {metrics.confusion_matrix[rIdx]?.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-3 font-bold ${
                            rIdx === cIdx ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-navy-950/60 text-slate-400'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-slate-400 text-center">
                Diagonal values represent correct classification counts across testing classes.
              </p>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">Loading confusion matrix...</div>
          )}
        </div>
      </div>
    </div>
  );
}
