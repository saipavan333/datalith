# Idempotency & backfills — the complete guide

Here's a word that sounds scary but means something simple: **idempotent** just means *"running it again
doesn't change the result."* A light switch that's already on stays on if you flip it "on" again. For
data pipelines, this is maybe the single most important property — because pipelines **fail and get
re-run all the time**, and you never want a re-run to double your data.

## 1. Why this matters so much

In the real world, things break: a server dies halfway through a load, an API times out, someone
manually re-runs yesterday's job, or you backfill last month after fixing a bug. Every one of these means
**a step runs more than once for the same day**.

@@diagram:idempotency

If your load just **appends** rows, running it twice gives you **double** the rows — revenue looks 2×
too high, counts are wrong, and now someone has to clean it up by hand. An **idempotent** load can be
re-run any number of times and the data is always correct.

## 2. The techniques (how to make a step idempotent)

**Overwrite by partition (delete-insert)** — the most common pattern. Make each run "own" one partition
(usually a date) and **replace** it every time:

```sql
DELETE FROM sales WHERE dt = '2025-05-01';
INSERT INTO sales SELECT * FROM staging WHERE dt = '2025-05-01';
```

Re-running for `2025-05-01` removes that day's rows and rewrites them — same result every time. On a
lakehouse you'd write `INSERT OVERWRITE PARTITION (dt='2025-05-01')`.

**MERGE / upsert** — match on a key and update-or-insert, so re-processing a row never duplicates it
(used for CDC and slowly-changing dimensions):

```sql
MERGE INTO customers t USING staged s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET t.city = s.city
WHEN NOT MATCHED THEN INSERT VALUES (s.id, s.name, s.city);
```

**Deterministic output locations** — write to a path/partition derived from the **logical date**, not
`now()`, so a re-run overwrites the *same* place. Writing to `/out/run_{{now()}}/` is a bug — every re-run
makes a new folder and leaves stale data behind.

**Atomic publish** — write to a temporary location, then swap/rename it into place in one step, so readers
never see a half-finished result.

## 3. Backfills

A **backfill** means re-processing a *range of past dates* — because you added a pipeline late, fixed a
bug, or added a new column. You loop over each date and run that date's task:

```
for dt in 2025-01-01 .. 2025-05-31:
    run daily_load(dt)        # each run overwrites its own partition
```

This **only works if the task is idempotent** — otherwise every backfilled day would pile duplicate rows
on top of whatever's already there. Orchestrators (Airflow, Dagster) have backfill built in, parameterized
by the logical date.

## 4. The one-line test

Before anything goes to production, ask:

> **"If this runs twice for the same date, is the result identical?"**

If the answer is no, fix it now — because retries and backfills *will* eventually run it twice.

## Practice

1. Make `INSERT INTO sales SELECT * FROM staging WHERE dt='{{date}}'` idempotent.
2. Why is writing to `/out/run_{{now()}}/` a bug for re-runs?
3. What is "atomic publish" and why does it protect consumers?
4. State the one-line idempotency test and why it's worth applying before production.

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"What does idempotency mean for a data pipeline, and how do you achieve it?"*

It means **re-running a step produces the same result** — no duplicates, no corruption — which matters
because pipelines fail and get re-run (retries, manual reruns, backfills). You achieve it by making each
run **own and overwrite its partition** (delete-insert / `INSERT OVERWRITE` by date), or by **MERGE/upsert
on a key**, writing to **deterministic** date-based locations (never `now()`), and **publishing
atomically**. Backfills depend entirely on this — re-processing historical dates only works if each task
overwrites rather than appends.
