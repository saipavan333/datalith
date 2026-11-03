"""Lab: Kafka partitioning, consumer groups and the high watermark, simulated in plain Python.
No Kafka or Java needed. The key->partition hash is the same murmur2 that Kafka's Java
producer uses (checked against kafka-python's reference implementation).
"""
from collections import Counter

def murmur2(data: bytes) -> int:
    """Kafka's murmur2 (org.apache.kafka.common.utils.Utils.murmur2)."""
    length, seed, m, r = len(data), 0x9747B28C, 0x5BD1E995, 24
    h = (seed ^ length) & 0xFFFFFFFF
    for i in range(0, length - length % 4, 4):
        k = data[i] | data[i + 1] << 8 | data[i + 2] << 16 | data[i + 3] << 24
        k = (k * m) & 0xFFFFFFFF
        k ^= k >> r
        k = (k * m) & 0xFFFFFFFF
        h = (h * m) & 0xFFFFFFFF
        h ^= k
    tail = length % 4
    if tail >= 3: h ^= data[length - tail + 2] << 16
    if tail >= 2: h ^= data[length - tail + 1] << 8
    if tail >= 1:
        h ^= data[length - tail]
        h = (h * m) & 0xFFFFFFFF
    h ^= h >> 13
    h = (h * m) & 0xFFFFFFFF
    h ^= h >> 15
    return h - (1 << 32) if h & 0x80000000 else h   # Java int

def partition_for(key: str, n: int) -> int:
    return (murmur2(key.encode()) & 0x7FFFFFFF) % n    # Kafka's toPositive(hash) % numPartitions

print("1) Same key, same partition, every time")
for k in ["customer_42", "customer_42", "customer_7"]:
    print(f"   {k:12s} -> partition {partition_for(k, 12)}")

keys = [f"customer_{i}" for i in range(100_000)]
spread = Counter(partition_for(k, 12) for k in keys)
print("\n2) 100,000 customer keys over 12 partitions: min", min(spread.values()), "max", max(spread.values()))

moved = sum(partition_for(k, 12) != partition_for(k, 16) for k in keys)
print(f"\n3) Grow the topic 12 -> 16 partitions: {moved:,} of 100,000 keys ({moved/1000:.0f}%) now hash elsewhere.")
print("   Their new events land in a different partition from their old ones, so per-key order")
print("   across the change is no longer guaranteed. Pick partition counts with headroom up front.")

print("\n4) Consumer group: each partition goes to exactly one member")
for members in (4, 14):
    owners = {p: f"c{p % members}" for p in range(12)} if members <= 12 else {p: f"c{p}" for p in range(12)}
    busy = Counter(owners.values())
    print(f"   {members:2d} consumers -> {len(busy)} busy, {members - len(busy)} idle, max {max(busy.values())} partitions each")

print("\n5) Replication: what does 'acknowledged' mean?")
def run(acks, min_isr):
    leader, f2, f3 = list(range(10)), list(range(10)), list(range(10))   # offsets 0-9 everywhere
    isr = {"b1", "b2", "b3"}
    isr -= {"b2", "b3"}        # followers fall behind (GC pause, slow disk) and drop out of the ISR
    acked = []
    for off in (10, 11):
        if acks == "all" and len(isr) < min_isr:
            print(f"   acks={acks}, min.insync.replicas={min_isr}: write {off} REJECTED (NotEnoughReplicas) -> producer retries later")
            continue
        leader.append(off); acked.append(off)
    # broker 1 (leader) dies and its disk is gone; broker 2 is the only way back
    lost = [o for o in acked if o not in f2]
    print(f"   acks={acks}, min.insync.replicas={min_isr}: acked {acked}; leader's disk lost, broker 2 (has 0-{f2[-1]}) takes over -> lost {lost}")
run("1", 1)
run("all", 1)
run("all", 2)
print("   With unclean.leader.election.enable=false (the default) Kafka won't elect broker 2 by itself:")
print("   the partition stays offline until broker 1 returns or an admin forces it. Only")
print("   acks=all + min.insync.replicas>=2 never acknowledges a write that one lost disk can erase.")

print("\n6) High watermark = smallest log-end offset among in-sync replicas")
leo = {"broker1 (leader)": 12, "broker2": 11, "broker3": 10}
hw = min(leo.values())
print("   log end offsets:", leo, "-> high watermark", hw, f"-> consumers can read offsets 0-{hw - 1}")
