# Serverless data services — deep dive

The most cloud-native way to build data pipelines is to glue **managed, serverless services** together so there are *no servers to run at all* — events trigger functions, queries run without clusters, and you pay only when work happens. This is how lean teams ship pipelines fast.

@@diagram:serverless-event

## The serverless data toolkit

- **Object storage** (S3/GCS) — durable landing zone; emits **events** when files arrive.
- **Functions** (Lambda/Cloud Functions) — event-driven code; transform, route, validate. No servers.
- **Serverless query** (Athena/BigQuery) — SQL directly over files in object storage, no warehouse to manage; pay per byte scanned.
- **Managed streaming/queues** (Kinesis/Pub/Sub, SQS) — buffer and move events.
- **Serverless orchestration** (Step Functions/Workflows, managed Airflow) — coordinate the steps.

## The event-driven pattern

The canonical serverless pipeline:

```
File lands in bucket  →  triggers a Function  →  transforms / loads
                                              →  (or) catalogs + Athena queries it
```

1. A file is uploaded to object storage.
2. The upload **event** automatically triggers a **function**.
3. The function processes the file (clean, transform, load into a warehouse, or register a table).
4. Optionally, **serverless SQL** (Athena/BigQuery) queries the data in place.

No cluster is running between events. When nothing happens, you pay ~nothing — ideal for spiky, unpredictable, or low-volume workloads.

## Why teams love it (and the trade-offs)

**Pros:** zero infrastructure, automatic scaling, pay-per-use, fast to build, naturally event-driven.

**Watch out for:**

- **Timeouts/size limits** — functions cap runtime (e.g. Lambda 15 min) and memory; not for heavy/long jobs. Use containers or managed Spark for those.
- **Cold starts** — first invocation latency; matters for low-latency paths.
- **Cost at scale** — per-invocation/per-byte pricing is cheap when spiky, but sustained high volume can cost more than a right-sized always-on service.
- **Distributed complexity** — many small pieces; invest in observability and tracing.

**Rule of thumb:** serverless for spiky/event-driven/glue work; managed clusters/containers for sustained heavy processing.

## Cheat sheet

| Service | Role |
|---|---|
| Object storage events | trigger the pipeline when files land |
| Functions (Lambda) | event-driven transform/route; no servers |
| Athena / BigQuery | serverless SQL over files; pay per scan |
| Pub/Sub, Kinesis, SQS | buffer/move events |
| Step Functions / Workflows | serverless orchestration |

**Best for:** spiky, event-driven, low-ops. **Avoid for:** long/heavy compute (timeouts), steady high-volume (cost).

## Practice

1. Sketch the event-driven flow from "a CSV is uploaded" to "it's queryable with SQL," naming the serverless services.
2. Give two reasons serverless functions are a bad fit for a 1-hour transformation, and the alternative.
3. When does serverless become *more* expensive than an always-on service?
