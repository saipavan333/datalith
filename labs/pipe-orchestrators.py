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
