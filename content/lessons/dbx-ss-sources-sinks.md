# Sources, sinks & exactly-once checkpointing — the complete guide

The magic word in streaming is **exactly-once** — every input row affects the output exactly one time, even across failures and restarts. It isn't magic; it's three things cooperating: a **replayable source**, a **checkpoint**, and an **idempotent/transactional sink**. This chapter explains each, how the checkpoint works, and the operational rules that keep it correct.

@@diagram:dbx-ss-sources-sinks

## 1. The three pillars of exactly-once

1. **Replayable source** — can be **re-read** from a known position after failure (offsets/versions/file lists).
2. **Checkpoint** — durably records **progress** (offsets) and **state**.
3. **Idempotent or transactional sink** — re-applying a batch doesn't duplicate (Delta commits are transactional and tied to the batch id).

Miss any one and you fall back to at-least-once (possible duplicates) or at-most-once (possible loss).

## 2. Sources (must be replayable)

| Source | Position it replays from |
|---|---|
| **Kafka** | Topic-partition **offsets** |
| **Auto Loader / file** | The set of **files** already processed |
| **Delta** | Table **versions** |
| **Kinesis / Event Hubs** | Sequence numbers / offsets |

```python
spark.readStream.format('kafka') \
  .option('kafka.bootstrap.servers', '...') \
  .option('subscribe', 'events') \
  .option('startingOffsets', 'latest').load()
```

## 3. Sinks

- **Delta** — **transactional + idempotent** → exactly-once. The default lakehouse sink.
- **Kafka** — at-least-once (consumers dedupe by key).
- **`foreachBatch`** — custom: receive each micro-batch as a **DataFrame** and write anywhere (e.g. **MERGE** into Delta, write to a warehouse). The standard way to do **upserts** and reach non-streaming sinks while keeping exactly-once.
- **`foreach`** — per-row custom sink (rarely needed).

## 4. The checkpoint — the heart of fault tolerance

```python
.writeStream.option('checkpointLocation', '/chk/job1')
```

The checkpoint directory durably stores, per micro-batch:

- **Offsets** — what input range each batch processed (so it knows where to resume).
- **Commit log** — which batches **committed** (a write-ahead/commit log).
- **State** — the operator state for stateful queries (aggregations, joins, dedup), often in **RocksDB**.

On restart, the engine reads the checkpoint, **replays** from the last committed offsets, and **rebuilds state** — continuing exactly where it left off.

## 5. How exactly-once actually happens

Each micro-batch:

1. Read input range **(X, Y]** from offsets.
2. Compute the result **deterministically**.
3. **Atomically** commit results to the sink **and** record offsets/commit in the checkpoint.

If it **crashes before** step 3 commits, the batch isn't marked done; on restart it **re-reads (X, Y]** and redoes it. Because the Delta sink commit is **transactional and keyed to the batch id**, the redo produces the **same** commit rather than a duplicate — **exactly-once**. (`foreachBatch` similarly tracks the batchId so a retried batch's MERGE isn't applied twice.)

## 6. Iron rules

- **One checkpoint per query.** A checkpoint encodes a specific query's offsets/state. **Never share** one between two streams or point two queries at the same location — it corrupts progress for both.
- **Treat the checkpoint as production state.** Don't delete it to "reset" casually — you'll either reprocess everything or skip data (depending on `startingOffsets`).
- **Some changes are checkpoint-incompatible.** Altering stateful logic/keys, or certain query-shape changes, can be incompatible with an existing checkpoint — plan a migration (new checkpoint + backfill) rather than silently breaking state.
- **Back up / locate checkpoints deliberately** (a stable path), and include them in your DR thinking.

## 7. Gotchas

- **Deleting the checkpoint** loses progress — reprocessing or data skips. Avoid.
- **Sharing a checkpoint** across queries breaks exactly-once.
- **Non-deterministic transformations** (e.g. random, non-idempotent external calls) undermine exactly-once on replay — keep batch logic deterministic; make side effects idempotent.
- **Non-replayable source** (e.g. a socket) can't give exactly-once.
- **At-least-once sinks** (plain Kafka) need downstream dedupe.
- **Changing the query** then reusing the checkpoint can fail or behave oddly — understand state compatibility.

## Scenario — a crash that loses and duplicates nothing

A **Kafka → Delta** stream crashes mid-batch (after computing, before committing). On restart, the engine reads the **checkpoint**, sees the last committed offset is **X**, and **replays (X, Y] from Kafka** — the source is replayable, so **no data is lost**. It recomputes deterministically and commits to **Delta**, whose transaction is **keyed to the batch id**, so the redo yields the **same** atomic commit — **no duplicates**. The team also needed **upserts** into a keyed Silver table, so they used **`foreachBatch`** running a Delta **MERGE**; the batchId tracking keeps that exactly-once too. They never share the checkpoint between jobs and never delete it to "reset." Result: a fault-tolerant pipeline where every event lands exactly once, by construction — replayable source + checkpoint + transactional sink.

## Practice

1. Name the three pillars of exactly-once and what each provides.
2. Give two replayable sources and the position each replays from.
3. What does a streaming checkpoint store, and how is it used on restart?
4. Walk through how a crash before commit avoids both loss and duplication.
5. Why must each query have its own checkpoint, and what breaks if you share one?
6. How do you upsert a stream into a keyed Delta table while keeping exactly-once?
7. Why is deleting the checkpoint to "reset" dangerous?
