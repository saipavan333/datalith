# Change Data Capture (CDC): log-based vs query-based, and how Debezium works

Every company has a production database that the business runs on. Analytics needs a copy of it, kept fresh, without slowing it down. CDC is how you get that copy. Get it wrong and your warehouse quietly keeps orders that were cancelled and deleted, or misses the state a payment passed through. Both are the kind of bug that only shows up when finance reconciles at month end.

## The picture to keep in your head

Think of a school library. You want to know every book that moved today.

- **Query-based CDC** is walking the shelves every hour and writing down what you see. If a book was borrowed and returned between your walks, you never knew. If a book was thrown away, you just notice a gap and can't tell whether you looked wrong.
- **Log-based CDC** is reading the librarian's checkout ledger. Every borrow, return and write-off is a line, in order, with a line number. Miss nothing, and you can pick up from line 4,812 tomorrow.

The database's ledger is its **write-ahead log** (Postgres WAL, MySQL binlog). It exists for crash recovery and replication anyway. Log-based CDC just reads it.

@@diagram:cdc-log-vs-query

## 1. Query-based CDC (polling)

You keep a **watermark**, usually the max `updated_at` you have already copied, and poll:

```sql
SELECT * FROM orders
WHERE updated_at > :last_watermark
ORDER BY updated_at;
```

It is easy to build and needs no special database access. It has four real problems:

- **Hard deletes are invisible.** A deleted row is not returned by any SELECT. You need soft deletes (`is_deleted`) in the app, or a periodic full compare.
- **In-between states are lost.** An order that goes `placed -> paid -> shipped` between two polls arrives as one row, `shipped`. If finance needs "time to payment", you can't compute it.
- **It trusts the app to set `updated_at`.** One bulk `UPDATE` script that forgets to bump it, and those rows are never copied.
- **It loads the source.** Each poll is a range scan on production. With an index on `updated_at` it is fine at small scale; at a billion rows with hot writes, it competes with customers.

There is also a subtle **watermark race**: a transaction that started earlier but commits later can write an `updated_at` that is *below* a watermark you already moved past. The usual fix is to re-read a small overlap window (`updated_at > :wm - interval '5 minutes'`) and make the load idempotent.

## 2. Trigger-based CDC

Triggers on each table write every change into a shadow "changelog" table. It catches deletes and every state, but it doubles the write work inside every production transaction, so most teams avoid it on busy databases. The lab below uses triggers only because SQLite has no WAL reader we can tap from Python. The *shape* of the events is the same as log-based CDC.

## 3. Log-based CDC

The CDC tool connects as a replication client and streams the log:

- **Postgres**: logical decoding through a **replication slot**, usually with the built-in `pgoutput` plugin. Debezium creates the slot if it has the rights.
- **MySQL**: reads the binlog. It must be `binlog_format=ROW` and `binlog_row_image=FULL`, so every event carries whole rows.

Each change becomes an event with a **before** image, an **after** image, an **op** code and **source** metadata (database, table, log position such as the Postgres LSN, commit time). Debezium's op codes are:

| op | meaning | before | after |
|---|---|---|---|
| `r` | row read during the initial snapshot | null | row |
| `c` | insert (create) | null | row |
| `u` | update | old row (full only with `REPLICA IDENTITY FULL` on Postgres) | new row |
| `d` | delete | old row | null |
| `t` | table truncated | null | null |

After a delete, Debezium also emits a **tombstone**: same key, null value. That lets Kafka **log compaction** drop all older messages for the key.

### The initial snapshot

The log only holds recent history, so a new connector first takes a **snapshot** (`snapshot.mode=initial` is the default): it reads every existing row as `op=r` events, remembers the log position where the snapshot was consistent, then switches to streaming from that position. Big tables can instead be backfilled with **incremental snapshots**: you send an `execute-snapshot` signal and Debezium reads the table in chunks *while* streaming continues, so a 2 TB table does not freeze the pipeline for a day.

### Where the events go

The common setup is **Debezium running on Kafka Connect**, writing one Kafka topic per table (`shop.public.orders`). Downstream, a sink applies them to the lakehouse or warehouse with a keyed `MERGE`. Debezium Server and the embedded engine can send events elsewhere (Pub/Sub, Kinesis, HTTP) without running Kafka.

## 4. Applying changes correctly downstream

Copying events is half the job. Applying them wrong gives you a corrupt table that *looks* fine. The rules:

- **Apply in log order per key.** Kafka keeps order within a partition, and Debezium keys messages by primary key, so all changes for one order land in one partition, in order.
- **Make the apply idempotent.** Kafka sinks deliver at least once, so you will see some events twice. Track the last applied log position (LSN) per key or per partition and skip anything older. Upsert, never blind insert.
- **Turn `d` into a tombstone, not a vanished row.** Keep the deleted key in silver with `is_deleted = true` and the delete's LSN, and expose current state through a view (`WHERE NOT is_deleted`). A hard `DELETE` throws away the one fact that protects you from replays: "this key was deleted at LSN 30". Purge old tombstones later, once no replay can reach back that far.
- **Keep the raw change stream.** Land every event in an append-only bronze table first. Then build the current-state silver table with `MERGE`. If the merge logic has a bug, you replay from bronze instead of re-snapshotting production.

The tempting silver merge hard-deletes. **Don't ship this one:**

```sql
-- BROKEN under replays: shown so you recognise it in code review
MERGE INTO silver.orders AS t
USING (latest change per order_id in this batch) AS s
ON t.order_id = s.order_id
WHEN MATCHED AND s.op = 'd'      THEN DELETE                      -- no LSN guard
WHEN MATCHED AND s.lsn > t.lsn   THEN UPDATE SET status = s.status, lsn = s.lsn
WHEN NOT MATCHED AND s.op <> 'd' THEN INSERT VALUES (s.order_id, s.status, s.lsn);
```

It works when batches arrive once, in order. Re-run an **older** batch (a backfill after a bug fix, a retried job) and it breaks two ways, both shown in the lab:

- **Resurrection.** Order 1 was deleted on day 2, so its row is gone. Re-running day 1 finds no match, and day 1's `u` hits `WHEN NOT MATCHED ... INSERT`. The deleted order is back.
- **Wrong delete.** Order 2 was deleted (LSN 25) and later re-created (LSN 35). Re-running day 1 replays the old delete, and the unguarded `DELETE` branch removes the live row.

The replay-safe version keeps tombstones and guards **every** branch with the source position:

```sql
MERGE INTO silver.orders AS t
USING (
  SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY lsn DESC) AS rn
    FROM bronze.orders_changes
    WHERE ingest_date = :batch_date
  ) WHERE rn = 1                       -- latest change per key in this batch
) AS s
ON t.order_id = s.order_id
WHEN MATCHED AND s.lsn > t.lsn THEN                -- only ever move forward in log order
  UPDATE SET status = s.status, amount = s.amount, lsn = s.lsn, is_deleted = (s.op = 'd')
WHEN NOT MATCHED THEN                               -- a delete for an unseen key still lands, as a tombstone
  INSERT (order_id, status, amount, lsn, is_deleted)
  VALUES (s.order_id, s.status, s.amount, s.lsn, s.op = 'd');

CREATE VIEW silver.orders_current AS SELECT * FROM silver.orders WHERE NOT is_deleted;
```

With tombstones plus the guard on every branch, replays in **any** order are harmless: an older change always meets a stored LSN that is newer and does nothing. If you must hard-delete (storage or privacy rules), keep a separate per-key tombstone table (`order_id, deleted_lsn`) and check it in the merge. The guard needs a strictly increasing position per key: the Postgres LSN or the MySQL binlog file and position, never a wall-clock timestamp.

## 5. Worked example at real scale

A marketplace runs **40 Postgres shards** behind its checkout service. The `orders` table holds 1.2 billion rows in total and sees about **25 million changes a day**: roughly 290 per second on average and around 3,000 per second at the evening peak.

1. **Why not polling?** A 15-minute poll across 40 shards is 3,840 range scans a day on production, still blind to deletes. Ops has also seen bulk-fix scripts skip `updated_at`. Log-based CDC is the right call.
2. **Event volume.** Debezium JSON events with schemas inline run around 1 KB each, so 25M x 1 KB is about 25 GB a day into Kafka. Switching to Avro with a schema registry cuts this to a few hundred bytes per event, roughly 5-8 GB a day. Kafka with 7 days of retention and replication factor 3 then needs about 25 GB x 7 x 3, around 525 GB, on JSON, or about a third of that on Avro.
3. **Partitions.** At 3,000 events/s peak, one partition per topic would work for throughput, but the sink has to keep up while merging. 12 partitions keyed by `order_id` gives the sink 12 parallel workers and keeps per-order ordering.
4. **The danger you must monitor.** A Postgres replication slot keeps WAL until the connector confirms it. If Kafka Connect is down for 6 hours while each shard writes 3 GB of WAL an hour (WAL covers every table on the shard and full-page writes, not just the orders changes), every primary is holding an extra 18 GB of WAL. Leave it for a weekend and a primary can fill its disk. Alert on slot lag (bytes and minutes) the same way you alert on CPU.
5. **Backfilling a new table.** Product wants the 600 GB `refunds` table added. Use an incremental snapshot signal so it is read in chunks while live changes keep flowing, instead of a blocking snapshot.

The arithmetic here is the method to copy. The exact numbers are a teaching scenario.

## 6. Hands-on lab: watch polling lose data (runs locally)

Needs only Python and `pip install duckdb`. SQLite plays the app database; a trigger-fed changelog plays the WAL; DuckDB plays the warehouse. Save as `pipe_cdc.py` (the course repo ships it as `labs/pipe-cdc.py`) and run `python pipe_cdc.py`.

```python
"""Lab: query-based vs log-style CDC, side by side.
Runs on plain Python (sqlite3 is built in) + duckdb (pip install duckdb).
Source = SQLite "app database". Target = DuckDB "warehouse".
"""
import json, sqlite3, duckdb

src = sqlite3.connect(":memory:")
src.executescript("""
CREATE TABLE orders (order_id INTEGER PRIMARY KEY, status TEXT, amount REAL, updated_at TEXT);
-- The changelog plays the part of the WAL/binlog: every row change, in commit order.
CREATE TABLE _changelog (lsn INTEGER PRIMARY KEY AUTOINCREMENT, op TEXT, order_id INTEGER,
                         before TEXT, after TEXT);
CREATE TRIGGER t_ins AFTER INSERT ON orders BEGIN
  INSERT INTO _changelog(op,order_id,before,after) VALUES ('c',NEW.order_id,NULL,
    json_object('order_id',NEW.order_id,'status',NEW.status,'amount',NEW.amount,'updated_at',NEW.updated_at)); END;
CREATE TRIGGER t_upd AFTER UPDATE ON orders BEGIN
  INSERT INTO _changelog(op,order_id,before,after) VALUES ('u',NEW.order_id,
    json_object('order_id',OLD.order_id,'status',OLD.status,'amount',OLD.amount,'updated_at',OLD.updated_at),
    json_object('order_id',NEW.order_id,'status',NEW.status,'amount',NEW.amount,'updated_at',NEW.updated_at)); END;
CREATE TRIGGER t_del AFTER DELETE ON orders BEGIN
  INSERT INTO _changelog(op,order_id,before,after) VALUES ('d',OLD.order_id,
    json_object('order_id',OLD.order_id,'status',OLD.status,'amount',OLD.amount,'updated_at',OLD.updated_at),NULL); END;
""")

def run(sql, *a): src.execute(sql, a); src.commit()

# --- day 1: three orders arrive
for oid, amt in [(1, 40.0), (2, 15.5), (3, 99.0)]:
    run("INSERT INTO orders VALUES (?, 'placed', ?, '2026-11-01 09:00')", oid, amt)

wh = duckdb.connect()
wh.execute("CREATE TABLE q_orders (order_id INT PRIMARY KEY, status TEXT, amount DOUBLE, updated_at TEXT)")
wh.execute("CREATE TABLE l_orders (order_id INT PRIMARY KEY, status TEXT, amount DOUBLE, updated_at TEXT)")
wh.execute("CREATE TABLE l_history (lsn INT, op TEXT, order_id INT, status TEXT)")
state = {"watermark": "1970-01-01", "last_lsn": 0}

def query_based_sync():
    """Poll rows changed since the watermark. Cheap to build. Blind to deletes."""
    rows = src.execute("SELECT * FROM orders WHERE updated_at > ? ORDER BY updated_at",
                       (state["watermark"],)).fetchall()
    for r in rows:
        wh.execute("INSERT OR REPLACE INTO q_orders VALUES (?,?,?,?)", r)
    if rows: state["watermark"] = max(r[3] for r in rows)
    return len(rows)

def log_based_sync():
    """Read the change log after the last applied position; apply in order. Idempotent."""
    evs = src.execute("SELECT lsn, op, order_id, before, after FROM _changelog WHERE lsn > ? ORDER BY lsn",
                      (state["last_lsn"],)).fetchall()
    for lsn, op, oid, before, after in evs:
        event = {"op": op, "before": json.loads(before) if before else None,
                 "after": json.loads(after) if after else None, "source": {"lsn": lsn}}
        if op in ("c", "u"):
            a = event["after"]
            wh.execute("INSERT OR REPLACE INTO l_orders VALUES (?,?,?,?)",
                       [a["order_id"], a["status"], a["amount"], a["updated_at"]])
        elif op == "d":
            wh.execute("DELETE FROM l_orders WHERE order_id = ?", [oid])
        wh.execute("INSERT INTO l_history VALUES (?,?,?,?)",
                   [lsn, op, oid, (event["after"] or event["before"])["status"]])
        state["last_lsn"] = lsn
    return evs

print("sync 1  query-based rows:", query_based_sync(), "| log events:", len(log_based_sync()))

# --- between syncs: order 2 is paid then shipped, order 3 is deleted (fraud)
run("UPDATE orders SET status='paid',    updated_at='2026-11-01 10:00' WHERE order_id=2")
run("UPDATE orders SET status='shipped', updated_at='2026-11-01 11:00' WHERE order_id=2")
run("DELETE FROM orders WHERE order_id=3")

n_q = query_based_sync(); evs = log_based_sync()
print("sync 2  query-based rows:", n_q, "| log events:", len(evs))
print("first log event of sync 2 (Debezium-style):",
      json.dumps({"op": evs[0][1], "before": json.loads(evs[0][3]), "after": json.loads(evs[0][4]),
                  "source": {"lsn": evs[0][0]}}))

print("\nsource        :", src.execute("SELECT order_id, status FROM orders ORDER BY 1").fetchall())
print("query-based   :", wh.execute("SELECT order_id, status FROM q_orders ORDER BY 1").fetchall())
print("log-based     :", wh.execute("SELECT order_id, status FROM l_orders ORDER BY 1").fetchall())
print("order 2 history seen by log-based CDC:",
      [r[0] for r in wh.execute("SELECT status FROM l_history WHERE order_id=2 ORDER BY lsn").fetchall()])

# --- replay safety: re-reading from an old position must not change the result
before = wh.execute("SELECT * FROM l_orders ORDER BY 1").fetchall()
state["last_lsn"] = 0; wh.execute("DELETE FROM l_history"); log_based_sync()
after = wh.execute("SELECT * FROM l_orders ORDER BY 1").fetchall()
print("replay from lsn 0 gives same table:", before == after)

# =====================================================================================
# Part 2: applying changes with MERGE, and the replay trap.
# Bronze keeps every change with its source position (LSN). Silver is built with MERGE.
# We apply two daily batches, then RE-RUN day 1 (a backfill after a bug fix) and see
# what each MERGE pattern does to an order that was deleted on day 2.
# =====================================================================================
print("\n--- Part 2: MERGE patterns under an out-of-order replay ---")
wh.execute("""CREATE TABLE bronze AS SELECT * FROM (VALUES
  (1, 10, 'c', 'placed', DATE '2026-11-01'), (1, 20, 'u', 'paid', DATE '2026-11-01'),
  (1, 30, 'd', 'paid',   DATE '2026-11-02'),                            -- order 1 deleted on day 2
  (2, 15, 'c', 'placed', DATE '2026-11-01'), (2, 25, 'd', 'placed', DATE '2026-11-01'),
  (2, 35, 'c', 'placed', DATE '2026-11-02')                             -- order 2 deleted, then re-created
) AS t(order_id, lsn, op, status, ingest_date)""")

LATEST = """SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY lsn DESC) rn
            FROM bronze WHERE ingest_date = ?) WHERE rn = 1"""

HARD = """MERGE INTO silver_hard t USING ({latest}) s ON t.order_id = s.order_id
WHEN MATCHED AND s.op = 'd'      THEN DELETE
WHEN MATCHED AND s.lsn > t.lsn   THEN UPDATE SET status = s.status, lsn = s.lsn
WHEN NOT MATCHED AND s.op <> 'd' THEN INSERT VALUES (s.order_id, s.status, s.lsn)""".format(latest=LATEST)

SOFT = """MERGE INTO silver_soft t USING ({latest}) s ON t.order_id = s.order_id
WHEN MATCHED AND s.lsn > t.lsn THEN UPDATE SET status = s.status, lsn = s.lsn, is_deleted = (s.op = 'd')
WHEN NOT MATCHED               THEN INSERT VALUES (s.order_id, s.status, s.lsn, s.op = 'd')""".format(latest=LATEST)
# every branch is guarded by the LSN, and a delete becomes a tombstone row instead of vanishing

wh.execute("CREATE TABLE silver_hard (order_id INT PRIMARY KEY, status TEXT, lsn INT)")
wh.execute("CREATE TABLE silver_soft (order_id INT PRIMARY KEY, status TEXT, lsn INT, is_deleted BOOLEAN)")
def current(tbl):
    where = " WHERE NOT is_deleted" if tbl == "silver_soft" else ""
    return wh.execute(f"SELECT order_id, status, lsn FROM {tbl}{where} ORDER BY 1").fetchall()

for day in ("2026-11-01", "2026-11-02"):
    wh.execute(HARD, [day]); wh.execute(SOFT, [day])
print("after day 1 + day 2  hard-delete MERGE :", current("silver_hard"))
print("                     soft-delete MERGE :", current("silver_soft"), "(visible rows)")

wh.execute(HARD, ["2026-11-01"]); wh.execute(SOFT, ["2026-11-01"])      # re-run day 1
print("after re-running day 1")
print("   hard-delete MERGE :", current("silver_hard"))
print("      bug 1: order 1 is back from the dead (day 1's 'paid' hit WHEN NOT MATCHED -> INSERT)")
print("      bug 2: live order 2 (lsn 35) is gone (day 1's old delete, lsn 25, hit the unguarded DELETE)")
print("   soft-delete MERGE :", current("silver_soft"), "<- unchanged: day 1's lsn 20 < tombstone lsn 30")
print("   tombstones kept   :", wh.execute("SELECT order_id, lsn FROM silver_soft WHERE is_deleted").fetchall())
```

Expected output (from a real run on 2026-11-03, Python 3.14, DuckDB 2.0.0):

```text
sync 1  query-based rows: 3 | log events: 3
sync 2  query-based rows: 1 | log events: 3
first log event of sync 2 (Debezium-style): {"op": "u", "before": {"order_id": 2, "status": "placed", "amount": 15.5, "updated_at": "2026-11-01 09:00"}, "after": {"order_id": 2, "status": "paid", "amount": 15.5, "updated_at": "2026-11-01 10:00"}, "source": {"lsn": 4}}

source        : [(1, 'placed'), (2, 'shipped')]
query-based   : [(1, 'placed'), (2, 'shipped'), (3, 'placed')]
log-based     : [(1, 'placed'), (2, 'shipped')]
order 2 history seen by log-based CDC: ['placed', 'paid', 'shipped']
replay from lsn 0 gives same table: True

--- Part 2: MERGE patterns under an out-of-order replay ---
after day 1 + day 2  hard-delete MERGE : [(2, 'placed', 35)]
                     soft-delete MERGE : [(2, 'placed', 35)] (visible rows)
after re-running day 1
   hard-delete MERGE : [(1, 'paid', 20)]
      bug 1: order 1 is back from the dead (day 1's 'paid' hit WHEN NOT MATCHED -> INSERT)
      bug 2: live order 2 (lsn 35) is gone (day 1's old delete, lsn 25, hit the unguarded DELETE)
   soft-delete MERGE : [(2, 'placed', 35)] <- unchanged: day 1's lsn 20 < tombstone lsn 30
   tombstones kept   : [(1, 30)]
```

What to look for:

- **Sync 2: polling saw 1 row, the log saw 3 events.** Polling got order 2's final state only and never noticed order 3 vanished.
- **`query-based` still has order 3**, which no longer exists at the source. That is the phantom row your finance team will find.
- **The log-based copy heard `placed, paid, shipped`** for order 2, so "time to payment" is computable.
- **Replay from LSN 0 gives the same table.** Replaying the whole log in order is safe even with simple upserts.
- **Part 2 is the trap.** Re-running day 1 after day 2 makes the hard-delete `MERGE` resurrect order 1 and delete the live order 2. The tombstone `MERGE`, guarded by LSN on every branch, doesn't change.

To try real Debezium (needs Docker, around 2 GB of images, not free disk on this course's laptop budget): the Debezium tutorial runs Kafka, Kafka Connect, MySQL and the connector with `docker compose`, then you register the connector with a `POST` to Kafka Connect's REST API on port 8083. Follow the official tutorial linked below rather than a copied compose file, since image tags change.

## 7. Gotchas that bite in production

- **Schema changes.** A column added at the source flows into events. Without a schema registry and a compatibility rule, the first consumer that can't parse it stops the pipeline (see the schema registry lesson).
- **Updates with no before image.** On Postgres the default replica identity only sends the key in `before`. Set `REPLICA IDENTITY FULL` on tables where you need the old values, and accept the extra WAL.
- **Large transactions.** One `UPDATE` touching 30 million rows becomes 30 million events arriving in a burst. Size the sink for bursts, not the average.
- **Failovers.** When a Postgres primary fails over, the slot must exist on the new primary, or CDC stops (or worse, misses a gap). Check your database version and managed service's slot failover support before you need it.
- **Ordering across tables.** Kafka orders within a partition, not across topics. An `order_items` event can land before its `orders` parent. Build silver tables to tolerate that (late-arriving parents).

## 8. Interview angles

- *"Why log-based over polling?"* Deletes, intermediate states, no dependence on `updated_at`, and far less source load. Cost: needs replication rights, slot monitoring and a streaming stack.
- *"How do you make the sink exactly-once?"* You usually can't make delivery exactly-once end to end. You make the *apply* idempotent: key by primary key, keep the source LSN, merge only newer positions on every branch, and keep deletes as tombstones so an out-of-order replay can't resurrect a row.
- *"How do you add a 2 TB table without downtime?"* Incremental snapshot, chunked, concurrent with streaming. Then reconcile row counts and checksums per day against the source.

## Sources

- Debezium PostgreSQL connector, 3.7 docs (logical decoding, `pgoutput`, snapshot modes, event envelope, op codes, tombstones, WAL retention): https://debezium.io/documentation/reference/stable/connectors/postgresql.html
- Debezium MySQL connector, 3.7 docs (binlog settings, incremental snapshots via signals): https://debezium.io/documentation/reference/stable/connectors/mysql.html
- Debezium tutorial (Docker-based): https://debezium.io/documentation/reference/stable/tutorial.html
- PostgreSQL logical decoding concepts: https://www.postgresql.org/docs/current/logicaldecoding-explanation.html
- Kafka log compaction (design docs): https://kafka.apache.org/documentation/#compaction
