"""Snowflake stand-in lab: how a STREAM's offset works and why a TASK's MERGE must consume it.

A Snowflake stream does not copy data. It stores an *offset* (a point in the table's version
history) and, when queried, returns the net row changes between that offset and now, with
METADATA$ACTION ('INSERT'/'DELETE') and METADATA$ISUPDATE. The offset only moves forward when
the stream is read inside a DML statement that commits (e.g. the MERGE inside a task).
Plain SELECTs do not move it.

We model this in DuckDB: a versioned change log on the source table, a one-row offset table,
and a "task" that MERGEs net changes into the target and advances the offset in the same
transaction. Source: https://docs.snowflake.com/en/user-guide/streams-intro (checked 2026-11-03)

Run:  python labs/platforms/snow_streams_tasks.py
"""
import duckdb

con = duckdb.connect()
con.execute("CREATE TABLE changes (version INT, policy_id INT, premium DECIMAL(10,2), action VARCHAR)")
con.execute("CREATE TABLE stream_offset (v INT)")
con.execute("INSERT INTO stream_offset VALUES (0)")
con.execute("CREATE TABLE curated_policies (policy_id INT PRIMARY KEY, premium DECIMAL(10,2))")
version = 0


def dml(rows):
    """Simulate one committed DML on the source table: bumps the table version."""
    global version
    version += 1
    for pid, prem, act in rows:
        con.execute("INSERT INTO changes VALUES (?, ?, ?, ?)", [version, pid, prem, act])


def stream_contents():
    """Net changes since the offset: last action per key wins (what a standard stream returns)."""
    return con.execute("""
      SELECT policy_id, premium, action FROM (
        SELECT *, row_number() OVER (PARTITION BY policy_id ORDER BY version DESC) rn
        FROM changes WHERE version > (SELECT v FROM stream_offset)) WHERE rn = 1
      ORDER BY policy_id""").fetchall()


def task_run(fail=False):
    """The task: MERGE stream -> target, then advance offset. All-or-nothing."""
    con.execute("BEGIN")
    try:
        con.execute("""
          CREATE OR REPLACE TEMP TABLE s AS
          SELECT policy_id, premium, action FROM (
            SELECT *, row_number() OVER (PARTITION BY policy_id ORDER BY version DESC) rn
            FROM changes WHERE version > (SELECT v FROM stream_offset)) WHERE rn = 1""")
        con.execute("""
          MERGE INTO curated_policies t USING s ON t.policy_id = s.policy_id
          WHEN MATCHED AND s.action = 'DELETE' THEN DELETE
          WHEN MATCHED THEN UPDATE SET premium = s.premium
          WHEN NOT MATCHED AND s.action <> 'DELETE' THEN INSERT VALUES (s.policy_id, s.premium)""")
        if fail:
            raise RuntimeError("warehouse lost mid-run")
        con.execute("UPDATE stream_offset SET v = ?", [version])
        con.execute("COMMIT")
        return "committed"
    except Exception as e:  # noqa: BLE001
        con.execute("ROLLBACK")
        return f"rolled back ({e})"


print("1) three new policies land in staging")
dml([(101, 1200, "INSERT"), (102, 950, "INSERT"), (103, 3100, "INSERT")])
print("   stream shows:", stream_contents())
print("   a plain SELECT on the stream twice -> still there:", len(stream_contents()), "rows")

print("2) task runs ->", task_run())
print("   target:", con.execute("SELECT * FROM curated_policies ORDER BY 1").fetchall())
print("   stream now empty:", stream_contents())

print("3) policy 102 re-priced twice and 103 cancelled before the next run")
dml([(102, 990, "UPDATE")])
dml([(102, 1010, "UPDATE")])
dml([(103, None, "DELETE")])
print("   stream shows only the NET change per key:", stream_contents())

print("4) task fails half-way ->", task_run(fail=True))
print("   offset did not move, nothing lost:", stream_contents())
print("5) task retries ->", task_run())
print("   target:", con.execute("SELECT * FROM curated_policies ORDER BY 1").fetchall())
print("\nWhat to look for:")
print(" - SELECT does not consume a stream; the committed DML does.")
print(" - Two updates to 102 collapse to one row: streams return net changes, not every event.")
print(" - A failed run rolls back MERGE and offset together, so the retry is exactly-once.")
