# Model evaluation & metrics — deep dive

You can't build an evaluation pipeline — or the production monitoring that watches a model for decay — without understanding how a model is *judged*. This is the metrics-and-validation layer that the data engineer operationalizes: computing the right metric, on the right split, on live predictions versus delayed labels.

@@diagram:model-evaluation

## Splitting & validation — measure generalization honestly

```
train (fit)  →  validation (tune)  →  test (final, once)
```

- **Train** — the model learns from it.
- **Validation** — used to tune hyperparameters and choose between models. You look at it many times.
- **Test** — a final, **one-time** unbiased estimate of real-world performance. Touch it once; tuning on it makes it worthless.
- **Cross-validation (k-fold)** — rotate the validation fold `k` times and average; a more robust estimate when data is limited.
- **Time-series → split by TIME** (train on the past, test on the future). A random split leaks future information and massively overestimates performance — the same leakage trap as preprocessing.

## Classification metrics (and why accuracy lies)

Everything derives from the **confusion matrix** (TP, FP, FN, TN):

- **Accuracy** = (TP+TN)/all = % correct. **Misleading on imbalanced data**: if 99% of transactions are legit, a model that always predicts "legit" is 99% accurate and catches zero fraud.
- **Precision** = TP/(TP+FP) — of what you flagged, how much was right (the cost of **false positives** — annoying customers).
- **Recall** = TP/(TP+FN) — of all real positives, how many you caught (the cost of **false negatives** — missing fraud).
- **F1** = harmonic mean of precision and recall — one number when you need balance.
- **ROC-AUC / PR-AUC** — quality across all thresholds (ranking ability); PR-AUC is better for heavy imbalance.

**Pick the metric for the cost.** Cancer screening → maximize recall (don't miss cases). Spam filter → favor precision (don't trash real mail). Accuracy is almost never the right metric on imbalanced data.

## Regression metrics

- **MAE** — mean absolute error, in the target's units (robust, interpretable).
- **RMSE** — root mean squared error; same units but **punishes large errors** more.
- **R²** — fraction of variance explained (1.0 perfect, 0 = no better than the mean).

## Overfitting vs underfitting (the bias-variance trade-off)

```
train acc  val acc   diagnosis
  high       low     OVERFIT  — memorized noise (high variance) → simplify / more data / regularize
  low        low     UNDERFIT — too simple (high bias)          → more features / a stronger model
  high       high    good generalization
```

You diagnose by **comparing train vs validation** performance — a gap means overfitting. This is *exactly* the signal a DE surfaces in training pipelines (log both metrics) and in production monitoring.

## Why a data engineer owns this

Production **monitoring** is just evaluation on live data: log each prediction, join the **delayed actual labels** when they arrive, and compute the metric over time. To build that, you must know *which* metric matters (recall for fraud, RMSE for forecasts — not accuracy on imbalanced data) and how to compute it from logged predictions + labels. When the metric drops below the SLO, you trigger retraining. Evaluation isn't a data-science afterthought — it's the foundation of the drift/performance monitoring loop you operate.

```python
# What production monitoring computes — evaluation on live data
from sklearn.metrics import f1_score, roc_auc_score
labels = join_delayed_labels(logged_predictions)   # actuals arrive late
f1  = f1_score(labels.y_true, labels.y_pred)
auc = roc_auc_score(labels.y_true, labels.y_score)
if f1 < SLA_THRESHOLD:
    trigger(retraining_pipeline)
```

## Cheat sheet

| | Metrics | Watch out |
|---|---|---|
| **Classification** | accuracy, precision, recall, F1, ROC/PR-AUC | accuracy lies on imbalance → use precision/recall/F1 |
| **Regression** | MAE, RMSE, R² | RMSE punishes big errors |
| **Splits** | train / val / test, k-fold CV | never tune on test; time-split for time-series |
| **Fit quality** | train vs val gap | gap = overfit (variance); both low = underfit (bias) |

## Practice

1. A fraud model is 99.5% accurate but catches almost no fraud — explain the trap and the metrics you'd report instead.
2. When would you optimize for recall over precision, and vice versa? Give a real example of each.
3. Train accuracy 0.98, validation 0.71. Diagnose it and name two fixes.
