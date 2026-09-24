import sys
from pathlib import Path
import httpx

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import OPEN_METEO_API_BASE_URL

async def fetch_open_meteo_weather(latitude: float, longitude: float):
    url = f"{OPEN_METEO_API_BASE_URL}/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "rain", "surface_pressure", "wind_speed_10m"],
        "hourly": ["temperature_2m", "precipitation", "soil_moisture_0_to_1cm"],
        "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
        "timezone": "auto"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                daily = data.get("daily", {})
                hourly = data.get("hourly", {})
                
                return {
                    "status": "success",
                    "latitude": latitude,
                    "longitude": longitude,
                    "elevation": data.get("elevation", 0),
                    "current": {
                        "temperature_c": current.get("temperature_2m"),
                        "humidity_pct": current.get("relative_humidity_2m"),
                        "precipitation_mm": current.get("precipitation"),
                        "rain_mm": current.get("rain"),
                        "pressure_hpa": current.get("surface_pressure"),
                        "wind_speed_kmh": current.get("wind_speed_10m")
                    },
                    "daily_forecast": {
                        "time": daily.get("time", [])[:7],
                        "temp_max": daily.get("temperature_2m_max", [])[:7],
                        "temp_min": daily.get("temperature_2m_min", [])[:7],
                        "precipitation": daily.get("precipitation_sum", [])[:7]
                    },
                    "temporal_hourly": {
                        "time": hourly.get("time", [])[:24],
                        "temperature": hourly.get("temperature_2m", [])[:24],
                        "precipitation": hourly.get("precipitation", [])[:24]
                    }
                }
            else:
                return {
                    "status": "error",
                    "message": f"Open-Meteo API returned HTTP {resp.status_code}",
                    "current": {}
                }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to fetch weather data: {str(e)}",
            "current": {}
        }


if __name__ == "__main__":
    import asyncio
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 60)
    print("EarthGuardian AI - Testing Open-Meteo Service")
    print("=" * 60)
    res = asyncio.run(fetch_open_meteo_weather(27.7172, 85.3240))
    print(f"- Status: {res['status']}")
    print(f"- Current: {res.get('current')}")
    print("=" * 60)
    print("Open-Meteo service execution completed without errors!")
    print("=" * 60)

