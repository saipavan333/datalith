# Orchestration beyond Airflow: assets, partitions and staleness (Dagster), and what Airflow 3 changed

An orchestrator decides **what runs, when, in what order, and what happens when it fails**. Airflow made "pipelines as Python code" the norm. Dagster and Prefect changed the question it answers. Airflow 3 then borrowed some of those ideas. You will be asked to compare them, and on the job you'll inherit one of them.

Versions checked 2026-11-03: Apache Airflow 3.3.2, Dagster 1.13.28.

## The picture to keep in your head

A **task scheduler** is a kitchen timer list: "at 6:00 boil water, then cook pasta, then plate". It knows the steps ran. It doesn't know whether there is pasta on the plate.

An **asset-aware orchestrator** is a fridge inventory: "these dishes should exist, made from these ingredients". When the tomatoes are replaced, it knows exactly which dishes are now out of date and remakes only those.

@@diagram:dagster-assets

## 1. Task-centric: Airflow

A DAG is a graph of **tasks**. The scheduler creates a **DAG run** per schedule interval, tied to a **logical date**, and runs tasks in dependency order with retries. What Airflow 3 (3.0 shipped in 2025; 3.3 is current) changed for DAG authors:

- **New import home.** `from airflow.sdk import DAG, dag, task` replaces `airflow.models.dag.DAG` and `airflow.decorators`. The old paths still work with deprecation warnings in 3.1 and are slated for removal. Operators like `PythonOperator` and `BashOperator` moved into the `apache-airflow-providers-standard` package.
- **No direct metadata-DB access from task code.** Tasks talk to the API server through the Task SDK.
- **SubDAGs are gone.** Use TaskGroups, assets and data-aware scheduling.
- **`execution_date` is gone** from the task context; use `logical_date`.
- **`catchup` now defaults to `False`**, so a new DAG with an old `start_date` no longer backfills years of runs by surprise.
- **Datasets were renamed Assets** (`airflow.sdk.Asset`). A DAG can be scheduled on an asset being updated, which is Airflow's step toward data awareness.

Airflow 3 TaskFlow style (from the Airflow docs; not executed in this course because a full Airflow install is too heavy for the laptop budget):

```python
from airflow.sdk import dag, task
import pendulum

@dag(schedule="0 6 * * *", start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),
     catchup=False, default_args={"retries": 2})
def daily_sales():
    @task
    def extract(): ...
    @task
    def transform(rows): ...
    @task
    def load(rows): ...
    load(transform(extract()))

daily_sales()
```

## 2. Asset-centric: Dagster

You declare **software-defined assets**: a table, file or model, plus the function that produces it and what it depends on. The orchestrator then knows, per asset and per partition, **when it was last built, from which upstream versions, and whether it is stale**.

Core concepts:

- **Asset**: `@dg.asset` on a function. Dependencies come from `deps=[...]` or from function parameters named after upstream assets.
- **Partitions**: `dg.DailyPartitionsDefinition(start_date=...)`; inside the asset, `context.partition_key` is the day being built. Backfill = select partitions and launch, one run per partition (the Dagster daemon queues them).
- **Asset checks**: `@dg.asset_check(asset=...)` returns `dg.AssetCheckResult(passed=...)`. With `blocking=True` a failed check stops downstream assets from materializing.
- **Resources**: configured clients (warehouse, S3, API) injected into assets, so tests swap in fakes.
- **Schedules and sensors**: run on time, or when something external changes (a file lands, an upstream asset updates).
- **Definitions**: the object that registers assets, checks, resources, schedules and sensors for a code location.

Dagster code (from Dagster's docs; not executed here):

```python
import dagster as dg

daily = dg.DailyPartitionsDefinition(start_date="2026-01-01")

@dg.asset(partitions_def=daily)
def raw_orders(context: dg.AssetExecutionContext) -> None:
    day = context.partition_key          # e.g. "2026-11-05"
    ...                                  # land that day's file into bronze

@dg.asset(partitions_def=daily, deps=[raw_orders])
def stg_orders() -> None: ...

@dg.asset_check(asset=stg_orders, blocking=True)
def no_negative_amounts():
    ...
    return dg.AssetCheckResult(passed=True)
```

## 3. Prefect in one paragraph

Prefect flows are plain Python functions with `@flow` and `@task`. The graph is built at runtime, so loops and conditionals shape the work dynamically, and the same code runs locally or on remote workers. It suits dynamic, code-first workflows (an API returns 300 accounts today, fan out 300 tasks) with light ops. It is task-centric like Airflow, not asset-centric like Dagster.

## 4. Choosing

| Question | Airflow 3 | Dagster | Prefect |
|---|---|---|---|
| Unit of thinking | tasks in a DAG run | data assets and partitions | Python flows and tasks |
| "What's stale?" | you reason it out; asset-triggered DAGs help | built in, per partition | you reason it out |
| Backfill | rerun DAG runs per logical date | select asset partitions | rerun flows with parameters |
| Data quality hook | separate tasks or tools | asset checks, can block downstream | separate tasks |
| Ecosystem / hiring | largest | strong in modern data stacks | smaller, Python-heavy teams |

A sensible default: **join the incumbent** if one exists (migrations are expensive). On a greenfield analytics platform where dbt models, lakehouse tables and ML features are the product, Dagster's asset model maps directly to what you're responsible for. For mostly operational job scheduling across many systems, Airflow's ecosystem wins.

## 5. Worked example: a corrected source file

A marketplace has **600 dbt models and 140 ingestion jobs**, daily-partitioned for 3 years (about 1,100 partitions each). On Thursday the payments provider re-sends Tuesday's settlement file with corrections.

- **Task-centric**: someone works out which downstream DAGs read settlements (there are 9), clears Tuesday's runs for each, and hopes nobody missed the finance mart built in a tenth DAG. A careful engineer spends an hour; a tired one misses a table.
- **Asset-centric**: the sensor sees the new file and marks `raw_settlements[Tuesday]` updated. Every downstream asset partition for Tuesday is now stale, about 30 asset-partitions across ingestion, dbt and the finance mart. Materialize stale: 30 partition builds, not 600 models times 1,100 days, and not a hand-made list.
- **Check**: a blocking check `settlement_totals_match_bank` on the staging asset stops the finance mart if the corrected file doesn't reconcile.

## 6. Hands-on lab: watch staleness and blocking checks work

Plain Python, no installs. `labs/pipe-orchestrators.py` is a ~60-line stand-in for the asset model (assets, deps, daily partitions, data versions, a blocking check). It is not Dagster; it shows the ideas so you can see them work. Run `python labs/pipe-orchestrators.py`.

```python
"""Lab: what an asset-aware orchestrator knows that a task scheduler doesn't.
A ~60-line stand-in for Dagster's model (assets, deps, daily partitions, staleness, asset checks).
Plain Python, no installs. This is NOT Dagster; it reproduces the ideas so you can watch them work.
"""
import datetime as dt, hashlib, itertools

DAYS = [(dt.date(2026, 11, 1) + dt.timedelta(d)).isoformat() for d in range(7)]
SOURCE = {d: [100 + i * 7 for i in range(5)] for d in DAYS}          # raw order amounts per day
SOURCE["2026-11-07"] = None                                          # day 7 hasn't landed yet

ASSETS, CHECKS = {}, {}
def asset(deps=()):
    def wrap(fn): ASSETS[fn.__name__] = (tuple(deps), fn); return fn
    return wrap
def asset_check(asset_name, blocking=False):
    def wrap(fn): CHECKS[asset_name] = (fn, blocking); return fn
    return wrap

@asset()
def raw_orders(day, _):            return SOURCE[day]
@asset(deps=["raw_orders"])
def stg_orders(day, up):           return [round(a, 2) for a in up["raw_orders"]]   # clean/cast
@asset(deps=["stg_orders"])
def daily_revenue(day, up):        return sum(up["stg_orders"])

@asset_check("stg_orders", blocking=True)
def no_negative_amounts(value):    return all(a >= 0 for a in value)

store = {}        # (asset, day) -> {"value", "version", "upstream_versions"}
runs = []
def version(v): return hashlib.md5(repr(v).encode()).hexdigest()[:6]

def is_stale(name, day):
    rec = store.get((name, day))
    if rec is None: return True                                      # never built
    deps = ASSETS[name][0]
    return any(store.get((d, day), {}).get("version") != rec["upstream_versions"].get(d) for d in deps)

def materialize(selection):
    """Build the selection in dependency order. Staleness is re-checked as we go, so rebuilding an
    upstream partition also rebuilds its downstreams in the same run. Anything downstream of a failed
    blocking check, or of a source that hasn't landed, is skipped."""
    order = ["raw_orders", "stg_orders", "daily_revenue"]            # topological order of the graph
    days = sorted({d for _, d in selection})
    blocked = set()
    for name in order:
        for day in days:
            if (name, day) not in selection and not is_stale(name, day): continue
            deps, fn = ASSETS[name]
            if any((d, day) in blocked or store.get((d, day)) is None for d in deps):
                blocked.add((name, day)); continue
            value = fn(day, {d: store[(d, day)]["value"] for d in deps})
            if value is None:                                        # source not there yet
                blocked.add((name, day)); continue
            store[(name, day)] = {"value": value, "version": version(value),
                                  "upstream_versions": {d: store[(d, day)]["version"] for d in deps}}
            runs.append((name, day))
            if name in CHECKS:
                fn_check, blocking = CHECKS[name]
                if not fn_check(value):
                    print(f"   check {fn_check.__name__} FAILED on {name}[{day}]" + (" -> downstream blocked" if blocking else ""))
                    if blocking: blocked.add((name, day))

def stale_set(): return [(a, d) for a, d in itertools.product(ASSETS, DAYS) if is_stale(a, d)]

print("1) Fresh platform: everything is stale ->", len(stale_set()), "asset-partitions")
materialize(stale_set())
print("   built", len(runs), "| still stale:", stale_set(), "(day 7's source hasn't landed)")

print("\n2) The source team re-lands 2026-11-05 with a corrected amount")
SOURCE["2026-11-05"] = SOURCE["2026-11-05"][:-1] + [999]
store.pop(("raw_orders", "2026-11-05"))                              # a sensor would notice the new file
runs.clear(); materialize(stale_set())
print("   rebuilt only:", runs)
print("   a task scheduler would rerun the whole 2026-11-05 DAG run, or you'd work out by hand what to rerun")

print("\n3) Day 7 lands, but with a negative amount (a refund mis-sent as an order)")
SOURCE["2026-11-07"] = [120, -40, 88]
runs.clear(); materialize(stale_set())
print("   built:", runs, "| daily_revenue[2026-11-07] built?", ("daily_revenue", "2026-11-07") in store)
print("   (a wrong number never reached the revenue table or the dashboard reading it)")

print("\n4) Fix upstream, rerun only what's stale")
SOURCE["2026-11-07"] = [120, 88]; store.pop(("raw_orders", "2026-11-07"))
runs.clear(); materialize(stale_set())
print("   built:", runs, "| revenue 2026-11-07 =", store[("daily_revenue", "2026-11-07")]["value"])
print("   stale now:", stale_set())
```

Expected output (real run, 2026-11-03):

```text
1) Fresh platform: everything is stale -> 21 asset-partitions
   built 18 | still stale: [('raw_orders', '2026-11-07'), ('stg_orders', '2026-11-07'), ('daily_revenue', '2026-11-07')] (day 7's source hasn't landed)

2) The source team re-lands 2026-11-05 with a corrected amount
   rebuilt only: [('raw_orders', '2026-11-05'), ('stg_orders', '2026-11-05'), ('daily_revenue', '2026-11-05')]
   a task scheduler would rerun the whole 2026-11-05 DAG run, or you'd work out by hand what to rerun

3) Day 7 lands, but with a negative amount (a refund mis-sent as an order)
   check no_negative_amounts FAILED on stg_orders[2026-11-07] -> downstream blocked
   built: [('raw_orders', '2026-11-07'), ('stg_orders', '2026-11-07')] | daily_revenue[2026-11-07] built? False
   (a wrong number never reached the revenue table or the dashboard reading it)

4) Fix upstream, rerun only what's stale
   built: [('raw_orders', '2026-11-07'), ('stg_orders', '2026-11-07'), ('daily_revenue', '2026-11-07')] | revenue 2026-11-07 = 208
   stale now: []
```

What to look for:

- **Step 2**: re-landing one day rebuilt exactly 3 asset-partitions (raw, staging, revenue for 11-05), and nothing else.
- **Step 3**: the blocking check stopped `daily_revenue[2026-11-07]`. The bad number never reached the table.
- **Step 4**: after the fix, only the 3 stale pieces ran, and nothing is stale afterwards.

**Try the real thing (needs a ~150 MB+ install, so do it on your own machine, not this course's shared laptop budget):** `pip install dagster dagster-webserver`, put the Dagster snippet above in `defs.py` with `defs = dg.Definitions(assets=[raw_orders, stg_orders], asset_checks=[no_negative_amounts])`, run `dagster dev -f defs.py`, and materialize partitions from the UI at `http://localhost:3000`. Follow the Dagster quickstart for the current command names.

## 7. Gotchas

- **Orchestrators orchestrate.** Don't do heavy transforms inside the scheduler process; push work to Spark, the warehouse or dbt and let the orchestrator track it.
- **Idempotent tasks or assets** are still on you: a rerun of a partition must overwrite, not append.
- **Partition definitions are a contract.** Changing a daily asset to hourly is a migration, not a config tweak.
- **Airflow 3 upgrade traps**: code reading `execution_date`, DB sessions inside tasks, and SubDAGs all break. Run the upgrade checks before moving.

## Sources

- Airflow release notes (3.3.2 current): https://airflow.apache.org/docs/apache-airflow/stable/release_notes.html
- Upgrading to Airflow 3 (imports, removed SubDAGs, execution_date, catchup default, no direct DB access, Assets): https://airflow.apache.org/docs/apache-airflow/stable/installation/upgrading_to_airflow3.html
- Dagster: defining assets: https://dagster.io/docs/guides/build/assets/defining-assets
- Dagster: partitioning assets: https://dagster.io/docs/guides/build/partitions-and-backfills/partitioning-assets
- Dagster: asset checks (blocking): https://dagster.io/docs/guides/test/asset-checks
- dagster on PyPI (1.13.28): https://pypi.org/project/dagster/
- Prefect docs: https://docs.prefect.io/
