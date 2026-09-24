# EarthGuardian AI

**Multi-Hazard Disaster Risk Prediction Using Satellite Imagery and Temporal Analysis**

EarthGuardian AI is a college-level AI/ML project prototype designed for multi-hazard disaster risk assessment. It integrates historical geospatial dataset records, live USGS earthquake feeds, Open-Meteo atmospheric weather data, and NASA GIBS satellite imagery metadata into a PyTorch CNN & Temporal Transformer hybrid classifier.

---

## 📌 Problem Statement

Natural disasters such as floods, landslides, and earthquakes cause widespread destruction and loss of life every year. Early multi-hazard risk assessment using multi-modal data (spatial terrain attributes, satellite imagery, temporal atmospheric variables, and seismic activity) can assist disaster response teams and civil defense planners in evaluating high-risk zones.

---

## 🎯 Objectives

1. Preprocess and analyze historical multi-hazard records (`EarthGuardian_Multi_Hazard_Dataset.csv`).
2. Train a hybrid ML architecture combining PyTorch CNN spatial feature extraction and Temporal Transformer sequence modeling.
3. Integrate live public APIs: USGS Earthquakes, Open-Meteo Weather, and NASA GIBS satellite tiles.
4. Provide interactive Leaflet maps with satellite layers, risk color coding, and coordinate inspection.
5. Generate human-readable risk explanations and early warning banners with legal disclaimers.

---

## 📊 Dataset Schema

The system uses `data/EarthGuardian_Multi_Hazard_Dataset.csv` containing:

| Column Name | Description | Type |
|---|---|---|
| `id` | Unique sample identifier | String |
| `date` | Observation date (YYYY-MM-DD) | Date String |
| `latitude` | Geographical latitude coordinate | Float |
| `longitude` | Geographical longitude coordinate | Float |
| `rainfall_mm` | Precipitation volume in millimeters | Float |
| `temperature_c` | Atmospheric temperature in °C | Float |
| `elevation_m` | Altitude above sea level in meters | Float |
| `ndvi` | Normalized Difference Vegetation Index (-1 to 1) | Float |
| `ndwi` | Normalized Difference Water Index (-1 to 1) | Float |
| `slope_deg` | Terrain incline angle in degrees | Float |
| `earthquake_magnitude` | Seismic magnitude (Richter / Moment magnitude) | Float |
| `earthquake_depth_km` | Earthquake focal depth in kilometers | Float |
| `hazard_type` | Target disaster category (`Flood`, `Landslide`, `Earthquake`) | String |
| `hazard_label` | Risk Level target (`LOW`, `MEDIUM`, `HIGH`) | String |

---

## 🧠 Model Architecture & Pipeline

```
          Tabular CSV / Live API Features
                         │
                         ▼
             Data Preprocessing & Scaling
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
PyTorch Spatial CNN           Temporal Transformer
(Satellite Tile 64-D)         (Multi-Step Sequence 64-D)
        │                                 │
        └────────────────┬────────────────┘
                         ▼
                   Dense Fusion Layer
                         │
                         ▼
            Multi-Hazard Risk Classifier
            (LOW / MEDIUM / HIGH Risk)
```

---

## 🌐 Public APIs Integrated

- **USGS Earthquake GeoJSON API**: `https://earthquake.usgs.gov/fdsnws/event/1/query`
- **Open-Meteo Weather API**: `https://api.open-meteo.com/v1/forecast`
- **NASA GIBS WMTS Services**: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best`
- **Esri World Imagery**: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Leaflet / React-Leaflet, Recharts, Lucide Icons
- **Backend**: Python 3.12, FastAPI, Pandas, NumPy, Scikit-Learn, PyTorch, Torchvision, HTTPX
- **Database**: SQLite (`earthguardian.db`)
- **Testing**: Pytest

---

## ⚡ Setup & Run Instructions

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn backend.main:app --reload --port 8000
```

### Frontend Setup
```bash
# Navigate to frontend folder
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```

Visit application at `http://localhost:5173`.

---

## ⚠️ Earthquake Disclaimer & Limitations

- **Earthquake Risk Assessment**: Earthquake output is strictly designated as **Earthquake Risk Assessment** based on observed magnitude, depth, and regional fault activity. The system does not claim deterministic prediction of earthquakes before they occur.
- **Experimental Tool**: This application is an academic AI research prototype and should not replace official civil protection emergency alerts.
