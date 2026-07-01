# Performance tuning with the Spark UI — the complete guide

Spark tuning is **diagnose, then fix** — not sprinkling `.cache()` and `.repartition()` and hoping. Almost every slow job is one of four things: **skew, spill, shuffle, or small files**. The **Spark UI** tells you which. This chapter teaches you to read the UI, recognize each problem, and apply the matching fix — the skill that separates someone who *uses* Spark from someone who *runs it well*.

@@diagram:dbx-perf

## 1. Read the Spark UI first

Open the **Spark UI** (or Query Profile for SQL) for the run and find the **slowest stage**, then look at its **tasks**:

| Symptom in the UI | Likely problem |
|---|---|
| **One task** runs 5–50× longer than the rest | **Data skew** (a straggler partition) |
| Tasks show **spill (memory/disk)** | Partitions **too big for memory** |
| Large **shuffle read/write** bytes | Expensive **shuffle** (wide transformation) |
| **Thousands of tiny tasks** / huge input file count | **Small files** / over-partitioning |
| Very **few huge tasks**, idle cores | **Under-parallelized** |

The **SQL tab** shows the physical plan: look for unexpected **shuffles (Exchange)**, a join that **stopped broadcasting** (SortMergeJoin on a small table), or missing pruning.

## 2. Skew — the straggler

**Cause:** an uneven key distribution (one `customer_id`/`null` dominates), so one partition is huge and its task lags while others finish.

**Fixes:**
- **Enable AQE** — its **skew-join** optimization detects and **splits** oversized partitions automatically. This handles most skew with no code change.
- **Salt** the hot key: add a random suffix to spread it across partitions, aggregate, then combine.
- **Pre-aggregate** or filter the skewed value (e.g. handle `null` separately).
- **Broadcast** the other side if it's small (avoids the shuffle entirely).

## 3. Spill — partitions too big

**Cause:** a partition doesn't fit in executor memory, so Spark **spills** to disk (slow).

**Fixes:**
- **More shuffle partitions** (so each is smaller) — or let **AQE coalesce** dynamically.
- **More/bigger-memory** workers.
- Avoid **exploding** joins (a bad join key multiplying rows); fix the join condition.
- Reduce data **before** the heavy step (filter/project early).

## 4. Shuffle — the expensive wide op

**Cause:** joins, `groupBy`, `distinct`, `repartition` **reshuffle** data across the network — a stage boundary and often the bulk of runtime.

**Fixes:**
- **Broadcast the small side** (`broadcast(df)`, or let AQE auto-broadcast under the threshold) — turns a shuffle join into a map-side join.
- **Filter and project early** to shuffle less data.
- **Pick good join keys**; avoid unnecessary `distinct`/`repartition`.
- **Pre-aggregate** before a join where possible.

## 5. Small files / over-partitioning

**Cause:** many tiny files (streaming, over-partitioning) → thousands of tiny tasks, listing overhead, poor skipping.

**Fixes:**
- **`OPTIMIZE`** (compaction) + **clustering** (data skipping) on the source table.
- Enable **optimizeWrite/autoCompact** so writes produce right-sized files.
- Tune `spark.sql.shuffle.partitions` or rely on **AQE coalesce**.
- Don't **over-partition** (e.g. by high-cardinality columns).

## 6. Caching — only when reused

`cache()/persist()` materializes a DataFrame in memory for **reuse**. It helps **only** when the same DataFrame is used **multiple times** (e.g. iterative algorithms, a base used by several outputs). Caching a once-used DataFrame **wastes memory**, can cause **eviction/spill** that slows other stages, and adds materialization cost. Cache deliberately; **unpersist** when done.

## 7. Let AQE and Photon do the heavy lifting

- **Adaptive Query Execution (AQE)** re-optimizes at **runtime** from actual statistics: **coalesces** shuffle partitions, switches to **broadcast joins**, and **splits skewed** partitions — eliminating much manual tuning. Ensure it's **on**.
- **Photon** speeds execution outright (vectorized C++). Enable both **before** hand-tuning; they often resolve skew/shuffle/partition issues for you.

## 8. The tuning loop

1. **Reproduce** on representative data.
2. **Open the Spark UI**, find the slow stage and **why** (skew/spill/shuffle/small files).
3. Apply the **matching** fix (one change at a time).
4. **Re-measure**.
5. **Stop** when it meets the SLA — don't over-tune.

## 9. Gotchas

- **Don't guess** — blanket `.repartition()`/`.cache()` often makes things **slower**; diagnose first.
- **`.repartition()` forces a shuffle** — only use it to fix a real partitioning problem.
- **`collect()` to the driver** on big data OOMs the driver — aggregate/write distributed.
- **A sudden regression** usually means a **data change** (new skewed key, small-file flood) — check inputs.
- **AQE off** leaves easy wins on the table — confirm it's enabled.
- **Over-tuning** past the SLA wastes engineering time.

## Scenario — a 25-minute join cut to 3

A join-heavy job slows to 25 minutes. The engineer opens the **Spark UI**: the join stage has **one task taking 10× the others** (classic **skew** on a hot `customer_id`) and a **large shuffle** because the dimension side stopped broadcasting (it grew just past the threshold). Two targeted fixes: (1) confirm **AQE is on** so its **skew-join** splits the giant partition automatically; (2) **broadcast** the dimension explicitly (`broadcast(dim)`) to eliminate the shuffle. Runtime drops to **3 minutes**. No random `.cache()`/`.repartition()` — the UI pointed straight at **skew + an avoidable shuffle**, and the matching fixes solved it. (Post-mortem: the regression coincided with a data change that introduced the hot key — exactly the usual cause of sudden slowdowns.)

## Practice

1. What four problems cause most Spark slowness, and what's each one's signature in the Spark UI?
2. How do you diagnose and fix data skew (name three approaches)?
3. Why does broadcasting the small side of a join help, and when does it apply?
4. What causes spill, and how do you address it?
5. When does `cache()` help, and when does it hurt?
6. What does AQE do automatically, and why enable it (and Photon) before hand-tuning?
7. A job suddenly runs 4× slower — outline your diagnosis using the UI and the most likely root cause.
