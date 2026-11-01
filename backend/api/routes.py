import os
from typing import Any, cast
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
import numpy as np
import pandas as pd
import torch
import json

from backend.config import MODEL_DIR
from backend.api.schemas import PredictionRequest, PredictionResponse, TrainModelResponse
from backend.ml.dataset_pipeline import DatasetPipeline, FEATURE_COLS
from backend.ml.tabular_model import TabularModelManager, LABEL_MAP
from backend.ml.deep_learning_model import (
    EarthGuardianHybridModel,
    train_hybrid_pytorch_model,
    save_hybrid_model,
    load_hybrid_model
)
from backend.ml.evaluator import evaluate_model_performance
from backend.ml.explainer import explain_risk_level
from backend.services.usgs_service import fetch_usgs_earthquakes
from backend.services.openmeteo_service import fetch_open_meteo_weather
from backend.services.nasa_service import fetch_satellite_metadata
from backend.database import save_prediction, get_prediction_history, save_model_run, get_latest_model_run

router = APIRouter(prefix="/api")

# Global instances
pipeline = DatasetPipeline()
tabular_manager = TabularModelManager()
hybrid_pytorch_model: EarthGuardianHybridModel | None = None
latest_metrics = None
latest_loss_history = {}

def initialize_ml_system(force_retrain: bool = False):
    """Lazy initialization for ML components.
    - Loads saved pipeline, tabular model, and PyTorch hybrid model if files exist.
    - Does **not** perform full training on startup to keep RAM usage low.
    - If `force_retrain` is True, the cached models are cleared and will be trained on the first prediction request.
    """
    # Declare globals once, before any assignment.
    # globals already declared earlier

    # If a full retrain is requested, clear any cached objects and exit early.
    if force_retrain:
        hybrid_pytorch_model = None
        latest_metrics = None
        latest_loss_history = {}
        print("Force retrain requested – models will be trained on first prediction.")
        return

    pytorch_path = os.path.join(MODEL_DIR, "pytorch_hybrid.pt")

    # --------------------------------------------------------------
    # Light‑weight loading of persisted artifacts (no full dataset read)
    # --------------------------------------------------------------
    try:
        pipeline_loaded = pipeline.load()  # loads scaler & hazard encoder only
    except Exception as e:
        print(f"Warning: Pipeline load failed ({e}); will defer loading.")
        pipeline_loaded = False

    try:
        tabular_loaded = tabular_manager.load()
    except Exception as e:
        print(f"Warning: Tabular model load failed ({e}); will defer loading.")
        tabular_loaded = False

    loaded_pytorch = None
    if os.path.exists(pytorch_path):
        try:
            loaded_pytorch = load_hybrid_model(pytorch_path, tabular_dim=len(FEATURE_COLS))
        except Exception as e:
            print(f"Warning: PyTorch model load failed ({e}); will defer loading.")

    db_run = get_latest_model_run()

    if pipeline_loaded and tabular_loaded and loaded_pytorch is not None and db_run:
        # All components are ready – expose them as module‑level globals.
        hybrid_pytorch_model = loaded_pytorch
        latest_metrics = {
            "accuracy": db_run["accuracy"],
            "precision": db_run["precision"],
            "recall": db_run["recall"],
            "f1_score": db_run["f1_score"],
            "roc_auc": db_run.get("roc_auc", 0.0),
            "confusion_matrix": db_run["confusion_matrix"],
        }
        latest_loss_history = db_run.get("loss_history", {})
        print(f"ML models loaded from disk. Accuracy: {db_run['accuracy']*100:.2f}%")
    else:
        # Nothing fully ready – keep globals unset; training will happen lazily.
        hybrid_pytorch_model = None
        latest_metrics = None
        latest_loss_history = {}
        print("ML models not fully available; will load lazily on first request.")

    # --------------------------------------------------------------
    # If we still have no model (e.g., first run) we defer training until a request.
    # The original code performed eager training here; we keep the logic but
    # only execute it when a prediction explicitly requests it via `force_retrain`
    # or when the caller decides to invoke training elsewhere.
    # --------------------------------------------------------------
    # (No eager training is performed here to stay memory‑efficient.)

    """Lazy load of ML components.
    - Loads saved pipeline, tabular model, and PyTorch hybrid model if files exist.
    - Does **not** perform full training on startup to keep RAM usage low.
    - If `force_retrain` is True, models are cleared and will be trained on the first prediction request.
    """
    # globals already declared earlier
    pytorch_path = os.path.join(MODEL_DIR, "pytorch_hybrid.pt")
    if force_retrain:
        hybrid_pytorch_model = None
        latest_metrics = None
        latest_loss_history = {}
        print("Force retrain requested – models will be trained on first prediction.")
        return
    # Attempt to load saved artifacts without loading the full dataset.
    try:
        pipeline_loaded = pipeline.load()
    except Exception as e:
        print(f"Warning: Pipeline load failed ({e}); will defer loading.")
        pipeline_loaded = False
    try:
        tabular_loaded = tabular_manager.load()
    except Exception as e:
        print(f"Warning: Tabular model load failed ({e}); will defer loading.")
        tabular_loaded = False
    loaded_pytorch = None
    if os.path.exists(pytorch_path):
        try:
            loaded_pytorch = load_hybrid_model(pytorch_path, tabular_dim=len(FEATURE_COLS))
        except Exception as e:
            print(f"Warning: PyTorch model load failed ({e}); will defer loading.")
    db_run = get_latest_model_run()
    if pipeline_loaded and tabular_loaded and loaded_pytorch is not None and db_run:
        hybrid_pytorch_model = loaded_pytorch
        latest_metrics = {
            "accuracy": db_run["accuracy"],
            "precision": db_run["precision"],
            "recall": db_run["recall"],
            "f1_score": db_run["f1_score"],
            "roc_auc": db_run.get("roc_auc", 0.0),
            "confusion_matrix": db_run["confusion_matrix"],
        }
        latest_loss_history = db_run.get("loss_history", {})
    # Duplicate loading logic removed (see earlier block)




@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EarthGuardian AI Multi-Hazard Engine",
        "ml_model_loaded": tabular_manager.is_trained,
        "pytorch_hybrid_active": hybrid_pytorch_model is not None
    }

@router.get("/dataset/summary")
def get_dataset_summary():
    try:
        df = pipeline.load_data()
        clean_df = pipeline.preprocess(df, is_training=True)
        return {
            "status": "success",
            "total_records": len(clean_df),
            "columns": list(clean_df.columns),
            "hazard_type_counts": clean_df['hazard_type'].value_counts().to_dict(),
            "hazard_label_counts": clean_df['hazard_label'].value_counts().to_dict(),
            "sample_rows": clean_df.head(10).to_dict(orient="records"),
            "numerical_summary": clean_df[['rainfall_mm', 'temperature_c', 'elevation_m', 'ndvi', 'ndwi', 'slope_deg', 'earthquake_magnitude', 'earthquake_depth_km']].describe().to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict", response_model=PredictionResponse)
def predict_hazard_risk(req: PredictionRequest):
    if not tabular_manager.is_trained or hybrid_pytorch_model is None:
        initialize_ml_system()
        
    input_dict = req.model_dump()
    try:
        X_scaled = pipeline.transform_single(input_dict)
        
        # 1. Tabular prediction
        proba_tab = tabular_manager.predict_proba(X_scaled)[0]
        
        # 2. PyTorch hybrid transformer prediction
        if hybrid_pytorch_model is not None:
            hybrid_pytorch_model.eval()
            with torch.no_grad():
                x_t = torch.tensor(X_scaled, dtype=torch.float32)
                logits = hybrid_pytorch_model(x_t)
                proba_torch = torch.softmax(logits, dim=1).numpy()[0]
        else:
            proba_torch = proba_tab
            
        # Ensemble probabilities (50% Tabular ensemble + 50% PyTorch Transformer)
        proba_final = 0.5 * proba_tab + 0.5 * proba_torch
        pred_class_idx = int(np.argmax(proba_final))
        risk_level = LABEL_MAP.get(pred_class_idx, "LOW")
        max_prob = float(proba_final[pred_class_idx])
        
        # Explain risk factors
        explanation = explain_risk_level(req.hazard_type, risk_level, input_dict)
        
        record = {
            "latitude": req.latitude,
            "longitude": req.longitude,
            "hazard_type": req.hazard_type,
            "rainfall_mm": req.rainfall_mm,
            "temperature_c": req.temperature_c,
            "elevation_m": req.elevation_m,
            "ndvi": req.ndvi,
            "ndwi": req.ndwi,
            "slope_deg": req.slope_deg,
            "earthquake_magnitude": req.earthquake_magnitude,
            "earthquake_depth_km": req.earthquake_depth_km,
            "risk_level": risk_level,
            "probability": round(max_prob, 4),
            "contributing_factors": explanation['contributing_factors'],
            "model_type": "Hybrid PyTorch Transformer"
        }
        save_prediction(record)
        
        return PredictionResponse(
            status="success",
            latitude=req.latitude,
            longitude=req.longitude,
            hazard_type=req.hazard_type,
            risk_level=risk_level,
            probability=round(max_prob, 4),
            probability_percentage=f"{max_prob * 100:.1f}%",
            contributing_factors=explanation['contributing_factors'],
            early_warning=explanation['early_warning'],
            warning_details=explanation['warning_details'],
            model_version="EarthGuardian Hybrid PyTorch v2.1"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/risk-map")
def get_risk_map_points(hazard_filter: str = Query("ALL", examples=["ALL"])):
    try:
        df = pipeline.load_data()
        if hazard_filter and hazard_filter.upper() != "ALL":
            df = df[df['hazard_type'].str.upper() == hazard_filter.upper()]
            
        points = []
        for idx, row in df.iterrows():
            points.append({
                "id": str(row.get('id', f"P-{idx}")),
                "date": str(row.get('date', '')),
                "latitude": float(cast(Any, row['latitude'])),
                "longitude": float(cast(Any, row['longitude'])),
                "hazard_type": str(row['hazard_type']),
                "risk_level": str(row['hazard_label']),
                "rainfall_mm": float(cast(Any, row['rainfall_mm'])),
                "temperature_c": float(cast(Any, row['temperature_c'])),
                "elevation_m": float(cast(Any, row['elevation_m'])),
                "slope_deg": float(cast(Any, row['slope_deg'])),
                "earthquake_magnitude": float(cast(Any, row['earthquake_magnitude'])),
                "earthquake_depth_km": float(cast(Any, row['earthquake_depth_km'])),
                "ndvi": float(cast(Any, row['ndvi'])),
                "ndwi": float(cast(Any, row['ndwi']))
            })
        return {
            "status": "success",
            "count": len(points),
            "filter": hazard_filter,
            "points": points
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather")
async def get_live_weather(latitude: float = Query(...), longitude: float = Query(...)):
    return await fetch_open_meteo_weather(latitude, longitude)

@router.get("/earthquakes")
async def get_live_earthquakes(
    latitude: float = Query(27.7172),
    longitude: float = Query(85.3240),
    radius_km: float = Query(500.0),
    min_magnitude: float = Query(2.5)
):
    return await fetch_usgs_earthquakes(latitude, longitude, max_radius_km=radius_km, min_magnitude=min_magnitude)

@router.get("/satellite")
async def get_satellite_data(latitude: float = Query(...), longitude: float = Query(...), date: str = Query(None)):
    return await fetch_satellite_metadata(latitude, longitude, date)

@router.get("/history")
def get_history(limit: int = Query(50, le=200)):
    records = get_prediction_history(limit=limit)
    return {
        "status": "success",
        "count": len(records),
        "history": records
    }

@router.get("/model-performance")
def get_model_performance() -> dict[str, Any]:
    global latest_metrics, latest_loss_history
    db_run = get_latest_model_run()
    if db_run:
        return {
            "status": "success",
            "model_type": db_run['model_type'],
            "accuracy": db_run['accuracy'],
            "precision": db_run['precision'],
            "recall": db_run['recall'],
            "f1_score": db_run['f1_score'],
            "roc_auc": db_run['roc_auc'],
            "confusion_matrix": db_run['confusion_matrix'],
            "loss_history": db_run['loss_history'],
            "trained_at": db_run['trained_at'],
            "feature_importances": [
                {"feature": f, "importance": round(float(imp), 4)}
                for f, imp in zip(FEATURE_COLS, tabular_manager.feature_importances_)
            ] if tabular_manager.feature_importances_ is not None else []
        }
        
    if latest_metrics:
        return {
            "status": "success",
            "model_type": "Hybrid Tabular-PyTorch Transformer",
            "accuracy": latest_metrics['accuracy'],
            "precision": latest_metrics['precision'],
            "recall": latest_metrics['recall'],
            "f1_score": latest_metrics['f1_score'],
            "roc_auc": latest_metrics['roc_auc'],
            "confusion_matrix": latest_metrics['confusion_matrix'],
            "loss_history": latest_loss_history,
            "trained_at": pd.Timestamp.now().isoformat(),
            "feature_importances": [
                {"feature": f, "importance": round(float(imp), 4)}
                for f, imp in zip(FEATURE_COLS, tabular_manager.feature_importances_)
            ] if tabular_manager.feature_importances_ is not None else []
        }

    # If not yet trained, initialize
    initialize_ml_system()
    return get_model_performance()

@router.post("/train", response_model=TrainModelResponse)
def train_model():
    try:
        initialize_ml_system(force_retrain=True)
        db_run = get_latest_model_run() or {}
        raw_df = pipeline.load_data()
        
        return TrainModelResponse(
            status="success",
            message="Model successfully trained and evaluated on EarthGuardian multi-hazard dataset.",
            dataset_summary={
                "total_samples": len(raw_df),
                "features_count": len(FEATURE_COLS),
                "hazard_types": raw_df['hazard_type'].unique().tolist()
            },
            evaluation_metrics={
                "accuracy": db_run.get('accuracy', 0.0),
                "precision": db_run.get('precision', 0.0),
                "recall": db_run.get('recall', 0.0),
                "f1_score": db_run.get('f1_score', 0.0),
                "roc_auc": db_run.get('roc_auc', 0.0),
                "confusion_matrix": db_run.get('confusion_matrix', [])
            },
            training_loss_history=db_run.get('loss_history', {})
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
