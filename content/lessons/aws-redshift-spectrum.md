# Redshift Spectrum: query the lake from the warehouse — the complete guide

Spectrum dissolves the wall between **warehouse** and **lake**: it runs Redshift SQL directly over **S3** (via the Glue Catalog), so you keep hot data in Redshift, leave cold/huge data in the lake, and **join across both** in one query — without loading everything into the warehouse. This chapter covers how it works, the hot/cold pattern, and its cost model.

@@diagram:aws-redshift-spectrum

## 1. The problem it solves

Loading **all** your data into Redshift is expensive when much of it is **cold** (years of history, rarely queried). But querying everything ad-hoc on the lake is slow for **hot** dashboard paths. **Spectrum** lets you have both: **warehouse performance for hot data, lake economics for cold data**, joined seamlessly.

## 2. How it works

- Create an **external schema** that points at a **Glue Data Catalog** database (the same catalog Athena/Glue/EMR use), with an **IAM role** for S3 access:
```sql
CREATE EXTERNAL SCHEMA lake
  FROM DATA CATALOG DATABASE 'analytics'
  IAM_ROLE 'arn:aws:iam::123:role/redshift-spectrum';
```
- **External tables** map to **S3** data (Parquet/ORC/etc.) with partitions.
- A query on an external table is handled by a **large, separate fleet of Spectrum nodes** that **scan S3 in parallel**, **push down** filters/projections, and stream results back to your Redshift cluster, which **joins** them with **local** tables and finishes:
```sql
SELECT l.event_type, count(*), d.segment
FROM lake.events l
JOIN public.dim_customer d ON l.cust_id = d.id   -- lake table JOIN local table
WHERE l.year = 2025 AND l.month = 5              -- partition filter (prune S3)
GROUP BY 1, 3;
```

## 3. The hot/cold pattern

- **Hot, frequently-queried** data → **loaded** into Redshift local tables (tuned **dist/sort keys**, fast dashboards).
- **Cold, huge, or rarely-queried historical** data → stays in **S3** (partitioned Parquet), queried via **Spectrum** on demand.
- **Join across both** in one query — no need to load terabytes of history just to query it occasionally.
- As hot data **ages out**, move it to the S3 history (still Spectrum-queryable).

## 4. Cost & performance (it's a scan model)

Spectrum is billed **per data scanned in S3** — the **same model as Athena**. So the **same lake-layout rules** govern cost/speed:
- **Partition** the S3 data and **filter on partition columns** to prune.
- Store **columnar (Parquet/ORC) + compressed**.
- **Project only needed columns**; avoid `SELECT *`.
- **Compact** to sensible file sizes.
- Keep **frequently joined/filtered** data **local** in Redshift; use Spectrum for the **long tail**.

## 5. Relationship to the lakehouse

Spectrum reads the **shared Glue Catalog**, so the **same S3 tables** are queryable by **Athena, EMR, and Redshift** — one lake, many engines. Redshift becomes a **query engine over both** its managed storage and S3, blurring warehouse vs lake. (It also supports **Iceberg/Delta**-style lake tables in the catalog.)

## 6. Gotchas

- **Unpartitioned / unfiltered external query** → scans the whole S3 dataset (expensive/slow); always partition + filter.
- **Row formats (CSV/JSON)** → far more scanned; use Parquet.
- **Treating Spectrum as the hot path** → it's for cold/occasional data; load hot data locally and tune it.
- **Huge cross joins / no pushdown** → big S3 scans; structure queries for predicate/projection pushdown.
- **IAM/role misconfig** → external schema can't read S3 or the catalog; grant the role properly.
- **Concurrency/cost** at scale → monitor S3 scan; consider materializing very hot subsets locally.

## Scenario — 90 days hot, years cold, one query

A team keeps the **last 90 days** of events **loaded** in Redshift with **DISTKEY** on the main join key and a **sort key on date**, so daily dashboards are **fast**. **Years of history** live in **S3 Parquet, partitioned by date**, registered in the **Glue Catalog** — never loaded into Redshift (it would be costly storage rarely touched). An occasional **year-over-year** report uses **Spectrum**: an external schema over the catalog, a query that **filters on the date partition** (so Spectrum scans only the relevant S3 partitions) and **joins** the historical lake data to **local dimension tables** in one SQL statement. Day-to-day dashboards stay fast on hot local data; the rare historical query reads cold data **from the lake on demand** at lake economics — no terabyte load into the warehouse. The same S3 tables are also queried by Athena and EMR via the shared catalog. Spectrum gave them **warehouse speed + lake economics**, joined seamlessly.

## Practice

1. What does Spectrum let Redshift do, and how does the external schema relate to the Glue Catalog?
2. Walk through how a Spectrum query executes (Spectrum fleet, pushdown, join with local).
3. Describe the hot/cold data pattern and why it's economical.
4. How is Spectrum billed, and which lake-layout optimizations matter?
5. How does Spectrum fit the one-lake-many-engines lakehouse idea?
6. Design a Redshift+Spectrum setup for 90 days hot + years cold.
7. A Spectrum query is slow/expensive — what do you check, given the scan model?
