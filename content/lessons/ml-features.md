# Feature engineering & feature stores — the complete guide

Features are the inputs a model learns from, and engineering them well is where data engineers add the most ML value —
better features beat fancier models. This guide covers the transformations, the train/serve skew problem, and the
feature store that solves it (with point-in-time correctness), plus scenarios.

## 1. What a feature is

@@diagram:feature-store

A feature is one input column to a model — `amount`, `day_of_week`, `user_spend_30d`. Raw data is rarely usable as-is;
you **engineer** features from it.

## 2. The transformation toolkit

```python
import polars as pl

# numeric: scale / log / bin
df = df.with_columns([
    ((pl.col('amount') - mu) / sd).alias('amount_z'),
    pl.col('amount').log1p().alias('amount_log'),
])
# categorical: one-hot (low cardinality) or target/embedding encoding (high cardinality)
df = df.to_dummies(columns=['region'])
# datetime: extract signal
df = df.with_columns([
    pl.col('ts').dt.weekday().alias('dow'),
    pl.col('ts').dt.hour().alias('hour'),
    (pl.col('ts') - pl.col('last_seen')).dt.total_days().alias('days_since_last'),
])
```

**Windowed aggregations are the workhorse** of behavioral models — recent activity per entity:

```python
spend = (events.sort('ts')
   .rolling(index_column='ts', period='30d', by='user_id')
   .agg(pl.col('amount').sum().alias('spend_30d'),
        pl.len().alias('txns_30d')))
```

## 3. The train/serve skew problem

The single most common ML production bug: features computed **one way in training** (batch, historical) and **another
way in serving** (live code). The model then sees inputs that don't match what it learned, and silently degrades.

> Example: training computes `spend_30d` with a Spark job; the serving API recomputes it in Python with a slightly
> different window boundary. The numbers differ, predictions drift, and nobody notices until metrics drop.

## 4. The feature store

A feature store fixes skew by making you **define a feature once** and serving it to both training and inference:

- **Offline store** — historical feature values for **training**, with **point-in-time correctness**.
- **Online store** — the latest values in a fast KV store (Redis/DynamoDB) for **low-latency serving**.

```python
# Feast: define an entity and a feature view ONCE
from feast import Entity, FeatureView, Field, FileSource
from feast.types import Float32, Int64

user = Entity(name="user_id")
spend_fv = FeatureView(
    name="user_spend",
    entities=[user],
    schema=[Field(name="spend_30d", dtype=Float32),
            Field(name="txns_30d",  dtype=Int64)],
    source=FileSource(path="features/user_spend.parquet", timestamp_field="ts"),
)
```

```python
# TRAINING — point-in-time-correct historical features for labeled events
training_df = store.get_historical_features(
    entity_df=labels,                       # has user_id + event_timestamp + label
    features=["user_spend:spend_30d", "user_spend:txns_30d"],
).to_df()

# SERVING — the same features, latest values, low latency
feats = store.get_online_features(
    features=["user_spend:spend_30d", "user_spend:txns_30d"],
    entity_rows=[{"user_id": 42}],
).to_dict()
```

Because both sides use the **same definition**, training and serving features are identical — **no skew**.

## 5. Point-in-time correctness (avoiding leakage)

When you join features to a historical label, you must use the feature value **as of the label's timestamp** — not the
latest. Joining "today's" `spend_30d` to a label from six months ago leaks the future and inflates metrics. The feature
store's historical retrieval does this **point-in-time join** for you; doing it by hand means an as-of join keyed on
`(entity, timestamp)`.

## 6. Backfilling

When you add a new feature, you must compute its **historical** values so you can train on past labels — a **backfill**.
The feature store materializes the feature across history (and forward, on a schedule) so it's available for both
training and serving from day one.

## 7. Scenario A — a churn feature set

```python
# 1) build features as point-in-time-correct aggregations
features = build_user_features(events)        # spend_30d, txns_30d, tenure, days_since_last
features.write_parquet("features/user.parquet")
# 2) register them in the store; materialize to the online store
#    feast apply ; feast materialize-incremental $(date)
# 3) training pulls historical (point-in-time); serving pulls online (latest)
```

## 8. Scenario B — fixing a skew bug

```
symptom: offline AUC 0.86, production AUC ~0.71 the week after launch
cause:   serving recomputed 'spend_30d' with a calendar-month window; training used a rolling 30 days
fix:     define spend_30d ONCE in the feature store; both sides read it -> AUC recovers
```

## 9. Best practices

- **Reuse** features across models — the store's quiet superpower (define once, many models consume).
- Track each feature's **owner, freshness, and lineage**.
- Prefer **point-in-time** joins everywhere historical labels meet features.
- Keep online features **fresh** (materialize on a schedule) and **fast** (KV store).

## 10. Practice

1. Engineer a "transactions in the last 7 days per user" feature with a point-in-time window.
2. Explain train/serve skew and how a feature store eliminates it.
3. Why must training use the feature value *as of* the label's timestamp?
4. You added a new feature today. What must you do before training on it? (Backfill.)

Great features, served consistently to training and inference, are the highest-leverage thing a data engineer brings to
ML — and the feature store is the system that makes it reliable at scale.
