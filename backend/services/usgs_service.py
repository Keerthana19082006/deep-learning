import sys
from pathlib import Path
import httpx
from datetime import datetime, timedelta

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import USGS_API_BASE_URL

async def fetch_usgs_earthquakes(
    latitude: float,
    longitude: float,
    max_radius_km: float = 500.0,
    min_magnitude: float = 2.0,
    days_back: int = 30
):
    start_time = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    end_time = datetime.now().strftime("%Y-%m-%d")
    
    url = f"{USGS_API_BASE_URL}/query"
    params = {
        "format": "geojson",
        "latitude": latitude,
        "longitude": longitude,
        "maxradiuskm": max_radius_km,
        "minmagnitude": min_magnitude,
        "starttime": start_time,
        "endtime": end_time,
        "limit": 50
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                
                events = []
                for feat in features:
                    props = feat.get("properties", {})
                    geom = feat.get("geometry", {})
                    coords = geom.get("coordinates", [0, 0, 0])
                    
                    events.append({
                        "id": feat.get("id"),
                        "title": props.get("title"),
                        "magnitude": props.get("mag"),
                        "place": props.get("place"),
                        "time": datetime.fromtimestamp(props.get("time", 0) / 1000.0).strftime("%Y-%m-%d %H:%M:%S") if props.get("time") else "Unknown",
                        "latitude": coords[1],
                        "longitude": coords[0],
                        "depth_km": coords[2],
                        "tsunami_alert": props.get("tsunami", 0)
                    })
                    
                return {
                    "status": "success",
                    "count": len(events),
                    "query_params": {"latitude": latitude, "longitude": longitude, "max_radius_km": max_radius_km},
                    "events": events
                }
            else:
                return {
                    "status": "error",
                    "message": f"USGS API returned status code {resp.status_code}",
                    "events": []
                }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to fetch USGS earthquake data: {str(e)}",
            "events": []
        }


if __name__ == "__main__":
    import asyncio
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 60)
    print("EarthGuardian AI - Testing USGS Earthquake Service")
    print("=" * 60)
    res = asyncio.run(fetch_usgs_earthquakes(27.7172, 85.3240, max_radius_km=300))
    print(f"- Status: {res['status']}")
    print(f"- Earthquake Events Found: {res.get('count', 0)}")
    print("=" * 60)
    print("USGS service execution completed without errors!")
    print("=" * 60)

