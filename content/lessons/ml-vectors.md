# Embeddings & vector databases — the complete guide

The modern AI layer runs on **embeddings**, and building the pipelines around them is where data engineering meets
GenAI. This guide covers what embeddings are, vector databases and ANN search, the embedding/retrieval pipeline you'll
build, RAG, and scenarios.

## 1. Embeddings

@@diagram:vector-search

An **embedding** turns text (or images, audio) into a **vector** — a list of numbers — that captures **meaning**.
Similar items land near each other in vector space, so "car" and "automobile" are close even though they share no
letters. A model produces them:

```python
from sentence_transformers import SentenceTransformer
emb = SentenceTransformer("all-MiniLM-L6-v2")        # 384-dim vectors, runs locally
vec = emb.encode("How do I reset my password?")      # -> np.array shape (384,)
# or a hosted API: OpenAI / Cohere embeddings for higher quality
```

Unlike keyword search, embeddings match on **semantics**, so paraphrases and synonyms are found.

## 2. Vector databases & ANN

A **vector database** (Pinecone, Weaviate, Qdrant, Milvus, **pgvector**, FAISS) stores embeddings + metadata and does
**similarity search**: given a query vector, return the nearest stored vectors fast.

Exact nearest-neighbor search over millions of high-dimensional vectors is too slow, so they use **Approximate Nearest
Neighbor (ANN)** indexes — **HNSW** (a navigable graph) or **IVF** (inverted file). ANN trades a tiny bit of recall for
massive speed.

```python
import qdrant_client
from qdrant_client.models import VectorParams, Distance
q = qdrant_client.QdrantClient(":memory:")
q.create_collection("docs", vectors_config=VectorParams(size=384, distance=Distance.COSINE))
```

Distance metric matters: **cosine** (angle, common for text), **dot product**, or **Euclidean**.

## 3. The embedding pipeline (the DE's job)

Indexing documents is an ETL pipeline:

```python
# 1) ingest + CHUNK — split documents into passages (size + overlap matter)
chunks = []
for doc in documents:
    for piece in chunk_text(doc.text, size=500, overlap=50):
        chunks.append({"id": f"{doc.id}:{piece.i}", "text": piece.text,
                       "meta": {"source": doc.id, "lang": doc.lang}})

# 2) EMBED in batches (rate-limit hosted APIs)
vectors = emb.encode([c["text"] for c in chunks], batch_size=64)

# 3) UPSERT vectors + metadata, build the index
q.upsert("docs", points=[
    {"id": c["id"], "vector": v.tolist(), "payload": c["meta"] | {"text": c["text"]}}
    for c, v in zip(chunks, vectors)])
```

**Keep it fresh:** documents change, so re-embed and upsert on update (and delete removed ones) — an embedding ETL job.

## 4. Retrieval

```python
# embed the query, search top-k (optionally filter on metadata)
qv = emb.encode("forgot my password").tolist()
hits = q.search("docs", query_vector=qv, limit=5,
                query_filter={"must": [{"key": "lang", "match": {"value": "en"}}]})
context = "\n".join(h.payload["text"] for h in hits)
```

## 5. RAG — the dominant LLM pattern

**Retrieval-Augmented Generation** grounds an LLM in *your* data: retrieve relevant chunks, then put them in the
prompt so the model answers from facts instead of hallucinating.

```python
def answer(question: str) -> str:
    qv = emb.encode(question).tolist()
    hits = q.search("docs", query_vector=qv, limit=5)
    context = "\n\n".join(h.payload["text"] for h in hits)
    prompt = f"Answer using ONLY this context:\n{context}\n\nQuestion: {question}"
    return llm(prompt)        # the LLM answers grounded in retrieved context
```

The **DE builds the retrieval pipeline** — chunking, embedding, indexing, freshness, filtering — that makes RAG accurate.

## 6. Quality levers (it's a data problem)

| Lever | Effect |
|---|---|
| **chunk size / overlap** | too big = noisy context; too small = lost meaning |
| **embedding model / dims** | quality vs cost/latency |
| **metadata** | enables filtering (by source, date, language, permissions) |
| **ANN params** (HNSW `M`, `ef`) | recall vs speed |
| **hybrid search** | combine vector + keyword (BM25) for the best of both |
| **re-ranking** | a second model reorders top-k for precision |

## 7. Use cases beyond RAG

- **Semantic search** over docs/tickets/products.
- **Recommendations** — "items similar to this".
- **De-duplication / clustering** — near-duplicate detection.
- **Anomaly detection** — outliers in embedding space.

## 8. Scenario — a support knowledge base

```
1. nightly job: pull updated help articles -> chunk -> embed -> upsert to Qdrant (with source metadata)
2. a bot embeds the user's question -> top-5 retrieval (filter to the user's product) -> RAG answer with citations
3. log retrieved chunks + answer for evaluation; re-embed on article changes
```

## 9. Practice

1. Outline the steps to index a document corpus for semantic search.
2. Why use ANN instead of exact nearest-neighbor search at scale?
3. Write the retrieval half of a RAG function (embed query → top-k → context).
4. Name three quality levers in a RAG pipeline and what each affects.

Embeddings + vector search are the data layer under modern AI, and the chunk→embed→index→retrieve pipeline is squarely
data engineering — making you central to every GenAI product your company builds.
