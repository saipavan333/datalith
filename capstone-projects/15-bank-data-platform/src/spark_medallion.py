"""
PySpark / Databricks medallion  (Stage 2).

Reads BRONZE (landed by the DataStage job) and builds SILVER with real engineering:
  - transactions: dedupe, type, validate, derive, join to accounts/customers
  - dim_customer:  SCD2-ready conformed dimension (surrogate key + validity + change hash)
  - data-quality:  orphan-account check (referential integrity)

On Databricks these are Delta tables; locally we write Parquet (same logic).
Output: out/lake/silver/{transactions,dim_customer}.parquet  + a quality report.
"""
from __future__ import annotations
import json
from pyspark.sql import functions as F, Window
from common import spark_session, LAKE

BRONZE = LAKE / "bronze"
SILVER = LAKE / "silver"


def run():
    SILVER.mkdir(parents=True, exist_ok=True)
    spark = spark_session("medallion")

    cust = spark.read.parquet(str(BRONZE / "customers.parquet"))
    acct = spark.read.parquet(str(BRONZE / "accounts.parquet"))
    txn = spark.read.parquet(str(BRONZE / "transactions.parquet"))

    # ---- SILVER transactions: dedupe -> validate -> derive -> conform ----
    w = Window.partitionBy("txn_id").orderBy("txn_ts")
    txn_silver = (txn
        .withColumn("rn", F.row_number().over(w)).where("rn = 1").drop("rn")   # dedupe by txn_id
        .withColumn("amount", F.col("amount").cast("double"))
        .withColumn("is_reversal", F.col("amount") < 0)                        # keep, but flag
        .withColumn("txn_date", F.to_date("txn_ts"))
        .where(F.col("amount").isNotNull())
        .join(acct.select("account_id", "customer_id", "acct_type"), "account_id", "left"))
    txn_silver.write.mode("overwrite").parquet(str(SILVER / "transactions.parquet"))

    # ---- SILVER dim_customer: SCD2-ready conformed dimension ----
    # change-hash lets the NEXT load detect changed attributes and MERGE (close old / insert new).
    dim = (cust.select("customer_id", "name", "region", "segment", "since")
        .withColumn("attr_hash", F.sha2(F.concat_ws("|", "name", "region", "segment"), 256))
        .withColumn("valid_from", F.current_date())
        .withColumn("valid_to", F.lit(None).cast("date"))
        .withColumn("is_current", F.lit(True))
        .withColumn("customer_sk", F.sha2(F.concat_ws("|", "customer_id", F.current_date().cast("string")), 256)))
    dim.write.mode("overwrite").parquet(str(SILVER / "dim_customer.parquet"))
    # Next-day SCD2 (Databricks Delta):
    #   MERGE INTO dim_customer t USING staging s ON t.customer_id=s.customer_id AND t.is_current
    #   WHEN MATCHED AND t.attr_hash<>s.attr_hash THEN UPDATE SET valid_to=current_date, is_current=false
    #   then INSERT the new version.

    # ---- DATA QUALITY: referential integrity (orphan accounts) ----
    cust_ids = cust.select("customer_id").distinct()
    orphans = acct.join(cust_ids, "customer_id", "left_anti").count()
    total_acct = acct.count()
    report = {
        "silver_transactions": txn_silver.count(),
        "reversals_flagged": txn_silver.where("is_reversal").count(),
        "dim_customer_rows": dim.count(),
        "orphan_accounts": orphans,
        "orphan_rate": round(orphans / total_acct, 4) if total_acct else 0,
    }
    (SILVER / "quality_report.json").write_text(json.dumps(report, indent=2))
    print("   silver built:", json.dumps(report))
    spark.stop()
    return report


if __name__ == "__main__":
    run()
