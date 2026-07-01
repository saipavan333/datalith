# DynamoDB & DMS — hands-on

Get operational data into the lake: DynamoDB's change feed, and DMS full-load + CDC.

@@diagram:aws-dynamodb-dms

## 1. DynamoDB — model around access patterns

```bash
# partition key + sort key; design for the queries, not for joins
aws dynamodb create-table --table-name Orders \
  --attribute-definitions AttributeName=customerId,AttributeType=S AttributeName=orderId,AttributeType=S \
  --key-schema AttributeName=customerId,KeyType=HASH AttributeName=orderId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES
```

`customerId` (partition) groups a customer's orders; `orderId` (sort) orders them. **GSIs** add alternate query keys. No joins — you shape keys to serve specific reads at single-digit-ms latency.

## 2. Stream the change feed to the lake

```python
# DynamoDB Streams -> Lambda -> S3 (INSERT/MODIFY/REMOVE)
import json, boto3
s3 = boto3.client("s3")
def handler(event, _ctx):
    for r in event["Records"]:
        img = r["dynamodb"].get("NewImage")          # NEW_AND_OLD_IMAGES
        s3.put_object(Bucket="acme-lake",
            Key=f"raw/orders_cdc/{r['eventID']}.json",
            Body=json.dumps({"op": r["eventName"], "data": img}))
```

Or skip code entirely: **Zero-ETL** replicates DynamoDB into **Redshift / SageMaker Lakehouse**.

## 3. DMS — lift a relational DB in, then keep it synced

```text
Replication instance (or DMS Serverless)
Source endpoint:  Aurora PostgreSQL  (orders DB, logical replication on)
Target endpoint:  S3  -> s3://acme-lake/raw/orders/  (Parquet)
Task:             migration-type = full-load-and-cdc
                  - full load: bulk-copy existing rows once
                  - cdc: tail the WAL/redo log, stream inserts/updates/deletes
```

```json
// S3 target extra settings (write Parquet, add op/ts columns)
{ "DataFormat": "parquet", "IncludeOpForFullLoad": true,
  "TimestampColumnName": "dms_ts", "CdcInsertsAndUpdates": true }
```

CDC reads the **transaction log**, so it's **low-impact** on the source — no repeated full-table queries.

## 4. Why two tools

- **DynamoDB source** → **Streams** (code) or **Zero-ETL** (no code).
- **Relational source** (RDS/Aurora/Oracle/SQL Server/on-prem) → **DMS** full-load+CDC, or **Zero-ETL** where supported.
- **Schema Conversion Tool (SCT)** helps when source and target engines differ (e.g., Oracle → PostgreSQL/Redshift).

## Scenario — orders from Aurora, low source impact

The orders DB is Aurora PostgreSQL and must be analytics-fresh without slowing the app. Use **DMS** `full-load-and-cdc`: a one-time **full load** copies history to **S3 Parquet**; then **CDC** tails the **WAL** to stream every change, writing op-tagged Parquet to `raw/orders/`. A **Glue** job folds the CDC into a current-state **curated** table (latest row per `order_id`). The app's database is barely touched (log reading, not querying). If Redshift is the target and the pair is supported, **Aurora→Redshift Zero-ETL** does the same with no DMS to run.

## Practice

1. Create a DynamoDB table with a partition+sort key and Streams enabled; explain the key choice.
2. Write a Lambda that lands the DynamoDB change feed in S3.
3. Configure a DMS task (source/target/type) to bring Aurora orders into S3 as Parquet with full-load+CDC.
4. Explain why CDC via the transaction log is gentler on the source than periodic full extracts.
