"""Lab: open a real Iceberg table and a real Delta table on your laptop and read their metadata.
Needs:  pip install "pyiceberg[sql-sqlite]" deltalake pyarrow
Everything is written under ./lake_lab (delete the folder when done). No cloud, no Spark, no Java.
"""
import json, os, pathlib, shutil
import pyarrow as pa

ROOT = pathlib.Path("lake_lab").resolve()
shutil.rmtree(ROOT, ignore_errors=True); ROOT.mkdir()

def tree(path, base):
    return sorted(str(p.relative_to(base)).replace(os.sep, "/") for p in pathlib.Path(path).rglob("*") if p.is_file())

batch1 = pa.table({"order_id": pa.array([1, 2, 3], pa.int64()),
                   "status": ["placed", "placed", "placed"], "amount": [40.0, 15.5, 99.0]})
batch2 = pa.table({"order_id": pa.array([4, 5], pa.int64()),
                   "status": ["placed", "paid"], "amount": [12.0, 230.0]})

# ---------------------------------------------------------------- Iceberg
from pyiceberg.catalog.sql import SqlCatalog
# a relative warehouse path works on Windows, macOS and Linux (pyiceberg 0.12 mis-reads file:///C:/ URIs)
cat = SqlCatalog("lab", uri="sqlite:///lake_lab/catalog.db", warehouse="lake_lab")
cat.create_namespace("shop")
tbl = cat.create_table("shop.orders", schema=batch1.schema)
tbl.append(batch1)
tbl.append(batch2)

print("=== ICEBERG ===")
print("catalog row (the only thing that says which metadata file is current):")
import sqlite3
for row in sqlite3.connect(ROOT / "catalog.db").execute(
        "SELECT table_namespace, table_name, metadata_location FROM iceberg_tables"):
    print("  ", row[0], row[1], "->", row[2].split("/shop/")[-1] if "/shop/" in row[2] else row[2])
print("files on disk:")
for f in tree(ROOT / "shop" / "orders", ROOT / "shop" / "orders"): print("  ", f)

snaps = tbl.metadata.snapshots
print("snapshots:", [(s.snapshot_id % 10000, s.summary.operation.value, s.summary.get("added-records")) for s in snaps])
first = snaps[0].snapshot_id
print("rows now:", tbl.scan().to_arrow().num_rows, "| rows at first snapshot (time travel):",
      tbl.scan(snapshot_id=first).to_arrow().num_rows)

# schema evolution: add a column. Metadata-only, no data file is rewritten.
before = set(tree(ROOT / "shop" / "orders" / "data", ROOT))
with tbl.update_schema() as u:
    from pyiceberg.types import StringType
    u.add_column("channel", StringType())
after = set(tree(ROOT / "shop" / "orders" / "data", ROOT))
print("after ADD COLUMN: schema fields =", [f.name for f in tbl.schema().fields],
      "| data files rewritten:", len(after - before))
print("old rows read the new column as:", tbl.scan().to_arrow().column("channel").to_pylist()[:2])

# ---------------------------------------------------------------- Delta
from deltalake import DeltaTable, write_deltalake
dpath = ROOT / "delta_orders"
write_deltalake(dpath, batch1)
write_deltalake(dpath, batch2, mode="append")
dt = DeltaTable(dpath)
dt.delete("order_id = 2")
dt = DeltaTable(dpath)

print("\n=== DELTA ===")
print("files on disk:")
for f in tree(dpath, dpath): print("  ", f)
for n in range(3):
    actions = [list(json.loads(line))[0] for line in open(dpath / "_delta_log" / f"{n:020d}.json")]
    print(f"commit {n}: actions = {actions}")
print("version now:", dt.version(), "| rows now:", dt.to_pyarrow_table().num_rows,
      "| rows at version 1 (time travel):", DeltaTable(dpath, version=1).to_pyarrow_table().num_rows)
print("history:", [h.get("operation") for h in dt.history()])
