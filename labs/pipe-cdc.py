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
