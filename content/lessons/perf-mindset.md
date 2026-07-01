# The performance mindset — the complete guide

Before any specific tuning trick, you need the right approach: measure first, find the
real bottleneck, and remember that every optimization is some form of "do less work."
This guide sets that foundation, with examples and practice.

## 1. Measure, don't guess

The single most common mistake is optimizing the wrong thing. **Profile first** to find
the **bottleneck** — the one stage that dominates the runtime — then optimize *that*.
Optimizing anything else gives no visible improvement.

Tools to measure:
- **`EXPLAIN` / `EXPLAIN ANALYZE`** — the query plan (scans vs index/partition use).
- **The Spark UI** — stages, tasks, shuffle sizes, spills, the slow stage.
- **`time`, logs, metrics** — wall-clock and per-stage timing.

## 2. The golden rule: do less work

Almost every optimization is one of three things:

- **Scan less data** — partition pruning, columnar formats, narrow `SELECT`, filter
  early.
- **Move less data** — fewer/smaller shuffles, no cross-region transfer, broadcast small
  joins.
- **Compute less** — pre-aggregate, cache reused results, avoid recomputation.

When you face a slow job, ask: *which of these can I reduce here?*

## 3. Performance ≈ cost

In the cloud, bills scale with **compute used** and **data scanned/moved** — exactly the
things that make a job slow. So a query that scans 100× less data is roughly **100×
faster and 100× cheaper**. Optimizing for speed and optimizing for cost are usually the
**same action**.

## 4. Avoid premature optimization

> "Premature optimization is the root of all evil." — Knuth

Get it **correct** first. Then set a **target** (an SLA — "must finish by 7am",
"dashboard under 2s"). Then **profile**, fix the proven bottleneck, and **stop when you
meet the target**. Don't add caching, exotic configs, or complexity before you've
measured that they help — they add bugs and maintenance for nothing.

## 5. The optimization loop

```
measure  →  find the bottleneck  →  do less work there  →  re-measure
   ↑                                                          │
   └──────────────────  repeat until you meet the SLA  ───────┘
```

## 6. A worked example

A pipeline takes 40 minutes. The team starts hand-tuning Spark memory configs.
**Profiling the Spark UI first** shows 90% of the time is one stage doing a **full scan
of an unpartitioned table**. Partitioning it by date cuts the job to 4 minutes — one
change to the bottleneck beat days of guessing at configs.

## 7. Know when to stop

More optimization has diminishing returns and rising complexity. Once you hit the SLA at
acceptable cost, **stop** — a maintainable pipeline that meets its target beats a
fragile, over-tuned one that's 5% faster.

## Practice

1. **First move.** A job is slow; a teammate wants to add caching everywhere. What first?
2. **Three levers.** Name the three forms almost every optimization takes.
3. **Cost = perf.** Why are they the same lever in the cloud?
4. **Premature.** What's wrong with premature optimization?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"Your pipeline is too slow. Walk me through how you'd approach it."*

**Measure first** — profile (EXPLAIN / Spark UI / timings) to find the one stage that
dominates the runtime. Then reduce work there in one of three ways: **scan less** (prune/
columnar/narrow), **move less** (fewer shuffles, no cross-region, broadcast), or
**compute less** (pre-aggregate/cache). Re-measure, repeat until the SLA is met, and stop
— avoiding premature optimization of code that isn't the bottleneck.
