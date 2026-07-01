# AWS Glue — hands-on catalog & ETL

The shared metastore and serverless Spark, with real jobs you can adapt.

@@diagram:aws-glue

## 1. The Data Catalog — define once, read everywhere

A database + table in the Glue Catalog points engines at S3 data and its schema:

```sql
-- (Athena DDL writes to the Glue Catalog)
CREATE DATABASE IF NOT EXISTS curated;

CREATE EXTERNAL TABLE curated.events (
  event_id string, user_id string, amount double
)
PARTITIONED BY (dt string)
STORED AS PARQUET
LOCATION 's3://acme-lake/curated/events/';
```

Now **Athena, Redshift Spectrum, EMR, and Glue Spark** all see `curated.events`. One schema, many engines.

## 2. Crawlers — infer schema & partitions automatically

```bash
aws glue create-crawler --name events-curated \
  --role AWSGlueServiceRole-acme \
  --database-name curated \
  --targets '{"S3Targets":[{"Path":"s3://acme-lake/curated/events/"}]}'
aws glue start-crawler --name events-curated
```

The crawler detects columns, types, and the `dt=` partitions and registers/refreshes the table. (For huge, predictable partitions, prefer **partition projection** in Athena over crawling millions of partitions.)

## 3. A real Glue Spark job — raw → curated, incremental

```python
import sys
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext

args = getResolvedOptions(sys.argv, ["JOB_NAME"])
gc = GlueContext(SparkContext.getOrCreate())
job = Job(gc); job.init(args["JOB_NAME"], args)

# read via catalog; transformation_ctx + job bookmark => only NEW files each run
dyf = gc.create_dynamic_frame.from_catalog(
        database="raw", table_name="events", transformation_ctx="src")

df = (dyf.toDF()                       # drop to a normal Spark DataFrame
        .dropDuplicates(["event_id"])
        .filter("user_id is not null"))

(df.write.mode("append").partitionBy("dt")
   .parquet("s3://acme-lake/curated/events/"))

job.commit()                           # persists the bookmark
```

Enable **Job bookmarks** on the job so each run processes only files it hasn't seen.

## 4. DynamicFrame vs DataFrame

- **DynamicFrame** (Glue): schema-flexible for **messy/evolving** data; transforms like `ResolveChoice` (reconcile mixed types), `Relationalize` (flatten nested JSON), `ApplyMapping`.
- **DataFrame** (Spark): use `.toDF()` once data is clean and you want standard Spark SQL/joins. Convert back with `DynamicFrame.fromDF()` to write via Glue sinks.

## 5. Data Quality (DQDL) — make quality a gate

```text
Rules = [
  IsComplete "order_id",
  IsUnique   "order_id",
  ColumnValues "amount" >= 0,
  Completeness "customer_id" > 0.99
]
```

Attach the ruleset to a table or a job step; on failure, **fail the job** for critical rules (null/duplicate PK) or **route bad rows to a quarantine prefix** for soft rules.

## 6. Orchestration & Glue Studio

- **Glue Studio**: build jobs visually (source → transform → target), generates the PySpark.
- **Triggers / Workflows**: chain crawler → job → job with dependencies and schedules (or orchestrate from **Step Functions / MWAA**).
- **Zero-ETL**: ingest from Aurora/RDS/DynamoDB/SaaS into the lakehouse without writing a job at all.

## Scenario — hourly ingestion, no full re-scan

Raw JSON lands hourly in `s3://lake/raw/events/`. A **cataloged** raw table + a **Glue job with bookmarks** reads only the new hour, dedupes on `event_id`, drops null users, and appends **Parquet** partitioned by `dt` to `curated/`. A **Workflow** runs the job then a **crawler** to register the new partition. A **DQ ruleset** (`IsComplete`/`IsUnique` on `event_id`) fails the run if a bad batch arrives, so curated stays trustworthy. One serverless pipeline, incremental and governed.

## Practice

1. Write the Athena DDL to register a partitioned Parquet `orders` table in the Glue Catalog.
2. Adapt the Glue job to read `raw.orders`, keep only `status='COMPLETED'`, and write curated Parquet partitioned by `dt` — incrementally.
3. Give two DQDL rules for `orders` and the on-violation action for each.
4. Explain when you'd keep data as a DynamicFrame vs convert to a DataFrame.
