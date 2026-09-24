from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class PredictionRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, json_schema_extra={"example": 27.7172})
    longitude: float = Field(..., ge=-180.0, le=180.0, json_schema_extra={"example": 85.3240})
    hazard_type: str = Field(..., json_schema_extra={"example": "Flood"}) # Flood, Landslide, Earthquake
    rainfall_mm: float = Field(default=120.0, ge=0.0, json_schema_extra={"example": 150.5})
    temperature_c: float = Field(default=24.0, json_schema_extra={"example": 26.5})
    elevation_m: float = Field(default=450.0, ge=-500.0, json_schema_extra={"example": 120.0})
    ndvi: float = Field(default=0.45, ge=-1.0, le=1.0, json_schema_extra={"example": 0.35})
    ndwi: float = Field(default=0.25, ge=-1.0, le=1.0, json_schema_extra={"example": 0.42})
    slope_deg: float = Field(default=12.0, ge=0.0, le=90.0, json_schema_extra={"example": 5.2})
    earthquake_magnitude: float = Field(default=0.0, ge=0.0, le=10.0, json_schema_extra={"example": 0.0})
    earthquake_depth_km: float = Field(default=10.0, ge=0.0, json_schema_extra={"example": 10.0})
    date: Optional[str] = Field(default=None, json_schema_extra={"example": "2026-09-10"})

class PredictionResponse(BaseModel):
    status: str
    latitude: float
    longitude: float
    hazard_type: str
    risk_level: str # LOW, MEDIUM, HIGH
    probability: float
    probability_percentage: str
    contributing_factors: List[str]
    early_warning: bool
    warning_details: Optional[Dict[str, Any]] = None
    model_version: str

class TrainModelResponse(BaseModel):
    status: str
    message: str
    dataset_summary: Dict[str, Any]
    evaluation_metrics: Dict[str, Any]
    training_loss_history: Dict[str, List[float]]
