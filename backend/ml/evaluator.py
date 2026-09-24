import sys
from pathlib import Path
import numpy as np
from typing import Any, cast
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    confusion_matrix, roc_auc_score
)

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

def evaluate_model_performance(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray | None = None):
    acc = float(accuracy_score(y_true, y_pred))
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted', zero_division=cast(Any, 0))
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2]).tolist()
    
    roc_auc = 0.0
    if y_proba is not None:
        try:
            roc_auc = float(roc_auc_score(y_true, y_proba, multi_class='ovr'))
        except Exception:
            roc_auc = 0.0
            
    return {
        'accuracy': round(acc, 4),
        'precision': round(float(precision), 4),
        'recall': round(float(recall), 4),
        'f1_score': round(float(f1), 4),
        'roc_auc': round(roc_auc, 4),
        'confusion_matrix': cm
    }


if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 60)
    print("EarthGuardian AI - Testing Evaluator Metrics")
    print("=" * 60)
    y_true = np.array([0, 1, 2, 1, 0, 2, 2, 1, 0, 1])
    y_pred = np.array([0, 1, 2, 1, 0, 1, 2, 1, 0, 1])
    y_proba = np.array([
        [0.9, 0.05, 0.05],
        [0.1, 0.8, 0.1],
        [0.05, 0.1, 0.85],
        [0.2, 0.7, 0.1],
        [0.85, 0.1, 0.05],
        [0.1, 0.6, 0.3],
        [0.1, 0.2, 0.7],
        [0.05, 0.9, 0.05],
        [0.95, 0.03, 0.02],
        [0.15, 0.75, 0.1]
    ])
    metrics = evaluate_model_performance(y_true, y_pred, y_proba)
    for k, v in metrics.items():
        print(f"- {k}: {v}")
    print("=" * 60)
    print("Evaluator execution completed successfully without errors!")
    print("=" * 60)

