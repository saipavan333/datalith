# B-tree vs LSM-tree: the two storage engines — the complete guide

Behind every database index and key-value store is a **storage engine**, and there are two dominant designs making **opposite trade-offs**: the **B-tree** (read-optimized, update-in-place) and the **LSM-tree** (write-optimized, append + compact). Understanding them explains why a database is fast at reads or writes, why LSM stores use Bloom filters, and why lakehouse tables append files and need `OPTIMIZE`. This chapter covers both and the trade-off.

@@diagram:dsa-btree-lsm

## 1. Why this matters

Choosing or understanding a data store often comes down to **read amplification vs write amplification** — the core trade-off these two engines embody. It explains OLTP vs ingest performance, and the lakehouse's design.

## 2. B-tree (read-optimized, update-in-place)

A **B-tree / B+tree** is a **balanced tree** on disk in fixed-size **pages** with a **high branching factor**, so it's **shallow** — **O(log n)** lookups with few seeks. It **updates in place**: changing a value writes the page where it lives (a **random write**, plus a write-ahead log).

- **Great reads** — point lookups and **range scans** (leaf pages are linked) — why B-trees back **OLTP/relational** indexes.
- **Random writes** — scattered in-place updates cause **random I/O** and **write amplification** (a small change rewrites a page + WAL).
- **Used by:** PostgreSQL, MySQL/InnoDB, most RDBMS; the default for **SQL indexes**.

## 3. LSM-tree (write-optimized, append + compact)

A **Log-Structured Merge tree** buffers writes in an in-memory **memtable** (often backed by a WAL for durability); when full it **flushes** an immutable, **sorted run (SSTable)** to disk — a **sequential write**. Background **compaction** merges runs to limit their number and reclaim space; **deletes are tombstones** applied during compaction.

- **Fast writes** — sequential (append memtable → flush sorted run), great for **high write throughput** and SSDs.
- **Reads merge runs** — a lookup checks the memtable + several SSTables (newest first); **per-SSTable Bloom filters** skip files that can't contain the key, and compaction keeps run counts down — reads are good but involve **merging**.
- **Amplification from compaction** — write/space amplification comes from rewriting during compaction (not in-place updates).
- **Used by:** Cassandra, RocksDB, HBase, LevelDB, ScyllaDB.

## 4. The fundamental trade-off

| | B-tree | LSM-tree |
|---|---|---|
| Write path | Update **in place** (random) | **Append** sorted runs (sequential) |
| Optimized for | **Reads** (lookups, range scans) | **Writes** (high ingest) |
| Reads | Direct (O(log n)) | Merge runs (+ Bloom filters) |
| Amplification | Write (random in-place) | Write/space (compaction) |
| Fits | OLTP, read-heavy, range scans | Write-heavy, time-series, ingest |

Neither is universally better — **pick by workload**.

## 5. The lakehouse is LSM-like

Delta/Iceberg/Hudi tables are **LSM-like at the table level**: **writes append** new immutable **Parquet files** (fast, no in-place rewrite); **updates/deletes** use **tombstones / deletion vectors / merge-on-read**; **reads merge** data + delete files (with min/max stats + Bloom filters to skip files); and **compaction (`OPTIMIZE`)** keeps file counts down, with **`VACUUM`** reclaiming tombstoned files. This is exactly the LSM append+compact pattern — which is why those maintenance operations exist.

## 6. Gotchas

- **Write-heavy on a B-tree** — random-write amplification hurts; LSM ingests better.
- **Read-heavy point/range on raw LSM** — many SSTables → read amplification; rely on Bloom filters + compaction (and consider B-tree for OLTP).
- **Neglecting LSM/lake compaction** — too many SSTables/small files degrade reads; compact (`OPTIMIZE`).
- **Tombstones** — deletes aren't free; they linger until compaction/VACUUM.
- **Assuming one is "modern/better"** — it's a workload trade-off.
- **Range scans on a hash/LSM** without sorted runs — B-tree leaves or LSM sorted SSTables enable ranges; pure hashing can't.

## Scenario — three engines, one trade-off

A **high-ingest time-series store** (Cassandra/RocksDB) uses an **LSM-tree**: millions of writes/sec append to the memtable and flush as **sorted SSTables** (sequential, fast); **compaction** merges them and **Bloom filters** make point reads skip irrelevant SSTables. A **transactional RDBMS** (Postgres/MySQL) uses a **B-tree** index: **in-place page updates** for the efficient **point lookups and range scans** OLTP needs, accepting random writes. A **lakehouse table** (Delta/Iceberg) is **LSM-like**: it **appends Parquet files** (fast writes), deletes via **tombstones/merge-on-read**, and runs **`OPTIMIZE`** to compact — needing the same compaction maintenance as an LSM with too many SSTables. The same **read-optimized in-place vs write-optimized append+compact** trade-off appears across all three. Recognizing it lets you choose stores and explain their performance — exactly what DE system-design discussions probe.

## Practice

1. What is a B-tree, and why is it read-optimized? What's the write cost?
2. How does an LSM-tree achieve fast writes (memtable → SSTable → compaction)?
3. Why do LSM reads merge runs and use Bloom filters?
4. State the read-amplification vs write-amplification trade-off.
5. Which engine for write-heavy time-series vs read-heavy OLTP, and why?
6. How is a lakehouse table format LSM-like, and what maintenance does that imply?
7. What goes wrong if you neglect compaction in an LSM or lake table?
