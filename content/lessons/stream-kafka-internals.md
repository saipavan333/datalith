# Kafka internals: partitions, replication, the high watermark and consumer groups

Kafka looks simple from the outside: write events to a topic, read them back. Underneath, a handful of mechanics decide whether your pipeline keeps order, survives a broker dying, and can replay last Tuesday. Interviewers probe exactly these, and production incidents come from exactly these. Versions below are checked against the Kafka 4.4 docs (4.4.0 released 22 Oct 2026).

## The picture to keep in your head

A partition is a **numbered notebook that you can only write at the end of**. Each line gets the next number (the **offset**). You never erase a line; you throw away whole old notebooks when they expire (**segments** and **retention**). Several classmates keep **copies** of the notebook (**replicas**). The teacher only lets readers see lines that every up-to-date copy has written down (the **high watermark**). Each reading group keeps a bookmark (the **committed offset**).

@@diagram:kafka-partition-log

**Watch it move (100 s, narrated):** [How a Kafka partition log works](media/kafka-partition-log.mp4): appends, replication, the high watermark, consumer offsets and segment retention.

## 1. Topics, partitions and segments

A **topic** is split into **partitions**. Each partition is an ordered, append-only log stored on a broker's disk as a series of **segment files** (default `log.segment.bytes` = 1 GiB). Each segment has an index that maps offsets to file positions, so "start reading at offset 8,412,005" is a cheap seek, not a scan.

- **Ordering** is guaranteed **within** a partition, never across partitions.
- **Parallelism** comes from partitions: consumers in a group split them, and producers write to many at once.
- **Retention** deletes whole closed segments once they are older than `log.retention.hours` (default 168, so 7 days) or the partition exceeds a size limit. Because Kafka deletes segments rather than single records, a record can live a little past its retention time.
- **Compaction** (`cleanup.policy=compact`) keeps only the latest record per key instead. This turns a topic into a changelog of current state (CDC topics, Kafka Streams state). A record with a null value (a **tombstone**) marks a key for removal.

## 2. How a producer picks a partition

- **With a key**: the producer hashes the key bytes with **murmur2** and takes `toPositive(hash) % numPartitions`. Same key, same partition, so per-key order holds. The lab reproduces this hash.
- **Without a key**: modern clients do **not** round-robin per record. The default logic picks a **sticky partition** and keeps filling it until a batch is sent (governed by `batch.size`, default 16 KiB, and `linger.ms`, default 5 ms), then moves on. Bigger batches mean fewer requests and better compression. Older material that says "no key means round-robin" describes clients from before Kafka 2.4.
- **Adding partitions later remaps keys.** The modulo changes, so most keys move to a new partition. Events for one customer can then be split across the old and new partition, and order between them is lost. In the lab, going from 12 to 16 partitions moves 75% of keys. Size partitions with headroom on day one.

## 3. Replication, ISR and what "acknowledged" means

Each partition has one **leader** replica and some **followers** on other brokers (`replication.factor`, typically 3 in production; the broker default `default.replication.factor` is 1, so set it). Followers fetch from the leader. A follower that keeps up stays in the **in-sync replica set (ISR)**; one that falls too far behind is removed from it.

The producer's `acks` decides when a write counts as done:

| setting | leader replies when | risk |
|---|---|---|
| `acks=0` | never waits | silent loss on any error |
| `acks=1` | leader has written it | lost if leader dies before followers copy it |
| `acks=all` (default) | every replica **currently in the ISR** has it | still lost if the ISR had shrunk to just the leader |

The catch in the last row is why `min.insync.replicas` exists. Its default is **1**, which means `acks=all` can succeed with only the leader holding the data. Set `min.insync.replicas=2` with replication factor 3: writes are rejected (`NotEnoughReplicas`) when fewer than two replicas are in sync, and no acknowledged write lives on a single disk. You trade some availability for durability, which is the right trade for orders and payments.

`unclean.leader.election.enable` defaults to `false`: Kafka won't promote an out-of-sync replica, because doing so silently drops whatever it was missing. The partition stays unavailable instead until an in-sync replica returns.

The producer is also **idempotent by default** (`enable.idempotence=true`): it numbers its batches, and the broker drops duplicates caused by retries. That removes duplicates from producer retries, not from your application sending the same event twice.

## 4. The high watermark

The **log end offset (LEO)** is the next offset a replica will write. The **high watermark (HW)** is the smallest LEO among the in-sync replicas: every in-sync copy has everything below it. **Consumers only see records below the high watermark.** In the diagram the leader has offsets 0 to 11, but broker 3 only has up to 9, so HW = 10 and consumers can read 0 to 9. Records 10 and 11 become visible as soon as broker 3 catches up.

This is what stops a consumer from reading a record that a leader failover would make disappear.

## 5. Consumer groups, offsets and rebalancing

All consumers sharing a `group.id` form a **consumer group**. Each partition is assigned to exactly one member, so a group scales up to the partition count and any extra members sit idle. Different groups each read the whole topic independently.

@@diagram:consumer-groups

Progress is stored as **committed offsets** in the internal `__consumer_offsets` topic, per group and partition. The committed offset is the *next* record to read. Commit after processing for at-least-once; commit before processing for at-most-once. The default `enable.auto.commit=true` commits on a timer, which can mark records done before your code finished them. Turn it off for pipelines that write to a database and commit explicitly after the write.

When there's no committed offset yet, `auto.offset.reset` decides where to start. The default is `latest`, which skips everything already in the topic. The 4.4 docs warn that `latest` can silently skip records written to newly added partitions before the consumer noticed them, and recommend the `by_duration:` option. New pipelines usually want `earliest`.

**Rebalancing** reassigns partitions when members join, leave or crash. With the classic protocol, a rebalance can pause the whole group. Kafka 4.0 made the **new consumer group protocol (KIP-848)** generally available: the broker drives assignment and moves only the partitions that need to move. Clients opt in with `group.protocol=consumer` (the client default in 4.4 is still `classic`).

### Queues for Kafka: share groups

A consumer group can't have more active readers than partitions, and one slow record blocks its partition. **Share groups** (KIP-932) let many consumers read the **same** partition cooperatively, with per-record acknowledgement and redelivery, like a work queue. They became production-ready in Kafka 4.2. Use them for job-queue workloads; keep classic consumer groups when you need per-key ordering.

## 6. KRaft: no more ZooKeeper

Since **Kafka 4.0, KRaft is the only mode; ZooKeeper support is removed.** Cluster metadata (topics, partitions, leaders, ISR) lives in an internal Raft-replicated log on **controller** nodes (`process.roles=controller`, or `broker,controller` on small clusters). Upgrading an old ZooKeeper cluster to 4.x means migrating to KRaft on a 3.x release first. Any course, blog or interview answer that says "Kafka uses ZooKeeper to elect controllers" describes the pre-4.0 world.

## 7. Exactly-once in Kafka, precisely

Idempotent producers stop duplicate writes from retries within one partition. **Transactions** (`transactional.id`) let a producer write to several partitions *and* commit consumer offsets atomically, which is how Kafka Streams and Flink get exactly-once for read-process-write loops inside Kafka. Consumers must set `isolation.level=read_committed` (the default is `read_uncommitted`) to skip aborted transactions. Once data leaves Kafka for a database or lake, exactly-once is your sink's job: idempotent upserts keyed by something stable.

## 8. Worked example: sizing an orders topic

A food-delivery app produces **40,000 order events per second at the dinner peak**, 1.5 KB each, about 1.2 billion events a day.

1. **Throughput.** Peak bytes in: 40,000 x 1.5 KB = 60 MB/s. With replication factor 3, the cluster writes 180 MB/s to disk, and replication traffic between brokers is 120 MB/s.
2. **Partitions.** Suppose a load test shows one consumer of your enrichment job handles 2,500 events/s. You need at least 16 consumers at peak; plan for 3x growth, so 48. Pick **48 partitions** (also comfortably within per-broker partition limits). Because adding partitions later remaps keys, you size for growth now.
3. **Key.** Key by `order_id`: every status change for one order stays ordered. Keying by `restaurant_id` would make a busy chain's partition a hot spot.
4. **Storage.** Average day is ~1.2B x 1.5 KB = 1.8 TB raw. Compression (lz4 or zstd) on JSON often gives 3-5x; take 4x, so 450 GB/day. Seven days retention x RF 3 = 450 x 7 x 3, about 9.5 TB of broker disk, plus 30% headroom: plan ~12.5 TB.
5. **Durability.** `acks=all`, `min.insync.replicas=2`, RF 3, brokers spread across three availability zones. One zone can fail and writes keep flowing; two failures and producers get errors instead of silent loss.

## 9. Hands-on lab (plain Python, no Kafka install)

This lab simulates the mechanics above. The partitioning function is Kafka's real murmur2; it was checked bit-for-bit against kafka-python's reference implementation on 10,000 random keys. Run `python labs/stream-kafka-internals.py`.

```python
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
```

Expected output (real run, 2026-11-03):

```text
1) Same key, same partition, every time
   customer_42  -> partition 0
   customer_42  -> partition 0
   customer_7   -> partition 10

2) 100,000 customer keys over 12 partitions: min 8185 max 8565

3) Grow the topic 12 -> 16 partitions: 74,700 of 100,000 keys (75%) now hash elsewhere.
   Their new events land in a different partition from their old ones, so per-key order
   across the change is no longer guaranteed. Pick partition counts with headroom up front.

4) Consumer group: each partition goes to exactly one member
    4 consumers -> 4 busy, 0 idle, max 3 partitions each
   14 consumers -> 12 busy, 2 idle, max 1 partitions each

5) Replication: what does 'acknowledged' mean?
   acks=1, min.insync.replicas=1: acked [10, 11]; leader's disk lost, broker 2 (has 0-9) takes over -> lost [10, 11]
   acks=all, min.insync.replicas=1: acked [10, 11]; leader's disk lost, broker 2 (has 0-9) takes over -> lost [10, 11]
   acks=all, min.insync.replicas=2: write 10 REJECTED (NotEnoughReplicas) -> producer retries later
   acks=all, min.insync.replicas=2: write 11 REJECTED (NotEnoughReplicas) -> producer retries later
   acks=all, min.insync.replicas=2: acked []; leader's disk lost, broker 2 (has 0-9) takes over -> lost []
   With unclean.leader.election.enable=false (the default) Kafka won't elect broker 2 by itself:
   the partition stays offline until broker 1 returns or an admin forces it. Only
   acks=all + min.insync.replicas>=2 never acknowledges a write that one lost disk can erase.

6) High watermark = smallest log-end offset among in-sync replicas
   log end offsets: {'broker1 (leader)': 12, 'broker2': 11, 'broker3': 10} -> high watermark 10 -> consumers can read offsets 0-9
```

What to look for:

- **Section 3**: 75% of keys move when partitions go from 12 to 16. This is the reason to size partitions up front.
- **Section 4**: 14 consumers on 12 partitions leave 2 idle.
- **Section 5**: `acks=all` alone did **not** protect the two writes, because the ISR had shrunk to the leader. With `min.insync.replicas=2` the writes were refused, which is the safe failure.
- **Section 6**: the high watermark is the slowest in-sync replica's log end offset.

**Run real Kafka (needs Docker, roughly 1 GB disk).** The official quickstart shows a single-node KRaft broker started from the `apache/kafka` Docker image, then `kafka-topics.sh --create`, `kafka-console-producer.sh` and `kafka-console-consumer.sh`. Use the quickstart for the current image tag. Try: create a 3-partition topic, produce keyed messages with `--property parse.key=true --property key.separator=:`, and run `kafka-consumer-groups.sh --describe --group <name>` to watch CURRENT-OFFSET, LOG-END-OFFSET and LAG change.

## 10. Gotchas

- **Hot partitions**: one key with a huge share of traffic (a celebrity user, a default `"unknown"` key) caps throughput at one partition. Spot it with per-partition lag.
- **Too many partitions** cost memory and file handles per broker and lengthen failover. Hundreds per topic is common; tens of thousands per cluster needs care.
- **Max poll interval**: a consumer that takes longer than `max.poll.interval.ms` between polls is kicked from the group, triggering a rebalance loop. Lower `max.poll.records` (default 500) for slow processing.
- **Retention is not a backup.** If a consumer is down longer than retention, the data is gone from Kafka. Land raw events in the lake.

## Sources

- Kafka 4.4 producer configs (acks, enable.idempotence, partitioner, batch.size, linger.ms): https://kafka.apache.org/44/configuration/producer-configs/
- Kafka 4.4 broker configs (log.segment.bytes, log.retention.hours, min.insync.replicas, unclean.leader.election.enable, process.roles): https://kafka.apache.org/44/configuration/broker-configs/
- Kafka 4.4 consumer configs (group.protocol, enable.auto.commit, auto.offset.reset, isolation.level, max.poll.records): https://kafka.apache.org/44/configuration/consumer-configs/
- Kafka 4.0 upgrade notes (ZooKeeper removed, KRaft only; KIP-848 GA): https://kafka.apache.org/40/getting-started/upgrade/
- Kafka 4.2.0 release announcement (share groups, KIP-932): https://kafka.apache.org/blog/2026/02/17/apache-kafka-4.2.0-release-announcement/
- Kafka downloads (4.4.0 current): https://kafka.apache.org/community/downloads/
- Kafka quickstart: https://kafka.apache.org/quickstart
