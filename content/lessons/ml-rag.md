# RAG data pipelines — deep dive

RAG (Retrieval-Augmented Generation) is mostly a **data-engineering** problem wearing an AI hat. The model is off-the-shelf; what makes or breaks the system is the pipeline that **indexes** your documents and **retrieves** the right context at query time. This deep dive goes past the flow diagram into the decisions that actually move quality.

## Why RAG instead of fine-tuning?

| | RAG | Fine-tuning |
|---|---|---|
| Adds **new facts** | ✅ (just index them) | ⚠️ expensive, slow |
| **Fresh** data | ✅ re-index on change | ❌ retrain |
| **Citations** / provenance | ✅ you know the source chunk | ❌ opaque |
| **Access control** | ✅ filter at retrieval | ❌ baked into weights |
| Changes **style/behavior** | ❌ | ✅ |

Rule of thumb: **RAG for knowledge, fine-tuning for behavior.** Most enterprise "chat with our data" needs are RAG.

## Chunking — the single biggest lever

@@diagram:rag-chunking

Chunking decides what a "unit of retrieval" is. Get it wrong and no amount of model quality saves you.

- **Fixed-size + overlap** — simple, fast; e.g. 500 tokens with 50 overlap. Overlap stops a sentence being split across two chunks so its meaning survives.
- **Structural** — split on headings/paragraphs/markdown so each chunk is a coherent section. Usually better than fixed windows for docs.
- **Semantic** — split where the topic shifts (embedding-distance based). Best quality, most compute.

The trade-off: **small chunks** are precise but lose surrounding context; **large chunks** carry context but dilute the embedding and waste prompt tokens. Tune size/overlap against a retrieval metric, don't guess. Always keep **metadata** on each chunk (source doc, title, section, timestamp, ACL) — you'll filter and cite with it.

## Embeddings & the vector store

- **One model for both sides.** Embed documents and queries with the **same** model, or vectors live in different spaces and search is garbage. Match the model to your domain and languages.
- **Index types** — a flat (brute-force) index is exact but O(n); production uses **ANN** indexes (**HNSW**, IVF/PQ) that trade a little recall for huge speed. Know that ANN is *approximate* — recall is a tuning knob.
- **Stores** — pgvector (great when you already run Postgres), Milvus/Qdrant/Weaviate, Pinecone (managed). Choose on scale, filtering needs, and ops burden.

## Retrieval quality: filters, hybrid, rerank

- **Metadata filters** — restrict to tenant/date/permissions *before* similarity. This is also your **security** boundary (never retrieve chunks a user can't see).
- **Hybrid search** — combine keyword/BM25 with vector search so exact tokens (IDs, product names, error codes) aren't lost by fuzzy similarity.
- **Reranking** — retrieve a wide candidate set (top-50) cheaply, then a **cross-encoder reranker** reorders to the top-5 that go in the prompt. This fixes "relevant but ranked 9th."

## It's a data pipeline: freshness, idempotency, cost

- **Freshness** — re-embed **changed** docs via CDC/watermark, not a full nightly re-index of everything.
- **Idempotency** — **upsert** by a stable key (`doc_id:chunk_id`); delete vectors for removed docs/chunks so stale content can't surface.
- **Cost** — three meters run at once: embedding calls (index + every query), vector-store size, and LLM tokens (context length). Batch embeddings; cap top-k and context.

## Evaluation — RAG fails silently

Bad retrieval produces confident, wrong answers with no error. So **measure**:
- **Retrieval:** recall@k / hit-rate on a labeled query→chunk set (did the right chunk make the top-k?).
- **Generation:** **groundedness** (is every claim supported by retrieved context?) and **answer relevance**. Tooling like RAGAS or an LLM-as-judge with a golden set works; the point is a *number you can regress against*, not vibes.

## Gotchas

- **Mismatched embeddings** for query vs docs → silent nonsense. Pin the model version.
- **Chunk too large** → the relevant sentence is drowned; the embedding represents the average topic, not your answer.
- **No metadata filter on a multi-tenant store** → data leak across tenants (a security incident, not a bug).
- **Full re-index every run** → cost and latency explode; use incremental CDC.
- **No eval harness** → you can't tell if a change helped; you're flying blind.
- **Ignoring deletes** → "I deleted that doc but the bot still quotes it" because its vectors were never removed.

## Worked scenario

*"Build a support-docs assistant over 50k articles, updated hourly, multi-team (each team sees only its space)."*

Index: CDC on the docs DB → structural chunking (~400 tokens, 40 overlap) → embed → upsert into a vector store keyed by `article_id:chunk`, with `team`, `updated_at`, and `acl` metadata; delete on article removal. Query: embed question → **filter by the user's `team`/ACL** → hybrid top-50 → cross-encoder rerank → top-5 into a "answer only from context, cite article titles" prompt → LLM. Ops: batch embeddings, dashboards for recall@5 and groundedness, alert if recall drops (a re-index or model regression). Every hard part here is data engineering — retrieval correctness, freshness, permissions, and cost — not the LLM.

## Practice

1. Your RAG bot quotes a document that was deleted last week. What did the pipeline miss, and how do you fix it going forward?
2. Recall@5 is high but answers are still wrong. Where's the problem now, and what do you measure?
3. Why must documents and queries be embedded with the same model? What breaks if they aren't?
4. Design the freshness strategy for a 2M-chunk index where 0.5% of docs change hourly.
5. A multi-tenant RAG service must never leak one tenant's docs to another. Where in the pipeline is that enforced, and why there?
