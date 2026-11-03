"""Snowflake stand-in lab: micro-partition pruning and why clustering matters.

Snowflake stores every table as immutable micro-partitions (50-500 MB of uncompressed data each,
stored compressed) and keeps min/max metadata per column per micro-partition. A WHERE filter lets
the optimizer skip every micro-partition whose [min, max] range can't match. Parquet row groups
carry the same kind of min/max statistics, so DuckDB + Parquet is an honest local model:
one row group = one micro-partition.

Source: https://docs.snowflake.com/en/user-guide/tables-clustering-micropartitions (checked 2026-11-03)

Run:  python labs/platforms/snow_pruning.py
"""
import os
import shutil
import tempfile
import duckdb

tmp = tempfile.mkdtemp(prefix="snow_prune_")
con = duckdb.connect()
con.execute("SET threads TO 1")  # deterministic random() so your numbers match the lesson
con.execute("SELECT setseed(0.7)")
# 2M orders over 365 days, arriving in random order (think: late, out-of-order loads)
con.execute("""
CREATE TABLE orders AS
SELECT i AS order_id,
       DATE '2026-01-01' + CAST(floor(random()*365) AS INTEGER) AS order_date,
       CAST(floor(random()*5000) AS INTEGER) AS store_id,
       round(random()*400, 2) AS amount
FROM range(2000000) t(i)
""")

ROWS_PER_MP = 20000   # 100 "micro-partitions"
unsorted = os.path.join(tmp, "orders_natural.parquet")
clustered = os.path.join(tmp, "orders_clustered.parquet")
con.execute(f"COPY orders TO '{unsorted}' (FORMAT parquet, ROW_GROUP_SIZE {ROWS_PER_MP})")
con.execute(f"COPY (SELECT * FROM orders ORDER BY order_date) TO '{clustered}' (FORMAT parquet, ROW_GROUP_SIZE {ROWS_PER_MP})")

LO, HI = "2026-03-01", "2026-03-07"   # one week


def pruning_report(path, label):
    stats = con.execute(f"""
        SELECT row_group_id, stats_min_value AS mn, stats_max_value AS mx
        FROM parquet_metadata('{path}') WHERE path_in_schema = 'order_date'
    """).fetchall()
    total = len(stats)
    must_scan = sum(1 for _, mn, mx in stats if not (mx < LO or mn > HI))
    # clustering depth for one point: how many partitions overlap a single date
    depth = sum(1 for _, mn, mx in stats if mn <= "2026-03-04" <= mx)
    print(f"{label:28} partitions={total:4}  scanned={must_scan:4}  pruned={1 - must_scan/total:6.1%}  depth@2026-03-04={depth}")


print(f"Query: SELECT SUM(amount) FROM orders WHERE order_date BETWEEN '{LO}' AND '{HI}'\n")
pruning_report(unsorted, "natural load order")
pruning_report(clustered, "clustered by order_date")
ans = con.execute(f"SELECT round(SUM(amount),2) FROM read_parquet('{clustered}') WHERE order_date BETWEEN '{LO}' AND '{HI}'").fetchone()[0]
ans2 = con.execute(f"SELECT round(SUM(amount),2) FROM read_parquet('{unsorted}') WHERE order_date BETWEEN '{LO}' AND '{HI}'").fetchone()[0]
print(f"\nsame answer both ways: {ans} == {ans2} -> {ans == ans2}")
print("\nWhat to look for:")
print(" - Random arrival order puts every date in almost every partition: nothing can be pruned.")
print(" - Sorted (clustered) data gives each partition a narrow date range, so ~97% are skipped.")
print(" - 'depth' is SYSTEM$CLUSTERING_DEPTH's idea: how many partitions overlap one value. Lower is better.")
shutil.rmtree(tmp, ignore_errors=True)  # remove the temp folder this lab created
