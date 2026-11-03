# Datastream — change data capture from operational databases into BigQuery

The orders database changes every second; analysts want those changes in BigQuery within minutes, without nightly dumps that hammer the primary. **Datastream** is Google's serverless CDC service: it reads the database's own change log and keeps a BigQuery table (or files in Cloud Storage) in step.

@@diagram:gcp-datastream-cdc

## 1. Concept

- **Change log, not queries.** Datastream reads what the database already writes for replication: MySQL's binary log (row-based), PostgreSQL logical replication (a **publication** for the tables plus a replication slot, using the `pgoutput` plugin), Oracle logs, SQL Server CDC or transaction logs. Sources also include AlloyDB, Spanner, MongoDB and Salesforce (more SaaS sources in preview).
- **Two phases.** **Backfill** copies a snapshot of existing rows; **CDC** then streams ongoing inserts, updates and deletes.
- **Two BigQuery write modes.** **Merge**: the BigQuery table mirrors the source, one row per primary key, and `max_staleness` trades freshness against merge cost (lower = fresher and more expensive). **Append-only**: every change is a new row with `datastream_metadata` (`UUID`, `SOURCE_TIMESTAMP`, `CHANGE_SEQUENCE_NUMBER`, `CHANGE_TYPE` = `INSERT` / `UPDATE-INSERT` / `UPDATE-DELETE` / `DELETE`, `SORT_KEYS`). Tables without a primary key are always append-only.
- **Primary keys matter.** Supported key types include INT64, STRING, NUMERIC, DATE, TIMESTAMP; FLOAT keys are not replicated. BigQuery clusters on at most four columns, so Datastream uses the first four key columns.
- **Price (Nov 2026 list):** CDC $2.00/GiB for the first 2,500 GiB a month, then $1.50, $1.20, and $0.80 above 10,000 GiB; backfill free for the first 500 GiB a month, then $0.40/GiB; up to 100 GiB/month of CDC free from AlloyDB and Spanner. "Processed bytes" are an internal representation and can be **2-5x** the raw data size.

## 2. School-kid picture

Instead of photocopying the whole class register every evening (a nightly dump), you sit next to the teacher and copy each new line the moment she writes it: "Ravi present", "Meena moved to 7B". One photocopy at the start (backfill), then just the new lines (CDC).

## 3. Worked example: a payments ledger, 9,000 writes a second at peak

A fintech's `accounts` and `ledger_entries` tables on Cloud SQL for PostgreSQL: 300 GiB of raw changes a month.

1. On the source: enable logical decoding, `CREATE PUBLICATION ds_pub FOR TABLE public.accounts, public.ledger_entries;` and a replication slot for Datastream, plus a replication user. Publishing only the needed tables lowers load.
2. Stream: backfill + CDC into BigQuery, **merge mode** for `accounts` (analysts want current balance) with `max_staleness` of 15 minutes; **append-only** for `ledger_entries` (it is append-only in the source anyway, and auditors want every event).
3. Cost check: 300 GiB raw x 2-5 = 600-1,500 GiB processed = **$1,200-$3,000 a month** at the first-tier rate. Measure the real multiplier in the first week before promising a number.
4. Watch the replication slot: if Datastream stops reading, PostgreSQL keeps WAL for the slot and the source disk fills. Alert on slot lag.

## 4. Hands-on lab (runs locally)

The lab replays CDC events that arrive **out of order and duplicated** (normal with parallel readers and retries), and shows why you must order by source time, not arrival:

```bash
python labs/platforms/datastream_cdc_sim.py
```

Recorded output (2026-11-03):

```text
WRONG current state: last row by ARRIVAL order
   [(1, 470.0), (3, 1200.0)]
RIGHT current state: dedupe by uuid, latest by SOURCE_TIMESTAMP, drop deletes (what merge mode maintains)
   [(1, 450.0), (3, 1200.0)]

Cost check with the Nov-2026 list price (CDC $2.00/GiB for the first 2,500 GiB/month;
processed bytes can be 2-5x the raw row size per the pricing page):
    50 GiB raw changes x2 ->   100 GiB processed -> $200/month
    50 GiB raw changes x5 ->   250 GiB processed -> $500/month
   300 GiB raw changes x2 ->   600 GiB processed -> $1,200/month
   300 GiB raw changes x5 ->  1500 GiB processed -> $3,000/month
```

What to look for: account 1's two updates arrived in the wrong order; arrival order says 470, the truth is 450. If you build your own current-state view on an append-only table, use the pattern in the lab: `QUALIFY ROW_NUMBER() OVER (PARTITION BY pk ORDER BY datastream_metadata.source_timestamp DESC, datastream_metadata.change_sequence_number DESC) = 1` and drop deletes.

**Needs your account (free trial/tier):** a small Cloud SQL for PostgreSQL instance (trial credit), the publication + slot above, a Datastream connection profile and stream to a BigQuery dataset. Update a row and watch it appear; then stop the stream and check the slot's retained WAL growing. Delete the instance afterwards (it bills by the hour).

## 5. Gotchas

- **Replication slots fill disks.** A paused or broken stream on PostgreSQL retains WAL forever. Monitor and drop abandoned slots.
- **DDL changes.** Adding a column is usually picked up; renames and type changes need care and testing. Read the source-specific docs before a migration.
- **Merge mode cost.** Very low `max_staleness` on big tables means many background merges (BigQuery compute). Pick the freshness the business needs.
- **Primary keys.** No key means append-only; an unsupported key type means the table isn't replicated at all.
- **Deletes.** In append-only mode deletes are rows with `CHANGE_TYPE = 'DELETE'`; forget to filter them and deleted accounts come back to life in reports.

## 6. Quiz

1. Why does Datastream read the binlog/WAL instead of running `SELECT ... WHERE updated_at > ?`?
   - a) It's cheaper to license. *Wrong.*
   - b) **The log has every change including deletes, in commit order, without loading the tables.** *Right: polling misses deletes and rows without a reliable updated_at.*
   - c) SELECTs don't work on replicas. *Wrong.*
   - d) BigQuery requires it. *Wrong.*
2. Which mode gives auditors every historical change?
   - a) Merge. *Wrong: it keeps only the latest row per key.*
   - b) **Append-only.** *Right.*
   - c) Backfill only. *Wrong: a snapshot has no history.*
   - d) Neither. *Wrong.*
3. Your Datastream bill is 4x your estimate from raw row sizes. Most likely reason?
   - a) A bug. *Unlikely.*
   - b) **Processed bytes are an internal representation, often 2-5x raw size.** *Right: the pricing page says so.*
   - c) BigQuery storage. *Billed separately, not on the Datastream line.*
   - d) Backfill is always charged. *Wrong: the first 500 GiB/month are free.*

## 7. Exercises

**Warm-up.** Write the SQL for the current state of `accounts` from an append-only Datastream table. *Solution:* `SELECT * EXCEPT(rn) FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY datastream_metadata.source_timestamp DESC, datastream_metadata.change_sequence_number DESC) rn FROM raw.accounts) WHERE rn = 1 AND datastream_metadata.change_type != 'DELETE'`.

**Transfer.** The business wants 1-minute freshness on a 2 TB `orders` table. Merge mode with tiny `max_staleness`, or append-only plus your own view? *Solution:* measure first; for very fresh reads on a big table, append-only + a view that merges recent changes over a periodically compacted snapshot often costs less than constant merges. If 15 minutes is acceptable, merge mode is simpler. Write the freshness SLO down.

**Stretch.** Design CDC for 40 MySQL databases (one per tenant) into one BigQuery dataset. *Solution:* one stream per source database (or per group) with consistent naming, append-only landing tables partitioned by ingestion date, a Dataform layer that unions tenants with a `tenant_id` and builds current-state tables, Terraform for connection profiles and streams, alerts on stream errors and binlog retention, and a cost dashboard per stream from the billing export.

## 8. Interview questions

- **(Junior) What is CDC?** Capturing row-level inserts, updates and deletes from a database's change log and applying them downstream, instead of copying full tables.
- **(Mid) How do you get correct current state from out-of-order CDC events?** Deduplicate by event id, order by source commit time and sequence, keep the latest per key, apply deletes. Never trust arrival order.
- **(Senior) Datastream vs Debezium on Kafka vs a nightly export?** Datastream: managed, serverless, BigQuery-native merge, priced per GiB, fewer knobs. Debezium/Kafka: more control, multiple consumers, more ops and cost of a Kafka platform. Nightly export: simplest, but stale, heavy on the source, misses deletes unless you diff. Choose by freshness need, number of consumers and the team's ops capacity.

## 9. Sources (checked 2026-11-03)

- Datastream overview (sources/destinations): https://cloud.google.com/datastream/docs/overview
- BigQuery destination (write modes, metadata, keys): https://cloud.google.com/datastream/docs/destination-bigquery
- Pricing: https://cloud.google.com/datastream/pricing
- PostgreSQL source setup (publication, pgoutput): https://cloud.google.com/datastream/docs/configure-cloudsql-psql
