# Machine Learning for Data Engineers — quick reference

**ML in production is mostly data engineering.** The model is the easy 10%; the data plumbing is the hard 90%.

## The DE's role

Reliable ingestion + labels · feature pipelines + feature store · point-in-time-correct training data · serving infra (batch/online) · MLOps (monitoring, retraining). DE owns the data + pipelines; DS owns the model. Most ML failures are data/pipeline problems.

## ML fundamentals

- **Supervised** (labeled X→y): **classification** (category) · **regression** (number) — the bulk of industry ML, needs labels.
- **Unsupervised** (unlabeled): clustering · dimensionality reduction.
- **Reinforcement**: agent learns by reward.
- Workflow: data → **EDA** → preprocess → features → train → evaluate → deploy → monitor.

## EDA (profile before you model)

Check: **shape & types · missing values · distributions · outliers · correlations · target balance.** Tools: pandas + seaborn; ydata-profiling; **DuckDB/Spark aggregates at scale**. Catches dropped rows, null columns, mis-typed fields, leaky/redundant features, class imbalance.

## Preprocessing

- **Impute** missing (median/mode) · **encode** categoricals (one-hot low-card, target/freq high-card, ordinal) · **scale** numerics (standardize/min-max).
- Scaling needed for **linear/distance/gradient** models, **NOT** trees.
- **Cardinal rule:** fit transformers on **TRAIN only** → apply to test + serving (prevents leakage AND train/serve skew). Use a `Pipeline`.

## Algorithms (by problem)

- Regression → linear · **gradient boosting** · neural net.
- Classification → logistic · tree · random forest · **XGBoost/LightGBM** · neural net.
- Clustering → k-means · DBSCAN.
- **Tabular → gradient boosting** (workhorse) · **images/text/huge → deep learning** (GPUs). Trees need no scaling.

## Evaluation

- Split **train / val / test** (tune on val, test once); k-fold CV; **time-split** for time-series.
- Classification: **accuracy lies on imbalance** → precision · recall · F1 · ROC/PR-AUC (confusion matrix).
- Regression: RMSE · MAE · R².
- **Overfit** = train high, val low (variance); **underfit** = both low (bias).
- Production monitoring = these metrics on live predictions vs delayed labels.

## Data for ML

- **Leakage** = future/unavailable info in training → great offline, fails in prod. Prevent: point-in-time features, **time-based splits** (not random for time-series), fit transformers on train only.
- **Splits** = train / validation / test; mimic production (past → future).
- **Labels** = often delayed, expensive, noisy → a reliable label pipeline is core DE work.

## Feature store (the key concept)

- One **feature definition** → materialized to **offline** (training, historical, point-in-time) AND **online** (serving, low-latency).
- Prevents **train/serve skew** (the #1 ML-in-prod failure).
- **Point-in-time correctness** = features reflect only what was known at the event time (as-of joins).

## Training

- **Reproducible**: versioned data + code + pinned env + seeds.
- **Experiment tracking** (MLflow) → params, metrics, data/code version, artifact → compare + reproduce.

## Model registry

Versioned models + **stages** (Staging → Production → Archived) + lineage. Serving loads the **Production** model → promotion/rollback is a metadata change, not a redeploy. The contract between training and deployment.

## Serving

| | Batch | Online |
|---|---|---|
| When | precompute on schedule | on-demand API |
| Pros | simple, cheap, high-throughput | fresh, any input |
| Cons | stale, known entities only | needs infra + low-latency features |

**Log predictions** (features + version + id) → join delayed labels later to measure real performance.

## MLOps

- Version & test **data + models** (not just code).
- **Drift**: data drift (input shifts) / concept drift (relationship shifts) → monitor distributions + live performance.
- **Continuous training**: drift/decay → retrain → register → validate → promote (the loop).

## Vectors & RAG

Embeddings (semantic vectors) → **vector DB** → **ANN** search (HNSW/IVF) → semantic search / recommendations / **RAG** (retrieve relevant chunks to ground an LLM). DE builds the chunk→embed→index→retrieve pipeline.

## The five seams (interview gold)

| Seam | Risk | Held by |
|---|---|---|
| training ↔ serving | skew | feature store |
| training ↔ deployment | "which model is live?" | registry |
| deploy ↔ reality | silent decay | monitoring + retraining |
| any rerun | duplication | idempotent loads |
| measuring truth | late labels | delayed-label join |

## Interview triggers

- *ML is 90% data engineering* → data/pipeline failures dominate.
- *leakage* → point-in-time + time-based splits.
- *feature store* → one definition → no train/serve skew.
- *registry* → which model is live + rollback.
- *batch vs online inference* → stale-but-cheap vs fresh-but-infra.
- *drift* → monitor + retrain loop.
- *RAG/ANN* → embed → vector DB → retrieve.
