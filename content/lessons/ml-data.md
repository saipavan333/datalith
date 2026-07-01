# Data for ML: splits, leakage & labels — the complete guide

Before any model, the data has to be set up correctly — and this is where pipelines silently sabotage ML. This guide
covers train/validation/test splits, the many faces of data leakage (the cardinal sin), labels and their quality,
class imbalance, and reproducibility — with a leakage checklist you can apply to every project.

@@diagram:ml-data-splits

## 1. The three splits

```python
from sklearn.model_selection import train_test_split

# train (fit) / temp, then temp -> validation (tune) / test (final)
X_train, X_tmp, y_train, y_tmp = train_test_split(X, y, test_size=0.30, stratify=y, random_state=42)
X_val, X_test, y_val, y_test   = train_test_split(X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=42)
```

- **Train** — fit the model.
- **Validation** — tune hyperparameters and make choices.
- **Test** — a final, **touch-once** estimate of real-world performance. If you tune on the test set, it stops being an
  honest estimate.

`stratify=y` keeps class proportions consistent across splits (important for imbalanced data).

## 2. Temporal data — split by time

For anything with a time order (forecasting, fraud, churn), **never shuffle** — split chronologically:

```python
train = df[df.date <  "2024-01-01"]      # the past
test  = df[df.date >= "2024-01-01"]      # the future
# better still: sklearn TimeSeriesSplit for rolling-window cross-validation
```

Shuffling lets the model "see the future" during training, overstating accuracy — and then it fails on genuinely future
data.

## 3. Data leakage — the cardinal sin

**Leakage** is when information that won't be available at prediction time sneaks into training. It inflates offline
metrics, which then collapse in production. The three common forms:

**a) Target leakage** — a feature derived from (or a proxy for) the label:

```python
# predicting fraud, but 'was_chargeback' only exists AFTER fraud is confirmed
# -> the model "cheats" offline and is useless live. Drop features unknown at predict time.
```

**b) Train/test contamination** — fitting a transformation on the **whole** dataset before splitting:

```python
# WRONG — scaler sees test statistics
X = StandardScaler().fit_transform(X); Xtr, Xte = split(X)

# RIGHT — split first, fit on TRAIN only, transform test with it
Xtr, Xte = split(X)
scaler = StandardScaler().fit(Xtr)
Xtr, Xte = scaler.transform(Xtr), scaler.transform(Xte)
# use a Pipeline to make this automatic:
from sklearn.pipeline import make_pipeline
model = make_pipeline(StandardScaler(), GradientBoostingClassifier())  # fits scaler on train folds only
```

**c) Temporal leakage** — using data from after the prediction time (e.g. a 30-day aggregate that includes days past
the label's timestamp). The fix is **point-in-time** features (see the feature-store lesson).

## 4. The leakage checklist

Before trusting any metric, ask:

1. Was **every** transformation (scale, impute, encode, select features) fit on **train only**?
2. Is **each feature knowable at prediction time**? (Would you have it live?)
3. For temporal data, is the split **by time**?
4. Are train and test **truly disjoint** — no duplicate entity (same user/account) in both?
5. Did any **aggregation window** reach past the label's timestamp?

A model that looks too good to be true almost always has a leak. Find it before production does.

## 5. Labels — where supervision comes from

Supervised learning needs labels, and getting good ones is real work:

| Source | How | Watch out for |
|---|---|---|
| **Manual labeling** | humans annotate (with guidelines + QA) | slow, costly, inconsistent labelers |
| **Weak supervision** | rules/heuristics generate noisy labels | systematic bias |
| **Implicit feedback** | clicks, purchases, dwell time | position/selection bias |

**Label quality caps model quality** — garbage labels, garbage model. Invest in clear labeling guidelines, measure
inter-annotator agreement, and audit a sample.

## 6. Class imbalance

When the positive class is rare (1% fraud), **accuracy is meaningless** (predict "no" → 99% accurate, 0% useful):

```python
# use the right metric
from sklearn.metrics import precision_recall_curve, roc_auc_score, average_precision_score
ap  = average_precision_score(y_test, scores)     # PR-AUC — better for imbalance
# and handle the imbalance
model = GradientBoostingClassifier()              # or class_weight='balanced' where supported
# resampling: SMOTE (oversample minority) / undersample majority — fit on TRAIN folds only
```

Choose precision/recall, PR-AUC, or F1 depending on the cost of false positives vs false negatives.

## 7. Reproducibility

```python
import numpy as np, random
SEED = 42
random.seed(SEED); np.random.seed(SEED)           # fix all RNGs
# version the dataset/feature-set (a snapshot id or hash) so the exact split is repeatable
```

A split you can't reproduce makes a model you can't debug.

## 8. Scenario — a "too good" model

```
symptom: 0.99 AUC offline, ~0.6 in production
audit:   feature 'days_to_resolution' is only known AFTER the ticket closes (target leakage)
         and the scaler was fit before the split (contamination)
fix:     drop the leaky feature; move scaling into a Pipeline (fit on train folds only)
result:  honest 0.82 offline that HOLDS in production
```

## 9. Practice

1. Split data 70/15/15 into train/val/test, stratified and reproducible.
2. Explain target leakage with an example and how to catch it.
3. Why must a scaler be fit on the training set only? Show the safe (Pipeline) approach.
4. Accuracy is 99% on 1%-positive data but the model is useless — why, and what metric/handling do you use?

Get the data right — honest splits, no leakage, quality labels, the right metric for imbalance, and reproducibility —
and your offline metrics will finally mean something in production. This is the unglamorous foundation under every model.
