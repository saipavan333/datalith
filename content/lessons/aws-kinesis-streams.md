# Kinesis Data Streams: shards & ordering — the complete guide

Kinesis Data Streams is AWS's durable, replayable streaming log — the backbone of real-time pipelines on AWS and a frequent interview topic. The two decisions that make or break it are **shard count** (throughput) and **partition key** (ordering + avoiding hot shards). This chapter covers the model end to end.

@@diagram:aws-kinesis-streams

## 1. What it is

**Kinesis Data Streams (KDS)** is a managed, durable, ordered, **replayable** log — conceptually the AWS analog of a **Kafka topic**. Producers `PutRecord(s)`; consumers read in order; data is retained for a window so you can **replay/reprocess**.

## 2. Shards — capacity and ordering

A stream is made of **shards**. Each shard:

- **Ingests** up to **1 MB/s** or **1,000 records/s**.
- **Emits** up to **2 MB/s** (shared across standard consumers).
- Maintains **strict ordering** of records **within** that shard.

Therefore **total throughput = shard count × per-shard limits**, and **ordering is per-shard**, not global across the stream.

## 3. Partition keys

Every record is written with a **partition key**. Kinesis **hashes** the key to assign the record to a shard, so:

- **All records with the same key → the same shard → ordered** (e.g. all events for one `user_id` stay in order).
- A **high-cardinality, evenly distributed** key **spreads load** across shards.
- A **low-cardinality or skewed** key sends most records to **one shard** — a **hot shard** that throttles while others idle (the streaming version of data skew).

Choosing the partition key is the key design decision: it controls both **ordering granularity** and **load balance**.

## 4. Consumers

- **Shared-throughput consumers** — poll shards via `GetRecords` (KCL apps) or **Lambda**, sharing the shard's **2 MB/s**.
- **Enhanced fan-out (EFO)** — each registered consumer gets its **own 2 MB/s per shard**, pushed with low latency (HTTP/2). Use when **multiple independent consumers** need full throughput.
- **KCL (Kinesis Client Library)** — handles **checkpointing** (tracking position per shard in DynamoDB) and **rebalancing** shards across worker instances.
- **Lambda** — can consume directly, with batching and parallelization per shard.

## 5. Retention & replay

Data is retained **24 hours by default, up to 365 days**. Within the window, a consumer can start at:
- **`TRIM_HORIZON`** — oldest available record.
- **`AT_TIMESTAMP`** — a specific time.
- **A sequence number** — a precise position.
This enables **replay** (reprocess after a bug fix) and **catch-up** after downstream failure.

## 6. Capacity modes & scaling

- **Provisioned** — you set the **shard count** and **scale** it (resharding: split a hot shard, merge cold ones). Pay per shard-hour.
- **On-demand** — Kinesis **auto-scales** shards to observed traffic; simpler, pay per throughput. Good default when load is variable.

## 7. Operational concerns

- **Producers** — use the **KPL** (aggregation/batching for efficiency) or SDK; handle `ProvisionedThroughputExceeded` with retry/backoff.
- **Monitoring** — per-shard `IncomingBytes/Records`, `WriteProvisionedThroughputExceeded`, iterator age (consumer lag).
- **Encryption** (KMS) and **VPC** access as needed.

## 8. Gotchas

- **Hot shard** from a skewed partition key → throttling; pick a high-cardinality even key (or salt a dominant value).
- **Under-provisioned shards** → ingest/egress throttling; add shards or use on-demand.
- **Too many shared consumers** contending for 2 MB/s → use enhanced fan-out.
- **Assuming global ordering** → ordering is **per shard/key** only.
- **Forgetting checkpoints** → reprocessing or gaps on consumer restart; KCL/Lambda manage this.
- **Retention too short** → can't replay after an outage; set it to your recovery window.

## Scenario — a clickstream that scales smoothly

A clickstream keys records by **`user_id`** (high-cardinality, even), so each user's events are **ordered on one shard** and load **spreads evenly** across shards — no hot shard. The stream runs **on-demand**, auto-scaling shards through traffic spikes. Three **independent consumers** (a real-time dashboard, an S3 archiver via Firehose, a fraud detector) use **enhanced fan-out** so each gets its **own 2 MB/s per shard** with low latency. **Retention is 7 days**, so when the fraud job has a bug, they **replay** from a timestamp after fixing it — no data lost. Contrast a naive key like **`country`**: most traffic would pile onto a few shards (a hot-shard bottleneck) regardless of how many shards exist. The smooth scaling came from a **good partition key** + **on-demand shards** + **fan-out** + **adequate retention** — the four KDS levers.

## Practice

1. What is a shard, and how do shard count and partition key affect throughput and ordering?
2. How does the partition key route records, and what is a hot shard?
3. Compare shared-throughput consumers and enhanced fan-out.
4. What does the KCL handle, and why does it matter for consumer recovery?
5. How does retention enable replay, and what start positions exist?
6. Compare provisioned and on-demand capacity modes.
7. A consumer throttles and one shard is far busier than others — diagnose and fix.
