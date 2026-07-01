# 09 · Feature store to a served model

The **data-engineering side of MLOps**: features → a versioned feature store → train/evaluate → register → serve →
monitor drift — with the **same feature definitions used for training and serving** (no train/serve skew).

```bash
pip install -r requirements.txt
python run.py
```

## What it does

1. **Build features** with one shared `compute_features()` and write a **feature store** (`out/features.parquet`).
2. **Train + evaluate** a churn classifier (accuracy + AUC).
3. **Register** the model (`out/model.joblib`) with its feature list.
4. **Serve** a prediction by reusing the *same* `compute_features()` — eliminating skew.
5. **Monitor drift** on a new (shifted) batch and flag features that breach a threshold → retrain trigger.

## Production mapping

- `compute_features()` → a real **feature store** (Feast/Tecton) serving identical features online & offline.
- `joblib` file → a **model registry** (MLflow); serve behind **FastAPI**.
- Drift metric → a monitoring job (Evidently / custom) that alerts and triggers **retraining**.
