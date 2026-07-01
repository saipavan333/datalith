# 13 · Real-time analytics serving

Sub-second, user-facing analytics over a stream of events — using **DuckDB** as a laptop stand-in for a real-time OLAP
store (ClickHouse / Pinot / Druid).

```bash
pip install -r requirements.txt
python run.py
```

## What it does

1. **Ingest** 500k events into a columnar OLAP table.
2. **Serve** dashboard queries (last-15-min purchases, top-5 products, funnel) and **time each** to show millisecond
   latency on fresh data.
3. Simulate dashboard **refreshes** to show warm-cache speed.

Output: `out/events.duckdb`.

## The real thing (optional)

```yaml
# docker-compose.yml (sketch) — a real ClickHouse
services:
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    ports: ["8123:8123", "9000:9000"]
```

Then ingest from **Kafka** (ClickHouse Kafka engine, or Pinot/Druid real-time tables) and serve the same queries.
Pinot/Druid add star-tree indexing + pre-aggregation for single-digit-ms latency at high QPS; ClickHouse keeps ops
simple as a single binary.
