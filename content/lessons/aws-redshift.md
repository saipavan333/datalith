# Amazon Redshift — hands-on warehouse

The MPP columnar warehouse: architecture, the tuning levers that actually matter, and how it reaches the lake and streams.

@@diagram:aws-redshift

## 1. Provisioned (RA3) vs Serverless

- **RA3**: you pick node type/count; **managed storage** (RMS on S3) scales independently of compute. Best for steady, predictable load.
- **Serverless**: no cluster to size — pay **RPUs by the second**, autoscale, auto-pause. Best for spiky/unknown load and getting started.

```sql
-- Serverless: just create a namespace + workgroup in the console/API, then connect and CREATE TABLE.
```

## 2. The two tuning levers that matter most

### Distribution style — where rows live across slices

```sql
CREATE TABLE customers (customer_id bigint, name varchar(200), tier varchar(20))
DISTSTYLE ALL;                    -- small dimension: replicate to every node

CREATE TABLE orders (
  order_id bigint, customer_id bigint, order_ts timestamp, amount numeric(12,2)
)
DISTKEY (customer_id)             -- co-locate with customers for the join
SORTKEY (order_ts);              -- range filters on time skip blocks (zone maps)
```

- **KEY**: rows with the same key land on the same slice → joins run **locally**, no network shuffle. Use on the **join column**.
- **ALL**: replicate a **small** dimension everywhere (no shuffle for its joins).
- **EVEN / AUTO**: spread evenly / let Redshift decide (good default before you know patterns).

### Sort key — order on disk

Sorting by `order_ts` lets `WHERE order_ts BETWEEN …` **skip blocks** via zone maps. Pick the column(s) you filter ranges on.

## 3. Loading & writing back

```sql
-- Bulk, parallel load from S3 (the standard path)
COPY orders FROM 's3://acme-lake/curated/orders/'
IAM_ROLE 'arn:aws:iam::123:role/redshift-load'
FORMAT AS PARQUET;

-- Export results back to the lake
UNLOAD ('select * from daily_spend')
TO 's3://acme-lake/exports/daily_spend/'
IAM_ROLE 'arn:aws:iam::123:role/redshift-load' FORMAT PARQUET PARTITION BY (dt);
```

## 4. Reach the lake with Spectrum (no load)

```sql
CREATE EXTERNAL SCHEMA lake
  FROM DATA CATALOG DATABASE 'curated'
  IAM_ROLE 'arn:aws:iam::123:role/redshift-spectrum';

-- join hot warehouse data to cold lake data in one query
SELECT o.customer_id, sum(e.amount)
FROM orders o JOIN lake.events e ON e.user_id = o.customer_id
WHERE e.dt = '2025-03-01'
GROUP BY 1;
```

## 5. Near-real-time: streaming ingestion & Zero-ETL

```sql
-- Pull a Kinesis stream straight into a materialized view
CREATE EXTERNAL SCHEMA kds FROM KINESIS IAM_ROLE 'arn:aws:iam::123:role/rs-stream';
CREATE MATERIALIZED VIEW clicks_mv AUTO REFRESH YES AS
  SELECT approximate_arrival_timestamp AS ts,
         json_extract_path_text(from_varbyte(kinesis_data,'utf-8'),'user_id') AS user_id
  FROM kds."clickstream";
```

- **Streaming ingestion** (Kinesis/MSK → MV): event data, seconds-fresh.
- **Zero-ETL** (Aurora/RDS/DynamoDB → Redshift): operational tables auto-replicated, no pipeline to maintain.

## 6. Concurrency, MVs & maintenance

- **Materialized views** precompute hot aggregates (`AUTO REFRESH`).
- **Concurrency Scaling** adds transient capacity for query spikes; **WLM** queues isolate workloads.
- **Data sharing** exposes data to other Redshift warehouses without copying.
- Redshift largely **auto-VACUUM/ANALYZE**es, but watch table stats and unsorted regions on big churny tables.

## 7. Tuning checklist

1. **DISTKEY** on the main join column (or **DISTSTYLE ALL** for small dims).
2. **SORTKEY** on the common range filter (often time).
3. Load with **COPY** from Parquet in S3 (parallel).
4. **Materialized views** for repeated aggregates; **result caching** is automatic.
5. Use **Spectrum** for cold/rarely-joined data instead of loading everything.
6. **Concurrency Scaling** + **WLM** for many simultaneous users.

## Scenario — dashboards that were slow on Athena

BI dashboards hit Athena all day; per-scan cost and latency crept up. The team moved the marts to **Redshift Serverless**: `COPY` the curated Parquet in, `orders` distributed `DISTKEY(customer_id)` + `SORTKEY(order_ts)`, `customers` `DISTSTYLE ALL`, and a **materialized view** for the daily-active-users panel. Dashboards now return **sub-second** with **Concurrency Scaling** absorbing the 9am rush, while rarely-touched history stays in S3 and is reached via **Spectrum** only when needed — fast where it matters, cheap where it doesn't.

## Practice

1. You join `events` to `users` on `user_id` and filter `events` by date. Give DISTKEY/SORTKEY for both tables (users is small) and justify each.
2. Write the `COPY` to bulk-load Parquet `orders` from S3 using an IAM role.
3. Create an external schema for `curated` and a query joining a Redshift table to a Spectrum table.
4. Pick streaming ingestion vs Zero-ETL for: (a) clickstream events, (b) the orders table in Aurora — and say why.
