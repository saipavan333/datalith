# Snowpipe — the complete operator's guide

Snowpipe looks simple — "it auto-loads files" — and is one of the most common sources of 3am pages in a Snowflake shop. This chapter is everything a working data engineer needs: the two trigger modes, the per-cloud wiring, the cost model, file-sizing math, dedup/reload semantics, and the exact views you use to diagnose a pipe that "stopped working."

@@diagram:snow-snowpipe

## 1. Where Snowpipe fits

| Method | Cadence | Granularity | Compute | Latency |
|---|---|---|---|---|
| **COPY INTO** (on a task) | Scheduled batch | Files | Your warehouse | Whatever you schedule |
| **Snowpipe** | Continuous | Files | **Serverless** (managed) | ~1–2 minutes |
| **Snowpipe Streaming** | Continuous | **Rows** | Serverless | Seconds |

Snowpipe is the answer to "files keep landing in a bucket and I want them in a table within a minute, without running a warehouse on a cron." It is **not** real-time (that's Streaming) and not for one nightly batch (that's COPY).

## 2. Anatomy of a pipe

A **pipe** is a first-class object that wraps a single `COPY INTO` statement:

```sql
create pipe orders_pipe auto_ingest = true as
  copy into raw.orders
  from @ext_orders
  file_format = (type = json)
  on_error = 'skip_file';
```

- The `COPY` inside defines the **target table, stage, file format, and error behavior** — same options as a manual COPY (transformations, `MATCH_BY_COLUMN_NAME`, etc. all work).
- `AUTO_INGEST = TRUE` puts it in notification mode; omit it for REST mode.
- A pipe has a **state** (running/paused), a **notification channel**, and its own **load history**.

## 3. Auto-ingest — the per-cloud wiring (this is where people get stuck)

Auto-ingest needs your cloud to **tell** Snowpipe a file arrived. The wiring differs per cloud:

| Cloud | Notification path | What you configure |
|---|---|---|
| **AWS** | S3 event → **SQS** (Snowflake-owned) | Point the S3 bucket's `ObjectCreated` event at the pipe's SQS ARN |
| **Azure** | Blob event → **Event Grid** → notification integration | Create a notification integration, subscribe Event Grid to it |
| **GCS** | Object change → **Pub/Sub** → notification integration | Create a Pub/Sub topic + subscription, a notification integration |

The AWS flow, end to end:

```sql
-- a) key-less bucket access
create storage integration s3_int type = external_stage storage_provider = 's3'
  enabled = true
  storage_aws_role_arn = 'arn:aws:iam::123:role/snowflake-role'
  storage_allowed_locations = ('s3://acme-lake/raw/orders/');
desc integration s3_int;                 -- copy STORAGE_AWS_IAM_USER_ARN + EXTERNAL_ID into the IAM trust policy

create stage ext_orders url = 's3://acme-lake/raw/orders/'
  storage_integration = s3_int file_format = (type = json);

-- b) the pipe
create pipe orders_pipe auto_ingest = true as
  copy into raw.orders from @ext_orders file_format = (type = json) on_error = 'skip_file';

-- c) THE wiring step people forget:
show pipes;                              -- read the notification_channel = an SQS ARN
-- then in AWS: S3 bucket → Properties → Event notifications → All object create events → SQS = that ARN
```

If you skip step (c), files land and **nothing happens** — the #1 "my pipe is broken" cause.

## 4. REST API mode (no notifications)

When you can't wire bucket events (or you control the producer), drop `AUTO_INGEST` and call the REST endpoint `insertFiles` with an explicit file list. The Snowflake Kafka connector and many ingestion tools use this under the hood. You're responsible for telling Snowpipe which files to load; dedup (below) still protects you from doubles.

## 5. How it works internally

```text
file lands → cloud notification → Snowpipe's queue → serverless workers run the pipe's COPY
           → rows appear in the table → file recorded in load history (≈14 days)
```

Snowpipe pulls from the notification queue, groups files into micro-batches, and loads them on **Snowflake-managed compute**. There's no ordering guarantee across files, and a burst of files may take longer than the ~1-minute steady-state latency.

## 6. The cost model (and how to read it)

- Billed as **serverless credits** = a **per-file overhead** + the compute to load. It does **not** consume your virtual warehouses.
- See it in `PIPE_USAGE_HISTORY`:

```sql
select pipe_name, sum(credits_used) credits, sum(files_inserted) files, sum(bytes_inserted) bytes
from snowflake.account_usage.pipe_usage_history
where start_time > dateadd(day,-7,current_timestamp())
group by 1 order by credits desc;
```

The **per-file overhead is the lever**: cost scales with *file count*, not just data volume. Loading 1 TB as 10,000 tiny files costs far more (and runs slower) than as 5,000 well-sized files.

## 7. File-sizing math (the most important operational rule)

Target **100–250 MB compressed** per file. Why it matters in both directions:

- **Too many tiny files** → per-file overhead dominates cost and latency; the queue backs up.
- **Too few huge files** → less parallelism, slower individual loads, and a single bad file blocks more data.

If your producer emits tiny files (e.g., one per event), **aggregate upstream**: buffer to size/time before writing to the watched prefix, or land raw tiny files in a "staging" prefix and compact them into the Snowpipe-watched prefix. If you genuinely need per-row, second-level latency, that's a **Snowpipe Streaming** decision, not a file-size tweak.

## 8. Dedup & reload semantics

- Snowpipe keeps **load history for ~14 days** per pipe and **will not reload a file it already loaded** in that window — so re-notifications and re-listing are **idempotent**.
- `ALTER PIPE orders_pipe REFRESH` re-submits recently-staged files (useful after fixing the notification wiring) — dedup still prevents doubles.
- To **force a full reload** beyond the dedup window, recreate the pipe or use a `COPY … FORCE = TRUE` outside the pipe. Do this deliberately.
- After more than 14 days, a re-staged file **can** reload (history aged out) — don't rely on Snowpipe as your only dedup if files can reappear weeks later; add a `MERGE`/dedup key downstream.

## 9. Error handling & schema drift

- The pipe's `ON_ERROR` controls bad-row behavior (`skip_file`, `continue`, `abort_statement`). For ingestion robustness, prefer **landing into a VARIANT/raw table** and validating downstream rather than failing the load.
- Inspect per-file results and rejects in **`COPY_HISTORY`**:

```sql
select file_name, status, row_count, error_count, first_error_message
from table(information_schema.copy_history(table_name=>'RAW.ORDERS',
  start_time=>dateadd(hour,-6,current_timestamp())))
where error_count > 0;
```

- **Schema drift:** loading into a `VARIANT` column (`copy into raw(v) ...`) makes Snowpipe immune to new/optional fields; shred to typed columns downstream. With typed targets, use `MATCH_BY_COLUMN_NAME` and expect that added columns won't auto-appear without a DDL change.

## 10. Monitoring & troubleshooting (memorize these)

```sql
select system$pipe_status('orders_pipe');
-- returns JSON: executionState (RUNNING/PAUSED), pendingFileCount, lastReceivedMessageTimestamp,
--               lastForwardedMessageTimestamp, notificationChannelName, numOutstandingMessagesOnChannel
```

| Symptom | Likely cause | Fix |
|---|---|---|
| Files land, nothing loads | Notification not wired / wrong SQS ARN | Re-check bucket event → `notification_channel`; `system$pipe_status` shows no received messages |
| `executionState = PAUSED` | Pipe paused (manually or on error) | `alter pipe … set pipe_execution_paused = false` |
| Loads but rows missing | `ON_ERROR=skip_file` skipped a bad file | Check `COPY_HISTORY` for errors; fix file/format |
| High cost, slow | Tiny files (per-file overhead) | Aggregate to 100–250 MB |
| Permission errors | IAM/role or integration misconfigured | Re-verify storage integration trust policy |
| `pendingFileCount` climbing | Burst > throughput, or paused | Confirm running; large bursts just take longer |

## 11. Security

- Use a **storage integration** (maps to an IAM role / managed identity) so **no keys live in SQL** and access is scoped to the exact prefix.
- The **notification integration** (Azure/GCS) is similarly least-privilege.
- Grant `OPERATE`/`MONITOR` on the pipe to ops roles; restrict pipe creation to the loading role.

## 12. Snowpipe vs the alternatives (decision)

| Choose… | When |
|---|---|
| **Scheduled COPY** | Predictable batches; you want full control on a cron |
| **Snowpipe (auto-ingest)** | Files trickling in continuously; minutes latency; no warehouse |
| **Snowpipe (REST)** | Continuous files but you can't wire bucket events / you control the producer |
| **Snowpipe Streaming** | Rows, seconds latency, no files (clickstream/IoT); Kafka connector |
| **Dynamic Tables** | The *transform* after ingest — declarative incremental |

## 13. Production checklist

1. Storage integration (no keys), scoped to the prefix.
2. Pipe with the right `file_format` and `ON_ERROR` (or VARIANT landing).
3. Notification wired (and **verified** with a test file + `SYSTEM$PIPE_STATUS`).
4. File sizes 100–250 MB (aggregate upstream if needed).
5. Monitoring: alert on `PIPE_USAGE_HISTORY` cost anomalies and `COPY_HISTORY` errors.
6. Downstream dedup key if files can reappear after 14 days.
7. Runbook: how to refresh, unpause, and re-wire notifications.

## 14. Interview-grade questions you should be able to answer

- *Why does Snowpipe not use my warehouse, and how is it billed?*
- *A pipe stopped loading — walk me through diagnosing it.*
- *Why are tiny files a problem, and how do you fix them?*
- *How does Snowpipe avoid double-loading, and what are the limits of that guarantee?*
- *Snowpipe vs Snowpipe Streaming vs COPY — when each?*

If you can answer those crisply with the views above, you can own ingestion on a real Snowflake team.

## Scenario — a production pipe, and the incident

Orders JSON lands in `s3://acme-lake/raw/orders/` continuously. You set up a **storage integration**, a **stage**, and `orders_pipe` (`auto_ingest`), then wire the **S3 event → the pipe's SQS ARN** and verify with a test file (`SYSTEM$PIPE_STATUS` shows received + forwarded messages). It runs at ~1-minute latency for weeks.

Then alerts fire: "orders are 3 hours stale." You run `SYSTEM$PIPE_STATUS` → `executionState: RUNNING`, but `lastReceivedMessageTimestamp` is 3 hours old and `pendingFileCount: 0`. So the pipe is fine but **no notifications are arriving** — someone changed the S3 bucket's event configuration during an infra migration. You re-add the `ObjectCreated → SQS` event, then `ALTER PIPE orders_pipe REFRESH` to pick up the backlog (dedup prevents doubles), and orders catch up in minutes. Post-incident you add a monitor on `lastReceivedMessageTimestamp` age so the *notification path* — not just the pipe — is watched. That's the difference between knowing Snowpipe exists and being able to run it.

## Practice

1. Stand up auto-ingest from S3 end-to-end, and name the one wiring step that, if skipped, makes files land but never load.
2. Read `SYSTEM$PIPE_STATUS` output: which fields tell you the pipe is healthy but not receiving notifications?
3. Your pipe's cost tripled with no data increase. What metric do you check, what's the likely cause, and how do you fix it?
4. Explain Snowpipe's dedup guarantee, its 14-day limit, and why you might still need a downstream dedup key.
5. For each, pick COPY / Snowpipe / Snowpipe Streaming: 20 nightly large files, files every minute, IoT rows at 5-second freshness — and justify.
6. Write the `COPY_HISTORY` query to find files that loaded with errors in the last 6 hours.
