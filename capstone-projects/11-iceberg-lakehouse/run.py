"""
Capstone 11 — An open Apache Iceberg lakehouse (local SQLite catalog).

Creates an Iceberg table on local "object storage", appends two batches (two snapshots),
and demonstrates the lakehouse features: snapshots, TIME TRAVEL, and schema evolution —
all via pyiceberg with a SQLite REST-style catalog. No Spark required.

Run:  pip install -r requirements.txt
      python run.py
Output: ./out/catalog.db (catalog) + ./out/warehouse/ (Parquet data + Iceberg metadata)
"""
from __future__ import annotations
import random, datetime as dt
from pathlib import Path

import pyarrow as pa
from pyiceberg.catalog.sql import SqlCatalog

OUT = Path(__file__).parent / "out"
WAREHOUSE = OUT / "warehouse"
random.seed(4)


def make_batch(n, start=0) -> pa.Table:
    return pa.table({
        "order_id": [f"ORD-{i:05d}" for i in range(start, start + n)],
        "region": [random.choice(["NA", "EU", "APAC"]) for _ in range(n)],
        "amount": [round(random.uniform(5, 200), 2) for _ in range(n)],
    })


def main():
    OUT.mkdir(exist_ok=True)
    WAREHOUSE.mkdir(exist_ok=True)

    catalog = SqlCatalog("default", uri=f"sqlite:///{OUT}/catalog.db", warehouse=f"file://{WAREHOUSE}")
    try:
        catalog.create_namespace("db")
    except Exception:
        pass

    print("1) CREATE Iceberg table via catalog")
    b1 = make_batch(200, 0)
    try:
        tbl = catalog.create_table("db.orders", schema=b1.schema)
    except Exception:
        catalog.drop_table("db.orders")
        tbl = catalog.create_table("db.orders", schema=b1.schema)

    print("2) APPEND two batches -> two snapshots (ACID commits)")
    tbl.append(b1)
    tbl.append(make_batch(200, 200))
    snaps = list(tbl.snapshots())
    print(f"   snapshots: {len(snaps)}  rows now: {tbl.scan().to_arrow().num_rows}")

    print("3) TIME TRAVEL — read the first snapshot vs latest")
    first = snaps[0].snapshot_id
    v0 = tbl.scan(snapshot_id=first).to_arrow().num_rows
    latest = tbl.scan().to_arrow().num_rows
    print(f"   snapshot {first}: {v0} rows  |  latest: {latest} rows")

    print("4) SCHEMA EVOLUTION — add a column safely")
    try:
        from pyiceberg.types import StringType
        with tbl.update_schema() as upd:
            upd.add_column("currency", StringType())
        print(f"   columns now: {[f.name for f in tbl.schema().fields]}")
    except Exception as e:
        print(f"   (schema evolution API varies by pyiceberg version: {e})")

    print("5) QUERY — revenue by region (latest)")
    df = tbl.scan().to_pandas()
    agg = df.groupby("region")["amount"].agg(["count", "sum"]).round(2).sort_values("sum", ascending=False)
    for region, row in agg.iterrows():
        print(f"   {region:5s} orders={int(row['count']):<4} revenue=${row['sum']:,.2f}")

    print("\nDONE. Iceberg table in out/warehouse, tracked by the SQLite catalog.")
    print("Any Iceberg engine (Spark/Trino/DuckDB) can read it via the same catalog — multi-engine, no lock-in.")


if __name__ == "__main__":
    main()
