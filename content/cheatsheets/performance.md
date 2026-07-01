# Performance & Optimization — quick reference

**Measure, then optimize.** The biggest win is almost always **scanning less data**.

## The mindset

- **Profile first** — find the actual bottleneck (don't guess).
- Fix the **biggest** one (Amdahl's law: optimizing 5% of runtime barely helps).
- **Re-measure** — the bottleneck moves. Avoid premature optimization.

## SQL

- `EXPLAIN ANALYZE` → full scans, join type, stale stats, costliest node.
- **Sargable** predicates (no function on column, no leading wildcard) → use the index.
- Layout (partition/cluster/columnar) minimizes data scanned — often the biggest win.
- Fixes: index · sargable · `ANALYZE` (stats) · select fewer columns · rewrite (no correlated subqueries).

## Spark

- Minimize the **shuffle** (filter early, broadcast small joins).
- Fix **skew** (salt / AQE). Right-size partitions (~100–200MB, ~2–4× cores).
- **cache()** reused frames · read less (Parquet + pruning) · avoid UDFs.
- Diagnose via the **Spark UI**: longest stage, skew, spill, shuffle size.

## Data layout

- **Partition** (low-cardinality filter like date) → skip partitions.
- **Cluster / Z-order** (high-cardinality query column) → in-file data skipping.
- **Small files problem** → compact (`OPTIMIZE`) into ~128MB–1GB files.

## Caching & precomputation

- **Cache** (Redis) hot point lookups · **materialized views / aggregate tables** for common rollups · **Spark cache()** for reused frames.
- Trade-off: speed vs **freshness + invalidation** complexity. Cache frequent reads where slight staleness is OK.

## Cost

```
cost ≈ compute-time × resources × data scanned
```

- **Scan less** = faster AND cheaper (the same lever).
- Right-size · spot/preemptible · autoscale · kill idle · tier storage · minimize egress · precompute.
- Scale **efficiently** (do less work + elastic provisioning), not just scale up.

## Interview triggers

- *measure then optimize* → profile, fix biggest bottleneck (Amdahl).
- *sargable* → index seek vs scan.
- *minimize shuffle / scan* → highest-ROI Spark/SQL win.
- *partition vs Z-order* → directory vs in-file skipping.
- *small files* → compact.
- *cost = data scanned* → efficiency IS cost control.
