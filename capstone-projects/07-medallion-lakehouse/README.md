# 07 · A medallion lakehouse

Bronze → Silver → Gold on **Delta Lake** (via `delta-rs` — no Spark/Java needed), showing **ACID writes, versioning,
and time travel** on local files.

```bash
pip install -r requirements.txt
python run.py
```

## What it does

- **Bronze** — append-only raw, written in two batches → **two table versions**.
- **Time travel** — read `version=0` vs latest to prove versioning.
- **Silver** — clean (`amount > 0`) + **dedup keep-latest** per `order_id`, ACID overwrite.
- **Gold** — revenue-by-region business mart.

Output: Delta tables under `out/lake/{bronze,silver,gold}`.

## Production mapping

- `delta-rs` → Spark + Delta (or Databricks) at scale; same table semantics.
- Upserts/CDC use **`MERGE`** (`DeltaTable.merge(...)`) — see **capstone 08** for insert/update/delete merge logic.
- Add `OPTIMIZE`/Z-order (compaction) and `VACUUM` (snapshot expiry) for maintenance.
- The open, multi-engine alternative is **Apache Iceberg** — see **capstone 11**.
