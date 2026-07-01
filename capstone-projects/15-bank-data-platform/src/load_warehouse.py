"""
Load SILVER into the warehouse  (Stage 4) — Greenplum in production, DuckDB locally.

Loads the silver Parquet tables into the analytical warehouse so dbt can build the
GOLD marts. Locally this is DuckDB; in the bank it's Greenplum (see greenplum_ddl.sql
for the DISTRIBUTED BY / append-optimized columnar DDL).
Output: out/warehouse.duckdb  (tables: src_transactions, src_dim_customer, src_fraud_alerts)
"""
from __future__ import annotations
import duckdb
from common import LAKE, WAREHOUSE

SILVER = LAKE / "silver"


def run():
    con = duckdb.connect(str(WAREHOUSE))
    loads = {
        "src_transactions": SILVER / "transactions.parquet",
        "src_dim_customer": SILVER / "dim_customer.parquet",
        "src_fraud_alerts": SILVER / "fraud_alerts.parquet",
    }
    counts = {}
    for tbl, path in loads.items():
        # read_parquet handles Spark's part-file directories via a glob
        con.execute(f"CREATE OR REPLACE TABLE {tbl} AS SELECT * FROM read_parquet('{path}/*.parquet')")
        counts[tbl] = con.execute(f"SELECT count(*) FROM {tbl}").fetchone()[0]
    con.close()
    print("   loaded to warehouse:", counts)
    return counts


if __name__ == "__main__":
    run()
