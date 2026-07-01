# The Dataflow runner: serverless autoscaling — the complete guide

Beam gives you the portable model; **Dataflow** is what makes it practical at scale — a **fully-managed, serverless runner** that autoscales workers, fuses stages, rebalances stragglers, and offloads shuffle and streaming state to managed backends. You submit a pipeline; it runs. This chapter covers what the service does and how to operate it.

@@diagram:df-runner

## 1. Serverless execution

**Dataflow** is GCP's **serverless** Beam runner. You submit a pipeline and Dataflow **provisions, scales, and manages** the workers — **no clusters** to size, patch, or tune. This is the key difference from cluster engines (Dataproc/Spark).

## 2. What the service does

- **Autoscaling** — adds/removes workers based on the workload: **streaming** scales on **backlog/throughput**; **batch** scales on **work remaining**. No manual sizing.
- **Fusion** — the optimizer **merges adjacent transforms** into single execution stages so intermediate data isn't materialized — less overhead and IO. (Occasionally you insert a `Reshuffle` to break fusion for parallelism.)
- **Dynamic work rebalancing** — detects **straggler** (slow) workers/shards and **redistributes** work to idle workers, so a few hot shards don't bottleneck the job — a major advantage over static partitioning.
- **Managed shuffle / Streaming Engine** — **Dataflow Shuffle** (batch) and **Streaming Engine** (streaming) move the **shuffle** and **state/timers** off the workers into a **managed backend**, so workers are lighter, scaling is faster/cheaper, and state is durable.
- **Dataflow Prime** — automatic **vertical + horizontal** autoscaling and resource optimization.

## 3. Fault tolerance & exactly-once

Dataflow checkpoints progress and provides **exactly-once** processing **within the pipeline**. For **end-to-end** exactly-once, pair it with **idempotent/transactional sinks** (e.g. BigQuery **Storage Write API**, which supports exactly-once). Failed work is retried; the managed state survives worker loss.

## 4. Operating it

- **Monitoring (Dataflow UI):** the **job graph** (per-stage throughput), **autoscaling** (worker count vs backlog), and — for streaming — **data freshness / system lag** (how far behind event time the pipeline is, the key health metric), plus error logs.
- **Cost:** billed by **worker resources** (vCPU/memory/storage) + **shuffle / Streaming Engine** usage. Levers: **autoscaling** + **Prime** (right-size), **FlexRS** (flexible/spot-like scheduling for **non-urgent batch** — much cheaper), appropriate **machine types**, and an **efficient pipeline** (Combine, filter early).
- **Tuning:** number of workers (max), machine type, Streaming Engine on/off, and pipeline-level efficiency (transforms lesson).

## 5. vs cluster-based engines (Dataproc/Spark)

- **Dataflow** — serverless: no cluster lifecycle; autoscaling, fusion, straggler rebalancing, managed shuffle/state handled for you; great for **streaming**.
- **Dataproc/Spark** — you manage a **cluster** (more control, existing Spark code, specific OSS), but operate scaling/clusters yourself.
Trade-off: Dataflow = less ops + the Beam model; Dataproc = Spark ecosystem + more control.

## 6. Gotchas

- **Hot keys / skew** → stragglers; rebalancing helps, but mitigate skew (pre-aggregate with Combine, add a sharding key).
- **Sink bottlenecks** → autoscaling can't fix a slow sink (e.g. BigQuery quota); check sink throughput.
- **Broken fusion / unnecessary reshuffles** → overhead or lost parallelism; understand fusion.
- **Over-provisioned workers** → cost; rely on autoscaling/Prime.
- **Using on-demand resources for non-urgent batch** → use **FlexRS** to save.
- **Ignoring data freshness** → the streaming health metric; alert on rising lag.

## Scenario — a spike, a straggler, and a cost win

A streaming pipeline's input **spikes 10×**. **Dataflow autoscaling** adds workers to burn down the **backlog**, then scales back when it subsides — no manual action. One key range is **hot**, creating a **straggler**; **dynamic work rebalancing** redistributes its work so the job isn't bottlenecked. The **shuffle and streaming state** live in the **Streaming Engine** (managed), so workers stay light and scaling is fast, with **exactly-once** preserved (and a Storage Write API sink for end-to-end correctness). The team watches **data freshness / system lag** in the Dataflow UI to confirm it's keeping up. Separately, a large **non-urgent nightly batch** runs with **FlexRS** (spot-like scheduling) to cut cost. They **never sized a cluster** — they submitted a Beam pipeline and the **serverless runner** handled volume (autoscaling), stragglers (rebalancing), and state (Streaming Engine), while they tuned cost (FlexRS) and watched a couple of metrics. That's the Dataflow value: focus on the pipeline, not infrastructure.

## Practice

1. What does it mean that Dataflow is a serverless runner, and how does that differ from Dataproc?
2. What does autoscaling key on for streaming vs batch?
3. Explain fusion and dynamic work rebalancing and why each helps.
4. What do Dataflow Shuffle / Streaming Engine offload, and why does that matter?
5. How is exactly-once achieved end to end?
6. What would you monitor (esp. for streaming), and what are the cost levers?
7. A streaming job has spiky input and a hot key causing lag — how does the service handle it and what do you check?
