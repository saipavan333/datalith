# Model registry & versioning — the complete guide

Once you train models regularly, you need a **system of record** for them — a model registry. It answers: which model
is in production, what version, trained on what data, with what metrics, and who approved it? This guide covers what a
registry stores, the promotion workflow (CI/CD for models), lineage, rollback, and how it decouples training from
serving.

@@diagram:training-pipeline

## 1. Why loose model files don't scale

Saving `model_v3_final_FINAL.pkl` to S3 falls apart fast: which one is live? what data made it? is it better than the
last? how do you roll back? A **registry** answers all of these and makes promotion a controlled, audited workflow.

## 2. What a registry stores

For every trained model:

- **Versions** — each registered model gets an incrementing version.
- **Stage** — `None → Staging → Production → Archived`.
- **Metrics** — the evaluation numbers it was registered with.
- **Artifact + signature** — the model file plus its expected input/output schema.
- **Lineage** — the training run, data/feature-set version, code (Git) commit, and hyperparameters.
- **Tags/approvals** — who promoted it and when.

## 3. Registering and promoting (MLflow)

```python
import mlflow
from mlflow import MlflowClient

# register a model produced by a training run
result = mlflow.register_model(f"runs:/{run_id}/model", "churn_model")   # -> version N

client = MlflowClient()
# promote N to Production and archive whatever was Production before
client.transition_model_version_stage(
    name="churn_model", version=result.version,
    stage="Production", archive_existing_versions=True)

# add lineage/approval metadata
client.set_model_version_tag("churn_model", result.version, "data_version", "2024-03-01")
client.set_model_version_tag("churn_model", result.version, "approved_by", "ada")
```

## 4. The promotion workflow — CI/CD for models

```
train run → register (version N, stage=None)
         → transition to STAGING
         → validate: offline metrics beat incumbent? + shadow / A-B test on real traffic?
         → approve → transition to PRODUCTION (archive the old one)
         → if it misbehaves → transition the previous version back to PRODUCTION (rollback)
```

This mirrors code CI/CD: nothing reaches Production without passing checks and an approval, and every step is recorded.

## 5. Serving loads "Production" — so promote/rollback is a metadata change

```python
# serving always loads whatever is marked Production — no hard-coded path, no redeploy
model = mlflow.pyfunc.load_model("models:/churn_model/Production")
```

Because serving references the **stage**, promoting a new version or rolling back to the previous one is a single
registry transition — the service picks it up without a deploy. That decouples **training** (produces models) from
**serving** (consumes the current Production model).

## 6. Lineage — trace any prediction back to its origin

```
prediction  →  model version N  →  training run  →  data/feature-set version + code commit + params
```

When a stakeholder (or an auditor) asks "why did the model decide this?", lineage lets you answer: *this exact model,
trained on this data, with this code.* Essential in regulated industries (finance, healthcare, insurance).

## 7. Rollback — the safety net

```python
# the new model is hurting metrics — revert instantly
client.transition_model_version_stage("churn_model", version=PREVIOUS_GOOD,
                                       stage="Production", archive_existing_versions=True)
# serving reloads the Production model; no redeploy, no panic
```

Keeping archived versions is what makes instant rollback possible — never delete a model that was ever in production.

## 8. Where the registry sits in the system

```
TRAINING pipeline  →  [registers model]  →  MODEL REGISTRY  →  [serving loads Production]  →  SERVING
                                              ↑ promote / rollback / audit (ops + governance)
```

It's the contract between the team that builds models and the system that runs them — and the control point for
governance, approvals, and rollback.

## 9. Scenario — a safe model update

```
1. weekly retraining registers churn_model v8 (Staging) with val_auc 0.86 (> prod 0.84)
2. shadow-run v8 alongside v7 for 3 days — predictions agree, no regressions
3. approve -> promote v8 to Production (v7 archived); serving picks it up automatically
4. monitoring shows live AUC holding -> done.  If it had dropped: re-point Production to v7 in one call.
```

## 10. Practice

1. Register a model and promote version N to Production (archiving the old).
2. A new model is hurting production — show the one-call rollback.
3. What lineage should each registry entry capture, and why does it matter for audits?
4. Why is loading `models:/churn_model/Production` better than a hard-coded file path in serving?

A registry turns "a folder of pickle files" into a governed, versioned, auditable system of record — with staged
promotion, full lineage, and instant rollback. It's the bridge between training and serving, and the backbone of
trustworthy ML operations.
