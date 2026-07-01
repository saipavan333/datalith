# Capstone: feature store to served model

This is the capstone that ties the entire ML track into one system: from raw data to a monitored, served, self-retraining
model. We'll build a churn pipeline end to end — ingest, features (with a store), training (with tracking), a registry,
serving (batch + online), and the monitoring/retraining loop that keeps it alive.

@@diagram:capstone-ml

## The shape

```
ingest → feature pipeline + STORE → training pipeline (MLflow) → REGISTRY → serve (batch/online) → monitor → retrain
                          (offline+online)                       (Staging→Production)              (drift)     (loop)
```

Two **contracts** hold it together: the **feature store** (between training and serving) and the **registry** (between
training and deployment). The **monitoring loop** keeps it healthy.

## 1. Ingest — reliable training data

Your core DE skills: land clean, validated data in the lake (the api-to-lake / medallion capstones). The output is a
trustworthy `events` and `labels` source the rest of the pipeline reads.

## 2. Feature pipeline + store

Compute point-in-time-correct features and materialize them to the store (offline for training, online for serving):

```python
import polars as pl
# windowed, point-in-time features per user
features = (events.sort("ts")
    .rolling(index_column="ts", period="30d", by="user_id")
    .agg(pl.col("amount").sum().alias("spend_30d"),
         pl.len().alias("txns_30d")))
features.write_parquet("features/user_spend.parquet")
# register + materialize with Feast:  feast apply ; feast materialize-incremental $(date)
```

This single definition feeds **both** sides — no train/serve skew.

## 3. Training pipeline (reproducible + tracked)

```python
import mlflow
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from mlflow.models import infer_signature

def train():
    # pull HISTORICAL features point-in-time correct (no leakage)
    df = store.get_historical_features(
        entity_df=labels, features=["user_spend:spend_30d", "user_spend:txns_30d"]).to_df()
    X, y = df[FEATURE_COLS], df["churned"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    mlflow.set_experiment("churn")
    with mlflow.start_run():
        params = {"max_depth": 5, "n_estimators": 300, "learning_rate": 0.05}
        mlflow.log_params(params)
        model = GradientBoostingClassifier(**params, random_state=42).fit(Xtr, ytr)
        auc = roc_auc_score(yte, model.predict_proba(Xte)[:, 1])
        mlflow.log_metric("test_auc", auc)
        mlflow.sklearn.log_model(model, "model", signature=infer_signature(Xtr, ytr))
        return mlflow.active_run().info.run_id, auc
```

## 4. Register & promote (the deploy contract)

```python
from mlflow import MlflowClient
def register_and_promote(run_id, auc):
    if auc <= current_prod_auc():            # only register an improvement
        return
    v = mlflow.register_model(f"runs:/{run_id}/model", "churn_model").version
    # validate (shadow / A-B) ... then:
    MlflowClient().transition_model_version_stage(
        "churn_model", v, "Production", archive_existing_versions=True)
```

Serving now sees the new Production model with no redeploy.

## 5. Serve — batch and online

**Batch** scoring (a scheduled data pipeline):

```python
model = mlflow.pyfunc.load_model("models:/churn_model/Production")
feats = spark.read.format("delta").load("/lake/gold/customer_features")
scored = feats.withColumn("churn_score", predict_udf(*FEATURE_COLS))
scored.write.format("delta").mode("overwrite").save("/lake/gold/churn_scores")   # CRM reads this
```

**Online** scoring (a low-latency API), using the same online features:

```python
from fastapi import FastAPI
app = FastAPI()
model = mlflow.pyfunc.load_model("models:/churn_model/Production")

@app.post("/predict")
def predict(req: UserRequest):
    f = online_store.get_online_features(
        ["user_spend:spend_30d", "user_spend:txns_30d"], [{"user_id": req.user_id}]).to_dict()
    score = float(model.predict_proba([assemble(f)])[0, 1])
    log_prediction(req.user_id, f, score, MODEL_VERSION)     # for monitoring
    return {"churn_score": score}
```

## 6. Monitor — close the loop

```python
# drift: compare recent online features to the training reference
from evidently.report import Report
from evidently.metrics import DataDriftPreset
rep = Report(metrics=[DataDriftPreset()]); rep.run(reference_data=train_ref, current_data=last_24h)
drift = rep.as_dict()["metrics"][0]["result"]["share_of_drifted_columns"]

# performance: join delayed labels (did the user actually churn?) to logged predictions
perf = roc_auc_score(*join_delayed_labels(predictions))

if drift > 0.3 or perf < SLA:
    trigger(training_flow)               # CT: retrain when the model decays
```

## 7. Orchestrate it all

```python
from prefect import flow, task

@task(retries=2)
def features_task(): return build_and_materialize()
@task
def train_task():    return train()
@task
def register_task(run_id, auc): register_and_promote(run_id, auc)
@task
def score_task():    batch_score()
@task
def monitor_task():  return check_drift_and_perf()

@flow(name="churn-ml")
def churn_ml():
    features_task()
    run_id, auc = train_task()
    register_task(run_id, auc)
    score_task()
    if monitor_task().should_retrain:
        churn_ml()       # the loop: drift -> retrain -> re-serve

# deploy: training weekly; monitoring hourly; serving API always on
```

## 8. The seams (where systems break — and how this holds)

| Seam | Risk | Held by |
|---|---|---|
| training ↔ serving | train/serve skew | **feature store** (one definition) |
| training ↔ deployment | "which model is live?" | **registry** (Production stage) |
| deploy ↔ reality | silent decay | **monitoring + retraining** loop |
| any rerun | duplicated data | **idempotent** loads + keyed upserts |
| measuring truth | labels arrive late | **delayed-label join** pipeline |

## 9. What you've built

A production ML system that: ingests reliable data, serves consistent features to training and inference, trains
reproducibly with full tracking, versions and promotes models through a registry, serves predictions in batch and real
time, monitors for drift, and retrains itself when it decays. That is the data-engineering job in ML, end to end.

## 10. Practice

1. Why does pulling **historical** features for training need point-in-time correctness?
2. Show the registry call that promotes a better model to Production and archives the old one.
3. Sketch the online endpoint: fetch online features → score → log the prediction.
4. What two signals trigger retraining, and what pipeline measures real performance?

Build this with your own data — even a tiny version — and you've crossed from understanding ML to *operating* it. This
capstone, combined with the ten others, is the portfolio of a complete, modern data engineer.
