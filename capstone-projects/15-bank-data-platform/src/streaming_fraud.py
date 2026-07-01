"""
Real-time fraud/AML scoring  (Stage 3) — PySpark Structured Streaming.

Reads the card-transaction stream (a Kafka topic in production; a file source locally),
applies fraud rules + a score, and writes alerts. Uses trigger(availableNow=True) so it
drains the current stream and stops — the SAME streaming code runs continuously on
Databricks against Kafka.

Output: out/lake/silver/fraud_alerts.parquet
"""
from __future__ import annotations
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType
from common import spark_session, STREAM_IN, LAKE

SILVER = LAKE / "silver"
CHK = LAKE / "_chk_fraud"
HIGH_RISK = ["RU", "NG", "KP"]

SCHEMA = StructType([
    StructField("txn_id", StringType()), StructField("account_id", StringType()),
    StructField("amount", DoubleType()), StructField("country", StringType()),
    StructField("channel", StringType()), StructField("event_ts", StringType()),
])


def run():
    SILVER.mkdir(parents=True, exist_ok=True)
    spark = spark_session("fraud-stream")

    stream = (spark.readStream.schema(SCHEMA).json(str(STREAM_IN)))  # Kafka source in prod

    scored = (stream
        .withColumn("rule_high_amount", (F.col("amount") > 2000).cast("int"))
        .withColumn("rule_high_risk_geo", F.col("country").isin(HIGH_RISK).cast("int"))
        .withColumn("fraud_score", F.col("rule_high_amount") * 0.6 + F.col("rule_high_risk_geo") * 0.5)
        .withColumn("is_alert", F.col("fraud_score") >= 0.5))

    q = (scored.writeStream
        .format("parquet")
        .option("path", str(SILVER / "fraud_alerts.parquet"))
        .option("checkpointLocation", str(CHK))
        .outputMode("append")
        .trigger(availableNow=True)     # drain current data then stop (continuous in prod)
        .start())
    q.awaitTermination()

    df = spark.read.parquet(str(SILVER / "fraud_alerts.parquet"))
    alerts = df.where("is_alert").count()
    total = df.count()
    print(f"   streaming fraud: scored {total} card txns, {alerts} alerts raised")
    spark.stop()
    return {"scored": total, "alerts": alerts}


if __name__ == "__main__":
    run()
