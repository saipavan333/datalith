# OLTP vs OLAP — and why analytics needs its own system

This distinction explains the entire shape of a data platform: why companies copy
data out of their app databases into warehouses, and why columnar storage exists.

@@diagram:oltp-olap-flow

## Two opposite workloads

| | OLTP (transactional) | OLAP (analytical) |
|---|---|---|
| Job | Run the business | Analyse the business |
| Reads/writes | Many tiny, point operations | Few huge scans |
| Example query | "Get order #4521" | "Revenue by category, 2 years" |
| Rows touched | One or a few | Millions |
| Columns touched | All of a row | A few of many |
| Storage | Row-oriented | Column-oriented |
| Optimised for | Concurrency, fast writes | Scan throughput, compression |

OLTP and OLAP pull hardware in opposite directions, which is why you don't run heavy
analytics on your live app database — the big scans would starve the checkout.

## Row vs column storage (the core mechanism)

A **row store** keeps each record's fields together on disk:

```
[id=1,name=Ava,country=India,amount=100][id=2,name=Liam,country=USA,amount=50]...
```

Great for "fetch the whole order #1" (one seek). Bad for "average amount over a
billion rows" — you must read every field of every row just to get `amount`.

A **column store** keeps each column together:

```
id:      [1, 2, 3, ...]
amount:  [100, 50, 75, ...]      ← read only this for SUM(amount)
country: [India, USA, ...]
```

"Average amount" reads only the `amount` column — a fraction of the data. And because
a column holds similar values, it **compresses** far better (run-length, dictionary
encoding). This is why Parquet and analytical warehouses are columnar, and why an
OLAP query can be 10–100x faster and cheaper than the same scan on a row store.

## Why copy data between them

The app's OLTP database is the **source of truth** but a terrible place to analyse.
So a pipeline **extracts** data from OLTP systems and **loads** it into an OLAP
warehouse/lakehouse, where analysts run big queries without touching production. That
copy-and-reshape is, in one sentence, what a huge share of data engineering *is*.

## HTAP — blurring the line

Some modern systems (HTAP — Hybrid Transactional/Analytical Processing) try to serve
both on one engine, often by keeping a row store for writes and a column store for
reads in sync. Useful, but the classic split still drives most architectures, and the
row-vs-column reasoning is what interviews probe.

## Cheat sheet

| | OLTP | OLAP |
|---|---|---|
| Purpose | run the business | understand the business |
| Workload | many small reads/writes | few large scans/aggregations |
| Concurrency | very high | low |
| Storage | row-oriented | column-oriented |
| Schema | normalized (3NF) | denormalized (star schema) |
| Transactions | ACID, single-row | read-mostly, bulk loads |
| Latency goal | ms per operation | throughput over big data |
| Examples | PostgreSQL, MySQL | Snowflake, BigQuery, Redshift |
| The DE job | extract/CDC out of it | load + model into it |

**One-liner:** OLTP runs the business; OLAP understands it; the pipeline connects them.

## Interview questions

**Q (Amazon, very common): "Why is a columnar format faster for analytics than a row format?"**
Analytics scans a few columns over many rows. A column store reads only the columns the query needs (skipping the rest) and, because each column holds similar values, compresses far better — so it moves a small fraction of the data. A row store must read whole rows even to get one field. Tie it back to architecture: that's exactly why we copy OLTP data into a columnar OLAP system instead of querying production.

**Q (Google): "Why not just run analytical queries directly on the production database?"**
Because OLTP and OLAP optimize for opposite things, and a big analytical scan on the live database would contend for the same CPU, memory, locks, and I/O that the application needs — slowing or stalling checkout/login for real users. The production DB is also normalized and row-oriented, which is slow for aggregations. So you extract (batch or CDC) into a separate columnar warehouse where heavy queries run in isolation, denormalized for scan speed, without ever threatening the customer-facing system.

**Q (Goldman Sachs): "Explain normalization vs denormalization and why each fits its system."**
Normalization (3NF) removes redundancy by splitting data into many related tables — ideal for OLTP, where you want integrity and cheap single-row writes/updates without anomalies. Denormalization deliberately re-introduces redundancy (wide star-schema fact and dimension tables) — ideal for OLAP, where you want to avoid expensive joins on huge scans and maximize read throughput. The workload drives the choice: many small writes favor normalized row stores; few big reads favor denormalized column stores.

**Q (Meta): "What is CDC and where does it fit in the OLTP→OLAP story?"**
Change Data Capture reads the OLTP database's transaction log to stream inserts/updates/deletes as they happen, instead of repeatedly bulk-extracting whole tables. It fits as the ingestion mechanism that keeps the OLAP warehouse continuously in sync with the operational source — low-latency, low-load on the source (it reads the log, not the tables), and it captures deletes that naive "select changed rows" approaches miss. It's how you get near-real-time analytics without hammering production.

**Q (Snowflake/Databricks): "What is HTAP and does it make the OLTP/OLAP split obsolete?"**
HTAP (Hybrid Transactional/Analytical Processing) systems try to serve both workloads on one engine, often by maintaining a row store for writes and an in-sync column store for reads. It's genuinely useful for "fresh analytics on operational data" use cases. But it doesn't make the split obsolete: the underlying row-vs-column tension is physical, most architectures still separate the two for isolation and cost, and the reasoning interviewers test — why columnar, why denormalized, why separate — still holds. HTAP blurs the line; it doesn't erase the physics.

## Practice

1. For the same customer data, describe the OLTP layout vs the OLAP layout and why each suits its workload.
2. Explain to a PM why "just add the dashboard query to the app database" is a bad idea.
3. Define CDC in one sentence and give one advantage over nightly full extracts.
