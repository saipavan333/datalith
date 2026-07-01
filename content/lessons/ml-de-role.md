# Where data engineering meets ML — the complete guide

Production machine learning is mostly data engineering. The model is a small box in a large system; everything that
feeds and surrounds it — reliable data, features, serving, monitoring — is the data engineer's job. This guide maps the
ML lifecycle, who owns what, why models fail in production, and how to think about ML as a data product.

@@diagram:ml-lifecycle

## 1. The ML lifecycle

```
collect → engineer features → train → evaluate → deploy → monitor → retrain → (loop)
```

| Stage | What happens | Mostly owned by |
|---|---|---|
| **Collect** | pipelines land clean, reliable training data | **data engineer** |
| **Feature engineering** | turn raw data into model inputs; serve them consistently | **data engineer** |
| **Train** | fit a model on features | data scientist |
| **Evaluate** | metrics decide if it's good enough | data scientist |
| **Deploy** | serve predictions (batch or online) | **DE / ML engineer** |
| **Monitor** | watch drift, performance, pipeline health | **data engineer** |
| **Retrain** | refresh the model when it decays | **data engineer** |

The model itself — the algorithm — is one stage. The other six are data and systems work.

## 2. Who owns what

- **Data scientists** explore data, frame the problem, and choose models/algorithms. They optimize a metric on a
  dataset.
- **Data / ML engineers** own the **data and the system**: ingestion pipelines, the feature store, training pipelines,
  serving infrastructure, CI/CD, and monitoring. They make the model **work reliably in production**.

The boundary varies by team, but the rule of thumb holds: *"ML is 80% data engineering."* The model is the easy 20%;
the reliable data and systems around it are the hard, valuable 80% — which is exactly your skill set.

## 3. Why models fail in production

It's almost never the algorithm. Production ML breaks on **data and systems**:

| Failure | Cause | Prevented by |
|---|---|---|
| Looked great offline, bad in prod | **data leakage** inflated offline metrics | split first, fit on train only (next lesson) |
| Accuracy drops right after launch | **train/serve skew** — features computed differently | a feature store (define once) |
| Slowly gets worse | **data/concept drift** — the world changed | monitoring + retraining (MLOps) |
| Sudden breakage | a **broken upstream pipeline** | data tests + observability |
| Stale predictions | **late/missing features** | freshness SLAs on the feature pipelines |

Notice every fix is a data-engineering practice you already know.

## 4. ML as a data product

The mindset that makes you valuable: treat the model and its data flows as a **product**, not a one-off experiment.
That means:

- **SLAs** on data freshness and serving latency.
- **Versioning** of data, features, and models (reproducibility).
- **Monitoring + on-call** for drift and pipeline failures.
- **CI/CD** so changes are tested and deployed safely.

A model in a notebook is a science project; a model with reliable pipelines, a feature store, a registry, serving, and
monitoring is a product — and building that product is data engineering.

## 5. The handoff with data science

A healthy collaboration:

```
DS:  here's a model + the features it needs + the metric it optimizes
DE:  I'll productionize it — build the feature pipelines + store, a reproducible
     training pipeline, serving (batch/online), CI/CD, and monitoring/retraining
together: agree on a data contract for features and a definition of "good enough"
```

The DE turns a promising notebook into a system that runs every day, retrains itself, and is observable when it breaks.

## 6. Where this track goes

The rest of this track is the DE side of ML, in order:

- **ml-data** — get the data right (splits, leakage, labels).
- **ml-features** — engineer features and serve them with a feature store.
- **ml-training** — reproducible, tracked training pipelines.
- **ml-registry** — version and promote models.
- **ml-serving** — batch and online inference.
- **ml-mlops** — CI/CD/CT, monitoring, drift.
- **ml-vectors** — embeddings, vector databases, and RAG (where DE meets GenAI).

Then the **ML capstone** ties them into one feature-store-to-served-model pipeline.

## 7. Practice

1. List the seven stages of the ML lifecycle and which the data engineer typically owns.
2. Give three *data* reasons a model that aced offline metrics fails in production.
3. What does "treat ML as a data product" mean concretely?
4. Describe the typical DS↔DE handoff for productionizing a model.

Internalize this: on an ML team, the person who makes the data trustworthy and the pipelines reliable is the one who
makes the product work — and that person is the data engineer. The rest of this track gives you those skills.
