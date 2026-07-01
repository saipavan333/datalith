# Athena partitioning & partition projection — the complete guide

Partition pruning is the single biggest cost/performance lever in Athena, and **partition projection** is the production-favorite that gives you full pruning while eliminating partition management entirely. This chapter covers registering partitions, projection, choosing partition columns, and when to use which.

@@diagram:aws-athena-partitioning

## 1. Why partitioning matters so much

Athena bills per byte scanned. A **partition** maps a `key=value` path prefix to metadata so that a `WHERE` on the partition column makes Athena **read only the matching prefixes** — skipping the rest of the dataset. A query for one month of a multi-year table can scan **1/36th** of the data. Without pruning, every query scans everything.

## 2. Registering partitions (the classic way)

For a partitioned external table, Athena must **know** a partition exists before it queries it:

```sql
-- register one partition explicitly
ALTER TABLE orders ADD PARTITION (year='2025', month='05')
  LOCATION 's3://lake/clean/orders/year=2025/month=05/';

-- discover and add ALL Hive-style partitions under the path
MSCK REPAIR TABLE orders;
```

- **`ADD PARTITION`** — precise, cheap per call; you (or a Lambda) run it as data lands.
- **`MSCK REPAIR TABLE`** — convenient (adds everything) but **re-scans the whole S3 path** each run → **slow and costly** on large tables; avoid as a routine job.
- **Crawler** — discovers partitions automatically (cost/latency; prior module).
- **Lambda on S3 object-created events** — event-driven `ADD PARTITION` so new partitions register on arrival.

## 3. Partition projection (the modern way)

**Partition projection** tells Athena how to **calculate** partition values from a **pattern** (declared in table properties) instead of storing each partition in the catalog. For predictable layouts — especially **dates** — Athena **derives** exactly which partitions a query needs from the `WHERE` clause:

```sql
ALTER TABLE orders SET TBLPROPERTIES (
  'projection.enabled' = 'true',
  'projection.year.type'  = 'integer', 'projection.year.range'  = '2020,2030',
  'projection.month.type' = 'integer', 'projection.month.range' = '1,12', 'projection.month.digits' = '2',
  'projection.day.type'   = 'integer', 'projection.day.range'   = '1,31',  'projection.day.digits'   = '2',
  'storage.location.template' = 's3://lake/clean/orders/year=${year}/month=${month}/day=${day}/'
);
```

Benefits:
- **No `ADD PARTITION`, no `MSCK`, no crawler** — zero partition management.
- **New data queryable instantly** — no registration step or lag.
- **Full pruning** with **no partition-metadata overhead** — scales to **millions** of partitions where catalog-based metadata would bog down planning.

Projection types include `integer`, `date` (with a format and range), `enum` (fixed set), and `injected` (value supplied in the query).

## 4. Choosing partition columns

- Partition on **low-cardinality columns you filter on** — **date** (`year/month/day` or `dt`) is canonical.
- Keep each partition **reasonably sized** (≥ ~128 MB–1 GB of data).
- **Avoid high-cardinality** partitions (`user_id`, `order_id`) — they create **millions of tiny partitions/files**, slowing planning and listing (handle high-cardinality filters with **sorting/clustering + columnar stats** instead).
- Don't over-nest (too many partition levels multiply tiny files).

## 5. Projection vs registration — when to use which

| Use **projection** | Use **registration/crawler** |
|---|---|
| Predictable, pattern-based values (dates, bounded ints, fixed enums) | Irregular/unpredictable partition values |
| Want zero partition management + instant freshness | Values can't be expressed as a pattern |
| Millions of partitions (metadata would bog down) | Small, ad-hoc partition sets |

For most **production date-partitioned tables**, **projection is the default**.

## 6. Gotchas

- **`MSCK REPAIR` as a routine job** → slow/expensive; switch to projection or targeted `ADD PARTITION`.
- **Missing partition registration** → new data **silently invisible** until added; projection avoids this.
- **High-cardinality partitioning** → partition explosion; partition on date, cluster on the high-cardinality key.
- **Projection range too narrow** → queries for out-of-range values return nothing; set ranges to cover the data (and future).
- **Not filtering on the partition column** → no pruning; the query scans everything regardless of partitions.
- **Path template mismatch** → projection points at the wrong prefix; verify `storage.location.template`.

## Scenario — deleting the hourly MSCK job

A team ran **`MSCK REPAIR TABLE`** every hour to pick up new daily partitions on a large, growing orders table. It **re-scanned the entire S3 path** each run (slow, costly) and added a **lag** before fresh data was queryable. Because the layout is a clean **date pattern**, they enabled **partition projection**: integer ranges for `year/month/day` and a `storage.location.template`. Now Athena **computes** the needed partitions straight from each query's `WHERE` clause — the hourly `MSCK` job is **deleted** (cost and latency gone), new days are queryable **the instant files land**, and pruning works even though there are tens of thousands of partitions, with **no catalog partition metadata** to maintain. They kept a small crawler only for one genuinely irregular feed. Projection turned partition management from a recurring chore into a one-time table-property setup.

## Practice

1. Why is partition pruning the top cost/performance lever in Athena?
2. Compare `ADD PARTITION`, `MSCK REPAIR`, crawler, and Lambda for registering partitions.
3. What is partition projection and what three benefits does it give?
4. Write projection properties for a `year/month/day` date layout.
5. How do you choose partition columns, and why avoid high-cardinality ones?
6. When would you use registration/crawler instead of projection?
7. A team runs hourly `MSCK REPAIR` and it's slow — recommend and justify a fix.
