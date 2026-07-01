# Event time, windows & watermarks — the complete guide

Real-world events arrive **late and out of order** — a phone buffers, a network lags, a retry replays. Correct streaming aggregation must group by **when an event happened** (event time), not when it arrived, and decide **how long to wait** for stragglers. Windows + watermarks are how. This is the concept interviewers probe and the one that, done wrong, silently corrupts metrics.

@@diagram:dbx-ss-watermark

## 1. Event time vs processing time

- **Event time** — the timestamp **in the data** (when the event occurred).
- **Processing time** — when the engine **received** it.

Aggregate by **event time**, or your results depend on arrival timing: a backlog, retry, or replay would lump old events into the current window, and late events land in the wrong bucket. Event-time aggregation is **deterministic and correct**; reprocessing the same data gives the same windows.

## 2. Windows

```python
from pyspark.sql.functions import window, col
events.groupBy(window(col('event_ts'), '5 minutes'), col('country')).count()
```

- **Tumbling** — fixed, non-overlapping: `window(ts, '5 minutes')`.
- **Sliding** — overlapping: `window(ts, '10 minutes', '5 minutes')` (10-min windows every 5 min).
- **Session** — activity windows separated by a gap of inactivity.

Each event falls into the window(s) covering its **event time**.

## 3. Watermarks

A **watermark** is the engine's moving estimate of "we've probably seen everything up to here":

```
watermark = (max event time seen so far) − (allowed lateness)
```

```python
events.withWatermark('event_ts', '10 minutes')   # tolerate 10 minutes of lateness
      .groupBy(window('event_ts', '5 minutes')).count()
```

- Events **newer** than the watermark → still **update** their window.
- Events **older** than the watermark (too late) → **dropped**.
- When a window falls **entirely behind** the watermark, it is **finalized**: its result can be emitted (in **append** mode) and its **state is evicted** (so memory stays bounded).

## 4. Why the watermark is essential

Without a watermark, a long-running event-time aggregation would have to keep **every window's state forever** (unbounded memory → eventual failure) and could **never** emit a final ("append") result, because any old window might still change. The watermark provides the **"this window is done"** signal that lets old state be dropped and final results emitted. It's what makes long-running aggregation **correct and bounded**.

## 5. The latency/completeness trade-off

| Watermark delay | Late data captured | Latency | State held |
|---|---|---|---|
| Small (e.g. 2 min) | Less (drops more stragglers) | Lower | Less |
| Large (e.g. 30 min) | More | Higher | More |

Tune it to your data's **real lateness** — e.g. just above the **p99 arrival delay** — so you capture nearly all legitimate late events without holding state or delaying results excessively. Monitor the **dropped-late-records** metric and adjust.

## 6. Output modes with windows

- **append** — emits a window's result **once finalized** (after the watermark passes it). Good for writing final, immutable window results.
- **update** — emits windows' **current** counts as they change (lower latency, but values revise until finalized).
Choose based on whether downstream wants **final** results (append) or **live, revisable** ones (update).

## 7. Gotchas

- **Aggregating by processing time** breaks correctness and reproducibility — use the event-time column.
- **No watermark on a streaming aggregation** → unbounded state (the job dies) and no append output.
- **Watermark too small** → drops legitimate late data (undercount); **too large** → high latency + memory.
- **Watermark column must be the event-time** column used in the window.
- **Late beyond the watermark is silently dropped** — track the metric; if real lateness shifts, retune.
- **Multiple aggregations / chained stateful ops** have watermark propagation subtleties — test them.

## Scenario — counting mobile events correctly

A team counts events in **5-minute event-time windows**. Mobile clients buffer, so events arrive up to ~7 minutes late (p99). They set **`withWatermark('event_ts', '10 minutes')`** (p99 + margin). An event stamped **10:03** that arrives at **10:09** still updates the **10:00–10:05** window — correct. The same event arriving at **10:20** is **too late** (watermark passed) and is **dropped**; that window was already finalized and its state freed (bounded memory). They use **append** mode to write each window's **final** count once finalized. Earlier they'd mistakenly aggregated by **arrival time**, which made counts jump whenever a backlog flushed; switching to **event time + watermark** made the metric **correct, reproducible, and bounded**. They watch the dropped-late metric to confirm 10 minutes is enough.

## Practice

1. Contrast event time and processing time; why aggregate by event time?
2. Define tumbling, sliding, and session windows with syntax.
3. What is a watermark (formula), and what happens to events newer/older than it?
4. Why is a watermark necessary for a long-running aggregation (memory and append output)?
5. Explain the latency/completeness trade-off and how you'd pick the delay.
6. When do you use append vs update output mode with windows?
7. A teammate aggregates by `current_timestamp()` — what breaks and how do you fix it?
