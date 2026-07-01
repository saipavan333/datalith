# Bloom filters: membership at scale — the complete guide

A Bloom filter answers "have I seen this?" in a **tiny bit array** with **no false negatives** and a tunable false-positive rate. Its DE superpower is letting systems **skip expensive work** — file reads, lookups, join probes — for keys that are **definitely absent**. It's built into LSM-trees, Parquet/Delta, and query engines' runtime filters. This chapter covers how it works and where it pays off.

@@diagram:dsa-bloom

## 1. What it is

A **Bloom filter** is a space-efficient probabilistic structure for **set membership**. It answers **"is x in the set?"** with **"definitely not"** or **"maybe yes"**, using a fraction of the memory an exact set would.

## 2. How it works

- A **bit array** of m bits and **k hash functions**.
- **add(x):** compute k hashes of x → set those k bits to 1.
- **query(y):** compute the same k hashes → if **any** bit is **0**, y is **definitely not** present (it would have set those bits); if **all k** are **1**, y is **maybe** present (the bits could have been set by other elements — a false positive).

## 3. The guarantees

- **No false negatives** — "not present" is **certain**.
- **Tunable false positives** — "maybe present" can be wrong; the rate depends on **m** (bits), **k** (hashes), and **n** (elements). More bits → fewer false positives (formula: optimal k ≈ (m/n)·ln2).
- **No deletes** in a standard Bloom (shared bits) — use a **Counting Bloom filter** for deletes.
- **O(k)** per op, **tiny memory** (bits, not keys).

## 4. The DE pattern: skip expensive work for absent keys

The value is **avoiding a costly operation when the answer is definitely no**:

- **LSM-trees / storage engines** (Cassandra, HBase, RocksDB) keep a **Bloom filter per SSTable**; a point lookup checks the filter and **skips reading the file** if the key is definitely absent — huge I/O savings.
- **Parquet / Delta** support **Bloom filters per row group / column** to skip blocks that can't contain a value.
- **Join pruning / runtime filters** — build a Bloom filter of one side's join keys and push it to the other side's scan to **skip rows that can't match** (Spark dynamic filters, BigQuery, etc.).
- **Deduplication at scale** — bounded-memory "have I seen this id?" (approximate, or as a pre-filter before an exact check).
- **Cache/DB pre-check** — "is this key possibly present?" before a slow lookup.

## 5. Sizing & tuning

- Choose **m** and **k** for a target false-positive rate at expected **n** (e.g. 1% FPR needs ~9.6 bits/element, k≈7).
- Too small → high FPR (wasted reads); too big → wasted memory.
- For growth/deletes, consider **Counting** or **Scalable** Bloom variants.

## 6. Relation to the toolkit

Bloom = **membership**. Its siblings: **HyperLogLog** = **distinct count**, **Count-Min Sketch** = **frequencies**. Together they're the **probabilistic, bounded-memory** toolkit for big data.

## 7. Gotchas

- **Treating "maybe" as "yes"** — it can be a false positive; for exactness, follow up with a real check.
- **Expecting deletes** — standard Bloom can't delete; use Counting Bloom.
- **Undersized filter** — too few bits → high FPR → many wasted reads; size for n.
- **Using it where exact membership fits in memory** — a real hash set is simpler then.
- **False negatives assumed** — there are none; never skip a "maybe" file/row (correctness relies on no false negatives).
- **Hash quality** — needs independent-ish hashes; rely on the engine's implementation.

## Scenario — skipping nearly all the reads

An LSM-tree store keeps a **Bloom filter per file**. A point lookup for `key=X` checks each file's filter: files whose filter says **"definitely not"** are **skipped with no disk read**; only **"maybe"** files are read. Since X lives in **very few** files, the filters eliminate the **vast majority** of reads — many files become a handful. The cost is the occasional **false positive** that reads a file not containing X — rare and cheap versus the reads avoided, and there are **no false negatives** so it never wrongly skips a file that has X. The same idea drives **runtime join filters**: build a Bloom of the small side's keys, push it to the big side's scan, skip non-matching rows. A few kilobytes of bits save enormous I/O — the Bloom filter's whole reason for being.

## Practice

1. How does a Bloom filter represent a set, and how do add/query work?
2. What does it guarantee (no false negatives) and not (false positives, deletes)?
3. How is the false-positive rate tuned (m, k, n)?
4. Give the canonical DE uses (LSM/Parquet file skipping, join pruning, dedup, cache pre-check).
5. Why does per-file Bloom filtering speed up point lookups, and what's the cost?
6. How do you dedup a massive stream with a Bloom filter, and what's the caveat vs an exact set?
7. How does Bloom relate to HyperLogLog and Count-Min Sketch?
