"""GCP data-access lab: IAM inheritance + BigQuery row access policies + column policy tags,
evaluated the way BigQuery evaluates them, on DuckDB.

Layers a query must pass, in order:
  1. IAM: roles/bigquery.jobUser on the project that RUNS the job, plus read access
     (e.g. roles/bigquery.dataViewer) on the dataset or table. Grants are inherited
     organization -> folder -> project -> dataset -> table.
  2. Column-level security: columns tagged with a policy tag need the Fine-Grained Reader
     role (roles/datacatalog.categoryFineGrainedReader) on that tag. Without it, a query that
     selects the column fails (it is not silently nulled); a data masking rule can instead
     return a masked value.
  3. Row-level security: CREATE ROW ACCESS POLICY ... GRANT TO (...) FILTER USING (...).
     Once a table has any row access policy, users not in any policy's grantee list see 0 rows.
Sources (checked 2026-11-03): https://cloud.google.com/bigquery/docs/column-level-security-intro
  https://cloud.google.com/bigquery/docs/row-level-security-intro  https://cloud.google.com/bigquery/docs/access-control

Run:  python labs/platforms/gcp_iam_sim.py
"""
import duckdb

con = duckdb.connect()
con.execute("""CREATE TABLE claims AS SELECT * FROM (VALUES
  (1, 'MH', 'Asha R',   '9876500001', 42000),
  (2, 'KA', 'Vikram S', '9876500002', 15500),
  (3, 'MH', 'Neha P',   '9876500003', 7800),
  (4, 'TN', 'Arun K',   '9876500004', 91000)) t(claim_id, state, patient_name, phone, amount)""")
POLICY_TAGGED = {"patient_name": "pii.high", "phone": "pii.high"}
ROW_POLICIES = [  # name, grantees, filter
    ("mh_team", {"group:claims-mh@acme.com"}, "state = 'MH'"),
    ("all_rows_for_audit", {"group:audit@acme.com"}, "TRUE"),
]
# IAM bindings by resource level; a principal's effective roles = union up the hierarchy
IAM = {
    "org/acme":                    {"group:audit@acme.com": {"roles/bigquery.dataViewer"}},
    "project/claims-prod":         {"group:claims-mh@acme.com": {"roles/bigquery.jobUser"},
                                    "group:audit@acme.com": {"roles/bigquery.jobUser"},
                                    "user:intern@acme.com": {"roles/bigquery.jobUser"}},
    "dataset/claims-prod.health":  {"group:claims-mh@acme.com": {"roles/bigquery.dataViewer"},
                                    "user:intern@acme.com": {"roles/bigquery.dataViewer"}},
}
FINE_GRAINED = {"pii.high": {"group:audit@acme.com"}}
HIERARCHY = ["org/acme", "project/claims-prod", "dataset/claims-prod.health"]


def roles(p):
    return set().union(*(IAM.get(r, {}).get(p, set()) for r in HIERARCHY))


def query(principal, cols):
    r = roles(principal)
    if "roles/bigquery.jobUser" not in r:
        return "DENIED: no bigquery.jobs.create on the project"
    if "roles/bigquery.dataViewer" not in r:
        return "DENIED: no read on dataset"
    for c in cols:
        tag = POLICY_TAGGED.get(c)
        if tag and principal not in FINE_GRAINED.get(tag, set()):
            return f"DENIED: Access Denied on column {c} (policy tag {tag})"
    filters = [f for _, who, f in ROW_POLICIES if principal in who]
    where = " OR ".join(f"({f})" for f in filters) if filters else "FALSE"   # no matching policy -> no rows
    return con.execute(f"SELECT {', '.join(cols)} FROM claims WHERE {where} ORDER BY claim_id").fetchall()


tests = [
    ("group:claims-mh@acme.com", ["claim_id", "state", "amount"]),
    ("group:claims-mh@acme.com", ["claim_id", "patient_name"]),
    ("group:audit@acme.com",     ["claim_id", "patient_name", "amount"]),
    ("user:intern@acme.com",     ["claim_id", "amount"]),
    ("user:contractor@acme.com", ["claim_id"]),
]
for p, cols in tests:
    print(f"{p:27} SELECT {', '.join(cols):28} -> {query(p, cols)}")
print("\nWhat to look for: audit gets read via an ORG-level grant (inheritance); the MH team sees only MH rows;")
print("selecting a tagged column without Fine-Grained Reader fails; the intern has IAM read but matches no")
print("row policy, so they get an empty result, not an error.")
