"""
Capstone 7 — A medallion lakehouse (Delta Lake via delta-rs, no Spark needed).

Builds bronze -> silver -> gold as Delta tables on local object-storage-style files,
showing ACID writes, versioning, and TIME TRAVEL — warehouse reliability on a lake.

Run:  pip install -r requirements.txt
      python run.py
Output: ./out/lake/{bronze,silver,gold}  (Delta tables)
"""
from __future__ import annotations
import random, datetime as dt
from pathlib import Path

import pandas as pd
from deltalake import write_deltalake, DeltaTable

OUT = Path(__file__).parent / "out" / "lake"
BRONZE, SILVER, GOLD = OUT / "bronze", OUT / "silver", OUT / "gold"
random.seed(5)
REGIONS = ["NA", "EU", "APAC"]


def batch(n, start=0):
    rows = []
    for i in range(start, start + n):
        rows.append({
            "order_id": f"ORD-{i % 300:04d}",                 # repeats -> updates to dedup
            "region": random.choice(REGIONS),
            "amount": round(random.uniform(5, 200), 2),
            "updated_at": dt.datetime(2026, 1, 1) + dt.timedelta(minutes=i),
            "ingested_batch": start // n,
        })
    return pd.DataFrame(rows)


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    # 1) BRONZE — raw, append-only (two batches => two table versions)
    print("1) BRONZE  — append-only raw (ACID, versioned)")
    write_deltalake(str(BRONZE), batch(300, 0), mode="overwrite")
    write_deltalake(str(BRONZE), batch(300, 300), mode="append")
    bt = DeltaTable(str(BRONZE))
    print(f"   bronze versions: {bt.version()+1}  rows: {len(bt.to_pandas())}")

    # TIME TRAVEL — read the first version vs latest
    v0 = DeltaTable(str(BRONZE), version=0).to_pandas()
    print(f"   time-travel: version 0 had {len(v0)} rows; latest has {len(bt.to_pandas())}")

    # 2) SILVER — clean + dedup keep-latest per order_id (ACID overwrite)
    print("2) SILVER  — clean + dedup (keep latest per order_id)")
    bronze = bt.to_pandas()
    silver = (bronze[bronze["amount"] > 0]
              .sort_values("updated_at")
              .drop_duplicates("order_id", keep="last")
              .reset_index(drop=True))
    write_deltalake(str(SILVER), silver, mode="overwrite")
    print(f"   silver rows (deduped): {len(silver)}")

    # 3) GOLD — business aggregate
    print("3) GOLD    — revenue by region")
    gold = (silver.groupby("region", as_index=False)
                  .agg(orders=("order_id", "size"), revenue=("amount", "sum")))
    gold["revenue"] = gold["revenue"].round(2)
    write_deltalake(str(GOLD), gold, mode="overwrite")
    for r in gold.sort_values("revenue", ascending=False).itertuples():
        print(f"   {r.region:5s} orders={r.orders:<4} revenue=${r.revenue:,.2f}")

    print("\nDONE. Delta tables in out/lake/. Each write is ACID + versioned; "
          "DeltaTable(path, version=N) gives time travel.")
    print("Production upsert: DeltaTable.merge(...) (MERGE) — see capstone 08 for CDC merge semantics.")


if __name__ == "__main__":
    main()
