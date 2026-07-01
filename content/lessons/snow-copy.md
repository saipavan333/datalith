# COPY INTO & stages — the complete loading reference

`COPY INTO` is the bedrock of Snowflake ingestion. Snowpipe is just a COPY on a trigger; Dynamic Tables transform data a COPY first landed. If you truly understand stages, file formats, and COPY's options, the rest of the loading stack is variations on a theme. This chapter is the full reference.

@@diagram:snow-copy

## 1. Stages — the pointer to your files

A **stage** tells COPY *where the files are*. Four kinds, each for a purpose:

| Stage | Notation | Backed by | Use |
|---|---|---|---|
| **User** | `@~` | Snowflake-managed, per user | Personal scratch / quick tests |
| **Table** | `@%orders` | Snowflake-managed, tied to a table | Files that belong to one table |
| **Named internal** | `@my_stage` | Snowflake-managed, reusable | Shared internal landing zone |
| **External** | `@ext_stage` | **Your** S3/GCS/Azure bucket | Files already in your cloud |

```sql
list @ext_orders;                 -- see staged files (name, size, md5)
remove @ext_orders pattern='.*tmp.*';
```

**External stages** are the common case for a data lake — the files already live in your bucket. **Directory tables** (`directory = (enable=true)`) let you query stage file metadata as a table.

## 2. Storage integrations — key-less external access

Never put cloud keys in SQL. A **storage integration** (created by an admin) maps to an **IAM role / managed identity**, scoped to specific locations:

```sql
create storage integration s3_int type = external_stage storage_provider='s3'
  enabled = true
  storage_aws_role_arn = 'arn:aws:iam::123:role/snowflake-role'
  storage_allowed_locations = ('s3://acme-lake/raw/');
desc integration s3_int;   -- read STORAGE_AWS_IAM_USER_ARN + EXTERNAL_ID -> put in the IAM role trust policy
create stage ext_orders url='s3://acme-lake/raw/orders/' storage_integration=s3_int;
```

The integration + the trust policy form a two-way handshake; the stage then needs no secrets.

## 3. File formats

Parsing rules, defined once and reused. Snowflake loads **CSV, JSON, Avro, ORC, Parquet, XML**.

```sql
create file format ff_csv type=csv
  skip_header=1 field_optionally_enclosed_by='"' null_if=('','NULL')
  error_on_column_count_mismatch=false date_format='YYYY-MM-DD' compression=auto;

create file format ff_json type=json strip_outer_array=true;
```

Attach a format to a stage, a `COPY`, or override per statement.

## 4. The COPY statement and every option that matters

```sql
copy into orders                       -- target table
from @ext_orders                       -- stage (or a SELECT, see §5)
file_format = (format_name = ff_csv)
pattern = '.*orders_2025.*\\.csv'      -- regex file filter
on_error = 'skip_file'                 -- bad-row behavior
purge = true;                          -- delete files after success
```

| Option | What it does | Default |
|---|---|---|
| `ON_ERROR` | `abort_statement` / `continue` (skip bad rows) / `skip_file` / `skip_file_5%` / `skip_file_100` | `abort_statement` |
| `VALIDATION_MODE` | `RETURN_ERRORS` / `RETURN_N_ROWS` — dry-run, loads nothing | off |
| `FORCE` | Reload files even if already loaded (ignore load metadata) | `false` |
| `PURGE` | Delete source files after successful load | `false` |
| `MATCH_BY_COLUMN_NAME` | Map Parquet/JSON fields to columns by name (`case_insensitive`) | none |
| `PATTERN` | Regex to select files in the stage | all |
| `SIZE_LIMIT` | Stop after ~N bytes loaded | none |
| `RETURN_FAILED_ONLY` | Only report files that failed | `false` |
| `ENFORCE_LENGTH` / `TRUNCATECOLUMNS` | String-length overflow behavior | — |

## 5. Transform during load

COPY can run a `SELECT` over the staged data — cast, reorder, drop, and compute columns on the way in (a "COPY transformation"):

```sql
copy into orders (order_id, amount, dt)
from (select $1::int, $2::number(12,2), to_date($3,'YYYY-MM-DD')
      from @ext_orders (file_format => ff_csv) t);
-- for JSON: $1 is the VARIANT; use $1:field::type
```

Note: transformations restrict some options (e.g., no `ON_ERROR` partial-file behaviors in all cases) — keep heavy transformation for downstream models and use COPY transforms for light shaping.

## 6. Load metadata & idempotency

COPY records the files it loaded in **load metadata for ~64 days** and **won't reload them**, so re-running a COPY is **safe**. `FORCE = TRUE` bypasses this (and can duplicate). After 64 days, load history ages out — if a file could reappear, add a downstream dedup key.

## 7. Error handling, end to end

```sql
-- 1) dry-run: what would fail?
copy into orders from @ext_orders validation_mode = return_errors;
-- 2) load, skipping bad files, quarantining nothing silently
copy into orders from @ext_orders on_error = 'skip_file';
-- 3) audit per-file outcomes (and rejected rows)
select file_name, status, row_count, error_count, first_error, first_error_line
from table(information_schema.copy_history(table_name=>'ORDERS',
  start_time=>dateadd(hour,-12,current_timestamp())))
where error_count > 0;
```

Decide your tolerance **explicitly**: `abort_statement` (all-or-nothing), `continue` (skip bad rows, load the rest), `skip_file` (skip whole files with errors). For robustness, many teams **land into a VARIANT/raw table** and validate downstream.

## 8. Performance — the file-sizing math

COPY parallelizes across the warehouse: roughly **one file per thread**, threads ≈ nodes × cores. So:

- **Many tiny files** → per-file overhead dominates; threads sit idle between files.
- **One huge file** → no parallelism; one thread does everything.
- **Sweet spot: 100–250 MB compressed**, with enough files to keep every thread busy (e.g., ≥ the thread count). Sizing **up** the warehouse only helps if there are enough files to parallelize across.

## 9. Unloading (the reverse)

`COPY INTO @stage` exports query results to files — useful for sharing or archiving:

```sql
copy into @ext_exports/daily/ from (select * from gold.daily_sales)
  file_format=(type=parquet) partition by (to_varchar(dt)) header=true;
```

## 10. Gotchas

- **`ON_ERROR` defaults to abort** — one bad row fails the whole load unless you choose otherwise.
- **`FORCE` duplicates** — only use it knowingly; prefer load metadata.
- **Tiny files** kill throughput and (via Snowpipe) cost — aggregate upstream.
- **Transform-during-load is limited** — heavy logic belongs in downstream models.
- **`PURGE` deletes source files** — be sure the load truly succeeded (it only purges on success, but verify with COPY_HISTORY).
- **Stage path vs pattern** — `@stage/sub/` plus `PATTERN` both filter; mind the interaction.

## Scenario — a robust nightly partner load

A partner drops ~40 CSV files (~150 MB each) nightly into `s3://acme-lake/raw/partner/`. You load them with a **task** that runs `COPY`: a key-less **storage integration** + **stage**, a reusable **file format**, `PATTERN` to grab the night's files, `VALIDATION_MODE=RETURN_ERRORS` on a canary first, then `ON_ERROR='skip_file'` and `PURGE=TRUE`. Files at ~150 MB parallelize well across a **Medium** warehouse; **load metadata** makes a re-run after a hiccup safe; **COPY_HISTORY** is monitored for `error_count > 0` and the skipped files are re-driven after the partner fixes them. Raw lands in a typed table; a Dynamic Table builds the mart. Simple, idempotent, observable — the foundation everything else builds on.

## Practice

1. Create a key-less external stage (storage integration + stage + file format) and explain the IAM trust handshake.
2. Write a COPY that dry-runs, then loads only the night's files, skips bad files, and purges on success — and audit it with COPY_HISTORY.
3. Use a COPY transformation to cast and reorder three columns during load.
4. Explain the file-sizing math: why are 10,000 tiny files and one 50 GB file both bad, and what's the target?
5. Explain how load metadata makes re-runs idempotent, and when FORCE is dangerous.
