# Amazon Athena — hands-on serverless SQL

Query S3 with no servers — and make every query scan less, because you pay per TB.

@@diagram:aws-athena

## 1. Define a table over S3 (partition projection)

```sql
CREATE EXTERNAL TABLE events (
  event_id string, user_id string, amount double
)
PARTITIONED BY (dt string)
STORED AS PARQUET
LOCATION 's3://acme-lake/curated/events/'
TBLPROPERTIES (
  'projection.enabled'='true',
  'projection.dt.type'='date',
  'projection.dt.range'='2024-01-01,NOW',
  'projection.dt.format'='yyyy-MM-dd',
  'storage.location.template'='s3://acme-lake/curated/events/dt=${dt}/'
);
```

**Partition projection** computes partitions from the rule above — no `MSCK REPAIR`, no crawler, even with thousands of daily partitions.

## 2. Scan less = pay less (the whole game)

```sql
-- GOOD: prunes to one partition, reads two columns
SELECT user_id, sum(amount) AS spend
FROM events
WHERE dt = '2025-03-01'
GROUP BY user_id;

-- BAD: no partition filter + SELECT * → scans every file, every column
SELECT * FROM events;
```

Athena bills ~**$5 per TB scanned**. Levers, in order of impact: **partition + filter**, **columnar Parquet**, **compression**, **select only needed columns**, **compact small files**.

## 3. Materialize curated tables with CTAS / INSERT

```sql
-- Build a partitioned Parquet rollup once; query it cheaply forever
CREATE TABLE daily_spend
WITH (format='PARQUET', partitioned_by=ARRAY['dt'])
AS SELECT dt, user_id, sum(amount) AS spend
   FROM events GROUP BY dt, user_id;

-- Append tomorrow's partition
INSERT INTO daily_spend
SELECT dt, user_id, sum(amount) FROM events
WHERE dt = '2025-03-02' GROUP BY dt, user_id;
```

## 4. Iceberg tables on Athena (row-level updates + time travel)

```sql
CREATE TABLE orders_ice (order_id bigint, status string, amount double)
PARTITIONED BY (day(order_ts))
LOCATION 's3://acme-lake/iceberg/orders/'
TBLPROPERTIES ('table_type'='ICEBERG');

UPDATE orders_ice SET status='REFUNDED' WHERE order_id = 42;   -- real updates!
DELETE FROM orders_ice WHERE amount <= 0;
SELECT * FROM orders_ice FOR TIMESTAMP AS OF (now() - interval '1' day);
```

Iceberg/S3 Tables also support **materialized views** so common rollups precompute.

## 5. Federated queries & cost guardrails

- **Federated queries**: query DynamoDB, RDS, JDBC sources, etc. via **Lambda connectors** and join them to S3 tables.
- **Workgroups**: set a **per-query bytes-scanned limit** (e.g., cap at 100 GB) and route teams to separate workgroups for cost tracking — so one runaway `SELECT *` can't scan a petabyte.

```bash
aws athena create-work-group --name analysts \
  --configuration '{"BytesScannedCutoffPerQuery":107374182400}'   # 100 GB cap
```

## 6. Performance checklist

1. Partition on the dominant filter; use **partition projection** for many partitions.
2. **Parquet + compression**; compact to ~128–512 MB files.
3. `SELECT` only needed columns; push down `WHERE`.
4. Pre-aggregate hot queries with **CTAS**.
5. Cap scans with **workgroup limits**.

## Scenario — the $200 query

An analyst's `SELECT * FROM events` (CSV, unpartitioned) scanned 4 TB and cost ~$20 a run, several times a day. The fix: **CTAS** to **Parquet partitioned by `dt`**, enable **partition projection**, and rewrite the query to `SELECT user_id, amount … WHERE dt = …`. Scan drops from 4 TB to ~3 GB — pennies per run — and a **workgroup** 100 GB cap guarantees no future query scans the whole table by accident.

## Practice

1. Write a partition-projection DDL for a Parquet `orders` table partitioned by `dt`.
2. Rewrite `SELECT * FROM orders` for "total revenue on 2025-03-01" so it scans the least data; name each optimization.
3. Create an Iceberg table and update one row's status — why is that impossible on a plain Parquet external table?
4. Set a workgroup that caps any query at 50 GB and explain what happens when a query exceeds it.
