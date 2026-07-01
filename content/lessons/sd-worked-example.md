# Worked example — designing a real analytics pipeline

System-design questions feel open-ended until you have a repeatable method. Here is
the full walkthrough of one realistic prompt, showing the reasoning an interviewer
(and your future self) wants to see.

> **Prompt:** "Design a pipeline that powers a dashboard of daily revenue by
> product category and region for an e-commerce company."

## Step 1 — Clarify before designing

Never jump to tools. Ask:

- **How fresh?** "Updated by 8am for yesterday" → *batch is fine*, no streaming.
- **What scale?** "~10 million orders/day" → tens of GB/day, not petabytes.
- **Who uses it and how?** A handful of analysts via a BI tool → warehouse-friendly.
- **History?** "2 years retained" → plan storage for ~7 TB of raw orders.

These answers eliminate half the design space immediately. The freshness answer
alone rules streaming in or out.

## Step 2 — Estimate

```
10M orders/day × ~1 KB           ≈ 10 GB/day raw
× 365 × 2 years                  ≈ 7 TB retained
avg throughput 10M / 86,400      ≈ 115 orders/sec (peak ~500/sec)
```

Conclusion: cheap object storage + a columnar format + a distributed query engine.
A single small database would not hold or scan this comfortably.

## Step 3 — Sketch the flow

```
source DB ─► ingest (batch) ─► BRONZE ─► SILVER ─► GOLD ─► BI dashboard
(orders,      nightly extract   raw       cleaned   revenue
 products)    of yesterday      landing   & joined  by cat×region
```

Map every design to the standard pipeline: **source → ingest → store → transform →
serve**, with quality and monitoring throughout.

## Step 4 — Choose components, with reasons

- **Ingestion:** nightly **batch** extract of yesterday's orders (freshness allows
  it; far simpler/cheaper than streaming). Incremental by `order_date`.
- **Storage:** object storage (S3/GCS/ADLS) in **Parquet**, organised as a
  **lakehouse** table (Delta/Iceberg) so we get ACID writes and can `MERGE` late
  data.
- **Transform:** SQL/Spark jobs building **bronze → silver → gold**. Gold is a
  denormalised `revenue_by_category_region_day` table — exactly what the dashboard
  needs, so queries are trivial and fast.
- **Serve:** the BI tool reads the small gold table (or a warehouse view over it).
- **Orchestration:** a scheduler (Airflow) runs the DAG nightly with dependencies.

## Step 5 — Address the hard parts (this is where seniority shows)

- **Idempotency:** each run is partitioned by date; re-running a day overwrites that
  day's partition — safe re-runs and backfills.
- **Late/updated orders:** a 3-day lookback re-processes recent partitions with
  `MERGE`, so corrections land in the right day.
- **Data quality:** assertions before publishing gold — `revenue >= 0`, no duplicate
  order ids, row count within the normal range; block publish on failure.
- **Schema change:** a new product field shouldn't break the job — the lakehouse
  format allows schema evolution.
- **Monitoring & SLA:** freshness check targets "gold ready by 8am"; alert at 6:30am
  if a run is late, before anyone notices.

## Step 6 — State the trade-off and conclude

"Because next-morning freshness is enough, I chose **batch over streaming** — it
meets the requirement at a fraction of the cost and operational complexity. If the
business later needs near-real-time revenue, I'd add a streaming path (Kafka + a
stream processor writing to the same gold table) rather than rebuild." Naming the
trade-off, and the simplest sufficient design, is the whole game.

## The reusable checklist

1. Clarify (freshness, scale, users, history).
2. Estimate (volume, throughput, storage).
3. Sketch source → ingest → store → transform → serve.
4. Choose components *with justification*.
5. Address idempotency, late data, quality, schema change, monitoring.
6. State trade-offs; pick the simplest design that meets the need.

Walk this path out loud and almost any pipeline-design prompt becomes structured and
calm instead of open-ended and scary.
