import sys
from pathlib import Path
import sqlite3
import json
from datetime import datetime

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import DB_PATH

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Table for predictions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            hazard_type TEXT NOT NULL,
            rainfall_mm REAL NOT NULL,
            temperature_c REAL NOT NULL,
            elevation_m REAL NOT NULL,
            ndvi REAL NOT NULL,
            ndwi REAL NOT NULL,
            slope_deg REAL NOT NULL,
            earthquake_magnitude REAL NOT NULL,
            earthquake_depth_km REAL NOT NULL,
            risk_level TEXT NOT NULL,
            probability REAL NOT NULL,
            contributing_factors TEXT NOT NULL,
            model_type TEXT NOT NULL
        );
    """)
    
    # Table for model training runs & metrics
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trained_at TEXT NOT NULL,
            model_type TEXT NOT NULL,
            accuracy REAL NOT NULL,
            precision REAL NOT NULL,
            recall REAL NOT NULL,
            f1_score REAL NOT NULL,
            roc_auc REAL,
            confusion_matrix TEXT NOT NULL,
            loss_history TEXT
        );
    """)
    
    conn.commit()
    conn.close()

# Auto initialize database on module import
init_db()


def save_prediction(data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO predictions (
            timestamp, latitude, longitude, hazard_type,
            rainfall_mm, temperature_c, elevation_m, ndvi, ndwi, slope_deg,
            earthquake_magnitude, earthquake_depth_km,
            risk_level, probability, contributing_factors, model_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now().isoformat(),
        data['latitude'],
        data['longitude'],
        data['hazard_type'],
        data['rainfall_mm'],
        data['temperature_c'],
        data['elevation_m'],
        data['ndvi'],
        data['ndwi'],
        data['slope_deg'],
        data['earthquake_magnitude'],
        data['earthquake_depth_km'],
        data['risk_level'],
        data['probability'],
        json.dumps(data['contributing_factors']),
        data.get('model_type', 'Hybrid Tabular-PyTorch')
    ))
    
    conn.commit()
    conn.close()

def get_prediction_history(limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    res = []
    for r in rows:
        item = dict(r)
        try:
            item['contributing_factors'] = json.loads(item['contributing_factors'])
        except Exception:
            item['contributing_factors'] = []
        res.append(item)
    return res

def save_model_run(run_data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO model_runs (
            trained_at, model_type, accuracy, precision, recall, f1_score, roc_auc, confusion_matrix, loss_history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now().isoformat(),
        run_data['model_type'],
        run_data['accuracy'],
        run_data['precision'],
        run_data['recall'],
        run_data['f1_score'],
        run_data.get('roc_auc', 0.0),
        json.dumps(run_data['confusion_matrix']),
        json.dumps(run_data.get('loss_history', {}))
    ))
    conn.commit()
    conn.close()

def get_latest_model_run():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM model_runs ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    res = dict(row)
    res['confusion_matrix'] = json.loads(res['confusion_matrix'])
    res['loss_history'] = json.loads(res['loss_history']) if res.get('loss_history') else {}
    return res


if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 60)
    print("EarthGuardian AI - Testing Database")
    print("=" * 60)
    init_db()
    history = get_prediction_history(limit=5)
    latest_run = get_latest_model_run()
    print(f"- SQLite DB initialized at: {DB_PATH}")
    print(f"- Total sample predictions logged: {len(history)}")
    print(f"- Latest Model Run Saved: {latest_run is not None}")
    print("=" * 60)
    print("Database execution completed successfully without errors!")
    print("=" * 60)

