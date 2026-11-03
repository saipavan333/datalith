# Iceberg vs Delta vs Hudi: how each one really works, and how to choose

All three open table formats solve the same problem: a folder of Parquet files in object storage has no transactions, no safe concurrent writes, no cheap schema change and no history. Each format adds a **metadata layer** on top of the Parquet files that fixes this. They differ in how that metadata is laid out, and those differences explain every trade-off you'll be asked about.

Current releases checked on 2026-11-03: Apache Iceberg 1.12.0 (table spec v3 adopted, v4 in development), Delta Lake 4.4.1 (`delta-spark`), Apache Hudi 1.2.1.

## The picture to keep in your head

A table format is a **library catalogue** for a warehouse full of boxes (Parquet files). Nobody walks the shelves to find a book; they look it up in the catalogue. Changing the table means **writing new boxes first, then updating the catalogue in one stroke**. Readers who looked at the old catalogue page keep seeing a consistent old view. Readers who look after the update see the new one. Nobody ever sees half a change.

@@diagram:lake-commit-tree

## 1. Iceberg: a tree of metadata files

- **Table metadata file** (`vN.metadata.json`): schema history, partition specs, sort orders, properties and the list of **snapshots**.
- **Snapshot**: the table at one point in time. In format v1 to v3 it points to a **manifest list**.
- **Manifest list** (Avro): which manifests make up the snapshot, with partition-range summaries so whole manifests can be skipped.
- **Manifests** (Avro): one row per data or delete file, with partition values and **column stats** (min, max, null counts). Planning a query prunes files using these stats without opening them.
- **Commit**: write new data files, manifests and a new metadata file, then ask the **catalog** to swap the table's pointer from the old metadata file to the new one atomically. If someone else swapped first, re-read and retry. The spec puts it as an atomic swap of one metadata file for another, and that swap is the basis of serializable isolation.

Things Iceberg is known for:

- **Hidden partitioning.** You declare `PARTITION BY day(event_ts)` once. Queries filter on `event_ts`; nobody has to know a `dt` column exists. You can change the partition spec later (**partition evolution**) without rewriting old data: old files keep the old spec.
- **Column IDs.** Columns are tracked by ID, not name, so rename and reorder are safe metadata-only changes.
- **Format v2** added row-level deletes (position and equality delete files). **Format v3** adds binary **deletion vectors**, **row lineage**, column **default values**, and new types (`variant`, `geometry`, `geography`, nanosecond timestamps).
- **Engine-neutral.** Spark, Flink, Trino, DuckDB, Snowflake, BigQuery and others read and write it through a catalog.

## 2. Delta Lake: an ordered transaction log

- The table folder has a `_delta_log/` directory of JSON commits named by version: `00000000000000000000.json`, `...001.json`, and so on.
- Each commit holds **actions**: `add` (a data file joins the table), `remove` (a file leaves), `metaData` (schema, partition columns, properties), `protocol` (reader/writer feature requirements), `commitInfo` (who did what), `txn` (idempotent writer IDs), plus `cdc` and `domainMetadata`.
- The table's state at version N is the replay of commits 0 to N. To keep that cheap, writers periodically write **checkpoint** files (Parquet) that summarize the log so far.
- **Commit**: write data files, then create the next numbered log file. Only one writer can create `N+1.json`; the loser re-reads and checks whether its change conflicts. On object stores without put-if-absent, a commit coordinator or catalog provides that guarantee.
- **Deletion vectors** mark rows in a file as deleted without rewriting the file (merge-on-read for deletes). The lab's simple DELETE without them shows the classic copy-on-write behaviour: a `remove` plus an `add` of a rewritten file.
- Strong points: tight Spark and Databricks integration, `MERGE`, Change Data Feed, liquid clustering on Databricks, and **UniForm**, which writes Iceberg metadata alongside Delta's so Iceberg readers can read the same files.

## 3. Hudi: a timeline built for upserts

- The **timeline** (`.hoodie/`) records every action (commit, delta commit, compaction, clean) with its state (requested, inflight, completed). Readers only see completed instants.
- Data is grouped into **file groups**, each with a base file plus, for merge-on-read, **log files** of changes. A record key maps to one file group through an **index**, so an upsert knows exactly which file group to touch.
- **Copy-on-Write (CoW)**: every update rewrites the affected base file. Fast reads, high write amplification.
- **Merge-on-Read (MoR)**: updates append to log files; readers merge at query time; **compaction** later folds logs into new base files. Fast writes and fresh data, read cost depends on how far behind compaction is.
- Strong points: high-frequency upserts and CDC ingestion, record-level indexing, built-in table services (compaction, clustering, cleaning), incremental queries ("give me only rows changed since commit X").

## 4. Side by side

| | Iceberg | Delta Lake | Hudi |
|---|---|---|---|
| Metadata shape | tree: metadata.json → manifest list → manifests | ordered JSON log + Parquet checkpoints | timeline of instants + file groups |
| Commit point | catalog pointer swap | creating the next log file atomically | completing an instant on the timeline |
| Row-level changes | delete files; v3 deletion vectors | copy-on-write or deletion vectors | CoW or MoR with log files + compaction |
| Partitioning | hidden, evolvable | explicit columns; liquid clustering (Databricks) | explicit, plus clustering |
| Sweet spot | multi-engine lakehouse, huge tables, catalog-governed | Spark/Databricks-centric platforms | upsert-heavy CDC, incremental pulls |
| Needs a catalog to commit? | yes (REST, Glue, Hive, Polaris, Unity, Nessie, JDBC...) | no for a path-based table; catalogs add governance | no; optional metastore sync |

## 5. Choosing in a real platform

A retailer lands **3 TB/day** of clickstream and CDC from 40 Postgres shards, queried by Spark for transforms, Trino for ad-hoc analysis and Snowflake for finance.

1. **Engines first.** Three engines must write or read the same tables. Iceberg's catalog-based, engine-neutral design fits; so does Delta with UniForm if most writes happen on Databricks.
2. **Write pattern.** CDC merges arrive every 5 minutes. With Iceberg, use merge-on-read deletes (or v3 deletion vectors where your engines support them) and compact hourly. Hudi MoR is built for this pattern too.
3. **Table maintenance is not optional** for any of them: compact small files, expire old snapshots or vacuum, rewrite manifests. A table with 4 million tiny files plans slowly whatever the format.
4. **Decide by what your platform's main engine supports best**, then confirm the other engines read it. Picking the "best format" in the abstract is the wrong question in an interview; asking "which engines and which write pattern?" is the right one.

## 6. Hands-on lab: open both formats on your laptop

Needs `pip install "pyiceberg[sql-sqlite]" deltalake pyarrow` (about 300 MB with dependencies). It writes a real Iceberg table through a SQLite-backed catalog and a real Delta table, then reads their metadata. Run `python labs/lake-table-internals.py`.

```python
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
```

Output from a real run on 2026-11-03 (pyiceberg 0.12.0, deltalake 1.6.6; file names contain random UUIDs, so yours will differ):

```text
=== ICEBERG ===
catalog row (the only thing that says which metadata file is current):
   shop orders -> orders/metadata/00002-af7769db-f489-4e3b-a82c-7d3e33061fe8.metadata.json
files on disk:
   data/00000-0-6b800910-b4ae-4fe4-b7d9-41480cef782e.parquet
   data/00000-0-eb864f4d-2414-4f1b-9d1d-41c77c4d82d9.parquet
   metadata/00000-fba1e6e9-7033-4cdd-909b-59e496396c6f.metadata.json
   metadata/00001-34a00762-c39e-491b-b1e9-72ef6089e96e.metadata.json
   metadata/00002-af7769db-f489-4e3b-a82c-7d3e33061fe8.metadata.json
   metadata/6b800910-b4ae-4fe4-b7d9-41480cef782e-m0.avro
   metadata/eb864f4d-2414-4f1b-9d1d-41c77c4d82d9-m0.avro
   metadata/snap-5708461256527487370-0-6b800910-b4ae-4fe4-b7d9-41480cef782e.avro
   metadata/snap-7056987340384911027-0-eb864f4d-2414-4f1b-9d1d-41c77c4d82d9.avro
snapshots: [(1027, 'append', '3'), (7370, 'append', '2')]
rows now: 5 | rows at first snapshot (time travel): 3
after ADD COLUMN: schema fields = ['order_id', 'status', 'amount', 'channel'] | data files rewritten: 0
old rows read the new column as: [None, None]

=== DELTA ===
files on disk:
   _delta_log/00000000000000000000.json
   _delta_log/00000000000000000001.json
   _delta_log/00000000000000000002.json
   part-00000-0a32cfb2-ff82-4a12-a686-2a1273088b34-c000.snappy.parquet
   part-00000-0e69c4fe-6594-4c61-8ed4-c23be9e1d2f7-c000.snappy.parquet
   part-00000-35bd01e9-37c7-4336-907e-1fe3ccb99823-c000.zstd.parquet
commit 0: actions = ['commitInfo', 'protocol', 'metaData', 'add']
commit 1: actions = ['commitInfo', 'add']
commit 2: actions = ['commitInfo', 'add', 'remove']
version now: 2 | rows now: 4 | rows at version 1 (time travel): 5
history: ['DELETE', 'WRITE', 'WRITE']
```

What to look for:

- **Iceberg**: three `metadata.json` files (create, append, append), one manifest (`-m0.avro`) and one manifest list (`snap-...avro`) per append, and a catalog row that points at the newest metadata file. Time travel to the first snapshot returns 3 rows.
- **ADD COLUMN rewrote 0 data files.** Old rows read the new column as null. Schema evolution is a metadata change.
- **Delta**: commit 0 carries `protocol` and `metaData`; the DELETE commit is an `add` plus a `remove`, because without deletion vectors the affected file is rewritten. Version 1 still has 5 rows.
- Open `lake_lab/delta_orders/_delta_log/00000000000000000002.json` in an editor and read the actions yourself. Delete the `lake_lab` folder when you're done.

## 7. Gotchas

- **Small files** from streaming writes slow planning on every format. Schedule compaction.
- **Expire snapshots / VACUUM** or storage grows forever, but expiring too early breaks time travel and long-running readers.
- **Feature flags can lock out readers.** Turning on a new Delta table feature or Iceberg v3 can make older engines unable to read the table. Check every reader before upgrading.
- **Concurrent writers on the same partitions** conflict and retry. Design jobs so they write disjoint partitions where possible.

## Sources

- Apache Iceberg table spec (format versions v1 to v3, v4 in development; metadata tree; atomic swap): https://iceberg.apache.org/spec/
- Apache Iceberg releases (1.12.0 current): https://iceberg.apache.org/releases/
- Delta Lake protocol (actions, checkpoints, deletion vectors, commits): https://github.com/delta-io/delta/blob/master/PROTOCOL.md
- delta-spark on PyPI (4.4.1): https://pypi.org/project/delta-spark/
- Apache Hudi table types (CoW, MoR, timeline, compaction): https://hudi.apache.org/docs/table_types
- Apache Hudi releases (1.2.1): https://hudi.apache.org/releases/download
- PyIceberg docs: https://py.iceberg.apache.org/
- delta-rs (deltalake Python package) docs: https://delta-io.github.io/delta-rs/
