# groupby in depth — split, apply, combine

`groupby` is the single most important skill in pandas. Almost every analytical question — "revenue per region",
"average session time per user", "share of total per category" — is a groupby. Once you see the **split-apply-combine**
pattern behind it, the whole API clicks into place.

## 1. The mental model

@@diagram:pd-split-apply-combine

Every groupby does three things:

1. **Split** the rows into groups by the value of a key column.
2. **Apply** a function to each group independently.
3. **Combine** the per-group answers into one result.

You rarely call those steps separately — pandas does all three when you write `df.groupby('key').sum()` — but holding
the picture in your head tells you exactly what each variation will return.

## 2. Aggregate — one row per group

The most common case collapses each group to a single summary row. Use `.agg` with **named aggregations** so the
output columns have clean names:

```python
import pandas as pd

summary = df.groupby('region').agg(
    revenue=('amount', 'sum'),
    avg_order=('amount', 'mean'),
    orders=('amount', 'size'),
    customers=('cust_id', 'nunique'),
)
```

You can group by several keys at once by passing a list (`groupby(['region', 'month'])`), which gives a result indexed
by every combination. Add `.reset_index()` (or `as_index=False`) if you want those keys back as ordinary columns.

> **size vs count:** `size()` counts **rows** in each group (including missing values). `count()` counts **non-null**
> values per column. `nunique()` counts distinct values. Mixing these up is a classic source of wrong numbers.

## 3. Transform — keep every row, add group context

This is the one people miss, and it's incredibly useful. `.transform` returns a result **the same length as the input**,
broadcasting each group's answer back onto every row in that group. That lets you compute **group-relative** features
without a join:

```python
# each row's share of its region's total revenue
df['region_total'] = df.groupby('region')['amount'].transform('sum')
df['share'] = df['amount'] / df['region_total']

# fill missing ages with the average age of that person's department
df['age'] = df.groupby('department')['age'].transform(lambda s: s.fillna(s.mean()))
```

Compare the shapes: `.agg('sum')` gives you **one number per region**; `.transform('sum')` gives you **the region's
total written next to every row**. When you need to combine a group statistic with row-level data, transform is the tool.

## 4. Filter — keep or drop whole groups

`.filter` evaluates a condition on each **group** and keeps only the groups that pass:

```python
# keep only stores that have at least 100 orders
busy = df.groupby('store').filter(lambda g: len(g) >= 100)

# keep only customers whose total spend exceeds 1000
whales = df.groupby('cust_id').filter(lambda g: g['amount'].sum() > 1000)
```

The result has the original rows, just from fewer groups.

## 5. Performance — why apply is the slow path

There's a hierarchy of speed:

- **Built-in aggregations** (`sum`, `mean`, `count`, `min`, `max`, `std`) run in optimized C over the whole frame. Fast.
- **`.transform('sum')`** with a string name also uses the fast path.
- **`.apply(python_function)`** and `.transform(lambda ...)` run your Python code **once per group** — flexible, but
  potentially hundreds of times slower.

So always prefer a built-in. Reach for `.apply` only when no built-in expresses what you need:

```python
# slow if there are many groups — Python runs per group
df.groupby('region').apply(lambda g: weird_custom_metric(g))

# fast — built-in handles it in C
df.groupby('region')['amount'].sum()
```

> **A frequent trap:** `df.groupby('k').apply(lambda g: g['x'].sum())` works but is far slower than the equivalent
> `df.groupby('k')['x'].sum()`. If you find yourself writing a lambda that just calls one aggregation, there's a
> built-in that does it faster.

## 6. Quick reference

| You want… | Use | Result shape |
|---|---|---|
| One summary row per group | `.agg(...)` | rows = number of groups |
| A group stat on every row | `.transform(...)` | rows = original |
| Keep/drop entire groups | `.filter(...)` | subset of original rows |
| A frequency table | `value_counts()` | counts per distinct value |

## 7. Practice

1. Compute total and average `amount` per `category`, with tidy column names.
   *Answer:* `df.groupby('category').agg(total=('amount','sum'), avg=('amount','mean'))`.
2. Add a column with each row's percent of its category total.
   *Answer:* `df['pct'] = df['amount'] / df.groupby('category')['amount'].transform('sum') * 100`.
3. Keep only departments with more than 20 employees.
   *Answer:* `df.groupby('department').filter(lambda g: len(g) > 20)`.
4. You wrote `df.groupby('region').apply(lambda g: g['sales'].mean())` and it's slow. Rewrite it.
   *Answer:* `df.groupby('region')['sales'].mean()` — the built-in runs in C instead of per-group Python.

Get comfortable choosing between agg, transform, and filter, and you can answer almost any "per-group" question in one
readable line.
