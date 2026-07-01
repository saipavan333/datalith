# Snowpipe Streaming — the complete guide

When "a minute or two" isn't fast enough, file-based Snowpipe is the wrong tool. **Snowpipe Streaming** writes **rows** straight into tables at **seconds** latency — and it's a genuinely different mechanism (channels and offset tokens, not files and notifications). This chapter is what you need to run it and to defend the choice in an interview.

@@diagram:snow-streaming

## 1. The problem it solves

File-based Snowpipe has two hard limits for low-latency work: it needs **files** (so you must accumulate rows into files first), and it carries **per-file overhead** (so high-frequency tiny files are slow and expensive). Snowpipe Streaming removes both — you append **rows** directly, no files, at **second-level** latency.

| | COPY | Snowpipe | **Snowpipe Streaming** |
|---|---|---|---|
| Unit | Files (batch) | Files (continuous) | **Rows (continuous)** |
| Latency | Scheduled | ~minutes | **Seconds** |
| Trigger | You run it | Notification / REST | **SDK / Kafka channels** |
| Dedup | 64-day load history | 14-day load history | **Offset tokens** |
| Cost driver | Warehouse time | Per-file + compute | **Throughput + per-client** |

## 2. The channel model

A producer opens one or more **channels** into a target table and appends row batches. Key properties:

- A channel is an **ordered** stream of rows into one table.
- Each insert carries an **offset token** — a string *you* control that marks "I've sent up to here."
- Snowflake durably commits rows and remembers the **latest committed offset token** per channel.
- On restart/reconnect, the client asks for that token and **resumes after it** → **exactly-once**, no duplicates, no gaps.
- Many channels can write to one table in parallel (e.g., one per Kafka partition).

## 3. Using it — the Java Streaming Ingest SDK

```java
// build a client (auth via key-pair), then open a channel into a table
SnowflakeStreamingIngestClient client =
    SnowflakeStreamingIngestClientFactory.builder("client1").setProperties(props).build();

SnowflakeStreamingIngestChannel ch = client.openChannel(
    OpenChannelRequest.builder("chan-orders-1")
        .setDBName("RAW").setSchemaName("PUBLIC").setTableName("ORDERS")
        .setOnErrorOption(OnErrorOption.CONTINUE).build());

// append rows with an offset token marking progress
InsertValidationResponse r = ch.insertRows(rows, /*offsetToken*/ "batch-1042");

// on reconnect: resume after the last durably committed token
String committed = ch.getLatestCommittedOffsetToken();   // e.g. "batch-1041" -> resend from 1042
```

You drive ordering and idempotency through the **offset token**: make it monotonic (a sequence, a Kafka offset) so resume logic is trivial.

## 4. Using it — the Kafka connector (no code)

The Snowflake Kafka connector has a **Snowpipe Streaming mode** that streams topics into tables with channels/offsets managed for you:

```text
snowflake.ingestion.method = SNOWPIPE_STREAMING
snowflake.role.name        = KAFKA_INGEST
topics                     = clickstream
# each topic-partition -> a channel; Kafka offsets -> offset tokens (exactly-once)
```

This is the common production path: point Kafka at Snowflake and get seconds-fresh tables with no custom ingestion code.

## 5. Exactly-once, precisely

"Exactly-once" here means: for a given channel, rows associated with an offset token are committed **at most once**, and on failure you **resume from the last committed token** so nothing is lost. The guarantee is **per channel** — design your channel-to-partition mapping so each ordered substream has one channel. (Cross-channel global ordering is *not* guaranteed; order within a channel is.)

## 6. Cost model

Serverless and billed by **ingested throughput plus a per-client/connection charge** — **not per file**. For high-frequency, small-row workloads this is dramatically cheaper and faster than manufacturing tiny files for Snowpipe. Monitor ingestion via the streaming history/usage views and the client's metrics.

## 7. Latency & throughput

Expect **seconds** end-to-end (often 1–10s depending on flush settings and load). Throughput scales by **adding channels** (parallel substreams). Tune client buffering/flush for your latency-vs-efficiency trade-off (smaller flushes = lower latency, more overhead).

## 8. Schema & data handling

Rows are validated against the target table schema on insert (`insertRows` returns per-row validation errors). Decide an `OnErrorOption` (CONTINUE to skip bad rows, ABORT to fail the batch). For evolving payloads, land into a **VARIANT** column and shred downstream, same as the file path. A **Dynamic Table** typically shapes the raw streamed rows into BI-ready marts.

## 9. Migrating from Snowpipe

If you already use the **Kafka connector** with classic Snowpipe (file mode), switching `ingestion.method` to `SNOWPIPE_STREAMING` moves you to row-level ingestion — usually lower latency and lower cost for high-frequency topics, with offsets handling exactly-once instead of file dedup. Validate throughput and ordering assumptions before cutting over.

## 10. Gotchas

- **Ordering is per channel, not global** — map one ordered substream (e.g., a Kafka partition or a key) to one channel.
- **Offset tokens are your responsibility (SDK path)** — make them monotonic and meaningful, or resume/idempotency breaks.
- **Don't reuse a channel name across producers** carelessly — a channel has a single writer/owner semantics.
- **It's rows, not files** — there's no stage to inspect; observability is via channel/offset state and Snowflake's streaming views, not `LIST @stage`.
- **Still land raw + transform downstream** — don't push heavy logic into the producer.

## 11. When NOT to use it

If data **naturally arrives as files** at minute latency, file-based **Snowpipe** is simpler. If it's **batch**, use **COPY**. Reach for Streaming specifically when you need **sub-minute, row-level** freshness or you'd otherwise generate **many tiny files**.

## Scenario — clickstream at 50k events/sec, 5-second SLA

Product needs live funnel metrics within ~5 seconds. Events flow through **Kafka**; you enable the **Snowflake Kafka connector in Snowpipe Streaming mode**, mapping each topic-partition to a **channel** that lands rows in `raw.clicks` (VARIANT) — **seconds-fresh, no files**. **Kafka offsets become offset tokens**, so a connector restart resumes exactly-once with no dupes or gaps. A **Dynamic Table** (`target_lag='1 minute'`) shapes `raw.clicks` into `gold.funnel`, which **Databricks-SQL-style** dashboards read. Cost is throughput-based, far below what 50k tiny files/sec would have cost on Snowpipe. The deciding move was recognizing this is a **rows-and-seconds** problem, not a file-tuning one.

## Practice

1. Explain the channel + offset-token model and exactly how it yields exactly-once across a producer restart.
2. Stream a Kafka topic into a table with no custom code — what one setting selects Snowpipe Streaming, and what becomes the offset token?
3. Why is ordering guaranteed per channel but not globally, and how do you design channels around that?
4. Give the cost and latency reasons Streaming beats file-based Snowpipe for 50k tiny events/sec.
5. Decide COPY / Snowpipe / Snowpipe Streaming for: nightly large files, files every minute, and rows at a 5-second SLA — and defend each.
