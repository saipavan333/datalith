# BigQuery ML, embeddings and vector search — AI where the data already lives

Data engineers are now asked to "add AI" to tables: classify support tickets, find similar products, answer questions over documents. BigQuery lets you do much of this in SQL: classic ML models with **BigQuery ML**, embeddings with **AI.GENERATE_EMBEDDING / AI.EMBED**, similarity search with **VECTOR_SEARCH** (optionally with a vector index), and text generation with **AI.GENERATE**. The engineering questions are the usual ones: cost, freshness, governance and when not to.

@@diagram:bq-ai-vector

## 1. Concept

- **BigQuery ML (classic):** `CREATE MODEL ... OPTIONS(model_type = 'LOGISTIC_REG' | 'BOOSTED_TREE_CLASSIFIER' | 'KMEANS' | 'ARIMA_PLUS' ...) AS SELECT ...`, then `ML.EVALUATE` and `ML.PREDICT`. Training and prediction are billed as BigQuery processing (on-demand bytes or editions slots).
- **Embeddings:** a model turns text (or images via `ObjectRef`) into a vector of floats where similar meanings sit close together. `AI.GENERATE_EMBEDDING` fills a table of embeddings from a column; `AI.EMBED` embeds one value; BigQuery can also maintain an embedding column automatically from a source column.
- **Vector search:** `VECTOR_SEARCH(TABLE base, 'emb_col', (query_table_or_query), top_k => 10, distance_type => 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT')` returns `query`, `base` and `distance`. Without an index it is exact brute force. `CREATE VECTOR INDEX idx ON t(emb) OPTIONS(index_type = 'IVF')` (or TreeAH, based on ScaNN) makes it approximate: faster, slightly lower recall. `AI.SEARCH` is the higher-level semantic search function.
- **Generation:** `AI.GENERATE` (plus typed variants `AI.GENERATE_BOOL/INT/DOUBLE`, `AI.GENERATE_TABLE`, and `AI.CLASSIFY`, `AI.SCORE`, `AI.AGG`) call a Gemini model from SQL; the model cost is passed through on top of BigQuery compute.
- **Edition rules:** Standard edition has **no BigQuery ML** and can run `VECTOR_SEARCH` but **not use vector indexes**. Enterprise, Enterprise Plus and on-demand have both.

## 2. School-kid picture

Every book in the library gets a spot on a giant map: books about cricket sit near each other, books about cooking sit together. An embedding is the book's map position. Vector search is "show me the five books closest to this spot". An index is a set of signposts so you don't walk past every shelf.

## 3. Worked example: 12 million support tickets

An e-commerce company has 12 M historical tickets and 40 k new ones a day.

1. **Embed once, then incrementally**: a scheduled query embeds only tickets created since the last run (or use automatic embedding maintenance). At 40 k/day that's cheap; re-embedding 12 M every night is not.
2. **Index**: 12 M rows of 768-dimension embeddings is worth a vector index (IVF to start); queries go from scanning every row to probing a few lists.
3. **Search**: an agent pastes a new ticket; `VECTOR_SEARCH` returns the 5 most similar resolved tickets and their resolutions.
4. **Generate**: `AI.GENERATE` drafts a reply grounded in those 5 resolutions (RAG). A human approves it.
5. **Classic ML alongside**: a `BOOSTED_TREE_CLASSIFIER` predicts which tickets will escalate, from structured features (order value, delivery delay, past tickets). No LLM needed.

```sql
-- 1. embeddings for new tickets (remote model or endpoint name depends on your setup)
INSERT INTO support.ticket_emb (ticket_id, emb)
SELECT ticket_id, embedding
FROM AI.GENERATE_EMBEDDING(MODEL support.text_embedder,
       (SELECT ticket_id, body AS content FROM support.tickets
        WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)));

-- 2. index (Enterprise / on-demand)
CREATE VECTOR INDEX ticket_idx ON support.ticket_emb(emb)
OPTIONS (index_type = 'IVF', distance_type = 'COSINE');

-- 3. top-5 similar tickets
SELECT query.ticket_id AS new_ticket, base.ticket_id AS similar, distance
FROM VECTOR_SEARCH(TABLE support.ticket_emb, 'emb',
       (SELECT ticket_id, emb FROM support.ticket_emb WHERE ticket_id = 'T-90211'),
       top_k => 6, distance_type => 'COSINE')
WHERE base.ticket_id != query.ticket_id;   -- the query ticket is in the base table too
```

(The exact argument shape of `AI.GENERATE_EMBEDDING` depends on whether you use a remote model or a built-in endpoint; check the function reference for your project. The `VECTOR_SEARCH` signature above is from the reference page.)

## 4. Hands-on lab (runs locally)

The lab does brute-force cosine search on DuckDB with a deliberately dumb, deterministic "embedding" (hashed bag of words) so it runs offline:

```bash
python labs/platforms/vector_search_lab.py
```

Recorded output (2026-11-03):

```text
query: 'payment failed'
   #7 d=0.465  payment failed with UPI but money debited
   #1 d=0.500  card payment failed at checkout on mobile app
   #3 d=1.000  delivery delayed, courier says address not found
query: 'refund pending'
   #8 d=0.465  return pickup did not happen, refund pending
   #5 d=0.711  charged twice for the same order, need refund
   #2 d=0.733  refund not received after returning the shoes
query: 'money back for returned item'
   #5 d=0.817  charged twice for the same order, need refund
   #6 d=0.817  want to change delivery address for my order
   #4 d=1.000  app crashes when I open the checkout page
```

What to look for: the search mechanics work (closest first), but "money back for returned item" misses ticket #2 and #8 because a bag of words knows nothing about meaning. A real embedding model would put "money back" next to "refund". That's the job the model does, and the reason the toy is a toy.

**Needs your account (free trial/tier):** in a billing-enabled project (on-demand pricing), create a remote embedding model or use the built-in endpoint per the docs, run the three SQL statements above on a few thousand rows of a public dataset (e.g. Stack Overflow questions), and compare `VECTOR_SEARCH` results with and without the index (`options => '{"use_brute_force": true}'`).

## 5. Gotchas

- **Re-embedding everything nightly** is the most common cost mistake. Embed incrementally.
- **Model changes break comparisons.** Vectors from two different models aren't comparable. Store the model name/version next to the embedding and re-embed on change.
- **Index recall.** Approximate search can miss a true neighbour; tune `fraction_lists_to_search` or test with brute force on a sample.
- **LLM cost is per token, on top of BigQuery compute.** Estimate on a 1% sample first, and cap with `LIMIT` in development.
- **Governance still applies.** Embeddings of PII text are derived PII. Keep them under the same policy tags and row policies as the source.

## 6. Quiz

1. Your company is on BigQuery Standard edition. What fails?
   - a) `VECTOR_SEARCH` brute force. *Wrong: Standard can run it.*
   - b) **`CREATE VECTOR INDEX` use, and `CREATE MODEL`.** *Right: no indexes and no BigQuery ML in Standard.*
   - c) Loading data. *Wrong.*
   - d) Partitioning. *Wrong.*
2. Why add a vector index?
   - a) Exact results. *Wrong: an index makes results approximate.*
   - b) **Faster search on large tables at a small cost in recall.** *Right.*
   - c) Required for COSINE. *Wrong.*
   - d) Free storage. *Wrong: active index storage is billed.*
3. Predict which orders get returned, from structured features. Best first tool?
   - a) AI.GENERATE. *Wrong tool: structured prediction doesn't need an LLM.*
   - b) **BigQuery ML classifier (e.g. BOOSTED_TREE_CLASSIFIER).** *Right.*
   - c) VECTOR_SEARCH. *Wrong.*
   - d) A Dataflow pipeline. *Wrong.*

## 7. Exercises

**Warm-up.** Add two tickets to the lab ("refund for returned shoes still pending", "UPI payment failed twice") and re-run. Which queries change? *Solution:* both new tickets rank near the top for "refund pending" and "payment failed" respectively, because they share words; "money back..." still misses.

**Transfer.** Product wants "similar products" on the website with <100 ms latency for 50 k requests/minute. Is BigQuery VECTOR_SEARCH the serving layer? *Solution:* no. BigQuery is an analytics engine with query start-up overhead, not a low-latency key-value store. Compute embeddings and even nearest neighbours in BigQuery in batch, then serve from a low-latency store (Vector Search in Gemini Enterprise Agent Platform (formerly Vertex AI Vector Search), AlloyDB/pgvector, Bigtable or a cache).

**Stretch.** Design incremental embedding with model versioning. *Solution:* `ticket_emb(ticket_id, model_version, emb, embedded_at)` partitioned by `embedded_at`; a scheduled job embeds rows where no row exists for the current `model_version`; searches filter `model_version = @current`; on a model upgrade, backfill in batches under a budget, then switch `@current` and drop the old version.

## 8. Interview questions

- **(Junior) What is an embedding?** A fixed-length vector from a model where similar inputs map to nearby points, so "nearest neighbours" means "most similar".
- **(Mid) When would you use BigQuery ML instead of exporting data to a Python training job?** When the model type is supported, data is already in BigQuery, and you want SQL-level simplicity, governance and no data movement. Export when you need custom architectures, GPUs or libraries BigQuery doesn't offer.
- **(Senior) Design RAG over 50 M internal documents on GCP.** Ingest and chunk documents (Cloud Storage + object tables), embed incrementally, store with model version, vector index, retrieval with filters for permissions (row policies or per-tenant tables), generation with grounding and citations, evaluation set and quality metrics, cost guardrails per job, and a separate low-latency serving path if it's user-facing.

## 9. Sources (checked 2026-11-03)

- Vector search intro (VECTOR_SEARCH, AI.SEARCH, AI.EMBED, AI.GENERATE_EMBEDDING, pricing): https://cloud.google.com/bigquery/docs/vector-search-intro
- VECTOR_SEARCH reference (signature, distance types, options): https://cloud.google.com/bigquery/docs/reference/standard-sql/search_functions
- Vector indexes (IVF, TreeAH): https://cloud.google.com/bigquery/docs/vector-index
- Generative AI functions overview: https://cloud.google.com/bigquery/docs/generative-ai-overview
- Vertex AI renamed Gemini Enterprise Agent Platform (2026-04-22): https://cloud.google.com/gemini-enterprise-agent-platform/release-notes
- Edition feature matrix: https://cloud.google.com/bigquery/docs/editions-intro
