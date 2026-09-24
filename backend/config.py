import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

USGS_API_BASE_URL = os.getenv("USGS_API_BASE_URL", "https://earthquake.usgs.gov/fdsnws/event/1")
OPEN_METEO_API_BASE_URL = os.getenv("OPEN_METEO_API_BASE_URL", "https://api.open-meteo.com/v1")
OPEN_METEO_ARCHIVE_URL = os.getenv("OPEN_METEO_ARCHIVE_URL", "https://archive-api.open-meteo.com/v1")
NASA_GIBS_BASE_URL = os.getenv("NASA_GIBS_BASE_URL", "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best")

DATASET_PATH = os.getenv("DATASET_PATH", str(BASE_DIR / "data" / "EarthGuardian_Multi_Hazard_Dataset.csv"))
DB_PATH = str(BASE_DIR / "earthguardian.db")
MODEL_DIR = str(BASE_DIR / "models")

os.makedirs(MODEL_DIR, exist_ok=True)
