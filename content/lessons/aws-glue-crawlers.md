# Crawlers: schema & partition inference — the complete guide

Crawlers are the easy button for cataloging S3 data — and one of the most **over-used** features in AWS data engineering. They're great for discovery and genuinely unknown schemas, but for stable production tables they often cost more, add latency, and mis-infer types compared to simply defining the table yourself. This chapter teaches when to crawl and when not to.

@@diagram:aws-glue-crawlers

## 1. What a crawler does

A **crawler** points at an S3 path (or JDBC source) and automatically:
1. Uses **classifiers** to detect the **format** (Parquet/ORC/JSON/CSV/Avro built-in; custom Grok/regex for odd formats).
2. **Samples files** to **infer the schema** (column names and types).
3. **Discovers Hive-style partitions** (`year=/month=/`) and registers them.
4. **Creates or updates** the Data Catalog table.

It runs **on-demand**, on a **schedule**, or via a **trigger/EventBridge** after data lands, and supports **incremental** crawls (only new folders) to limit cost.

## 2. Configuration that matters

- **Classifiers** — order matters; custom classifiers pin parsing for non-standard formats.
- **Schema-change policy** — control what happens when schema changes: **update** the table, **add new columns only**, or **ignore** changes. Set this to avoid destructive re-inference (see gotchas).
- **Partition-change policy** — add/remove partitions.
- **Incremental crawls** — crawl only new sub-folders.
- **Sampling** — limit files sampled for speed (at the risk of missing variety).
- **Table grouping** — combine compatible schemas under one table or keep separate.

## 3. When crawlers shine

- **Unknown or evolving** schemas you **don't control** (third-party feeds).
- **Exploratory** cataloging — quickly make a new dataset queryable to investigate.
- Sources where structure **genuinely changes** and auto-detection saves real effort.

## 4. When to avoid them (the key judgment)

Crawlers have real costs:
- **Money & latency** — they run compute over S3; frequent crawls of large datasets add cost and a delay before data is queryable.
- **Type mis-inference** — sampling can guess **wrong** (string vs bigint, timestamp formats, decimals), and **flip types across runs** if data is inconsistent, breaking downstream queries.
- **Schema merging surprises** — pointing a crawler at mixed schemas can produce a messy, merged table.
- **Wasteful re-crawls** — re-running a crawler just to register one new partition is overkill.

For **stable, known schemas** (your own pipelines), prefer:
- **Explicit DDL once** (`CREATE EXTERNAL TABLE …`) or **IaC** — deterministic, version-controlled.
- **`ALTER TABLE ADD PARTITION`** (or a tiny **Lambda** on object-created events) to register new partitions.
- **Athena partition projection** — Athena **computes** partitions from a configured pattern, so **no crawler and no `ADD PARTITION`** are needed at all; new data is queryable instantly.

## 5. Decision rule

> **Crawl for discovery/unknown schemas; use DDL + partition projection for stable production tables.**

This avoids recurring crawl cost/latency and the classic "the crawler changed my column type overnight" incident.

## 6. Best practices

- **One crawler per dataset/prefix** with a **single consistent schema** — never aim a crawler at mixed schemas.
- Set the **schema-change policy** so the crawler can't silently overwrite types (add-only / ignore).
- Use **incremental** crawls and reasonable schedules.
- Pin types with **custom classifiers** or **explicit DDL** when inference is shaky.
- For evolving schemas you control, adopt a **table format (Iceberg)** with managed schema evolution instead of crawler guessing.

## 7. Gotchas

- **Type flip across runs** — inconsistent data → different inferred types each crawl → broken queries. Pin via DDL/classifier or add-only policy.
- **Crawl cost on big lakes** — frequent full crawls are expensive; go incremental or skip.
- **Latency before queryable** — crawls take time; projection makes data queryable immediately.
- **Mixed-schema prefix** → merged/garbled table; separate prefixes.
- **Over-reliance** — many teams crawl when DDL + projection would be cheaper and deterministic.

## Scenario — replacing a nightly crawler with projection

A team ran a **crawler every hour** over a growing orders lake just to pick up new daily partitions. It cost real money, added a lag before fresh data was queryable, and **occasionally re-inferred** the `amount` column from `double` to `string` when a malformed file slipped in — breaking dashboards. They switched to the deterministic path: **define the table once** with explicit DDL (fixed schema, Parquet SerDe) and enable **Athena partition projection** keyed on the `year/month/day` path pattern. Now new days are queryable **instantly** with **no crawler runs** (cost gone, latency gone) and the **schema is pinned** (no surprise type flips). They kept a crawler only for a genuinely **unknown** third-party feed they're still exploring. The judgment — crawl for discovery, DDL+projection for stable tables — saved cost and eliminated the type-drift incidents.

## Practice

1. Walk through what a crawler does, step by step.
2. Which configuration options control schema/partition changes and cost?
3. When are crawlers the right tool?
4. List the downsides of crawlers and the alternatives for stable schemas.
5. What is partition projection and why can it replace a crawler entirely?
6. State the crawl-vs-DDL decision rule and justify it.
7. A crawler keeps flipping a column's type and breaking queries — diagnose and fix.
