# Data layout — partitioning, file sizing & compaction — the complete guide

How data is physically arranged in files is often the single biggest performance lever
in a lake or warehouse — bigger than query tweaks. This guide covers partitioning,
clustering, file sizing, and compaction, with examples and practice.

## 1. Partitioning — prune to what you need

@@diagram:lakehouse-layout

**Partitioning** splits a table into folders by a column's value:

```
events/date=2025-05-01/part-0001.parquet
events/date=2025-05-02/...
```

A query filtering `WHERE date = '2025-05-02'` reads **one folder** (partition pruning)
instead of the whole table. Partition by a **low-cardinality column you filter on** —
almost always **date** (and maybe one more, like region).

## 2. Don't over-partition

Partitioning by a **high-cardinality** column (like `user_id`, millions of values)
creates **millions of tiny partitions and files**, each with metadata/listing overhead.
That's slower than no partitioning. Rule of thumb: aim for partitions of at least a few
hundred MB; partition by date, not by an id.

## 3. Clustering / Z-ordering — skip files

For a column you filter on but **can't** partition by (high cardinality), use
**Z-ordering** (Delta) or **clustering**: it physically co-locates rows with similar
values into the same files. Combined with per-file **min/max statistics**, the engine
**skips** files whose range can't contain your value (**data skipping**) — much of the
benefit of partitioning without the file explosion.

```sql
OPTIMIZE events ZORDER BY (customer_id);
```

## 4. The small-files problem

Streaming and frequent writes create **thousands of tiny files**. Each file has open/
read overhead and compresses poorly, so reads crawl and metadata bloats. This is one of
the most common lakehouse performance killers.

## 5. Compaction — fix small files

**Compaction** (`OPTIMIZE`) merges many small files into fewer, right-sized ones:

```sql
OPTIMIZE events;                  -- compact small files
OPTIMIZE events ZORDER BY (k);    -- compact + cluster
```

Target files of **~128 MB – 1 GB**. Schedule compaction on streaming/frequently-written
tables. (Then `VACUUM` removes the old, unreferenced files to reclaim storage — mindful
of time-travel retention.)

## 6. File format & size

- **Columnar (Parquet/ORC)** so a query reads only the columns it needs and compresses
  well — the analytics default.
- **Right file size** (~128 MB–1 GB): too small → overhead; too large → poor parallelism
  and wasteful reads.
- **Compression** (Snappy for speed, Zstd for ratio) and **row-group sizing** matter for
  big tables.

## 7. Putting it together

```
Good layout for an events table:
- partition by date            → prune by day
- Z-order by customer_id       → skip files for the hot filter
- compact nightly to ~256 MB   → no small-files problem
- store as Parquet (columnar)  → read only needed columns
→ a query that scanned TB now scans GB.
```

## 8. Layout vs query tuning

Often, fixing **layout** (partition + compact) gives a far bigger speedup than rewriting
the query — because it changes how much data is read in the first place. Check layout
before micro-tuning SQL.

## Practice

1. **Over-partition.** Why is partitioning by `user_id` bad?
2. **Small files.** 40,000 tiny files, slow queries — the fix and why.
3. **Can't partition.** What gives file-skipping for a high-cardinality filter column?
4. **Date partition.** How does partitioning by date speed a 'last 7 days' query?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"A lakehouse query is slow. What layout changes would you try first?"*

**Partition** the table by a low-cardinality filter column (usually date) for partition
pruning; **Z-order/cluster** by a frequent high-cardinality filter for file skipping;
**compact** small files into ~128 MB–1 GB (fixing the small-files problem); and store
**columnar** so only needed columns are read. Layout changes how much data is read,
which usually beats query micro-tuning.
