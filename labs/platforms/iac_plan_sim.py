"""Infrastructure-as-Code lab: what `terraform plan` actually computes.

Terraform compares three things: the desired config (.tf), the state file (what it created
last time) and the real world (refresh). The plan is the diff: create (+), update in place (~),
replace (-/+) when an immutable argument changes, destroy (-). Drift is when the real world
changed behind Terraform's back. This lab runs that algorithm in plain Python on a small
three-platform estate so you can watch it, then prints the real HCL for the same resources.

Terraform itself is NOT run here (it is not installed in this environment, and `terraform init`
downloads the google / databricks / snowflake providers). The exact cloud steps are in the lesson,
labelled "needs your account".

Simplification: the real databricks_cluster_policy takes a JSON `definition`; here its two limits
are flattened into top-level fields so the diff is easy to read.

Run:  python labs/platforms/iac_plan_sim.py
"""
import copy
import json

IMMUTABLE = {"google_bigquery_dataset": {"location"}, "snowflake_warehouse": set(), "databricks_cluster_policy": set()}

desired = {
    "google_bigquery_dataset.raw": {"type": "google_bigquery_dataset", "dataset_id": "raw", "location": "US",
                                    "default_table_expiration_ms": None, "labels": {"team": "data-platform"}},
    "google_bigquery_dataset.mart": {"type": "google_bigquery_dataset", "dataset_id": "mart", "location": "US",
                                     "labels": {"team": "analytics"}},
    "snowflake_warehouse.bi": {"type": "snowflake_warehouse", "name": "BI_WH", "warehouse_size": "SMALL",
                               "auto_suspend": 60, "auto_resume": True},
    "databricks_cluster_policy.jobs_small": {"type": "databricks_cluster_policy", "name": "jobs-small",
                                             "max_workers": 8, "autotermination_minutes": 20},
}
state = {   # what Terraform recorded after the last apply
    "google_bigquery_dataset.raw": {"type": "google_bigquery_dataset", "dataset_id": "raw", "location": "EU",
                                    "default_table_expiration_ms": None, "labels": {"team": "data-platform"}},
    "snowflake_warehouse.bi": {"type": "snowflake_warehouse", "name": "BI_WH", "warehouse_size": "SMALL",
                               "auto_suspend": 600, "auto_resume": True},
    "databricks_cluster_policy.jobs_small": {"type": "databricks_cluster_policy", "name": "jobs-small",
                                             "max_workers": 8, "autotermination_minutes": 20},
    "snowflake_warehouse.old_adhoc": {"type": "snowflake_warehouse", "name": "ADHOC_WH", "warehouse_size": "LARGE",
                                      "auto_suspend": 600, "auto_resume": True},
}
real = copy.deepcopy(state)
real["databricks_cluster_policy.jobs_small"]["max_workers"] = 50   # someone edited it in the UI (drift)


def plan(desired, state, real):
    print("Refreshing state... (reading the real world)")
    for addr in state:
        if real.get(addr) != state[addr]:
            changed = {k: (state[addr][k], real[addr][k]) for k in state[addr] if state[addr][k] != real[addr].get(k)}
            print(f"  ! drift detected on {addr}: {changed}")
    cur = real
    actions = []
    for addr, want in desired.items():
        have = cur.get(addr)
        if have is None:
            actions.append(("+", addr, {k: v for k, v in want.items() if k != "type"}))
            continue
        diffs = {k: (have.get(k), v) for k, v in want.items() if have.get(k) != v}
        if not diffs:
            continue
        forces = set(diffs) & IMMUTABLE[want["type"]]
        actions.append(("-/+" if forces else "~", addr, diffs if not forces else {**diffs, "forces replacement": sorted(forces)}))
    for addr in cur:
        if addr not in desired:
            actions.append(("-", addr, {}))
    return actions


acts = plan(desired, state, real)
print("\nTerraform will perform the following actions:")
for sym, addr, detail in acts:
    print(f"  {sym:3} {addr}  {json.dumps(detail)}")
c = sum(a[0] in ('+', '-/+') for a in acts); u = sum(a[0] == '~' for a in acts); d = sum(a[0] in ('-', '-/+') for a in acts)
print(f"\nPlan: {c} to add, {u} to change, {d} to destroy.")
print("\nWhat to look for:")
print(" - A BigQuery dataset's location can't change in place: -/+ means destroy and recreate. With tables inside,")
print("   the google provider refuses the destroy unless delete_contents_on_destroy = true (then it is data loss).")
print(" - The UI edit (max_workers=50) is drift; the plan puts it back to 8. Code is the source of truth.")
print(" - ADHOC_WH was deleted from code, so plan destroys it. Review every '-' before you apply.")
