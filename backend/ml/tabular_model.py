import os
import sys
from pathlib import Path
from typing import Any, cast
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import MODEL_DIR

LABEL_MAP = {0: 'LOW', 1: 'MEDIUM', 2: 'HIGH'}

class TabularModelManager:
    def __init__(self):
        self.rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        self.gb_model = GradientBoostingClassifier(n_estimators=80, max_depth=4, random_state=42)
        self.is_trained = False
        self.feature_importances_ = None

    def fit(self, X_train: np.ndarray, y_train: np.ndarray):
        self.rf_model.fit(X_train, y_train)
        self.gb_model.fit(X_train, y_train)
        self.is_trained = True
        self.feature_importances_ = self.rf_model.feature_importances_
        self.save()

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_trained:
            self.load()
        proba_rf = cast(np.ndarray, self.rf_model.predict_proba(X))
        proba_gb = cast(np.ndarray, self.gb_model.predict_proba(X))
        # Ensemble average
        return 0.6 * proba_rf + 0.4 * proba_gb

    def predict(self, X: np.ndarray) -> np.ndarray:
        probas = self.predict_proba(X)
        return np.argmax(probas, axis=1)

    def save(self, model_dir: str = MODEL_DIR):
        os.makedirs(model_dir, exist_ok=True)
        joblib.dump(self.rf_model, os.path.join(model_dir, "rf_model.joblib"))
        joblib.dump(self.gb_model, os.path.join(model_dir, "gb_model.joblib"))

    def load(self, model_dir: str = MODEL_DIR) -> bool:
        rf_path = os.path.join(model_dir, "rf_model.joblib")
        gb_path = os.path.join(model_dir, "gb_model.joblib")
        if os.path.exists(rf_path) and os.path.exists(gb_path):
            self.rf_model = joblib.load(rf_path)
            self.gb_model = joblib.load(gb_path)
            self.is_trained = True
            self.feature_importances_ = self.rf_model.feature_importances_
            return True
        return False


if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 60)
    print("EarthGuardian AI - Testing Tabular Ensemble Model")
    print("=" * 60)
    from backend.ml.dataset_pipeline import DatasetPipeline
    
    pipeline = DatasetPipeline()
    X_train, y_train, X_val, y_val, X_test, y_test, stats = pipeline.get_train_test_splits()
    
    manager = TabularModelManager()
    print("[1] Training Random Forest & Gradient Boosting ensemble...")
    manager.fit(X_train, y_train)
    
    preds = manager.predict(X_test)
    probas = manager.predict_proba(X_test)
    acc = np.mean(preds == y_test)
    
    print(f"[2] Tabular Model Test Accuracy: {acc * 100:.2f}%")
    print(f"[3] Predictions shape: {preds.shape}, Probas shape: {probas.shape}")
    print("=" * 60)
    print("Tabular model execution completed successfully without errors!")
    print("=" * 60)

