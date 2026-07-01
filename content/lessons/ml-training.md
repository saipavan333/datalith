# Training pipelines & experiment tracking — the complete guide

A model in a notebook isn't production ML. The data/ML engineer builds the **training pipeline** — reproducible,
orchestrated, tracked — around whatever model the data scientist chooses. This guide covers the pipeline stages,
reproducibility, MLflow experiment tracking, hyperparameter tuning, and automated retraining.

## 1. The pipeline

@@diagram:training-pipeline

```
pull features → split → train → evaluate → register (if it beats current)
```

It's a data pipeline whose output is a **model artifact**, so your orchestration skills (Airflow/Prefect/Dagster) apply
directly.

## 2. A complete training script

```python
import mlflow
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

# 1) pull features (point-in-time correct, from the feature store)
df = store.get_historical_features(entity_df=labels, features=FEATURES).to_df()
X, y = df[FEATURE_COLS], df["label"]

# 2) split — stratified, reproducible
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

mlflow.set_experiment("churn")
with mlflow.start_run():
    params = {"max_depth": 5, "n_estimators": 300, "learning_rate": 0.05}
    mlflow.log_params(params)                       # 3) train
    model = GradientBoostingClassifier(**params, random_state=42).fit(X_train, y_train)

    auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])   # 4) evaluate
    mlflow.log_metric("test_auc", auc)
    mlflow.sklearn.log_model(model, "model", signature=infer_signature(X_train, y_train))

    if auc > current_prod_auc():                    # 5) register if it's better
        mlflow.register_model(f"runs:/{mlflow.active_run().info.run_id}/model", "churn_model")
```

## 3. Reproducibility — the whole point

The same inputs must produce the same model. Version **all five**:

| Version | How |
|---|---|
| Data | dataset/feature-set snapshot or version id |
| Code | Git commit (logged by MLflow) |
| Config | hyperparameters (logged params) |
| Environment | pinned `requirements.txt` / Docker image / `conda.yaml` |
| Randomness | fixed seeds (`random_state=42`, framework seeds) |

If you can't reproduce a model, you can't debug or trust it.

## 4. Experiment tracking with MLflow

```python
mlflow.set_experiment("churn")
with mlflow.start_run(run_name="gbm-v3"):
    mlflow.log_params(params)
    mlflow.log_metrics({"train_auc": tr, "val_auc": va})
    mlflow.log_artifact("feature_importance.png")
    mlflow.set_tag("data_version", "2024-03-01")
# compare runs in the MLflow UI: which params gave the best val_auc?
```

Tracking records **params, metrics, artifacts, code version, and tags** for every run, so you can compare experiments
and know exactly how the production model was made.

## 5. Hyperparameter tuning

```python
from sklearn.model_selection import RandomizedSearchCV
search = RandomizedSearchCV(
    GradientBoostingClassifier(random_state=42),
    {"max_depth": [3, 5, 7], "n_estimators": [100, 300, 500], "learning_rate": [0.01, 0.05, 0.1]},
    n_iter=20, scoring="roc_auc", cv=3)
search.fit(X_train, y_train)
mlflow.log_params(search.best_params_)        # log the winner; pick by validation metric
```

Grid (exhaustive), random (sample), and Bayesian (Optuna/Hyperopt — model the search) all explore configs; the pipeline
selects the best by the validation metric.

## 6. Orchestrated, automated retraining

Wrap the script in your orchestrator so retraining is scheduled or triggered, not manual:

```python
from prefect import flow, task

@task(retries=2)
def get_data(): return store.get_historical_features(...).to_df()
@task
def train_and_eval(df): ...        # the steps above, returns (model, metrics)
@task
def maybe_register(model, metrics): ...

@flow(name="churn-training")
def training_pipeline():
    df = get_data(); model, metrics = train_and_eval(df); maybe_register(model, metrics)

# deploy on a weekly cron, or trigger from the MLOps drift monitor
```

## 7. Scenario — from notebook to pipeline

```
1. DS prototypes in a notebook, picks GradientBoosting + a feature set
2. DE lifts it into a parameterized script: pull features -> split -> train -> eval -> register
3. add MLflow tracking + signatures; pin the environment; fix seeds
4. orchestrate it (Prefect/Airflow) on a schedule with retries + alerting
5. now 'retrain from scratch' is one command, fully reproducible and tracked
```

## 8. Best practices

- Promote notebook code into a **version-controlled pipeline** early.
- Log **everything** to the tracker (params, metrics, artifacts, data version).
- Make **"retrain from scratch" a single command**.
- Only **register** a model that beats the incumbent on a held-out metric.

## 9. Practice

1. Log a run's params, test AUC, and model (with signature) to MLflow.
2. List the five things you must version for a reproducible model.
3. Add a RandomizedSearchCV over `max_depth` and `n_estimators`, logging the best params.
4. Wrap the training script in a Prefect flow scheduled weekly.

The model is the small part; the reproducible, tracked, orchestrated pipeline around it is the data engineer's
contribution — and what makes ML trustworthy in production.
