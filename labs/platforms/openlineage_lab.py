"""OpenLineage lab: emit spec-shaped RunEvents for a 3-job pipeline, collect them the way a
backend (Marquez, Google's Data Lineage API, a catalog) would, then answer "what breaks
downstream if this table changes?" with a recursive query.

Event shape follows the OpenLineage spec (https://openlineage.io/docs/spec/object-model):
eventType START/COMPLETE/FAIL..., eventTime, run{runId}, job{namespace,name},
inputs/outputs [{namespace,name,facets}], producer, schemaURL. No network: events are written
to a JSONL file (OpenLineage's FileTransport does the same) and read back with DuckDB.
Google's Data Lineage API accepts these via projects.locations:processOpenLineageRunEvent
(https://cloud.google.com/dataplex/docs/open-lineage).

Run:  python labs/platforms/openlineage_lab.py
"""
import json
import os
import tempfile
import uuid
from datetime import datetime, timedelta, timezone

import duckdb

SCHEMA_URL = "https://openlineage.io/spec/2-0-2/OpenLineage.json#/definitions/RunEvent"
PRODUCER = "https://github.com/datalith/labs/openlineage_lab"
out = os.path.join(tempfile.mkdtemp(prefix="ol_"), "events.jsonl")
t0 = datetime(2026, 11, 3, 2, 0, tzinfo=timezone.utc)


def ds(ns, name, fields=None):
    d = {"namespace": ns, "name": name, "facets": {}}
    if fields:
        d["facets"]["schema"] = {"_producer": PRODUCER,
                                 "_schemaURL": "https://openlineage.io/spec/facets/1-1-1/SchemaDatasetFacet.json",
                                 "fields": [{"name": f, "type": t} for f, t in fields]}
    return d


def emit(job_ns, job, inputs, outputs, minutes, fail=False):
    run_id = str(uuid.uuid4())
    with open(out, "a") as f:
        for i, etype in enumerate(["START", "FAIL" if fail else "COMPLETE"]):
            f.write(json.dumps({
                "eventType": etype, "eventTime": (t0 + timedelta(minutes=minutes + i * 5)).isoformat(),
                "run": {"runId": run_id, "facets": {}}, "job": {"namespace": job_ns, "name": job, "facets": {}},
                "inputs": inputs, "outputs": outputs, "producer": PRODUCER, "schemaURL": SCHEMA_URL}) + "\n")


PG, BQ, SF = "postgres://orders-db:5432", "bigquery", "snowflake://acme.us-east-1"
emit("airflow", "ingest_orders", [ds(PG, "shop.public.orders")],
     [ds(BQ, "acme-prod.raw.orders", [("order_id", "INT64"), ("amount", "NUMERIC")])], 0)
emit("dataform", "build_fct_orders", [ds(BQ, "acme-prod.raw.orders"), ds(BQ, "acme-prod.raw.customers")],
     [ds(BQ, "acme-prod.mart.fct_orders")], 20)
emit("spark", "revenue_forecast", [ds(BQ, "acme-prod.mart.fct_orders")], [ds(BQ, "acme-prod.ml.revenue_forecast")], 40)
emit("fivetran", "reverse_etl_to_snowflake", [ds(BQ, "acme-prod.mart.fct_orders")], [ds(SF, "FINANCE.PUBLIC.ORDERS_DAILY")], 45, fail=True)

con = duckdb.connect()
con.execute(f"CREATE TABLE ev AS SELECT * FROM read_json_auto('{out}')")
print("events collected:", con.execute("SELECT count(*) FROM ev").fetchone()[0])
print("run states:", con.execute("SELECT job.name, eventType FROM ev ORDER BY eventTime").fetchall())
con.execute("""
CREATE TABLE edges AS
SELECT DISTINCT i.namespace || '/' || i.name AS src, o.namespace || '/' || o.name AS dst, e.job.name AS job
FROM ev e, unnest(e.inputs) t(i), unnest(e.outputs) u(o) WHERE e.eventType = 'START'""")
print("\nlineage edges:")
for r in con.execute("SELECT * FROM edges ORDER BY 1").fetchall():
    print(f"  {r[0]:38} --[{r[2]}]--> {r[1]}")

print("\nImpact analysis: everything downstream of postgres orders (a column is being renamed)")
rows = con.execute("""
WITH RECURSIVE down(node, depth) AS (
  SELECT 'postgres://orders-db:5432/shop.public.orders', 0
  UNION SELECT e.dst, d.depth + 1 FROM edges e JOIN down d ON e.src = d.node)
SELECT node, depth FROM down WHERE depth > 0 ORDER BY depth, node""").fetchall()
for n, d in rows:
    print(f"  {'  ' * d}depth {d}: {n}")
print("\nLast failed run (who to page):",
      con.execute("SELECT job.name, eventTime FROM ev WHERE eventType='FAIL'").fetchall())
print("\nWhat to look for: no tool had to know about the others; each just emitted START/COMPLETE with")
print("inputs/outputs, and the graph (and blast radius) falls out of a join.")
