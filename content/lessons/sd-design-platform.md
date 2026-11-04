# Designing a whole data platform at real scale

The senior data engineering design question is rarely "design a pipeline". It's "we're a 30-million-user marketplace; design our data platform". Interviewers want to see you scope the problem, size it with arithmetic, pick components for stated reasons, and name what will break first. This lesson is that answer, end to end, with numbers you can recompute.

## The picture to keep in your head

A data platform is a **city water system**. Sources are rivers and wells (app databases, event streams, SaaS APIs). Kafka is the **reservoir** that absorbs floods so the treatment plant doesn't. Bronze, silver and gold are **raw, filtered and drinking water**. The catalog, contracts and quality checks are the **inspectors and pipe maps**. Nobody designs the pipes before measuring how much water flows at the evening peak.

@@diagram:platform-at-scale

## 1. Scope first (2-3 minutes in an interview)

Ask, then write the answers down:

- **Consumers and freshness**: 2,000 analysts on dashboards (hourly is fine), fraud models (seconds), finance close (daily, must reconcile to the penny).
- **Sources**: 40 Postgres shards (orders, payments), web and app clickstream, ~15 SaaS tools.
- **Scale**: 30M monthly users, ~200 events each per day → 6 billion events/day.
- **Constraints**: PII (GDPR/DPDP-style deletion requests), 7-year finance retention, one cloud, a team of 8 data engineers.

## 2. Size it (the lab does this arithmetic)

- Clickstream: 6B x 140 B ≈ **0.84 TB/day**. CDC: 400M changes x 600 B ≈ **0.24 TB/day**. About **1.1 TB/day raw**.
- Average 12.5 MB/s, **peak ~50 MB/s** (4x), about 300k events/s.
- Kafka: producer batches compress less than columnar Parquet; assume 3x (lz4/zstd). 7 days, RF 3 → **~7.6 TB**, plan ~10 TB with headroom. Throughput alone needs ~10 partitions; provision 48 so consumers can scale and there's room for 3x growth.
- Bronze Parquet: ~0.27 TB/day, **~24 TB for 90 days**. At 512 MB files that's ~530 files/day, but naive 1-minute streaming commits from 48 writer tasks (one per Kafka partition being landed) make ~69,000. **Compaction is a requirement, not a tuning step.**

This is not huge data. Saying so is a senior signal: the hard parts here are correctness (CDC merges, late events, deletes), governance and cost, not raw throughput.

## 3. The design, layer by layer

**Ingestion.**
- CDC from the 40 shards with Debezium on Kafka Connect, one connector per shard, topics keyed by primary key, Avro + schema registry (BACKWARD_TRANSITIVE).
- Clickstream through a collector service into Kafka, keyed by `session_id` (order within a session; spreads load).
- SaaS sources through a managed EL tool hourly. Buying this is cheaper than 8 engineers maintaining 15 API connectors.

**Storage: lakehouse on object storage, one catalog.**
- Iceberg (or Delta, if the platform is Databricks-centric) tables registered in **one** catalog that every engine uses.
- **Bronze**: append-only, raw events and CDC envelopes, partitioned by ingest date, 90 days (finance-relevant sources kept longer).
- **Silver**: deduplicated, typed, CDC merged to current state with an LSN guard; clickstream sessionized.
- **Gold**: Kimball-style facts and dimensions, metrics defined once in a semantic layer.

**Processing.**
- One streaming job lands Kafka → bronze every minute and compacts hourly.
- Silver merges every 10-15 minutes (meets "hourly dashboards" with margin).
- dbt for silver → gold, incremental models (microbatch for event facts), tests and contracts on tier-1 models.
- Orchestration with asset awareness, so a re-landed source partition rebuilds exactly its downstream partitions.

**Serving.**
- Warehouse or lakehouse SQL engine for BI.
- Feature pipelines for ML (offline tables in the lake, online store for the fraud model's millisecond lookups).
- Reverse ETL for CRM and ads audiences.

**Cross-cutting.**
- Catalog + lineage (OpenLineage-compatible where possible), data contracts for the 25 tier-1 datasets, freshness/volume/schema monitors, PII tagging with column masking, cost tags per team, SLOs and on-call.

## 4. Where it breaks first, and the fix

| Pressure | Symptom | Design answer |
|---|---|---|
| Hot key in clickstream (a bot, a default ID) | one Kafka partition and one Spark task lag | detect per-partition lag; filter or salt bot traffic at the collector |
| Postgres replication slot lag | primary disk alarm | slot-lag alerts, max_slot_wal_keep_size cap, runbook |
| Small files from streaming | queries slow down week by week | hourly compaction, snapshot expiry, file-count monitor |
| Schema change by a source team | silver merge fails | registry gate in producer CI, contract, quarantine table |
| Late events (mobile offline) | yesterday's numbers change | event-time partitioning, lookback window in microbatch, published "data final after T+2 days" rule |
| GDPR/DPDP deletion request | PII persists in bronze | keep PII in a keyed vault table, tokenize elsewhere, delete + rewrite affected files on a schedule |
| Cost creep | bill grows faster than data | per-team tags, query cost dashboards, storage tiering after 90 days |

## 5. How to present it in 35 minutes

1. Scope and numbers (5 min). 2. Draw the diagram above (5 min). 3. Walk one record end to end: an order update from Postgres to the finance dashboard, naming every hop's guarantee (10 min). 4. Failure table (10 min). 5. What you'd build first with 8 engineers: CDC + bronze + silver for orders and payments, then the finance mart, then clickstream (5 min).

## 6. Hands-on lab: the capacity math

Plain Python. Every value is an input you'd state in the interview or arithmetic on those inputs; the two `ASSUME` values are starting points to replace with your own load-test results. Run `python labs/sd-design-platform.py`, then change the inputs (double the users, add 12 more shards) and watch which layer moves.

```python
"""Lab: back-of-envelope capacity plan for a data platform. Change the inputs, rerun, defend the numbers.
Plain Python. Every number below is either an input you state out loud in the interview, or arithmetic.
Assumptions marked ASSUME are typical starting points to replace with your own load-test results.
"""
DAY = 86_400
inputs = {
    "clickstream_events_per_day": 6_000_000_000,   # 30M users x ~200 events
    "clickstream_event_bytes": 140,                 # compact JSON/Avro after the SDK batches
    "peak_to_average": 4,                           # evening peak vs daily average
    "cdc_changes_per_day": 400_000_000,             # 40 Postgres shards
    "cdc_event_bytes": 600,                         # Avro with before/after images
    "parquet_compression_ratio": 4,                 # ASSUME zstd Parquet vs raw JSON-ish bytes
    "kafka_compression_ratio": 3,                   # ASSUME lz4/zstd on producer batches (less than columnar)
    "streaming_writer_tasks": 48,                   # one writer task per Kafka partition being landed (we provision 48)
    "kafka_retention_days": 7,
    "replication_factor": 3,
    "mb_per_s_per_partition": 5,                    # ASSUME a conservative per-partition design target
    "bronze_retention_days": 90,
    "target_file_mb": 512,
}
i = inputs
click_bytes = i["clickstream_events_per_day"] * i["clickstream_event_bytes"]
cdc_bytes = i["cdc_changes_per_day"] * i["cdc_event_bytes"]
raw_day = click_bytes + cdc_bytes
avg_mb_s = raw_day / DAY / 1e6
peak_mb_s = avg_mb_s * i["peak_to_average"]
peak_events = (i["clickstream_events_per_day"] + i["cdc_changes_per_day"]) / DAY * i["peak_to_average"]

print("INGEST")
print(f"  raw volume/day        : {raw_day/1e12:6.2f} TB  (clickstream {click_bytes/1e12:.2f} + CDC {cdc_bytes/1e12:.2f})")
print(f"  average / peak rate   : {avg_mb_s:6.1f} MB/s / {peak_mb_s:.0f} MB/s  (~{peak_events/1e3:,.0f}k events/s at peak)")

kafka_tb = raw_day / i["kafka_compression_ratio"] * i["kafka_retention_days"] * i["replication_factor"] / 1e12
partitions = -(-peak_mb_s // i["mb_per_s_per_partition"])
print("KAFKA")
print(f"  disk (compressed x {i['kafka_retention_days']}d x RF{i['replication_factor']}) : {kafka_tb:6.1f} TB  (+30% headroom -> {kafka_tb*1.3:.0f} TB)")
print(f"  partitions for peak   : >= {partitions:.0f} total at {i['mb_per_s_per_partition']} MB/s each; we provision {i['streaming_writer_tasks']} for consumer parallelism + 3x growth")

bronze_day_tb = raw_day / i["parquet_compression_ratio"] / 1e12
files_day = bronze_day_tb * 1e6 / i["target_file_mb"]
print("LAKEHOUSE (bronze)")
print(f"  Parquet/day           : {bronze_day_tb:6.2f} TB -> {bronze_day_tb*i['bronze_retention_days']:.0f} TB over {i['bronze_retention_days']} days")
print(f"  files/day at {i['target_file_mb']} MB    : {files_day:,.0f}")
streaming_commits = DAY // 60
naive_files = streaming_commits * i["streaming_writer_tasks"]   # each 1-minute commit writes one file per task
print(f"  1-min commits x {i['streaming_writer_tasks']} writer tasks (one per provisioned Kafka partition) -> {naive_files:,} files/day before compaction"
      f" ({naive_files/files_day:.0f}x too many) -> schedule hourly compaction")

print("SANITY CHECKS TO SAY OUT LOUD")
print(f"  peak {peak_mb_s:.0f} MB/s is {peak_mb_s*8/1000:.1f} Gbit/s into the cluster before replication;"
      f" with RF3 brokers write {peak_mb_s*3:.0f} MB/s to disk")
print(f"  one day of bronze ({bronze_day_tb:.2f} TB) is what a full-day backfill must re-read")
```

Output (real run, 2026-11-03):

```text
INGEST
  raw volume/day        :   1.08 TB  (clickstream 0.84 + CDC 0.24)
  average / peak rate   :   12.5 MB/s / 50 MB/s  (~296k events/s at peak)
KAFKA
  disk (compressed x 7d x RF3) :    7.6 TB  (+30% headroom -> 10 TB)
  partitions for peak   : >= 10 total at 5 MB/s each; we provision 48 for consumer parallelism + 3x growth
LAKEHOUSE (bronze)
  Parquet/day           :   0.27 TB -> 24 TB over 90 days
  files/day at 512 MB    : 527
  1-min commits x 48 writer tasks (one per provisioned Kafka partition) -> 69,120 files/day before compaction (131x too many) -> schedule hourly compaction
SANITY CHECKS TO SAY OUT LOUD
  peak 50 MB/s is 0.4 Gbit/s into the cluster before replication; with RF3 brokers write 150 MB/s to disk
  one day of bronze (0.27 TB) is what a full-day backfill must re-read
```

What to look for:

- **1.1 TB/day and 50 MB/s at peak** is moderate scale. Spend design time on correctness.
- **69,120 files/day vs ~530 needed**: the small-file problem shows up in the arithmetic before it shows up in production.
- The **partition count from throughput alone (10)** is far below what consumer parallelism and growth need. Size partitions for consumers and 3x growth, not just bytes.

## 7. Interview angles

- *"Why Kafka in the middle and not CDC straight into the lake?"* Buffering for source spikes and sink outages, replay, and fan-out to the fraud model and other consumers from the same stream.
- *"Why a lakehouse and not only a warehouse?"* Open formats for many engines (Spark, the warehouse, ML), cheaper storage for raw history; the warehouse can still serve gold if the team prefers it.
- *"What would you cut with half the team?"* The streaming silver path: run silver hourly in batch until a consumer truly needs minutes.

## Sources

- Debezium connectors (CDC from Postgres/MySQL): https://debezium.io/documentation/reference/stable/connectors/postgresql.html
- Kafka 4.4 configuration reference: https://kafka.apache.org/44/configuration/broker-configs/
- Apache Iceberg spec (table maintenance concepts): https://iceberg.apache.org/spec/
- dbt microbatch incremental models: https://docs.getdbt.com/docs/build/incremental-microbatch
- OpenLineage: https://openlineage.io/
- PostgreSQL replication settings (max_slot_wal_keep_size): https://www.postgresql.org/docs/current/runtime-config-replication.html
