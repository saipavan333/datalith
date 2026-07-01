# Spark, NoSQL & the streaming revolution — deep dive

The second wave fixed the Hadoop era's two big limits: it was **slow** (disk-heavy) and **batch-only**.

@@diagram:bigdata-shifts

## Spark beat MapReduce (speed)

Born at Berkeley's AMPLab (2009; Apache top-level 2014), **Spark** keeps intermediate data **in memory** and builds a
**DAG** of work with **lazy evaluation**, so it avoids MapReduce's disk writes between every stage.

- **10-100× faster** than MapReduce, especially for **iterative** (ML) and **interactive** workloads.
- One engine for **batch, SQL, streaming, and ML**.
- Far easier API: **RDD → DataFrame / Spark SQL** instead of hand-written map/reduce.

```python
# word count — concise and in-memory (vs the MapReduce version)
(spark.read.text("s3://logs/")
      .selectExpr("explode(split(value, ' ')) as word")
      .groupBy("word").count()
      .orderBy("count", ascending=False)
      .show())
```

(The next modules of this track go deep on Spark's model, shuffle, and tuning.)

## NoSQL scaled flexible data

Amazon's **Dynamo** paper (2007) inspired **Cassandra** (2008); **MongoDB** (2009) popularized document stores. They
traded strict relational guarantees for:

- **horizontal scale** across many nodes,
- **flexible / schema-light** data (documents, wide-columns, key-value),
- **high write throughput** and availability (often the **AP** side of CAP).

Use them for web-scale, high-write, semi-structured data the relational model strained on — not as a blanket RDBMS
replacement. (See the NoSQL track for types and trade-offs.)

## Streaming ended batch-only

- **Kafka** (LinkedIn, open-sourced 2011) became the **durable, real-time event log / backbone** — the way systems move
  data continuously.
- Processing engines followed: **Spark Streaming**, **Storm**, **Samza**, and **Flink** (Apache 2014) — a true
  **event-at-a-time** engine with **event-time** semantics and managed **state**.
- **Architectures** combined paradigms: **Lambda** (~2011) ran parallel batch + speed layers; **Kappa** simplified to
  stream-only.

```
producers → Kafka (durable log) → Flink/Spark (event-time, state) → sinks (lake, OLAP, alerts)
```

## The net effect

Data engineering moved from "run a big batch job overnight" to "process data **continuously, fast, in many shapes**."
These are the tools you still use daily, and the foundation for the cloud/lakehouse era.

## Practice

1. Why is Spark faster than MapReduce?
2. What do NoSQL stores trade away, and what do they gain?
3. Kafka vs Flink — what does each do?
4. Lambda vs Kappa architecture — one line each.
