# Iceberg tables — the open lakehouse, complete

Iceberg tables are how Snowflake stops being a walled garden: your data stays as **open Apache Iceberg in your own bucket**, Snowflake provides the engine and governance, and other engines (Spark, Trino, Flink) share the same tables. This chapter covers external volumes, the managed-vs-unmanaged decision, catalogs, and when Iceberg beats a native table.

@@diagram:snow-iceberg

## 1. Why Iceberg tables exist

Native Snowflake tables live in **Snowflake-managed** storage — fastest, fully featured, but **closed** to other engines and tied to Snowflake's storage. **Iceberg tables** let Snowflake operate on **open Apache Iceberg** data in **your** cloud storage, so:

- The data is **open** — Spark/Trino/Flink can read (and, for unmanaged, write) it.
- You **control the storage** (your bucket, your region, your lifecycle).
- **No lock-in** — the table format is an open standard.

## 2. External volumes

An **external volume** is a secured, least-privilege pointer to a storage location (S3/GCS/Azure) where the Iceberg files live:

```sql
create external volume vol storage_locations =
  (( name='s3' storage_provider='s3'
     storage_base_url='s3://acme-lake/iceberg/'
     storage_aws_role_arn='arn:aws:iam::123:role/sf' ));
```

Snowflake reads/writes Iceberg data and metadata **there** rather than in Snowflake storage.

## 3. Managed vs unmanaged — the decision is *who writes*

| | Snowflake-managed Iceberg | Externally-managed (unmanaged) |
|---|---|---|
| **Catalog** | Snowflake | Glue / Iceberg REST / external |
| **Writer** | **Snowflake** | **Other engines** (Spark/Flink) |
| **Snowflake can** | read **and write** (full DML, time travel, best perf) | **read** (and limited interop) |
| **Use when** | Snowflake is the writer; you want Snowflake features over open files | external engines own the writes; Snowflake consumes |

```sql
-- managed: Snowflake writes open Iceberg into YOUR bucket, with full DML + time travel
create iceberg table marts.events (id int, ts timestamp, region string)
  external_volume='vol' catalog='snowflake' base_location='events/';
insert into marts.events ...;          -- writes Iceberg files in s3://acme-lake/iceberg/events/
```

For **unmanaged**, you point Snowflake at the **external catalog** (Glue/Iceberg REST/Polaris) and it **reads** what Spark/Flink wrote.

## 4. Catalog integration & interop

The **catalog** coordinates Iceberg metadata across engines. Snowflake supports the **Iceberg REST** spec / **Polaris** (open catalog) and **Glue**, so the **same** tables are visible to Snowflake **and** Spark/Trino/Flink. This is the shared-lake layer: one open copy, many engines.

## 5. Iceberg table vs native table

| Native table | Iceberg table |
|---|---|
| Snowflake-managed storage | **Your** storage (external volume) |
| Max performance & features | Open, multi-engine, no lock-in |
| Closed format | **Open Apache Iceberg** |
| Default for Snowflake-centric work | The **shared lake** / interop layer |

Many shops use **both**: native tables for internal marts (max speed), Iceberg for the data other teams/engines must share.

## 6. Gotchas

- **Who-writes drives the type** — get this wrong and you can't write (unmanaged) or other engines can't cleanly own the data (managed).
- **External volume permissions** — least-privilege the role to the exact prefix; it's your bucket.
- **Performance** — managed Iceberg is fast, but native tables can still edge it for pure-Snowflake hot paths; choose Iceberg for the **interop/openness** benefit, not blindly.
- **Catalog setup** — interop needs the catalog wired correctly (Iceberg REST/Polaris/Glue); test cross-engine reads.
- **Maintenance** — Snowflake-managed Iceberg handles table maintenance (compaction, snapshots); unmanaged depends on the writer.

## Scenario — one open copy, two engines

A company's ML platform team uses **Spark**; analytics uses **Snowflake**. They standardize the shared lake on **Iceberg in the company's S3 bucket** via an **external volume**. Because **Snowflake is the writer** for curated marts, they use **Snowflake-managed Iceberg** (`catalog='snowflake'`) — Snowflake gets **full DML, time travel, and performance**, writing **open Iceberg files** into the bucket. The catalog is exposed via **Iceberg REST/Polaris**, so the **Spark** team reads the **same** tables for training — **no copies, no nightly export, no lock-in**. For a dataset that **Spark produces**, they flip to **externally-managed** Iceberg (Glue catalog) and Snowflake **reads** it. Internal-only marts that never leave Snowflake stay **native** for max speed. One open lake, the right table type per writer — the lakehouse done with open standards.

## Practice

1. Create an external volume and a Snowflake-managed Iceberg table; explain what's stored where.
2. Decide managed vs unmanaged for: (a) Snowflake writes curated marts other engines read, (b) Spark writes and Snowflake reads. Justify.
3. Explain how the catalog (Iceberg REST/Polaris/Glue) enables multi-engine interop.
4. When is a native table the better choice than Iceberg?
5. Why does "who writes?" determine the Iceberg table type?
