# Partitions & shuffle — the key to fast Spark

Almost every "my Spark job is slow" story comes back to partitions and shuffle. If
you understand these two ideas deeply, you can reason about — and fix — most
performance problems.

## The picture to keep in your head

A class of 30 sorts a pile of exam papers by surname letter. Each student first sorts their own small pile into 26 trays (the **map side**: writing shuffle files). Then each "letter captain" walks to **every** student's desk to collect their tray for that letter (the **reduce side**: fetching shuffle blocks over the network). Thirty students times 26 captains is 780 hand-offs, which is why it's slow. And if half the class is called "Sharma", the S captain is still collecting long after everyone else has gone to lunch. That's **skew**.

@@diagram:spark-shuffle-exchange

Versions and defaults below are from the Spark 4.3.0 docs (released 30 Oct 2026).

## Partitions: the unit of parallelism

Spark splits a dataset into **partitions**, and each partition is processed by one
**task** on one CPU core. So 200 partitions can run on up to 200 cores at once.
This drives a few practical rules:

- **Too few partitions** → idle cores, no parallelism (8 partitions on a 200-core
  cluster wastes 192 cores).
- **Too many tiny partitions** → scheduling overhead dominates the actual work.
- A healthy target is partitions of roughly **128–256 MB** each.

`df.rdd.getNumPartitions()` shows the count. `repartition(n)` reshuffles into `n`
partitions (a full shuffle); `coalesce(n)` *reduces* partitions without a full
shuffle (great for writing fewer output files).

## Narrow vs wide transformations

- **Narrow** (`filter`, `select`, `map`): each output partition depends on one input
  partition. No data moves between machines — cheap and parallel.
- **Wide** (`groupBy`, `join`, `distinct`, `orderBy`): output partitions depend on
  *many* input partitions, because rows with the same key must be brought together.
  This triggers a **shuffle**.

```
Narrow (no movement):          Wide (shuffle):
[p1]→[p1]                      [p1]┐
[p2]→[p2]                      [p2]┼─► redistribute by key ─►[keyA][keyB][keyC]
[p3]→[p3]                      [p3]┘
```

## Why shuffle is the villain

A shuffle writes intermediate data to disk, sends it across the network, and reads
it again on the receiving machines. Network and disk are orders of magnitude slower
than memory, so shuffles dominate runtime. You can't eliminate them (a `groupBy`
*must* gather keys), but you minimise them:

- **Filter before wide ops** so less data is shuffled.
- **Avoid needless re-partitioning** and repeated `groupBy`s.
- **Select only needed columns** before a join.

## Data skew — the silent killer

A shuffle sends every row for a key to one task. If one key is huge (say `country =
'USA'` is 60% of rows) **and all those rows really have to travel**, that one task does
most of the work while others sit idle, and the job is as slow as its slowest task.
Symptoms: 199 tasks done in seconds, 1 task running for an hour.

Whether the rows really travel depends on the operation:

- **Decomposable aggregates (`sum`, `count`, `min`, `max`, `avg`) are usually fine.**
  Spark plans `HashAggregate (partial) → shuffle → HashAggregate (final)`: each map task
  combines its own rows first and ships **one partial row per key**. A seller with 600,000
  rows sends ~400 partial rows if there are 400 map tasks. Salting here adds a stage and
  buys nothing. Check the physical plan (`df.explain()`) for the two `HashAggregate` steps.
- **Joins on a hot key** shuffle every row of the big side. With AQE on (the default),
  Spark splits a skewed sort-merge join partition by itself when it is more than 5x the
  median and over 256 MB, replicating the matching rows of the other side.
- **Non-decomposable work** can't combine early: `collect_list`/`collect_set`, exact
  percentiles, and window functions `PARTITION BY` the hot key. These are where skew
  hurts and AQE's join handling doesn't apply.

Fixes, in order: **broadcast** the small side if it fits; **let AQE split skewed joins**
and confirm it did in the plan or Spark UI; **salt** by hand (random suffix on the hot key
on the big side, replicate the matching small-side rows per suffix) for joins AQE doesn't
split and for non-decomposable work; or **isolate the hot key** and process it separately.

## Broadcast joins — beat the shuffle

Joining a huge table to a small one (a dimension, a lookup) normally shuffles both.
Instead, **broadcast** the small table: send a full copy to every machine so each
can join locally with no shuffle at all.

```python
from pyspark.sql.functions import broadcast
result = big_orders.join(broadcast(small_products), "product_id")
```

Spark auto-broadcasts tables under a size threshold; for a small dimension this can
turn minutes into seconds. Knowing when a join can be broadcast is a frequent
interview question.

## Caching

If you reuse a DataFrame across several actions, `df.cache()` keeps it in memory so
Spark doesn't recompute the whole lineage each time. Cache *reused* intermediates;
don't cache everything (memory is finite).

## What Spark actually does by default (Spark 4.3)

| Setting | Default | What it means for you |
|---|---|---|
| `spark.sql.shuffle.partitions` | 200 | reduce-side partitions for joins and aggregations, before AQE adjusts them |
| `spark.sql.adaptive.enabled` | true | AQE re-plans at runtime using real shuffle statistics |
| `spark.sql.adaptive.coalescePartitions.enabled` | true | merges small neighbouring shuffle partitions after the map stage |
| `spark.sql.adaptive.coalescePartitions.parallelismFirst` | **true** | coalescing **ignores** the 64 MB advisory size and only enforces a 1 MB minimum, to keep parallelism high. Spark's docs recommend `false` on busy clusters |
| `spark.sql.adaptive.advisoryPartitionSizeInBytes` | 64 MB | target size when coalescing (if parallelismFirst is false) or splitting skew |
| `spark.sql.adaptive.skewJoin.enabled` | true | splits skewed partitions in sort-merge joins |
| skew is detected when a partition is | > 5x the median **and** > 256 MB | `skewedPartitionFactor` and `skewedPartitionThresholdInBytes` |
| `spark.sql.autoBroadcastJoinThreshold` | 10 MB | tables estimated below this are broadcast instead of shuffled |

Two consequences people miss. AQE's skew handling is for **sort-merge joins**. A skewed `groupBy` with `sum`/`count` doesn't need it (partial aggregation absorbs the skew), but `collect_list`, exact percentiles and windows on the hot key do need salting or isolating the key. And with `parallelismFirst=true`, a small daily job can still launch dozens of ~1 MB tasks; the exact count also depends on the cluster's default parallelism.

## Worked example: a 2 TB daily join on 40 nodes

A clickstream job joins **2 TB/day of events** to a **6 GB sellers** table on a **40-node cluster** (16 cores each, 640 cores), then aggregates revenue by seller.

1. **Can the dimension be broadcast?** 6 GB is far above the 10 MB auto threshold, and broadcasting 6 GB to 40 executors costs 240 GB of memory. Not broadcastable; it's a shuffle (sort-merge) join. If only 200 MB of sellers are active after filtering `is_active`, an explicit `broadcast()` is reasonable, provided executor memory allows.
2. **Shuffle size.** After selecting only the 6 needed columns, the events side is ~600 GB. At the default 200 partitions, each reduce task gets ~3 GB: tasks spill to disk and some die. Target ~128 MB: 600 GB / 128 MB is about 4,800 partitions, roughly 7.5 waves over 640 cores. Set `spark.sql.shuffle.partitions=4800` (or rely on AQE after raising it high and letting coalescing shrink it).
3. **Skew.** One marketplace-owned seller is 30% of events: its join partition is ~180 GB. AQE's skew join detects it (it's far over 5x the median and 256 MB) and splits it; confirm in the Spark UI that the join stage shows the split. The later revenue `groupBy(seller_id).sum(amount)` has the same hot key, but it's **fine**: partial aggregation sends one row per map task for that seller, not 180 GB. The step that would hurt is a per-seller `collect_list` of sessions for a downstream ML feature. There, salt the key (`concat(seller_id, '#', cast(rand()*32 as int))`), collect per salted key, then merge the 32 lists per seller.
4. **Result to expect**: no straggler task holding the stage, task times within a few multiples of each other in the Spark UI's stage summary (max vs median), and spill near zero.

## Hands-on lab: measure skew and fix it (plain Python)

No Spark or Java needed: the lab hash-partitions 2 million rows from 400 map tasks to 200 reducers, like a shuffle, and measures what the busiest reducer receives, with and without partial (map-side) aggregation, for a `collect_list`, and for a plain vs salted join. Run `python labs/bd-partitions-shuffle.py` (about 10 seconds).

```python
"""Lab: what a shuffle really sends, in plain Python (no Spark/Java needed).
2M clickstream rows from 400 input partitions are hash-partitioned to 200 reducers
(spark.sql.shuffle.partitions default). One seller owns 30% of the rows.
We measure what the busiest reducer receives in four cases:
  1. sum per seller WITH partial (map-side) aggregation   <- what Spark plans for sum/count/min/max/avg
  2. collect_list per seller (can't be combined early)     <- the skew really lands on one reducer
  3. a sort-merge join on seller_id, then the same join salted 32 ways
  4. AQE-style coalescing of a small shuffle
"""
import random, statistics, zlib
random.seed(7)

N_ROWS, N_MAPS, N_REDUCERS, ROW_BYTES, SALT = 2_000_000, 400, 200, 120, 32
keys = ["seller_0" if random.random() < 0.30 else f"seller_{random.randint(1, 50_000)}" for _ in range(N_ROWS)]
maps = [keys[i::N_MAPS] for i in range(N_MAPS)]                 # 400 input partitions (map tasks)
def reducer_of(key): return zlib.crc32(key.encode()) % N_REDUCERS  # stand-in for Spark's hash partitioner

def report(label, rows_per_reducer, row_bytes=ROW_BYTES):
    mb = [r * row_bytes / 1e6 for r in rows_per_reducer]
    med = statistics.median(mb)
    print(f"  {label:44s} busiest {max(mb):7.2f} MB | median {med:5.2f} MB | {max(mb)/med:5.1f}x")

def shuffle_raw(ks):                               # every row crosses the network
    out = [0] * N_REDUCERS
    for k in ks: out[reducer_of(k)] += 1
    return out

print(f"{N_ROWS:,} rows, {N_MAPS} map tasks -> {N_REDUCERS} reducers; seller_0 = 30% of rows\n")

print("1) groupBy(seller).sum(amount): Spark plans HashAggregate(partial) -> shuffle -> HashAggregate(final)")
partial = [0] * N_REDUCERS
for m in maps:
    for k in set(m): partial[reducer_of(k)] += 1   # each map task sends ONE partial row per key it saw
report("rows sent after partial aggregation", partial, row_bytes=40)
print(f"  seller_0's reducer gets {N_MAPS} partial rows (one per map task), not {keys.count('seller_0'):,} raw rows.")
print("  No salting needed. Check the physical plan for two HashAggregate steps.")

print("\n2) groupBy(seller).agg(collect_list(event)): no early combine, every row is shuffled")
report("raw rows per reducer", shuffle_raw(keys))
print("  The reducer that owns seller_0 holds ~30% of all rows: one task runs long and may spill or OOM.")
print("  Same story for exact percentiles and windows PARTITION BY seller_id.")

print("\n3) events JOIN sellers ON seller_id (sort-merge join: both sides shuffled by key)")
report("events side, plain join", shuffle_raw(keys))
salted = [f"{k}#{random.randrange(SALT)}" if k == "seller_0" else k for k in keys]
report(f"events side, hot key salted {SALT} ways", shuffle_raw(salted))
# the small side's hot row is replicated once per salt value so every salted key still finds its match
dim = set(f"seller_{i}" for i in range(50_001))
dim_salted = {f"seller_0#{s}" for s in range(SALT)} | (dim - {"seller_0"})
plain_matches = sum(1 for k in keys if k in dim)
salted_matches = sum(1 for k in salted if k in dim_salted)
print(f"  join output rows: plain {plain_matches:,} == salted {salted_matches:,} -> {plain_matches == salted_matches}")
print("  With AQE on (default), Spark does this split itself for a sort-merge join when a partition is")
print("  > 5x the median AND > 256 MB. Salt by hand only when the plan shows no skew split.")

print("\n4) AQE coalescing of a small shuffle")
small = shuffle_raw([k for k in keys if k != "seller_0"][:300_000])
def coalesce(counts, target_mb, at_least):
    out, cur = [], 0.0
    for cnt in counts:
        mb = cnt * ROW_BYTES / 1e6
        if at_least:                                  # merge until each partition reaches the minimum
            cur += mb
            if cur >= target_mb: out.append(cur); cur = 0.0
        else:                                         # merge while the next one still fits the target
            if cur and cur + mb > target_mb: out.append(cur); cur = 0.0
            cur += mb
    if cur:
        if at_least and out: out[-1] += cur           # fold a small remainder into the last partition
        else: out.append(cur)
    return out
lo = coalesce(small, 1, at_least=True)
hi = coalesce(small, 64, at_least=False)
print(f"  {sum(small)*ROW_BYTES/1e6:.0f} MB over 200 shuffle partitions = 200 tiny tasks before AQE")
print(f"  parallelismFirst=true (default): merge to >= 1 MB  -> {len(lo)} tasks, smallest {min(lo):.1f} MB")
print(f"  parallelismFirst=false: 64 MB advisory size       -> {len(hi)} task(s) of ~{max(hi):.0f} MB")
print("  Real Spark also weighs cluster parallelism here, so the default's task count depends on your cores.")

print("\n5) Sizing rule of thumb: shuffle partitions ~= shuffle bytes / 128 MB")
for gb in (5, 200, 2000):
    print(f"   {gb:5d} GB shuffled -> ~{gb*1024//128:,} partitions (default 200 would be {gb*1024/200:,.0f} MB each)")
```

Output from a real run on 2026-11-03:

```text
2,000,000 rows, 400 map tasks -> 200 reducers; seller_0 = 30% of rows

1) groupBy(seller).sum(amount): Spark plans HashAggregate(partial) -> shuffle -> HashAggregate(final)
  rows sent after partial aggregation          busiest    0.32 MB | median  0.27 MB |   1.2x
  seller_0's reducer gets 400 partial rows (one per map task), not 599,805 raw rows.
  No salting needed. Check the physical plan for two HashAggregate steps.

2) groupBy(seller).agg(collect_list(event)): no early combine, every row is shuffled
  raw rows per reducer                         busiest   72.77 MB | median  0.84 MB |  86.9x
  The reducer that owns seller_0 holds ~30% of all rows: one task runs long and may spill or OOM.
  Same story for exact percentiles and windows PARTITION BY seller_id.

3) events JOIN sellers ON seller_id (sort-merge join: both sides shuffled by key)
  events side, plain join                      busiest   72.77 MB | median  0.84 MB |  86.9x
  events side, hot key salted 32 ways          busiest    5.27 MB | median  0.85 MB |   6.2x
  join output rows: plain 2,000,000 == salted 2,000,000 -> True
  With AQE on (default), Spark does this split itself for a sort-merge join when a partition is
  > 5x the median AND > 256 MB. Salt by hand only when the plan shows no skew split.

4) AQE coalescing of a small shuffle
  36 MB over 200 shuffle partitions = 200 tiny tasks before AQE
  parallelismFirst=true (default): merge to >= 1 MB  -> 33 tasks, smallest 1.0 MB
  parallelismFirst=false: 64 MB advisory size       -> 1 task(s) of ~36 MB
  Real Spark also weighs cluster parallelism here, so the default's task count depends on your cores.

5) Sizing rule of thumb: shuffle partitions ~= shuffle bytes / 128 MB
       5 GB shuffled -> ~40 partitions (default 200 would be 26 MB each)
     200 GB shuffled -> ~1,600 partitions (default 200 would be 1,024 MB each)
    2000 GB shuffled -> ~16,000 partitions (default 200 would be 10,240 MB each)
```

What to look for:

- **Step 1**: with partial aggregation, the hot seller's reducer receives 400 partial rows and the skew is just 1.2x. This is why salting a `sum` is wasted work.
- **Step 2**: `collect_list` can't combine early, so that reducer gets ~30% of all rows (~87x the median). This is the hour-long task.
- **Step 3**: the plain join has the same 87x skew; salting the hot key 32 ways (and replicating its dimension row 32 times) cuts it to ~6x with exactly the same join output. AQE does this split for you on sort-merge joins once the partition crosses its thresholds.
- **Step 4**: AQE's default coalescing merges to a 1 MB floor and still leaves 33 small tasks here; `parallelismFirst=false` merges them into one.
- **Step 5**: the default 200 partitions is right for ~25 GB of shuffle and badly wrong for 2 TB.

**With real Spark** (needs Java 17+ and `pip install pyspark`, a few hundred MB): run the same groupBy on a skewed DataFrame locally, open the Spark UI at `http://localhost:4040`, and compare the **Max** and **Median** task duration in the stage's summary metrics before and after salting.

## Interview check

*"Your Spark job runs 199 tasks fast and 1 task forever. What's happening?"*

Data skew: one shuffle key is far larger than the rest. First ask *which* operation:
a `sum`/`count` groupBy is usually absorbed by partial aggregation; a join on the hot key
should be split by AQE's skew join (check the plan); `collect_list`, percentiles and
windows on the hot key need salting or isolating the key. If you can also explain broadcast joins
and healthy partition sizing, you understand Spark performance.

## Sources

- Spark 4.3.0 SQL performance tuning (shuffle partitions, AQE coalescing, parallelismFirst, skew join, broadcast threshold): https://spark.apache.org/docs/latest/sql-performance-tuning.html
- Spark downloads (4.3.0, 30 Oct 2026): https://spark.apache.org/downloads.html
- Spark web UI guide (stages, task summary metrics): https://spark.apache.org/docs/latest/web-ui.html
