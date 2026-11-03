"""Auto Loader stand-in lab: checkpointed, exactly-once file discovery with schema evolution.

Databricks Auto Loader (format "cloudFiles") remembers every file it has ingested in a
checkpoint (a RocksDB key-value store) so each file is processed once even across restarts,
and with cloudFiles.schemaEvolutionMode = "addNewColumns" it stops the stream when a new
column appears, records the new schema, and picks it up on restart. Columns that don't match
the schema land in _rescued_data instead of being dropped.

Here SQLite plays the checkpoint and DuckDB plays the Delta sink, so the mechanism is visible.
Source: https://docs.databricks.com/aws/en/ingestion/cloud-object-storage/auto-loader/ (checked 2026-11-03)

Run:  python labs/platforms/autoloader_sim.py
"""
import json
import os
import sqlite3
import tempfile

import duckdb

land = tempfile.mkdtemp(prefix="landing_")
ckpt = sqlite3.connect(os.path.join(land, "_checkpoint.db"))
ckpt.execute("CREATE TABLE IF NOT EXISTS seen (path TEXT PRIMARY KEY, batch INT)")
ckpt.execute("CREATE TABLE IF NOT EXISTS schema (col TEXT PRIMARY KEY)")
sink = duckdb.connect()
sink.execute("CREATE TABLE bronze_orders (order_id BIGINT, amount DOUBLE, _rescued_data VARCHAR, _source_file VARCHAR)")


def drop_file(name, rows):
    with open(os.path.join(land, name), "w") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")


def known_schema():
    cols = [r[0] for r in ckpt.execute("SELECT col FROM schema")]
    return cols or ["order_id", "amount"]


class SchemaChanged(Exception):
    pass


def run_batch(batch_id):
    files = sorted(f for f in os.listdir(land) if f.endswith(".json"))
    new = [f for f in files if not ckpt.execute("SELECT 1 FROM seen WHERE path=?", [f]).fetchone()]
    schema = known_schema()
    for f in new:
        rows = [json.loads(l) for l in open(os.path.join(land, f))]
        extra = sorted({k for r in rows for k in r} - set(schema))
        if extra:
            # addNewColumns: record the new schema, fail this run; the restart picks it up
            for c in schema + extra:
                ckpt.execute("INSERT OR IGNORE INTO schema VALUES (?)", [c])
            ckpt.commit()
            raise SchemaChanged(f"new columns {extra} in {f}; schema updated, restart the stream")
        for r in rows:
            amount, rescued = r.get("amount"), None
            if not isinstance(amount, (int, float)):          # type mismatch -> rescued, not lost
                rescued, amount = json.dumps({"amount": amount}), None
            sink.execute("INSERT INTO bronze_orders VALUES (?, ?, ?, ?)", [r["order_id"], amount, rescued, f])
        ckpt.execute("INSERT INTO seen VALUES (?, ?)", [f, batch_id])   # commit file + data together
        ckpt.commit()
    return new


drop_file("orders_0001.json", [{"order_id": 1, "amount": 10.5}, {"order_id": 2, "amount": 7.0}])
drop_file("orders_0002.json", [{"order_id": 3, "amount": "12,40"}])        # bad type from an upstream bug
print("batch 1 processed:", run_batch(1))
print("batch 2 (nothing new) processed:", run_batch(2))
drop_file("orders_0003.json", [{"order_id": 4, "amount": 3.2, "coupon": "DIWALI10"}])
try:
    run_batch(3)
except SchemaChanged as e:
    print("batch 3 stopped:", e)
sink.execute("ALTER TABLE bronze_orders ADD COLUMN coupon VARCHAR")      # the restart applies the new schema
print("schema now:", known_schema())


def run_batch_v2(batch_id):
    files = sorted(f for f in os.listdir(land) if f.endswith(".json"))
    new = [f for f in files if not ckpt.execute("SELECT 1 FROM seen WHERE path=?", [f]).fetchone()]
    for f in new:
        for r in (json.loads(l) for l in open(os.path.join(land, f))):
            sink.execute("INSERT INTO bronze_orders VALUES (?, ?, NULL, ?, ?)", [r["order_id"], r["amount"], f, r.get("coupon")])
        ckpt.execute("INSERT INTO seen VALUES (?, ?)", [f, batch_id]); ckpt.commit()
    return new


print("batch 3 restarted processed:", run_batch_v2(3))
print("\nbronze_orders:")
for row in sink.execute("SELECT * FROM bronze_orders ORDER BY order_id").fetchall():
    print("  ", row)
print("checkpoint:", ckpt.execute("SELECT * FROM seen ORDER BY path").fetchall())
print("\nWhat to look for: each file is ingested exactly once (batch 2 found nothing), a bad value goes to")
print("_rescued_data instead of vanishing, and a new column stops the stream once, then flows after restart.")
