# Scheduling & automation with cron — the complete guide

`cron` is the classic way to run a job automatically on a schedule — every night, every
hour, every Monday. This guide covers the syntax, real schedules, the gotchas that bite
everyone, and when to graduate to an orchestrator. With examples and practice.

## 1. What cron is

A background service that reads your **crontab** (a table of scheduled commands) and
runs each at its appointed time. No human needed.

```bash
crontab -e        # edit your schedule
crontab -l        # list it
crontab -r        # remove it (careful)
```

## 2. The five time fields

@@diagram:cron-schedule

Each crontab line is **five time fields + a command**:

```
* * * * *  command
│ │ │ │ │
│ │ │ │ └ day of week (0–6, Sunday = 0)
│ │ │ └── month (1–12)
│ │ └──── day of month (1–31)
│ └────── hour (0–23)
└──────── minute (0–59)
```

Special values: `*` every, `*/15` every 15, `1-5` a range (Mon–Fri), `1,15` a list.

## 3. Real schedules

```bash
0 2 * * *      /opt/etl/daily.sh        # 2:00 AM every day
*/15 * * * *   /opt/etl/poll.sh         # every 15 minutes
0 6 * * 1      /opt/etl/weekly.sh       # 6:00 AM every Monday
0 0 1 * *      /opt/etl/monthly.sh      # midnight on the 1st of the month
0 9 * * 1-5    /opt/etl/workday.sh      # 9 AM, Monday–Friday
30 23 * * *    /opt/etl/nightly.sh      # 11:30 PM daily
```

## 4. The gotchas (why "it works in my terminal but not in cron")

cron is famous for silent failures. Three causes:

1. **Minimal environment.** cron runs with a bare PATH and few variables — a command
   like `python` or `jq` may not be found, and your env vars are missing. **Fix:** use
   **absolute paths** (`/usr/bin/python3 /opt/etl/job.py`) and set variables in the
   script.
2. **No visible output.** cron mails output nowhere useful by default, so errors vanish.
   **Fix:** redirect to a log: `>> /var/log/job.log 2>&1` (both stdout and stderr).
3. **Wrong working directory.** cron starts in the home directory. **Fix:** `cd` to the
   right place in the script, or use absolute paths everywhere.

```bash
0 3 * * * cd /opt/etl && /opt/etl/run.sh >> /var/log/etl.log 2>&1
```

## 5. Making jobs safe to re-run

A scheduled job will sometimes overlap or re-run. Make it **idempotent** (re-running
produces the same result), and guard against overlap with a **lock**:

```bash
0 * * * * flock -n /tmp/job.lock /opt/etl/hourly.sh   # skip if still running
```

## 6. Alternatives to cron

- **systemd timers** — modern Linux scheduling with better logging (`journalctl`) and
  dependencies.
- **Cloud schedulers** — EventBridge (AWS), Cloud Scheduler (GCP).
- **Orchestrators (Airflow, Dagster, Prefect)** — when jobs have **dependencies**,
  **retries**, **backfills**, parameters, or need **monitoring/alerting**. cron just
  fires a command with no awareness of success, order, or history.

Rule: cron for **simple, independent, time-based** jobs; an orchestrator once a real
**pipeline** of dependent steps emerges.

## 7. Monitoring scheduled jobs

cron won't tell you if a job failed. Add your own signal: write a success marker, push
a heartbeat to a monitoring service (a "dead man's switch" like Healthchecks/Cronitor
that alerts if the ping *stops*), or alert on a non-zero exit code in the script.

## Practice

1. **Daily at 2:30 AM**, logging output — write the crontab line.
2. **Every 15 minutes** — write the schedule.
3. **Works in terminal, not in cron** — name two likely causes.
4. **cron vs orchestrator** — when to use each.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you schedule a nightly data job, and what are the pitfalls?"*

A crontab entry like `30 2 * * * /opt/etl/load.sh >> /var/log/load.log 2>&1` runs it at
2:30 AM and captures output. Pitfalls: cron's **minimal environment** (use absolute
paths and set vars), **lost output** (redirect stdout+stderr to a log), and **no failure
alerting** (add a heartbeat/exit-code check). Make the job **idempotent** and lock against
overlap; move to an orchestrator once jobs gain dependencies, retries, or backfills.
