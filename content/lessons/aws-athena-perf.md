# Athena performance & cost optimization — the complete guide

In Athena, **performance and cost are the same problem**: both are driven by **bytes scanned**. Every optimization here aims to read less data. This chapter is the prioritized playbook — layout, query discipline, and workgroup governance — plus how to diagnose a query that scans too much.

@@diagram:aws-athena-perf

## 1. The core principle

Athena bills **per byte scanned**, and scanning is what takes time. So **reducing bytes read improves cost and latency together**. There's no "tune the cluster" lever — there's only "make the query read less."

## 2. The levers, in priority order

### 1) Columnar + compression (biggest win)
Store **Parquet/ORC** with **Snappy/ZSTD**. Athena reads **only the columns** a query needs and far fewer bytes than row formats (CSV/JSON). Converting CSV→Parquet often cuts data scanned by **10–30×**.

### 2) Partition + prune
Partition on **filter columns** (date) and **always filter on them**; use **partition projection**. Pruning skips whole prefixes.

### 3) Compact files (~128 MB–1 GB)
Many **tiny files** cause per-file overhead, slow planning, and S3 listing cost. Compact via CTAS or Glue.

### 4) Select only needed columns
**Never `SELECT *`** on wide tables. With columnar storage, projecting 4 of 100 columns reads ~4% of the column data.

### 5) Bucketing / sorting
**Bucket** or **sort** on **high-cardinality join/filter keys** so Athena skips row groups/buckets that can't match — handles high-cardinality lookups without partition explosion.

### 6) Filter early & predicate pushdown
Push `WHERE` down to prune partitions and Parquet row groups; **reduce data before joins** (filter/aggregate first).

### 7) Optimize joins
Filter and pre-aggregate before joining; avoid accidental cross joins; structure joins so less data flows.

## 3. Governance with workgroups

**Workgroups** isolate teams/workloads and let you set:
- **Per-query** and **per-workgroup data-scanned limits** — hard cost guardrails (cancel a query that would scan more than N GB).
- A dedicated **results location** and **encryption**.
- **Tags** for **cost attribution**.

A scan limit stops a stray `SELECT *` on an unpartitioned table from quietly scanning (and billing) terabytes.

## 4. Engine features that save scans

- **Query result reuse / caching** — repeated identical queries return cached results **without re-scanning** (big savings for dashboards).
- **Approximate functions** (`approx_distinct`, `approx_percentile`) — far cheaper for big aggregations when exactness isn't required.
- **Current engine version** — better performance and features.
- **CTAS to pre-aggregate** — materialize heavy aggregations into small tables that dashboards read cheaply.

## 5. Diagnosing a heavy query

Look at the query's **data scanned** and **run time** (console statistics / `EXPLAIN` / `EXPLAIN ANALYZE`). If it scans far more than expected, the usual causes:
- **No partition filter** → scans whole table. Add the date filter / projection.
- **`SELECT *`** → reads all columns. Project needed columns.
- **Non-columnar format** (CSV/JSON) → convert to Parquet (CTAS).
- **Tiny files** → compact.
- **Join reading too much** → filter/aggregate before the join.

## 6. Gotchas

- **`SELECT *`** on wide tables — the most common waste.
- **Missing partition filter** — partitions don't help if you don't filter on them.
- **CSV/JSON / unsplittable gzip** — always far more scanned than Parquet.
- **Tiny files / over-partitioning** — overhead; compact and partition coarsely.
- **No scan limits** — one runaway query can cost a lot; use workgroup limits.
- **Unmanaged results bucket** — accumulates cost; lifecycle it.

## Scenario — 1.2 TB → 8 GB

A dashboard query scanned **1.2 TB** and cost dollars each run. Diagnosis (from the query statistics): the table was **unpartitioned gzipped JSON** and the query did **`SELECT *`**. Fixes applied in order: **CTAS to Snappy Parquet partitioned by date**; enable **partition projection**; **compact** to ~256 MB files; rewrite the query to **select only the 4 needed columns** with a **date filter**. The same query now scans **~8 GB — about 150× less** — running in seconds for cents. To prevent recurrence, the team put the dashboard's queries in a **workgroup with a 50 GB per-query scan limit** and **tagged** it for cost tracking. Nothing about Athena's "speed" changed — the **data layout and query** did, and in Athena that **is** the performance tuning.

## Practice

1. Why are performance and cost the same problem in Athena?
2. List the optimization levers in priority order and what each reduces.
3. Why is columnar + compression usually the biggest single win?
4. How do bucketing/sorting handle high-cardinality keys without partition explosion?
5. What do workgroups let you enforce, and how do they cap cost?
6. Which engine features (result reuse, approximate functions, CTAS pre-agg) save scans?
7. Diagnose and optimize a query that scans 1.2 TB and is slow/expensive.
