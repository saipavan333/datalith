# Exploratory Data Analysis (EDA) — deep dive

Before anyone trains a model, someone has to actually *look at the data* — and that someone is often the data engineer. EDA is how you find that a pipeline silently dropped half the rows, a "numeric" column is stored as text, a feature is 80% null, or two columns are duplicates. For a DE, EDA is **data profiling**: the same discipline that powers data-quality monitoring, applied to understand a dataset before it's modeled.

@@diagram:eda-workflow

## The six things to check

### 1. Shape & types — what am I even looking at?

```python
df.shape            # (rows, columns) — is it the size you expected?
df.info()           # dtypes + non-null counts + memory
df.head(10)         # eyeball actual values
df.describe()       # count/mean/std/min/quartiles/max for numerics
df.describe(include="object")   # top/freq/unique for categoricals
```

Red flags: a "numeric" column showing up as `object` (text — won't model), far fewer rows than expected (a join dropped data), or surprising memory size.

### 2. Missing values — how much, and where?

```python
df.isna().sum()                      # nulls per column
df.isna().mean().sort_values()       # fraction null per column
```

The *pattern* matters: a column that's 5% null you impute; one that's 90% null you probably drop; missingness correlated with the target can itself be a signal (or leakage).

### 3. Distributions — shape, scale, skew

```python
df["amount"].hist(bins=50)           # numeric distribution
df["country"].value_counts()         # categorical frequencies
df["country"].nunique()              # cardinality (drives encoding choice)
```

Heavy skew suggests a log transform; wildly different scales suggest standardization; very high cardinality changes how you'll encode a category.

### 4. Outliers — errors or signal?

```python
df["amount"].describe()              # min/max far from quartiles?
q1, q3 = df["amount"].quantile([.25, .75]); iqr = q3 - q1
outliers = df[(df["amount"] < q1 - 1.5*iqr) | (df["amount"] > q3 + 1.5*iqr)]
```

A negative price or an age of 999 is a data error to fix; a genuine rare-but-real extreme may need capping or a transform — not blind deletion.

### 5. Correlations — relationships & redundancy

```python
df.corr(numeric_only=True)           # pairwise correlation
import seaborn as sns; sns.heatmap(df.corr(numeric_only=True))
```

Two highly-correlated features are redundant (drop one). A feature *suspiciously* correlated with the target can be **leakage** (it encodes the answer) — EDA is where you catch that before it inflates offline metrics.

### 6. Target analysis — the most important check for supervised ML

```python
df["is_fraud"].value_counts(normalize=True)    # class balance
```

If the target is 99.3% / 0.7%, that **imbalance changes everything**: accuracy becomes meaningless, you'll pick precision/recall/F1, and you may resample. For regression, check the target's distribution and outliers.

## Doing EDA at data-engineering scale

pandas + seaborn is great for a sample, but real datasets don't fit in memory. For a DE:

```python
# Profile billions of rows with SQL/DuckDB instead of loading them
import duckdb
duckdb.sql("""
  SELECT count(*) AS rows,
         count(*) - count(amount) AS amount_nulls,
         min(amount), max(amount), avg(amount),
         count(DISTINCT country) AS country_cardinality
  FROM 'data/*.parquet'
""")
```

Automated profilers (`ydata-profiling`, formerly pandas-profiling) generate a full report in one line for a sample. At scale, compute the same statistics as aggregations in DuckDB/Spark/SQL over the full data or a representative sample.

## Why this is squarely a DE skill

Every EDA check maps to a pipeline or quality decision: shape/types → fix ingestion bugs and casts; missing → imputation/drop logic; distributions → preprocessing; outliers → cleaning rules; correlations → drop redundant/leaky features; target balance → metric and modeling choices. And the very same profiling — freshness, volume, null rates, distributions — is what your **data-observability** monitoring tracks continuously in production. EDA isn't a data-science-only ritual; it's data profiling, and it's how you make data trustworthy.

## Cheat sheet

| Check | Code | Tells you |
|---|---|---|
| shape/types | `df.shape`, `df.info()` | size, mis-typed columns |
| missing | `df.isna().mean()` | impute vs drop |
| distribution | `df["x"].hist()`, `value_counts()` | skew, scale, cardinality |
| outliers | `describe()`, IQR | errors vs real extremes |
| correlation | `df.corr()`, heatmap | redundancy, leakage |
| target balance | `value_counts(normalize=True)` | imbalance → metric choice |
| at scale | DuckDB/Spark aggregates, ydata-profiling | profile without loading all |

## Practice

1. You load a dataset and `df.shape` shows 10,000 rows but you expected 1,000,000. Name two pipeline bugs that could cause this and how you'd confirm.
2. A column `signup_revenue` is perfectly correlated with the target `converted`. Why is that a red flag, and what is it called?
3. The target is 98% / 2%. List three things that imbalance changes about how you'd model and evaluate.
