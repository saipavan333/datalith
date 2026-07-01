# Preprocessing data for ML — deep dive

Models don't eat raw data — they need a clean numeric matrix: no missing values, no text categories, and (for many algorithms) comparable scales. Turning messy real-world data into that matrix is **preprocessing**, and it's data-transformation work — squarely a data engineer's wheelhouse. The one rule that separates a working ML system from a broken one: **never let information leak from test into train.**

@@diagram:preprocessing-steps

## 1. Missing values

Most models can't handle `NaN` (some tree libraries can). Based on the missingness pattern you found in EDA:

```python
from sklearn.impute import SimpleImputer
num_imp = SimpleImputer(strategy="median")   # numerics: median (robust to outliers)
cat_imp = SimpleImputer(strategy="most_frequent")  # categoricals: mode
# or a constant sentinel: SimpleImputer(strategy="constant", fill_value="MISSING")
```

Impute when the column is mostly present; drop columns that are overwhelmingly null; and remember that *missing itself* can be informative (add an `is_missing` flag).

## 2. Encode categoricals — text → numbers

| Encoding | When | Note |
|---|---|---|
| **One-hot** | low cardinality | a column per value; explodes with high cardinality |
| **Label / ordinal** | ordered categories | integers imply order (size: S<M<L) |
| **Target / frequency** | high cardinality | encode by target mean or count — careful of leakage |

```python
from sklearn.preprocessing import OneHotEncoder
ohe = OneHotEncoder(handle_unknown="ignore")   # unseen categories at serving won't crash
```

(Free text and high-cardinality entities are better handled with **embeddings** — covered in the vectors lesson.)

## 3. Scale numerics

Put features on comparable ranges so no single large-valued feature dominates:

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler
StandardScaler()   # z-score: mean 0, std 1  (most common)
MinMaxScaler()     # squash to [0, 1]
```

**Who needs scaling:** linear models, SVMs, neural nets, and distance-based methods (k-means, KNN) — anything using distances or gradients. **Who doesn't:** tree-based models (decision trees, random forests, gradient boosting) split on thresholds, so scale is irrelevant. Match preprocessing to the algorithm.

## 4. Outliers

Cap/clip to percentiles, transform (e.g., `log1p` for skewed positive values), or remove genuine errors — guided by EDA, not reflex.

## The cardinal rule: fit on train only

This is where most leakage bugs live. The imputer's median and the scaler's mean/std are **learned statistics** — they must be computed from the **training data only**, then *applied* to validation/test:

```python
# WRONG — fits on all data, leaking test info into training
scaler.fit(X_all);  X_all = scaler.transform(X_all)

# RIGHT — fit on train, apply to test
scaler.fit(X_train)
X_train = scaler.transform(X_train)
X_test  = scaler.transform(X_test)     # uses TRAIN's statistics
```

If you compute the scaling mean over all data, your test set has influenced training — your offline metrics look great and the model fails in production. Same for target encoding, imputation, and feature selection: **fit on train, apply to test.**

## Wrap it in a pipeline (and serve the same transforms)

Pipelines make the fit-on-train discipline automatic and reproducible:

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
pre = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])
model = Pipeline([("pre", pre), ("clf", SomeModel())])
model.fit(X_train, y_train)            # fits ALL transforms on train only
model.predict(X_test)                  # applies the same fitted transforms
```

The deeper point for a DE: those **same fitted transforms must run identically at serving time**. Computing features one way in training (batch) and another way online is **train/serve skew** — the #1 ML-in-production failure. A feature store (or a serialized pipeline) guarantees one fitted transformation is used in both places. Preprocessing isn't a notebook step; it's a versioned, leakage-safe, dual-surface pipeline — which is exactly the engineering DEs are good at.

## Cheat sheet

| Step | Tool | Rule |
|---|---|---|
| missing | `SimpleImputer` (median/mode) | impute or drop; flag missingness |
| categorical | `OneHotEncoder` / target encode | match to cardinality; `handle_unknown` |
| scale | `StandardScaler` / `MinMaxScaler` | only for linear/distance/gradient models |
| outliers | clip / log / remove | guided by EDA |
| **leakage** | `Pipeline` / `ColumnTransformer` | **fit on TRAIN only**, apply to test + serving |

## Practice

1. Why does fitting a `StandardScaler` on the full dataset (before splitting) cause leakage, and how do you fix it?
2. You have a `city` column with 5,000 distinct values. Why is one-hot a bad choice, and what would you use?
3. Which of these need scaling: gradient boosting, logistic regression, k-means, random forest?
