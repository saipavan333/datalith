"""Vector search stand-in lab: what BigQuery VECTOR_SEARCH, Snowflake VECTOR_COSINE_SIMILARITY
and Databricks AI Search do underneath, using DuckDB's fixed-size ARRAY type.

Real platforms get embeddings from a model (BigQuery AI.GENERATE_EMBEDDING / AI.EMBED,
Snowflake AI_EMBED, Databricks AI Search managed embeddings). To stay offline and free we
use a deterministic hashed bag-of-words embedding (a toy, on purpose: it can't know that
"refund" and "money back" mean the same thing, which is exactly why real embeddings exist).
The search itself (top-k by cosine distance, brute force = what an index approximates) is real.

Run:  python labs/platforms/vector_search_lab.py
"""
import hashlib
import math

import duckdb

DIM = 64


def embed(text):
    v = [0.0] * DIM
    for w in text.lower().replace(",", " ").replace(".", " ").split():
        h = int(hashlib.md5(w.encode()).hexdigest(), 16)
        v[h % DIM] += 1.0 if (h >> 8) % 2 else -1.0
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


tickets = [
    (1, "card payment failed at checkout on mobile app"),
    (2, "refund not received after returning the shoes"),
    (3, "delivery delayed, courier says address not found"),
    (4, "app crashes when I open the checkout page"),
    (5, "charged twice for the same order, need refund"),
    (6, "want to change delivery address for my order"),
    (7, "payment failed with UPI but money debited"),
    (8, "return pickup did not happen, refund pending"),
]
con = duckdb.connect()
con.execute(f"CREATE TABLE tickets (id INT, body VARCHAR, emb FLOAT[{DIM}])")
for i, body in tickets:
    con.execute("INSERT INTO tickets VALUES (?, ?, ?)", [i, body, embed(body)])


def search(q, k=3):
    return con.execute(f"""
      SELECT id, body, round(array_cosine_distance(emb, ?::FLOAT[{DIM}]), 3) AS distance
      FROM tickets ORDER BY distance LIMIT {k}""", [embed(q)]).fetchall()


for q in ["payment failed", "refund pending", "money back for returned item"]:
    print(f"query: {q!r}")
    for r in search(q):
        print(f"   #{r[0]} d={r[2]:.3f}  {r[1]}")
print("""
Equivalent on the platforms (needs your account):
  BigQuery:  SELECT base.id, base.body, distance FROM VECTOR_SEARCH(TABLE support.tickets, 'emb',
               (SELECT emb FROM support.queries), top_k => 3, distance_type => 'COSINE');
  Snowflake: SELECT id, body, VECTOR_COSINE_SIMILARITY(emb, AI_EMBED('snowflake-arctic-embed-m-v1.5', :q)) s
               FROM tickets ORDER BY s DESC LIMIT 3;   -- check AI_EMBED model names in your region
  Databricks: create an AI Search index on the Delta table, then query it from SQL with vector_search()
What to look for: lexical overlap works ('payment failed'), but 'money back for returned item' misses the refund
tickets: a hashed bag of words has no meaning, a trained embedding model does. That gap is the whole point.""")
