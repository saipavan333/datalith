"""Datastream -> BigQuery stand-in lab: merge mode vs append-only mode, and why events are
ordered by source timestamp / sequence, not by arrival.

Datastream reads the source database's change log (MySQL binlog, PostgreSQL logical
replication, Oracle LogMiner/binary reader, SQL Server CDC or transaction logs) and writes to
BigQuery. In *merge* mode the BigQuery table mirrors the source (one row per primary key);
in *append-only* mode every change is a new row carrying datastream_metadata
(UUID, SOURCE_TIMESTAMP, CHANGE_SEQUENCE_NUMBER, CHANGE_TYPE, SORT_KEYS).
Source: https://cloud.google.com/datastream/docs/destination-bigquery (checked 2026-11-03)

DuckDB plays BigQuery. Run:  python labs/platforms/datastream_cdc_sim.py
"""
import duckdb

con = duckdb.connect()
# change events as Datastream would deliver them: NOTE arrival order != commit order
events = [
    # uuid, source_ts(ms), change_type, account_id, balance
    ("u1", 1000, "INSERT",        1, 500.0),
    ("u2", 1001, "INSERT",        2, 80.0),
    ("u4", 1003, "UPDATE-INSERT", 1, 450.0),   # arrives BEFORE u3 (parallel readers / retries)
    ("u3", 1002, "UPDATE-INSERT", 1, 470.0),
    ("u5", 1004, "DELETE",        2, None),
    ("u6", 1005, "INSERT",        3, 1200.0),
    ("u6", 1005, "INSERT",        3, 1200.0),  # duplicate delivery (at-least-once)
]
con.execute("""CREATE TABLE accounts_log (uuid VARCHAR, source_timestamp BIGINT, change_type VARCHAR,
               account_id INT, balance DOUBLE)""")
con.executemany("INSERT INTO accounts_log VALUES (?, ?, ?, ?, ?)", events)

print("append-only table (every change, as delivered):")
for r in con.execute("SELECT * FROM accounts_log").fetchall():
    print("  ", r)

print("\nWRONG current state: last row by ARRIVAL order")
wrong = con.execute("""
  SELECT account_id, balance FROM (
    SELECT *, row_number() OVER (PARTITION BY account_id ORDER BY rowid DESC) rn FROM accounts_log)
  WHERE rn = 1 AND change_type <> 'DELETE' ORDER BY 1""").fetchall()
print("  ", wrong)

print("RIGHT current state: dedupe by uuid, latest by SOURCE_TIMESTAMP, drop deletes (what merge mode maintains)")
right = con.execute("""
  WITH dedup AS (SELECT DISTINCT * FROM accounts_log),
  latest AS (SELECT *, row_number() OVER (PARTITION BY account_id ORDER BY source_timestamp DESC) rn FROM dedup)
  SELECT account_id, balance FROM latest WHERE rn = 1 AND change_type <> 'DELETE' ORDER BY 1""").fetchall()
print("  ", right)

print("\nCost check with the Nov-2026 list price (CDC $2.00/GiB for the first 2,500 GiB/month;")
print("processed bytes can be 2-5x the raw row size per the pricing page):")
for raw_gib in [50, 300]:
    for mult in [2, 5]:
        g = raw_gib * mult
        cost = min(g, 2500) * 2.00 + max(0, min(g, 5000) - 2500) * 1.50
        print(f"  {raw_gib:4} GiB raw changes x{mult} -> {g:5} GiB processed -> ${cost:,.0f}/month")
print("\nWhat to look for: account 1 must end at 450 (the u4 commit is newer), account 2 is deleted,")
print("account 3 appears once. Ordering by arrival gets account 1 wrong.")
