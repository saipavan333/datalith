# MPP & Greenplum — parallel analytical databases

Before cloud warehouses, the way to query multi-terabyte data fast was **MPP (Massively Parallel Processing)**: a
**shared-nothing** cluster where many nodes each own a slice of the data and process it **in parallel**. **Greenplum**
(Postgres-derived, still heavily used in banks and enterprises) is the classic example — and understanding it makes you
fluent in both on-prem warehouses *and* their cloud successors.

@@diagram:mpp-greenplum

## The architecture

- **Coordinator (master)** — receives the SQL, parses it, builds a **parallel plan**, dispatches it to the segments,
  and **gathers** the results. It holds **no user data**.
- **Segments** — the workers. Each is its own Postgres instance with its **own CPU, memory, and disk**
  (shared-nothing), holding a **distinct slice** of every table. One query runs on **all segments simultaneously**.
- **Interconnect** — the network layer segments use to shuffle data between each other for joins and aggregations.

This is the same idea as Spark (partition the data, process in parallel, shuffle when needed) — just packaged as a SQL
database.

## The decision that makes or breaks performance: distribution

You choose how each table spreads across segments with **`DISTRIBUTED BY (key)`** (hash) or `DISTRIBUTED RANDOMLY`.
This is the **#1 performance lever**:

- **Good key** (high-cardinality, evenly spread, often the join key) → work spreads evenly and joins stay **local** on
  each segment (no data movement).
- **Bad key** (low-cardinality or heavily null) → **data skew** (one segment does most of the work; the whole cluster
  waits for it) or expensive **redistribution** when joining.

```sql
-- co-locate fact and dimension on the same key → joins are local, no interconnect shuffle
CREATE TABLE fact_txn (txn_id bigint, account_id bigint, amount numeric, txn_ts timestamp)
  WITH (appendoptimized=true, orientation=column, compresstype=zstd)
  DISTRIBUTED BY (account_id);

CREATE TABLE dim_account (account_id bigint, ...) DISTRIBUTED BY (account_id);
-- SELECT ... FROM fact_txn JOIN dim_account USING (account_id)  -- runs locally per segment
```

## Storage built for analytics

Greenplum supports **append-optimized, column-oriented** tables with **compression** — ideal for OLAP (scan a few
columns across many rows), exactly like cloud columnar warehouses. Use append-optimized columnar for big fact tables;
heap (row) storage for small, frequently-updated tables.

## MPP vs cloud warehouses (2026)

MPP pioneered parallel analytics, but it **couples storage and compute** on fixed hardware — you scale them together
and pay for the cluster always. Cloud warehouses (Snowflake / BigQuery / Databricks) **separate** storage and compute
for elasticity and lower ops, which is why many enterprises are **migrating Greenplum → cloud**. The concepts transfer
directly:

| Greenplum | Cloud-warehouse equivalent |
|---|---|
| distribution key | clustering / partitioning |
| segments | elastic cloud compute |
| append-optimized columnar + compression | the same columnar storage |
| coupled storage+compute | **separated** storage & compute |

Knowing MPP means you can run the warehouses banks still depend on **and** lead their migration to the cloud.

## Practice

1. What does the Greenplum coordinator hold, and what do segments do?
2. Why is the distribution key the most important performance decision?
3. How do you choose a good distribution key?
4. Map three Greenplum concepts to their cloud-warehouse equivalents.
