"""AUTO CDC stand-in lab: what Databricks' AUTO CDC INTO (formerly APPLY CHANGES) does for you.

Given a change feed with a key, an operation and a sequence number, AUTO CDC builds an
SCD type 1 table (latest row per key) or an SCD type 2 table (__START_AT / __END_AT history),
and it orders by SEQUENCE BY, so events arriving out of order still produce the right answer.
Here the same logic is written out in DuckDB SQL so you can see it.

Source: https://docs.databricks.com/aws/en/ldp/cdc (checked 2026-11-03)
Run:  python labs/platforms/auto_cdc_scd_sim.py
"""
import duckdb

con = duckdb.connect()
con.execute("""CREATE TABLE users_cdf AS SELECT * FROM (VALUES
  (124, 'Raul',   'Oaxaca',    'INSERT', 1),
  (123, 'Isabel', 'Monterrey', 'INSERT', 1),
  (125, 'Mercedes','Tijuana',  'INSERT', 2),
  (126, 'Lily',   'Cancun',    'INSERT', 2),
  (123, NULL,     NULL,        'DELETE', 6),
  (125, 'Mercedes','Guadalajara','UPDATE', 6),
  (125, 'Mercedes','Mexicali', 'UPDATE', 5),   -- arrives AFTER seq 6: out of order
  (123, 'Isabel', 'Chihuahua', 'UPDATE', 5)
) t(userId, name, city, operation, sequenceNum)""")

print("SCD TYPE 1 (KEYS userId, SEQUENCE BY sequenceNum, APPLY AS DELETE WHEN operation='DELETE'):")
for r in con.execute("""
  SELECT userId, name, city FROM (
    SELECT *, row_number() OVER (PARTITION BY userId ORDER BY sequenceNum DESC) rn FROM users_cdf)
  WHERE rn = 1 AND operation <> 'DELETE' ORDER BY userId""").fetchall():
    print("  ", r)

print("\nnaive 'last arrival wins' (what a hand-written MERGE per batch often does):")
for r in con.execute("""
  SELECT userId, name, city FROM (
    SELECT *, row_number() OVER (PARTITION BY userId ORDER BY rowid DESC) rn FROM users_cdf)
  WHERE rn = 1 AND operation <> 'DELETE' ORDER BY userId""").fetchall():
    print("  ", r)

print("\nSCD TYPE 2 (STORED AS SCD TYPE 2): one row per version, __START_AT/__END_AT from the sequence:")
for r in con.execute("""
  WITH v AS (
    SELECT userId, name, city, operation, sequenceNum AS __START_AT,
           lead(sequenceNum) OVER (PARTITION BY userId ORDER BY sequenceNum) AS __END_AT
    FROM users_cdf)
  SELECT userId, name, city, __START_AT, __END_AT FROM v
  WHERE operation <> 'DELETE' ORDER BY userId, __START_AT""").fetchall():
    print("  ", r)
print("\nWhat to look for: user 125 ends in Guadalajara (seq 6) even though the seq-5 event arrived last;")
print("user 123 is deleted in SCD1 but its history stays in SCD2 with an __END_AT. The naive version gets 125")
print("wrong AND brings deleted user 123 back to life, because the stale seq-5 update arrived after the delete.")
