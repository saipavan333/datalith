# MERGE, upserts & CDC — the complete guide

`MERGE` is the single most important Delta statement for data engineering. It applies **inserts, updates, and deletes in one atomic operation**, keyed on a match condition — the thing a plain data lake fundamentally can't do safely. CDC apply, SCD dimensions, deduplication, idempotent loads: all of them are MERGE. This chapter is the full reference.

@@diagram:dbx-delta-merge

## 1. The upsert problem

You have a **target** table and a batch of **changes** (new + modified rows, maybe deletes). You want: rows that exist get updated, rows that don't get inserted, and (sometimes) flagged rows get deleted — **atomically**, so a reader never sees a half-applied batch. On a plain lake that's a dangerous read-modify-write. Delta gives you `MERGE`.

## 2. Full syntax

```sql
MERGE INTO target t
USING source s
  ON t.key = s.key
WHEN MATCHED AND s.op = 'delete' THEN DELETE
WHEN MATCHED AND s.op = 'update' THEN UPDATE SET *
WHEN MATCHED THEN UPDATE SET t.col1 = s.col1, t.updated_at = s.ts
WHEN NOT MATCHED AND s.op <> 'delete' THEN INSERT *
WHEN NOT MATCHED THEN INSERT (key, col1) VALUES (s.key, s.col1)
WHEN NOT MATCHED BY SOURCE AND t.active THEN UPDATE SET t.active = false;
```

Clause types:

| Clause | Fires when | Actions |
|---|---|---|
| `WHEN MATCHED [AND cond]` | key matches in both | `UPDATE SET …` / `UPDATE SET *` / `DELETE` |
| `WHEN NOT MATCHED [AND cond]` | in source, not target | `INSERT …` / `INSERT *` |
| `WHEN NOT MATCHED BY SOURCE [AND cond]` | in target, not source | `UPDATE SET …` / `DELETE` |

- Clauses are evaluated **in order**; the first whose condition holds wins.
- `UPDATE SET *` / `INSERT *` map all matching columns (great with schema evolution).
- `WHEN NOT MATCHED BY SOURCE` lets you expire/delete target rows absent from the source (useful for full-snapshot syncs).

## 3. PySpark DeltaTable API

```python
from delta.tables import DeltaTable
tgt = DeltaTable.forName(spark, 'silver.customers')
(tgt.alias('t').merge(source.alias('s'), 't.id = s.id')
   .whenMatchedDelete(condition="s.op = 'D'")
   .whenMatchedUpdateAll(condition="s.op = 'U'")
   .whenNotMatchedInsertAll(condition="s.op <> 'D'")
   .execute())
```

## 4. CDC apply

Given a change stream with an operation flag (`I`/`U`/`D`), MERGE applies it to the target in one shot:

```sql
MERGE INTO silver.customers t
USING cdc_batch s ON t.id = s.id
WHEN MATCHED AND s.op = 'D' THEN DELETE
WHEN MATCHED AND s.op = 'U' THEN UPDATE SET *
WHEN NOT MATCHED AND s.op <> 'D' THEN INSERT *;
```

If a key can appear **multiple times** in one batch, first **reduce to the latest** change per key (see §7) — MERGE errors if the source matches a target row more than once.

## 5. SCD dimensions

**SCD Type 1 (overwrite — keep only current):**
```sql
MERGE INTO dim_customer t USING updates s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
```

**SCD Type 2 (keep history with validity columns).** One MERGE can't both close the old row and insert a new one for the same key, so the standard trick is to **stage** an "insert" copy for changed keys and union it into the source:

```sql
MERGE INTO dim_customer t
USING (
  -- rows that close the current version (matched on id)
  SELECT id AS merge_key, * FROM updates
  UNION ALL
  -- rows that force an INSERT of the new version (null merge_key never matches)
  SELECT NULL AS merge_key, * FROM updates u
  JOIN dim_customer d ON u.id = d.id AND d.is_current
  WHERE u.hash <> d.hash
) s
ON t.id = s.merge_key AND t.is_current
WHEN MATCHED AND t.hash <> s.hash THEN
  UPDATE SET is_current = false, valid_to = current_timestamp()
WHEN NOT MATCHED THEN
  INSERT (id, …, is_current, valid_from) VALUES (s.id, …, true, current_timestamp());
```

The `NULL merge_key` row never matches an existing row, so it always takes the INSERT branch — adding the new version while the matched branch closes the old one.

## 6. Dedup & idempotency

**Deduplicate on ingest** (insert only genuinely new rows):
```sql
MERGE INTO t USING new_rows s ON t.id = s.id
WHEN NOT MATCHED THEN INSERT *;     -- existing ids are skipped → idempotent append
```

**Idempotent batch loads** — gate on a processed-version/batch id so re-running a job doesn't double-apply. Combined with MERGE's keyed semantics, reprocessing the same source is safe.

## 7. Reduce-to-latest before MERGE (critical)

If the source has several changes for the same key, MERGE raises:

```
UnsupportedOperationException: Cannot perform Merge as multiple source rows matched … a target row.
```

Fix: keep only the **latest** change per key first:

```sql
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY ts DESC) rn FROM cdc_batch)
SELECT * FROM ranked WHERE rn = 1
```

Then MERGE the deduped set.

## 8. Performance

- **Prune the target.** Add a predicate on the join/partition/clustering column so MERGE rewrites only relevant files: `ON t.id = s.id AND t.event_date >= '2025-05-01'`.
- **Cluster/Z-order the target** on the merge key so matching reads few files (data skipping).
- **Deletion vectors** make MERGE far cheaper — matched updates/deletes mark rows instead of rewriting whole files (merge-on-read).
- **Broadcast the source** when it's small (it usually is) so the join is cheap.
- **Right-size files** (OPTIMIZE) so MERGE doesn't rewrite giant files for a few rows.
- **Low-shuffle MERGE** (Databricks) reduces the data reshuffled during the operation.

## 9. Streaming MERGE (foreachBatch)

Structured Streaming can't MERGE directly, so apply per micro-batch:

```python
def upsert(batch_df, batch_id):
    (DeltaTable.forName(spark,'silver.customers').alias('t')
       .merge(batch_df.alias('s'), 't.id = s.id')
       .whenMatchedUpdateAll().whenNotMatchedInsertAll().execute())

(stream.writeStream.foreachBatch(upsert)
   .option('checkpointLocation', path).start())
```

Dedup within each batch first; the checkpoint makes it exactly-once at the target.

## 10. Gotchas

- **Multiple source matches → error.** Always reduce-to-latest per key first.
- **SCD2 needs the staged-union trick** — one clause can't close-and-insert the same key.
- **Unpruned MERGE rewrites too much.** Add target predicates; cluster on the key.
- **`UPDATE SET *` + schema drift** — enable `autoMerge` if the source has new columns you want.
- **Deletes via MERGE still tombstone files** — VACUUM to reclaim; deletion vectors to avoid rewrites.
- **Ordering of clauses matters** — put the more specific `AND` conditions first.

## Scenario — one statement runs the Silver layer

A CDC stream from an orders DB lands `I`/`U`/`D` rows into a Bronze table. The Silver job, every micro-batch: (1) **reduces to the latest** change per `order_id` (`ROW_NUMBER` by commit time); (2) runs a single **MERGE** into `silver.orders` — `WHEN MATCHED AND op='D' THEN DELETE`, `WHEN MATCHED AND op='U' THEN UPDATE SET *`, `WHEN NOT MATCHED AND op<>'D' THEN INSERT *`; (3) the target is **clustered on `order_id`** and has **deletion vectors** on, so each MERGE reads few files and doesn't rewrite gigabytes for a handful of changes. The whole thing runs in `foreachBatch` with a checkpoint, so it's exactly-once and idempotent on replay. One atomic statement keeps Silver an exact, current mirror of the source — inserts, updates, and deletes — which a plain lake simply can't do safely. That's why MERGE is the workhorse.

## Practice

1. Write a MERGE that applies an `I`/`U`/`D` CDC batch to a target keyed on `id`.
2. Explain each clause type, including `WHEN NOT MATCHED BY SOURCE`, and when clauses are evaluated.
3. Why does MERGE error on multiple source matches, and how do you fix it?
4. Implement SCD Type 2 with MERGE — explain the staged-union/`NULL merge_key` trick.
5. Give four ways to make a slow MERGE faster.
6. Apply a streaming upsert with `foreachBatch` + MERGE and explain how exactly-once is achieved.
7. After many MERGE deletes the table's storage grew — why, and what do you do?
