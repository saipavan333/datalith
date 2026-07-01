# The Glue Data Catalog (central metastore) — the complete guide

On a data lake the files live in S3, but engines need to know **what tables exist, their schema, and where the data is**. The **Glue Data Catalog** is that shared brain — the Hive-compatible metastore that Athena, Redshift Spectrum, EMR, and Glue ETL all read. Understand it and the whole AWS lakehouse makes sense. This chapter is the full reference.

@@diagram:aws-glue-catalog

## 1. Why a catalog exists

S3 is just objects. To run `SELECT * FROM orders`, an engine must map "orders" to **columns/types**, an **S3 location**, a **file format**, and **partitions**. Storing that mapping per-engine leads to duplication and drift. The **Data Catalog** centralizes it: define a table **once**, query it from **every** engine.

## 2. The object hierarchy

```
Catalog (per account/region)
└── Database (namespace)
    └── Table  → S3 location, columns+types, SerDe/format, table properties, partition keys
        └── Partitions (key=value prefixes, each with its own location/stats)
```

- **Database** — a grouping of tables (e.g. `raw`, `analytics`).
- **Table** — the logical table: **schema**, **S3 `LOCATION`**, **input/output format + SerDe** (how to read Parquet/JSON/CSV), **partition keys**, and properties.
- **Partition** — a registered `key=value` prefix so engines prune; large tables have many partitions, each pointing at a sub-prefix.

## 3. Shared by every engine

The same table is read by:
- **Athena** — serverless SQL.
- **Redshift Spectrum** — query lake data from Redshift; join with warehouse tables.
- **EMR / Spark / Hive** — the Glue Catalog acts as the **Hive metastore**.
- **Glue ETL** — sources/sinks reference catalog tables.
- **Lake Formation** — layers **fine-grained permissions** on catalog objects.

It's **Hive-metastore-compatible**, so existing Hive/Spark tooling and DDL work.

## 4. How tables get created

| Method | When |
|---|---|
| **Crawler** | Unknown/evolving schema; discovery (next lesson) |
| **Athena DDL** (`CREATE EXTERNAL TABLE … LOCATION …`) | Known/stable schema |
| **Glue API / IaC** (Terraform, CloudFormation, CDK) | Version-controlled production tables |
| **CTAS / ETL jobs** | Create + register output tables |
| **Table formats** (Iceberg/Delta) | ACID tables registered in the catalog |

For production, prefer **IaC** so table definitions are reviewed and reproducible.

## 5. Partitions

Partitions are first-class catalog objects. New data in a new prefix isn't queryable until its partition is **registered** — via a crawler, `ALTER TABLE ADD PARTITION`, `MSCK REPAIR TABLE`, a Lambda, or **Athena partition projection** (compute partitions from a pattern, no registration). Managing partitions well is most of operating a catalog (covered in the Athena lessons).

## 6. Governance & integration

- **Lake Formation** — central, fine-grained (database/table/column/row) permissions over catalog objects, beyond IAM.
- **Resource policies / cross-account** — share catalog data across accounts.
- **Catalog encryption** and **CloudTrail** for audit.
- **Schema registry** (separate) for streaming schema management.

## 7. Gotchas

- **Wrong `LOCATION` or SerDe** → engines read garbage or nothing; verify table properties.
- **Unregistered partitions** → new data invisible; add partitions (or use projection).
- **Schema drift from crawlers** → pin schemas via DDL/IaC where stable (next lesson).
- **Mixed schemas under one prefix/table** → confusion; one schema per table.
- **Catalog as a bottleneck of truth** → manage it in IaC, not ad-hoc console clicks.
- **Cross-region** — the catalog is regional; plan multi-region access deliberately.

## Scenario — define once, query everywhere

A team defines `analytics.orders` **once** in the Data Catalog (via Terraform): schema, `LOCATION s3://lake/curated/orders/`, Parquet SerDe, partitioned by `year/month/day`. Immediately it's usable by an analyst in **Athena**, by a finance team via **Redshift Spectrum** (joining it to warehouse dims), by a data scientist's **EMR** Spark job, and by a nightly **Glue** transform — all on the **same definition**, governed centrally by **Lake Formation**. When a new day lands, they register the partition (projection, actually, so it's automatic) and every engine sees it. There's **no per-engine schema** to drift. The catalog is what makes "open files on S3, many engines, one truth" real — the core of the AWS lakehouse.

## Practice

1. What does the Data Catalog store, and what stays in S3?
2. Walk the hierarchy database → table → partition and what a table definition includes.
3. Which engines share the catalog, and why does Hive-compatibility matter?
4. List ways to create tables and which you'd use for production.
5. Why must partitions be registered, and what are the options?
6. How does Lake Formation relate to the catalog?
7. Two engines have drifting schemas for the same S3 data — diagnose and fix.
