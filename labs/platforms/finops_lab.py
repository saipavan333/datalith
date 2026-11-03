"""FinOps lab across GCP, Databricks and Snowflake: one month of synthetic but realistically
shaped usage records, analysed with the same queries you'd run on the real system tables:

  GCP        BigQuery billing export + region-us.INFORMATION_SCHEMA.JOBS
  Databricks system.billing.usage joined to system.billing.list_prices
  Snowflake  SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY / METERING_DAILY_HISTORY

The records are generated (no real bills), but the column names follow those views and the
prices are the Nov-2026 list prices cited in the lesson. Databricks $/DBU differs by cloud,
tier and SKU and is only shown on the pricing calculator, so the DBU price here is a stated
assumption (marked ASSUMED).

Run:  python labs/platforms/finops_lab.py
"""
import duckdb

con = duckdb.connect()
con.execute("SET threads TO 1")  # deterministic random() so your numbers match the lesson
con.execute("SELECT setseed(0.11)")
# ---- unified usage table (FOCUS-style: provider, service, team tag, quantity, unit, cost) ----
con.execute("""
CREATE TABLE usage AS
WITH days AS (SELECT DATE '2026-10-01' + CAST(d AS INTEGER) AS day FROM range(31) t(d))
SELECT day, 'gcp' AS provider, 'BigQuery on-demand' AS service, team,
       tib AS quantity, 'TiB scanned' AS unit, tib * 6.25 AS cost_usd
FROM days, (VALUES ('marketing', 1.8), ('finance', 0.4), ('data-science', 3.1)) v(team, base),
     LATERAL (SELECT base * (0.6 + random()) AS tib)
UNION ALL
SELECT day, 'databricks', 'Jobs compute (classic)', team, dbu, 'DBU', dbu * 0.15        -- ASSUMED $0.15/DBU
FROM days, (VALUES ('marketing', 120), ('data-science', 400)) v(team, base),
     LATERAL (SELECT base * (0.7 + random()*0.6) AS dbu)
UNION ALL
SELECT day, 'databricks', 'All-purpose compute', team, dbu, 'DBU', dbu * 0.40             -- ASSUMED $0.40/DBU
FROM days, (VALUES ('data-science', 260)) v(team, base),
     LATERAL (SELECT base * (0.7 + random()*0.6) AS dbu)
UNION ALL
SELECT day, 'snowflake', 'Warehouse ' || wh, team, credits, 'credits', credits * 3.0      -- Enterprise, AWS US East
FROM days, (VALUES ('BI_WH', 'finance', 40), ('ELT_WH', 'marketing', 55), ('ADHOC_WH', NULL, 30)) v(wh, team, base),
     LATERAL (SELECT base * (0.8 + random()*0.4) AS credits)
""")

# Oct 21: someone in data-science ran SELECT * over a 60 TiB events table from a notebook, twice.
con.execute("INSERT INTO usage VALUES (DATE '2026-10-21', 'gcp', 'BigQuery on-demand', 'data-science', 120, 'TiB scanned', 120*6.25)")

print("1) Month-to-date cost by provider")
for r in con.execute("SELECT provider, round(sum(cost_usd)) FROM usage GROUP BY 1 ORDER BY 2 DESC").fetchall():
    print(f"   {r[0]:11} ${r[1]:>9,.0f}")

print("\n2) Showback by team (untagged spend is a finding on its own)")
for r in con.execute("""SELECT coalesce(team,'<untagged>'), round(sum(cost_usd)),
                        round(100*sum(cost_usd)/sum(sum(cost_usd)) OVER (),1)
                        FROM usage GROUP BY 1 ORDER BY 2 DESC""").fetchall():
    print(f"   {r[0]:13} ${r[1]:>9,.0f}  {r[2]:5}%")

print("\n3) Top waste candidates")
ap = con.execute("SELECT sum(cost_usd) FROM usage WHERE service='All-purpose compute'").fetchone()[0]
print(f"   all-purpose (interactive) clusters running scheduled work: ${ap:,.0f}; the same DBUs on jobs")
print(f"   compute at the ASSUMED rate would be ${ap*0.15/0.40:,.0f} -> move scheduled notebooks to jobs/serverless")
un = con.execute("SELECT sum(cost_usd) FROM usage WHERE team IS NULL").fetchone()[0]
print(f"   ADHOC_WH has no owner tag: ${un:,.0f}/month nobody is accountable for")

print("\n4) Unit economics: cost per 1,000 orders processed (the number your CFO understands)")
orders = 31 * 2_400_000
total = con.execute("SELECT sum(cost_usd) FROM usage").fetchone()[0]
print(f"   ${total:,.0f} / {orders:,} orders = ${total/orders*1000:.3f} per 1,000 orders")

print("\n5) Anomaly: days where a team spent > 1.5x its own 7-day trailing average")
rows = con.execute("""
  WITH d AS (SELECT day, coalesce(team,'<untagged>') team, sum(cost_usd) c FROM usage GROUP BY 1,2),
  w AS (SELECT *, avg(c) OVER (PARTITION BY team ORDER BY day ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) a FROM d)
  SELECT day, team, round(c), round(a) FROM w WHERE a IS NOT NULL AND c > 1.5*a ORDER BY day""").fetchall()
print(f"   {len(rows)} anomaly day(s)" + "".join(f"\n   {r[0]} {r[1]:12} ${r[2]:,.0f} vs avg ${r[3]:,.0f}" for r in rows))
print("\nWhat to look for: tag coverage first, then the biggest single lever (here: interactive clusters),")
print("then a unit cost you can trend month over month.")
