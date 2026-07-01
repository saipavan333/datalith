# Glue ETL: Spark jobs & DynamicFrames — the complete guide

Glue ETL is **Apache Spark without the ops** — serverless, catalog-integrated, billed per DPU. Its signature feature, the **DynamicFrame**, is built to absorb the messy, schema-drifting reality of source data, then hand off to ordinary Spark DataFrames for heavy relational work. This chapter covers the model, DynamicFrames vs DataFrames, transforms, authoring, and tuning.

@@diagram:aws-glue-etl

## 1. Serverless Spark

You write a Glue job (PySpark or Scala) and Glue **provisions, runs, and tears down** the Spark environment — no cluster to size or manage. Compute is measured in **DPUs** (Data Processing Units); you choose a worker type and number (or **auto scaling**), and pay for the run. This is the managed-ETL default on AWS.

## 2. DynamicFrames vs DataFrames

Glue adds the **DynamicFrame**, a Spark abstraction for **messy, semi-structured, schema-drifting** data:

| | DynamicFrame | DataFrame |
|---|---|---|
| Schema | **Flexible** — no fixed schema required; can hold a **choice** of types per field | Fixed schema |
| Built for | Reading varied/dirty source data, schema drift | Relational processing, SQL |
| Transforms | ApplyMapping, ResolveChoice, Relationalize, DropNullFields, Unbox… | Full Spark SQL/DataFrame API |
| Convert | `toDF()` → DataFrame | `DynamicFrame.fromDF()` → DynamicFrame |

**Rule of thumb:** use **DynamicFrames at the messy edge** (ingest, drift, ambiguous types), then **`toDF()`** for **joins/aggregations/SQL**, optionally `fromDF()` back if a Glue sink expects a DynamicFrame.

## 3. Key DynamicFrame transforms

- **`ApplyMapping`** — rename and **cast** columns to a target schema.
- **`ResolveChoice`** — settle fields with **ambiguous/mixed types** (cast, make struct, drop).
- **`Relationalize`** — **flatten nested** JSON/arrays into relational tables (with join keys).
- **`DropNullFields` / `DropFields` / `SelectFields`** — prune.
- **`Unbox`** — parse a string column (e.g. embedded JSON) into structured fields.
- **`Filter` / `Map`** — row-level logic.

## 4. Sources & sinks

- **Read:** Data Catalog tables, S3 directly, **JDBC** (RDS/Redshift/etc.), streaming (Kinesis/Kafka via Glue streaming).
- **Write:** S3 (partitioned Parquet/ORC), Redshift, JDBC, the catalog (create/update tables), or table formats (Iceberg/Delta/Hudi via Glue).
- Glue can **partition outputs** and **update the catalog** as it writes.

## 5. Authoring options

- **Glue Studio** — **visual** drag-and-drop job builder that generates code (plus a code view). Good for standard ETL and onboarding.
- **Scripts** — full **PySpark/Scala** for complex logic.
- **Interactive sessions / notebooks** — develop and test on real Glue Spark **before** deploying (separate lesson).

## 6. Versions, scaling & cost

- **Glue version** tracks a modern Spark/Python; use a current version.
- **Worker types** (standard/G.1X/G.2X/G.4X/G.8X) and counts set memory/CPU; **auto scaling** sizes to the data.
- **Flex execution class** runs non-urgent jobs on spare capacity for **lower cost** (higher/variable latency).
- **Job bookmarks** for incrementality (separate lesson).
- **Glue for Ray** for Python-centric distributed workloads.

## 7. Gotchas

- **Doing everything in DynamicFrames** — they're for messiness, not heavy SQL; `toDF()` for joins/aggregations and performance.
- **Tiny output files** — partition/coalesce writes to ~128 MB–1 GB; don't emit thousands of small files.
- **Ignoring auto scaling/Flex** — overpaying; tune workers and use Flex for non-urgent jobs.
- **No bookmarks** — reprocessing everything each run (next lesson).
- **Schema assumptions** — source drift breaks rigid code; that's exactly when DynamicFrames help.
- **Broadcast small joins / push filters early** — same Spark perf rules apply after `toDF()`.

## Scenario — messy JSON in, clean Parquet out

A nightly Glue job ingests a **nested, occasionally-malformed JSON** feed. It reads as a **DynamicFrame** (tolerant of missing/extra fields), uses **`Relationalize`** to flatten the nesting, **`ResolveChoice`** to settle a field that's sometimes int/sometimes string, and **`ApplyMapping`** to cast/rename to the target schema — routing clearly-bad records to a **quarantine** prefix. Then it **`toDF()`** to a Spark DataFrame, **broadcasts** a small dimension for the join, aggregates, and writes **partitioned Parquet** (~256 MB files) to `clean/`, updating the Data Catalog. **Bookmarks** ensure only new files are processed; **auto scaling** sizes the workers. No cluster was managed by hand. The DynamicFrame absorbed the JSON's irregularity; the DataFrame did the relational heavy lifting — the canonical Glue pattern.

## Practice

1. What does 'serverless Spark' mean for Glue, and how is it billed?
2. Contrast DynamicFrames and DataFrames and state the rule of thumb for using each.
3. Explain ApplyMapping, ResolveChoice, and Relationalize and when you'd use them.
4. What sources/sinks can Glue read/write, and how does it handle output partitioning/catalog?
5. Compare authoring via Glue Studio, scripts, and interactive sessions.
6. Which tuning levers control Glue cost/scale (workers, auto scaling, Flex)?
7. Design a Glue job for nested, malformed JSON joined to a dimension producing clean Parquet.
