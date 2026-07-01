# 01 · API ingestion to a queryable lake

The canonical batch ELT shape: **extract → validate → transform → store → analyze**.

```bash
pip install -r requirements.txt
python run.py
```

## What it does

1. **Extract** — a mock paginated API with simulated rate-limits + **exponential-backoff retries**.
2. **Validate** — every record through a **Pydantic** model; bad rows (negative/`"N/A"` amounts, missing region) go to
   `out/quarantine/` instead of poisoning the lake.
3. **Transform** — a **Polars** lazy aggregation.
4. **Store** — **partitioned Parquet** at `out/lake/orders/dt=<run-date>/`, written **idempotently** (the partition is
   overwritten on re-run).
5. **Analyze** — **DuckDB** SQL directly over the Parquet, no load step.

## Production mapping

- Mock API → real REST API (use `requests` with a `Session`, timeouts, and a watermark for incremental pulls).
- Local Parquet → object storage (`s3://...`) via `fsspec`/`s3fs`.
- DuckDB → your cloud warehouse, or keep DuckDB for lightweight analytics.

Watch the failure modes the code handles: rate limits (429 + backoff), schema drift (Pydantic), and double writes
(idempotent partition overwrite).
