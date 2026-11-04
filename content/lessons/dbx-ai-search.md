# AI on Databricks for data engineers — AI Functions, AI Search, Model Serving and MLflow 3

**Name check (Nov 2026):** *Mosaic AI Vector Search* is now **Databricks AI Search** ("formerly Databricks Vector Search" on the docs page updated 2026-10-29). SDKs and older pages may still say Vector Search. Source: https://docs.databricks.com/aws/en/vector-search/vector-search

A data engineer's AI work on Databricks is mostly pipelines: parse and enrich unstructured data, keep a search index in sync with a governed table, call models from SQL at batch scale, and make all of it observable and affordable. This lesson maps the four building blocks and how they're billed.

@@diagram:dbx-ai-search

## 1. Concept

- **AI Functions** are built-in SQL functions that call LLMs or task models from Databricks SQL, notebooks, Lakeflow pipelines and jobs: general-purpose `ai_query` (any served model), task functions such as `ai_classify`, `ai_extract`, `ai_summarize`, `ai_translate`, `ai_analyze_sentiment`, `ai_mask`, `ai_parse_document` (turn PDFs and images into structured text), and `ai_forecast`; newer Beta functions include `ai_prep_search` and `ai_search`. The query runs on your compute; inference may run on Databricks-managed infrastructure **billed in addition** (recorded under the `AI_FUNCTIONS` or `MODEL_SERVING` products in `system.billing.usage`).
- **AI Search** builds an index from a source table (Delta table, streaming table, materialized view) and keeps it in sync; you query it with the SDK/REST or from SQL with `vector_search(index => ..., query_text => ..., num_results => ...)`, which runs on serverless SQL warehouses (not classic).
- **Model Serving** hosts endpoints for foundation models and your own models; `ai_query` calls them in batch from SQL.
- **MLflow 3** adds tracing, evaluation and prompt management for LLM and agent applications on top of classic experiment tracking and the model registry in Unity Catalog.
- **Unity Catalog** governs all of it: tables, volumes (files), models, functions and indexes have owners and grants, and lineage covers them.

## 2. School-kid picture

A school project on "every complaint our canteen got this year". AI Functions are a helper who reads each complaint and writes a one-line label. AI Search is a smart index card box: ask "complaints about cold food" and it pulls the closest cards even if they say "the rice was freezing". Model Serving is the helper's desk you can send any question to. MLflow is the notebook where you record which helper gave which answers and whether they were right.

## 3. Worked example: 3 million insurance claim PDFs

A health insurer stores claim PDFs in a UC volume (`/Volumes/main/claims/raw_pdfs`), 25 k new PDFs a day.

1. **Parse incrementally** in a Lakeflow pipeline: a streaming table over the volume runs `ai_parse_document` on new files only.
2. **Extract fields** with `ai_extract` (patient, hospital, amount, diagnosis) into `silver.claims_extracted`; expectations reject rows where amount is null.
3. **Classify** with `ai_classify(text, ARRAY('cashless','reimbursement','dental','maternity'))`.
4. **Index** `silver.claims_chunks` with AI Search (auto-sync from the Delta table) so investigators can search "similar claims to this one".
5. **Cost control:** run the AI steps only on new rows (streaming table), test prompts on 1% samples, and watch the `AI_FUNCTIONS` rows in `system.billing.usage` per pipeline.
6. **Quality:** an MLflow evaluation set of 500 hand-labelled claims scores extraction accuracy on every prompt or model change.

```sql
-- batch classification and extraction from SQL
SELECT claim_id,
       ai_classify(claim_text, ARRAY('cashless', 'reimbursement', 'dental', 'maternity')) AS claim_type,
       ai_extract(claim_text, ARRAY('hospital', 'amount', 'diagnosis'))                 AS fields
FROM main.claims.silver_claims_text
WHERE ingest_date = current_date();

-- similar claims through an AI Search index (serverless SQL warehouse)
SELECT * FROM vector_search(index => 'main.claims.claims_chunks_idx',
                            query_text => 'knee replacement claim rejected for pre-existing condition',
                            num_results => 5);
```

(Function argument details change between releases; check the function reference pages before production use.)

## 4. Hands-on lab (runs locally)

The retrieval mechanism (embed, then nearest neighbours by cosine distance) runs on DuckDB with a toy embedding:

```bash
python labs/platforms/vector_search_lab.py
```

Recorded output (2026-11-03, excerpt):

```text
query: 'refund pending'
   #8 d=0.465  return pickup did not happen, refund pending
   #5 d=0.711  charged twice for the same order, need refund
   #2 d=0.733  refund not received after returning the shoes
query: 'money back for returned item'
   #5 d=0.817  charged twice for the same order, need refund
   #6 d=0.817  want to change delivery address for my order
   #4 d=1.000  app crashes when I open the checkout page
```

What to look for: the toy embedding only matches shared words, so "money back for returned item" misses the refund tickets. AI Search uses a real embedding model, which is exactly what fixes that. The lab also prints the equivalent `vector_search()` call.

**Needs your account (free trial/tier):** Databricks Free Edition allows one AI Search endpoint with one search unit and no GPU serving endpoints. Create a small Delta table of 200 support tickets, create an AI Search index on it with a managed embedding model, run the `vector_search()` query from a serverless SQL warehouse, and call `ai_classify` on the same table. Inference consumes the free quota.

## 5. Gotchas

- **Batch inference on a big table is a big bill.** 10 M rows x a few hundred tokens each adds up; sample first, process incrementally.
- **Classic SQL warehouses can't run `vector_search()`.** Use serverless.
- **Index sync lag.** A synced index follows its source table with a delay; don't promise read-your-writes search.
- **Non-determinism.** LLM outputs can change between runs and model versions. Store the model/endpoint name with outputs and evaluate before switching.
- **PII.** Prompts and outputs can contain PII; keep the outputs in governed tables, use `ai_mask` where needed, and check where the model endpoint runs.

## 6. Quiz

1. You call `ai_extract` over 2 M rows from a jobs cluster. What do you pay for?
   - a) Only the cluster DBUs. *Wrong: inference can be billed separately.*
   - b) **The compute you run on plus model inference recorded under AI_FUNCTIONS / MODEL_SERVING.** *Right.*
   - c) Nothing; AI Functions are free. *Wrong.*
   - d) Storage only. *Wrong.*
2. Where can you run `SELECT * FROM vector_search(...)`?
   - a) Any cluster. *Wrong.*
   - b) **A serverless SQL warehouse (or supported compute), not a classic SQL warehouse.** *Right.*
   - c) Only from Python. *Wrong.*
   - d) Only in Model Serving. *Wrong.*
3. Which tool tracks whether a new prompt made extraction worse?
   - a) Unity Catalog grants. *Wrong.*
   - b) **MLflow evaluation and tracing.** *Right.*
   - c) Photon. *Wrong.*
   - d) AUTO CDC. *Wrong.*

## 7. Exercises

**Warm-up.** Write SQL that adds a sentiment column to `support.tickets` for today's tickets. *Solution:* `SELECT *, ai_analyze_sentiment(body) AS sentiment FROM support.tickets WHERE created_date = current_date();`

**Transfer.** Product wants every new ticket summarised within 5 minutes. Design it. *Solution:* a Lakeflow pipeline with a streaming table over the bronze tickets table that applies `ai_summarize` to new rows only, triggered continuously or every few minutes, with an expectation that summary is not null and a dead-letter table for failures; cost watched per day from `system.billing.usage`.

**Stretch.** Compare doing the claims extraction with AI Functions vs a fine-tuned small model on Model Serving. *Solution:* AI Functions: fastest to ship, no training, higher per-row cost, accuracy depends on prompts. Fine-tuned model: training and serving effort, lower per-row cost at high volume, more control. Decide with an MLflow evaluation on the same 500 labelled claims plus a cost projection at 25 k/day.

## 8. Interview questions

- **(Junior) What is RAG?** Retrieve relevant documents (via vector or hybrid search) and give them to an LLM as context so its answer is grounded in your data.
- **(Mid) How do you keep a vector index in sync with a changing table?** Build it from a Delta source with change tracking so the index syncs incrementally (AI Search does this); store a stable document id and chunk id; delete propagates from the source.
- **(Senior) Productionise LLM-based enrichment for 50 M documents.** Incremental processing, prompt/model versioning in MLflow, evaluation gates in CI, per-pipeline cost budgets and alerts, PII handling, retries with dead-letter tables, idempotent writes keyed on document id, and a rollback plan to the previous prompt/model.

## 9. Sources (checked 2026-11-03)

- AI Functions (list, billing): https://docs.databricks.com/aws/en/large-language-models/ai-functions
- AI Search (formerly Vector Search): https://docs.databricks.com/aws/en/vector-search/vector-search
- `vector_search` SQL function: https://docs.databricks.com/aws/en/sql/language-manual/functions/vector_search
- MLflow on Databricks (MLflow 3): https://docs.databricks.com/aws/en/mlflow/
- Free Edition limits: https://docs.databricks.com/aws/en/getting-started/free-edition-limitations
