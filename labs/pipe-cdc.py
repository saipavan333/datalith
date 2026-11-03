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
