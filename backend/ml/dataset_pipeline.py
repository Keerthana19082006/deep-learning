import os
import sys
from pathlib import Path
from typing import Any
import pandas as pd
import numpy as np
from numpy.typing import NDArray
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import DATASET_PATH

FEATURE_COLS = [
    'rainfall_mm', 'temperature_c', 'elevation_m', 'ndvi', 'ndwi',
    'slope_deg', 'earthquake_magnitude', 'earthquake_depth_km',
    'latitude', 'longitude', 'day_of_year', 'month', 'season_code',
    'hazard_type_code'
]

TARGET_COL = 'hazard_label'

class DatasetPipeline:
    def __init__(self, filepath: str | None = None):
        self.filepath = filepath or DATASET_PATH
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder() # Target encoder
        self.hazard_type_encoder = LabelEncoder()
        self.is_fitted = False

    def load_data(self) -> pd.DataFrame:
        if not os.path.exists(self.filepath):
            raise FileNotFoundError(f"Dataset not found at {self.filepath}")
        df = pd.read_csv(self.filepath)
        return df

    def preprocess(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        df = df.copy()
        
        # 1. Missing values check & clean
        df = df.dropna(subset=[c for c in df.columns if c in ['latitude', 'longitude', TARGET_COL]])
        df = df.ffill().bfill() # Fill remaining numeric missing values if any
        
        # 2. Deduplication
        if is_training and 'id' in df.columns:
            df = df.drop_duplicates(subset=['id'])
        
        # 3. Date conversion & temporal features derivation
        if 'date' in df.columns:
            date_dt = pd.to_datetime(df['date'], errors='coerce')
            df['date_dt'] = date_dt
            dt_accessor: Any = date_dt.dt
            df['day_of_year'] = dt_accessor.dayofyear.fillna(180).astype(int)
            df['month'] = dt_accessor.month.fillna(6).astype(int)
            
            # Map season: 1: Winter, 2: Spring, 3: Monsoon/Summer, 4: Autumn
            def get_season(m):
                if m in [12, 1, 2]: return 1
                elif m in [3, 4, 5]: return 2
                elif m in [6, 7, 8, 9]: return 3
                else: return 4
            df['season_code'] = df['month'].apply(get_season)
        else:
            df['day_of_year'] = 180
            df['month'] = 6
            df['season_code'] = 3

        # 4. Encoding hazard_type
        if 'hazard_type' in df.columns:
            if is_training:
                self.hazard_type_encoder.fit(df['hazard_type'].astype(str))

            # Map classes to integer codes (handles unseen categories gracefully in inference)
            classes = getattr(self.hazard_type_encoder, 'classes_', np.array([]))
            class_to_code = {cls: idx for idx, cls in enumerate(classes)}
            df['hazard_type_code'] = df['hazard_type'].astype(str).map(lambda x: class_to_code.get(x, 0)).astype(int)
        else:
            df['hazard_type_code'] = 0
            
        # 5. Encoding target hazard_label (LOW -> 0, MEDIUM -> 1, HIGH -> 2)
        if TARGET_COL in df.columns and is_training:
            label_mapping = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2}
            df['target_encoded'] = df[TARGET_COL].map(lambda x: label_mapping.get(str(x), 0))
            
        return df

    def get_train_test_splits(self, test_size=0.2, val_size=0.1) -> tuple[NDArray[Any], NDArray[Any], NDArray[Any], NDArray[Any], NDArray[Any], NDArray[Any], dict[str, Any]]:
        raw_df = self.load_data()
        clean_df = self.preprocess(raw_df, is_training=True)
        
        X = clean_df[FEATURE_COLS]
        y = clean_df['target_encoded']
        
        # Outlier bounds report
        outliers_count = {}
        for col in ['rainfall_mm', 'temperature_c', 'slope_deg', 'earthquake_magnitude']:
            s = X[col]
            q1 = s.quantile(0.25)
            q3 = s.quantile(0.75)
            iqr = q3 - q1
            num_outliers = ((s < (q1 - 1.5 * iqr)) | (s > (q3 + 1.5 * iqr))).sum()
            outliers_count[col] = num_outliers

        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        val_ratio = val_size / (1.0 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=val_ratio, random_state=42, stratify=y_temp
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        X_test_scaled = self.scaler.transform(X_test)
        self.is_fitted = True

        stats = {
            "total_rows": len(clean_df),
            "train_size": len(X_train),
            "val_size": len(X_val),
            "test_size": len(X_test),
            "num_features": len(FEATURE_COLS),
            "feature_names": FEATURE_COLS,
            "outliers_detected": outliers_count,
            "hazard_type_counts": clean_df['hazard_type'].value_counts().to_dict(),
            "target_counts": clean_df['hazard_label'].value_counts().to_dict()
        }

        return (np.asarray(X_train_scaled), np.asarray(y_train), 
                np.asarray(X_val_scaled), np.asarray(y_val), 
                np.asarray(X_test_scaled), np.asarray(y_test), 
                stats)

    def transform_single(self, input_dict: dict[str, Any]) -> NDArray[Any]:
        if not self.is_fitted:
            self.get_train_test_splits()

        df = pd.DataFrame([input_dict])
        
        # Ensure default date if missing
        if 'date' not in df.columns or not df['date'].iloc[0]:
            df['date'] = pd.Timestamp.now().strftime('%Y-%m-%d')
            
        clean_df = self.preprocess(df, is_training=False)
        for col in FEATURE_COLS:
            if col not in clean_df.columns:
                clean_df[col] = 0.0

        X = clean_df[FEATURE_COLS]
        return np.asarray(self.scaler.transform(X))


if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 60)
    print("EarthGuardian AI - Testing Dataset Pipeline")
    print("=" * 60)
    pipeline = DatasetPipeline()
    X_train, y_train, X_val, y_val, X_test, y_test, stats = pipeline.get_train_test_splits()
    print("[OK] Dataset loaded and preprocessed successfully!")
    print(f"- Total Records: {stats['total_rows']}")
    print(f"- Train Shape: {X_train.shape}, Val Shape: {X_val.shape}, Test Shape: {X_test.shape}")
    print(f"- Number of Features: {stats['num_features']}")
    print(f"- Feature Columns: {stats['feature_names']}")
    print(f"- Hazard Distribution: {stats['hazard_type_counts']}")
    print(f"- Target Distribution: {stats['target_counts']}")
    print(f"- Outliers Detected: {stats['outliers_detected']}")
    
    # Test single transformation
    sample = {
        'rainfall_mm': 120.0,
        'temperature_c': 24.5,
        'elevation_m': 350.0,
        'ndvi': 0.45,
        'ndwi': 0.20,
        'slope_deg': 12.0,
        'earthquake_magnitude': 0.0,
        'earthquake_depth_km': 10.0,
        'latitude': 28.5,
        'longitude': 84.0,
        'hazard_type': 'Flood'
    }
    x_transformed = pipeline.transform_single(sample)
    print(f"- Sample Single Transformation Vector Shape: {x_transformed.shape}")
    print("=" * 60)
    print("Dataset pipeline execution completed successfully without errors!")
    print("=" * 60)


