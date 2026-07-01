# The data lake in depth

A data lake stores **any** data — structured, semi-structured, or unstructured — as
files in cheap, massively scalable object storage. This guide covers how lakes work,
how to organize one well, the pitfalls, and how the lakehouse fixes them.

## 1. What a data lake is

A lake is **object storage** (Amazon S3, Google GCS, Azure ADLS) holding **files**:
Parquet, JSON, CSV, images, logs — anything. Unlike a warehouse, there's no fixed
schema up front; you store raw data cheaply and decide its shape when you read it
(**schema-on-read**). This makes lakes ideal for raw ingestion, semi/unstructured
data, and machine learning.

## 2. Why object storage is the backbone

- **Cheap** — pennies per GB, far less than warehouse storage.
- **Practically infinite scale** — store petabytes without capacity planning.
- **Durable & available** — providers replicate data across machines/zones.
- **Decoupled from compute** — many engines (Spark, Trino, your warehouse) read the
  same files; you scale storage and compute independently.

## 3. File formats matter

The format you store determines speed and cost:

- **Parquet/ORC** — columnar, compressed; the analytics default (reads only needed
  columns).
- **Avro** — row-based with schema; good for streaming/record-by-record.
- **JSON/CSV** — human-readable, for exchange/landing, but bulky and slow at scale.

@@diagram:row-vs-column

## 4. Organize it: zones and partitioning

A good lake is organized, not a dumping ground. Use **zones** (the medallion idea):

@@diagram:medallion

- **Raw/bronze** — data exactly as received, immutable, your replayable source of truth.
- **Cleaned/silver** — validated, de-duplicated, conformed.
- **Curated/gold** — business-ready aggregates.

And **partition** big datasets by a filter column (usually date) so queries read only
relevant folders:

```
s3://lake/events/date=2025-05-01/part-0001.parquet
s3://lake/events/date=2025-05-02/...
```

@@diagram:lakehouse-layout

## 5. The pitfalls (why "data swamp" is a thing)

A lake without discipline rots into a **data swamp**:

- **No transactions** — a job crashing mid-write leaves half-written, corrupt files a
  reader might pick up.
- **No updates/deletes** — Parquet is immutable; you can't easily fix a row or honor a
  GDPR delete.
- **Small-files problem** — millions of tiny files (from streaming) make reads crawl.
- **No schema enforcement** — anything can land, so quality drifts.
- **No catalog** — nobody knows what's there or what it means.

## 6. The fix: the lakehouse

Open **table formats** (Delta, Iceberg, Hudi) add a transaction log over the files,
giving the lake **ACID transactions, row-level updates/deletes, time travel, and
schema enforcement** — warehouse reliability on lake storage. A shared **catalog**
(Glue, Unity, Nessie) makes tables discoverable and governed.

@@diagram:lakehouse

That combination — cheap lake storage + a transaction layer — is the **lakehouse**, and
it's why you rarely build a "raw" lake without a table format today.

## 7. When to use a lake (vs a warehouse)

- **Lake**: raw/unstructured data, ML/data science, cheap long-term storage, schema-on-
  read flexibility, multi-engine access.
- **Warehouse**: structured, governed, fast SQL/BI on clean data.
- **Lakehouse**: increasingly, both — one storage layer serving raw data, BI, and ML.

## Interview check

> *"What is a data lake, and what's the catch?"*

Cheap, infinitely scalable object storage for files of any type with schema-on-read —
great for raw and unstructured data and ML. The catch: no transactions, no easy
updates/deletes, the small-files problem, and quality/governance drift ("data swamp").
Open table formats (the lakehouse) add ACID, updates, and time travel to fix exactly
those gaps.
