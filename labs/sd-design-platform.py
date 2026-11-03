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
