# The data lifecycle — source to insight — deep dive

If you remember one diagram from the foundations, make it this one. The data lifecycle is the **map** of the entire field: every tool, every track in this curriculum, every interview question fits somewhere on it. When you can place any technology on this map instantly, you've stopped memorizing tools and started understanding the system.

@@diagram:pipeline-flow

## The six stages

**1. Generation (sources).** Data is created: app databases (OLTP), user events and clicks, IoT sensors, SaaS APIs (Stripe, Salesforce), files, and logs. You usually don't control these — they're upstream, and they change without warning. A core DE skill is defensive ingestion that survives source surprises.

**2. Ingestion.** Pull or receive data into your platform. Two modes: **batch** (scheduled extracts — "every night pull yesterday's orders") and **streaming** (continuous — Kafka, CDC from a database log). EL tools (Fivetran, Airbyte) automate connectors. This is the **"EL"** of ELT.

**3. Storage.** Land it durably and cheaply, usually in **object storage / a data lake / a lakehouse**, often as raw **bronze** — exactly as it arrived, before any cleaning. Cheap, scalable, and a safe place to reprocess from if a downstream bug is found.

**4. Transformation.** Clean, validate, deduplicate, join, and **model** raw data into trustworthy, structured tables — bronze → silver → gold, dimensional models, marts. Usually dbt, Spark, or SQL. This is the **"T"** of ELT and where most of the "make it correct and useful" work happens.

**5. Serving.** Make data available to consumers: the **warehouse/lakehouse** for BI, **serving stores** for apps and ML features, **APIs**, and **reverse ETL** that pushes modeled data back into operational tools (e.g., enriched customer segments into the CRM).

**6. Analysis & ML.** The payoff: dashboards, reports, ad-hoc analysis, and machine-learning models built on the served data. This is *why* the other five stages exist.

## ETL vs ELT — where the "T" moves

Older pipelines did **ETL**: extract, **transform on a separate server**, then load the finished result into the warehouse. Modern pipelines do **ELT**: extract, **load raw into the warehouse/lake first**, then transform *inside* it using its cheap, scalable compute (dbt/SQL). ELT won because storage is cheap and warehouse compute is powerful — landing raw first means you can re-transform without re-extracting, and you keep an auditable raw copy. The lifecycle stages are the same; ELT just reorders load and transform.

## Cross-cutting concerns (the wrappers)

Four concerns wrap **every** stage — they're not steps, they're properties of the whole system:

- **Orchestration** — scheduling, dependencies, retries, backfills (Airflow/Dagster/Prefect). What runs, in what order, and what happens when something fails.
- **Data quality & observability** — tests and monitoring at every boundary; you catch bad data before consumers do.
- **Governance** — security, access control, PII handling, lineage, compliance.
- **DataOps** — version control, CI/CD, environments, reproducibility — treating pipelines as production software.

In an interview, mentioning these wrappers (not just the happy-path stages) signals maturity.

## Tracing a clickstream end to end (scenario)

- **Generation:** the app emits a `click` event when a user taps "Add to cart."
- **Ingestion:** the event streams into **Kafka** (or is batched by an EL tool) — continuous, low-latency.
- **Storage:** raw events land in the **lakehouse bronze** layer, untouched.
- **Transformation:** a Spark/dbt job cleans, sessionizes (groups clicks into visits), dedupes, and models them into a typed **silver** `events` table, then a **gold** `fact_session` table.
- **Serving:** `fact_session` lands in the **warehouse**; ML features land in a feature store.
- **Analysis & ML:** an analyst builds a funnel dashboard; a data scientist trains a churn model on the features.
- **Throughout:** Airflow schedules and retries; quality tests gate the silver table; governance restricts who can see user IDs.

Every track in this course maps onto this trace — pipelines/streaming (ingestion), lakehouse/cloud (storage), SQL/Spark/modeling/dbt (transformation), warehouses (serving), and DataOps/governance (the wrappers).

## Cheat sheet

| Stage | What happens | Typical tools |
|---|---|---|
| Generation | sources create data | apps/OLTP, events, IoT, SaaS APIs, logs |
| Ingestion (EL) | pull/receive into platform | Kafka, CDC, Fivetran, Airbyte |
| Storage | land durably (raw bronze) | S3/GCS/ADLS, lake, lakehouse |
| Transformation (T) | clean/model into trusted tables | dbt, Spark, SQL |
| Serving | expose to consumers | warehouse, serving stores, APIs, reverse ETL |
| Analysis & ML | the payoff | BI dashboards, notebooks, ML models |
| **Wrappers** | span every stage | orchestration, quality, governance, DataOps |

**Map to remember:** sources → ingest → store → transform → serve → analyze, with orchestration/quality/governance/DataOps around all of it.

## Interview questions

**Q (Amazon): "Walk me through a modern data pipeline end to end."**
Source generates data; ingestion pulls it in (batch extract or streaming/CDC); it lands raw in cheap storage (lake bronze); transformation cleans and models it into trusted tables (silver/gold via dbt/Spark/SQL); serving exposes it (warehouse for BI, feature store for ML, reverse ETL to operational tools); analysts and ML consume it. Then add the wrappers: orchestration schedules and retries the steps, quality tests gate bad data at each boundary, and governance controls access and lineage throughout. Naming both the stages and the wrappers is what makes the answer senior.

**Q (Google): "What's the difference between ETL and ELT, and why did ELT become popular?"**
ETL transforms data on a separate engine before loading the finished result; ELT loads raw data into the warehouse/lake first and transforms it in place using the platform's own compute. ELT became dominant because storage is cheap and modern warehouse compute is powerful and elastic — so landing raw first lets you keep an auditable raw copy, re-transform without re-extracting from the source, and let analysts iterate on transformations in SQL/dbt. ETL still makes sense when you must transform or filter before landing (e.g., to strip PII, or when the destination can't handle raw volume).

**Q (Meta): "Where do data-quality checks belong in the lifecycle?"**
At every boundary, but especially right after ingestion (validate what arrived from the source) and at the end of transformation (validate the modeled tables before serving). Quality isn't a single stage — it's a wrapper around all of them. Practically: schema/freshness/volume checks at ingest to catch source problems early, and not-null/unique/range/referential tests on silver/gold so bad data is quarantined before it reaches a dashboard. The principle: fail fast and close to the source, and never let a job "succeed" while emitting bad data.

**Q (Goldman Sachs): "A downstream table is wrong. How does the lifecycle model help you debug?"**
The lifecycle gives you a directed path to walk backward: start at serving (is the served table wrong, or just the dashboard?), go to transformation (did a model/join introduce the error?), then storage (is the raw landed data already wrong?), then ingestion (did we capture it correctly?), then generation (did the source itself change?). Lineage tooling makes this traversal explicit. Because you kept raw bronze, you can compare each stage's output to isolate exactly where correct data became incorrect, then fix and backfill from that point.

## Practice

1. Place these on the lifecycle: Kafka, dbt, S3, Airflow, Tableau, Fivetran, Great Expectations.
2. Explain ELT to a new analyst and give one reason raw data is kept.
3. Trace an IoT temperature sensor reading from generation to an alerting dashboard.
