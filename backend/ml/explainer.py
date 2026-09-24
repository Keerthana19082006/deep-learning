import sys
from pathlib import Path

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

def explain_risk_level(hazard_type: str, risk_level: str, data: dict) -> dict:
    factors = []
    
    rf = data.get('rainfall_mm', 0)
    temp = data.get('temperature_c', 0)
    elev = data.get('elevation_m', 0)
    ndvi = data.get('ndvi', 0)
    ndwi = data.get('ndwi', 0)
    slope = data.get('slope_deg', 0)
    eq_mag = data.get('earthquake_magnitude', 0)
    eq_depth = data.get('earthquake_depth_km', 0)
    
    hazard_lower = hazard_type.lower()
    
    if hazard_lower == 'flood':
        if rf > 150:
            factors.append(f"Extreme heavy precipitation recorded ({rf:.1f} mm)")
        elif rf > 80:
            factors.append(f"Elevated rainfall volume ({rf:.1f} mm)")
            
        if ndwi > 0.3:
            factors.append(f"High Normalized Difference Water Index (NDWI: {ndwi:.2f}) indicating surface water saturation")
            
        if elev < 100:
            factors.append(f"Lowland topography (Elevation: {elev:.1f} m) vulnerable to water accumulation")
            
        if slope < 5:
            factors.append(f"Flat terrain (Slope: {slope:.1f}°) impeding surface drainage")

    elif hazard_lower == 'landslide':
        if slope > 30:
            factors.append(f"Steep incline terrain (Slope: {slope:.1f}°)")
        elif slope > 15:
            factors.append(f"Moderate slope incline (Slope: {slope:.1f}°)")
            
        if rf > 100:
            factors.append(f"Torrential rainfall triggering soil saturation ({rf:.1f} mm)")
        elif rf > 50:
            factors.append(f"Sustained rainfall soaking slope soil ({rf:.1f} mm)")
            
        if ndvi < 0.3:
            factors.append(f"Low vegetation cover (NDVI: {ndvi:.2f}) reducing soil cohesion")
            
        if elev > 500:
            factors.append(f"High altitude mountainous relief ({elev:.1f} m)")

    elif hazard_lower == 'earthquake':
        if eq_mag >= 6.0:
            factors.append(f"Major seismic magnitude recorded (M{eq_mag:.1f})")
        elif eq_mag >= 4.5:
            factors.append(f"Moderate seismic activity registered (M{eq_mag:.1f})")
            
        if eq_depth <= 20 and eq_mag > 0:
            factors.append(f"Shallow focal depth ({eq_depth:.1f} km) magnifying ground shaking intensity")
            
        factors.append("Active tectonic fault zone proximity")

    # General backup factor if few were triggered
    if not factors:
        if risk_level == 'HIGH':
            factors.append("Multiple compound environmental variables exceeding baseline risk thresholds")
        elif risk_level == 'MEDIUM':
            factors.append("Moderate environmental indicator variance detected")
        else:
            factors.append("All environmental and seismic parameters within normal safe baseline bounds")

    # Early warning trigger
    is_early_warning = (risk_level == 'HIGH')
    
    warning_details = None
    if is_early_warning:
        warning_details = {
            "title": f"HIGH RISK ALERT: {hazard_type.upper()}",
            "message": f"Critical environmental/seismic anomaly detected for {hazard_type}. Immediate precautionary measures advised.",
            "disclaimer": "DISCLAIMER: EarthGuardian AI is an experimental research tool for multi-hazard risk assessment and should not replace official government emergency alerts or evacuation directives."
        }
        
    return {
        "contributing_factors": factors,
        "early_warning": is_early_warning,
        "warning_details": warning_details
    }


if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 60)
    print("EarthGuardian AI - Testing Risk Explainer")
    print("=" * 60)
    test_flood = {
        'rainfall_mm': 195.0,
        'ndwi': 0.55,
        'elevation_m': 45.0,
        'slope_deg': 2.0
    }
    explanation = explain_risk_level('Flood', 'HIGH', test_flood)
    print("Flood Explanation:")
    print(f"- Early Warning: {explanation['early_warning']}")
    print(f"- Contributing Factors: {explanation['contributing_factors']}")
    print("=" * 60)
    print("Explainer execution completed successfully without errors!")
    print("=" * 60)

