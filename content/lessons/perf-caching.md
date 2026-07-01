# Caching & pre-computation — the complete guide

When the same expensive result is needed again and again, the fastest optimization is
to **not compute it again** — cache it or pre-aggregate it. This guide covers the layers
of caching and the trade-offs, with examples and practice.

## 1. The idea

@@diagram:cache-aside

Computing is expensive; reading a stored result is cheap. So store the results of
expensive, repeated work and serve those instead — trading a little **freshness** and
some **memory/storage** for big speed.

## 2. Result / query cache

Many warehouses (BigQuery, Snowflake) automatically cache the result of an **identical**
query, so a repeated dashboard query returns instantly without rescanning. Free, but it
only helps for byte-identical repeated queries.

## 3. Materialized views & aggregate tables (the big one)

Pre-compute a heavy rollup into a small table:

```sql
-- nightly: build a small summary the dashboard reads
CREATE TABLE daily_sales_by_category AS
SELECT date, category, SUM(amount) AS revenue
FROM fact_sales GROUP BY date, category;
```

The dashboard now reads a few thousand pre-computed rows in **milliseconds** instead of
scanning the billion-row fact on every load. Refresh **incrementally** (only new dates).
This is the medallion **gold** layer and one of the most effective analytics patterns.

## 4. Application cache — cache-aside

For hot lookups, keep results in a fast store (Redis) with a **TTL**:

```
read key:
  hit  → return from cache (sub-millisecond)
  miss → read DB, store in cache (with TTL), return
```

This slashes database load for read-heavy workloads (product pages, sessions, feature
lookups).

## 5. Spark cache

A reused DataFrame is recomputed per action unless cached:

```python
clean = raw.filter(...).join(...).cache()
clean.count(); clean.write(...)   # second action reuses the cache
```

## 6. The trade-offs (manage these)

- **Staleness** — a cache can serve out-of-date data when the source changes. Manage with
  a **TTL** (auto-expire) and/or **invalidation** (clear the key on update). Match the
  TTL to how fresh the data must be.
- **Memory/storage** — caches consume resources. Cache the **hot path** (frequently read,
  expensive to compute), not everything.
- **Thundering herd** — when a hot key expires, many requests hit the source at once;
  mitigate with locks/staggered TTLs.

## 7. Choosing a layer

| Situation | Use |
|---|---|
| Repeated identical query | warehouse result cache (automatic) |
| Heavy dashboard aggregation | materialized view / aggregate table |
| Hot key/value lookups | cache-aside (Redis + TTL) |
| Reused Spark DataFrame | `df.cache()` |

## 8. Don't cache to hide a problem

Caching is a great accelerator, but if the underlying query is doing a full scan, **fix
the layout/query first** (partition, index, columns). Cache the already-efficient hot
path — don't use caching to paper over a scan that should have been pruned.

## Practice

1. **Dashboard.** Make a repeated heavy aggregation instant.
2. **Trade-offs.** Two things to manage when adding a cache.
3. **Cache-aside.** What happens on a miss?
4. **Spark.** Why does `df.cache()` help across multiple actions?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"A dashboard reruns the same expensive aggregation constantly — how do you speed it
> up?"*

**Pre-aggregate** it into a small summary/materialized table (the gold layer), refreshed
incrementally, so the dashboard reads pre-computed rows in milliseconds — accepting
slight staleness. For hot key lookups use **cache-aside** (Redis + TTL); for reused Spark
results use `df.cache()`. Manage **freshness** (TTL/invalidation) and **memory**, and
fix an inefficient query first rather than caching around it.
