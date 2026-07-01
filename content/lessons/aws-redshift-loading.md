# Redshift loading: COPY, UNLOAD, VACUUM & ANALYZE — the complete guide

How you get data **into** Redshift (and keep tables **healthy**) makes or breaks performance. The golden rule: **bulk-load in parallel with COPY**, never drip in row-by-row INSERTs; keep tables **sorted and analyzed** so zone maps and the planner stay effective — increasingly with automation doing it for you. This chapter is the loading and maintenance playbook.

@@diagram:aws-redshift-loading

## 1. COPY — the right way to load

**`COPY`** bulk-loads from **S3** (also DynamoDB, EMR, SSH) **in parallel across all slices** — each slice reads part of the input at once. It's **dramatically faster** than row-by-row `INSERT`s and avoids the table bloat/unsorted regions they create.

```sql
COPY sales FROM 's3://lake/clean/sales/'
  IAM_ROLE 'arn:aws:iam::123:role/redshift'
  FORMAT AS PARQUET;            -- or CSV/JSON with delimiters/options
```

**Key practice — split the input.** Provide **multiple files** (ideally a **multiple of the slice count**) so every slice loads in parallel. **One giant file** loads effectively single-threaded and wastes the cluster. COPY can also **auto-compress**, apply **column encodings**, and handle **load errors** (error tables, `MAXERROR`).

**Continuous ingestion:** **auto-copy** (auto-load new S3 files) and **streaming ingestion** (Kinesis/MSK directly into materialized views) handle ongoing data.

## 2. UNLOAD — exporting

**`UNLOAD`** writes query results **back to S3** in **parallel** (Parquet/CSV) — for sharing with the lake, other engines, or downstream tools:

```sql
UNLOAD ('SELECT * FROM sales WHERE year = 2025')
  TO 's3://lake/export/sales/'
  IAM_ROLE '...' FORMAT PARQUET PARALLEL ON;
```

## 3. Updates: stage + MERGE

Don't run many singleton `UPDATE`/`INSERT` statements. **COPY into a staging table**, then **`MERGE`** (or delete-then-insert) into the target in a set-based operation — far more efficient and less bloating.

## 4. Keeping tables healthy

- **VACUUM** — reclaims space from **deleted/updated** rows (which leave tombstones) and **re-sorts** rows into sort-key order so **zone-map skipping stays effective**. Newly loaded rows land **unsorted** until vacuumed. Variants: `VACUUM FULL` (reclaim + sort), `SORT ONLY`, `DELETE ONLY`, `REINDEX` (interleaved).
- **ANALYZE** — updates **table statistics** the query planner uses to choose join order, distribution, and plans. **Stale stats → bad plans → slow queries.** Run after large loads.

## 5. Automation (modern Redshift)

Much maintenance is now **automatic**:
- **Auto-vacuum** and **auto-analyze** run in the background.
- **Automatic Table Optimization (ATO)** can choose **distribution and sort keys** from observed workload.
- **Automatic compression** picks column encodings on load.
So manual VACUUM/ANALYZE and hand-tuning are less common — but still useful for **heavy update tables**, **after very large loads**, and **performance-critical** tables where you override AUTO.

## 6. Best practices

- **Load with COPY from split files**, not INSERTs.
- **Stage + MERGE** for upserts.
- **Compress on load**; let auto-encoding choose.
- Let **auto-vacuum/analyze** run; **ANALYZE** after big loads; **VACUUM** heavily-updated/unsorted tables.
- Monitor `SVV_TABLE_INFO` (unsorted %, skew, stats staleness) and load errors.

## 7. Gotchas

- **Row-by-row INSERTs** → slow, bloating; use COPY.
- **One huge input file** → no parallelism; split into many files.
- **Never vacuuming a heavily-updated table** → unsorted/bloated → weak zone-map skipping, wasted space.
- **Stale statistics** → bad query plans; ANALYZE after big changes.
- **Singleton DML for updates** → use staging + MERGE.
- **Ignoring load errors** → silent data issues; check error handling/tables.

## Scenario — fixing a slow, bloated warehouse

A pipeline loaded Redshift with **thousands of single-row INSERTs** nightly; over time queries crawled. Diagnosis: the singleton INSERTs were **slow** (no parallelism) and left the table **bloated and unsorted**, killing zone-map skipping. **Redesign:** write each night's data to **S3 as multiple Parquet files** and load with **one parallel `COPY`** (all slices at once); for updates, **COPY into staging + `MERGE`**; ensure **auto-vacuum/auto-analyze** are on, with a manual **`ANALYZE`** after the big load. The table is now loaded **fast and clean**, stays **sorted** (tight zone maps), and the planner has **fresh stats** — dashboards recovered. They monitor `SVV_TABLE_INFO` for unsorted % and skew. The lesson: Redshift is built for **parallel bulk loads and healthy sorted tables**, and modern **automation** keeps most of it healthy with minimal manual work.

## Practice

1. Why is COPY the right way to load Redshift, and why split the input into multiple files?
2. What does UNLOAD do, and when would you use it?
3. How should you handle updates/upserts (and why not singleton DML)?
4. Explain VACUUM and ANALYZE and why each matters for performance.
5. What maintenance does modern Redshift automate, and what should you still watch?
6. Redesign a pipeline that uses thousands of single-row INSERTs.
7. A heavily-updated table has weak block skipping and wasted space — diagnose and fix.
