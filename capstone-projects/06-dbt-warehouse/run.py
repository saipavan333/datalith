"""
Capstone 6 — Analytics engineering with dbt (dbt-duckdb).

Generates a seed, then runs `dbt seed -> run -> test` to build a staging view and a
mart table with data tests — the ref() DAG + tests + materializations.

Run:  pip install -r requirements.txt   (dbt-duckdb)
      python run.py
Output: ./out/warehouse.duckdb (models: stg_orders, orders_by_region)
"""
from __future__ import annotations
import os, random, subprocess, sys, datetime as dt
from pathlib import Path

HERE = Path(__file__).parent
SEEDS = HERE / "seeds"
OUT = HERE / "out"
random.seed(11)


def make_seed(n: int = 800):
    SEEDS.mkdir(exist_ok=True)
    regions = ["na", "eu", "apac", "latam"]      # lowercase on purpose; staging upper()s them
    lines = ["order_id,region,amount,order_ts"]
    for i in range(n):
        amount = round(random.uniform(5, 400), 2)
        if random.random() < 0.05:               # invalid rows staging will drop
            amount = round(-amount, 2)
        ts = (dt.datetime(2026, 1, 1) + dt.timedelta(minutes=random.randint(0, 100000))).isoformat()
        lines.append(f"ORD-{i:05d},{random.choice(regions)},{amount},{ts}")
    (SEEDS / "raw_orders.csv").write_text("\n".join(lines))
    print(f"   wrote {SEEDS/'raw_orders.csv'} ({n} rows)")


def dbt(*args) -> int:
    env = dict(os.environ, DBT_PROFILES_DIR=str(HERE))
    cmd = ["dbt", *args, "--project-dir", str(HERE)]
    print(f"   $ {' '.join(cmd)}")
    return subprocess.call(cmd, env=env)


def main():
    OUT.mkdir(exist_ok=True)
    print("1) GENERATE seed")
    make_seed()

    try:
        rc = subprocess.call(["dbt", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        rc = 1
    if rc != 0:
        print("\n   dbt not found. Install it and re-run:")
        print("   pip install -r requirements.txt   # dbt-duckdb")
        sys.exit(1)

    print("2) dbt seed (load CSV)");      assert dbt("seed", "--full-refresh") == 0, "dbt seed failed"
    print("3) dbt run  (build models)");  assert dbt("run") == 0, "dbt run failed"
    print("4) dbt test (data tests)")
    if dbt("test") != 0:
        print("   NOTE: some tests failed — that's the quality gate doing its job.")

    print("5) query the mart")
    import duckdb
    con = duckdb.connect(str(OUT / "warehouse.duckdb"))
    for row in con.execute("select * from orders_by_region order by revenue desc").fetchall():
        print("   ", row)
    con.close()
    print("\nDONE. Models built in out/warehouse.duckdb; docs: `dbt docs generate && dbt docs serve`.")


if __name__ == "__main__":
    main()
