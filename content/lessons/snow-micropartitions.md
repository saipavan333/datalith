# Micro-partitions & pruning — the storage engine, demystified

Almost every Snowflake performance question — "why is this slow," "should I cluster," "why no indexes" — comes back to one thing: how data is physically stored as **micro-partitions** and how **pruning** uses their metadata. Get this cold and the rest of performance tuning becomes obvious.

@@diagram:snow-micropartitions

## 1. How a table is actually stored

When you load data, Snowflake doesn't keep your rows in insert order in one big file. It transparently divides the table into **micro-partitions**:

- **~50–500 MB of uncompressed data** each (much smaller compressed).
- Stored **columnar** — each column's values together — and **compressed** per column.
- **Immutable** — never edited in place.
- Created and managed **automatically** — you never define or size them.

A large table is millions of micro-partitions; a small one, a handful.

## 2. The metadata — the part that makes Snowflake fast

For **every** micro-partition, Snowflake records metadata in the cloud-services layer:

- The **MIN and MAX** of every column.
- The number of **distinct** values, **NULL** counts, and more.

This metadata is small and lives separately from the data. It's the foundation of everything below — and the reason Snowflake **has no indexes**.

## 3. Pruning — skipping what can't match

When a query has a predicate, the optimizer compares it to each micro-partition's metadata **before reading any data**:

> `WHERE order_date = '2025-03-03'` → for each micro-partition, is `'2025-03-03'` within `[min(order_date), max(order_date)]`? If **no**, the partition **cannot** contain a matching row, so **skip it entirely**.

Skipping non-matching micro-partitions is **pruning**. The query only reads the survivors. With well-organized data, a query can read 1% of a huge table.

**Why no indexes:** a traditional DB builds B-trees to avoid full scans. Snowflake's per-partition min/max gives index-like skipping for **every column, automatically, with nothing to create or maintain**. The metadata *is* the index.

## 4. Measure pruning — the one metric to check first

The **Query Profile**'s TableScan shows **Partitions scanned / Partitions total**. Or from history:

```sql
select query_id, total_elapsed_time/1000 sec,
       partitions_scanned, partitions_total,
       round(100*partitions_scanned/nullif(partitions_total,0),1) pct_scanned
from snowflake.account_usage.query_history
where start_time > dateadd('day',-1,current_timestamp())
order by partitions_scanned desc;
```

- **Low `pct_scanned`** on a filtered query → good pruning, nothing to do.
- **High `pct_scanned`** on a filtered query → poor pruning → a **clustering** candidate (next lesson).

This is the **first** thing to look at on a slow query — before warehouse size, before anything.

## 5. Natural clustering by load order

Data lands in micro-partitions roughly in **load order**, which is usually **time-correlated**. So filters on **load-correlated columns (typically dates/timestamps)** prune well **by default** — same-day rows cluster into a few partitions. This is why date-filtered queries are fast out of the box, and why you often **don't** need an explicit clustering key for time-series access.

## 6. Columnar — pruning's partner

Pruning skips **rows** (whole partitions); columnar storage skips **columns**. A `SELECT user_id, amount` reads only those two columns' data within the surviving partitions. The two compound: **prune partitions × read only needed columns = tiny scans**. This is also why `SELECT *` on a wide table is wasteful — it defeats the columnar advantage.

## 7. Immutability — the ripple effects

Because micro-partitions are immutable:

- An `UPDATE`/`DELETE`/`MERGE` writes **new** micro-partitions and marks old ones **obsolete** (kept for the retention window). This is what powers **Time Travel** and **zero-copy cloning** — the historical partitions are still there.
- **High-churn DML** rewrites many partitions; very frequent small DML can fragment a table (and drive reclustering cost if it's clustered). Batch writes where you can.

## 8. What hurts pruning (anti-patterns)

- **Filtering on a scattered, high-cardinality column** (e.g., `customer_id`) whose values appear in *every* partition → min/max can't prune → **clustering** is the fix.
- **Wrapping the filter column in a function** (`WHERE to_char(order_date) = …`) can defeat metadata pruning — filter on the **raw column** where possible.
- **Implicit type casts** on the predicate side can also bypass clean pruning.
- **`SELECT *`** on wide tables — reads every column, wasting the columnar benefit.

## 9. Gotchas

- **Pruning ≠ indexing you control** — you influence it via data organization (load order, clustering), not by creating indexes.
- **A high scan ratio isn't always bad** — an unfiltered aggregate *should* scan everything; judge the ratio **relative to the filter**.
- **Tiny micro-partitions from many small DMLs** can hurt — prefer batched loads/merges.
- **Metadata answers some queries with no compute** — `COUNT(*)`, `MIN`, `MAX` can come straight from metadata (often no warehouse needed).

## Scenario — diagnosing two slow queries

Two dashboards are slow. You pull `QUERY_HISTORY`: Query A (`WHERE order_date = …`) shows **3%** partitions scanned — pruning is fine; its slowness is elsewhere (a big join — size the warehouse). Query B (`WHERE customer_id = …`) shows **94%** partitions scanned — `customer_id` is **scattered** across all micro-partitions, so almost nothing prunes. The fix for B is a **clustering key** on `customer_id` (or Search Optimization if it's a pure point lookup), not a bigger warehouse. Same symptom (slow), completely different cause — and the **pruning ratio** told them apart in seconds. That diagnostic instinct is what this lesson buys you.

## Practice

1. In your own words, explain how min/max metadata replaces indexes, and walk a `WHERE dt = '2025-03-03'` query through pruning.
2. Write the QUERY_HISTORY query to find yesterday's queries with the worst pruning ratio.
3. Explain why `WHERE order_date = …` prunes well on a fresh table but `WHERE customer_id = …` may not.
4. Give three things that defeat pruning and how to avoid each.
5. Connect immutability to Time Travel and cloning in two sentences.
