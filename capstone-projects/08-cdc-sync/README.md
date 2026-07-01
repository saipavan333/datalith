# 08 · Change data capture (CDC) to the lake

Keep a target table in sync with a source by applying a **CDC changelog** (Insert / Update / Delete) — including the
**deletes** that append-only pipelines silently miss.

```bash
pip install -r requirements.txt
python run.py
```

## What it does

1. Simulate a source **changelog**: initial inserts, then updates, then **deletes**, then a late insert.
2. **Apply** it to a DuckDB target: upsert (`INSERT ... ON CONFLICT DO UPDATE`) for I/U, `DELETE` for D.
3. **Verify** the target exactly matches a pure-Python replay of the log — proving deletes are captured.

## Production mapping

- Source changelog → **log-based CDC** (Debezium reading the DB write-ahead log) → Kafka.
- DuckDB upsert → **`MERGE`** into Delta/Iceberg on the lake (atomic insert/update/delete).
- Do an initial **snapshot** then stream **incremental** changes; keep it idempotent so replays are safe.
- The headline: log-based CDC + MERGE captures **deletes**; query-based "pull changed rows" does not.
