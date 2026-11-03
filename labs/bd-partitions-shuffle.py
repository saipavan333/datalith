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
