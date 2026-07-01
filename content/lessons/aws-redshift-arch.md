# Redshift architecture: leader, compute nodes & slices — the complete guide

Every Redshift tuning decision — distribution keys, sort keys, why a join is slow — flows from its **physical architecture**. Learn how data is laid out across **slices** and processed in **parallel (MPP)**, and the rest of the module becomes obvious. This chapter is that foundation.

@@diagram:aws-redshift-arch

## 1. What Redshift is

**Amazon Redshift** is a **columnar, massively-parallel-processing (MPP)** cloud data warehouse — built to run large analytical SQL (scans, joins, aggregations) over big tables fast, by **distributing data and work across many slices**.

## 2. Leader node + compute nodes

- **Leader node** — the coordinator. It parses SQL, **builds and optimizes the query plan**, distributes steps to compute nodes, and **aggregates** their partial results into the final answer. It stores **no user data**.
- **Compute nodes** — the workers. They **store the data** and **execute query steps in parallel**. More/bigger compute nodes = more parallelism and storage.

## 3. Slices

Each compute node is divided into **slices** (roughly one per CPU core, with a share of memory and storage). **Data is distributed across all slices**, and **each slice processes its own portion** of the data simultaneously. So:

- **Parallelism** = total number of slices.
- **Balance** depends on **how evenly data is spread** across slices (distribution).
- **Joins** are fast when matching rows are on the **same slice** (no network movement) and slow when they must be **redistributed**.

This is why **distribution style** (next lesson) is the top performance lever.

## 4. Columnar, compressed storage

Redshift stores data **by column**, in **1 MB blocks**, **compressed** with per-column encodings. Benefits:

- Analytical queries read **only the columns** they reference — far less I/O than row storage.
- Compression shrinks bytes read.
- Each block carries **min/max metadata (zone maps)** so the engine can **skip blocks** that can't match a filter (sort-key lesson).

## 5. RA3 & Redshift Managed Storage

Modern **RA3** node types **separate compute from storage**:

- Data lives in **Redshift Managed Storage (RMS)**, backed by **S3**, with local SSD as a cache.
- You **scale compute independently** of storage — resize without migrating all the data, and pay for storage separately.
- (Older **DC2** nodes couple compute + local SSD, so resizing means moving data.)

This makes scaling **elastic** (e.g. add compute for month-end, scale back after).

## 6. MPP query execution

A query is compiled into a series of **steps**. The leader distributes them; each slice runs its step on its local data. Between steps, data is **redistributed (shuffled)** across slices **only when required** — e.g. a join where matching rows aren't co-located, or an aggregation needing a re-partition. Redistribution uses the **network**, the slowest resource, so good design **minimizes** it. Final partial results return to the leader for assembly.

## 7. How this drives tuning

- **Distribution** — place rows so joins are **local** and slices are **balanced** (avoid shuffles and skew).
- **Sort keys** — order rows so **zone maps skip blocks** (less I/O).
- **Compression** — read fewer bytes/columns.
- **RA3** — scale compute to the workload.
Everything is "spread across slices, process in parallel, **avoid network movement and skew**."

## 8. Gotchas

- **Joining on non-co-located keys** → network redistribution (slow); fix with distribution.
- **Distribution skew** → some slices overloaded, others idle; pick even keys.
- **`collect`-style huge result to leader** isn't the model — Redshift aggregates, but returning massive result sets is slow.
- **DC2 vs RA3** — RA3 for decoupled, elastic storage; don't assume local-SSD coupling.
- **Too few slices for the data** → under-parallelized; size compute appropriately.
- **Row-by-row DML** fights the columnar/MPP design (loading lesson).

## Scenario — why a join is fast or slow

A 4-node RA3 cluster has 16 slices. A billion-row `sales` fact is distributed across all 16, so a scan runs **16-way parallel**. Joining it to `customers`: if `customers` is distributed **compatibly** (same key) or **replicated**, each slice joins **locally** — fast. If not, Redshift must **redistribute** rows so matching keys meet on the same slice — a network shuffle of huge tables that dominates runtime. The **leader** planned it, the **slices** executed in parallel, results **aggregated** back. Because storage is **RA3 managed (S3-backed)**, the team scaled compute up for quarter-end without migrating data. Every observation — parallel scan speed, join cost, elastic scaling — is a direct consequence of the **slice-based MPP + RA3** architecture, which is exactly why the next lessons (distribution, sort keys) are the levers that matter.

## Practice

1. Describe the roles of the leader node and compute nodes.
2. What are slices, and how do they relate to parallelism and join performance?
3. Why is columnar + compressed + zone-mapped storage good for analytics?
4. What does RA3 / Redshift Managed Storage change versus older coupled nodes?
5. When does Redshift redistribute (shuffle) data, and why is it the cost to avoid?
6. Explain why a join on different distribution keys can be slow, using the architecture.
7. How does RA3 let you scale compute for a periodic peak without a migration?
