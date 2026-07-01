# The Beam model: unified batch + streaming — the complete guide

Cloud Dataflow runs **Apache Beam**, whose defining idea is a **unified, portable model** for batch and streaming: write the pipeline once and run the same code over bounded (batch) or unbounded (streaming) data, on any runner. Master PCollections, PTransforms, and runners and the rest of Dataflow follows. This chapter is that foundation.

@@diagram:df-beam-model

## 1. What Beam/Dataflow is

**Apache Beam** is a programming model and SDK for data processing; **Cloud Dataflow** is GCP's **serverless runner** that executes Beam pipelines. Beam's goal: **one model** for **batch and streaming**, **portable** across execution engines.

## 2. Core abstractions

- **Pipeline** — the entire job, a **DAG** of data and transforms.
- **PCollection** — a distributed dataset flowing through the pipeline. It is **bounded** (finite → **batch**) or **unbounded** (infinite → **streaming**). The **same transforms** apply to both.
- **PTransform** — an operation on PCollection(s) → PCollection(s): `ParDo` (map), `GroupByKey`, `Combine`, `Window`, and IO connectors.
- **Runner** — the engine that executes the pipeline: **Dataflow**, **Flink**, **Spark**, **Direct** (local). Beam code is **portable** across runners.

```python
with beam.Pipeline() as p:
  (p | beam.io.ReadFromPubSub(topic=...)         # source → PCollection
     | beam.Map(parse)                           # PTransform (ParDo)
     | beam.WindowInto(window.FixedWindows(60))
     | beam.CombinePerKey(sum)
     | beam.io.WriteToBigQuery(table=...))        # sink
```

## 3. Unified batch + streaming

The **same pipeline** can read a **bounded** source (GCS file → **batch**) or an **unbounded** source (Pub/Sub → **streaming**). In Beam, **batch is a special case of streaming** over finite data, so streaming concerns — **windowing, watermarks, triggers** (next lesson) — are part of the one model. You **don't switch frameworks** to go from batch to streaming, and you can **reuse logic** for live processing and backfills.

## 4. Portability across runners

Because the model is **runner-agnostic**, a Beam pipeline runs on **Dataflow** (GCP serverless) today and **Flink/Spark** (on-prem/other cloud) tomorrow **without rewriting** logic. Develop/test locally with the **Direct** runner, deploy to **Dataflow** in production. This avoids **engine lock-in**.

## 5. SDKs & extensibility

- **SDKs:** Java (most mature), **Python**, Go, plus **Beam SQL** and **YAML**.
- **Cross-language** transforms let a Python pipeline use a Java IO, etc.
- **IO connectors** for Pub/Sub, BigQuery, GCS, Kafka, JDBC, and more.

## 6. When Beam/Dataflow fits

- **Streaming** with event-time semantics.
- **Complex** transformations beyond SQL (enrichment, stateful processing).
- Want **serverless autoscaling** + **portable** code + **batch/streaming reuse**.
(When SQL suffices on BigQuery data, SQL ELT is simpler — see the choosing lesson.)

## 7. Gotchas

- **Thinking batch and streaming need separate code** — Beam unifies them; reuse the pipeline.
- **Forgetting windowing for unbounded data** — streaming aggregations need windows/triggers (next lesson).
- **Runner-specific assumptions** — keep logic portable; some IOs/features vary by runner.
- **Over-reaching** — for SQL-expressible work on BigQuery, prefer SQL ELT; Beam for what SQL can't do.
- **Heavy logic in the wrong place** — design transforms (ParDo/Combine) efficiently (transforms lesson).
- **Local vs Dataflow differences** — Direct runner is for testing; validate at scale on Dataflow.

## Scenario — one pipeline, live and backfill

A team writes one Beam pipeline: `ReadFromPubSub → parse → WindowInto(1-min fixed) → CombinePerKey(sum) → WriteToBigQuery`. Against the **Pub/Sub** source it's a **streaming** Dataflow job (unbounded). To **backfill** from history, they point the **same pipeline** at **GCS files** (bounded) and it runs as a **batch** job — **no rewrite**, because Beam unifies batch and streaming and the transforms are identical. It runs on **Dataflow** (serverless, autoscaling) on GCP, but the **same code** could run on **Flink** elsewhere (portability). They avoided maintaining **two implementations** (a Spark batch job + a separate streaming job) that would drift; the **shared logic** keeps live processing and backfills consistent. PCollections flow through PTransforms; the Dataflow runner executes the DAG. This 'write once, run batch or streaming, portable across runners' model is why Beam/Dataflow anchors complex/streaming processing on GCP.

## Practice

1. What is the key idea of the Beam model, and what problem does it solve?
2. Define pipeline, PCollection (bounded vs unbounded), PTransform, and runner.
3. How does Beam unify batch and streaming, and why does that matter?
4. What does runner portability give you, and how does Dataflow fit?
5. What SDKs and extensibility does Beam offer?
6. Reuse one pipeline for real-time processing and a historical backfill — explain how.
7. When should you reach for Beam/Dataflow vs SQL ELT?
