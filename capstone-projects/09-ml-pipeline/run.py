"""
Capstone 9 — Feature store to a served model (the DE side of MLOps).

Builds offline features -> a versioned "feature store" (Parquet) -> trains & evaluates a
model -> registers it (joblib) -> serves predictions from the SAME feature definitions
(no train/serve skew) -> monitors feature drift on a new batch.

Run:  pip install -r requirements.txt
      python run.py
Output: ./out/features.parquet, ./out/model.joblib, ./out/metrics.json
"""
from __future__ import annotations
import json
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score

OUT = Path(__file__).parent / "out"
FEATURES = OUT / "features.parquet"
MODEL = OUT / "model.joblib"
RNG = np.random.default_rng(42)
FEATURE_COLS = ["recency_days", "frequency", "monetary", "tenure_days"]


# ---- shared feature definitions: used for BOTH training and serving (no skew) ----
def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame({
        "recency_days": df["recency_days"],
        "frequency": df["frequency"],
        "monetary": df["monetary"].round(2),
        "tenure_days": df["tenure_days"],
    })
    return out[FEATURE_COLS]


def make_raw(n: int, drift: float = 0.0) -> pd.DataFrame:
    freq = RNG.poisson(5 + 4 * drift, n) + 1
    monetary = RNG.gamma(2.0, 50 * (1 + drift), n)
    recency = RNG.integers(0, 365, n)
    tenure = RNG.integers(30, 1500, n)
    # churn label: more recency + low frequency -> more likely to churn
    logit = 0.012 * recency - 0.25 * freq - 0.0008 * monetary + RNG.normal(0, 1, n)
    churn = (logit > np.quantile(logit, 0.7)).astype(int)
    return pd.DataFrame({"recency_days": recency, "frequency": freq,
                         "monetary": monetary, "tenure_days": tenure, "churn": churn})


def main():
    OUT.mkdir(exist_ok=True)

    print("1) BUILD features -> feature store (Parquet)")
    raw = make_raw(4000)
    feats = compute_features(raw)
    store = feats.copy(); store["churn"] = raw["churn"].values
    store.to_parquet(FEATURES, index=False)
    print(f"   {len(store)} rows, features={FEATURE_COLS} -> {FEATURES}")

    print("2) TRAIN + EVALUATE")
    X_train, X_test, y_train, y_test = train_test_split(
        store[FEATURE_COLS], store["churn"], test_size=0.25, random_state=0, stratify=store["churn"])
    model = RandomForestClassifier(n_estimators=120, random_state=0)
    model.fit(X_train, y_train)
    proba = model.predict_proba(X_test)[:, 1]
    metrics = {"accuracy": round(accuracy_score(y_test, proba > 0.5), 4),
               "auc": round(roc_auc_score(y_test, proba), 4)}
    print(f"   accuracy={metrics['accuracy']}  AUC={metrics['auc']}")
    (OUT / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print("3) REGISTER model")
    joblib.dump({"model": model, "feature_cols": FEATURE_COLS}, MODEL)
    print(f"   saved {MODEL}")

    print("4) SERVE a prediction (same feature definitions -> no train/serve skew)")
    bundle = joblib.load(MODEL)
    new_customer = pd.DataFrame([{"recency_days": 320, "frequency": 1, "monetary": 40.0, "tenure_days": 90}])
    x = compute_features(new_customer)[bundle["feature_cols"]]
    p = bundle["model"].predict_proba(x)[0, 1]
    print(f"   churn probability for sample customer: {p:.1%}")

    print("5) MONITOR feature drift (PSI-style) on a NEW batch")
    new_raw = make_raw(2000, drift=0.8)
    new_feats = compute_features(new_raw)
    drift = {}
    for c in FEATURE_COLS:
        a = feats[c].mean(); b = new_feats[c].mean()
        drift[c] = round(abs(b - a) / (abs(a) + 1e-9), 3)
    flagged = [c for c, v in drift.items() if v > 0.25]
    print(f"   mean-shift ratio: {drift}")
    print(f"   drift alert on: {flagged or 'none'}  (retrain trigger if non-empty)")

    print("\nDONE. Serve with FastAPI by loading out/model.joblib and reusing compute_features().")


if __name__ == "__main__":
    main()
