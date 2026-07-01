# Cortex — AI & ML in SQL, the complete guide

Cortex is how a data engineer adds LLMs and ML to a pipeline without standing up any ML infrastructure: you call functions from **SQL**, the work runs **serverless** where the governed data already is, and nothing moves. This chapter covers the function families, Analyst/Search, cost, and when to use Cortex vs Snowpark ML vs an external platform.

@@diagram:snow-cortex

## 1. The pitch

No models to host, no data to export, no separate ML platform to feed. **Cortex** exposes **LLMs and ML as SQL** — so enrichment, forecasting, and even RAG become columns and queries on your existing tables, under your existing governance.

## 2. LLM functions

```sql
select review_id,
       snowflake.cortex.sentiment(text)                              as sentiment,   -- -1..1
       snowflake.cortex.summarize(text)                              as summary,
       snowflake.cortex.translate(text,'es','en')                    as english,
       snowflake.cortex.complete('mistral-large','Classify: '||text) as label,
       snowflake.cortex.extract_answer(text,'What is the order id?') as order_id
from reviews;
```

`COMPLETE` runs a chosen model (several available — pick by capability **and cost**); there are also **embedding** functions for vector search. These are the building blocks for classification, extraction, summarization, and generation **in SQL**.

## 3. ML functions (tabular / time-series)

No training pipeline to build:

```sql
-- forecast the next 14 days of ticket volume
select * from table(snowflake.ml.forecast(
  input_data => table(select created_at::date d, count(*) n from tickets group by 1),
  timestamp_colname => 'D', target_colname => 'N', forecasting_periods => 14));
-- also: snowflake.ml.anomaly_detection(...), snowflake.ml.classification(...)
```

`FORECAST`, `ANOMALY_DETECTION`, and `CLASSIFICATION` give common ML straight from SQL.

## 4. Cortex Analyst & Cortex Search

- **Cortex Analyst** — answers **natural-language** business questions over a **semantic model** you define (NL → SQL), powering self-serve analytics for non-SQL users.
- **Cortex Search** — **retrieval / RAG** over your text corpus (embeddings + search), the backbone of in-platform assistants/chatbots grounded in your data.
- **Fine-tuning** is available for some models when the base models aren't enough.

## 5. Cost — measure first

Cortex LLM functions bill **by tokens/rows** and **vary by model**; ML functions bill compute. Running an expensive `COMPLETE` over millions of rows can be costly. Discipline:

- **Test on a sample**, estimate full-table cost before scaling.
- **Match the model to the task** — don't use the largest model for a simple yes/no classification.
- **Run incrementally** — enrich only **new** rows (a Dynamic Table over new data) rather than re-scoring the whole table each run.

## 6. Cortex vs Snowpark ML vs external platform

| Use | When |
|---|---|
| **Cortex** | The task is covered by built-in LLM/ML functions — fastest, zero infra, in SQL |
| **Snowpark ML** | You need **custom models/control** but want it **in Snowflake**, next to the data |
| **External (Vertex/SageMaker/Databricks)** | A **fully bespoke** ML stack / specialized hardware / existing MLOps justifies moving data |

The progression is **least-effort → most-control**: try Cortex, graduate to Snowpark ML, leave Snowflake only when ML requirements truly demand it.

## 7. Gotchas

- **Cost on scale** — token/row billing means big-table `COMPLETE` adds up; sample, estimate, incrementalize.
- **Model choice matters** — capability vs cost; pick deliberately.
- **Non-determinism** — LLM outputs vary; for classification, constrain the prompt (e.g., "return one of [a,b,c]") and validate.
- **Governance applies** — Cortex runs on governed data under your roles/policies (a feature).
- **Not every ML need fits** — deeply custom models still want Snowpark ML or an external platform.

## Scenario — an AI-enriched support pipeline

Support tickets land in Snowflake. A **Dynamic Table** enriches **only new** tickets with **Cortex**: `sentiment(body)`, `summarize(body)`, and a constrained `complete('<model>', 'Return one of [billing,bug,howto]: '||body)` for category — producing a governed `support.enriched` table that BI reads. A separate **`ML.FORECAST`** predicts next-week ticket volume for staffing, and **`ANOMALY_DETECTION`** flags spikes. Managers ask questions in plain English via **Cortex Analyst** over a semantic model, and an assistant answers from the docs via **Cortex Search (RAG)**. Cost is controlled by **incremental** enrichment (new tickets only), a **right-sized model**, and a **sample-based estimate** before rollout. No ML platform was provisioned, no ticket data left Snowflake, and everything inherits the account's **governance** — AI delivered as SQL on the data that's already there.

## Practice

1. Write one SQL statement that adds sentiment, a summary, and a constrained category to a reviews table with Cortex.
2. Use `ML.FORECAST` to predict a daily metric for the next 14 days.
3. Explain the cost discipline for running LLM functions over a large table (three tactics).
4. Decide Cortex vs Snowpark ML vs external platform for: sentiment tagging, a custom XGBoost model in-platform, and a bespoke deep-learning stack.
5. What are Cortex Analyst and Cortex Search, and what does each enable?
