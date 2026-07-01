# Caching — the three layers, in depth

The cheapest query is the one Snowflake doesn't actually run. There are three cache layers, each with different rules, lifetimes, and cost implications — and the differences between them are a genuine, controllable tuning lever (especially the warm-vs-suspended decision).

@@diagram:snow-caching

## 1. The three layers, in order

A query checks them top to bottom:

| Cache | Lives in | Holds | Lifetime | Cost when hit |
|---|---|---|---|---|
| **Result cache** | Cloud services | Final query **results** | 24h (rolling) | **Free, no warehouse** |
| **Local disk (SSD)** | The running warehouse | Recently-read **micro-partitions** | Until suspend / eviction | Warehouse already running |
| **Remote storage** | Cloud object store | The data itself | Durable | Full read |

## 2. Result cache — the free win

If **any** user runs a query whose **text is byte-identical** and whose **underlying data is unchanged**, Snowflake returns the previously computed result **instantly** from cloud services — **no warehouse runs at all** (it can be suspended). It lasts ~24 hours (and the clock effectively rolls when reused).

It **misses** when:
- The query text differs **at all** — a trailing space, a different alias, a reordered clause.
- The underlying data **changed** (any DML on a referenced table).
- The query is **non-deterministic** (`current_timestamp()`, `random()`, some functions) — those can't be cached.
- Certain session-dependent constructs are present.

Implication: **stable, identical query text** maximizes result-cache hits. BI tools that generate consistent SQL benefit hugely; tools that inject volatile literals or timestamps defeat it.

## 3. Local disk (SSD) cache — the warm-warehouse win

A running warehouse keeps the **micro-partitions it recently read** on its local SSD. Back-to-back queries over the same hot data skip the remote round-trip and run faster. Key facts:

- It's **per warehouse** and **proportional to warehouse size** (bigger warehouse = more local cache).
- It is **lost on suspend** — the next query after resume re-reads from remote (a **cold** start).
- It's **partial** — only the partitions actually read are cached, and it evicts under pressure.

## 4. The tuning lever: warm vs suspended

This is the decision that matters:

- **Keep an interactive warehouse warm** (`AUTO_SUSPEND = 60–120s`): preserves the **local cache** across an analyst's series of queries → faster, but you pay some **idle** credits.
- **Suspend sooner** (`AUTO_SUSPEND = 5–10s`): saves idle credits but **discards the cache** constantly → colder, slower next query.

For **bursty interactive BI**, ~60s is usually the sweet spot. For **batch loads** (no cache reuse needed), suspend quickly. The **result cache** is unaffected by suspension (it lives in cloud services), so identical repeats stay instant regardless.

## 5. Putting the three together

```sql
-- 1) identical text + unchanged data → result cache (free, instant)
select region, sum(amount) from gold.orders group by 1;
select region, sum(amount) from gold.orders group by 1;     -- served from result cache

-- 2) a DML invalidates it; next run recomputes (but may hit local cache if warm)
insert into gold.orders ...;
select region, sum(amount) from gold.orders group by 1;     -- recompute; local cache helps if warm

-- 3) different text = miss
select region, SUM(amount) as rev from gold.orders group by 1;  -- new text → recompute
```

## 6. Gotchas

- **Whitespace/alias changes bust the result cache** — keep generated SQL stable.
- **Volatile functions** (`current_timestamp`, `random`) prevent result caching.
- **Suspend discards local cache** — don't set `AUTO_SUSPEND` ultra-low on interactive warehouses.
- **Bigger warehouse ≠ more result cache** — result cache is independent of warehouse; size affects the **local** cache and compute only.
- **Caching ≠ correctness risk** — Snowflake invalidates caches on data change, so you never see stale results.

## Scenario — making a flaky dashboard consistently fast

A dashboard is sometimes instant, sometimes slow. Investigation: when users reload the **identical** query on **unchanged** data, it's a **result-cache** hit (instant, free). When filters change or data updated, it misses the result cache; and because the warehouse `AUTO_SUSPEND=10s`, the **local cache** is usually cold too, forcing remote reads (slow). Fixes applied: (1) raise `AUTO_SUSPEND` to **60s** so the **local cache** stays warm across interaction; (2) add a **materialized view** for the heavy rollup so even cache-missing queries do little work; (3) work with the BI tool to keep **query text stable** so the result cache hits more often. The dashboard becomes uniformly fast, and the small idle-credit cost is far less than the previous repeated cold scans.

## Practice

1. Name the three caches, where each lives, and which one survives a warehouse suspend.
2. List four things that cause a result-cache miss.
3. Explain the warm-vs-suspended trade-off and the right AUTO_SUSPEND for interactive BI vs batch loads.
4. A dashboard is inconsistent (sometimes instant). Explain the cache mechanics behind that and two fixes.
5. Why does lowering AUTO_SUSPEND save money but risk slower queries?
