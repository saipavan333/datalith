# 10 · RAG ingestion pipeline

The full RAG ingestion shape — **load → chunk → embed → upsert → hybrid retrieve → rerank** — runnable **offline** (a
deterministic hashing embedder means no model download).

```bash
pip install -r requirements.txt
python run.py "How do I get ACID and time travel on a data lake?"
```

## What it does

1. **Ingest** a small built-in corpus; **recursive chunking** with overlap.
2. **Embed** each chunk and store it keyed by a stable **`chunk_id`** (idempotent upsert).
3. **Hybrid retrieve** — dense (cosine) + sparse (keyword) fused with **reciprocal-rank-fusion**.
4. Return the **reranked** top chunks **with citations** (doc + chunk_id) — the context an LLM would answer from.

## Production mapping

- Hashing embedder → **sentence-transformers** (local) or a hosted embedding model (`pip install sentence-transformers`).
- In-memory vectors → **Qdrant / pgvector / Pinecone**.
- Add **PII redaction before embedding**, a cross-encoder **reranker**, and **retrieval-native access control** (filter
  by the user's permissions on each chunk's metadata).
