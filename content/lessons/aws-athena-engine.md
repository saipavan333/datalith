# Athena: the engine, serverless SQL & pay-per-scan — the complete guide

Athena is the default way to run SQL on an AWS data lake, and its **pricing model** — pay per byte scanned, no cluster — shapes every decision you make. Understand the engine and the cost model and you understand why "lay the data out well" is the whole job. This chapter is the foundation for the rest of the Athena module.

@@diagram:aws-athena-engine

## 1. What Athena is

**Athena** runs **ANSI SQL directly on data in S3** with **no servers** to provision or manage. Under the hood it's managed **Trino/Presto** (a distributed SQL engine). It uses the **Glue Data Catalog** for table metadata and scans the underlying S3 files at query time.

## 2. How a query executes

1. You submit SQL referencing a **catalog table** (`db.table`).
2. Athena reads the table's **schema, S3 location, partitions, and format** from the Glue Catalog.
3. It **prunes** to the relevant partitions/files (from `WHERE` on partition columns), then **scans** the needed data from S3 in a **distributed** fashion.
4. It computes the result, writes it to the configured **S3 results location**, and returns it (console / JDBC / ODBC / API / SDK).

There is **no cluster** running before or after — compute is spun up per query and you're billed for the work.

## 3. The pricing model drives everything

The standard Athena engine bills **per terabyte of data scanned** (with a small per-query minimum) and **nothing when idle**. There's an alternative **provisioned-capacity** model (capacity units) for predictable heavy use, but the default mental model is: **you pay for bytes read.**

This single fact dictates optimization. To make queries **cheaper and faster** (same thing in Athena), **read fewer bytes**:
- **Columnar formats** (Parquet/ORC) → read only needed columns.
- **Compression** (Snappy/ZSTD) → fewer bytes per column.
- **Partition pruning** → skip irrelevant prefixes.
- **Compact files** → less overhead.
- **Select only needed columns** → never `SELECT *` on wide tables.

(Each is covered in depth in later lessons.)

## 4. What Athena is great for

- **Ad-hoc / exploratory** SQL on the lake — no warehouse to run or pay for when idle.
- **Intermittent** workloads — pay per query, zero standing cost.
- **Lightweight serving** of curated S3 data to BI tools.
- **SQL ELT** (CTAS/INSERT INTO) to build optimized tables without a separate engine.
- **One query across the lake + other stores** (federated queries).

## 5. What Athena is not

- Not a **high-concurrency, low-latency** dashboard engine for thousands of users at sustained scale — a tuned **Redshift** or serving layer fits better there.
- Not a substitute for good **data layout** — on badly laid-out data it scans everything and feels "slow and expensive" (which is really the data's fault).
- Not transactional/OLTP.

## 6. Operational basics

- **Results location** — set an S3 location (and lifecycle it; results accumulate).
- **Workgroups** — isolate teams, set **scan limits**, results location, encryption (perf lesson).
- **Engine version** — keep current for performance/features.
- **Result reuse/caching** — repeated identical queries can return cached results without re-scanning.
- **Federation, Iceberg, UDFs, Spark** — extend Athena's reach (advanced lesson).

## 7. Gotchas

- **`SELECT *` on wide tables** — reads every column; project only what you need.
- **No partition filter** — scans the whole table; always filter on partition keys.
- **Row formats (CSV/JSON) / unsplittable gzip** — scan far more than columnar Parquet.
- **Tiny files** — overhead and slow planning; compact.
- **Treating Athena like a 24/7 dashboard warehouse** — at high sustained concurrency, Redshift/serving is better.
- **Unmanaged results bucket** — accumulates cost; lifecycle it.

## Scenario — the same query, cents vs dollars

An analyst runs `SELECT country, sum(amount) FROM curated.orders WHERE year=2025 AND month=5 GROUP BY country`. Because `orders` is **partitioned Parquet (Snappy)**, Athena **prunes** to May-2025 prefixes and reads **only** the `country` and `amount` columns — a few GB — returning in seconds for a few cents, with **no cluster** running before or after. Stored instead as **unpartitioned gzipped JSON** with a `SELECT *`, the identical question would scan the **entire history** (terabytes), costing dollars and running slowly. Nothing about Athena changed — only the **data layout** and the **columns selected**. That's the lesson the whole module builds on: in Athena, **bytes scanned = cost = latency**, and you control bytes scanned with layout and SQL discipline.

## Practice

1. What is Athena under the hood, and what does it use for table metadata?
2. Walk through how a query executes from submission to results.
3. How is the standard engine priced, and what does that imply for optimization?
4. List five ways to reduce bytes scanned.
5. When is Athena a great fit, and when should you use Redshift/a serving layer instead?
6. A `SELECT *` on unpartitioned gzipped JSON is slow and costly — explain and fix.
7. What operational settings (results location, workgroups, caching) should you configure?
