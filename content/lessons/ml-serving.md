# Model serving — the complete guide

A trained model is useless until it makes predictions on real data. There are two serving patterns — **batch** and
**online** — and the data engineer builds both. This guide covers each end to end, how to choose, loading from the
registry, avoiding skew, and scenarios.

## 1. Two patterns

@@diagram:model-serving

```
batch  : scheduled job → score a whole dataset → write a predictions table     (cheap, high-throughput)
online : low-latency API → fetch features → score ONE request → return         (real-time, per-request)
```

Both load the **current Production model** from the registry, not a hard-coded file.

## 2. Batch inference — just a data pipeline

The most common pattern: score on a schedule, write results to a table the business reads.

```python
import mlflow, pyspark.sql.functions as F

model = mlflow.pyfunc.load_model("models:/churn_model/Production")   # current prod model

features = spark.read.format("delta").load("/lake/gold/customer_features")
predict_udf = mlflow.pyfunc.spark_udf(spark, "models:/churn_model/Production")

scored = features.withColumn("churn_score", predict_udf(*FEATURE_COLS))
(scored.select("customer_id", "churn_score", F.current_date().alias("scored_date"))
   .write.format("delta").mode("overwrite").save("/lake/gold/churn_scores"))
# scheduled nightly via Airflow/Prefect — the CRM reads churn_scores
```

Batch is cheap, simple, and high-throughput. Use it whenever predictions don't need to be instant: churn scores, lead
scores, daily recommendations.

## 3. Online inference — a low-latency API

When the prediction depends on the **live request** (fraud at checkout, search ranking), wrap the model in a service:

```python
from fastapi import FastAPI
import mlflow
app = FastAPI()
model = mlflow.pyfunc.load_model("models:/fraud_model/Production")

@app.post("/predict")
def predict(req: TxnRequest):
    # fetch ONLINE features (same definitions as training — no skew)
    feats = online_store.get_online_features(
        features=["user_spend:spend_30d", "user_spend:txns_30d"],
        entity_rows=[{"user_id": req.user_id}]).to_dict()
    x = assemble_vector(req, feats)
    score = float(model.predict_proba([x])[0, 1])
    return {"fraud_score": score, "model_version": MODEL_VERSION}
```

Concerns: **latency** (p99 within budget), **throughput** (autoscale replicas), **availability**, and fetching **online
features** fast.

## 4. Choosing batch vs online

| Use batch when… | Use online when… |
|---|---|
| predictions can be precomputed | the prediction depends on the live request |
| latency doesn't matter | you need an answer in ms (fraud, ranking) |
| you score many rows at once | you score one entity on demand |
| examples: churn, lead scoring | examples: fraud, search, dynamic pricing |

Some systems do **both** (precompute a base score, adjust in real time). **Streaming** inference scores events as they
flow through a stream processor.

## 5. Avoiding train/serve skew at serving time

Two rules:

1. **Same features** — compute serving features with the *same definitions* as training (use the feature store).
2. **Same model** — load the registry's **Production** version, so promotions/rollbacks need no redeploy.

## 6. Tools

- **FastAPI** — a simple, fast Python API (great default for online).
- **BentoML / KServe / Seldon** — packaging + autoscaling + standardized model servers.
- **SageMaker / Vertex endpoints** — managed cloud serving.
- For batch: your orchestrator + Spark/Polars/DuckDB.

## 7. Scenario A — nightly churn scoring (batch)

```python
@flow(name="churn-scoring")
def score_churn():
    feats = spark.read.format("delta").load("/lake/gold/customer_features")
    preds = predict_udf_over(feats)                 # Production model from registry
    write_delta(preds, "/lake/gold/churn_scores")   # CRM reads this table
# schedule: 0 2 * * *
```

## 8. Scenario B — real-time fraud endpoint (online)

```
client → POST /predict {txn} → service:
   fetch online features (spend_30d, txns_30d) for the user (<5ms)
   model.predict_proba -> fraud_score
   return in ~30-50ms; log {request, features, score, model_version} for monitoring
```

Logging each prediction **with its features** is what the MLOps monitoring pipeline consumes later.

## 9. Practice

1. Write a nightly batch scoring job that reads features and writes a predictions table.
2. Sketch a FastAPI online endpoint that fetches online features and returns a score.
3. Fraud at checkout — batch or online, and why?
4. How does serving stay in sync with training features and the approved model?

Serving is where ML meets users. Batch scoring is a familiar data pipeline; online serving is a low-latency service —
build both, keep features consistent, and load the model from the registry so ops controls what's live.
