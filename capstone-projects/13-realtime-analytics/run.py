"""
Capstone 13 — Real-time analytics serving (sub-second OLAP).

Streams events into a columnar OLAP store (DuckDB as a laptop stand-in for ClickHouse/Pinot)
and serves user-facing dashboard queries, timing each to show millisecond latency on fresh
data — the real-time-OLAP pattern.

Run:  pip install -r requirements.txt
      python run.py
Output: ./out/events.duckdb
"""
from __future__ import annotations
import time, random, datetime as dt
from pathlib import Path
import duckdb

OUT = Path(__file__).parent / "out"
DB = OUT / "events.duckdb"
random.seed(6)


def seed_events(con, n=500_000):
    con.execute("DROP TABLE IF EXISTS events")
    con.execute("""CREATE TABLE events(
        ts TIMESTAMP, user_id INT, product VARCHAR, action VARCHAR, amount DOUBLE)""")
    base = dt.datetime(2026, 1, 1, 12, 0, 0)
    # generate with DuckDB itself for speed (vectorized)
    con.execute(f"""
        INSERT INTO events
        SELECT TIMESTAMP '2026-01-01 12:00:00' + INTERVAL (s) SECOND AS ts,
               (random()*10000)::INT AS user_id,
               'P' || ((random()*50)::INT)::VARCHAR AS product,
               CASE WHEN random() < 0.6 THEN 'view' WHEN random() < 0.9 THEN 'cart' ELSE 'purchase' END AS action,
               round(random()*200, 2) AS amount
        FROM range(0, {n}) t(s)
    """)
    return con.execute("SELECT count(*) FROM events").fetchone()[0]


DASHBOARD_QUERIES = {
    "purchases last 15 min (by minute)": """
        SELECT date_trunc('minute', ts) m, count(*) c, round(sum(amount),2) revenue
        FROM events WHERE action='purchase'
          AND ts >= (SELECT max(ts) FROM events) - INTERVAL 15 MINUTE
        GROUP BY 1 ORDER BY 1 DESC LIMIT 5""",
    "top 5 products by revenue": """
        SELECT product, count(*) sales, round(sum(amount),2) revenue
        FROM events WHERE action='purchase' GROUP BY 1 ORDER BY revenue DESC LIMIT 5""",
    "funnel conversion": """
        SELECT
          count(*) FILTER (WHERE action='view') AS views,
          count(*) FILTER (WHERE action='cart') AS carts,
          count(*) FILTER (WHERE action='purchase') AS purchases
        FROM events""",
}


def main():
    OUT.mkdir(exist_ok=True)
    con = duckdb.connect(str(DB))

    print("1) INGEST event stream into the OLAP store")
    t0 = time.perf_counter()
    n = seed_events(con)
    print(f"   loaded {n:,} events in {(time.perf_counter()-t0)*1000:.0f} ms")

    print("2) SERVE dashboard queries (sub-second on fresh data):")
    for label, sql in DASHBOARD_QUERIES.items():
        t0 = time.perf_counter()
        rows = con.execute(sql).fetchall()
        ms = (time.perf_counter() - t0) * 1000
        print(f"\n   [{label}]  {ms:.1f} ms")
        for r in rows[:5]:
            print("     ", r)

    print("\n3) simulate 3 dashboard refreshes (warm cache):")
    for i in range(3):
        t0 = time.perf_counter()
        con.execute(DASHBOARD_QUERIES["top 5 products by revenue"]).fetchall()
        print(f"   refresh {i+1}: {(time.perf_counter()-t0)*1000:.1f} ms")
    con.close()
    print("\nDONE. DuckDB stands in for ClickHouse/Pinot here; see README for a real ClickHouse via docker.")


if __name__ == "__main__":
    main()
