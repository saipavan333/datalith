"""Lab: what a shuffle does to your data, in plain Python (no Spark/Java needed).
Simulates the reduce side of groupBy(key): rows are hash-partitioned to N reducers.
We measure reducer sizes, show skew, fix it with salting, and mimic AQE partition coalescing.
"""
import random, statistics, zlib
random.seed(7)

N_ROWS, N_REDUCERS = 2_000_000, 200          # 200 = spark.sql.shuffle.partitions default
ROW_BYTES = 120

# clickstream: 50,000 sellers, but one marketplace-owned seller produces 30% of events
keys = [("seller_0" if random.random() < 0.30 else f"seller_{random.randint(1, 50_000)}") for _ in range(N_ROWS)]

def reducer_of(key, n): return zlib.crc32(key.encode()) % n   # stand-in for Spark's hash partitioner

def sizes(ks, n):
    counts = [0] * n
    for k in ks: counts[reducer_of(k, n)] += 1
    return counts

def report(label, counts):
    mb = [c * ROW_BYTES / 1e6 for c in counts]
    med = statistics.median(mb)
    print(f"{label:34s} max {max(mb):7.1f} MB | median {med:5.2f} MB | max/median {max(mb)/med:6.1f}x")

print(f"{N_ROWS:,} rows x {ROW_BYTES} B = {N_ROWS*ROW_BYTES/1e6:.0f} MB shuffled into {N_REDUCERS} reducers\n")
c = sizes(keys, N_REDUCERS)
report("1) groupBy(seller): plain hash", c)
print("   The reducer holding seller_0 does ~30% of all the work; the job waits for it.")

# Salting: spread the hot key over 32 sub-keys, aggregate twice (partial, then final)
SALT = 32
salted = [f"{k}#{random.randrange(SALT)}" if k == "seller_0" else k for k in keys]
report("2) salted hot key (32 ways)", sizes(salted, N_REDUCERS))
print("   Stage 1 sums per salted key; stage 2 strips the '#n' suffix and sums 32 partial rows.")

# Check the salted two-step aggregation gives the same answer
exact = sum(1 for k in keys if k == "seller_0")
partials = {}
for k in salted:
    if k.startswith("seller_0#"): partials[k] = partials.get(k, 0) + 1
print(f"   seller_0 count: exact {exact:,} == sum of 32 partials {sum(partials.values()):,} -> {exact == sum(partials.values())}")

# AQE-style coalescing: merge neighbouring small partitions up to a 64 MB target (advisory size)
def coalesce(counts, target_mb=64):
    out, cur = [], 0.0
    for cnt in counts:
        mb = cnt * ROW_BYTES / 1e6
        if cur and cur + mb > target_mb: out.append(cur); cur = 0.0
        cur += mb
    out.append(cur); return out
small = sizes([k for k in keys if k != "seller_0"][:300_000], N_REDUCERS)   # a small day: 36 MB total
default = coalesce(small, target_mb=1)      # parallelismFirst=true (default): only the 1 MB minimum applies
tuned = coalesce(small, target_mb=64)       # parallelismFirst=false: the 64 MB advisory size applies
print(f"\n3) small input ({sum(small)*ROW_BYTES/1e6:.0f} MB) over 200 shuffle partitions = 200 tiny tasks")
print(f"   AQE default (parallelismFirst=true, 1 MB minimum) -> {len(default)} tasks of ~{statistics.median(default):.1f} MB")
print(f"   parallelismFirst=false (64 MB advisory size)      -> {len(tuned)} task(s) of ~{max(tuned):.0f} MB")
print("   Spark's docs recommend false on a busy shared cluster, to avoid many small tasks.")

print("\n4) Sizing rule of thumb: shuffle partitions ~= shuffle bytes / 128 MB")
for gb in (5, 200, 2000):
    print(f"   {gb:5d} GB shuffled -> ~{gb*1024//128:,} partitions (default 200 would be {gb*1024/200:,.0f} MB each)")
