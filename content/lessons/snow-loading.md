# Loading & continuous ingestion — the complete guide

Every way data gets into Snowflake — batch files, auto-ingest, row streaming, and declarative pipelines — with the real syntax, the decision criteria, and the error handling that production needs.

@@diagram:snow-ingestion

## 1. Stages — where files live before loading

A **stage** is a pointer to file storage that `COPY` reads from. Four kinds:

| Stage | Notation | Use |
|---|---|---|
| **User** | `@~` | Per-user scratch |
| **Table** | `@%orders` | Files tied to one table |
| **Named internal** | `@my_stage` | Reusable Snowflake-managed storage |
| **External** | `@ext_stage` (S3/GCS/Azure) | Files already in your cloud bucket |

```sql
create stage ext_orders
  url = 's3://acme-lake/raw/orders/'
  storage_integration = s3_int          -- secure, key-less access via an integration
  file_format = (type = json);
list @ext_orders;                        -- see staged files
```

A **storage integration** (admin-created) lets Snowflake assume an IAM role — no secrets in SQL.

## 2. File formats

Define once, reuse everywhere. Snowflake loads **CSV, JSON, Avro, ORC, Parquet, XML**.

```sql
create file format ff_csv type = csv
  field_optionally_enclosed_by = '"' skip_header = 1
  null_if = ('', 'NULL') error_on_column_count_mismatch = false;
```

**File-sizing rule:** aim for **100–250 MB compressed** files. Too-large files can't parallelize; thousands of tiny files add per-file overhead. Split big extracts; batch tiny ones.

## 3. COPY INTO — the workhorse for batch

`COPY INTO` bulk-loads staged files in parallel across the warehouse's nodes. It **remembers loaded files** (load metadata, ~64 days) so re-running won't double-load.

```sql
copy into orders
from @ext_orders
file_format = (format_name = ff_csv)
pattern = '.*orders_2025.*\\.csv'        -- only matching files
on_error = 'skip_file'                   -- abort_statement | continue | skip_file | skip_file_<n>
purge = true;                            -- delete files after successful load
```

Important options:

| Option | Effect |
|---|---|
| `ON_ERROR` | `abort_statement` (default), `continue` (skip bad rows), `skip_file`, `skip_file_5%` |
| `VALIDATION_MODE = RETURN_ERRORS` | Dry-run: report what *would* fail, load nothing |
| `FORCE = TRUE` | Reload files even if already loaded (ignore load metadata) |
| `PURGE = TRUE` | Remove source files after load |
| `MATCH_BY_COLUMN_NAME` | Map Parquet/JSON fields to columns by name |

**Transform during load** — `COPY` can run a `SELECT` over the staged data:

```sql
copy into orders (order_id, amount, dt)
from (select $1:id::int, $1:amount::number, to_date($1:ts)
      from @ext_orders (file_format => ff_json) t)
on_error = 'continue';
```

Check results with `VALIDATION_MODE` first, and audit with `COPY_HISTORY`:

```sql
select * from table(information_schema.copy_history(
  table_name => 'ORDERS', start_time => dateadd(hour,-24,current_timestamp())));
```

## 4. Snowpipe — continuous file ingestion

When files arrive continuously, you don't want to run `COPY` on a schedule. **Snowpipe** auto-loads new files **micro-batched**, on **Snowflake-managed serverless compute** (billed per-file, not on your warehouse).

```sql
create pipe orders_pipe auto_ingest = true as
  copy into orders from @ext_orders file_format = (format_name = ff_json);
```

With `AUTO_INGEST`, cloud event notifications (S3 → SNS/SQS, GCS → Pub/Sub) tell Snowpipe when a file lands; latency is typically a minute or two. Without it, you call the **Snowpipe REST API** to notify. Snowpipe is for **latency in minutes**, file-based.

## 5. Snowpipe Streaming — row-level, seconds latency

For **sub-minute** latency without staging files, **Snowpipe Streaming** writes **rows** directly into a table via a client SDK / Kafka connector. Use it for clickstream/IoT where you can't wait to accumulate files.

```text
producer (SDK / Kafka connector) → Snowpipe Streaming → table (seconds-fresh)
```

## 6. Streams & Tasks — CDC pipelines

A **stream** is a change-tracking object: it records the **inserts/updates/deletes** to a table since you last consumed it (a CDC cursor). A **task** runs SQL on a schedule (or when a stream has data). Together they build incremental pipelines.

```sql
create stream orders_stream on table raw.orders;          -- tracks changes
create task build_silver
  warehouse = etl_wh
  schedule = '5 minute'
  when system$stream_has_data('orders_stream')            -- only run if changes
as
  merge into silver.orders t using orders_stream s on t.id = s.id
  when matched and s.metadata$action='DELETE' then delete
  when matched then update set *
  when not matched then insert *;
alter task build_silver resume;
```

## 7. Dynamic Tables — declarative incremental transforms

The modern alternative to streams+tasks for most transforms: declare the **target query** and a **target lag**, and Snowflake figures out the incremental refresh.

```sql
create dynamic table silver.daily_sales
  target_lag = '5 minutes' warehouse = etl_wh as
  select order_date, region, sum(amount) revenue
  from raw.orders group by 1,2;
```

You write *what the result should be*; Snowflake keeps it fresh incrementally. Far less code than hand-built streams+tasks, and dependency-aware when chained.

## 8. Choosing a method

| Need | Use |
|---|---|
| Periodic batch of files | **COPY INTO** (on a schedule/task) |
| Files arriving continuously, minute latency | **Snowpipe** (auto-ingest) |
| Rows, seconds latency, no files | **Snowpipe Streaming** |
| Incremental CDC transform, full control | **Streams + Tasks** |
| Incremental transform, declarative | **Dynamic Tables** |

## 9. Gotchas & best practices

- **File size matters most.** 100–250 MB compressed parallelizes well; avoid thousands of tiny files (Snowpipe per-file overhead) and avoid single huge files (no parallelism).
- **`ON_ERROR` defaults to abort.** One bad row fails the whole load unless you set `continue`/`skip_file`. Decide your tolerance explicitly and quarantine rejects.
- **Don't `FORCE` casually.** Load metadata prevents double-loading; `FORCE = TRUE` bypasses it and can duplicate data.
- **`VALIDATION_MODE` before big loads.** Catch format problems without loading anything.
- **Land raw, then transform.** `COPY` into a raw/VARIANT table, then build typed tables — keeps ingestion robust and reprocessable.
- **Snowpipe ≠ real-time.** It's minutes. For seconds, use Snowpipe Streaming.

## Scenario — files + a stream + declarative transforms

Orders arrive as JSON in S3 continuously and from a partner as nightly CSV batches. A **Snowpipe** (`auto_ingest`) loads the streaming files into `raw.orders` within a minute; a scheduled **COPY** (on a task) loads the nightly partner CSVs with `on_error = 'skip_file'` and `VALIDATION_MODE` checks first. A **Dynamic Table** `silver.orders` (`target_lag = '5 minutes'`) cleans/dedupes incrementally, and another builds `gold.daily_sales`. `COPY_HISTORY` and `PIPE_USAGE_HISTORY` are monitored for failures. Raw stays immutable so any logic bug is fixed by rebuilding silver/gold — no re-pull from sources.

## Practice

1. Create an external stage + file format and a `COPY` that loads only `orders_2025*.csv`, skips bad rows, and purges on success.
2. Use `VALIDATION_MODE` to dry-run a load and `COPY_HISTORY` to audit it — what does each tell you?
3. Choose an ingestion method for: nightly file batches, files landing every minute, and IoT rows needing 5-second freshness. Justify.
4. Build a stream + task that MERGEs changes from `raw.orders` into `silver.orders` only when there's new data.
5. Rewrite that incremental transform as a Dynamic Table and explain what you no longer have to manage.
