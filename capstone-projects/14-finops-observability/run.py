"""
Capstone 14 — Data observability & FinOps.

Runs a small daily pipeline, then computes the five observability pillars
(freshness, volume, schema, quality, lineage) and a per-pipeline COST attribution,
firing alerts on SLO breaches. An anomaly is injected on the latest day so you see
the alerts actually trigger.

Run:  pip install -r requirements.txt
      python run.py
Output: ./out/metrics.duckdb, ./out/report.md
"""
from __future__ import annotations
import json, random, datetime as dt
from pathlib import Path
import duckdb

OUT = Path(__file__).parent / "out"
DB = OUT / "metrics.duckdb"
random.seed(8)

EXPECTED_SCHEMA = {"order_id": "VARCHAR", "region": "VARCHAR", "amount": "DOUBLE", "ts": "TIMESTAMP"}
LINEAGE = {  # simple lineage graph: downstream depends on upstream
    "raw_orders": [],
    "stg_orders": ["raw_orders"],
    "orders_mart": ["stg_orders"],
    "exec_dashboard": ["orders_mart"],
}
SLO = {"freshness_minutes": 90, "min_rows": 600, "max_null_rate": 0.02}


def build_table(con):
    con.execute("DROP TABLE IF EXISTS raw_orders")
    con.execute("CREATE TABLE raw_orders(order_id VARCHAR, region VARCHAR, amount DOUBLE, ts TIMESTAMP)")
    today = dt.datetime(2026, 1, 10, 9, 0, 0)
    rows = []
    # 7 healthy days
    for d in range(7):
        day = today - dt.timedelta(days=7 - d)
        for i in range(random.randint(800, 1000)):
            rows.append((f"O{d}-{i}", random.choice(["NA", "EU", "APAC"]),
                         round(random.uniform(5, 200), 2), day))
    # latest day: INJECT an anomaly (volume drop + null spike + stale)
    stale_day = today - dt.timedelta(minutes=200)        # breaches freshness SLO
    for i in range(120):                                  # breaches min_rows
        amt = None if random.random() < 0.15 else round(random.uniform(5, 200), 2)  # null spike
        rows.append((f"OX-{i}", random.choice(["NA", "EU", "APAC"]), amt, stale_day))
    con.executemany("INSERT INTO raw_orders VALUES (?,?,?,?)", rows)


def observe(con):
    now = dt.datetime(2026, 1, 10, 9, 0, 0)
    latest_ts = con.execute("SELECT max(ts) FROM raw_orders").fetchone()[0]
    freshness_min = (now - latest_ts).total_seconds() / 60
    # volume on the latest day
    latest_day = con.execute("SELECT max(ts)::DATE FROM raw_orders").fetchone()[0]
    vol = con.execute("SELECT count(*) FROM raw_orders WHERE ts::DATE = ?", [latest_day]).fetchone()[0]
    null_rate = con.execute("SELECT avg(CASE WHEN amount IS NULL THEN 1 ELSE 0 END) FROM raw_orders "
                            "WHERE ts::DATE = ?", [latest_day]).fetchone()[0]
    cols = {r[1]: r[2] for r in con.execute("PRAGMA table_info('raw_orders')").fetchall()}
    schema_ok = all(cols.get(k) == v for k, v in EXPECTED_SCHEMA.items())
    return {"freshness_min": round(freshness_min, 1), "latest_day_rows": vol,
            "null_rate": round(null_rate or 0, 3), "schema_ok": schema_ok}


def alerts(m):
    out = []
    if m["freshness_min"] > SLO["freshness_minutes"]:
        out.append(f"FRESHNESS: data is {m['freshness_min']:.0f} min old (SLO {SLO['freshness_minutes']})")
    if m["latest_day_rows"] < SLO["min_rows"]:
        out.append(f"VOLUME: only {m['latest_day_rows']} rows on latest day (SLO >= {SLO['min_rows']})")
    if m["null_rate"] > SLO["max_null_rate"]:
        out.append(f"QUALITY: amount null rate {m['null_rate']:.1%} (SLO <= {SLO['max_null_rate']:.0%})")
    if not m["schema_ok"]:
        out.append("SCHEMA: drift from expected schema")
    return out


def cost_report():
    # mock per-pipeline spend (e.g. from warehouse usage tagged by pipeline)
    spend = {"raw_orders_ingest": 42.10, "stg_orders": 18.75, "orders_mart": 63.40, "exec_dashboard": 9.20}
    total = sum(spend.values())
    return spend, total


def main():
    OUT.mkdir(exist_ok=True)
    con = duckdb.connect(str(DB))
    print("1) RUN pipeline (7 healthy days + an anomalous latest day)")
    build_table(con)

    print("2) OBSERVABILITY pillars")
    m = observe(con)
    print(f"   freshness: {m['freshness_min']} min | latest-day volume: {m['latest_day_rows']} rows | "
          f"null rate: {m['null_rate']:.1%} | schema_ok: {m['schema_ok']}")
    print("   lineage:", " -> ".join(["raw_orders", "stg_orders", "orders_mart", "exec_dashboard"]))

    print("3) ALERTS (SLO breaches)")
    fired = alerts(m)
    for a in fired:
        print(f"   ALERT  {a}")
    if fired:
        impacted = LINEAGE_downstream("raw_orders")
        print(f"   impact (via lineage): {', '.join(impacted)}")
    else:
        print("   none")

    print("4) FINOPS cost attribution")
    spend, total = cost_report()
    for p, c in sorted(spend.items(), key=lambda x: -x[1]):
        print(f"   {p:22s} ${c:>6.2f}  ({c/total:.0%})")
    print(f"   total: ${total:.2f}  | top spender: {max(spend, key=spend.get)}")

    (OUT / "report.md").write_text(json.dumps({"pillars": m, "alerts": fired, "spend": spend, "total": total}, indent=2))
    con.close()
    print("\nDONE. Observability + FinOps make the platform trustworthy AND affordable.")


def LINEAGE_downstream(node, seen=None):
    seen = seen or []
    for tbl, deps in LINEAGE.items():
        if node in deps and tbl not in seen:
            seen.append(tbl); LINEAGE_downstream(tbl, seen)
    return seen


if __name__ == "__main__":
    main()
