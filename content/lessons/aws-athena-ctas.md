# Athena CTAS, INSERT INTO & SQL ELT — the complete guide

Athena isn't only a reader — **CTAS** and **INSERT INTO** let it **write** optimized tables, so you can build and maintain a curated lake layer with **pure SQL**, no Spark or Glue job required for many transformations. This chapter covers both, the partition limits, and where to graduate to Iceberg or Spark.

@@diagram:aws-athena-ctas

## 1. CTAS — CREATE TABLE AS SELECT

CTAS materializes a query's results as a **new table** — writing **S3 data** and a **catalog entry** — and lets you choose the **output format, compression, partitioning, and bucketing**:

```sql
CREATE TABLE clean.orders
WITH (
  format = 'PARQUET',
  write_compression = 'SNAPPY',
  partitioned_by = ARRAY['year','month'],
  bucketed_by = ARRAY['customer_id'], bucket_count = 32,
  external_location = 's3://lake/clean/orders/'
) AS
SELECT order_id, customer_id, amount, year, month
FROM raw.orders
WHERE amount IS NOT NULL;
```

The classic use is the **"optimize the lake" move**: convert raw **CSV/JSON → partitioned, compressed Parquet** in **one statement**, so every downstream query (Athena, Spectrum, EMR) prunes and reads columns, scanning a fraction of the bytes.

## 2. INSERT INTO

Append query results to an **existing** table (writing new files/partitions):

```sql
INSERT INTO clean.orders
SELECT order_id, customer_id, amount, year, month
FROM raw.orders
WHERE year = 2025 AND month = 6;
```

Use it for **incremental** loads: build the table once with CTAS, then `INSERT INTO` each new period.

## 3. The CTAS + INSERT INTO pattern

```
CTAS (bulk convert/build optimized table)  →  INSERT INTO (append each new period)
```

This gives you a maintained, optimized curated table with **SQL only**.

## 4. Partition limits & backfills

A single CTAS or INSERT INTO has a **cap on the number of partitions** it can create in one statement (e.g. 100). So a **large backfill** that spans many partitions must **loop per period** (e.g. one INSERT per month) rather than one giant statement. Plan backfills as a loop over partitions.

## 5. Practical notes

- Outputs are **real S3 Parquet + catalog tables** — readable by every engine, not an Athena-only artifact.
- Choose **partitioning** to match downstream filters (date) and **bucketing** for high-cardinality join keys.
- Set a sensible **`external_location`** in your curated zone.
- **Idempotency**: re-running a CTAS requires the target not to exist (or drop first); INSERT INTO **appends**, so guard against double-loading the same period (e.g. delete/overwrite that partition first, or track loaded periods).
- For **UPDATE/DELETE/MERGE**, use **Iceberg** (next lesson), not plain CTAS/INSERT.

## 6. When to graduate beyond CTAS/INSERT

- **Mutability needed** (updates, deletes, upserts, CDC, GDPR) → **Iceberg** tables (`MERGE INTO`).
- **Complex/procedural logic, ML featurization, very messy parsing, huge multi-stage pipelines** → **Glue/EMR Spark** (DynamicFrames, full control).
- Otherwise, **CTAS/INSERT INTO** is the simplest path for set-based SQL ELT.

## 7. Gotchas

- **Partition cap per write** → loop backfills per period.
- **Double-loading** with INSERT INTO → make loads idempotent (overwrite the target partition or track periods).
- **CTAS target exists** → CTAS fails; drop or use a new name.
- **Tiny files** from many small INSERTs → periodically compact (CTAS rewrite or Glue) or use Iceberg + OPTIMIZE.
- **No updates/deletes** in plain tables → use Iceberg.
- **Forgetting partitioning/compression** in the CTAS → you've copied data without optimizing it.

## Scenario — building the curated layer with only SQL

A raw zone holds **unpartitioned gzipped JSON** that's slow and expensive to query. With **one CTAS**, the team rewrites it as **Snappy Parquet partitioned by year/month** in `clean/`, registered in the catalog — instantly every downstream query prunes and reads only needed columns, scanning a fraction of the bytes. Because the history spans more partitions than a single CTAS allows, they **loop the CTAS/INSERT per month** for the backfill to stay under the partition cap. Going forward, a scheduled **`INSERT INTO`** appends just the new month each cycle (overwriting the target partition first to stay **idempotent**). No Spark or Glue job exists — the entire **optimize-and-maintain** loop is SQL in Athena. When they later need to apply **GDPR deletes**, they migrate the table to **Iceberg** for `DELETE`/`MERGE`. CTAS/INSERT got them a fast, cheap curated layer with minimal machinery.

## Practice

1. What does CTAS create, and what options control the output (format/partitioning/bucketing)?
2. What is INSERT INTO for, and how does the CTAS + INSERT pattern work?
3. What is the per-write partition limit, and how does it affect backfills?
4. How do you keep INSERT INTO loads idempotent?
5. When should you graduate from CTAS/INSERT to Iceberg or to Glue/Spark?
6. Convert unpartitioned JSON into an optimized, maintained table using SQL only.
7. List CTAS/INSERT gotchas (partition cap, double-load, tiny files, no updates).
