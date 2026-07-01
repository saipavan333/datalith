# pandas — the complete guide

pandas is the go-to library for tabular data in Python — load it, clean it, filter,
group, and join it. The concepts mirror SQL, so this is SQL thinking expressed in
Python. This guide is the full workflow, with examples and practice.

## 1. Series and DataFrame

- A **Series** is one labelled column (a 1-D array with an index).
- A **DataFrame** is a table — a dict of Series sharing an index.

```python
import pandas as pd
df = pd.DataFrame({"name": ["Ava", "Raj"], "amount": [120, 450]})
df["amount"]      # a Series
```

## 2. Load & inspect (do this first, every time)

```python
df = pd.read_csv("orders.csv")    # also read_json, read_parquet, read_sql, read_excel
df.head()         # first rows
df.info()         # columns, dtypes, null counts  ← read this FIRST
df.describe()     # summary stats for numeric columns
df.shape          # (rows, columns)
df.columns        # column names
```

`df.info()` reveals wrong dtypes (a price stored as text) and hidden nulls before they
bite you.

## 3. Select columns and rows

```python
df["amount"]                    # one column (Series)
df[["name", "amount"]]          # several columns (DataFrame)
df.loc[df["amount"] > 100, "name"]   # label/condition based
df.iloc[0:5, 0:2]               # integer-position based
```

## 4. Filter — a boolean mask (this is SQL's WHERE)

```python
df[df["amount"] > 100]
df[(df["amount"] > 100) & (df["country"] == "India")]   # & | and PARENTHESES
df[df["country"].isin(["India", "USA"])]
df[df["name"].str.startswith("A")]
```

The #1 beginner error: using Python `and`/`or` between masks. Use `&` and `|`, and wrap
each condition in parentheses.

## 5. Group & aggregate (= GROUP BY)

```python
df.groupby("country")["amount"].sum()
df.groupby("country").agg(
    total=("amount", "sum"),
    orders=("amount", "count"),
    avg=("amount", "mean"),
)
```

## 6. Join (= SQL JOIN)

```python
pd.merge(orders, customers, on="customer_id", how="left")
# how = 'inner' | 'left' | 'right' | 'outer' — same semantics as SQL
```

## 7. Sort & top-N

```python
df.sort_values("amount", ascending=False)
df.sort_values(["country", "amount"], ascending=[True, False])
df.nlargest(5, "amount")        # top 5
```

## 8. Clean data (the daily reality)

```python
df["price"] = df["price"].astype(float)                # fix dtype
df["country"] = df["country"].str.strip().str.title()  # standardise text
df["amount"] = df["amount"].fillna(0)                  # fill missing
df = df.dropna(subset=["customer_id"])                 # drop rows missing a key
df = df.drop_duplicates(subset=["order_id"])           # dedupe
df["ts"] = pd.to_datetime(df["date"])                  # parse dates
```

## 9. New columns — vectorize, don't loop

```python
# fast: whole-column operation
df["tax"] = df["amount"] * 0.2
# slow: per-row Python (avoid for big data)
df["tax"] = df.apply(lambda r: r["amount"] * 0.2, axis=1)
```

Vectorized column operations run in fast compiled code; `apply(..., axis=1)` and
`iterrows` run a Python call per row and can be 10–100× slower.

## 10. The SQL ↔ pandas map

| SQL | pandas |
|---|---|
| SELECT col | `df["col"]` |
| WHERE | `df[df["x"] > 1]` |
| GROUP BY + agg | `df.groupby("x")["y"].sum()` |
| JOIN | `pd.merge(a, b, on="k", how=...)` |
| ORDER BY | `df.sort_values(...)` |
| DISTINCT | `df.drop_duplicates()` |
| LIMIT | `df.head(n)` |

## 11. When to leave pandas

pandas loads everything into memory on one machine. Past a few million rows (or tight
memory), move to **Spark** (distributed) or **Polars/DuckDB** (fast single-machine
engines). The skills transfer — select, filter, group, join are the same ideas at
every scale.

## Practice

1. **Revenue per country**, highest first.
2. **Filter** amount > 100 AND country == 'India' (boolean mask).
3. **Vectorize vs apply** — why the column op beats row-wise apply.
4. **Left join** orders to customers, keeping all orders.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you filter and summarise a DataFrame, and why avoid `iterrows`/row-wise
> `apply`?"*

Filter with a boolean mask (`df[df["amount"] > 100]`, combining with `&`/`|` and
parentheses); summarise with `groupby().agg()` (SQL's GROUP BY). Avoid row loops
because vectorized whole-column operations run in fast compiled code, while per-row
Python is 10–100× slower. Connecting pandas back to SQL (WHERE/GROUP BY/JOIN) shows you
understand the ideas, not just the syntax.
