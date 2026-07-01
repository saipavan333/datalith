# Data-lake layout: zones, prefixes & partitioning — the complete guide

S3 is the bedrock of an AWS data lake, and the single highest-leverage thing you control is **layout**. The same bytes laid out well versus badly can mean a query scans **megabytes** or **terabytes** — which is literally your Athena bill and your latency. This chapter is the full playbook for organizing a lake on S3.

@@diagram:aws-s3-layout

## 1. S3 is a flat key-value store

There are **no real directories**. An object has a **key** — a string like `clean/orders/year=2025/month=05/day=01/part-0001.parquet`. The `/` characters are just part of the key; the console's "folders" are a UI rendering of common **prefixes**. Everything you do for structure is really **prefix design**, and prefixes are what query engines use to **prune**.

## 2. Zones — the medallion pattern on S3

Organize the lake into **zones** by refinement level:

| Zone | Contents | Format |
|---|---|---|
| **raw/** (landing) | Data exactly as ingested, immutable | Source format (JSON/CSV/…) |
| **clean/** (staging) | Validated, deduped, typed | **Parquet** + compression |
| **curated/** (marts) | Modeled, partitioned, serving-ready | Parquet / table format |

Use **separate buckets** per zone when you want clean **security** and **lifecycle** boundaries (e.g. expire raw aggressively, lock down curated), or prefixes within one bucket for simplicity. Downstream engines (Athena, Glue, Redshift Spectrum, EMR) read these prefixes **directly** — no separate storage system.

## 3. Hive-style partitioning

Lay data out as `key=value` path segments:

```
s3://lake/clean/orders/year=2025/month=05/day=01/part-0001.parquet
```

Engines parse the partition columns from the **path** and **prune**: a query `WHERE year=2025 AND month=05` lists and scans **only that prefix**, skipping everything else. This is the biggest single performance/cost lever on a lake.

**Choosing partition columns:**
- Partition on **low-cardinality columns you filter on** — **date** is the canonical choice (`year/month/day`, or a single `dt=YYYY-MM-DD`).
- Keep partitions **reasonably sized** (≥ ~128 MB–1 GB of data each).
- **Don't over-partition**: high-cardinality columns (e.g. `user_id`) or too many levels create **millions of tiny partitions/files** — slow planning, expensive listing, poor parallelism. (See the dedicated gotcha below.)

## 4. File format & sizing

- **Columnar formats (Parquet/ORC)** + **compression** (Snappy default; ZSTD for better ratio) let engines read **only the needed columns** and far fewer bytes. This is non-negotiable for an analytics lake.
- **Right-size files to ~128 MB–1 GB.** Too many **small files** = per-file overhead, slow S3 listing, poor parallelism, and high Athena planning time. Compact small files (a Glue/EMR job, Firehose buffering, or `OPTIMIZE` on a table format).
- **Avoid** unsplittable formats (e.g. gzipped JSON in one huge file) — they can't be read in parallel.

## 5. Open table formats

**Iceberg**, **Delta**, and **Hudi** add a metadata layer over S3 Parquet, bringing **ACID transactions**, **schema/partition evolution**, **time travel**, and **metadata-driven file pruning** (skip files via stats, not just partitions). On AWS, **Athena, Glue, EMR, and Redshift** support Iceberg; it's increasingly the default for serious lakes because it fixes partition rigidity and small-file/consistency pain. Use a table format when you need updates/deletes, evolving schemas, or large-scale reliable pruning.

## 6. Naming & operational conventions

- Stable, predictable prefixes per dataset (`<zone>/<domain>/<table>/<partitions>/`).
- Separate **data** from **logs/inventory/athena-results** prefixes (and lifecycle them differently).
- Consistent partition keys so Glue/Athena partition discovery is predictable.

## 7. Gotchas

- **Over-partitioning** (high-cardinality or too many levels) → tiny-file explosion; partition on date-like filter columns only.
- **Tiny files** from streaming → compact; they wreck listing and parallelism.
- **Row formats / unsplittable compression** → can't parallelize; use Parquet + splittable compression.
- **Unpartitioned big tables** → every query full-scans (huge Athena cost).
- **Mixed schemas in one prefix** → crawler/engine confusion; keep a prefix to one schema/table.
- **Forgetting to add partitions** → new data invisible to Athena until `ADD PARTITION`/crawler/partition projection (covered in the Athena lessons).

## Scenario — a lake that scans GB, not TB

A team stores clickstream as `s3://lake/clean/clicks/year=/month=/day=/*.parquet` — **Snappy Parquet**, compacted to ~256 MB files, in a **clean** zone separate from immutable **raw** JSON. A dashboard query for last month filters `year=2025 AND month=05`: the engine **prunes** to ~30 day-prefixes and reads **only the projected columns**, scanning a few GB. The same data as one giant **uncompressed CSV** with no partitions would scan the **entire multi-TB history** on every query — slow and, on Athena's per-TB pricing, expensive. Later they migrate to **Iceberg** so they can evolve partitioning (add `country=`) and get row-group pruning without rewriting the world. The only thing that changed was **layout** — and it changed cost by orders of magnitude.

## Practice

1. Explain why S3 has no real folders and what that means for partitioning.
2. Describe the raw/clean/curated zone pattern and why you might use separate buckets.
3. How does Hive-style partitioning let engines prune, and how do you choose partition columns?
4. Why columnar + compression + ~128 MB–1 GB files? What goes wrong with tiny files?
5. What do open table formats (Iceberg/Delta) add over plain Parquet on S3?
6. Design the layout for a date-and-country-filtered dataset; justify your partitioning.
7. A table partitioned by `user_id` is slow — diagnose and fix.
