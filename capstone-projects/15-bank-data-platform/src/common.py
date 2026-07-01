"""Shared helpers: paths + a Spark session that works locally and on Databricks."""
from __future__ import annotations
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
LANDING = OUT / "gcs_landing"      # stands in for a GCS bucket (gs://bank-landing/)
LAKE = OUT / "lake"                # bronze/silver "lakehouse" (Delta on Databricks; Parquet locally)
STREAM_IN = OUT / "stream_in"      # streaming source dir (Kafka topic on Databricks)
WAREHOUSE = OUT / "warehouse.duckdb"  # Greenplum stand-in (DuckDB locally)

for d in (OUT, LANDING, LAKE, STREAM_IN):
    d.mkdir(parents=True, exist_ok=True)


def spark_session(app="bank-platform"):
    """Return a local SparkSession. Sets the env Spark needs in sandboxed/CI hosts."""
    os.environ.setdefault("SPARK_LOCAL_IP", "127.0.0.1")
    for jh in ("/usr/lib/jvm/java-11-openjdk-amd64", "/usr/lib/jvm/default-java"):
        if not os.environ.get("JAVA_HOME") and Path(jh).exists():
            os.environ["JAVA_HOME"] = jh
    from pyspark.sql import SparkSession
    spark = (SparkSession.builder.master(os.environ.get("SPARK_MASTER", "local[*]"))
             .appName(app)
             .config("spark.ui.enabled", "false")
             .config("spark.driver.host", "127.0.0.1")       # avoid hostname-resolution failures
             .config("spark.driver.bindAddress", "127.0.0.1")
             .config("spark.sql.shuffle.partitions", "8")
             .config("spark.sql.session.timeZone", "UTC")
             .getOrCreate())
    spark.sparkContext.setLogLevel("ERROR")
    return spark
