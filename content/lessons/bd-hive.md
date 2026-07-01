# Hive & HiveQL — the complete deep dive

Hive put **SQL on big-data files**. You write HiveQL, Hive compiles it to distributed jobs, and the **metastore** catalogs your tables. The Hive *engine* is now largely legacy, but its **metastore** and its **table / partition / format / SerDe** concepts are the foundation of every modern lakehouse — Spark, Trino, and Glue all build on them. This is a deep, syntax-heavy tour of the whole machine.

## 1. Architecture — how a query runs

- **Client** — Beeline (CLI) or a JDBC/ODBC app connects to **HiveServer2** (the Thrift service).
- **Driver** — receives the query, manages its lifecycle (compile → optimize → execute → fetch).
- **Compiler** — parses HiveQL into an AST, resolves it against the **metastore**, builds a **logical plan**.
- **Optimizer** — rewrites the plan (predicate pushdown, partition pruning, join reordering via the CBO) into a **physical plan** of jobs.
- **Execution engine** — runs jobs on **MapReduce, Tez, or Spark** (`SET hive.execution.engine=tez;`). Tez/Spark are far faster than original MR; **LLAP** adds long-lived daemons for interactive speed.
- **Metastore** — a relational DB (MySQL/Postgres) holding **schemas, partitions, and file locations**.

@@diagram:metastore

## 2. The Hive Metastore — the part that outlived the engine

The **metastore** is a small relational database plus a **Thrift service** that answers "what tables/columns/partitions exist and where do their files live?" It's the **central catalog** of the lake:

- **Spark SQL**, **Trino/Presto**, **Flink**, and **AWS Glue** (a managed metastore) all read it — so one table definition is shared across engines.
- It stores **databases → tables → columns/types**, **partitions** (and their locations), table **properties**, and the **SerDe/format** per table.

This is why "Hive is legacy but everywhere": you rarely run the Hive **engine**, but you use a **Hive-compatible metastore** constantly.

```sql
CREATE DATABASE analytics LOCATION 's3://lake/analytics/';
USE analytics;
SHOW TABLES;  DESCRIBE FORMATTED events;  SHOW PARTITIONS events;
```

## 3. Schema-on-read: tables over files

Hive doesn't store data in a private format — it **imposes a schema over files**, applied **at read time**:

```sql
CREATE EXTERNAL TABLE events (
  id      BIGINT,
  ts      STRING,
  page    STRING,
  amount  DOUBLE,
  props   MAP<STRING,STRING>,            -- complex types are first-class
  tags    ARRAY<STRING>,
  geo     STRUCT<lat:DOUBLE,lon:DOUBLE>
)
PARTITIONED BY (dt STRING)               -- partition column (a directory, not stored in files)
ROW FORMAT SERDE 'org.apache.hadoop.hive.ql.io.orc.OrcSerde'
STORED AS ORC                            -- columnar format
LOCATION 's3://lake/events/'
TBLPROPERTIES ('orc.compress'='ZLIB');
```

### Managed vs external tables (know this cold)

| | Managed (internal) | External |
|---|---|---|
| Data ownership | Hive owns it | You own it |
| `DROP TABLE` | **deletes the files** | **leaves the files** |
| Use | scratch/temp owned by Hive | **most lake tables** — data outlives any engine |

**Most lake tables are EXTERNAL**, so files are shared by Spark/Trino/BI and survive a dropped definition.

## 4. Loading data & managing partitions

```sql
-- LOAD DATA: move files into the table's location (no transform). LOCAL = client FS; OVERWRITE replaces.
LOAD DATA INPATH 's3://staging/events/'       INTO TABLE events PARTITION (dt='2025-05-01');
LOAD DATA LOCAL INPATH '/tmp/e.csv' OVERWRITE INTO TABLE events PARTITION (dt='2025-05-01');

-- INSERT … SELECT: OVERWRITE replaces the partition, INTO appends
INSERT OVERWRITE TABLE events PARTITION (dt='2025-05-01')
SELECT id, ts, page, amount, props, tags, geo FROM staging WHERE day='2025-05-01';
```

### Registering partitions — the metastore must be told (ADD PARTITION & MSCK REPAIR)

This is one of the most common "my query returns **0 rows** but the files are right there" bugs. When **another process** writes files into partition directories — Spark, Kinesis Firehose, `hadoop fs -put`, an external job — Hive **doesn't know the partition exists** until it's registered in the **metastore**. The data on disk and the catalog's list of partitions are separate; queries only scan the partitions the metastore knows about. Two ways to register them:

**Option 1 — `ALTER TABLE … ADD PARTITION` (explicit, fast, precise)**

```sql
-- add one partition (its location defaults to <table>/dt=2025-05-02/)
ALTER TABLE events ADD IF NOT EXISTS PARTITION (dt='2025-05-02');

-- add a partition whose files live somewhere non-standard (custom LOCATION)
ALTER TABLE events ADD IF NOT EXISTS PARTITION (dt='2025-05-02')
  LOCATION 's3://other-bucket/backfill/2025-05-02/';

-- add several at once (multi-column partitions too)
ALTER TABLE events ADD
  PARTITION (dt='2025-05-03')
  PARTITION (dt='2025-05-04');
ALTER TABLE sales ADD PARTITION (yr='2025', mo='05', dy='03');   -- nested partitions

-- remove a partition from the catalog (PURGE also deletes files for managed tables)
ALTER TABLE events DROP IF EXISTS PARTITION (dt='2025-05-02');
```

Use `ADD PARTITION` when you **know exactly which** partition(s) arrived (e.g., your loader appends one each run) — it's an O(1) metadata write, supports **custom `LOCATION`**, and scales to tables with millions of partitions because it touches **only** the new ones.

**Option 2 — `MSCK REPAIR TABLE` (auto-discover from the directory layout)**

```sql
MSCK REPAIR TABLE events;                        -- scan the table's LOCATION, add any missing partitions
MSCK REPAIR TABLE events ADD PARTITIONS;         -- explicit "add" (the default)
MSCK REPAIR TABLE events DROP PARTITIONS;        -- remove partitions whose directories no longer exist
MSCK REPAIR TABLE events SYNC PARTITIONS;        -- add new + drop deleted (full reconcile)
```

`MSCK REPAIR` walks the table's storage **LOCATION**, finds every directory matching the **Hive-style** `partcol=value/` layout that isn't in the metastore, and registers it — so you don't list partitions by hand. Equivalents in sibling engines:

| Engine | Discover partitions |
|---|---|
| **Hive** | `MSCK REPAIR TABLE t [ADD\|DROP\|SYNC PARTITIONS]` |
| **Spark SQL** | `ALTER TABLE t RECOVER PARTITIONS;` (or `spark.sql("MSCK REPAIR TABLE t")`) |
| **Athena / Trino** | `MSCK REPAIR TABLE t;` (adds only) — or **partition projection** to skip it entirely |

**Requirement — Hive-style paths.** `MSCK REPAIR` only finds directories named `dt=2025-05-02/` (the `key=value` convention). If your files sit under bare folders like `.../2025-05-02/` (no `dt=`), `MSCK` finds **nothing** — you must use `ADD PARTITION … LOCATION` instead (or rewrite the layout).

**Performance — it scans *everything* every time.** `MSCK REPAIR` lists **all** directories under the table location on each run (a full S3/HDFS listing). On a table with thousands–millions of partitions this is **slow and costly** (lots of object-store list calls), and it re-checks already-known partitions. So:

- For **routine, incremental** loads, prefer **`ALTER TABLE ADD PARTITION`** per new partition (touch only what changed).
- Use **`MSCK REPAIR`** for **initial onboarding** of an existing tree, or occasional full reconciles (`SYNC`).
- On **Athena**, prefer **partition projection** (compute partitions from a rule in `TBLPROPERTIES`) so no `MSCK`/`ADD PARTITION` is ever needed.

**Verify and inspect:**

```sql
SHOW PARTITIONS events;                           -- what the metastore currently knows
SHOW PARTITIONS events PARTITION (dt='2025-05-02');
DESCRIBE FORMATTED events PARTITION (dt='2025-05-02');   -- its location, format, stats
```

**Gotchas:** `MSCK` (older Hive) only **adds** unless you say `DROP/SYNC`, so deleted directories linger as dead partitions; partition values are **case-sensitive** in the path; empty or malformed directories are skipped; and a partition registered with the **wrong `LOCATION`** reads the wrong files — fix with `ALTER TABLE … PARTITION (...) SET LOCATION`.

## 5. Partitioning — static and dynamic

Partitioning stores each value of the partition column in its **own directory**:

```
s3://lake/events/dt=2025-05-01/part-00000.orc
s3://lake/events/dt=2025-05-02/part-00000.orc
```

A query `WHERE dt = '2025-05-02'` reads **one directory** (partition pruning) and skips the rest. Partition on a **low-cardinality column you filter on** — almost always **date**.

```sql
-- STATIC: you name the partition explicitly
INSERT INTO events PARTITION (dt='2025-05-01') SELECT id, ts, page, amount, props, tags, geo FROM staging WHERE ...;

-- DYNAMIC: Hive derives partitions from the SELECT's last column(s)
SET hive.exec.dynamic.partition=true;
SET hive.exec.dynamic.partition.mode=nonstrict;
INSERT INTO events PARTITION (dt) SELECT id, ts, page, amount, props, tags, geo, dt FROM staging;
```

> **Risk of dynamic partitioning:** a high-cardinality or dirty partition column creates a flood of **tiny partitions/files**, hurting metadata and read performance. Bound and validate the column.

## 6. Bucketing — hashing into fixed files

```sql
CREATE TABLE users (user_id BIGINT, name STRING)
CLUSTERED BY (user_id) INTO 256 BUCKETS
STORED AS ORC;
```

Bucketing **hashes** rows into a fixed number of files — for **high-cardinality** join keys you can't partition by (partitioning `user_id` would make millions of directories). Benefits: **bucket map joins** (two tables bucketed the same way on the key join **bucket-by-bucket without a full shuffle**) and **sampling** (`TABLESAMPLE(BUCKET 1 OUT OF 256)`). Common pattern: **partition by date, bucket by user_id**.

## 7. File formats & SerDes

Prefer **columnar ORC or Parquet** over text/CSV for: **column pruning** (read only needed columns), **predicate pushdown** via per-stripe **min/max stats** (skip row groups), and strong **compression** (ZLIB/Snappy/ZSTD).

### What a SerDe actually is

Because Hive is **schema-on-read** over arbitrary files, two things must happen to read a row:

1. The **InputFormat** splits files into raw **records** (e.g., one line of text, one ORC stripe).
2. The **SerDe** (Serializer/De-serializer) turns each raw record into **typed columns** — the *De*serialize path (read). On write, the *Serialize* path turns columns back into bytes.

So a table's storage is `INPUTFORMAT + OUTPUTFORMAT + SerDe`. `STORED AS ORC/PARQUET/TEXTFILE` is just shorthand that picks all three. There are **two DDL styles**:

```sql
-- (a) shorthand: ROW FORMAT DELIMITED → the default LazySimpleSerDe
ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' STORED AS TEXTFILE

-- (b) explicit: name the SerDe class and pass it options via WITH SERDEPROPERTIES
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES ('separatorChar'=',', 'quoteChar'='"')
STORED AS TEXTFILE
```

### The common SerDes

| Format | SerDe class | Use |
|---|---|---|
| Delimited text | **LazySimpleSerDe** (default) | CSV/TSV without quoting; complex-type delimiters |
| Real CSV | **OpenCSVSerde** | Quoted/escaped CSV (commas inside quotes) |
| JSON | **JsonSerDe** (openx or hcatalog) | One JSON object per line, incl. nested |
| Log lines | **RegexSerDe** | Extract columns from text via a regex |
| Multi-char delim | **MultiDelimitSerDe** | Delimiters longer than one char (e.g. `||`) |
| Avro | **AvroSerDe** | Avro files (+ schema) |
| ORC / Parquet | **OrcSerde / ParquetHiveSerDe** | Columnar (usually implicit via `STORED AS`) |

### 1. LazySimpleSerDe — delimited text (+ complex types, header skip)

```sql
CREATE EXTERNAL TABLE logs_txt (
  id BIGINT, page STRING, tags ARRAY<STRING>, props MAP<STRING,STRING>
)
ROW FORMAT DELIMITED
  FIELDS TERMINATED BY '\t'           -- column delimiter
  COLLECTION ITEMS TERMINATED BY ','  -- array/struct element delimiter
  MAP KEYS TERMINATED BY ':'          -- map key:value delimiter
  LINES TERMINATED BY '\n'
  NULL DEFINED AS '\\N'
STORED AS TEXTFILE
LOCATION 's3://lake/logs/'
TBLPROPERTIES ('skip.header.line.count'='1');   -- ignore a header row
```

### 2. OpenCSVSerde — real CSV with quotes/escapes

```sql
CREATE EXTERNAL TABLE customers_csv (id STRING, name STRING, note STRING)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
  'separatorChar' = ',',
  'quoteChar'     = '"',
  'escapeChar'    = '\\'
)
STORED AS TEXTFILE LOCATION 's3://lake/customers/'
TBLPROPERTIES ('skip.header.line.count'='1');
```

> **Gotcha:** OpenCSVSerde reads **every column as `STRING`** (it ignores declared types like INT/DATE). Cast in your queries (`CAST(id AS BIGINT)`) or build a typed view on top. Use LazySimpleSerDe when there's no quoting and you want native typing.

### 3. JSON — nested objects, malformed handling, key mapping

```sql
CREATE EXTERNAL TABLE events_json (
  id BIGINT, page STRING,
  geo STRUCT<lat:DOUBLE, lon:DOUBLE>,        -- nested object
  ts  STRING
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
WITH SERDEPROPERTIES (
  'ignore.malformed.json' = 'true',          -- skip bad lines instead of failing
  'case.insensitive'      = 'true',
  'mapping.ts'            = 'timestamp'       -- JSON key "timestamp" -> column "ts" (reserved word / rename)
)
LOCATION 's3://lake/json/';
```

(`org.apache.hive.hcatalog.data.JsonSerDe` is the bundled alternative; the openx one is common on Athena/EMR.) The data is **one JSON object per line**; nested fields map to `STRUCT`/`MAP`/`ARRAY` columns and are read with `geo.lat`, `props['k']`, etc.

### 4. RegexSerDe — parse semi-structured log lines

```sql
-- e.g. an Apache-style access log:  127.0.0.1 - - [time] "GET /x" 200
CREATE EXTERNAL TABLE access_log (ip STRING, ts STRING, request STRING, status INT)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.RegexSerDe'
WITH SERDEPROPERTIES (
  'input.regex' = '^(\\S+) \\S+ \\S+ \\[([^\\]]+)\\] "([^"]*)" (\\d+).*'
)
STORED AS TEXTFILE LOCATION 's3://lake/access/';
```

Each **regex capture group** maps to a column in order. Lines that don't match yield NULLs — great for taming messy logs without a preprocessing job.

### 5. MultiDelimitSerDe — delimiters longer than one character

```sql
CREATE EXTERNAL TABLE piped (a STRING, b STRING)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.MultiDelimitSerDe'
WITH SERDEPROPERTIES ('field.delim'='||')      -- LazySimpleSerDe only allows single-char delimiters
STORED AS TEXTFILE LOCATION 's3://lake/piped/';
```

### 6. Avro — schema-carrying binary

```sql
CREATE EXTERNAL TABLE users_avro
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.avro.AvroSerDe'
STORED AS AVRO
LOCATION 's3://lake/users_avro/'
TBLPROPERTIES ('avro.schema.url'='s3://lake/schemas/user.avsc');  -- or avro.schema.literal='{...}'
```

### 7. ORC / Parquet — usually implicit

`STORED AS ORC` / `STORED AS PARQUET` selects the OrcSerde / ParquetHiveSerDe automatically — you rarely name them. You can still pass options via `TBLPROPERTIES` (`'orc.compress'='ZLIB'`, `'parquet.compression'='SNAPPY'`).

### Changing a SerDe / its properties

```sql
ALTER TABLE customers_csv SET SERDEPROPERTIES ('separatorChar'=';');   -- tweak an option
ALTER TABLE t SET SERDE 'org.openx.data.jsonserde.JsonSerDe' WITH SERDEPROPERTIES (...);
DESCRIBE FORMATTED customers_csv;     -- inspect the active SerDe + its properties
```

**SerDe gotchas:** OpenCSVSerde forces all-`STRING` columns; a wrong `FIELDS TERMINATED BY` silently shoves everything into the first column; `skip.header.line.count` lives in `TBLPROPERTIES`, not `SERDEPROPERTIES`; regex must match the **whole** line; and JSON keys that are SQL reserved words need a `mapping.<col>` property.

## 8. Querying — HiveQL beyond SELECT

```sql
-- joins (the optimizer can broadcast a small side: a map join)
SELECT e.page, u.name FROM events e JOIN users u ON e.id = u.user_id WHERE e.dt='2025-05-01';

-- window functions
SELECT user_id, dt, amount,
       SUM(amount) OVER (PARTITION BY user_id ORDER BY dt) AS running_total
FROM events;

-- complex-type access + explode an array into rows
SELECT id, props['utm_source'] AS source, geo.lat, tag
FROM events LATERAL VIEW explode(tags) t AS tag;

-- DISTRIBUTE/SORT/CLUSTER BY control how data is partitioned/sorted across reducers
SELECT * FROM events DISTRIBUTE BY user_id SORT BY ts;
```

`LATERAL VIEW explode(...)` is the Hive idiom for flattening `ARRAY`/`MAP` columns into rows (the equivalent of Snowflake's `FLATTEN`).

## 9. Query optimizations

- **Partition pruning** — skip irrelevant partition directories entirely.
- **Predicate & projection pushdown** — ORC/Parquet skip row groups and read only needed columns.
- **Vectorization** — process **~1024-row batches** instead of row-by-row (`SET hive.vectorized.execution.enabled=true;`).
- **Cost-based optimizer (CBO)** — uses stats from `ANALYZE` to pick **join order** and broadcast decisions; stale/absent stats → poor plans.
- **Map (broadcast) join** — load a small side into memory per mapper, avoiding the shuffle (`SET hive.auto.convert.join=true;`).

```sql
ANALYZE TABLE events PARTITION(dt) COMPUTE STATISTICS FOR COLUMNS;   -- feed the CBO
```

## 10. Hive ACID transactions

Modern Hive supports **ACID** on ORC tables — `INSERT`/`UPDATE`/`DELETE`/`MERGE` — via base + delta files that are periodically **compacted**:

```sql
MERGE INTO dim_customer t USING staged_updates s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET t.city = s.city
WHEN NOT MATCHED THEN INSERT VALUES (s.id, s.name, s.city);
```

In practice, lakehouse formats (**Delta, Iceberg, Hudi**) now usually fill this transactional role over the same files.

## 11. Hive vs Spark SQL vs Trino today

You rarely run the **Hive engine** now (batch-oriented, slower), but you use the **metastore** constantly:

- **Spark SQL** reads Hive-defined tables through the metastore and executes **in-memory** — much faster, for ETL and SQL (HiveQL ≈ Spark SQL syntactically).
- **Trino/Presto** queries the same tables **interactively** (MPP, federated).
- **AWS Glue Data Catalog** is a managed Hive-compatible metastore used by Athena/EMR/Redshift Spectrum.

*Hive gave us SQL-on-files + the catalog; modern engines provide the speed over the same tables.*

## 12. Gotchas

- **Forgetting `MSCK REPAIR` / `ADD PARTITION`** — files written by another process are invisible until registered.
- **Dynamic partition explosion** — high-cardinality partition columns create tiny-file floods.
- **Dropping a managed table deletes data** — use **external** tables for shared lake data.
- **Stale CBO stats** — run `ANALYZE` or get bad join plans.
- **Small files** — many tiny files hurt; compact (e.g., `INSERT OVERWRITE` to rewrite, or concatenate).
- **Text/CSV by default** — specify **ORC/Parquet**; text loses pruning/pushdown/compression.

## Scenario — a partitioned, bucketed, columnar lake table

Clickstream files land hourly in S3. You define an **EXTERNAL** table `events` **partitioned by `dt`**, **bucketed by `user_id`** into 256 buckets, **STORED AS ORC** with ZLIB compression, holding `ARRAY`/`MAP`/`STRUCT` columns for flexible attributes. A loader writes `dt=…/` directories and calls **`MSCK REPAIR TABLE`** so the metastore sees them. Analysts query with **partition pruning** (`WHERE dt='…'`), **column pruning** (3 of 50 columns), and **`LATERAL VIEW explode`** to flatten tags; a join to `users` (also bucketed by `user_id`) uses a **bucket map join** (no shuffle). You run `ANALYZE` so the **CBO** orders joins well, and enable **vectorization**. The queries themselves run on **Spark SQL** / **Trino** against the **same Hive metastore** — fast engines over Hive-defined tables. That's modern Hive: the catalog and table design endure; the engine got replaced.

## Practice

1. Write the DDL for an external, date-partitioned, ORC `events` table with an `ARRAY<STRING>` and a `MAP<STRING,STRING>` column.
2. A dt-partitioned ORC query filters one day and selects 3 of 50 columns — name the three optimizations that make it fast.
3. Static vs dynamic partitioning: write both INSERT forms and state the risk of dynamic.
4. When do you **bucket** instead of (or together with) partitioning, and what join does it enable?
5. Another process wrote new `dt=…/` directories. Why can't Hive see them, and which two commands fix it?
6. Write a query that explodes a `tags ARRAY<STRING>` to one row per tag and reads a value from a `props MAP`.
7. Why does the CBO need `ANALYZE`, and what does it improve?
8. Today, what part of Hive do you actually use, and what runs the queries?
9. Write the DDL for a **quoted CSV** table (commas inside quotes) with a header row using **OpenCSVSerde**; explain the all-`STRING` gotcha and how you'd expose typed columns.
10. Choose the SerDe for: (a) tab-delimited text with an `ARRAY` column, (b) one-JSON-object-per-line with a nested `geo` struct and a key named `timestamp`, (c) Apache access-log lines. Write the `ROW FORMAT` clause for each.
11. Write a **RegexSerDe** table that parses `ip - - [ts] "request" status` into four columns.
12. For each, pick `ALTER TABLE ADD PARTITION` or `MSCK REPAIR TABLE` and justify: (a) your loader appends exactly one `dt=` partition each night, (b) you're onboarding 5 years of existing `dt=` directories at once, (c) some old directories were deleted and you want the catalog reconciled.
13. `MSCK REPAIR TABLE t` returns *nothing* even though files exist under `s3://lake/t/2025-05-02/`. Why, and what are your two fixes?
14. Your nightly `MSCK REPAIR` on a 2-million-partition table has become very slow/expensive. Explain why and give two better approaches.

## Interview check

> *"Walk me through how Hive runs a query and why it's still relevant."*

The **client/Beeline** hits **HiveServer2**; the **driver** takes the HiveQL; the **compiler** parses it and resolves tables against the **metastore**; the **optimizer** applies partition pruning, pushdown, and CBO join ordering to build a physical plan; an **execution engine** (Tez/Spark, historically MR) runs it; results are written via the table's format. Tables are **schema-on-read** over files — usually **external**, **ORC/Parquet**, **partitioned by date**, sometimes **bucketed** for joins, with partitions registered via `ADD PARTITION`/`MSCK REPAIR`. Hive remains relevant chiefly through its **metastore** — the catalog Spark SQL, Trino, Presto, and Glue all share — so today you keep Hive-defined tables but run them on a **faster engine**.
