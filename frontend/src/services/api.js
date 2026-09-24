import axios from 'axios';

const API_BASE = '/api';

export const api = {
  getHealth: async () => {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  getDatasetSummary: async () => {
    const res = await axios.get(`${API_BASE}/dataset/summary`);
    return res.data;
  },

  predictRisk: async (payload) => {
    const res = await axios.post(`${API_BASE}/predict`, payload);
    return res.data;
  },

  getRiskMapPoints: async (hazardFilter = 'ALL') => {
    const res = await axios.get(`${API_BASE}/risk-map`, {
      params: { hazard_filter: hazardFilter }
    });
    return res.data;
  },

  getWeather: async (lat, lon) => {
    const res = await axios.get(`${API_BASE}/weather`, {
      params: { latitude: lat, longitude: lon }
    });
    return res.data;
  },

  getEarthquakes: async (lat, lon, radiusKm = 500, minMag = 2.5) => {
    const res = await axios.get(`${API_BASE}/earthquakes`, {
      params: { latitude: lat, longitude: lon, radius_km: radiusKm, min_magnitude: minMag }
    });
    return res.data;
  },

  getSatelliteData: async (lat, lon, date = null) => {
    const res = await axios.get(`${API_BASE}/satellite`, {
      params: { latitude: lat, longitude: lon, date }
    });
    return res.data;
  },

  getPredictionHistory: async (limit = 50) => {
    const res = await axios.get(`${API_BASE}/history`, {
      params: { limit }
    });
    return res.data;
  },

  getModelPerformance: async () => {
    const res = await axios.get(`${API_BASE}/model-performance`);
    return res.data;
  },

  trainModel: async () => {
    const res = await axios.post(`${API_BASE}/train`);
    return res.data;
  }
};
