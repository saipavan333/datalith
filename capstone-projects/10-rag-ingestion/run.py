"""
Capstone 10 — RAG ingestion pipeline (docs -> chunks -> vectors -> hybrid search).

Offline by default: a deterministic hashing embedder means no model download or network.
Shows the real shape: load -> chunk (recursive, overlap) -> embed -> upsert by chunk_id
-> hybrid (dense + sparse) retrieval -> rerank -> cited answer context.

Run:  python run.py "your question"
Output: ./out/index.json (vectors + metadata)
"""
from __future__ import annotations
import json, re, sys, hashlib, math
from pathlib import Path

import numpy as np

OUT = Path(__file__).parent / "out"
DIM = 256

# ---- a tiny built-in corpus (stand-in for your PDFs/docs) ----
DOCS = {
    "lakehouse.md": """A lakehouse combines cheap object storage with warehouse reliability.
        Table formats like Apache Iceberg and Delta Lake add ACID transactions, time travel,
        and schema evolution on top of Parquet files. This avoids the data swamp problem.""",
    "streaming.md": """Real-time pipelines use Kafka as a durable event log. Stream processors
        like Flink handle event-time windows and watermarks for late data, with exactly-once
        guarantees via checkpointing. Use streaming for sub-second freshness.""",
    "governance.md": """Data contracts shift quality left: producers agree a schema and SLAs,
        enforced in CI so breaking changes are blocked before they reach consumers. Observability
        tracks freshness, volume, schema, and lineage.""",
}


# ---- deterministic, offline embedding (hashed bag-of-words) ----
def embed(text: str) -> np.ndarray:
    vec = np.zeros(DIM, dtype=np.float32)
    for tok in re.findall(r"[a-z0-9]+", text.lower()):
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
        vec[h % DIM] += 1.0
    n = np.linalg.norm(vec)
    return vec / n if n else vec


def recursive_chunk(text: str, size: int = 240, overlap: int = 40):
    words = text.split()
    chunks, step = [], max(1, size - overlap)
    # approximate char-size chunking via words
    buf, cur = [], 0
    i = 0
    while i < len(words):
        buf, cur = [], 0
        j = i
        while j < len(words) and cur < size:
            buf.append(words[j]); cur += len(words[j]) + 1; j += 1
        chunks.append(" ".join(buf))
        i += max(1, (j - i) - (overlap // 6))   # word-overlap approximation
    return chunks


def build_index():
    OUT.mkdir(exist_ok=True)
    index = []  # list of {chunk_id, doc, text, vec, tokens}
    for doc, text in DOCS.items():
        for k, ch in enumerate(recursive_chunk(" ".join(text.split()))):
            cid = f"{doc}:{k}"
            index.append({
                "chunk_id": cid, "doc": doc, "text": ch,
                "vec": embed(ch).tolist(),
                "tokens": sorted(set(re.findall(r"[a-z0-9]+", ch.lower()))),
            })
    # upsert by chunk_id (idempotent): de-dupe keeping last
    dedup = {c["chunk_id"]: c for c in index}
    index = list(dedup.values())
    (OUT / "index.json").write_text(json.dumps(index))
    return index


def hybrid_search(index, query: str, k: int = 3):
    qv = embed(query)
    qtok = set(re.findall(r"[a-z0-9]+", query.lower()))
    dense, sparse = [], []
    for c in index:
        dscore = float(np.dot(qv, np.array(c["vec"], dtype=np.float32)))   # cosine (normalized)
        sscore = len(qtok & set(c["tokens"])) / (len(qtok) or 1)            # keyword overlap
        dense.append((c["chunk_id"], dscore)); sparse.append((c["chunk_id"], sscore))
    # reciprocal rank fusion of the two rankings
    def ranks(scores):
        return {cid: r for r, (cid, _) in enumerate(sorted(scores, key=lambda x: -x[1]))}
    rd, rs = ranks(dense), ranks(sparse)
    rrf = {cid: 1/(60+rd[cid]) + 1/(60+rs[cid]) for cid in rd}
    top = sorted(rrf, key=lambda c: -rrf[c])[:k]
    by_id = {c["chunk_id"]: c for c in index}
    return [by_id[cid] for cid in top]


def main():
    query = sys.argv[1] if len(sys.argv) > 1 else "How do I get ACID and time travel on a data lake?"
    print("1) INGEST docs -> chunk -> embed -> upsert by chunk_id")
    index = build_index()
    print(f"   {len(DOCS)} docs -> {len(index)} chunks indexed (dim={DIM})")

    print(f"2) RETRIEVE (hybrid dense+sparse, RRF) for: {query!r}")
    hits = hybrid_search(index, query, k=3)

    print("3) RERANKED context (top chunks, with citations):")
    for i, c in enumerate(hits, 1):
        snippet = (c["text"][:90] + "...") if len(c["text"]) > 90 else c["text"]
        print(f"   [{i}] ({c['chunk_id']})  {snippet}")
    print(f"\n   -> an LLM would answer from these chunks and cite {', '.join(h['doc'] for h in hits)}")
    print("\nDONE. Swap the hashing embedder for sentence-transformers / a hosted model, and")
    print("the vector list for Qdrant/pgvector to productionize. Index is idempotent by chunk_id.")


if __name__ == "__main__":
    main()
