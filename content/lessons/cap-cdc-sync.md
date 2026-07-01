# Capstone: change data capture to the lake

Keeping a lake in sync with a source database used to mean nightly full reloads — slow, and brutal on the source. This
capstone does it properly with **Change Data Capture (CDC)**: stream every insert, update, and delete from the
database's transaction log into the lakehouse, in near-real-time.

@@diagram:cdc

## The shape

```
source DB (WAL) → Debezium (CDC connector) → Kafka → stream processor → MERGE into SILVER (Delta)
```

## 1. Two kinds of CDC

| Approach | How | Trade-off |
|---|---|---|
| **Query-based** | poll `WHERE updated_at > :watermark` | simple, but **misses hard deletes** and loads the source |
| **Log-based** | read the database **write-ahead log** | captures *everything* (incl. deletes), minimal source load |

Log-based is the real thing. **Debezium** is the standard connector; it reads Postgres/MySQL/SQL Server logs and emits a
change event per row operation.

## 2. A change event

Debezium emits structured events (simplified):

```json
{ "op": "u",                       // c=create, u=update, d=delete, r=snapshot read
  "before": { "id": 1, "amount": 10 },
  "after":  { "id": 1, "amount": 25 },
  "source": { "lsn": 1234567, "ts_ms": 1710000000000 } }   // log sequence number = ordering
}
```

## 3. Capture — Debezium → Kafka

Debezium runs as a Kafka Connect connector. Its config points at the source and a topic:

```json
{ "name": "orders-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "db", "database.dbname": "shop",
    "table.include.list": "public.orders",
    "topic.prefix": "cdc",
    "snapshot.mode": "initial"     // seed the target, THEN stream the log
  }}
```

`snapshot.mode: initial` does the crucial first step: a one-time **full snapshot** to seed the target, then it streams
the log from that exact point — so you never miss or double-count rows at the boundary.

## 4. Apply — MERGE into silver (handle deletes + ordering)

Consume the topic in micro-batches, keep the **last event per key** (by log sequence number), and MERGE — including
deletes:

```python
from pyspark.sql import functions as F, Window

def apply_cdc(batch_df, batch_id):
    # 1) keep only the latest change per primary key (highest LSN)
    w = Window.partitionBy('id').orderBy(F.col('lsn').desc())
    latest = (batch_df.withColumn('rn', F.row_number().over(w))
                      .filter('rn = 1').drop('rn'))
    latest.createOrReplaceTempView('changes')
    # 2) apply insert / update / delete in one atomic MERGE
    spark.sql("""
      MERGE INTO delta.`/lake/silver/orders` t
      USING changes s ON t.id = s.id
      WHEN MATCHED AND s.op = 'd' THEN DELETE
      WHEN MATCHED                THEN UPDATE SET *
      WHEN NOT MATCHED AND s.op <> 'd' THEN INSERT *
    """)

(spark.readStream.format('kafka').option('subscribe','cdc.public.orders').load()
   .select(parse_debezium('value'))         # -> id, op, lsn, columns...
   .writeStream.foreachBatch(apply_cdc)
   .option('checkpointLocation','/ckpt/cdc').start())
```

## 5. The three correctness concerns

| Concern | Why it bites | Fix |
|---|---|---|
| **Deletes** | upsert-only pipelines never remove rows | handle `op='d'` → DELETE in the MERGE |
| **Ordering** | events can arrive out of order | dedupe to the latest per key by **LSN** before MERGE |
| **Idempotency** | Kafka replays / retries | keyed MERGE — re-applying a change is a no-op |

## 6. Schema changes

Source columns get added/dropped over time. Enable schema evolution on the silver table (`mergeSchema`) and design
consumers to tolerate new/missing columns, so a source migration doesn't break the pipeline.

## 7. Why it matters

CDC turns batch reloads into **near-real-time replication**: analytics sees operational changes within seconds, the
source database is barely touched, and deletes are handled correctly. It's how you keep a lakehouse's silver layer a
faithful, fresh mirror of production systems — the foundation for real-time dashboards and reverse-ETL.

## 8. Query-based CDC (when you can't run Debezium)

```python
# simpler fallback: poll updated_at — but you LOSE hard deletes
new = spark.read.jdbc(url, 'orders',
        predicates=[f"updated_at > '{last_watermark}'"])
# MERGE upserts only; deletes must be handled another way (soft-delete flag)
```

## 9. Practice

1. Why does log-based CDC capture deletes when `updated_at` polling can't?
2. Write the MERGE branch that applies a delete from a CDC batch.
3. Two events for the same `id` arrive in one batch. How do you apply the correct final state?
4. What does `snapshot.mode: initial` do, and why is it essential?

CDC is how a modern lakehouse stays in lock-step with operational databases — every insert, update, and delete streamed
and applied, in order, exactly once. Combined with the medallion capstone, you can keep silver continuously fresh.
