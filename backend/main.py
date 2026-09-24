import sys
from pathlib import Path

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from backend.database import init_db
from backend.api.routes import router as api_router, initialize_ml_system

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    print("Starting EarthGuardian AI Backend Engine...")
    init_db()
    initialize_ml_system()
    yield
    print("Shutting down EarthGuardian AI Backend...")

app = FastAPI(
    title="EarthGuardian AI - Multi-Hazard Disaster Risk Prediction API",
    description="Backend AI API for Multi-Hazard Disaster Risk Prediction using Satellite Imagery, Environmental Data, Seismic Data, and PyTorch Temporal Transformers.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {
        "title": "EarthGuardian AI",
        "description": "Multi-Hazard Disaster Risk Prediction Using Satellite Imagery and Temporal Analysis",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
