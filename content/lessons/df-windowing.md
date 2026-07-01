# Windowing, watermarks & triggers — the complete guide

Beam's streaming power lives in its **event-time model**: windows bucket unbounded data by event time, watermarks track progress, and triggers decide when to emit — giving you explicit control over the **completeness vs latency** trade-off. These are the most expressive streaming controls in the field, and the same concepts appear in Flink and Spark. This chapter covers them in depth.

@@diagram:df-windowing

## 1. The problem

An unbounded stream never "ends," so you can't just aggregate it — you need to **group data over time** and decide **when a group's result is ready**, all while handling **out-of-order and late** events correctly. Beam's answer: **windows + watermarks + triggers + accumulation**.

## 2. Windowing

A **window** assigns each element (by its **event time**) to one or more time buckets; aggregations (`GroupByKey`/`Combine`) then run **per window**.

| Window | Shape | Use |
|---|---|---|
| **Fixed (tumbling)** | Non-overlapping fixed intervals | Per-minute/hour metrics |
| **Sliding** | Overlapping (size + period) | Moving averages |
| **Session** | Activity bursts separated by a gap (per key) | User sessions |
| **Global** | One window (with triggers) | Custom/whole-stream |

## 3. Event time vs processing time

Beam aggregates by **event time** (the timestamp in the data), not **processing time** (arrival). This makes results **correct and reproducible** despite delays, retries, and out-of-order delivery — the same reasoning as Spark/Flink.

## 4. Watermarks

A **watermark** is the runner's estimate of **event-time progress**: "we've probably seen all events up to time T." As data flows, the watermark advances. When it **passes a window's end**, the window's **on-time** result can fire and its **state can be released**. Watermarks are what let a never-ending stream produce **finalizable** window results with **bounded** state.

## 5. Triggers

**Triggers** decide **when** a window emits results:

- **On-time** (default) — fire when the **watermark** passes the window end.
- **Early (speculative)** — fire **before** the watermark (e.g. every N seconds/elements) for **low-latency** partial results.
- **Late** — fire **updates** when late data arrives **after** the watermark.

Combine with:
- **Allowed lateness** — how long after the watermark to keep accepting late data (then state is dropped).
- **Accumulation mode** — **accumulating** (each firing includes prior results → refining total) vs **discarding** (each firing only new data → deltas).

This gives **full, explicit control** over completeness vs latency.

## 6. The completeness/latency trade-off

- **Low latency** → **early** triggers emit partial results fast, refined by later firings.
- **Completeness** → wait for the watermark + **allowed lateness** to capture stragglers.
You choose per pipeline — a key advantage of Beam's model.

## 7. Gotchas

- **No window on unbounded aggregation** → can't aggregate an infinite stream; window it.
- **Processing-time aggregation** → wrong/non-reproducible results; use event time + watermarks.
- **Allowed lateness too small** → drop legitimate stragglers (undercount); too large → more state/latency.
- **Accumulation confusion** → accumulating vs discarding changes what each firing means downstream; pick deliberately.
- **Unbounded state** without watermarks/lateness → memory growth; watermarks + lateness bound it.
- **Late data beyond lateness** is dropped — track the dropped/late metrics.

## Scenario — low-latency and eventually-correct

A real-time metric counts events per **1-minute fixed window** by **event time**, with a **watermark** for progress and **10-minute allowed lateness**. Triggers: an **early** trigger emits a speculative count every 10 s (so the dashboard updates fast), the **on-time** firing emits the count when the watermark passes the window, and **late** firings emit **updates** if stragglers arrive within the 10 minutes — all in **accumulating** mode so each firing shows the full count so far (a refining number). An event stamped 10:00:30 arriving at 10:09 still updates the 10:00 window (within lateness); one arriving at 10:30 is **dropped** (past lateness), keeping state bounded. The pipeline thus delivers **low-latency partial results** that **converge to the correct total** — an explicit choice on the completeness/latency dial that Beam's windowing + watermark + trigger + accumulation model makes possible.

## Practice

1. Why do unbounded streams need windowing, and what window types exist?
2. Why aggregate by event time, and what does a watermark represent?
3. What do on-time, early, and late triggers each do?
4. How do allowed lateness and accumulation mode (accumulating vs discarding) work?
5. Explain the completeness vs latency trade-off and how Beam lets you control it.
6. Design windowing/triggers for a dashboard wanting low-latency partials and eventually-correct totals with 10-min-late events.
7. What goes wrong with processing-time aggregation or too-small allowed lateness?
