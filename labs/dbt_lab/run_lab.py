"""Lab driver: two 'days' of data through dbt (needs: pip install dbt-duckdb). Run from this folder."""
import os, pathlib, shutil, subprocess, sys
import duckdb
HERE = pathlib.Path(__file__).resolve().parent
os.chdir(HERE)
for p in ("shop.duckdb", "target", "logs"):
    shutil.rmtree(p, ignore_errors=True) if pathlib.Path(p).is_dir() else pathlib.Path(p).unlink(missing_ok=True)
DBT = shutil.which("dbt") or str(pathlib.Path(sys.executable).parent / "dbt")

DAY1 = """order_id,status,amount_cents,updated_at
1,placed,4000,2026-11-01 09:00:00
2,placed,1550,2026-11-01 09:05:00
3,PAID,9900,2026-11-01 09:10:00
"""
DAY2 = """order_id,status,amount_cents,updated_at
1,shipped,4000,2026-11-02 08:00:00
3,PAID,9900,2026-11-01 09:10:00
4,placed,1200,2026-11-02 08:30:00
"""   # order 1 changed, order 2 was hard-deleted at the source, order 4 is new

def dbt(*args):
    r = subprocess.run([DBT, *args, "--profiles-dir", ".", "--no-use-colors"], capture_output=True, text=True)
    summary = [l.split(" ", 1)[1].strip() for l in r.stdout.splitlines() if "Done. PASS=" in l or "Completed with" in l]
    print(f"$ dbt {' '.join(args):10s} -> exit {r.returncode}  {summary[-1] if summary else ''}")
    if r.returncode != 0: print(r.stdout[-3000:]); sys.exit(1)

def show(title, sql):
    con = duckdb.connect("shop.duckdb", read_only=True)
    print(f"  {title}:"); [print("    ", row) for row in con.execute(sql).fetchall()]; con.close()

print("DAY 1")
pathlib.Path("seeds/raw_orders.csv").write_text(DAY1)
dbt("seed"); dbt("build")          # build = run models + snapshots + tests + unit tests, in DAG order
show("fct_orders", "select order_id, status, amount from main.fct_orders order by 1")

print("DAY 2")
pathlib.Path("seeds/raw_orders.csv").write_text(DAY2)
dbt("seed"); dbt("build")
show("fct_orders (incremental merge)", "select order_id, status, amount from main.fct_orders order by 1")
show("orders_snapshot (SCD2 history)",
     "select order_id, status, strftime(dbt_valid_from, '%m-%d %H:%M') as valid_from, "
     "coalesce(strftime(dbt_valid_to, '%m-%d %H:%M'), 'current') as valid_to "
     "from main.orders_snapshot order by order_id, dbt_valid_from")
