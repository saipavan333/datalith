# System design: choosing between BigQuery, Databricks and Snowflake

"Which platform should we use?" is a system-design interview favourite and a real decision that costs millions to reverse. The honest answer is never a logo. It is a short, written argument from the workload, the team and the existing cloud, with the trade-offs named and one cheap experiment to check the guess.

@@diagram:xp-choose-platform

## 1. Concept: what actually differs

| Question | BigQuery | Databricks | Snowflake |
|---|---|---|---|
| Core model | serverless SQL engine (Dremel) over Google-managed columnar storage; BigLake for open formats | Spark-based lakehouse over **your** object storage; Delta Lake (and Iceberg) tables; Unity Catalog | SQL data platform with virtual warehouses over Snowflake-managed micro-partitions; Iceberg tables for open format |
| Clouds | GCP (BigQuery Omni reads AWS/Azure data in Enterprise and on-demand) | AWS, Azure, GCP | AWS, Azure, GCP |
| What you size | nothing (on-demand) or slot reservations (editions) | clusters or serverless; SQL warehouses | warehouse size + multi-cluster count |
| Billing | per TiB scanned or per slot-hour | DBUs (+ cloud VMs on classic) | credits per warehouse-second, serverless multipliers |
| Sweet spot | SQL-heavy analytics on GCP, spiky ad-hoc use, little ops | heavy Spark, streaming, ML and unstructured data, open-format lakes | many concurrent BI users, data sharing, strong governance, SQL-first teams |
| Streaming | Storage Write API, Pub/Sub BigQuery subscriptions, continuous queries (Enterprise+) | Structured Streaming, Lakeflow pipelines | Snowpipe Streaming, Dynamic Tables (60 s minimum lag) |
| ML/AI | BigQuery ML, AI.* functions, vector search, Gemini Enterprise Agent Platform (formerly Vertex AI) | MLflow 3, Model Serving, AI Search, AI Functions | Cortex AI Functions, Snowpark ML, Cortex Search |

None of the three is "best". Each is best at something, and all three can read Iceberg (and Delta in Databricks' case) so a mixed estate is normal, not a failure.

## 2. School-kid picture

Choosing how to get to school. A bus (BigQuery): no driving, you pay per ride, great if you live on its route (GCP). A car you maintain (Databricks): goes anywhere, carries odd-shaped things (ML, streams, files), but someone has to look after it. A taxi company account (Snowflake): very easy for lots of people at once, pay by the minute the meter runs. The right answer depends on where you live and what you carry, not on which vehicle is coolest.

## 3. Worked example: a 300-person retailer on GCP

Facts: 4 TB/day of clickstream + orders from 2 Postgres databases; 25 analysts fluent in SQL, 4 ML engineers; already on GCP; finance wants predictable spend; the board asked about lock-in last year.

Reasoning, step by step:

1. **Write the weights first** (with the stakeholders): team skills 20%, fit with GCP 15%, streaming 10%, ML 15%, governance 10%, cost predictability 15%, lock-in 15%.
2. **Score each option 1-5 for this company** (scores are judgments; write the reason next to each).
3. **Run a sensitivity check**: if the ML team grows and lock-in becomes a board issue, does the winner change?
4. **Pick the top two and run a two-week bake-off** on the three most expensive real queries and one streaming pipeline, measuring cost and latency.
5. **Write the decision record**: choice, rejected options and why, the condition that would make you revisit.

## 4. Hands-on lab (runs locally)

```bash
python labs/platforms/platform_choice.py
```

Recorded output (2026-11-03):

```text
Base weights:
  BigQuery-centred       4.05
  Databricks lakehouse   3.90
  Snowflake              3.75

Sensitivity: what if the ML team doubles and lock-in becomes a board concern?
  Databricks lakehouse   4.20
  BigQuery-centred       3.85
  Snowflake              3.65
```

What to look for: a 0.15 lead flips with a plausible change in priorities. That is why the weights are agreed before scoring, and why the bake-off on real queries matters more than the matrix. Pair this with `labs/platforms/bq_editions_breakeven.py` and `labs/platforms/snow_credits.py` to put cost numbers next to the scores.

**Needs your account (free trial/tier):** BigQuery sandbox (no card; 10 GB storage, 1 TiB queries a month, tables expire after 60 days), Databricks Free Edition (serverless only, one 2X-Small SQL warehouse), Snowflake trial (30 days, $400 of usage). Load the same 1-5 GB public dataset into each, run your three heaviest queries, and record runtime and cost from each platform's own history views.

## 5. Gotchas in platform decisions

- **Benchmarks from vendors measure the vendor's best case.** Run yours.
- **Egress and duplication.** Copying 4 TB/day between clouds or platforms has a cost and a latency; open table formats + a shared catalog can avoid the copy.
- **Team skills are a cost.** A Spark platform with no Spark engineers ends up running expensive SQL on oversized clusters.
- **Free tiers are not production.** Free Edition and sandbox limits hide concurrency and governance behaviour.
- **Lock-in is mostly in code and people, not in storage.** Proprietary SQL functions, stored procedures and orchestration glue are harder to move than Parquet files.

## 6. Quiz

1. Which situation most clearly favours Snowflake?
   - a) A Spark-heavy ML team training on images. *Wrong: that leans Databricks.*
   - b) **Hundreds of concurrent BI users and frequent data sharing with partners, on AWS.** *Right: multi-cluster warehouses and sharing are its strengths.*
   - c) A GCP shop wanting no infrastructure at all. *Leans BigQuery.*
   - d) A team that must process raw video. *Wrong.*
2. Why write decision weights before scoring?
   - a) It's faster. *Not the reason.*
   - b) **Otherwise people tune weights to justify a choice already made.** *Right.*
   - c) Vendors require it. *Wrong.*
   - d) To avoid a bake-off. *Wrong: you still run one.*
3. Your company runs both Databricks and BigQuery and wants one copy of curated data. What helps most?
   - a) Nightly CSV exports. *Wrong: duplicates data and loses types.*
   - b) **Open table formats (Iceberg/Delta) with a catalog both engines can read.** *Right.*
   - c) Picking one and banning the other immediately. *Possible later, not the enabling step.*
   - d) A bigger network link. *Wrong.*

## 7. Exercises

**Warm-up.** Change the lab's weights so cost predictability is 30%. Who wins? *Solution:* set cost predictability to 0.30 and scale the other six weights down proportionally so they sum to 0.70: BigQuery 3.86, Snowflake 3.79, Databricks 3.74. BigQuery still wins, and Snowflake overtakes Databricks. Write down which single weight change flips the order.

**Transfer.** A fintech on AWS, 60 analysts, strict data residency, wants a governed warehouse fast; ML is outsourced. Recommend and justify in five sentences. *Solution (one defensible answer):* Snowflake on AWS in the required region (Business Critical if regulated data needs it): SQL-first team, strong RBAC, masking and row policies, no cluster management, fast start. Databricks is the runner-up if ML comes in-house. BigQuery is out because they're on AWS. Bake-off: two heaviest monthly reports and one masking-policy scenario. Revisit if in-house ML or streaming becomes a priority.

**Stretch.** Design a mixed estate: ingestion and ML on Databricks, BI on Snowflake, one copy of gold data. *Solution:* gold tables written as Iceberg (or Delta with Iceberg reads via UniForm) to object storage, registered in a catalog Snowflake can read (Snowflake Iceberg tables with a catalog integration), governance mirrored through Terraform for both platforms, lineage via OpenLineage, and a FinOps view that attributes both bills to the same data products.

## 8. Interview questions

- **(Junior) Compare BigQuery and Snowflake in one minute.** Both separate storage and compute and run SQL at scale. BigQuery is serverless and bills per TiB scanned or per slot-hour; Snowflake has warehouses you size and bills credits per second while they run. BigQuery is GCP-only (Omni aside); Snowflake runs on all three clouds.
- **(Mid) When would you pick Databricks over a warehouse?** When the workload is Spark-shaped: large transformations in Python/Scala, streaming with state, ML and unstructured data, or a requirement to keep data in open formats in your own storage.
- **(Senior) Walk me through a platform decision you'd defend to a CFO and a CTO.** Requirements and constraints, weighted criteria agreed up front, scored options with reasons, a time-boxed bake-off on real queries with measured cost, a 3-year cost model (compute, storage, people, egress, migration), risks and exit plan (open formats), and a decision record with review triggers.

## 9. Sources (checked 2026-11-03)

- BigQuery editions and features: https://cloud.google.com/bigquery/docs/editions-intro ; sandbox: https://cloud.google.com/bigquery/docs/sandbox
- Databricks Free Edition limits: https://docs.databricks.com/aws/en/getting-started/free-edition-limitations
- Snowflake warehouses and trial: https://docs.snowflake.com/en/user-guide/warehouses-overview , https://docs.snowflake.com/en/user-guide/admin-trial-account
- Snowflake Dynamic Tables target lag (60 s minimum): https://docs.snowflake.com/en/user-guide/dynamic-tables-target-lag
- Vertex AI renamed Gemini Enterprise Agent Platform (2026-04-22): https://cloud.google.com/gemini-enterprise-agent-platform/release-notes
