"""
Capstone 3 — An orchestrated, quality-gated pipeline.

Demonstrates: a task DAG, retries with backoff, a quality gate that can halt the run,
and idempotent loads. Uses Prefect if installed; otherwise a tiny built-in orchestrator
with the same semantics, so it always runs.

Run:  python run.py
Output: ./out/orders.duckdb (table 'orders_daily')
"""
from __future__ import annotations
import random, time, datetime as dt
from pathlib import Path
import duckdb

OUT = Path(__file__).parent / "out"
DB = OUT / "orders.duckdb"
RUN_DATE = dt.date.today().isoformat()
random.seed(1)

# ---- use Prefect if available, else a minimal stand-in with retries ----
try:
    from prefect import flow, task
    ENGINE = "Prefect"
except Exception:  # fallback path — same retry semantics
    ENGINE = "built-in"

    def task(*dargs, retries=0, retry_delay_seconds=0, **_):
        def deco(fn):
            def wrapper(*a, **k):
                attempt = 0
                while True:
                    try:
                        return fn(*a, **k)
                    except Exception as e:
                        if attempt >= retries:
                            raise
                        attempt += 1
                        print(f"   [retry] {fn.__name__} failed ({e}); attempt {attempt}/{retries}")
                        time.sleep(retry_delay_seconds)
            return wrapper
        if dargs and callable(dargs[0]):   # used as @task (no parens)
            return deco(dargs[0])
        return deco

    def flow(*dargs, **dkw):
        if dargs and callable(dargs[0]):   # used as @flow (no parens)
            return dargs[0]
        def deco(fn):
            return fn
        return deco


@task(retries=3, retry_delay_seconds=0.1)
def extract() -> list[dict]:
    # flaky source: ~40% of attempts "fail" until a retry succeeds
    if random.random() < 0.4:
        raise RuntimeError("source timeout")
    return [{"region": random.choice(["NA", "EU", "APAC"]),
             "amount": round(random.uniform(10, 200), 2)} for _ in range(500)]


@task
def transform(rows: list[dict]) -> list[dict]:
    agg: dict[str, dict] = {}
    for r in rows:
        a = agg.setdefault(r["region"], {"orders": 0, "revenue": 0.0})
        a["orders"] += 1
        a["revenue"] += r["amount"]
    return [{"dt": RUN_DATE, "region": k, "orders": v["orders"], "revenue": round(v["revenue"], 2)}
            for k, v in agg.items()]


@task
def quality_gate(rows: list[dict]) -> list[dict]:
    assert rows, "no rows produced"
    assert all(r["revenue"] > 0 for r in rows), "non-positive revenue"
    assert all(r["orders"] > 0 for r in rows), "non-positive order count"
    print(f"   quality gate passed: {len(rows)} region rows")
    return rows


@task
def load(rows: list[dict]) -> int:
    OUT.mkdir(exist_ok=True)
    con = duckdb.connect(str(DB))
    con.execute("CREATE TABLE IF NOT EXISTS orders_daily(dt DATE, region VARCHAR, orders INT, revenue DOUBLE)")
    con.execute("DELETE FROM orders_daily WHERE dt = ?", [RUN_DATE])   # idempotent
    con.executemany("INSERT INTO orders_daily VALUES (?,?,?,?)",
                    [(r["dt"], r["region"], r["orders"], r["revenue"]) for r in rows])
    n = con.execute("SELECT count(*) FROM orders_daily WHERE dt = ?", [RUN_DATE]).fetchone()[0]
    con.close()
    return n


@flow(name="orders-daily")
def pipeline():
    rows = quality_gate(transform(extract()))
    n = load(rows)
    print(f"   loaded {n} rows for {RUN_DATE} (idempotent)")
    con = duckdb.connect(str(DB))
    print("   table contents:")
    for row in con.execute("SELECT * FROM orders_daily ORDER BY revenue DESC").fetchall():
        print("     ", row)
    con.close()


if __name__ == "__main__":
    print(f"orchestrator: {ENGINE}")
    pipeline()
    print("DONE. Re-run: today's partition is replaced, not duplicated (idempotent).")
