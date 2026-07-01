# Interview Question Bank (50LPA+) — quick reference

A one-page cross-round cheat sheet for FAANG / Goldman / bank data-engineering loops (2026).

## The loop

recruiter → **technical screen (SQL + coding, CoderPad)** → onsite: **SQL · coding/DSA · data modeling · system design · behavioral** (+ Spark/distributed at banks) → offer.

## SQL

| Ask | Pattern |
|---|---|
| Nth highest | subquery / `DENSE_RANK()=N` |
| top-N per group | `ROW_NUMBER() PARTITION BY grp ORDER BY m DESC`, `rn<=N` |
| dedup latest | keep `rn=1` by `updated_at DESC` |
| period-over-period | `LAG/LEAD` |
| moving total | `ROWS BETWEEN n PRECEDING AND CURRENT ROW` |
| sessionize / streaks | gaps-and-islands (flag w/ LAG, cumulative SUM) |
| anti-join | `LEFT JOIN ... IS NULL` / `NOT EXISTS` |

Perf: index/partition-prune, no `SELECT *`, push filters, pre-aggregate.

## Coding / DSA

State **approach + Big-O + edge cases first**. Top-K = heap/`Counter`. K-way merge = `heapq.merge`. Streaming median = two heaps. Huge file = **stream/chunk**, don't load. Always mention **memory + idempotency**.

## Data modeling

Name the **grain** first. **Star** for BI (fewer joins); snowflake when normalization matters. **SCD2**
(`valid_from`/`valid_to`/`is_current`) for history; SCD1 to overwrite. Partition by event date; idempotent loads;
backfill late data.

## Spark / big data

Shuffles (wide transforms) = the cost. **Broadcast** small joins. Fix **skew** (salt / AQE). `repartition` to
rebalance, `coalesce` to shrink. ~128MB partitions. Cache reused DFs. Enable **AQE**. Compact small files.

## System design (6 steps)

clarify → estimate → **ingest/store/process/serve** → deep-dive → **trade-offs** → wrap (monitoring).
Backbones: medallion+dbt (batch) · Kafka→Flink (stream) · CDC→MERGE · queue+workers+cost-guard (LLM/RAG) ·
Kafka→ClickHouse/Pinot (real-time). Always cover idempotency, contracts, observability, cost.

## Behavioral

STAR, **"I" not "we"**, quantify, ~2 min. **12-15 stories** tagged to LPs/values. Have a real failure + lesson.
Amazon = LPs in every round. Goldman = Partnership, Client Service, Integrity, Excellence.

## On the day

Ask clarifying questions → state assumptions → think aloud → **name the trade-off** → test → manage time.

## Tailoring

Google = coding rigor + design + GCP · Meta = **data modeling** (product-sense) · Amazon = **LP stories** · Goldman =
CoderPad + hard SQL + Spark + **values** · JPMorgan = Python/CS breadth + SQL + **"why finance"**.
