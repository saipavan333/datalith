# Data warehousing in depth

A data warehouse is a system built specifically to **analyze** large volumes of data
fast. This guide covers what makes warehouses special, how they're architected, how
you model and load them, and how the big cloud warehouses differ.

## 1. Why a warehouse exists

Operational (OLTP) databases run the business — many tiny reads/writes. Asking them
big analytical questions ("revenue by region for two years") would scan millions of
rows and starve the live app. A **warehouse** is a separate, read-optimized system you
load business data into, so analysts can run heavy queries without touching production.

@@diagram:oltp-olap-flow

## 2. What makes warehouses fast: columnar + MPP

Two design choices do the heavy lifting:

- **Columnar storage** — data is stored column-by-column, so a query reading 3 of 50
  columns touches only those 3, and each column compresses well. 10–100× less I/O than
  a row store for analytics.
- **MPP (Massively Parallel Processing)** — the warehouse spreads data and query work
  across many nodes that each process a slice in parallel, then combine results.

@@diagram:row-vs-column

## 3. Architecture & data distribution

In an MPP warehouse, **how data is spread across nodes** decides performance:

- **Distribution key** (Redshift) / **clustering** — controls which node a row lives
  on. Joining two big tables on the same distribution key keeps matching rows on the
  same node (no network shuffle).
- **Sort key / clustering key** — keeps data ordered so the engine skips blocks that
  can't match (data skipping via min/max).

Choosing these well is classic warehouse tuning; choosing badly causes skew and
shuffles.

## 4. Modeling: the star schema in the warehouse

Warehouses are modeled **dimensionally** (Kimball): a central **fact** table of events
surrounded by **dimension** tables of context. Analysts join fact to dimensions and
aggregate. Warehouses deliberately **denormalize** for read speed.

@@diagram:star-schema

## 5. Loading the warehouse (ELT)

Modern practice is **ELT**: extract from sources, **load raw** into the warehouse,
then **transform** in-warehouse (often with dbt) into clean star schemas. Loads are
usually **incremental** (only new/changed rows via a high-water mark) and
**idempotent** (safe to re-run). Bulk-load utilities (Snowflake `COPY`, Redshift
`COPY`, BigQuery load jobs) move data efficiently — never row-by-row.

## 6. The big cloud warehouses

- **Snowflake** — separates storage from compute; independent **virtual warehouses**
  scale per team against shared data; multi-cloud; very easy to operate.
- **BigQuery** (Google) — fully **serverless**: no clusters to size, billed by **data
  scanned**, scales automatically.
- **Redshift** (AWS) — the established AWS warehouse with clusters (distribution/sort
  keys) and a serverless option.
- **Synapse** (Azure), **Databricks SQL** (lakehouse) — other major options.

All are columnar + MPP; the cost lever is the same everywhere: **scan less** (partition/
cluster, select fewer columns).

## 7. Warehouse vs lake vs lakehouse

- **Data lake** — cheap object storage of raw files (any format), schema-on-read,
  massive scale, but no built-in reliability/transactions. Great for raw/unstructured
  data and ML.
- **Data warehouse** — structured, reliable, fast SQL analytics, but historically
  pricier and less flexible for raw/unstructured data.
- **Lakehouse** — lake storage + a transaction layer (Delta/Iceberg) to get warehouse
  reliability *on* the lake — converging the two.

The modern trend is the lakehouse, but classic cloud warehouses remain everywhere, and
the concepts (columnar, MPP, star schemas, ELT) apply across all of them.

## 8. Performance habits

- Partition/cluster by your common filter (usually date) for pruning.
- Select only needed columns; filter early.
- Pre-aggregate heavy, repeated rollups into summary tables (gold layer).
- Mind data distribution to avoid shuffles on big joins.
- Cost ∝ data scanned — efficiency and cost are the same lever.

## Interview check

> *"What makes a data warehouse fast for analytics, and how do you model it?"*

Columnar storage (reads only needed columns, compresses) plus MPP (parallel across
nodes), tuned by data distribution/sort keys. You model it dimensionally — fact tables
surrounded by dimensions (star schema), denormalized for read speed — and load it via
ELT (load raw, transform in-warehouse), incrementally and idempotently.
