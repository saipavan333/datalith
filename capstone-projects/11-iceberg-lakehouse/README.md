# 11 · An open Iceberg lakehouse

Build a real **Apache Iceberg** table with a local **SQLite catalog** and local "object storage" — and exercise the
lakehouse features (**snapshots, time travel, schema evolution**) via `pyiceberg`. No Spark needed.

```bash
pip install -r requirements.txt
python run.py
```

## What it does

1. **Create** an Iceberg table through the catalog.
2. **Append** two batches → **two snapshots** (ACID commits).
3. **Time travel** — read the first snapshot vs the latest.
4. **Schema evolution** — add a column safely.
5. **Query** revenue by region from the latest snapshot.

Output: `out/catalog.db` (the catalog) + `out/warehouse/` (Parquet data + Iceberg metadata).

## Production mapping

- SQLite catalog → a **REST catalog** (Apache Polaris / Gravitino) or a cloud catalog.
- Local files → S3/GCS/ADLS; **any Iceberg engine** (Spark, Trino, Flink, DuckDB) reads the same table via the catalog
  — multi-engine, no lock-in.
- Add maintenance: compaction (`rewrite_data_files`) and snapshot expiry.
