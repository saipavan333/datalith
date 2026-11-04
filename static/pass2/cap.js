/* Datalith pass 2 — Track 26: Capstones (part 1 of 2). Each diagram is the project's end-to-end pipeline. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const row = (items, x0, y, w, h, gap, o = {}) => {
    let b = "";
    items.forEach(([a, z, k], i) => {
      const x = x0 + i * (w + gap);
      b += box(x, y, w, h, a, z, k || "plain", { size: o.size || 11.5, size2: o.size2 || 9.5, sw: o.on === i ? 2.6 : undefined });
      if (i < items.length - 1) b += arrow(x + w + 1, y + h / 2, x + w + gap - 1, y + h / 2, { sw: 1.3 });
    });
    return b;
  };
  P2L.capRow = row;

  /* ---------------------------------------------------------------- cap-api-to-lake */
  const AL = [
    ["extract", "Requests", "GET /orders?updated_since=2026-11-03&cursor=c2  ->  page of 500 JSON records, retried with backoff on a 503"],
    ["validate", "Pydantic", "{\"id\": 81, \"amount\": \"12.50\"} becomes Order(id=81, amount=12.5); {\"id\": null} goes to quarantine with its error"],
    ["transform", "Polars", "lazy: filter status = 'paid', add order_date, group by date and country, sum amount"],
    ["store", "fsspec", "write s3://lake/orders/order_date=2026-11-03/part-0.parquet, overwriting only that date"],
    ["analyze", "DuckDB", "SELECT country, SUM(revenue) FROM 's3://lake/orders/*/*.parquet' WHERE order_date >= '2026-11-01' reads only 3 folders"],
  ];
  P["cap-api-to-lake"] = {
    simple: [
      "This project builds the most common pipeline shape in data engineering: pull data from a web API, check it, reshape it, store it, and query it.",
      "Each step uses one tool. **Requests** fetches pages from the API, with retries and a \"since\" date so each run only pulls new records. **Pydantic** checks every record against a schema and sends bad ones to a quarantine file. **Polars** reshapes the good records. **fsspec** writes them as Parquet files in object storage (S3 or GCS), split into one folder per date. **DuckDB** then queries those files directly.",
      "Rerunning a day overwrites only that day's folder, so the pipeline is safe to rerun.",
    ],
    analogy: {
      text: "Think of a school library getting new books from a publisher.",
      left: "Library", right: "API-to-lake pipeline",
      map: [
        ["Ordering only books published since last month", "Incremental pull with updated_since"],
        ["Checking each book for missing pages", "Pydantic validation, quarantine for bad records"],
        ["Labelling and sorting by subject", "Polars transform"],
        ["One shelf per month", "Parquet partitioned by date"],
        ["The catalogue computer that finds a book fast", "DuckDB reading only the needed folders"],
      ],
      breaks: "books don't change after delivery. API records do, so the \"since\" watermark must use the record's update time, and the store must overwrite or merge changed records.",
    },
    svg: () => P["cap-api-to-lake"]._fig(-1),
    _fig: on => {
      let b = t(240, 18, on < 0 ? "API to lake: five tools, one batch run" : "Step " + (on + 1) + ": " + AL[on][0], { bold: true, size: 13.5 });
      b += row(AL.map(([a, z], i) => [a, z, on < 0 ? (i === 4 ? "good" : "acc") : i === on ? "good" : i < on ? "acc" : "ghost"]), 12, 32, 84, 44, 9, { on });
      if (on < 0) {
        b += box(108, 100, 84, 30, "quarantine", null, "bad", { size: 11 });
        b += arrow(150, 78, 150, 98, { stroke: C.badS, sw: 1.2 });
        b += t(240, 160, "API (paged, rate-limited) -> s3://lake/orders/order_date=.../", { size: 11, mono: true, fill: C.dim, max: 456 });
        b += t(240, 182, "rerun a day = overwrite that day's folder only", { size: 11.5, fill: C.goodT });
        return svg(480, 196, b, "API to lake pipeline stages");
      }
      const words = AL[on][2].split(" "); let ln = "", lines = [];
      words.forEach(w => { if ((ln + " " + w).length > 62) { lines.push(ln); ln = w; } else ln = ln ? ln + " " + w : w; }); lines.push(ln);
      lines.forEach((l, i) => { b += t(20, 104 + i * 18, l, { a: "start", size: 11, mono: true, fill: C.tx, max: 446 }); });
      return svg(480, 112 + lines.length * 18, b, "One stage of the API to lake pipeline");
    },
    caption: "Extract, validate, transform, store, analyze. Bad records drop out at validation instead of breaking the batch.",
    ix: el => slider(el, { label: "Stage", min: 1, max: 5, value: 1 }, v => ({ svg: P["cap-api-to-lake"]._fig(v - 1), note: ["Pull only what changed since the last run, page by page.", "Validate at the boundary, so bad data never reaches later steps.", "Polars plans the whole chain before running it, using all cores.", "Partitioned, compressed, and idempotent: a rerun replaces that date only.", "Partition pruning: the date filter skips every folder outside the range."][v - 1] })),
    oneline: "Pull new records from an API, check them, reshape them, save them by date, and query them in place.",
  };

  /* ---------------------------------------------------------------- cap-files-to-report */
  P["cap-files-to-report"] = {
    simple: [
      "Many data jobs end with a person, not a machine: a manager who wants a report they can open. This project turns raw files into that report.",
      "**DuckDB** reads the CSV or Parquet files directly with SQL, with no loading step. The heavy work, such as joins, running totals, month-over-month change and top-N lists, happens in SQL.",
      "**seaborn** and **matplotlib** draw the charts and save them as images. **openpyxl** builds a formatted Excel workbook: a summary sheet with totals, a data sheet, and the charts placed inside.",
    ],
    analogy: {
      text: "Think of making a school project poster from survey forms.",
      left: "School project", right: "Files-to-report pipeline",
      map: [
        ["Pile of filled-in survey forms", "Raw CSV and Parquet files"],
        ["Tallying answers on a sheet", "SQL in DuckDB"],
        ["Drawing the bar chart", "seaborn / matplotlib PNGs"],
        ["Gluing it all on a neat poster", "openpyxl workbook with formats and charts"],
      ],
      breaks: "a poster is made once. A report runs every month, so the script must be rerunnable from the raw files with no hand edits.",
    },
    svg: () => {
      let b = t(240, 18, "Raw files to a stakeholder workbook", { bold: true, size: 13.5 });
      b += box(12, 34, 92, 64, "data/*.parquet", "sales, customers", "plain", { size: 11, size2: 9.5 });
      b += arrow(106, 66, 126, 66);
      b += box(128, 34, 110, 64, "DuckDB SQL", "joins, LAG, QUALIFY", "acc", { size: 12, size2: 9.5 });
      b += arrow(240, 52, 266, 44); b += arrow(240, 80, 266, 96);
      b += box(268, 24, 92, 42, "DataFrame", ".df() / .pl()", "plain", { size: 11, size2: 9 });
      b += box(268, 76, 92, 42, "charts", "PNG, dpi 150", "warn", { size: 11, size2: 9 });
      b += arrow(362, 45, 382, 60); b += arrow(362, 97, 382, 80);
      b += box(384, 40, 84, 56, "report.xlsx", "openpyxl", "good", { size: 11.5, size2: 9.5 });
      b += table(80, 146, ["Summary sheet", "", ""], [["segment", "revenue", "MoM"], ["Retail", "1,240,000", "+4.2%"], ["SME", "860,500", "-1.1%"], ["Total", "=SUM(B3:B4)", ""]], { cw: [110, 110, 90], rh: 22, size: 11, mono: false, hl: { 0: "plain" } });
      return svg(480, 260, b, "Files to report pipeline with DuckDB, charts and an Excel workbook");
    },
    caption: "SQL does the heavy lifting, charts are saved as images, and the workbook packages both for a human reader. Figures are examples.",
    oneline: "Query raw files with SQL, draw the charts, and hand over a tidy spreadsheet a manager can open.",
  };

  /* ---------------------------------------------------------------- cap-orchestrated */
  const OR = [
    ["all good", [1, 1, 1, 1], "Every task succeeded and the gate passed, so the new partition was published."],
    ["API flaky", [2, 1, 1, 1], "extract failed with a timeout, Prefect waited and retried, and the second try worked. Nobody was paged."],
    ["DQ gate fails", [1, 1, 3, 0], "The checkpoint found 4% null customer ids (limit 0%). The flow stopped, the batch went to quarantine, and an alert fired. Yesterday's data stays live."],
  ];
  P["cap-orchestrated"] = {
    simple: [
      "A script that runs when you remember it is not a pipeline. This project turns one into a **production pipeline**: it runs on a schedule, heals small failures by itself, and refuses to publish bad data.",
      "**Prefect** runs the steps. Each step is a **task** with automatic retries, and a **flow** connects them and runs at 3 a.m. Settings and secrets come from environment variables, not from the code.",
      "After the transform, a **quality gate** (Great Expectations or Pydantic checks) inspects the result. If it fails, the flow stops and the batch is quarantined instead of overwriting good data.",
    ],
    analogy: {
      text: "Think of a bakery that opens at 6 a.m. every day.",
      left: "Bakery", right: "Orchestrated pipeline",
      map: [
        ["The alarm clock at 3 a.m.", "Prefect schedule"],
        ["Oven didn't light, try again", "Task retry with backoff"],
        ["Tasting a loaf before the shelves", "Quality gate"],
        ["A bad batch goes in the bin, not on sale", "Quarantine, keep yesterday's data live"],
        ["The day's log book", "Prefect UI: runs, logs, failures"],
      ],
      breaks: "a baker notices a burnt loaf by smell. A pipeline notices only what the checks test for, so the gate is only as good as its rules.",
    },
    svg: () => P["cap-orchestrated"]._fig(1),
    _fig: i => {
      const [n, st] = OR[i];
      let b = t(240, 18, "Prefect flow, 03:00 run: " + n, { bold: true, size: 13.5 });
      b += `<rect x="8" y="30" width="464" height="78" rx="10" style="fill:none;stroke:${C.boxS};stroke-dasharray:5 4"/>`;
      b += t(18, 46, "@flow  nightly_orders", { a: "start", size: 11, mono: true, fill: C.dim });
      const names = [["extract", "@task"], ["transform", "@task"], ["DQ gate", "checkpoint"], ["publish", "@task"]];
      names.forEach(([a, z], j) => {
        const s = st[j], k = s === 1 ? "good" : s === 2 ? "warn" : s === 3 ? "bad" : "ghost", x = 20 + j * 112;
        b += box(x, 54, 96, 44, a, s === 2 ? "retry 1: ok" : s === 3 ? "FAILED" : s === 0 ? "skipped" : z, k, { size: 12, size2: 9.5 });
        if (j < 3) b += arrow(x + 98, 76, x + 110, 76, { sw: 1.3 });
      });
      if (st[2] === 3) { b += arrow(244, 100, 244, 128, { stroke: C.badS }); b += box(170, 130, 150, 30, "quarantine + alert", null, "bad", { size: 11.5 }); }
      if (st[0] === 2) { b += t(68, 124, "attempt 1: timeout, wait 10 s", { size: 10.5, fill: C.warnT }); }
      const yb = st[2] === 3 ? 186 : st[0] === 2 ? 148 : 132;
      b += t(240, yb, "config from env vars; secrets never in code", { size: 11, fill: C.dim });
      return svg(480, yb + 12, b, "Prefect flow tasks and outcomes");
    },
    caption: "Retries absorb flaky sources; the gate stops bad data before publish.",
    ix: el => choice(el, { label: "Tonight", options: OR.map(o => o[0]), value: 0 }, i => ({ svg: P["cap-orchestrated"]._fig(i), note: OR[i][2] })),
    oneline: "Schedule the steps, retry small failures, and block the publish when the data fails its checks.",
  };

  /* ---------------------------------------------------------------- cap-benchmark */
  const BM = [
    ["fits in RAM", ["ok, slowest", "warn"], ["ok, fast", "good"], ["ok, fast", "good"], "All three finish. pandas loads every column eagerly and runs mostly on one core; Polars and DuckDB read only needed columns and use all cores."],
    ["bigger than RAM", ["out of memory", "bad"], ["ok with streaming", "good"], ["ok, spills to disk", "good"], "pandas must hold the whole frame in memory and fails. Polars' streaming engine processes chunks; DuckDB spills intermediate results to disk."],
  ];
  P["cap-benchmark"] = {
    simple: [
      "Which tool should you use for a table of 5 million rows: pandas, Polars or DuckDB? This project answers it by measuring, not guessing.",
      "**Faker** generates a few million realistic rows (seeded so every run is the same), written once to Parquet. Then the same job, filter, group and aggregate, runs in each engine.",
      "Fair timing means a warm-up run first, several repeats, measuring peak memory too, and never timing the data generation. The usual result: pandas is slowest and uses most memory; Polars and DuckDB are much faster, and DuckDB keeps working when the data is bigger than memory.",
    ],
    analogy: {
      text: "Think of testing three cars on the same road.",
      left: "Car test", right: "Engine benchmark",
      map: [
        ["Same road, same weather", "Same Parquet input for every engine"],
        ["Warm the engine before timing", "Warm-up run"],
        ["Several laps, not one", "Repeats, then the median"],
        ["Fuel used, not just speed", "Peak memory"],
        ["A road longer than the fuel tank", "Data bigger than RAM"],
      ],
      breaks: "cars are tested on one road. Engine rankings change with the job (joins, strings, window functions), so benchmark your real workload before deciding.",
    },
    svg: () => {
      let b = t(240, 18, "Same input, same job, three engines", { bold: true, size: 13.5 });
      b += box(12, 70, 96, 50, "Faker", "seed=42, 5M rows", "plain", { size: 12, size2: 9.5 });
      b += arrow(110, 95, 128, 95);
      b += box(130, 70, 84, 50, "orders", ".parquet", "acc", { size: 12, size2: 9.5 });
      [["pandas", "eager, 1 core", 36], ["Polars", "lazy, all cores", 88], ["DuckDB", "SQL, can spill", 140]].forEach(([a, z, y]) => { b += arrow(216, 95, 250, y + 20, { sw: 1.2 }); b += box(252, y, 104, 40, a, z, "vio", { size: 12, size2: 9.5 }); b += arrow(358, y + 20, 376, y + 20, { sw: 1.2 }); });
      b += box(378, 50, 90, 90, "timer", "x5, peak mem", "warn", { size: 12, size2: 9 });
      b += t(240, 210, "filter -> group by key -> sum, mean, count distinct", { size: 11, mono: true, fill: C.dim, max: 456 });
      return svg(480, 224, b, "Benchmark setup with Faker data read by three engines");
    },
    caption: "Generate once, then time only the engine work, with warm-up and repeats.",
    _fig: i => {
      const [n, pd, pl, dk] = BM[i];
      let b = t(240, 18, "Input " + n, { bold: true, size: 13.5 });
      [["pandas", pd], ["Polars", pl], ["DuckDB", dk]].forEach(([e, [s, k]], j) => { const y = 34 + j * 40; b += t(30, y + 22, e, { a: "start", size: 12.5, bold: true }); b += box(120, y, 330, 30, s, null, k, { size: 12 }); });
      return svg(480, 160, b, "Engine outcome for input size");
    },
    ix: el => choice(el, { label: "Input", options: BM.map(m => m[0]), value: 0 }, i => ({ svg: P["cap-benchmark"]._fig(i), note: BM[i][4] })),
    oneline: "Time the same job on the same data in each engine, fairly, and let the numbers pick the tool.",
  };

  /* ---------------------------------------------------------------- cap-streaming-pipeline */
  P["cap-streaming-pipeline"] = {
    simple: [
      "Batch pipelines answer questions about yesterday. This project handles each event a few seconds after it happens, such as revenue per region per minute during a sale.",
      "Apps send events to **Kafka**, a log split into partitions by key. A stream engine (Spark Structured Streaming, Flink or Bytewax) reads them and adds them up in one-minute **windows** by event time, using a **watermark** to wait a little for late events.",
      "Results go two ways: to a fast store (Postgres or Redis) behind a live dashboard, and to the lake for history. **Checkpoints** plus an **idempotent** sink (upsert by key and window) make the counts exactly-once.",
    ],
    analogy: {
      text: "Think of a live election-night results board.",
      left: "Election night", right: "Streaming pipeline",
      map: [
        ["Ballot boxes arriving from each district", "Events into Kafka partitions"],
        ["Counters tallying per district per hour", "Windowed aggregation"],
        ["Waiting a bit for the last late boxes", "Watermark"],
        ["The big screen in the studio", "Serving store + live dashboard"],
        ["The official archive", "Lake copy for history and replay"],
      ],
      breaks: "election counters never count a box twice. Stream engines can replay after a crash, so the sink must upsert by (key, window) rather than add.",
    },
    svg: () => {
      let b = t(240, 18, "Revenue per region per minute, seconds after each order", { bold: true, size: 12.5 });
      b += row([["apps", "orders", "plain"], ["Kafka", "6 partitions", "acc"], ["Spark SS", "1-min windows", "vio"], ["Postgres", "upsert", "good"], ["dashboard", "live", "good"]], 12, 32, 84, 44, 9);
      b += arrow(239, 78, 239, 100, { sw: 1.2 }); b += box(196, 102, 86, 30, "checkpoint", null, "warn", { size: 11 });
      b += arrow(145, 78, 145, 154, { sw: 1.2 }); b += box(102, 156, 86, 30, "lake (Delta)", null, "plain", { size: 11 });
      b += table(230, 152, ["region", "window", "revenue"], [["north", "12:03", "41,200"], ["south", "12:03", "28,950"]], { cw: [70, 70, 90], rh: 22, size: 11 });
      b += t(240, 238, "MERGE ON (region, window): a replay overwrites, never doubles", { size: 11, fill: C.goodT, max: 456 });
      return svg(480, 250, b, "Streaming pipeline from Kafka through a windowed processor to serving and the lake");
    },
    caption: "Kafka buffers, the engine windows by event time, and the sink upserts so a replay can't double count. Figures are examples.",
    oneline: "Stream events through Kafka into per-minute windows, upsert the results, and keep a lake copy.",
  };

  /* ---------------------------------------------------------------- cap-dbt-warehouse */
  P["cap-dbt-warehouse"] = {
    simple: [
      "**dbt** (data build tool) lets you build a warehouse out of plain SQL `SELECT` files, and treats them like software: versioned, tested and documented.",
      "The build goes in layers. **Sources** declare the raw tables. **Staging** models clean each source one-to-one (rename, cast types). **Intermediate** models hold joins and business logic. **Marts** are the final star schema of facts and dimensions that BI tools read.",
      "Models refer to each other with `ref()`, so dbt knows the order to build them and draws the lineage graph. Tests (`not_null`, `unique`, `relationships`, `accepted_values`) run on every build, and **snapshots** keep SCD Type 2 history.",
    ],
    analogy: {
      text: "Think of a recipe book where each recipe can use other recipes.",
      left: "Recipe book", right: "dbt project",
      map: [
        ["Raw ingredients from the shop", "Sources"],
        ["Washed and chopped vegetables", "Staging models"],
        ["Sauces made from several ingredients", "Intermediate models"],
        ["The finished dishes", "Marts (facts and dimensions)"],
        ["\"Use the tomato sauce on page 12\"", "ref('int_orders')"],
        ["Tasting before serving", "dbt tests"],
      ],
      breaks: "a recipe book doesn't check the food. dbt tests do, but only for what you wrote tests for; untested columns can still be wrong.",
    },
    svg: () => {
      let b = t(240, 18, "Layers and refs: dbt builds in dependency order", { bold: true, size: 13 });
      const cols = [["sources", ["raw.orders", "raw.customers"], "plain"], ["staging", ["stg_orders", "stg_customers"], "acc"], ["intermediate", ["int_orders"], "vio"], ["marts", ["fct_orders", "dim_customer"], "good"]];
      const pos = {};
      cols.forEach(([h, ms, k], c) => {
        const x = 12 + c * 118; b += t(x + 52, 44, h, { bold: true, size: 11.5, fill: C.dim });
        ms.forEach((m, r) => { const y = ms.length === 1 ? 84 : 56 + r * 56; pos[m] = [x, y]; b += box(x, y, 104, 34, m, null, k, { size: 10, mono: true }); });
      });
      const E = [["raw.orders", "stg_orders"], ["raw.customers", "stg_customers"], ["stg_orders", "int_orders"], ["stg_customers", "int_orders"], ["int_orders", "fct_orders"], ["stg_customers", "dim_customer"]];
      E.forEach(([a, z]) => { const [x1, y1] = pos[a], [x2, y2] = pos[z]; b += arrow(x1 + 105, y1 + 17, x2 - 1, y2 + 17, { sw: 1.1 }); });
      b += box(12, 160, 456, 28, "tests: not_null, unique, relationships, accepted_values on every build", null, "warn", { size: 11 });
      b += box(12, 196, 220, 28, "incremental: only new rows", null, "plain", { size: 11 });
      b += box(248, 196, 220, 28, "snapshots: SCD2 history", null, "plain", { size: 11 });
      return svg(480, 236, b, "dbt project lineage from sources through staging and intermediate to marts");
    },
    caption: "Arrows are ref() calls; dbt reads them to build in the right order and to draw lineage.",
    oneline: "dbt turns layered SQL files into a tested, documented warehouse built in the right order.",
  };

  /* ---------------------------------------------------------------- cap-lakehouse-medallion */
  P["cap-lakehouse-medallion"] = {
    simple: [
      "A plain data lake is a folder of files: cheap, but easy to corrupt and hard to update. A **lakehouse** adds a **table format** (Delta Lake or Apache Iceberg) on top, which brings database features to those files.",
      "The data is organised in three layers, called **medallion**. **Bronze** keeps the raw data exactly as it arrived, append-only. **Silver** holds cleaned, de-duplicated, typed records, kept up to date with `MERGE`. **Gold** holds business tables and aggregates for dashboards and ML.",
      "The table format gives **ACID** transactions (no half-written tables), `MERGE` for upserts and deletes, **time travel** to past versions, and schema changes without rewriting data.",
    ],
    analogy: {
      text: "Think of a recycling plant.",
      left: "Recycling plant", right: "Medallion lakehouse",
      map: [
        ["Everything tipped in from the trucks", "Bronze: raw, append-only"],
        ["Sorted and cleaned materials", "Silver: deduplicated, typed"],
        ["Finished products ready to sell", "Gold: marts and aggregates"],
        ["The plant's logbook of every batch", "Transaction log (time travel)"],
      ],
      breaks: "recycled material can't be un-recycled. Bronze is kept, so silver and gold can always be rebuilt from it when a rule changes.",
    },
    svg: () => {
      let b = t(240, 18, "Bronze, silver, gold on one table format", { bold: true, size: 13.5 });
      b += box(12, 40, 72, 60, "sources", "files, CDC", "plain", { size: 11.5, size2: 9.5 });
      b += arrow(86, 70, 104, 70);
      b += box(106, 34, 110, 72, "bronze", "as-is, append", "warn", { size: 13, size2: 10 });
      b += arrow(218, 70, 236, 70);
      b += box(238, 34, 110, 72, "silver", "MERGE, dedup", "plain", { size: 13, size2: 10 });
      b += arrow(350, 70, 368, 70);
      b += box(370, 34, 98, 72, "gold", "marts, KPIs", "good", { size: 13, size2: 10 });
      b += `<rect x="106" y="120" width="362" height="48" rx="8" style="fill:${C.acc};stroke:${C.accS}"/>`;
      b += t(287, 138, "Delta / Iceberg: transaction log over Parquet files", { size: 11.5, bold: true, fill: C.accT });
      b += t(287, 156, "ACID | MERGE | time travel | schema evolution", { size: 11, fill: C.tx });
      b += t(240, 196, "SELECT * FROM silver.orders VERSION AS OF 41", { size: 11, mono: true, fill: C.dim });
      b += t(240, 216, "rebuild silver and gold from bronze when logic changes", { size: 11, fill: C.dim });
      return svg(480, 228, b, "Medallion lakehouse layers on a table format");
    },
    caption: "Data improves layer by layer, and the table format underneath makes every write atomic and every version queryable.",
    oneline: "Keep raw data in bronze, clean it in silver, serve it from gold, on files that behave like tables.",
  };
})();
