# Design a CDC ingestion system — the complete guide

"How do you get data from an operational database into the lake/warehouse — freshly, without hammering the source?" The answer is **Change Data Capture**: read the DB's transaction log, stream the changes, and apply them with an **idempotent MERGE**. The strong answer emphasizes **log-based capture (low impact)** and **idempotency + ordering** (the hard parts). This chapter is the full worked design.

@@diagram:sd-design-cdc

## 1. Clarify requirements

- **Goal** — **replicate** an **OLTP** DB (Postgres/MySQL) into the **lake/warehouse**, **fresh** (minutes), **without heavy queries** on the source.
- **Why not batch full-dumps?** Repeated `SELECT *` is **expensive**, **slow**, **stale**, and **misses deletes**.
- **Correctness** — capture **inserts, updates, deletes**; preserve **per-row order**; **exactly-once** end state.

## 2. Architecture

1. **Capture** — **CDC** reads the database's **transaction log** (Postgres **WAL** / MySQL **binlog**) via **Debezium / Datastream / DMS**, capturing every change with **low source impact** (it tails the log, not the tables).
2. **Transport** — change events flow through **Kafka** (a topic per table), **partitioned by primary key** so a row's changes stay **ordered**.
3. **Apply (sink)** — a consumer applies the change stream to a **mirror table** via an **idempotent MERGE / upsert by primary key**:
   ```sql
   MERGE INTO mirror t USING changes s ON t.pk = s.pk
   WHEN MATCHED AND s.op = 'D' THEN DELETE
   WHEN MATCHED THEN UPDATE SET *
   WHEN NOT MATCHED AND s.op <> 'D' THEN INSERT *;
   ```
4. **Snapshot + incremental** — an **initial snapshot** of existing rows, then **incremental** CDC for ongoing changes (the standard bootstrap).

## 3. The hard parts (what makes a strong answer)

- **Idempotency** — **MERGE by primary key is idempotent** (apply twice = once), so **at-least-once** redelivery is **safe** (no double-apply). **Dedup to the latest change per key** within a batch before MERGE.
- **Ordering** — **partition Kafka by primary key** so a row's I/U/D apply **in order**; out-of-order would corrupt state.
- **Deletes** — CDC captures deletes — apply them (a batch dump would **miss** them).
- **Schema changes** — handle source **DDL** (column add/drop) via **schema evolution** on the sink.
- **Lakehouse fit** — the mirror is often a **Delta/Iceberg** table (MERGE/upserts; merge-on-read); **Change Data Feed (CDF)** propagates changes downstream (Silver/Gold) incrementally.

## 4. Scale & operations

- **Scale** — partition by PK; scale consumers; the log buffers spikes.
- **Initial snapshot** of a huge table — chunk it; some tools do incremental snapshots without locking.
- **Exactly-once** — idempotent MERGE + dedup (and checkpointed processing) give an exactly-once end state.
- **Monitoring** — replication **lag** (freshness SLA), error/DLQ, schema-change events.

## 5. Tools

- **Capture** — Debezium (open-source, Kafka Connect), AWS DMS, GCP **Datastream**, Fivetran (managed).
- **Transport** — Kafka / Kinesis / Pub/Sub.
- **Apply** — Spark/Flink `foreachBatch` MERGE into Delta/Iceberg, or a managed sink.

## 6. Gotchas

- **Batch full-dumps** instead of CDC — heavy on the source, stale, miss deletes.
- **Append instead of MERGE** — duplicates/wrong state; upsert by PK.
- **No PK partitioning** — out-of-order changes corrupt the row's state.
- **Not deduping the batch** — multiple changes to one key in a batch can break MERGE (multiple-source-match); reduce-to-latest first.
- **Ignoring deletes / schema changes** — drift from the source.
- **No snapshot** — missing pre-existing rows; bootstrap with a snapshot then incremental.

## Scenario — Postgres orders into a Delta mirror

**"Replicate our Postgres orders DB into the lakehouse, fresh and low-impact."** **Design:** **Debezium/Datastream** tails the Postgres **WAL** (low source impact) → emits change events (I/U/D) to **Kafka**, **partitioned by `order_id`** (per-key ordering) → a consumer **reduces to the latest change per key** per micro-batch, then **MERGEs into a Delta `orders` mirror** by `order_id` (`op=D`→DELETE, `op=U`→UPDATE *, else INSERT). **Bootstrap:** an **initial snapshot**, then **incremental** CDC. **Hard parts handled:** **idempotent MERGE** (at-least-once redelivery is safe), **ordering via PK partitioning**, **deletes applied** (a nightly dump would miss them), **schema evolution** for DDL. **CDF** propagates changes to Silver/Gold incrementally. The mirror stays a **fresh, exact replica** with minimal source load. The strong answer stresses **log-based capture (low impact)** and the **idempotent, ordered MERGE** — the parts that separate a robust CDC design from a naive append.

## Practice

1. Why CDC (log-based) instead of batch full-dumps?
2. Walk the architecture: capture → transport → apply, with PK partitioning and MERGE.
3. Why is the MERGE-by-PK idempotent, and why does that matter for at-least-once delivery?
4. How do you handle ordering, deletes, and schema changes?
5. How does snapshot + incremental bootstrap work?
6. How does CDC fit the lakehouse (Delta/Iceberg, CDF)?
7. Design CDC from Postgres into a Delta mirror, covering the hard parts.
