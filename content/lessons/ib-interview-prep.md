# Interview bank prep & cheat sheet

Your final-review sheet across every round. Pair it with the per-round lessons above and 2-3 mock interviews.

## 4-week study plan (compress as needed)

| Week | Focus |
|---|---|
| 1 | **SQL** — windows, CTEs, top-N, dedup, gaps-and-islands, optimization |
| 2 | **Python DSA** — arrays/strings/heaps/trees/graphs + DE-flavored (dedupe streams, k-way merge, top-N from huge file) |
| 3 | **Data modeling** (grain, star/snowflake, SCD2, late data) + **Spark internals** (shuffle, skew, joins, AQE) |
| 4 | **System design** (6-step method + 5 worked designs) + **behavioral** (12-15 STAR stories) |
| all | 2-3 **mock interviews**; review mistakes |

## One-page cheat sheet

**SQL.** ROW_NUMBER / RANK / DENSE_RANK, LAG/LEAD, running totals (window frames). Top-N per group = ROW_NUMBER in a
subquery (`rn<=N`). Dedup latest = `rn=1` by `updated_at DESC`. Sessionize/streaks = gaps-and-islands. Anti-join =
`LEFT JOIN ... IS NULL`. Perf = index/partition-prune, no `SELECT *`, pre-aggregate.

**Coding.** State approach + Big-O + edge cases **before** typing. Top-K = heap / `Counter.most_common`. K-way merge =
`heapq.merge`. Streaming median = two heaps. Big file = **stream/chunk**, don't load. Mention memory & idempotency.

**Data modeling.** Name the **grain** first. Star for BI (fewer joins); snowflake when normalization matters. **SCD2**
(`valid_from`/`valid_to`/`is_current`) for history; SCD1 to overwrite. Partition by event date; idempotent loads;
handle late data with backfill.

**Spark.** Shuffles (wide transforms) are the cost. **Broadcast** small joins; fix **skew** (salt / AQE); `repartition`
to rebalance, `coalesce` to shrink; ~128MB partitions; cache reused DFs; enable **AQE**; compact small files.

**System design.** Clarify → estimate → **ingest/store/process/serve** → deep-dive → **trade-offs** → wrap
(monitoring). Backbones: medallion+dbt (batch), Kafka→Flink (stream), CDC→MERGE, queue+workers+cost-guard (LLM),
Kafka→ClickHouse/Pinot (real-time). Always name idempotency, schema/contracts, observability, cost.

**Behavioral.** STAR, "I" not "we", **quantify**. 12-15 stories tagged to LPs/values. Have a real failure + lesson.

## On the day (every round)

1. **Ask clarifying questions** before solving.
2. **State assumptions** and constraints out loud.
3. **Think aloud** — your reasoning is what's scored.
4. **Name the trade-off** for every decision.
5. **Test** your code / sanity-check your query.
6. Manage time; if stuck, state your approach and a fallback.

## 60-second pre-round reset

```
SQL?        → window functions + CTEs; clarify schema/NULLs/ties
Coding?     → approach + Big-O first; edge cases; test small
Modeling?   → grain → dims → SCD → keys/partitioning
Design?     → 6 steps; draw it; name trade-offs; monitoring
Spark?      → reason from shuffles & partitioning
Behavioral? → STAR, quantify, "I", ~2 min
```

You've got the map, the patterns, and the stories. Drill the rounds, mock it, and walk in calm.
