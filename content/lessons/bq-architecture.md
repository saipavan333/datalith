# BigQuery architecture: Dremel, slots & separated storage/compute — the complete guide

Every BigQuery cost, optimization, and "why is there no cluster?" question flows from one design: **serverless separation of storage and compute**, with queries running on **Dremel slots** over the **Jupiter network**. Understand the architecture and the rest of BigQuery clicks into place. This chapter is that foundation.

@@diagram:bq-architecture

## 1. What BigQuery is

**BigQuery** is Google's **serverless** data warehouse — built to run large analytical SQL over petabytes with **no infrastructure to provision**. It achieves this by **decoupling storage from compute** and executing queries on the **Dremel** engine.

## 2. Storage: Colossus + Capacitor

Table data lives in **Colossus**, Google's distributed file system, stored in **Capacitor** — a **columnar**, compressed format with per-column statistics. Properties:
- **Columnar** → queries read **only referenced columns** (huge I/O savings vs row storage).
- **Compressed + statistics** → fewer bytes, and metadata for skipping.
- **Durable & replicated**, and **cheap** (storage priced per GB, with a **long-term** discount for untouched data).
- **Scales independently** of compute — storing petabytes doesn't require running compute.

## 3. Compute: Dremel slots

A query runs on **slots** — BigQuery's unit of compute (a virtual worker / share of CPU+memory). The **Dremel** engine:
- **Dynamically allocates thousands of slots** to a query.
- Executes the query as a **massively parallel tree of stages**.
- **Releases** the slots when done.
There's **no cluster** to size, warm, or resize — compute is **elastic per query** (on-demand) or drawn from a **reserved slot pool** (capacity pricing).

## 4. Jupiter network

Separating storage and compute only works if compute can read storage **fast enough**. Google's **Jupiter** petabit-scale network connects slots to Colossus with enough bandwidth that the separation **isn't a bottleneck** — slots stream columnar data from Colossus and **shuffle** intermediate results between stages over Jupiter. This network is the **enabling technology** for the serverless, decoupled model.

## 5. How a query executes

1. SQL is parsed and the engine builds a **distributed execution plan** (a tree of **stages**).
2. **Slots** execute stages in parallel, reading **only needed columns** (and pruned partitions/blocks) from Capacitor.
3. Intermediate data is **shuffled** between stages over Jupiter.
4. Results are assembled and returned; slots are released.
**Partitioning/clustering** and **column pruning** reduce what slots read (next lessons).

## 6. Why separation matters

- **Independent scaling** — cheap petabyte storage + elastic per-query compute; **no idle compute** attached to storage.
- **Serverless** — no nodes, no capacity planning, no resizing.
- **Concurrency** — many queries draw slots from a shared pool or your reservation.
- **Cost model** follows: **per-TB scanned** (on-demand) or **per-slot** (capacity) — and optimization is **data layout**, not cluster tuning.

## 7. Contrast with coupled warehouses

Classic warehouses tie compute + storage to **fixed nodes**: provision for peak, pay whether idle or busy, resize by moving data. BigQuery instead lets storage and compute **scale separately**, eliminating capacity planning and idle-compute cost — a fundamentally different model.

## 8. Gotchas

- **No cluster to tune** — don't look for node/cluster knobs; optimize **bytes scanned** via layout/SQL.
- **Accidental big scans** — serverless makes it easy to scan terabytes; use pruning + guardrails (pricing lesson).
- **Shuffle on big joins** — heavy shuffles cost slot time; denormalize/broadcast (optimization lesson).
- **Slot contention** — on-demand draws from a shared pool; heavy concurrency may need a reservation.
- **Streaming vs storage** — freshly streamed data has its own path (loading lesson).
- **Storage is cheap, compute is the variable** — focus cost effort on compute (scanned data).

## Scenario — a 50 TB query with no cluster

An analyst runs a query over a **50 TB** table. BigQuery allocates **thousands of slots**, which read **only the referenced columns** from **Capacitor** on **Colossus** (skipping the rest), **shuffle** intermediate results over **Jupiter**, and return the answer in seconds — then **release** the slots. The 50 TB sat **cheaply on Colossus** whether or not anyone queried it; compute appeared **only for the query** and vanished after. **No node** was provisioned, sized, or left idle. Every BigQuery behavior the analyst relies on — instant scale, per-TB billing, "just write SQL," optimize by scanning less — is a direct consequence of this **serverless separated-storage/compute + Dremel slots** architecture. Master it and BigQuery's pricing and tuning become obvious.

## Practice

1. What are the two halves of BigQuery's architecture, and what does each do?
2. What is Capacitor/Colossus, and why does columnar storage matter?
3. What is a slot, and how does Dremel use slots to run a query?
4. What role does the Jupiter network play, and why is it essential?
5. Walk through how a query executes from SQL to results.
6. Why does separation enable independent scaling and a serverless model?
7. Given the architecture, why is optimization about scanning less rather than tuning a cluster?
