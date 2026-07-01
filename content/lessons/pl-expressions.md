# Polars expressions — the complete guide

Expressions are the heart of Polars. Where pandas centers on indexing, Polars centers on **expressions** — small,
composable descriptions of column logic that Polars evaluates **in parallel**. Learn the expression API and you can do
almost anything concisely and fast. This guide covers the four contexts, every building block, conditionals, window
expressions, and the typed namespaces.

## 1. The four contexts

@@diagram:polars-expressions

An expression only runs inside a **context**. There are four:

```python
import polars as pl

df.select(pl.col('a'), (pl.col('b') * 2).alias('b2'))   # pick / compute columns
df.with_columns(net = pl.col('amount') - pl.col('fee')) # add or replace columns
df.filter(pl.col('amount') > 100)                       # keep rows
df.group_by('region').agg(pl.col('amount').sum())       # aggregate per group
```

- **select** returns only what you list. **with_columns** keeps everything and adds/replaces. **filter** takes a boolean
  expression. **group_by().agg** computes one row per group.

## 2. Selecting columns

```python
pl.col('x')                 # one column
pl.col('a', 'b')            # several
pl.col('^amt_.*$')          # by regex
pl.all()                    # every column
pl.all().exclude('id')      # all but some
pl.col(pl.Float64)          # by dtype
pl.first(); pl.last(); pl.sum('x')   # shorthands
```

## 3. Building expressions

```python
pl.lit(5)                                   # a constant
pl.col('x') + pl.col('y'); pl.col('x') / 2  # arithmetic
pl.col('x').is_between(0, 10)
pl.col('x').is_in([1, 2, 3]); pl.col('x').is_null()
pl.col('x').cast(pl.Float64).fill_null(0).round(2)   # chain methods
# aggregations (in agg context, or as a scalar)
pl.col('x').sum() / mean() / median() / min() / max() / std()
pl.col('x').n_unique() / count() / first() / last()
pl.col('x').sort() / rank() / cum_sum() / diff() / shift(1)
```

Alias the result with `.alias('name')` (or the `name=expr` keyword form in `with_columns`).

## 4. Vectorized conditionals

```python
pl.when(pl.col('amount') > 100).then(pl.lit('high')) \
  .when(pl.col('amount') > 50).then(pl.lit('mid'))   \
  .otherwise(pl.lit('low')).alias('tier')
```

Chain multiple `when/then` for multi-way logic — it stays vectorized (no Python loop).

## 5. Window expressions — `.over()`

A window expression computes a **per-group statistic without collapsing rows** — the clean replacement for pandas'
`groupby().transform`:

```python
# each row's share of its region total
(pl.col('amount') / pl.col('amount').sum().over('region')).alias('share')

# rank within group, running total within group
pl.col('amount').rank(descending=True).over('region').alias('rank')
pl.col('amount').cum_sum().over('region').alias('running')

# multiple grouping keys
pl.col('x').mean().over(['region', 'segment'])
```

## 6. Typed namespaces

Methods are grouped by the kind of data they operate on:

```python
# .str — strings
pl.col('name').str.to_uppercase()
pl.col('name').str.contains('A'); pl.col('name').str.replace('-', '_')
pl.col('email').str.split('@'); pl.col('s').str.strip_chars().str.len_chars()
pl.col('s').str.extract(r'(\d+)', 1)             # regex capture

# .dt — temporal
pl.col('ts').dt.year(); pl.col('ts').dt.month(); pl.col('ts').dt.weekday()
pl.col('ts').dt.truncate('1mo'); pl.col('ts').dt.offset_by('1d')

# .list — list columns
pl.col('tags').list.len(); pl.col('tags').list.contains('x')
pl.col('tags').list.first(); pl.col('values').list.sum()

# .struct — struct columns
pl.col('payload').struct.field('id')
```

## 7. Putting expressions together

```python
out = df.with_columns(
    tier      = pl.when(pl.col('amount') > 100).then(pl.lit('high')).otherwise(pl.lit('low')),
    share     = pl.col('amount') / pl.col('amount').sum().over('region'),
    region_up = pl.col('region').str.to_uppercase(),
    month     = pl.col('order_date').dt.month(),
    rank      = pl.col('amount').rank(descending=True).over('region'),
)
```

All five new columns are computed **in parallel** from one pass.

## 8. Scenario A — feature engineering

```python
features = df.group_by('customer_id').agg(
    n_orders   = pl.len(),
    total_spend= pl.col('amount').sum(),
    avg_order  = pl.col('amount').mean(),
    last_order = pl.col('order_date').max(),
    categories = pl.col('category').n_unique(),
    big_orders = (pl.col('amount') > 100).sum(),      # count of large orders
)
```

## 9. Scenario B — group-relative metrics in one pass

```python
df.with_columns(
    pct_of_region = pl.col('sales') / pl.col('sales').sum().over('region') * 100,
    vs_region_avg = pl.col('sales') - pl.col('sales').mean().over('region'),
    region_rank   = pl.col('sales').rank(descending=True).over('region'),
)
```

## 10. Gotchas

- Expressions are **lazy descriptions** — they do nothing until used in a context (and, in lazy mode, until `.collect()`).
- Avoid `.map_elements(py_func)` (Python per row, slow). Express the logic with native expressions instead.
- `.over()` keeps row count; `.group_by().agg()` reduces it — pick based on whether you want a stat *per row* or *per group*.

## 11. Practice

1. Label rows 'high'/'mid'/'low' by amount with chained `when/then/otherwise`.
2. Compute each row's percent of its region total with `.over('region')`.
3. Uppercase a name column and extract the year from a datetime, in one `with_columns`.
4. Build per-customer features (order count, total spend, distinct categories) with one `group_by().agg`.

Expressions + the four contexts are the entire Polars mental model. Internalize them and idiomatic Polars becomes both
shorter and dramatically faster than the pandas equivalent.
