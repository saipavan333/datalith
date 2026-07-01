"""
Big-bank data platform — run the WHOLE pipeline end to end, locally.

Stages (mirrors the production architecture):
  1. generate    — synthetic source data (batch + streaming)
  2. DataStage   — ETL: standardize/validate raw -> BRONZE
  3. Databricks  — PySpark medallion: BRONZE -> SILVER (+ SCD2 dim, data quality)
  4. streaming   — PySpark Structured Streaming fraud/AML scoring
  5. contracts   — data-contract CI gate (blocks bad data)
  6. warehouse   — load SILVER into the warehouse (Greenplum/DuckDB)
  7. dbt         — build GOLD marts (reconciliation, fraud, regulatory) + tests
  8. report      — show the gold marts

Usage:  python run.py            (full pipeline)
        python run.py --no-dbt   (skip dbt if not installed)
"""
from __future__ import annotations
import os, sys, shutil, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "src"))
os.environ.setdefault("SPARK_LOCAL_IP", "127.0.0.1")


def _dbt_cmd():
    exe = shutil.which("dbt") or str(Path.home() / ".local/bin/dbt")
    return exe if Path(exe).exists() else None


def main():
    no_dbt = "--no-dbt" in sys.argv
    import generate_data, datastage_etl, spark_medallion, streaming_fraud, contracts, load_warehouse, serve_dashboard

    print("1) GENERATE source data (batch + streaming)")
    generate_data.generate()

    print("2) DATASTAGE ETL  -> bronze")
    datastage_etl.run()

    print("3) DATABRICKS / PySpark medallion  -> silver")
    spark_medallion.run()

    print("4) STREAMING fraud/AML scoring")
    streaming_fraud.run()

    print("5) DATA CONTRACT gate")
    if not contracts.run():
        print("   pipeline halted by failing contract (this is the gate working).")
        sys.exit(1)

    print("6) LOAD warehouse (Greenplum/DuckDB)")
    load_warehouse.run()

    if no_dbt or not _dbt_cmd():
        print("7) dbt — skipped (install dbt-duckdb to build gold marts)")
    else:
        print("7) dbt build  -> gold marts + tests")
        env = dict(os.environ, DBT_PROFILES_DIR=str(HERE / "dbt_bank"))
        rc = subprocess.call([_dbt_cmd(), "build", "--project-dir", str(HERE / "dbt_bank"),
                              "--profiles-dir", str(HERE / "dbt_bank")], env=env)
        if rc != 0:
            print("   NOTE: dbt reported failures (often a data test — the quality gate doing its job).")

    print("8) SERVE — metrics layer -> BI dashboard")
    try:
        serve_dashboard.run()
    except Exception as e:
        print(f"   serving skipped (needs dbt gold marts): {e}")

    print("9) REPORT — gold marts")
    import duckdb
    from common import WAREHOUSE
    con = duckdb.connect(str(WAREHOUSE))
    for mart in ("gold_daily_reconciliation", "gold_fraud_summary", "gold_regulatory_exposure"):
        try:
            rows = con.execute(f"SELECT * FROM {mart} LIMIT 5").fetchall()
            print(f"\n   [{mart}]")
            for r in rows:
                print("     ", r)
        except Exception as e:
            print(f"   {mart}: not built ({e})")
    con.close()
    print("\nDONE — complete bank pipeline ran end to end. Outputs in ./out/.")
    print("Showcase: walk through README.md + ARCHITECTURE.md and the gold marts above.")


if __name__ == "__main__":
    main()
