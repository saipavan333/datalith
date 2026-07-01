# Capstone — an end-to-end Snowflake platform

This chapter ties the whole course together: how ingestion, modeling, compute, governance, performance, recovery, sharing, and AI compose into one production platform — plus the build order and the decisions a data engineer actually makes.

@@diagram:snow-capstone

## 1. The reference architecture

```text
SOURCES        INGEST                     MODEL (DB/schema)            SERVE
files/S3  ──▶  Snowpipe / COPY      ──▶                               ──▶ BI (Snowsight/Looker)
streams   ──▶  Snowpipe Streaming   ──▶  raw → staging → marts        ──▶ Snowpark / Cortex (ML/AI)
apps/CDC  ──▶  Datastream→stage     ──▶  (VARIANT + relational)       ──▶ Secure Data Sharing
                                          Dynamic Tables / streams+tasks
  GOVERN: RBAC + masking + row policies + tags    TUNE: clustering + caches + MVs
  RECOVER: Time Travel + zero-copy clone          COST: per-workload warehouses + resource monitors
```

## 2. Ingest — match the method to the latency

| Need | Method |
|---|---|
| Periodic file batches | **COPY INTO** (on a task) |
| Files arriving continuously (minutes) | **Snowpipe** (auto-ingest) |
| Rows, seconds latency | **Snowpipe Streaming** |
| Incremental transform, declarative | **Dynamic Tables** |
| Incremental CDC, full control | **Streams + Tasks** |

Land raw (often **VARIANT**) immutably so any logic bug is fixed by **rebuilding** downstream, never re-pulling from sources.

## 3. Model — raw → staging → marts

Organize **databases → schemas** in layers: `raw` (as-ingested, VARIANT + metadata), `staging` (cleaned, deduped, typed), `marts` (star schemas / business aggregates / features). Build the transforms with **Dynamic Tables** (declarative, incremental) or **streams + tasks** (when you need fine control). Keep raw the source of truth.

## 4. Compute — a warehouse per workload

Isolate workloads on independent warehouses over the **same** data: `LOAD_WH`, `ETL_WH`, `BI_WH` (multi-cluster for concurrency). **Auto-suspend** everything; cap spend with **resource monitors**. Scale **up** for heavy single queries, **out** for many users.

## 5. Govern — least privilege + policies

Custom **functional/access role** hierarchy under SYSADMIN (never ACCOUNTADMIN for daily work); **dynamic masking** on PII, **row access policies** for tenant/region isolation, **object tags** + tag-based policies to govern at scale, **network policies** + **MFA/SSO** for access. Audit with **ACCESS_HISTORY**.

## 6. Tune & recover

**Performance:** cluster big poorly-pruned tables, lean on the result/local caches, precompute hot rollups with **materialized views** / Dynamic Tables, add **Search Optimization** for point lookups — diagnose with the **Query Profile** first. **Recovery & environments:** **Time Travel** to undo bad loads, **zero-copy clone** for instant dev/test and safe migrations.

## 7. Share & build

Distribute governed data products via **Secure Data Sharing / Marketplace** (no copies). Run code in-platform with **Snowpark** (Python/Scala DataFrames, UDFs, ML) and add **Cortex** for LLM/ML in SQL. Build internal apps with **Streamlit in Snowflake**.

## 8. The decision framework (what a DE weighs)

| Decision | Lean toward… | When |
|---|---|---|
| Ingest method | Snowpipe / Streaming / Dynamic Table | by required latency |
| Transform | SQL + Dynamic Tables | default; Snowpark for procedural/ML |
| Warehouse size | smallest that doesn't spill | size to the query |
| Concurrency | multi-cluster | many simultaneous users |
| Big-table speed | clustering key | poor pruning on a common filter |
| Hot rollup | materialized view / Dynamic Table | repeated heavy aggregation |
| Recovery | Time Travel / clone | over backups/reloads |
| Distribution | Secure Data Sharing | over file exports |

## 9. Cost discipline (the recurring theme)

Compute is the bill. Levers, in order of impact: **auto-suspend** idle warehouses, **right-size** (don't oversize), **scan less** (clustering + Parquet + pruning), **cache** (result/local), **isolate** workloads (so you can see and cap each), and **resource monitors** as the safety net. Storage (with Time Travel/Fail-safe) is comparatively cheap — but set retention deliberately.

## 10. Gotchas that bite whole platforms

- **One mega-warehouse** — you lose isolation and cost visibility. Split per workload.
- **No auto-suspend / no resource monitor** — the runaway-bill duo.
- **ACCOUNTADMIN sprawl** — restrict it; build custom roles.
- **Mutating raw** — keep raw immutable so reprocessing is always possible.
- **Querying deep VARIANT in hot BI** — shred to typed columns for consumers.
- **Tightest-possible Dynamic Table lag** — match `target_lag` to real freshness needs, not the minimum.

## Scenario — the retailer platform, fully composed

Nightly partner files load via **Snowpipe**; live orders via **Snowpipe Streaming**; JSON lands in **raw VARIANT**. **Dynamic Tables** build `staging → marts` (hourly lag) — `fct_orders`, `daily_sales`. Compute is split: **LOAD_WH** (Large, auto-suspend 30s), **ETL_WH** (Medium), **BI_WH** (Small, multi-cluster 1→4) — each over the same data, a monthly **resource monitor** capping spend. **Governance:** functional roles, masking on `email`, row policies by region, PII tags. **Performance:** `events` clustered by `(date, region)`, a materialized view for the DAU panel, caches warm. **Recovery:** Time Travel + clones power instant dev and safe migrations. Partners consume a **secure-view share** via the **Marketplace**; a data scientist scores churn with **Snowpark**, and **Cortex** adds review sentiment. One governed platform, ingestion to insight, cost under control.

## Practice

1. Choose ingestion methods for nightly files, minute-latency files, and second-latency rows; justify each.
2. Lay out the database/schema layering and pick Dynamic Tables vs streams+tasks for two transforms.
3. Define three isolated, auto-suspended warehouses (one multi-cluster) and a resource monitor capping monthly credits.
4. Specify the governance: a role hierarchy, a masking policy, and a row access policy for a multi-region, PII-bearing dataset.
5. Walk the full lifecycle for one fact table — ingest → model → secure → tune → recover → share — naming the Snowflake feature at each step.
