# Capstone: a big-bank data platform — the story

This is the flagship capstone: the **whole data platform a retail bank runs**, combining your real stack — DataStage,
SQL, Greenplum, Python, PySpark, Databricks, GCS, dbt, data contracts, and CI/CD — across **batch and streaming**. The
runnable project (with a full written **PROJECT_REPORT** and a Word report) lives in
`capstone-projects/15-bank-data-platform/`. Let's tell it as a story.

## The scene — a day at "Meridian Bank"

Picture a mid-sized retail bank, *Meridian*. Two very different things must happen with its data every day:

- **9:02 a.m. — a card is swiped abroad for $4,300.** Is it fraud? Meridian has **seconds** to approve or block it.
  This needs **real-time** data.
- **11:00 p.m. — the books must close.** Finance needs the day reconciled to the penny; risk needs exposure by region;
  regulators need reports they can trust under inspection. This needs **trustworthy, complete batch** data.

Fast vs complete-and-correct are opposite needs, so the platform runs **two paths** that meet in one governed place —
a **Lambda architecture**, exactly what real banks use. And one villain runs through the whole story: **untrusted
data**. If three reports disagree, or a bad row reaches a regulatory return, the bank fails an audit. So the second
theme is **controls** — quality checks, contracts, reconciliation, and an audit trail — so the data is trustworthy
*by design*.

@@diagram:bank-architecture

## Follow one transaction, end to end

The best way to understand the platform is to follow that single $4,300 payment through it:

1. **It's born.** The card system emits an event onto a **stream (Kafka)** and writes it to the day's transaction file.
2. **The fast lane (seconds).** A **Spark Structured Streaming** job scores it instantly — large amount **+** high-risk
   country → **fraud alert**. The bank can block it now. *(speed layer)*
3. **The slow lane (that night).** A **DataStage** ETL job extracts the day's files, standardizes them, **rejects**
   malformed rows into a separate pile, and lands clean raw in **GCS** as the **bronze** layer.
4. **It gets trustworthy.** A **PySpark / Databricks** job turns bronze into **silver**: removes duplicates, fixes types,
   flags reversals, links the payment to its account and customer, and runs a quality check. Silver is the **single
   source of truth**.
5. **It passes the gate.** A **data contract** checks silver against agreed rules; if it fails, the whole run **stops** —
   bad data cannot move forward.
6. **It becomes a business number.** Silver loads into **Greenplum**, where **dbt** builds the **gold** marts —
   reconciliation, regulatory exposure, fraud — and **tests** them.
7. **It reaches a human.** A **semantic layer** defines each metric once, and a **BI dashboard** (Power BI / Looker /
   Tableau) shows the same trusted numbers to executives and regulators.
8. **It's all automatic.** The chain runs as an **Airflow / Databricks Workflows** DAG with retries and the contract
   gate as a stop-sign, and **CI/CD** ensures nothing ships unless tests, the contract, and dbt all pass.

That one payment touched real-time fraud detection, a medallion lakehouse, an MPP warehouse, dimensional modeling,
quality gates, a semantic layer, BI, orchestration, and CI/CD — a senior bank data engineer's whole remit.

## The two paths, reconciled

@@diagram:bank-lambda

Real-time stops fraud **now**; batch produces trustworthy, complete regulatory and reconciled numbers **at EOD**. You
**reconcile** the two so they agree — that reconciled "golden source" is what regulators inspect.

## How it's wired (orchestration)

@@diagram:bank-orchestration

`generate → {DataStage→silver, streaming} → contract GATE → warehouse → dbt → semantic → serve`, with retries and the
gate as a fail-stop, runnable as an Airflow DAG or a Databricks Workflows job.

## The complexity it handles (why it feels real)

| Real-world problem | Where it's handled |
|---|---|
| Bad / unparseable values | DataStage **reject link** |
| Duplicate deliveries | **dedupe** by txn_id (proven by a dbt unique test) |
| Reversals (negative amounts) | flagged `is_reversal` in silver |
| Orphan accounts (broken FKs) | referential-integrity check → surfaces as `UNKNOWN` |
| Customer attributes change over time | **SCD2** `dim_customer` |
| Real-time fraud / AML | streaming scoring |
| Bad data reaching consumers | **data-contract gate** fails the run |
| Books must reconcile | `gold_daily_reconciliation` control totals |
| Regulatory reporting | `gold_regulatory_exposure` |
| Different teams, different numbers | **semantic layer** defines metrics once |

## Why these decisions (the senior signal)

- **Lambda (batch + streaming)** — fraud needs speed, regulatory needs completeness; one path can't do both, so run both
  and reconcile.
- **Medallion** — refine in layers; keep raw bronze so you can reprocess when logic changes.
- **Surrogate keys + SCD2** — report attributes *as they were at the time*; fast, stable joins.
- **Data contracts as a gate** — cheaper to fail a build than to explain a bad regulatory return.
- **Greenplum (MPP) → cloud-ready** — the same dbt SQL migrates to Snowflake/Databricks later.
- **Semantic layer** — one trusted number for executives and regulators.

## Run it & showcase it

```bash
pip install -r requirements.txt     # needs Java 11+ for PySpark
python run.py                        # full pipeline end to end → out/dashboard.html
```

To present it: set the scene (Meridian's two needs) → show the architecture → run `python run.py` live → open the
reject pile, the SCD2 dimension, the fraud alerts, the contract gate, the reconciliation/regulatory marts, the
dashboard, and the CI workflow → explain the local↔production mapping (DuckDB↔Greenplum, file↔Kafka, Parquet↔Delta,
Python↔DataStage) → close with the trade-offs above. The full narrative is in **PROJECT_REPORT.md** (and a polished
**.docx**).

## Practice

1. Why does a bank need both a batch path and a streaming path?
2. Trace what happens to one transaction from swipe to dashboard.
3. Where is bad data caught, and what stops it reaching consumers?
4. Name three local stand-ins and their real-world tools.
