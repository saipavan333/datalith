# Redshift distribution styles (KEY/ALL/EVEN/AUTO) — the complete guide

Distribution is the **single biggest performance lever** in Redshift. It decides which **slice** each row lives on, which decides whether a join runs **locally** or triggers an expensive **network shuffle**. Get it right and big joins fly; get it wrong and you shuffle billions of rows or overload a few slices. This chapter is the full decision guide.

@@diagram:aws-redshift-distribution

## 1. Why distribution matters

Redshift spreads data across **slices** and processes them in parallel. A join is fastest when the **matching rows of both tables are on the same slice** (co-located) — each slice joins **locally**, no network movement. If matching rows are on **different slices**, Redshift must **redistribute** (shuffle) data across the network so they meet — the dominant cost in many slow queries. **Distribution style** controls placement, so it controls this.

## 2. The four styles

### KEY
Rows are placed by the **hash of a distribution-key column**, so **all rows with the same key value land on the same slice**. Distribute **two large tables on their common join key** and matching rows are **co-located** → local join, no shuffle.
- **Use for:** large fact ↔ large dimension joined on a known key.
- **Requires:** a **high-cardinality, evenly distributed** key (else skew).

### ALL
A **full copy of the table is stored on every node**, so any join against it needs **no redistribution** (every slice has the whole table).
- **Use for:** **small dimension** tables — the replication cost (storage × nodes, slower writes) is acceptable and you save shuffles on every join to it.
- **Avoid for:** large tables (replication too expensive).

### EVEN
Rows are spread **round-robin** across slices, ignoring values — balanced storage but joins likely need redistribution.
- **Use for:** **staging** tables, or tables with **no clear join key**.

### AUTO (default)
Redshift **chooses and adapts** the style based on table size (e.g. small tables start **ALL**, growing to **EVEN/KEY**). A sensible **default**; override when you know the workload better.

## 3. Choosing — the decision guide

| Situation | Style |
|---|---|
| Large fact ↔ large dim on a key | **KEY** on the join column (both tables) |
| Small dimension joined to many facts | **ALL** (replicate) |
| No dominant join key / staging | **EVEN** |
| Unsure / evolving | **AUTO** |

You can have **one DISTKEY per table**, so distribute on the **most important/expensive** join.

## 4. Distribution skew — the KEY pitfall

A **bad DISTKEY** (low-cardinality or value-skewed) hashes a disproportionate share of rows onto a **few slices** — **distribution skew**. Those slices do most of the work while others idle, so the cluster is bottlenecked despite having capacity (like Spark data skew). Pick a key that is both a **join key** *and* **high-cardinality / evenly distributed**. Diagnose with `SVV_TABLE_INFO` (skew metrics).

## 5. Verifying

- `EXPLAIN` — look for `DS_DIST_*` / `DS_BCAST_INNER` steps indicating redistribution/broadcast of large tables (bad for big joins).
- `SVV_TABLE_INFO` — distribution style, skew, and sort info per table.
- Aim for big joins to show **no large-table redistribution** and slices to be **balanced**.

## 6. Gotchas

- **Non-co-located big join** → shuffle; distribute both tables on the join key.
- **DISTKEY on a skewed/low-cardinality column** → distribution skew; pick high-cardinality even keys.
- **ALL on a large table** → bloats storage and slows writes; only for small dims.
- **One DISTKEY per table** → choose the most important join.
- **Ignoring AUTO** → AUTO is a fine default; only override with knowledge.
- **Distribution without sort keys** → still scans too much; pair with sort keys (next lesson).

## Scenario — a star schema that joins locally

A billion-row `sales` fact joins a 500-million-row `customers` table on `customer_id`, and both also join a tiny 200-row `country` dim. The team sets **`DISTKEY(customer_id)` on both `sales` and `customers`**, so rows with the same `customer_id` are **co-located** on the same slice — the heavy billion-row join runs **locally with no shuffle**. `customer_id` is **high-cardinality and even**, so no slice is overloaded. They set **`country` to `DISTSTYLE ALL`** so its 200 rows sit on **every node** — joining it needs no redistribution. `EXPLAIN` confirms the big join has **no large-table `DS_DIST`** step, and `SVV_TABLE_INFO` shows low skew. A naive **EVEN** distribution would have **shuffled a billion rows** across the network on every run. The right distribution — **KEY the big-to-big join, ALL the small dims** — is what makes the warehouse fast.

## Practice

1. Why does distribution determine whether a join is local or needs a shuffle?
2. Explain each style (KEY/ALL/EVEN/AUTO) and its ideal use.
3. Design distribution for a star schema (huge fact, one large dim, several tiny dims).
4. What is distribution skew, what causes it, and how do you fix it?
5. How do you verify distribution is working (EXPLAIN, SVV_TABLE_INFO)?
6. Why is ALL good for small dimensions but bad for large tables?
7. After choosing a DISTKEY, some slices are overloaded — diagnose and fix.
