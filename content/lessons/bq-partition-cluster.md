# BigQuery partitioning & clustering — the complete guide

Because BigQuery cost and speed are driven by **bytes scanned**, the two features that reduce what a query reads — **partitioning** and **clustering** — are the top optimization. And unlike Redshift's manual sort keys, BigQuery clustering is **automatic and self-maintaining**. This chapter covers both and the standard pattern that cuts scans by orders of magnitude.

@@diagram:bq-partition-cluster

## 1. Why this is the top lever

On-demand BigQuery bills **per TB scanned**, and scanning drives latency. **Partitioning** prunes whole partitions; **clustering** skips blocks within them. Together they let a query read a **fraction** of a huge table — the single biggest cost/perf win.

## 2. Partitioning

A **partitioned table** is divided into segments by a column; a query filtering on it **prunes** non-matching partitions. Three types:

| Type | By | Use |
|---|---|---|
| **Time-unit** | A `DATE`/`TIMESTAMP` column (daily/hourly/monthly) | Most common — time-series/events |
| **Ingestion-time** | When rows were loaded (`_PARTITIONTIME`) | When you partition by load time |
| **Integer-range** | Buckets of an integer column | Numeric range partitioning |

```sql
CREATE TABLE ds.events (event_date DATE, user_id INT64, ...)
PARTITION BY event_date
OPTIONS (require_partition_filter = TRUE);
```

Filtering on the partition column reads **only the relevant partitions**. **`require_partition_filter`** forces every query to filter the partition column (prevents accidental full scans).

## 3. Clustering

Within each partition (or the whole table), **clustering** physically **sorts** rows by up to **four** columns. BigQuery keeps **block-level min/max metadata**, so a query filtering/joining on the cluster columns **skips blocks** that can't match — like Redshift zone maps, but:

- **Automatic & self-maintaining** — BigQuery **re-clusters** new/changed data in the **background, for free**. No `VACUUM`/REINDEX.
- **Leftmost-prefix** pruning — like a composite key, ordering matters: cluster columns are most effective when you filter on a **prefix**.

```sql
CREATE TABLE ds.events (...)
PARTITION BY event_date
CLUSTER BY user_id, event_type;
```

Cluster on **high-cardinality columns you filter/join on**, ordered by **filtering priority**.

## 4. The standard pattern: partition + cluster

**Partition by date** (prune to the time range) **and cluster by** the columns you filter within it (skip blocks). A query for 'last week, `user_id=42`' reads only last week's **partitions** and only the **blocks** containing user 42 — orders of magnitude less than a full scan.

## 5. Guidance

- **Partition** on the time/range column you **always filter on**; keep partitions reasonably sized (avoid too many tiny partitions — there's a per-table partition limit, e.g. thousands).
- **Cluster** on the **most-filtered/joined** high-cardinality columns (up to 4), ordered by priority.
- Enable **`require_partition_filter`** on big tables.
- Loading into partitioned/clustered tables (loading lesson) sets up these wins.

## 6. Partitioning vs clustering — when each

- **Partitioning** — coarse pruning on a **low-to-moderate cardinality** time/range column; also enables partition expiration and the require-filter guardrail.
- **Clustering** — fine-grained skipping on **high-cardinality** filter/join columns (where partitioning would create too many partitions). Use clustering for `user_id`-style columns, **not** partitioning.

## 7. Gotchas

- **Not filtering on the partition/cluster columns** → no pruning; the layout only helps if queries filter on them.
- **Over-partitioning** (too many tiny partitions / high-cardinality partition column) → hits the partition limit and hurts; use **clustering** for high cardinality.
- **Clustering on rarely-filtered columns** → little benefit; cluster on actual predicates, in priority order.
- **No `require_partition_filter`** on big tables → accidental full scans; enable it.
- **Expecting manual maintenance** → clustering is automatic; don't look for a VACUUM.
- **Wrong cluster column order** → prune on the leftmost prefix; order by how you filter.

## Scenario — a date filter that reads a sliver

An `events` table is **partitioned by `event_date`** and **clustered by `user_id, event_type`**, with `require_partition_filter` on. A dashboard query `WHERE event_date BETWEEN last-7-days AND user_id = 42 AND event_type='click'` **prunes** to 7 daily partitions, then **skips blocks** whose `user_id`/`event_type` min/max can't match — scanning a tiny fraction of a huge table, fast and cheap. An analyst who forgets the date filter gets an **error** (require_partition_filter) instead of a terabyte scan. As new data loads, BigQuery **re-clusters automatically** at no cost, so the layout stays effective without maintenance. The same query on an unpartitioned, unclustered table would scan the **entire history** every time. Partition-by-date + cluster-by-filter-columns is the BigQuery standard and the biggest cost/perf lever.

## Practice

1. Why are partitioning and clustering the top BigQuery cost/perf levers?
2. Describe the three partition types and when each applies.
3. How does clustering enable block skipping, and how is it different from Redshift sort keys?
4. What is the standard partition+cluster pattern, and what does it achieve?
5. When do you partition vs cluster a given column (e.g. date vs user_id)?
6. What does `require_partition_filter` do and why enable it?
7. Design partitioning/clustering for an events table filtered by date, user_id, and event_type.
