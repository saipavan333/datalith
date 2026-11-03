# AUTO CDC and Lakeflow Connect — correct SCD1/SCD2 tables from change feeds

Most "the dashboard shows a deleted customer" bugs come from hand-written MERGE logic that trusts arrival order. Databricks' **AUTO CDC** (the new name for **APPLY CHANGES**, same syntax) takes a change feed and maintains an SCD type 1 or type 2 table correctly, including out-of-order and late events. **Lakeflow Connect** gives managed connectors that produce such feeds from databases and SaaS apps.

@@diagram:dbx-auto-cdc

## 1. Concept

- **Input:** a change feed with a **key**, an **operation** (insert/update/delete) and a **sequence** (a commit timestamp or log sequence number). Sources: Lakeflow Connect ingestion pipelines, Debezium/Kafka, Delta Change Data Feed from another table, files dropped by Datastream or Fivetran.
- **AUTO CDC INTO** (SQL) or `dp.create_auto_cdc_flow()` (Python), inside a Lakeflow (Spark Declarative) pipeline:
  - `KEYS (id)` identifies a row.
  - `SEQUENCE BY seq` orders events; the highest sequence wins, so late events are applied correctly.
  - `APPLY AS DELETE WHEN op = 'DELETE'` turns delete events into deletes.
  - `STORED AS SCD TYPE 1` (default: keep latest) or `STORED AS SCD TYPE 2` (keep history with `__START_AT` and `__END_AT`).
- **Snapshots:** if a source gives full snapshots instead of a feed, `AUTO CDC FROM SNAPSHOT` (`create_auto_cdc_from_snapshot_flow()`) computes the changes for you.
- **Lakeflow Connect:** managed connectors for databases, SaaS apps, files and streams, producing ingestion pipelines governed by Unity Catalog and run on serverless compute, with incremental reads. Connectors are in different release stages; check the connector list for your source.

```sql
CREATE OR REFRESH STREAMING TABLE users_history;

CREATE FLOW apply_cdc AS AUTO CDC INTO users_history
FROM stream(main.cdc_tutorial.users_cdf)
KEYS (userId)
APPLY AS DELETE WHEN operation = "DELETE"
SEQUENCE BY sequenceNum
STORED AS SCD TYPE 2;
```

## 2. School-kid picture

A class is updating the school's address book by passing notes. Notes get passed around and arrive in the wrong order: "Meena moved to Pune" (written Monday) arrives after "Meena moved to Delhi" (written Wednesday). If the secretary just keeps the last note she *received*, Meena lives in the wrong city. AUTO CDC reads the date on each note (SEQUENCE BY) and keeps the newest one, and in SCD2 mode it also keeps a dated history page for Meena.

## 3. Worked example: customer master from SQL Server into a lakehouse

A retailer's `customers` table (18 M rows, ~400 k changes/day) lives in SQL Server.

1. **Ingest:** a Lakeflow Connect SQL Server connector lands changes into a bronze streaming table with the operation and the source's commit sequence.
2. **Apply:** `AUTO CDC INTO silver.customers ... STORED AS SCD TYPE 1` for apps that need the current address; a second flow into `silver.customers_history ... STORED AS SCD TYPE 2` for the marketing team's "where did customers live when they ordered" analysis.
3. **Join in gold:** orders join `customers_history` on `customer_id` and `order_ts BETWEEN __START_AT AND COALESCE(__END_AT, '9999-12-31')` to get the address at order time.
4. **Quality:** expectations on the bronze feed (`order_id IS NOT NULL`, valid operation values) drop or fail bad events before they reach AUTO CDC.

## 4. Hands-on lab (runs locally)

The lab writes out what AUTO CDC does, on the same small example as the Databricks docs, with one event deliberately out of order:

```bash
python labs/platforms/auto_cdc_scd_sim.py
```

Recorded output (2026-11-03):

```text
SCD TYPE 1 (KEYS userId, SEQUENCE BY sequenceNum, APPLY AS DELETE WHEN operation='DELETE'):
   (124, 'Raul', 'Oaxaca')
   (125, 'Mercedes', 'Guadalajara')
   (126, 'Lily', 'Cancun')

naive 'last arrival wins' (what a hand-written MERGE per batch often does):
   (123, 'Isabel', 'Chihuahua')
   (124, 'Raul', 'Oaxaca')
   (125, 'Mercedes', 'Mexicali')
   (126, 'Lily', 'Cancun')

SCD TYPE 2 (STORED AS SCD TYPE 2): one row per version, __START_AT/__END_AT from the sequence:
   (123, 'Isabel', 'Monterrey', 1, 5)
   (123, 'Isabel', 'Chihuahua', 5, 6)
   (124, 'Raul', 'Oaxaca', 1, None)
   (125, 'Mercedes', 'Tijuana', 2, 5)
   (125, 'Mercedes', 'Mexicali', 5, 6)
   (125, 'Mercedes', 'Guadalajara', 6, None)
   (126, 'Lily', 'Cancun', 2, None)
```

What to look for: the naive version brings deleted user 123 back and puts 125 in the wrong city. Sequencing fixes both. In SCD2, the last version of 123 gets an `__END_AT` of 6 (the delete).

**Needs your account (free trial/tier):** Databricks Free Edition allows one active pipeline per type. Create the `users_cdf` table from the lab's rows, create a pipeline with the SQL above, run it, then insert one more out-of-order row and run an update. Lakeflow Connect connectors that need a source database or SaaS account were not tried here.

## 5. Gotchas

- **A sequence column you can trust.** Use the source's commit order (LSN, commit timestamp from the log), not the ingestion time.
- **Ties.** Two events with the same key and sequence are ambiguous; make the sequence unique (e.g. a struct of timestamp + sequence number).
- **Deletes in SCD1 remove the row;** downstream aggregates must handle it. In SCD2 the history row stays, closed by `__END_AT`.
- **Target tables are pipeline-managed.** Don't write to them from other jobs.
- **Old names.** `APPLY CHANGES INTO` and `dlt.apply_changes()` still appear in older code and blog posts; they are the same feature.

## 6. Quiz

1. What does `SEQUENCE BY` protect you from?
   - a) Schema drift. *Wrong.*
   - b) **Out-of-order events overwriting newer data.** *Right.*
   - c) Duplicate files. *Wrong: that's ingestion's job.*
   - d) Slow queries. *Wrong.*
2. Marketing needs the customer's city at the time of each order. Which target?
   - a) SCD TYPE 1. *Wrong: keeps only the current city.*
   - b) **SCD TYPE 2 with __START_AT / __END_AT.** *Right.*
   - c) A view on bronze. *Wrong: no history logic.*
   - d) Append-only bronze. *Has the events, but no ready-made validity ranges.*
3. Your source only gives a full nightly snapshot. Which API?
   - a) AUTO CDC INTO from the snapshot. *Wrong: that expects a change feed.*
   - b) **AUTO CDC FROM SNAPSHOT.** *Right.*
   - c) MERGE by hand. *Possible, but you'd be rewriting what the API does.*
   - d) Not possible. *Wrong.*

## 7. Exercises

**Warm-up.** Change the lab's SQL so it produces SCD2 only for `city` changes, ignoring `name` changes. *Solution:* AUTO CDC has `TRACK HISTORY ON (city)` for SCD2; in the lab, collapse consecutive versions where city didn't change before computing `lead()`.

**Transfer.** The SQL Server sequence is a commit timestamp with millisecond resolution and you see ties. What do you do? *Solution:* sequence by a struct `(commit_ts, lsn)` or the connector's sequence column so ordering is total; add an expectation that fails if a duplicate `(key, sequence)` arrives.

**Stretch.** Design CDC for 120 tables from one OLTP database with dev/prod parity. *Solution:* one Lakeflow Connect ingestion pipeline per source database, a metadata-driven pipeline that generates one AUTO CDC flow per table from a config table (keys, sequence column, SCD type), deployed with Declarative Automation Bundles (formerly Databricks Asset Bundles) to dev and prod, row-count reconciliation against the source each night, and alerts on pipeline event-log errors.

## 8. Interview questions

- **(Junior) SCD type 1 vs type 2?** Type 1 overwrites with the latest value; type 2 keeps a new row per change with validity dates.
- **(Mid) Why is MERGE alone not enough for CDC?** MERGE applies whatever batch you give it; if events within or across batches arrive out of order, or a delete arrives before a stale update, you get wrong state unless you dedupe and order by a reliable sequence first. AUTO CDC does that consistently.
- **(Senior) Design SCD2 for a 2-billion-row dimension with 5 M changes a day.** Sequence by source commit order, cluster the history table by key, track history only on business-relevant columns, keep a current-row SCD1 table for most consumers, partition the change feed retention, and monitor late-event rates; test backfills by replaying a day of events and comparing to the source snapshot.

## 9. Sources (checked 2026-11-03)

- AUTO CDC APIs and SCD types: https://docs.databricks.com/aws/en/ldp/cdc
- Lakeflow Connect concepts: https://docs.databricks.com/aws/en/ingestion/lakeflow-connect/
- DLT rename and Python module: https://docs.databricks.com/aws/en/ldp/concepts/where-is-dlt
- Declarative Automation Bundles (formerly Asset Bundles): https://docs.databricks.com/aws/en/dev-tools/bundles/
