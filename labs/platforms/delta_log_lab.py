"""Delta Lake stand-in lab (delta-rs, no Spark, no JDK): the transaction log, time travel,
MERGE, Change Data Feed, OPTIMIZE / Z-order data skipping, and VACUUM.

Uses the open-source `deltalake` Python package (delta-rs). Databricks runs the same Delta
protocol, so _delta_log JSON, versions and file statistics look the same; Databricks-only
features (liquid clustering, predictive optimization, Photon) are NOT available here and are
called out in the lessons.

  pip install deltalake duckdb      (this lab was run with deltalake 1.6.6, duckdb 2.0.0)
  python labs/platforms/delta_log_lab.py

Protocol reference: https://github.com/delta-io/delta/blob/master/PROTOCOL.md
"""
import json
import os
import shutil
import tempfile

import pyarrow as pa
from deltalake import DeltaTable, write_deltalake

root = tempfile.mkdtemp(prefix="delta_lab_")
path = os.path.join(root, "orders")


def batch(ids, status, amount_base):
    return pa.table({
        "order_id": pa.array(ids, pa.int64()),
        "status": pa.array([status] * len(ids)),
        "amount": pa.array([amount_base + i % 7 for i in ids], pa.float64()),
        "country": pa.array([["IN", "US", "GB", "DE"][i % 4] for i in ids]),
    })


# v0: create with Change Data Feed on (Databricks: TBLPROPERTIES (delta.enableChangeDataFeed = true))
write_deltalake(path, batch(range(0, 1000), "placed", 100.0),
                configuration={"delta.enableChangeDataFeed": "true"})
# v1: append
write_deltalake(path, batch(range(1000, 2000), "placed", 100.0), mode="append")

dt = DeltaTable(path)
# v2: MERGE an upsert batch (500 updates + 200 inserts)
src = batch(list(range(1500, 2000)) + list(range(2000, 2200)), "shipped", 120.0)
(dt.merge(src, predicate="t.order_id = s.order_id", source_alias="s", target_alias="t")
   .when_matched_update_all().when_not_matched_insert_all().execute())
# v3: delete cancelled orders
dt = DeltaTable(path)
dt.delete("order_id < 50")

print("== 1. the transaction log is just ordered JSON commits ==")
log = os.path.join(path, "_delta_log")
for f in sorted(x for x in os.listdir(log) if x.endswith(".json")):
    actions = [list(json.loads(line).keys())[0] for line in open(os.path.join(log, f))]
    counts = {a: actions.count(a) for a in dict.fromkeys(actions)}
    print(f"  {f}: {counts}")

dt = DeltaTable(path)
print(f"\n== 2. versions and time travel == current version = {dt.version()}")
for h in sorted(dt.history(), key=lambda h: h["version"]):
    print(f"  v{h['version']}: {h['operation']}")
for v in range(dt.version() + 1):
    old = DeltaTable(path, version=v)
    print(f"  VERSION AS OF {v}: {old.to_pyarrow_table().num_rows} rows")

print("\n== 3. Change Data Feed (row-level changes between versions) ==")
cdf = pa.table(dt.load_cdf(starting_version=2).read_all())
from collections import Counter
ct = Counter((r["_commit_version"], r["_change_type"]) for r in cdf.select(["_commit_version", "_change_type"]).to_pylist())
for (v, kind), n in sorted(ct.items()):
    print(f"  v{v} {kind:18} {n} rows")

print("\n== 4. small files, then OPTIMIZE ZORDER BY (country) and data skipping ==")
for i in range(20):  # 20 tiny appends, the classic streaming small-file problem
    write_deltalake(path, batch(range(3000 + i * 2000, 5000 + i * 2000), "placed", 90.0), mode="append")
dt = DeltaTable(path)


def files_for_country(dt, c):
    adds = pa.table(dt.get_add_actions(flatten=True)).to_pylist()
    hit = [a for a in adds if a["min.country"] <= c <= a["max.country"]]
    return len(adds), len(hit)


n, hit = files_for_country(dt, "IN")
print(f"  before: {n} files; WHERE country='IN' must open {hit}")
# target_size is tiny on purpose so the toy table yields several files (Databricks targets ~1 GB+)
m = dt.optimize.z_order(["country"], target_size=96 * 1024)
dt = DeltaTable(path)
n, hit = files_for_country(dt, "IN")
print(f"  OPTIMIZE: removed {m['numFilesRemoved']} files, added {m['numFilesAdded']}")
print(f"  after:  {n} files; WHERE country='IN' must open {hit}  (min/max stats now narrow)")

print("\n== 5. VACUUM: old files stay until retention passes (that is what keeps time travel working) ==")
stale = dt.vacuum(retention_hours=0, enforce_retention_duration=False, dry_run=True)
print(f"  files a 0-hour vacuum WOULD delete: {len(stale)} (default retention is 7 days; we only dry-run)")
shutil.rmtree(root)
print("\nWhat to look for: commits are JSON (add/remove/metaData/protocol/commitInfo); old versions stay")
print("readable until VACUUM; MERGE writes update_preimage/postimage in the CDF; Z-order narrows min/max.")
