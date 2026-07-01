# MLOps: CI/CD, monitoring & drift — the complete guide

Models decay — the world changes, so an accurate model slowly becomes wrong. MLOps is the discipline that keeps
production models healthy, applying DevOps + DataOps to ML. This guide covers CI/CD/CT, the kinds of drift, monitoring
(including the delayed-label problem), retraining triggers, and the data engineer's role.

## 1. The loop

@@diagram:mlops-loop

```
monitor (drift + performance) → detect decay → retrain (CT) → validate → promote → serve → back to monitor
```

The loop never stops, because decay never stops.

## 2. CI / CD / CT

ML extends CI/CD with **Continuous Training**:

- **CI** — test code *and* data (schema, ranges, null rates) and validate the training pipeline runs end to end.
- **CD** — deploy the model automatically: register → promote → serve (no manual steps).
- **CT** — **retrain** on new data, a schedule, or a trigger, then re-validate and promote.

```yaml
# .github/workflows/ml-ci.yml — runs on PRs to the ML repo
steps:
  - run: pytest                          # unit tests on feature/training code
  - run: python validate_data.py         # schema + range checks on the training data
  - run: python smoke_train.py --rows 10000   # the training pipeline actually runs
```

## 3. The kinds of drift

| Drift | What changed | Example | Detect with |
|---|---|---|---|
| **Data / feature drift** | input distribution | new user mix; an upstream pipeline changed units | PSI, KS test vs training reference |
| **Concept drift** | input→target relationship | fraud tactics evolve | performance drop once labels arrive |
| **Prediction drift** | output distribution | predicted-positive rate jumps | monitor score distribution |

## 4. Monitoring (more than service health)

You monitor three layers:

```python
# 1) log every prediction with its features + model version (a data pipeline)
log_prediction(request_id, features, score, model_version, ts)

# 2) feature/data drift — compare recent inputs to the training reference
from evidently.report import Report
from evidently.metrics import DataDriftPreset
report = Report(metrics=[DataDriftPreset()])
report.run(reference_data=train_ref, current_data=last_24h)
if report.as_dict()["metrics"][0]["result"]["share_of_drifted_columns"] > 0.3:
    alert("feature drift"); maybe_retrain()

# 3) performance — measured LATER, when ground-truth labels arrive
labeled = join_labels_when_available(predictions, ground_truth)   # often days late
auc_now = roc_auc_score(labeled.y_true, labeled.score)
```

> **The delayed-label problem:** you can monitor *predictions* instantly, but real *accuracy* needs ground truth, which
> often arrives much later (was that flagged transaction actually fraud? you find out days later). Build the pipeline
> that joins delayed labels back to logged predictions — without it, you're blind to real performance.

## 5. Retraining triggers

```python
def should_retrain():
    return (schedule_due()                 # e.g. weekly
            or drift_score() > THRESHOLD   # feature/concept drift detected
            or recent_auc() < SLA)         # measured performance dropped
```

When triggered, CT runs the training pipeline, validates the new model (offline + shadow/A-B), and promotes it — closing
the loop.

## 6. Validation before promotion

Never auto-promote on offline metrics alone:

- **Offline** — does it beat the incumbent on a held-out set?
- **Shadow** — run it alongside prod, comparing predictions without serving them.
- **A/B / canary** — serve to a slice of traffic, compare real outcomes, then ramp.

## 7. The data engineer's role

MLOps is mostly **data pipelines**:

- the **prediction logging** pipeline (predictions + features + versions),
- the **label-join** pipeline (attach ground truth when it lands),
- the **drift-computation** pipeline (PSI/KS vs reference) + alerting,
- the **retraining** automation (your orchestrator),
- and the **registry/promotion** plumbing.

Tools: **MLflow** (tracking/registry), **Evidently / WhyLabs / Arize** (drift + monitoring), and your orchestrator
(Airflow/Prefect/Dagster).

## 8. Scenario — a model quietly decays

```
week 0: deploy churn model, AUC 0.85
week 6: feature drift alert — 'avg_session_len' distribution shifted (app released a new UI)
        prediction-positive rate also rising
        CT triggers: retrain on recent data -> AUC 0.84 on fresh holdout
        shadow test for 3 days -> promote to Production -> alerts clear
```

## 9. Practice

1. Name two kinds of drift and how you'd detect each.
2. Why is production accuracy usually measured with a delay, and what pipeline makes it possible?
3. List three retraining triggers.
4. Why log predictions *with* their features and the model version?

Models aren't shipped once — they're **operated**. The monitoring, drift detection, label-join, and retraining
pipelines that keep them healthy are data-engineering work, which is why MLOps lands squarely on your plate.
