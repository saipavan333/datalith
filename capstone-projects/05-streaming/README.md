# 05 · A real-time streaming pipeline

The core streaming concepts — **event-time, tumbling windows, watermarks, exactly-once, replay** — in an in-process
simulation you can run with zero infrastructure.

```bash
python run.py          # standard library only
```

## What it does

- A producer emits events with **event-time** (some arriving **late / out of order**, some **duplicated**).
- The consumer keeps **tumbling windows** and advances a **watermark** to close windows once their lateness budget
  passes.
- **Exactly-once**: duplicates are dropped via idempotent dedup on `event_id`.
- **Replay**: the seeded log re-processes deterministically to the same windows.

Output: `out/windows.json`.

## The real thing (optional)

In production this is **Kafka** + a stream processor (**Flink** or **Spark Structured Streaming**):

```yaml
# docker-compose.yml (sketch) — a local Kafka
services:
  kafka:
    image: bitnami/kafka:latest
    ports: ["9092:9092"]
    environment:
      KAFKA_CFG_NODE_ID: "0"
      KAFKA_CFG_PROCESS_ROLES: "controller,broker"
      KAFKA_CFG_LISTENERS: "PLAINTEXT://:9092,CONTROLLER://:9093"
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: "0@kafka:9093"
```

Then `pip install kafka-python`, produce to a topic, and consume with the same window/watermark logic — or use
Flink/Spark which provide event-time windows, watermarks, and exactly-once natively.
