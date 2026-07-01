# Merge & reshape — combining and reshaping tables in pandas

Real analysis almost never uses one tidy table. You join orders to customers, stack monthly files, and pivot long
data into a report matrix. This guide covers the two skills that do all of that: **combining** tables and
**reshaping** them between wide and long.

## 1. merge — SQL joins in pandas

@@diagram:pd-join-types

`pd.merge` joins two DataFrames on key columns, exactly like a SQL join. The `how` argument chooses what to keep:

```python
full = orders.merge(customers, on="cust_id", how="left", validate="m:1")
```

- **inner** — only rows whose key matches on both sides.
- **left** / **right** — keep all rows from one side, fill the other with `NaN` where there's no match.
- **outer** — keep everything from both sides.

> **The bug that inflates your numbers:** if the "one" side actually has **duplicate keys**, a join becomes
> many-to-many and **multiplies rows** — and then your `SUM` is suddenly too big. Always pass `validate=` (`"1:1"`,
> `"1:m"`, `"m:1"`). pandas will raise an error the moment the relationship isn't what you claimed, catching the
> problem before it corrupts a report. Use `indicator=True` to see which side each row matched.

`df.join(other)` is a shortcut for merging **on the index**, and `pd.concat([a, b])` simply **stacks** frames — more
rows by default, or more columns with `axis=1`:

```python
all_year = pd.concat([jan, feb, mar], ignore_index=True)   # stack rows
```

## 2. Wide vs long — and why it matters

The same data can be shaped two ways:

- **Long / tidy** — one observation per row: `(month, category, sales)`. This is what computation, groupby, and
  plotting libraries expect.
- **Wide** — one row per entity with metrics spread across columns: a `month × category` matrix of sales. This is
  what humans like to read in a report.

You constantly convert between them.

## 3. pivot_table — long to wide

`pivot_table` reshapes long data into a wide matrix **and aggregates** duplicates:

```python
matrix = full.pivot_table(
    index="month", columns="category", values="sales",
    aggfunc="sum", fill_value=0,
)
```

That produces a grid with months down the side, categories across the top, and summed sales in the cells. (`pivot`
is the non-aggregating version — it errors if there are duplicate index/column pairs, so `pivot_table` is the safer
default.)

## 4. melt — wide to long

`melt` does the reverse, collapsing many columns into `variable`/`value` pairs. It's how you **tidy** a messy
spreadsheet that has, say, a column per month:

```python
# columns: id, jan, feb, mar  ->  columns: id, month, sales
tidy = wide.melt(id_vars="id", value_vars=["jan", "feb", "mar"],
                 var_name="month", value_name="sales")
```

For hierarchical (`MultiIndex`) data, `stack` moves a column level into the index and `unstack` moves it back —
they're the lower-level engines under pivot/melt.

## 5. A typical flow

The pattern is: **tidy first, compute, then pivot for presentation.**

```python
tidy = messy.melt(id_vars="store", var_name="month", value_name="sales")   # untangle
monthly = tidy.groupby(["store", "month"])["sales"].sum().reset_index()    # compute
report = monthly.pivot_table(index="store", columns="month", values="sales")  # present
```

## 6. Practice

1. Left-join `sales` to `products` on `product_id`, asserting each sale maps to one product.
   *Answer:* `sales.merge(products, on="product_id", how="left", validate="m:1")`.
2. Your left join doubled the row count and inflated totals. What happened, and how do you catch it next time?
   *Answer:* The right table had duplicate keys (many-to-many fan-out). `validate="m:1"` would have raised an error instead.
3. Turn long `(date, region, sales)` data into a `date × region` matrix of total sales.
   *Answer:* `df.pivot_table(index="date", columns="region", values="sales", aggfunc="sum", fill_value=0)`.
4. A table has `id, q1, q2, q3, q4` sales columns. Make it long with `quarter`/`sales`.
   *Answer:* `df.melt(id_vars="id", value_vars=["q1","q2","q3","q4"], var_name="quarter", value_name="sales")`.

Master merge (with `validate`), pivot_table, and melt, and you can get any messy collection of tables into exactly the
shape your analysis needs.
