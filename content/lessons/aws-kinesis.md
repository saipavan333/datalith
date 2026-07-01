# Amazon Kinesis — hands-on streaming

Shards, producers, consumers, and the no-code Firehose path — with real commands.

@@diagram:aws-kinesis

## 1. Create a stream and produce to it

```bash
aws kinesis create-stream --stream-name clickstream --shard-count 4
# or on-demand (auto-scales shards):
aws kinesis create-stream --stream-name clickstream --stream-mode-details StreamMode=ON_DEMAND

aws kinesis put-record --stream-name clickstream \
  --partition-key user-42 --data '{"user":42,"page":"/home","ts":"2025-03-01T10:00:00Z"}'
```

**Partition key** decides the shard → all records for `user-42` are **ordered** on one shard. Each shard ≈ **1 MB/s in, 2 MB/s out, 1000 rec/s**.

## 2. Consume with Lambda (serverless)

```python
import base64, json
def handler(event, _ctx):
    for r in event["Records"]:
        data = json.loads(base64.b64decode(r["kinesis"]["data"]))
        # idempotent processing — you may see a record more than once
        upsert(data)
    return {"batchItemFailures": []}   # report partial failures for retry
```

Wire it: `aws lambda create-event-source-mapping --function-name clicks --event-source-arn <stream-arn> --starting-position LATEST --batch-size 200`. For heavy stateful work (windows, joins), use **Managed Service for Apache Flink** instead; **enhanced fan-out** gives each consumer its own 2 MB/s.

## 3. Firehose — land the stream in the lake, no code

```json
// Firehose delivery: stream -> (transform Lambda) -> Parquet in S3
{
  "DeliveryStreamName": "clicks-to-s3",
  "ExtendedS3DestinationConfiguration": {
    "BucketARN": "arn:aws:s3:::acme-lake",
    "Prefix": "raw/clicks/dt=!{timestamp:yyyy-MM-dd}/",
    "BufferingHints": { "SizeInMBs": 128, "IntervalInSeconds": 60 },
    "DataFormatConversionConfiguration": { "Enabled": true },   // -> Parquet
    "ProcessingConfiguration": { "Enabled": true }              // optional Lambda transform
  }
}
```

Firehose **buffers** (128 MB or 60 s) then writes — automatically partitioning by date and converting to **Parquet**. This is the standard hands-off ingest into S3.

## 4. Scaling & retention

- **Provisioned**: add shards (reshard) to scale; monitor `WriteProvisionedThroughputExceeded`.
- **On-demand**: AWS scales shards automatically — simplest.
- **Retention**: 24 h default, up to **365 days** — longer retention = more replay/reprocessing room.

## 5. Kinesis vs MSK

| Kinesis | Amazon MSK (Kafka) |
|---|---|
| fully managed, simplest | managed **Apache Kafka** |
| Firehose, Lambda, IAM native | Kafka API + ecosystem (Connect, Streams) |
| shards, enhanced fan-out | partitions, consumer groups |
| pick for AWS-native simplicity | pick for Kafka compatibility/portability |

## Scenario — events to lake *and* a live model

50k events/sec must (a) land as Parquet for analytics and (b) feed a real-time fraud model. Put them in **Data Streams** (on-demand). Consumer 1: **Firehose** (enhanced fan-out) buffers and writes **Parquet** to `raw/clicks/` — zero code. Consumer 2: **Managed Service for Apache Flink** reads the same stream, keeps a 5-minute **window** per user, and scores fraud with low latency. The stream's **ordering + replay + multiple consumers** means both paths get every event, and you can rewind to reprocess if the model changes.

## Practice

1. Create an on-demand stream and `put-record` two events for the same user; explain why they stay ordered.
2. Write a Lambda consumer that processes batches idempotently and reports partial failures.
3. Configure a Firehose that writes date-partitioned Parquet to S3 with a 60 s/128 MB buffer.
4. Give two reasons to choose MSK over Kinesis.
