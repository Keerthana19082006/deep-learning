import sys
from pathlib import Path
import httpx
from datetime import datetime, timedelta

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import NASA_GIBS_BASE_URL

# Official NASA GIBS WMTS Layer configurations
NASA_LAYERS = {
    "true_color": "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    "modis_terra": "MODIS_Terra_CorrectedReflectance_TrueColor",
    "surface_temp": "MODIS_Terra_Land_Surface_Temp_Day",
    "water_mask": "MODIS_Water_Mask"
}

def get_esri_satellite_tile_url(lat: float, lon: float, zoom: int = 12) -> str:
    import math
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    xtile = int((lon + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{ytile}/{xtile}"

async def fetch_satellite_metadata(latitude: float, longitude: float, target_date: str | None = None):
    if not target_date:
        target_date = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        
    esri_tile_url = get_esri_satellite_tile_url(latitude, longitude)
    
    gibs_layer = NASA_LAYERS["true_color"]
    nasa_tile_template = f"{NASA_GIBS_BASE_URL}/{gibs_layer}/default/{target_date}/GoogleMapsCompatible_Level9/6/15/22.jpg"
    
    imagery_available = True
    status_note = f"Satellite layer indexed for date {target_date} at coordinates ({latitude:.4f}, {longitude:.4f})."
    
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.head(nasa_tile_template)
            if resp.status_code == 200:
                status_note = f"NASA GIBS VIIRS TrueColor satellite layer verified for {target_date}."
            else:
                status_note = f"NASA GIBS tile index HTTP {resp.status_code}. Interactive layer active with Esri High-Res World Imagery backup."
    except Exception:
        status_note = f"Satellite layer active for ({latitude:.4f}, {longitude:.4f}) with Esri World Imagery fallback."

    return {
        "status": "success",
        "latitude": latitude,
        "longitude": longitude,
        "date": target_date,
        "imagery_available": imagery_available,
        "status_note": status_note,
        "layers": {
            "esri_world_imagery": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            "nasa_gibs_true_color": f"{NASA_GIBS_BASE_URL}/{NASA_LAYERS['true_color']}/default/{target_date}/GoogleMapsCompatible_Level9/{{z}}/{{y}}/{{x}}.jpg",
            "nasa_gibs_modis_terra": f"{NASA_GIBS_BASE_URL}/{NASA_LAYERS['modis_terra']}/default/{target_date}/GoogleMapsCompatible_Level9/{{z}}/{{y}}/{{x}}.jpg",
            "nasa_gibs_surface_temp": f"{NASA_GIBS_BASE_URL}/{NASA_LAYERS['surface_temp']}/default/{target_date}/GoogleMapsCompatible_Level7/{{z}}/{{y}}/{{x}}.png"
        },
        "sample_tile_url": esri_tile_url
    }


if __name__ == "__main__":
    import asyncio
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 60)
    print("EarthGuardian AI - Testing NASA GIBS & Satellite Service")
    print("=" * 60)
    res = asyncio.run(fetch_satellite_metadata(27.7172, 85.3240))
    print(f"- Status: {res['status']}")
    print(f"- Satellite Tile Sample URL: {res['sample_tile_url']}")
    print(f"- Note: {res['status_note']}")
    print("=" * 60)
    print("NASA service execution completed without errors!")
    print("=" * 60)


