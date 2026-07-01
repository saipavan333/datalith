# Capstone: RAG ingestion pipeline (docs → vectors)

Retrieval-Augmented Generation turned **document ingestion** into a core data-engineering job. You build the offline
pipeline that turns messy documents into a clean, governed vector index an LLM can search — and the online retrieval
path that feeds it. This is ingestion, validation, transformation, storage and incremental updates: your existing
skills, plus four new ideas (chunking, embeddings, hybrid retrieval, access control).

@@diagram:rag-pipeline

## The shape

```
OFFLINE (you build this):  sources → load & parse → chunk → embed → vector store (+ metadata)
ONLINE  (you serve this):  query → embed → hybrid search → rerank → LLM answer (cites source)
```

## 1. Load & parse

Pull source files (PDFs, HTML, docs, tickets), extract clean text, and capture **metadata** you'll need later:
`source_uri`, `title`, `created_at`, and **access tags**. Keep the raw source for audit/replay.

```python
docs = []
for f in sources:
    text = parse(f)                      # pdf/html/doc -> text
    docs.append({"text": text, "source_uri": f.uri, "doc_id": stable_id(f),
                 "acl": f.access_tags})  # carry permissions through
```

## 2. Chunk — the single most important knob

Split text into retrievable pieces. The **2026 benchmark default is recursive ~512-token chunks with 10-20%
overlap**. Factoid Q&A favors 256-512; multi-hop analytical questions 512-1024. Getting the bracket wrong degrades
retrieval precision 15-30%, and semantic chunking creates 3-5x more fragments (more cost, more noise) for usually
marginal gains — so **start with recursive 512**.

```python
chunks = recursive_split(doc["text"], size=512, overlap=0.15)
chunks = [{"text": c, "doc_id": doc["doc_id"], "chunk_id": f'{doc["doc_id"]}:{i}',
           "source_uri": doc["source_uri"], "acl": doc["acl"]} for i, c in enumerate(chunks)]
```

The **stable `chunk_id`** is what makes updates idempotent and answers citable.

## 3. Redact PII, then embed

Redact/tokenize PII **before** embedding — once text is embedded the sensitive content is baked into the vector and
hard to control. Then embed (self-hosted BGE/GTE for sensitive data; a hosted model for convenience). Metadata
enrichment lifts answer accuracy more than swapping embedding models.

```python
chunks = redact_pii(chunks)              # BEFORE embedding!
vectors = embed([c["text"] for c in chunks], model="bge-large")
```

## 4. Store (idempotent upsert)

Write vectors + metadata to a vector store (Qdrant self-hosted, Pinecone managed). **Upsert by `chunk_id`** so a
re-ingest updates in place instead of duplicating.

```python
store.upsert(ids=[c["chunk_id"] for c in chunks], vectors=vectors,
             payload=chunks)            # payload keeps source_uri + acl for filtering/citation
```

## 5. Online retrieval (the data path you serve)

Query → embed → **hybrid search** (dense + sparse, fused with reciprocal-rank-fusion) → **rerank** (cross-encoder /
Cohere) to pass fewer, better chunks → LLM. Filter by the user's permissions using each chunk's `acl`
(**retrieval-native access control**) so answers only use documents the user may see.

```python
hits = store.hybrid_search(embed(query), k=20, filter=user.acl)   # dense+sparse + permissions
top  = rerank(query, hits)[:5]                                    # fewer, better chunks
answer = llm(build_prompt(query, top))                            # cite top[i]["source_uri"]
```

Rerankers add 50-200ms but cut LLM tokens by passing fewer chunks — usually a net win at scale.

## Cheat sheet

| Stage | Do | Watch |
|---|---|---|
| Parse | text + metadata (source_uri, acl) | keep raw for audit |
| Chunk | recursive ~512 tok, 10-20% overlap | #1 quality knob |
| Embed | redact PII first; enrich metadata | PII baked into vectors |
| Store | upsert by stable chunk_id | idempotency, citations |
| Retrieve | hybrid + RRF + rerank, filter by acl | latency vs token cost |

## Practice

1. Why is `chunk_id` the key to safe re-ingestion and citations?
2. Your factoid bot is vague — what's the first chunking change?
3. Why must PII redaction happen before, not after, embedding?
4. How do you guarantee a user only gets answers from documents they're allowed to read?
