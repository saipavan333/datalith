# Machine learning on Databricks — hands-on

The full lifecycle on the lakehouse: features, MLflow, the registry, and serving.

@@diagram:dbx-ml

## 1. Track experiments with MLflow

```python
import mlflow
mlflow.set_registry_uri("databricks-uc")              # registry in Unity Catalog
with mlflow.start_run():
    mlflow.log_param("max_depth", 8)
    mlflow.log_metric("auc", 0.93)
    mlflow.sklearn.log_model(model, "model",
        registered_model_name="main.ml.churn")        # log + register in one call
```

Every run's **params, metrics, and artifacts** are recorded, so you can compare and reproduce.

## 2. The Model Registry (Unity Catalog)

Models are versioned objects in **Unity Catalog**: promote versions with **aliases** (`champion`, `challenger`), governed by the same access/lineage as your data.

```python
from mlflow import MlflowClient
MlflowClient().set_registered_model_alias("main.ml.churn", "champion", version=3)
```

## 3. Feature Store — no train/serve skew

Define features once; the **Feature Store** serves the **same logic** at training and inference (with point-in-time lookups), so production features match what the model trained on.

```python
from databricks.feature_engineering import FeatureEngineeringClient
fe = FeatureEngineeringClient()
training_set = fe.create_training_set(df, feature_lookups=[...], label="churned")
```

## 4. AutoML & Mosaic AI

- **AutoML**: fast baseline models + a generated notebook to iterate from.
- **Mosaic AI**: **Model Serving** (real-time/batch endpoints, autoscaling), **GenAI** (foundation-model APIs, fine-tuning), **Vector Search**, and an **agent framework**.

## 5. Serve it

```python
# deploy the champion as a real-time endpoint (Mosaic AI Model Serving),
# or score in batch as a Spark job; features are read from the Feature Store at inference
```

## 6. Why on the lakehouse

Train **next to the data** — no copies to a separate ML platform. Data, **features, models, and serving** all live under **Unity Catalog**, so governance, lineage, and versioning are consistent end to end.

## Scenario — a governed churn model

Features are engineered once in the **Feature Store**. Training logs runs to **MLflow** (compare AUC across runs); the best model is **registered** in Unity Catalog as `main.ml.churn` and aliased **champion**. **Mosaic AI Model Serving** exposes it as a real-time endpoint that reads the **same** Feature Store features at inference (no skew). Unity Catalog governs who can read the data, features, and model and tracks lineage from raw tables to predictions. When a **challenger** beats the champion in offline metrics, you flip the alias to promote it. One platform, features → training → serving, beside governed data.

## Practice

1. Log a model with MLflow (params, metric, artifact) and register it in Unity Catalog.
2. Explain champion/challenger aliases and how you'd promote a new version.
3. Explain how the Feature Store prevents train/serve skew.
4. Outline serving options (real-time endpoint vs batch) and when to use each.
