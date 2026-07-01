# Files & formats — CSV, JSON, Parquet — deep dive

The format you store data in is one of the highest-leverage decisions in the whole field. The *same* data, *same* query, *same* hardware can be 10–100× faster and cheaper depending on whether it's a CSV or a Parquet file. This guide explains exactly why, with the mental model interviewers expect you to draw on a whiteboard.

@@diagram:row-vs-column

## Row-oriented vs column-oriented — the core idea

Imagine a table with 50 columns and a billion rows, and a query: `SELECT AVG(amount) WHERE country = 'US'`. It touches 2 columns out of 50.

A **row-oriented** format (CSV, JSON) stores the data row by row: `[r1c1,r1c2,...,r1c50][r2c1,...]`. To read `amount` and `country`, the engine must walk through **every byte of every row**, because the two columns you want are interleaved with the 48 you don't. You read ~25× more data than you need.

A **column-oriented** format (Parquet, ORC) stores data column by column: all of `amount` together, all of `country` together. The engine reads **only those two columns' data** and skips the rest entirely. That's the whole game.

## Row-based formats: CSV and JSON

**CSV** — plain text, comma-separated rows. Human-readable and universal (everything imports CSV), but: no types (is `01` a number or a string?), no schema, no compression, and you read whole rows. Fine for small data and interchange; painful at analytical scale. Watch out for the classic gotchas — commas inside quoted fields, newlines inside cells, no standard for nulls.

**JSON** — human-readable and **self-describing** (carries its field names), handles **nesting** (it's the semi-structured workhorse). Great for APIs and config. But it's **verbose** (repeats every key on every record), untyped, and slow/large to scan for analytics.

Both are row-oriented: even reading one field means touching whole records.

## Columnar: Parquet (and ORC)

Parquet is the analytics default for three compounding reasons:

1. **Column pruning** — read only the columns the query needs. The 3-of-50 query reads 3 columns' worth of data, not the whole file.
2. **Excellent compression** — a column holds similar, same-typed, often-repeated values, so codecs plus encodings (dictionary, run-length, delta) crush it far better than mixed-type rows. Smaller files *and* less to scan.
3. **Predicate pushdown / data skipping** — Parquet stores per-chunk (row-group) **min/max statistics**. For `WHERE country = 'US'`, the engine skips entire row groups whose min/max can't contain `'US'` — without reading them.

Parquet is also **typed** (it carries a real schema), **splittable** (many workers read different row groups in parallel), and the **foundation of lakehouses** — Delta Lake and Iceberg are essentially Parquet files plus a metadata layer that adds transactions and time travel.

## Anatomy of a Parquet file (worth knowing)

A Parquet file is split into **row groups** (horizontal slices of ~128MB). Within a row group, each **column chunk** stores that column's values for those rows, broken into **pages**. Each column chunk carries statistics (min/max/null count). This layout is what enables parallel reads (per row group) and skipping (per chunk stats). When an interviewer asks "how does Parquet skip data?", this is the answer: row-group + column-chunk statistics.

## Seeing the difference

```python
import pandas as pd
df = pd.read_csv("orders.csv")          # 1.0 GB on disk, untyped

df.to_parquet("orders.parquet")         # ~150 MB — ~7x smaller, typed

# The analytics query now reads ~2 of 50 columns + skips row groups:
import duckdb
duckdb.sql("SELECT country, AVG(amount) FROM 'orders.parquet' GROUP BY country")
# vs the CSV version, which must parse every byte of every row
```

Rule of thumb: **land** data as it arrives (often CSV/JSON from sources), then **convert to Parquet** for every analytical layer. The format change alone frequently makes queries 10×+ faster and cheaper — before you tune anything else.

## When to use what

- **CSV** — interchange with humans/spreadsheets, tiny datasets, dead-simple portability.
- **JSON** — APIs, configs, nested/semi-structured payloads, raw event landing.
- **Parquet/ORC** — the default for warehouse and lake **analytical** tables. ORC is common in the Hive/Spark world; Parquet is the broader default.

## Cheat sheet

| | CSV | JSON | Parquet |
|---|---|---|---|
| Orientation | row | row | **column** |
| Human-readable | yes | yes | no |
| Typed / schema | no | no (self-describing) | **yes** |
| Compression | none | none | **strong** |
| Nested data | no | **yes** | yes |
| Splittable | partially | partially | **yes** |
| Column pruning | no | no | **yes** |
| Data skipping (min/max) | no | no | **yes** |
| Best for | interchange | APIs/config | **analytics** |

**The pitch in one line:** Parquet reads only the columns you ask for, compresses them hard, and skips chunks that can't match your filter — so it scans a fraction of the data CSV would.

## Interview questions

**Q (Amazon, very common): "Why is Parquet faster than CSV for analytical queries?"**
Three reasons. (1) Column pruning: it's columnar, so a query reading 3 of 50 columns reads only those 3, not whole rows. (2) Compression: similar values sit together in a column, so it compresses far better than mixed-type rows — less bytes to read. (3) Predicate pushdown: per-row-group min/max stats let the engine skip chunks that can't satisfy the filter. Net effect: it scans a small fraction of the data CSV would, and I/O is usually the bottleneck. CSV also has no types and must be parsed as text.

**Q (Google): "How does Parquet physically skip data it doesn't need?"**
A Parquet file is divided into row groups, and within each row group every column chunk stores statistics — minimum, maximum, and null count. When a query has a predicate like `WHERE date = '2024-01-01'`, the engine reads the footer/metadata first, checks each row group's min/max for the `date` column, and skips any row group whose range can't contain the value — without reading its data pages at all. Combined with column pruning (reading only requested columns), this is "predicate pushdown" / data skipping.

**Q (Databricks): "You land raw data as CSV and your analysts query it directly and complain it's slow and expensive. What's your fix?"**
Convert the analytical layers to Parquet. Keep the raw CSV in a landing/bronze zone for fidelity and reprocessing, but build a transformation that writes typed, partitioned Parquet (often with Snappy/Zstd compression) for the silver/gold tables analysts query. This single change typically yields 10×+ improvement because queries now prune columns, read compressed data, and skip row groups. If queries filter on a common dimension like date, partition the Parquet by it so whole partitions are pruned.

**Q (Goldman Sachs): "When would you NOT use Parquet?"**
When the data is small, when humans or spreadsheet tools need to read it directly, when you're doing pure interchange with a system that expects CSV/JSON, or when the workload is transactional row-at-a-time access rather than analytical scans (Parquet shines for big scans, not single-row lookups or frequent row-level updates). Also, for streaming/messaging you typically use a row-based format like Avro, not columnar Parquet, because you're appending records one at a time rather than scanning columns.

**Q (Netflix): "What's the difference between Parquet and Delta Lake / Iceberg?"**
Parquet is a file format — a single columnar file with a schema and stats. Delta Lake and Iceberg are **table formats** built on top of Parquet files: they add a metadata/transaction layer that gives you ACID transactions, schema evolution, time travel, and efficient upserts/deletes over a collection of Parquet files. So Parquet is the storage; Delta/Iceberg make a pile of Parquet behave like a real, reliable table.

## Practice

1. A query reads 4 of 80 columns from a 2-billion-row table. Quantify roughly how much less data Parquet scans vs CSV, and name the three mechanisms.
2. Explain row groups and column chunks, and how they enable both parallelism and skipping.
3. Your raw landing zone is JSON. Sketch the path to a fast analytical table and name the format at each hop.
