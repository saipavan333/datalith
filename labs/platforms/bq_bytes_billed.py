"""BigQuery stand-in lab: how partitioning, clustering and column choice change *bytes billed*.

Runs locally on DuckDB (no Google account). It builds a 30-day clickstream table
(1.2M rows locally), then scales the result up to a real site that
lands ~800 GiB/day, i.e. a 30-day table of ~24 TiB, then computes what BigQuery's
on-demand model would bill for four versions of the same question, using BigQuery's
own logical-size rules (INT64/TIMESTAMP/FLOAT64 = 8 bytes, BOOL = 1 byte,
STRING = 2 bytes + UTF-8 length, NULL = 0) and its 10 MB per-table minimum.

Sources (checked 2026-11-03):
  data sizes  https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#data_type_sizes
  pricing     https://cloud.google.com/bigquery/pricing  ($6.25 per TiB on-demand in US, 1 TiB/month free,
              charges rounded up to the nearest MB, 10 MB minimum per table referenced)

Run:  python labs/platforms/bq_bytes_billed.py
"""
import math
import duckdb

PRICE_PER_TIB = 6.25
TIB = 2 ** 40
MB = 2 ** 20

con = duckdb.connect()
con.execute("SELECT setseed(0.42)")
con.execute("""
CREATE TABLE events AS
SELECT
  (DATE '2026-10-01' + CAST(i % 30 AS INTEGER))                    AS event_date,   -- partition column
  TIMESTAMP '2026-10-01' + INTERVAL (i % 30) DAY + INTERVAL (i % 86400) SECOND AS event_ts,
  CAST(i % 50000 AS BIGINT)                                          AS user_id,
  ['IN','US','GB','DE','SG','BR'][1 + CAST(floor(random()*6) AS INTEGER)] AS country,  -- cluster column
  ['view','click','add_to_cart','purchase'][1 + CAST(floor(random()*4) AS INTEGER)] AS event_name,
  'https://shop.example.com/p/' || CAST(i % 9000 AS VARCHAR) || '?ref=campaign_' || CAST(i % 37 AS VARCHAR) AS page_url,
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/131.0 Mobile' AS user_agent,
  round(random()*120, 2)                                             AS revenue,
  random() < 0.03                                                    AS is_bot
FROM range(1200000) t(i)
""")

# BigQuery logical bytes per column, computed exactly the way BigQuery documents it.
SIZE_SQL = {
    "event_date": "8",
    "event_ts": "8",
    "user_id": "8",
    "revenue": "8",
    "is_bot": "1",
    "country": "2 + strlen(country)",
    "event_name": "2 + strlen(event_name)",
    "page_url": "2 + strlen(page_url)",
    "user_agent": "2 + strlen(user_agent)",
}

def logical_bytes(cols, where="TRUE"):
    expr = " + ".join(f"SUM({SIZE_SQL[c]})" for c in cols)
    return con.execute(f"SELECT {expr} FROM events WHERE {where}").fetchone()[0]

def billed(nbytes):
    mb = max(10, math.ceil(nbytes / MB))          # round up to MB, 10 MB minimum per table
    return mb * MB

ALL = list(SIZE_SQL)
q_cols = ["event_date", "country", "event_name", "revenue"]
cases = [
    ("1  SELECT * , no filter (whole table)",               ALL,    "TRUE"),
    ("2  4 columns, no partition filter",                   q_cols, "TRUE"),
    ("3  4 columns, partition filter: last 7 days",         q_cols, "event_date >= DATE '2026-10-24'"),
    # Clustering on country lets BigQuery skip blocks whose country range can't match.
    # We model ideal clustering by counting only matching rows inside the pruned partitions.
    ("4  + clustered on country, WHERE country = 'IN'",     q_cols, "event_date >= DATE '2026-10-24' AND country = 'IN'"),
]

total_rows = con.execute("SELECT count(*) FROM events").fetchone()[0]
print(f"rows in table: {total_rows:,}  (30 daily partitions)\n")
# Scale factor: make the full table = 30 days x 800 GiB = 24,000 GiB (a real mid-size e-commerce site).
scale = (30 * 800 * 2**30) / logical_bytes(ALL)
print(f"scale factor to a 30 x 800 GiB table: x{scale:,.0f}\n")
print(f"{'query':52} {'local MB':>9} {'at scale GiB':>13} {'on-demand cost':>15}")
base = None
for name, cols, where in cases:
    lb = logical_bytes(cols, where)
    b = billed(lb * scale)                       # the 10 MB minimum only matters for tiny queries
    cost = b / TIB * PRICE_PER_TIB
    base = base or b
    print(f"{name:52} {lb/MB:9.1f} {b/2**30:13,.0f} {'$'+format(cost,',.2f'):>15}   ({b/base:6.1%} of SELECT *)")
print(f"\nA tiny lookup query on this table still bills max(10 MB, bytes read): {billed(4096)/MB:.0f} MB.")

print("\nWhat to look for:")
print(" - SELECT * pays for the two long STRING columns even though the question never uses them.")
print(" - The partition filter cuts bytes to ~7/30 because whole daily partitions are skipped.")
print(" - Clustering only pays off on top of pruning when the filter column is the cluster key.")
print(" - Tiny queries still bill 10 MB: the minimum is per table referenced.")
print(" - Compare the cost column: the same question can cost 100x more written badly.")
