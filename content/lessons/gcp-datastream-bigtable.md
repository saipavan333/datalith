# Datastream & Bigtable — hands-on

Get operational data into the lakehouse (CDC) and serve it at massive scale (NoSQL).

@@diagram:gcp-datastream-bigtable

## 1. Datastream — serverless CDC into BigQuery

```text
Source: Cloud SQL / MySQL (binlog) or PostgreSQL (logical replication) or Oracle
   │  Datastream reads the transaction log (low impact on the source)
   ▼
Destination A:  BigQuery  → continuously-synced tables (near-real-time, no code)
Destination B:  GCS       → change files, then a Dataflow template → BigQuery (with transforms)
```

- Initial **backfill** of existing rows, then **CDC** streams inserts/updates/deletes from the **log**.
- **Datastream → BigQuery** keeps tables fresh with **no pipeline to write**.
- Use **Datastream → Dataflow → BigQuery** when you need to **transform** in flight.

## 2. Bigtable — wide-column NoSQL, key design is everything

```bash
cbt createtable events families=cf
# row key drives performance: data is SORTED by key, partitioned by key range
#   GOOD: user#42#20250301T1000   (distributes by user, time-ordered per user)
#   BAD:  20250301T1000           (sequential timestamp -> all writes hit one node = hotspot)
cbt set events 'user#42#20250301T1000' cf:page=/home
cbt read events prefix=user#42           # fast range scan by key prefix
```

- **Single-digit-ms** reads/writes at **huge** QPS; **HBase API**; **no joins**.
- Great for **time-series, IoT, ad-tech, user profiles** — operational/serving, not analytics.

## 3. How each feeds analytics

- **Datastream** lands relational data **directly** in BigQuery/GCS — it *is* the analytics path.
- **Bigtable** is a serving store; for analytics, **export to BigQuery** or process with **Dataflow**.

## 4. Choosing

- Relational source → **Datastream** (CDC into the lakehouse).
- Massive low-latency key/value or time-series serving → **Bigtable**.

## Scenario — fresh orders + a high-QPS profile store

Orders live in **Cloud SQL (MySQL)**; **Datastream** backfills then **CDC**-streams them **directly into BigQuery**, so analysts see near-real-time orders with **no pipeline code** and minimal load on MySQL (log reading). Separately, the app serves **user profiles** at 1M+ QPS from **Bigtable**, with a row key of `userId` (well-distributed) and column families for profile fields — single-digit-ms lookups, no joins. Nightly, profile snapshots **export to BigQuery** for analytics. Two operational sources, two right-sized tools, both feeding the lakehouse.

## Practice

1. Configure (in words) a Datastream stream: MySQL → BigQuery with backfill + CDC; say why it's low-impact.
2. When would you choose Datastream → Dataflow → BigQuery over Datastream → BigQuery directly?
3. Design a Bigtable row key for per-user time-series that avoids hotspots, and explain why.
4. Explain why analytics on Bigtable data is done after exporting to BigQuery.
