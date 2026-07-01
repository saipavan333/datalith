# Big-Bank Data Platform — Project Report

*A complete, end-to-end data platform for a retail bank — explained as a story, in plain English.*

---

## 1. Executive summary

This project builds the **entire data platform a retail bank runs** — the same kind of system a senior data engineer
owns in their day job. It takes raw data from the bank's systems, cleans and organizes it, catches fraud in real time,
checks it against strict quality rules, and turns it into **trusted numbers** for executives, analysts, and regulators —
all wired together so it runs on a schedule and **nothing broken ever ships**.

It combines the real enterprise stack — **DataStage, SQL, Greenplum, Python, PySpark, Databricks, GCS, dbt, data
contracts, and CI/CD** — across **both batch and streaming** data. It runs end to end on a laptop with one command
(`python run.py`), using faithful local stand-ins where the real tools are cloud/proprietary, and it documents how each
piece maps to production.

If you remember one sentence: **we turn messy raw bank data into one reconciled, governed "golden source" of trusted
numbers — handling fraud in real time and regulators at night — with quality and controls enforced automatically.**

---

## 2. The scenario — a day at "Meridian Bank"

Picture a mid-sized retail bank, *Meridian*. Two very different things must happen with its data, every single day:

- **9:02 a.m. — a card is swiped in another country for $4,300.** Is it fraud? Meridian has **seconds** to decide
  whether to approve or block it. This needs **real-time** data.
- **11:00 p.m. — the books must close.** Finance needs the day's transactions reconciled to the penny; risk needs
  exposure by region; regulators need reports they can trust under inspection. This needs **trustworthy, complete,
  batch** data.

These are opposite needs — *fast* vs *complete-and-correct* — so the platform runs **two paths** that meet in one
governed place. That two-path design is called a **Lambda architecture**, and it's exactly what big banks use.

The villain of the story is **untrusted data**: if the numbers in three reports disagree, or a bad row sneaks into a
regulatory return, the bank fails an audit. So a second theme runs through everything: **controls** — quality checks,
contracts, reconciliation, and an audit trail — so the data is trustworthy *by design*.

---

## 3. The big picture (architecture)

Here is the whole platform in one breath, then we'll walk it slowly.

```
                                  ┌──────────── CI/CD: nothing ships unless tests + contracts + dbt are green ───────────┐
 SOURCES            BATCH PATH                                            GOLD (warehouse)            CONSUMERS
 core banking ─┐  DataStage ETL    Databricks / PySpark                   Greenplum + dbt
 cards        ─┼─► standardize ─►  bronze ─► silver (clean, SCD2,   ─►    ├ reconciliation   ─► Finance / Risk
 market data  ─┤  + reject bad     Parquet/Delta)  quality)              ├ regulatory_exp.   ─► Regulators
 CRM          ─┘  → GCS landing                                          ├ fraud_summary     ─► Fin-crime
                                                                          └ fact_transactions
 SPEED PATH                                                               → semantic layer → Power BI / Looker / Tableau
 card stream ─► Kafka ─► Spark Structured Streaming (fraud/AML) ─► alerts ───────────────────► real-time block/allow

 GOVERNANCE everywhere: data contracts · data quality · lineage · reconciliation · audit trail (the "golden source")
```

Two paths (batch + speed), meeting in a governed warehouse, served to people through a semantic layer, and wrapped in
automation (orchestration + CI/CD). Now the story.

---

## 4. The journey of one transaction (end to end)

Let's follow a single card payment through the whole system. This is the best way to *feel* what the platform does.

1. **It's born.** A customer pays $4,300 abroad. The card system emits an event onto a **stream** (Kafka) and also writes
   it to the day's transaction file in the **core systems**.
2. **The fast lane (seconds).** A **Spark Structured Streaming** job reading the stream scores the payment instantly:
   large amount **+** high-risk country → **fraud alert**. The bank can block it now. (Speed layer.)
3. **The slow lane (that night).** The day's raw files are extracted by a **DataStage** ETL job, which standardizes
   them (tidy formats, add metadata) and **rejects** anything malformed (a bad amount, a corrupt row) into a separate
   "reject" pile — those never pollute the real data. The clean raw lands in **GCS** as the **bronze** layer.
4. **It gets trustworthy.** A **PySpark / Databricks** job turns bronze into **silver**: it removes duplicate deliveries,
   fixes data types, flags reversals, links the payment to its **account** and **customer**, and runs a quality check
   (are there accounts with no matching customer?). Silver is the **single source of truth**.
5. **It passes the gate.** A **data contract** checks silver against agreed rules (every transaction has an id, a valid
   amount, no nulls where there shouldn't be). If it fails, the whole run **stops** — bad data cannot move forward.
6. **It becomes a business number.** Silver loads into the **Greenplum** warehouse, where **dbt** builds the **gold**
   marts: the day's **reconciliation** (posted vs reversals vs net), **regulatory exposure** by region/segment, and a
   **fraud summary**. dbt also **tests** these (e.g. transaction ids must be unique — proving the dedup worked).
7. **It reaches a human.** A **semantic layer** defines each metric once (net movement, fraud alert rate, total
   exposure), and a **BI dashboard** (and Power BI / Looker / Tableau) shows the same trusted numbers to executives and
   regulators.
8. **It's all automatic.** The whole chain runs as an **Airflow / Databricks Workflows** DAG with retries and the
   contract gate as a stop-sign, and **CI/CD** ensures no change ships unless tests, the contract, and dbt all pass.

That one payment touched real-time fraud detection, a medallion lakehouse, an MPP warehouse, dimensional modeling,
quality gates, a semantic layer, BI, orchestration, and CI/CD — the full remit of a senior bank data engineer.

---

## 5. Stage by stage — what, how, and why

For each stage: **what** we do, **how**, **why**, the **real tool**, and the **local stand-in** that makes it runnable.

### 5.1 Sources
- **What:** the bank's systems — core banking, cards/payments, market data, CRM.
- **How / local:** `generate_data.py` creates realistic synthetic customers, accounts, a daily transaction batch (with
  deliberate mess), and a card stream (with fraud).
- **Why:** real source data is messy and multi-system; the platform must integrate and clean it.

### 5.2 DataStage ETL → bronze
- **What:** extract the raw files, standardize formats, route bad rows to a **reject** dataset, and land immutable raw
  with metadata.
- **How / local:** `datastage_etl.py` (Python, mapped stage-by-stage to DataStage). Real tool: **IBM DataStage** parallel
  jobs.
- **Why:** banks run governed ETL tools; bronze is the **replayable** record of what arrived (if logic changes later, we
  reprocess from here — no re-pull from sources).

### 5.3 GCS landing
- **What:** the cheap, durable landing zone for raw files.
- **How / local:** a local folder; real: a **GCS** bucket (MinIO via docker for a real object store).
- **Why:** separates cheap storage from compute; the lakehouse foundation.

### 5.4 PySpark / Databricks → silver
- **What:** clean, conform, and enrich. Dedupe by transaction id, fix types, flag reversals, join accounts/customers,
  build an **SCD2 customer dimension** (keeps history), and run a **referential-integrity** quality check.
- **How / local:** `spark_medallion.py` — **real PySpark**, output Parquet (Delta on Databricks).
- **Why:** silver is the trustworthy single source of truth analysts and downstream marts build on.

### 5.5 Streaming fraud / AML
- **What:** score card transactions in real time and raise alerts.
- **How / local:** `streaming_fraud.py` — **real Spark Structured Streaming** over a file source (Kafka in prod), with
  `trigger(availableNow)` so it drains and stops locally but runs continuously in production.
- **Why:** fraud must be caught in seconds — the speed layer.

### 5.6 Data contracts (the gate)
- **What:** validate silver against agreed schema/quality rules; **fail the run** on any violation.
- **How / local:** `contracts.py` (ODCS-style), run in `run.py` and CI. Real: `datacontract-cli` / `buf` in CI.
- **Why:** "shift-left" — block bad data before it reaches the warehouse, marts, or BI. Regulators expect this control.

### 5.7 Greenplum + dbt → gold
- **What:** load silver into the warehouse and build business-ready marts with **SQL** and **tests**.
- **How / local:** `load_warehouse.py` (DuckDB locally) + a real **dbt** project (`dbt_bank/`). Real: **Greenplum** (MPP,
  `DISTRIBUTED BY`, columnar) — DDL in `greenplum_ddl.sql`; dbt-postgres profile included.
- **Why:** gold marts (reconciliation, regulatory exposure, fraud summary) are what the business actually reads;
  dbt tests prove correctness (e.g. unique transaction ids).

### 5.8 Semantic layer + BI serving
- **What:** define each metric **once** and serve consistent numbers to BI tools.
- **How / local:** a governed metrics model (`metrics_summary`) + `serve_dashboard.py` (renders `dashboard.html`);
  `BI_CONNECT.md` for Power BI / Looker / Tableau; `semantic_layer.yml` is the dbt MetricFlow spec.
- **Why:** so every dashboard shows the **same** number — no "three reports, three revenues" (a compliance risk in a
  bank).

### 5.9 Orchestration + CI/CD
- **What:** wire the stages into a DAG with retries, alerts, and the gate; and gate every code change.
- **How / local:** `orchestration/` (Airflow DAG + Databricks Workflows job) and `.github/workflows/ci.yml`.
- **Why:** production data platforms run on schedules and must be safe to change — automation + controls.

---

## 6. The data model (how the data is shaped)

The platform uses the **medallion** model — refine data in layers, each more trustworthy:

- **Bronze** — raw, as it arrived, append-only + metadata. Immutable and replayable.
- **Silver** — cleaned, deduped, typed, conformed; the single source of truth. Includes an **SCD2** `dim_customer`
  (history-tracking) keyed by a **surrogate key**, and a transaction **fact** linked to accounts/customers.
- **Gold** — business marts modeled for consumption: a transaction **fact**, a daily **reconciliation** control mart, a
  **regulatory exposure** mart (by region/segment), and a **fraud summary** mart.

Key modeling decisions: **surrogate keys** (so SCD2 history works and joins are fast), **conformed dimensions** (one
customer definition reused across marts), and **denormalized gold marts** (fast reads for BI). These map directly to the
course's Data Modeling track.

---

## 7. Real-world complexity it handles

| Real-world problem | Where it's handled |
|---|---|
| Bad / unparseable values | DataStage **reject link** (`datastage_etl.py`) |
| Duplicate deliveries (at-least-once) | **dedupe** by txn_id (`spark_medallion.py`); proven by a dbt unique test |
| Reversals (negative amounts) | flagged `is_reversal` in silver |
| Orphan accounts (broken foreign keys) | **referential-integrity** quality check → surfaces as `UNKNOWN` in reports |
| Customer attribute changes over time | **SCD2** `dim_customer` with change-hash for next-day MERGE |
| Real-time fraud / AML | streaming scoring (`streaming_fraud.py`) |
| Bad data reaching consumers | **data-contract gate** fails the run / CI |
| Books must reconcile | `gold_daily_reconciliation` control totals |
| Regulatory reporting | `gold_regulatory_exposure` from the reconciled golden source |
| Different teams, different numbers | **semantic layer** defines metrics once |

---

## 8. Why these decisions (trade-offs)

- **Lambda (batch + streaming)** — fraud needs speed; regulatory needs completeness. One path can't do both well, so we
  run both and reconcile.
- **Medallion** — refine in layers so each has one job; keep raw bronze so we can reprocess when logic changes.
- **Surrogate keys + SCD2** — to report attributes *as they were at the time*, and to keep joins fast and stable.
- **Data contracts as a gate** — cheaper to fail a build than to explain a bad regulatory return; controls are
  non-negotiable in banking.
- **Greenplum (MPP) → cloud-ready** — the bank runs MPP today; the same dbt SQL migrates to Snowflake/Databricks
  tomorrow (storage/compute separation).
- **Semantic layer** — one trusted number for executives and regulators.

---

## 9. How to run it

```bash
pip install -r requirements.txt     # needs Java 11+ for PySpark
python run.py                        # full pipeline end to end
#   make run | make run-nodbt | make test
docker compose up -d                 # optional: real Greenplum(Postgres) + Kafka + MinIO
```

The run executes all stages and finishes by building `out/dashboard.html` and printing the gold marts. Verified locally:
PySpark medallion + streaming run, the contract gate passes, **dbt build is green (PASS=19, including the metrics
model)**, and the dashboard renders with the day's metrics.

---

## 10. Results (what you get)

- A **reconciliation** mart with the day's control totals (posted, reversals, net movement).
- A **fraud summary** showing high-risk-geography transactions flagged at a high rate, normal traffic at ~0.
- A **regulatory exposure** mart by region/segment (with data-quality issues honestly surfacing as `UNKNOWN`).
- An **executive dashboard** (`out/dashboard.html`) served from the governed metrics layer.
- A **green CI run**: tests + contract gate + dbt build all passing.

---

## 11. How to present this as your work

Tell it as a story, backed by a live run:

1. **Set the scene** — Meridian Bank's two needs (real-time fraud, nightly reconciliation/regulatory).
2. **Show the architecture diagram** — the two paths meeting in a governed golden source.
3. **Run `python run.py` live** — narrate each stage as it executes.
4. **Open the proof points** — the reject pile, the SCD2 dimension, the fraud alerts, the contract gate, the
   reconciliation/regulatory marts, the dashboard, the CI workflow.
5. **Explain the mapping** — DuckDB↔Greenplum, file↔Kafka, Parquet↔Delta, Python↔DataStage.
6. **Close with trade-offs** — why Lambda, why medallion, why contracts. That last part is what signals *senior*.

---

## 12. What I'd do next (production hardening)

- **Lineage + catalog** (OpenLineage / Unity Catalog) for full traceability.
- **Freshness/volume monitoring** + alerting (data observability) and **FinOps** cost attribution.
- **Real Kafka + Flink** for the speed layer; **Delta + Unity Catalog** on Databricks for silver.
- **Reconciliation of speed vs batch** so real-time and EOD numbers provably agree.
- **Secrets management, PII tokenization, and access controls** per regulatory requirements.

---

## 13. Glossary (plain English)

- **ETL / ELT** — moving data and transforming it (ETL transforms before load; ELT loads raw then transforms).
- **DataStage** — IBM's visual, parallel ETL tool common in banks.
- **GCS** — Google Cloud Storage; cheap durable file storage (a "landing zone").
- **Lakehouse / medallion** — cheap storage + warehouse reliability, refined in bronze→silver→gold layers.
- **PySpark / Databricks** — distributed data processing; Databricks is the managed platform for it.
- **Delta / Parquet** — table/file formats; Delta adds transactions + time travel over Parquet.
- **Streaming / Kafka / Structured Streaming** — processing events continuously in real time.
- **SCD2** — Slowly Changing Dimension Type 2: keeps history of attribute changes.
- **Surrogate key** — a meaningless integer key the warehouse assigns (enables SCD2 + fast joins).
- **Data contract** — agreed schema/quality rules, enforced automatically (the gate).
- **Greenplum / MPP** — a massively parallel SQL warehouse (data spread across nodes).
- **dbt** — builds and tests SQL models (the transformations that make gold marts).
- **Semantic / metrics layer** — defines each metric once so every tool shows the same number.
- **Reconciliation** — proving the numbers match the source (control totals); breaks are investigated.
- **CI/CD** — automation that tests and ships code safely (nothing red ships).
- **Orchestration (Airflow / Workflows)** — schedules and wires the stages with retries and the gate.
