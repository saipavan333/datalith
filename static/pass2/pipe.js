/* Datalith pass 2 — Track 11: Pipelines & orchestration (part 1 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- pipe-etl-elt */
  P["pipe-etl-elt"] = {
    simple: [
      "Every pipeline does three jobs: **extract** data from a source, **transform** it (clean, join, reshape) and **load** it into a target.",
      "**ETL** transforms before loading, on a separate server, so only clean data reaches the warehouse. **ELT** loads raw data first, then transforms it inside the warehouse with SQL.",
      "Cloud warehouses like BigQuery and Snowflake made ELT the default: storage is cheap, compute scales on demand, and keeping the raw copy means you can re-run transforms when rules change.",
    ],
    analogy: {
      text: "Think of groceries for a restaurant.",
      left: "Restaurant", right: "ETL / ELT",
      map: [
        ["Washing and chopping at a prep kitchen before delivery", "ETL: transform before load"],
        ["Delivering everything raw to a big kitchen and prepping there", "ELT: load, then transform"],
        ["A huge kitchen with many cooks on call", "Elastic warehouse compute"],
        ["Keeping the raw vegetables in the fridge", "A raw layer you can re-process"],
      ],
      breaks: "a raw tomato in the fridge harms nobody. Raw data can hold personal details; with ELT you must mask or restrict raw tables, because they now sit in the warehouse where many people query.",
    },
    svg: () => {
      let b = t(240, 22, "Same three steps, different order", { bold: true, size: 14 });
      b += t(20, 54, "ETL", { a: "start", bold: true, size: 13, fill: C.warnT });
      [["Extract", "plain"], ["Transform", "warn"], ["Load", "good"]].forEach(([n, k], i) => { b += box(70 + i * 135, 36, 115, 34, n, null, k, { size: 13 }); if (i < 2) b += arrow(187 + i * 135, 53, 203 + i * 135, 53); });
      b += t(272, 88, "transform runs on an ETL server", { size: 11.5, fill: C.dim });
      b += t(20, 132, "ELT", { a: "start", bold: true, size: 13, fill: C.accT });
      [["Extract", "plain"], ["Load raw", "good"], ["Transform", "acc"]].forEach(([n, k], i) => { b += box(70 + i * 135, 114, 115, 34, n, null, k, { size: 13 }); if (i < 2) b += arrow(187 + i * 135, 131, 203 + i * 135, 131); });
      b += t(272, 166, "transform runs as SQL inside the warehouse (dbt)", { size: 11.5, fill: C.dim });
      b += box(70, 182, 385, 32, "ELT keeps raw data, so transforms can be rerun later", null, "ghost", { size: 12 });
      return svg(480, 228, b, "ETL versus ELT step order");
    },
    caption: "ETL cleans data before it lands; ELT lands it raw and cleans it in the warehouse.",
    oneline: "ETL cleans data before loading it; ELT loads it raw and cleans it inside the warehouse.",
  };

  /* ---------------------------------------------------------------- pipe-orchestration */
  P["pipe-orchestration"] = {
    simple: [
      "A real pipeline is many tasks: pull from three sources, clean each, join them, build reports, send alerts. Some must wait for others.",
      "An **orchestrator** runs them in the right order, on a schedule, and handles failure: retry, alert, and don't start a task whose inputs failed.",
      "Tasks and their \"must run after\" links form a **DAG** (directed acyclic graph): arrows have a direction, and no path loops back to where it started.",
    ],
    analogy: {
      text: "Think of getting ready for school.",
      left: "Morning routine", right: "Orchestration",
      map: [
        ["Shower before dressing; breakfast any time", "Dependencies between tasks"],
        ["Two siblings using two bathrooms at once", "Tasks running in parallel"],
        ["Alarm at 7:00 every weekday", "Schedule"],
        ["No clean shirt? Don't leave without one", "Downstream tasks wait on a failure"],
        ["Can't need to be dressed before showering and the other way round", "Acyclic: no loops"],
      ],
      breaks: "you notice when you forgot breakfast. An orchestrator only knows the links you declare; if task B secretly reads a file task A writes but you never drew that arrow, B can run before A finishes.",
    },
    svg: () => {
      let b = t(240, 22, "A daily pipeline as a DAG", { bold: true, size: 14 });
      const N = { a: [16, 40, "extract orders"], b: [16, 100, "extract users"], c: [16, 160, "extract stores"], d: [180, 70, "clean + join"], e: [180, 160, "clean stores"], f: [336, 110, "daily report"] };
      Object.values(N).forEach(([x, y, n]) => { b += box(x, y, 136, 36, n, null, "acc", { size: 12.5 }); });
      b += arrow(152, 58, 178, 82); b += arrow(152, 118, 178, 94); b += arrow(152, 178, 178, 178);
      b += arrow(316, 88, 334, 120); b += arrow(316, 178, 334, 136);
      b += t(240, 226, "Three extracts run in parallel; the report waits for both branches.", { size: 12, fill: C.dim });
      return svg(480, 242, b, "Pipeline tasks connected as a directed acyclic graph");
    },
    caption: "Arrows mean \"runs after\"; tasks without a path between them can run at the same time.",
    oneline: "An orchestrator runs a pipeline's tasks in dependency order, on schedule, and handles failures.",
  };

  /* ---------------------------------------------------------------- pipe-dags-airflow */
  const AF = ["extract", "transform", "load", "notify"];
  P["pipe-dags-airflow"] = {
    simple: [
      "**Apache Airflow** is the most widely used open-source orchestrator. You write a DAG as a Python file: tasks, and arrows between them like `extract >> transform >> load`.",
      "Airflow's scheduler starts each task when its upstream tasks succeed, retries failures, and records every run's state in its web UI.",
      "If a task fails after its retries, the tasks below it are marked **upstream_failed** and don't run, so bad data doesn't flow on.",
    ],
    analogy: {
      text: "Think of a relay race.",
      left: "Relay", right: "Airflow DAG",
      map: [
        ["Runners in a fixed order", "Tasks with `>>` dependencies"],
        ["Passing the baton", "An upstream task succeeding"],
        ["A runner drops the baton and can't pick it up", "Task fails after its retries"],
        ["Later runners never start", "Downstream tasks: upstream_failed"],
        ["The race officials' scoreboard", "The Airflow UI and metadata database"],
      ],
      breaks: "a relay always needs every runner. Airflow lets you change that per task with trigger rules: a cleanup task with `trigger_rule='all_done'` runs whether its upstream passed or failed.",
    },
    svg: () => P["pipe-dags-airflow"]._fig(-1),
    _fig: f => {
      let b = t(240, 22, "extract >> transform >> load >> notify", { bold: true, size: 13.5, mono: true });
      AF.forEach((n, i) => {
        const x = 12 + i * 118, st = f < 0 || i < f ? "success" : i === f ? "failed" : "upstream_failed";
        b += box(x, 44, 104, 58, n, st, st === "success" ? "good" : st === "failed" ? "bad" : "warn", { mono: true, size: 13, size2: st.length > 10 ? 9.5 : 11 });
        if (i < 3) b += arrow(x + 106, 73, x + 116, 73, { sw: 1.4 });
      });
      b += box(12, 126, 456, 40, f < 0 ? "DAG run: success" : "DAG run: failed at " + AF[f], f < 0 ? null : "retries used up; on_failure_callback alerts the team", f < 0 ? "good" : "bad", { size: 13.5, size2: 11 });
      b += t(240, 194, "retries=3, retry_delay=timedelta(minutes=5) per task", { size: 12, mono: true, fill: C.dim });
      return svg(480, 210, b, "Airflow task states after a failure");
    },
    caption: "When every task succeeds the run succeeds; a failure stops everything downstream.",
    ix: el => choice(el, { label: "Which task fails?", options: ["none", ...AF], value: 2 }, i => ({ svg: P["pipe-dags-airflow"]._fig(i - 1), note: i === 0 ? "Every task passed its baton." : "Tasks after the failure are upstream_failed. Fix the cause, then clear the failed task to rerun it and everything after it." })),
    oneline: "Airflow runs Python-defined task graphs, starting each task only after the ones before it succeed.",
  };

  /* ---------------------------------------------------------------- pipe-idempotency */
  const IDM = [["INSERT (append)", "bad"], ["DELETE partition + INSERT", "good"], ["MERGE on key", "good"]];
  P["pipe-idempotency"] = {
    simple: [
      "Pipelines get re-run all the time: after a failure, a bug fix, or a late file. An **idempotent** job gives the same result however many times you run it.",
      "Plain `INSERT` is not idempotent: run it twice and you have every row twice. Overwriting the day's partition, or `MERGE` on a key, is.",
      "A **backfill** re-runs the pipeline for past dates. It is only safe if each run is idempotent and reads only its own date's data.",
    ],
    analogy: {
      text: "Think of a lift button.",
      left: "Lift", right: "Idempotent job",
      map: [
        ["Pressing the button five times calls one lift", "Re-running gives the same result"],
        ["A vending machine that drops a can each press", "Append: duplicates on each re-run"],
        ["Rewriting today's page in a diary", "Overwrite the day's partition"],
        ["Updating a contact instead of adding a new one", "MERGE on a key"],
      ],
      breaks: "the lift button has no side effects. Jobs that send emails or charge cards can't be undone by overwriting a table; they need their own deduplication, such as an idempotency key.",
    },
    svg: () => P["pipe-idempotency"]._fig(1),
    _fig: i => {
      const [n, k] = IDM[i], rows = i === 0 ? [1000, 2000, 3000] : [1000, 1000, 1000];
      let b = t(240, 22, "Load 2026-11-04 (1,000 rows) using " + n, { bold: true, size: 12.5 });
      rows.forEach((r, j) => {
        const y = 44 + j * 48;
        b += t(20, y + 22, "run " + (j + 1), { a: "start", size: 12.5, fill: C.dim });
        b += `<rect x="80" y="${y + 4}" width="${(r / 3000 * 300).toFixed(0)}" height="26" rx="4" style="fill:${P2L.KIND[k][0]};stroke:${P2L.KIND[k][1]}"/>`;
        b += t(88 + r / 3000 * 300, y + 22, r.toLocaleString("en-US") + " rows", { a: "start", size: 12, mono: true, fill: P2L.KIND[k][2] });
      });
      b += box(20, 196, 440, 40, i === 0 ? "Not idempotent: each re-run adds duplicates" : "Idempotent: re-runs leave exactly 1,000 rows", null, k, { size: 13 });
      return svg(480, 250, b, "Row counts after re-running a load three times");
    },
    caption: "Overwriting the partition (or merging on a key) leaves the same rows however often the job runs.",
    ix: el => choice(el, { label: "Write strategy", options: IDM.map(x => x[0]), value: 0 }, i => ({ svg: P["pipe-idempotency"]._fig(i), note: ["Three runs, three copies. Dashboards double and triple overnight.", "Replace exactly one day. In BigQuery and Spark this is a partition overwrite.", "Update rows whose key exists, insert the rest. Safe for late-arriving updates too."][i] })),
    oneline: "An idempotent job gives the same result no matter how many times it runs, which makes re-runs safe.",
  };

  /* ---------------------------------------------------------------- pipe-scheduling-backfill */
  P["pipe-scheduling-backfill"] = {
    simple: [
      "Pipelines run on a **schedule** (`@daily`, a cron string) or on a **trigger** (a file arrives, an upstream dataset updates).",
      "With an interval timetable (Airflow 2's default for cron schedules), each run covers a **data interval**: the daily run for 4 November processes 4 November's data, so it starts just after midnight on the 5th, once that day is complete. Airflow 3 instead treats a cron schedule as a trigger time by default (`CronTriggerTimetable`, `create_cron_data_intervals = False`), so check which timetable your version uses.",
      "**Catchup** decides what happens if the DAG's start date is in the past: with catchup on, Airflow creates one run for every missed interval. Airflow 3 turns catchup off by default (`catchup_by_default = False`); Airflow 2 had it on.",
    ],
    analogy: {
      text: "Think of a newspaper printing yesterday's news.",
      left: "Newspaper", right: "Scheduling",
      map: [
        ["Tomorrow's paper reports today", "A run starts after its data interval ends"],
        ["The date the stories cover", "Logical date / data interval"],
        ["Back issues printed after a strike", "Catchup or a backfill"],
        ["A special edition when big news breaks", "An event trigger"],
      ],
      breaks: "back issues get printed one at a time. Catchup can create hundreds of runs at once; limit them with `max_active_runs` or they flood the source and the warehouse.",
    },
    svg: () => P["pipe-scheduling-backfill"]._fig(30),
    _fig: d => {
      let b = t(240, 22, "start_date " + d + " days ago, @daily, catchup=True", { bold: true, size: 13, mono: true });
      const n = Math.min(d, 10);
      for (let i = 0; i < n; i++) {
        const x = 20 + i * 44;
        b += box(x, 44, 40, 46, "D-" + (d - i), null, "acc", { size: 11, mono: true });
      }
      if (d > 10) b += t(466, 72, "+" + (d - 10), { a: "end", size: 12, fill: C.accT, bold: true });
      b += t(240, 116, d + " runs are queued at once, one per missed day", { size: 12.5, fill: C.tx });
      b += box(20, 132, 440, 38, "catchup=False: only the latest interval runs", null, "good", { size: 12.5 });
      b += box(20, 182, 440, 50, "Each run sees its own data_interval_start / end", "e.g. 2026-11-04 00:00 to 2026-11-05 00:00 UTC", "plain", { size: 12.5, size2: 11, mono2: true });
      return svg(480, 246, b, "Runs created by catchup for a start date in the past");
    },
    caption: "With catchup on, a start date 30 days back creates 30 runs, one per missed daily interval.",
    ix: el => slider(el, { label: "start_date (days ago)", min: 1, max: 60, value: 5 }, v => ({ svg: P["pipe-scheduling-backfill"]._fig(v), note: v > 20 ? "Set <code>max_active_runs</code> so these don't all hit the source at once." : "Each run must be idempotent, because a backfill is just a re-run." })),
    oneline: "A schedule says when a pipeline runs, and each run processes one finished window of time.",
  };

  /* ---------------------------------------------------------------- pipe-incremental-vs-full */
  P["pipe-incremental-vs-full"] = {
    simple: [
      "A **full load** reloads the whole table every run. It is simple and always correct, but slow and costly once tables are big.",
      "An **incremental load** processes only what changed since last time: rows with `updated_at` after the last **high-watermark**, a new date partition, or change events from CDC (change data capture).",
      "Incremental is much cheaper but needs care: late updates, deleted rows and clock differences can all be missed.",
    ],
    analogy: {
      text: "Think of backing up your phone.",
      left: "Phone backup", right: "Load type",
      map: [
        ["Copying every photo every night", "Full load"],
        ["Copying only photos taken since last night", "Incremental load"],
        ["\"Last backup: 4 Nov 23:00\"", "High-watermark"],
        ["Photos you deleted still on the backup", "Deletes missed by watermark loads"],
      ],
      breaks: "phone photos get a reliable timestamp. Database rows don't always: a row updated without touching `updated_at` is invisible to a watermark load. Log-based CDC sees every change, including deletes.",
    },
    svg: () => P["pipe-incremental-vs-full"]._fig(2),
    _fig: pct => {
      const total = 500, ch = total * pct / 100;
      let b = t(240, 22, "500M-row table, " + pct + "% changed since last run", { bold: true, size: 13.5 });
      b += t(20, 58, "full", { a: "start", size: 13, bold: true, fill: C.warnT });
      b += `<rect x="110" y="42" width="340" height="26" rx="4" style="fill:${C.warn};stroke:${C.warnS}"/>`;
      b += t(110, 88, "reads and writes 500M rows", { a: "start", size: 12, mono: true });
      b += t(20, 124, "incremental", { a: "start", size: 13, bold: true, fill: C.goodT });
      b += `<rect x="110" y="108" width="${Math.max(3, 340 * pct / 100).toFixed(1)}" height="26" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
      b += t(110, 154, "reads " + ch.toFixed(ch < 10 ? 1 : 0) + "M changed rows, merges them", { a: "start", size: 12, mono: true });
      b += t(240, 188, "WHERE updated_at > :last_watermark", { size: 12.5, mono: true, fill: C.accT });
      return svg(480, 204, b, "Rows processed by a full versus an incremental load");
    },
    caption: "When few rows change, incremental work is a small slice of a full reload.",
    ix: el => slider(el, { label: "Rows changed (%)", min: 1, max: 100, value: 30 }, v => ({ svg: P["pipe-incremental-vs-full"]._fig(v), note: v > 50 ? "When most rows change, a full reload can be simpler and just as fast." : "Keep a periodic full refresh or reconciliation to catch anything the incremental logic missed." })),
    oneline: "A full load reloads everything; an incremental load processes only what changed since last time.",
  };

  /* ---------------------------------------------------------------- pipe-monitoring-alerting */
  P["pipe-monitoring-alerting"] = {
    simple: [
      "A pipeline can \"succeed\" and still deliver wrong or late data. **Monitoring** checks the data, not just whether the job ran.",
      "Five signals cover most problems: **freshness** (how old is the newest row), **volume** (row count against normal), **schema** (columns changed), **quality** (nulls, duplicates, ranges) and **latency** (how long runs take).",
      "Set an **SLA** (service level agreement) such as \"orders table updated by 06:00\", alert only on things a person must act on, and say in the alert what to check first.",
    ],
    analogy: {
      text: "Think of the dashboard in a car.",
      left: "Car dashboard", right: "Data observability",
      map: [
        ["Fuel gauge", "Freshness"],
        ["Speedometer", "Volume per run"],
        ["Engine warning light", "Schema or quality failure"],
        ["Trip timer", "Run latency"],
        ["A warning that beeps for no reason", "Noisy alerts people learn to ignore"],
      ],
      breaks: "a car's lights are wired to real sensors. Data checks only see what you measure; a table can be fresh and the right size while every value in one column is wrong.",
    },
    svg: () => P["pipe-monitoring-alerting"]._fig(9),
    _fig: h => {
      const sla = 6, late = h > sla;
      let b = t(240, 22, "SLA: orders fresh by 06:00. Data landed at " + String(h).padStart(2, "0") + ":00", { bold: true, size: 13 });
      b += line(20, 80, 460, 80, { stroke: C.line, sw: 2 });
      for (let x = 0; x <= 12; x += 2) b += t(20 + x * 36.6, 100, String(x).padStart(2, "0") + ":00", { size: 10.5, fill: C.faint });
      b += line(20 + sla * 36.6, 52, 20 + sla * 36.6, 88, { stroke: C.warnS, sw: 2.4 }); b += t(20 + sla * 36.6, 46, "SLA", { size: 11.5, fill: C.warnT, bold: true });
      b += `<circle cx="${(20 + h * 36.6).toFixed(1)}" cy="80" r="8" style="fill:${late ? C.badS : C.goodS}"/>`;
      [["freshness", late ? "late" : "ok", late ? "bad" : "good"], ["volume", "ok", "good"], ["schema", "ok", "good"], ["quality", "ok", "good"]].forEach(([n, s, k], i) => { b += box(20 + i * 112, 124, 104, 46, n, s, k, { size: 12.5 }); });
      b += box(20, 186, 440, 40, late ? "Alert: orders " + (h - sla) + " h late. Check the upstream export first." : "No alert: data is fresh", null, late ? "bad" : "good", { size: 12.5 });
      return svg(480, 240, b, "Freshness SLA check with observability signals");
    },
    caption: "Data landed at 09:00, three hours after the SLA, so the freshness check fires an alert.",
    ix: el => slider(el, { label: "Data landed at (hour)", min: 2, max: 12, value: 5, fmt: v => String(v).padStart(2, "0") + ":00" }, v => ({ svg: P["pipe-monitoring-alerting"]._fig(v), note: v > 6 ? "A good alert names the table, how late it is, and the first thing to check." : "Within the SLA. No page, no noise." })),
    oneline: "Monitoring checks that data is fresh, complete and correct, and alerts a person only when action is needed.",
  };

  /* ---------------------------------------------------------------- pipe-airflow-deep */
  P["pipe-airflow-deep"] = {
    simple: [
      "Airflow has a few core parts. The **scheduler** decides which tasks are ready. The **executor** decides where they run: locally, on Celery workers, or as Kubernetes pods. The **metadata database** stores every DAG run and task state. The web UI shows it all.",
      "**Operators** are task templates (BashOperator, a BigQuery operator, PythonOperator). The **TaskFlow** API turns plain Python functions into tasks with `@task`. **Sensors** wait for something, like a file landing.",
      "**XComs** pass small values (a file path, a row count) between tasks. Large data should go through storage, not XComs.",
    ],
    analogy: {
      text: "Think of a busy restaurant kitchen.",
      left: "Kitchen", right: "Airflow",
      map: [
        ["The head chef deciding what to cook next", "Scheduler"],
        ["Which cooks or stations do the work", "Executor and workers"],
        ["The order book on the wall", "Metadata database"],
        ["Standard recipes", "Operators"],
        ["A cook waiting for the delivery van", "Sensor"],
        ["Sticky notes passed between cooks", "XComs"],
      ],
      breaks: "sticky notes are fine for short messages. XComs live in the metadata database, so pushing a DataFrame through one bloats that database and slows the whole scheduler.",
    },
    svg: () => {
      let b = t(240, 22, "Airflow architecture", { bold: true, size: 14 });
      b += box(16, 40, 120, 44, "DAG files", "Python", "plain");
      b += arrow(138, 62, 164, 62);
      b += box(168, 40, 140, 44, "scheduler", "what's ready?", "warn");
      b += arrow(238, 86, 238, 108);
      b += box(168, 110, 140, 44, "executor", "Celery / K8s", "vio");
      [0, 1, 2].forEach(i => { b += arrow(308, 132, 346, 100 + i * 32, { sw: 1.2 }); b += box(350, 86 + i * 32, 114, 28, "worker " + (i + 1), null, "acc", { size: 12 }); });
      b += box(168, 186, 140, 44, "metadata DB", "runs, states, XComs", "good", { size2: 11 });
      b += arrow(238, 156, 238, 184, { dash: true }); b += arrow(310, 208, 406, 186, { dash: true });
      b += box(16, 186, 120, 44, "web UI", null, "plain");
      b += arrow(166, 208, 138, 208, { dash: true });
      return svg(480, 244, b, "Airflow scheduler, executor, workers, metadata database and UI");
    },
    caption: "The scheduler reads DAG files and queues ready tasks; the executor sends them to workers; state goes to the database.",
    oneline: "Airflow's scheduler picks ready tasks, its executor runs them on workers, and a database records every state.",
  };

  /* ---------------------------------------------------------------- pipe-dbt */
  P["pipe-dbt"] = {
    simple: [
      "**dbt** (data build tool) is the most common way to do the T in ELT. Each **model** is a SQL `SELECT` file, and dbt turns it into a view or table in your warehouse.",
      "Models refer to each other with `{{ ref('stg_orders') }}`. From those refs dbt builds a dependency graph and runs models in the right order.",
      "dbt also brings software habits to SQL: version control, tests, documentation and code review.",
    ],
    analogy: {
      text: "Think of a recipe book where recipes point to other recipes.",
      left: "Recipe book", right: "dbt",
      map: [
        ["One recipe per page", "One model per SQL file"],
        ["\"Use the tomato sauce from page 12\"", "`{{ ref('stg_sauce') }}`"],
        ["Cooking pages in the order the references need", "dbt's DAG run order"],
        ["Taste-testing each dish", "dbt tests"],
        ["The index and notes", "dbt docs"],
      ],
      breaks: "a recipe book doesn't cook. dbt doesn't move data either: it only sends SQL to your warehouse, so the warehouse's speed, cost and SQL dialect still apply.",
    },
    svg: () => {
      let b = t(240, 22, "ref() links become a run order", { bold: true, size: 14 });
      b += box(16, 44, 120, 36, "raw.orders", "source", "plain", { mono: true, size: 12, size2: 10 });
      b += box(16, 120, 120, 36, "raw.customers", "source", "plain", { mono: true, size: 12, size2: 10 });
      b += arrow(138, 62, 168, 62); b += arrow(138, 138, 168, 138);
      b += box(172, 44, 130, 36, "stg_orders", null, "acc", { mono: true, size: 12.5 });
      b += box(172, 120, 130, 36, "stg_customers", null, "acc", { mono: true, size: 12.5 });
      b += arrow(304, 62, 332, 92); b += arrow(304, 138, 332, 108);
      b += box(336, 82, 128, 36, "fct_orders", null, "good", { mono: true, size: 12.5 });
      b += t(240, 196, "select ... from {{ ref('stg_orders') }} join {{ ref('stg_customers') }}", { size: 10.5, mono: true, fill: C.dim });
      b += t(240, 220, "dbt run builds stg_* first, then fct_orders", { size: 12.5, fill: C.dim });
      return svg(480, 236, b, "dbt models connected by ref into a DAG");
    },
    caption: "Each ref() is an arrow; dbt runs models from sources towards the final tables.",
    oneline: "dbt turns SQL SELECT files into warehouse tables, in the order their ref() links require.",
  };
})();
