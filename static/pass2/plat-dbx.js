/* Datalith pass 2 — Track 16: Databricks (part a: platform, Spark, Delta). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- dbx-lakehouse */
  P["dbx-lakehouse"] = {
    simple: [
      "Companies used to keep two systems. A **data lake** held cheap raw files of any kind. A **data warehouse** held clean tables for reports. Data was copied from one to the other every night.",
      "A **lakehouse** is one system that does both: files stay in cheap cloud storage, but behave like reliable database tables.",
      "**Delta Lake** makes that work. It adds a **transaction log** next to the Parquet files, so writes are all-or-nothing, old versions can be read (time travel), and rows can be updated with `MERGE`.",
    ],
    analogy: {
      text: "Think of a big box of loose photos versus a photo album.",
      left: "Photos", right: "Lakehouse",
      map: [
        ["A shoebox of loose prints: cheap, messy", "A data lake of raw files"],
        ["A framed gallery: tidy but costly to change", "A separate warehouse"],
        ["Same prints, but now an index card lists which are in the album", "Delta: Parquet files + transaction log"],
        ["Swap a photo and note it on the card in one go", "ACID writes"],
        ["Old index cards kept", "Time travel"],
      ],
      breaks: "an album index is written by one person. Delta's log is written by many jobs at once, and it uses optimistic concurrency to stop two writers clashing.",
    },
    svg: () => {
      let b = t(120, 22, "Before: two systems", { bold: true, size: 13.5 }) + t(360, 22, "Lakehouse: one", { bold: true, size: 13.5 });
      b += box(20, 40, 180, 50, "Data lake", "raw files, ML", "plain", { size: 14 });
      b += arrow(110, 92, 110, 124, { label: "nightly copy", dx: 46, dy: 4 });
      b += box(20, 126, 180, 50, "Warehouse", "clean tables, BI", "plain", { size: 14 });
      b += line(240, 34, 240, 220, { stroke: C.faint, dash: true });
      b += box(280, 40, 180, 40, "BI · SQL · ML · streaming", null, "vio", { size: 12 });
      b += box(280, 96, 180, 50, "Delta tables", "ACID · time travel · MERGE", "acc", { size: 14, size2: 11 });
      b += box(280, 162, 180, 50, "Object storage", "Parquet + _delta_log", "good", { size: 14, size2: 11 });
      b += arrow(370, 94, 370, 82) + arrow(370, 160, 370, 148);
      b += t(110, 206, "two copies, drift, cost", { size: 12, fill: C.badT });
      return svg(480, 232, b, "Lake plus warehouse with copies, versus one lakehouse on Delta tables");
    },
    caption: "The lakehouse keeps one copy in open files and adds table guarantees on top.",
    oneline: "A lakehouse keeps all data in cheap files but makes them behave like reliable database tables.",
  };

  /* ---------------------------------------------------------------- dbx-architecture */
  P["dbx-architecture"] = {
    simple: [
      "Databricks has two halves. The **control plane**, run by Databricks, holds the web workspace, notebooks, the job scheduler and Unity Catalog.",
      "The **compute plane** is where clusters actually crunch data. In classic mode it runs in **your** cloud account; with serverless, Databricks runs it for you.",
      "Your data stays in your own cloud storage either way.",
      "You pay in **DBUs** (Databricks Units) per second of compute, plus the cloud machines on classic compute. **Photon** is a faster engine written in C++ that runs Spark SQL and DataFrame work.",
    ],
    analogy: {
      text: "Think of a ride-hailing app.",
      left: "Ride-hailing", right: "Databricks",
      map: [
        ["The app on your phone and the company's servers", "Control plane (workspace, scheduler, catalog)"],
        ["The cars on the road", "Compute plane (clusters)"],
        ["Your own car hired into the network", "Classic compute in your cloud account"],
        ["The company's own fleet", "Serverless compute"],
        ["Your luggage, which never goes to head office", "Your data in your storage"],
      ],
      breaks: "a taxi carries you, not your house. Databricks clusters do read your data, so network rules and storage permissions between the compute plane and your bucket still matter.",
    },
    svg: () => {
      let b = box(14, 14, 452, 70, null, null, "acc") + t(240, 36, "Control plane (Databricks)", { bold: true, size: 14, fill: C.accT });
      ["Workspace UI", "Jobs scheduler", "Unity Catalog"].forEach((n, i) => { b += box(28 + i * 146, 46, 132, 28, n, null, "plain", { size: 12 }); });
      b += arrow(140, 86, 140, 116, { label: "start cluster", dx: -44, dy: 4 }) + arrow(340, 86, 340, 116);
      b += box(14, 118, 220, 56, "Classic compute", "VMs in your cloud account", "vio", { size: 14, size2: 11 });
      b += box(246, 118, 220, 56, "Serverless compute", "run by Databricks", "vio", { size: 14, size2: 11 });
      b += arrow(124, 176, 200, 196) + arrow(356, 176, 280, 196);
      b += box(100, 198, 280, 40, "Your cloud storage (Delta tables)", null, "good", { size: 13 });
      return svg(480, 252, b, "Databricks control plane, classic and serverless compute planes, and your storage");
    },
    caption: "Databricks runs the brains; compute runs in your account or theirs; the data stays in your storage.",
    oneline: "Databricks keeps the controls on its side, runs the computers near your data, and never moves your data into its own account.",
  };

  /* ---------------------------------------------------------------- dbx-unity-catalog */
  const UC = [
    ["Metastore", "one per region, attached to workspaces", "acc"],
    ["Catalog: prod", "per environment or domain", "vio"],
    ["Schema: sales", "a database inside the catalog", "warn"],
    ["Table: orders", "also views, volumes, functions, models", "good"],
  ];
  const ucFig = (lvl) => {
    let b = "";
    UC.forEach(([n, s, k], i) => {
      const x = 14 + i * 26, w = 452 - i * 52, y = 14 + i * 52;
      b += box(x, y, w, 44, n, s, i <= lvl ? k : "ghost", { size: 14, size2: 11, dash: i > lvl });
      if (i) b += arrow(x + 16, y - 6, x + 16, y + 2, { stroke: C.faint });
    });
    b += box(14, 228, 452, 34, ["GRANT ... ON METASTORE", "GRANT USE CATALOG ON CATALOG prod", "GRANT USE SCHEMA ON SCHEMA prod.sales", "GRANT SELECT ON TABLE prod.sales.orders"][lvl], null, "plain", { mono: true, size: 11.5, bold: false });
    return b;
  };
  P["dbx-unity-catalog"] = {
    simple: [
      "**Unity Catalog** (UC) is the one place where Databricks keeps the list of all your tables, files and models, and who may use them.",
      "Every table has a three-part name: **catalog.schema.table**, for example `prod.sales.orders`. Above the catalogs sits one **metastore** per cloud region.",
      "Permissions are SQL `GRANT`s and they flow down: access to a catalog can cover the schemas inside it.",
      "Because every query goes through UC, it also records **lineage** (what was made from what) and an **audit log**, across all workspaces.",
    ],
    analogy: {
      text: "Think of a postal address.",
      left: "Postal address", right: "Unity Catalog",
      map: [
        ["The country's postal service", "The metastore (one per region)"],
        ["City", "Catalog (prod, dev)"],
        ["Street", "Schema (sales)"],
        ["House number", "Table (orders)"],
        ["Gate key for the street, door key for the house", "USE SCHEMA, then SELECT"],
      ],
      breaks: "a postman can walk any street. In UC you need USE CATALOG and USE SCHEMA just to reach a table, even when you've been granted SELECT on it.",
    },
    svg: () => svg(480, 276, ucFig(3), "Unity Catalog hierarchy: metastore, catalog, schema, table"),
    caption: "prod.sales.orders: each level nests in the one above, and grants follow the same path.",
    ix: el => choice(el, { label: "Level", options: ["Metastore", "Catalog", "Schema", "Table"], value: 1 }, i => ({ svg: svg(480, 276, ucFig(i), "Unity Catalog level"), note: ["The metastore is the top container for one region. Admins attach it to workspaces so they all see the same catalogs.", "A catalog groups schemas, usually per environment (prod, dev) or per business domain. USE CATALOG lets you step inside.", "A schema groups tables and views. USE SCHEMA is the second key you need.", "A table, view, volume, function or model. SELECT here only works if you also hold USE CATALOG and USE SCHEMA above it."][i] })),
    oneline: "Unity Catalog gives every table a three-part address and one set of rules for who may open it.",
  };

  /* ---------------------------------------------------------------- dbx-lakeflow */
  P["dbx-lakeflow"] = {
    simple: [
      "**Lakeflow** is Databricks' set of data-engineering tools, in three parts.",
      "**Lakeflow Connect** pulls data in from databases and apps with managed connectors. **Lakeflow Spark Declarative Pipelines** (formerly Delta Live Tables, or DLT) let you declare tables and quality rules; the platform works out the order and runs them. **Lakeflow Jobs** (formerly Workflows) schedules and orchestrates everything.",
      "New Python pipeline code starts with `from pyspark import pipelines as dp`; old `import dlt` code still runs.",
    ],
    analogy: {
      text: "Think of a water system for a town.",
      left: "Water system", right: "Lakeflow",
      map: [
        ["Pipes from rivers and wells", "Lakeflow Connect (ingestion)"],
        ["The treatment plant with quality tests", "Declarative pipelines with expectations"],
        ["The control room timetable", "Lakeflow Jobs (orchestration)"],
        ["Clean water in the tank", "Gold Delta tables"],
      ],
      breaks: "water flows on its own. Pipelines only run when Jobs triggers them (or in continuous mode), and each run costs compute.",
    },
    svg: () => {
      let b = "";
      [["Lakeflow Connect", "managed ingestion", "plain"], ["Declarative Pipelines", "tables + expectations", "acc"], ["Delta tables", "bronze → gold", "good"]].forEach(([n, s, k], i) => {
        b += box(10 + i * 158, 40, 144, 56, n, s, k, { size: 13, size2: 11 });
        if (i < 2) b += arrow(156 + i * 158, 68, 166 + i * 158, 68);
      });
      b += box(10, 140, 460, 48, "Lakeflow Jobs", "schedules, triggers, retries, alerts for all of it", "vio", { size: 14, size2: 11.5 });
      b += arrow(82, 138, 82, 98, { stroke: C.vioS }) + arrow(240, 138, 240, 98, { stroke: C.vioS });
      b += t(240, 216, "Formerly: DLT → Declarative Pipelines; Workflows → Jobs", { size: 12, fill: C.dim });
      return svg(480, 232, b, "Lakeflow Connect, Declarative Pipelines and Delta tables orchestrated by Lakeflow Jobs");
    },
    caption: "Connect brings data in, pipelines shape it, Jobs runs the timetable.",
    oneline: "Lakeflow brings data in, cleans it with declared rules, and runs it all on a schedule.",
  };

  /* ---------------------------------------------------------------- dbx-medallion */
  const MED = [
    ["Good order", -1, "It passes every layer: kept raw in bronze, cleaned in silver, counted in gold."],
    ["Duplicate event", 1, "Bronze keeps both copies (it's the raw record). Silver de-duplicates on the event key, so gold counts it once."],
    ["NULL customer_id", 1, "A silver expectation like <code>EXPECT (customer_id IS NOT NULL) ON VIOLATION DROP ROW</code> stops it, and the pipeline's metrics count the drop."],
    ["Bad currency", 2, "It passes silver's type checks but fails the gold business rule (only known currencies), so it's quarantined before the revenue table."],
  ];
  const medFig = (i) => {
    const stop = MED[i][1];
    let b = box(14, 18, 100, 40, MED[i][0], null, "plain", { size: 10 });
    [["Bronze", "raw, as received", "warn"], ["Silver", "clean, deduped", "acc"], ["Gold", "business-ready", "good"]].forEach(([n, s, k], j) => {
      const x = 140 + j * 112, blocked = stop >= 0 && j >= stop;
      b += box(x, 18, 100, 56, n, s, blocked ? "ghost" : k, { size: 14, size2: 9.5, dash: blocked });
      if (j < 2) b += arrow(x + 102, 46, x + 110, 46, { stroke: stop >= 0 && j + 1 >= stop ? C.badS : C.line });
    });
    b += arrow(116, 38, 138, 42);
    if (stop >= 0) { const x = 140 + stop * 112 + 50; b += arrow(x, 76, x, 108, { stroke: C.badS }); b += box(x - 60, 110, 120, 34, stop === 1 ? "dropped / counted" : "quarantine", null, "bad", { size: 12 }); }
    else b += box(364, 110, 100, 34, "in reports", null, "good", { size: 12.5 });
    return b;
  };
  P["dbx-medallion"] = {
    simple: [
      "The **medallion architecture** sorts a lakehouse into three layers of Delta tables, like medals.",
      "**Bronze** keeps data exactly as it arrived, so you can always rebuild. **Silver** is cleaned: types fixed, duplicates removed, bad rows filtered. **Gold** is shaped for business questions, like daily revenue per store.",
      "Each layer is built from the one before, often with Auto Loader into bronze and Lakeflow pipelines with quality rules (**expectations**) after that.",
    ],
    analogy: {
      text: "Think of turning harvested grain into bread.",
      left: "Grain to bread", right: "Medallion layers",
      map: [
        ["Sacks of grain straight from the field", "Bronze: raw, append-only"],
        ["Washed, sorted, stones removed", "Silver: cleaned and de-duplicated"],
        ["Loaves on the shop shelf", "Gold: business-ready tables"],
        ["Keep a sack in case a batch goes wrong", "Rebuild silver and gold from bronze"],
        ["Quality inspector at each step", "Expectations"],
      ],
      breaks: "grain goes one way. Data teams often go back: when a cleaning rule changes, they reprocess bronze to rebuild silver and gold, which only works if bronze kept everything.",
    },
    svg: () => svg(480, 160, medFig(2), "A record with NULL customer id stopped at the silver layer"),
    caption: "Bad records stop at the layer whose rule they break; bronze always keeps the original.",
    ix: el => choice(el, { label: "Incoming record", options: MED.map(m => m[0]), value: 0 }, i => ({ svg: svg(480, 160, medFig(i), "Where a record is stopped"), note: MED[i][2] })),
    oneline: "Medallion layers go from raw to clean to business-ready, and each layer catches a different kind of mess.",
  };

  /* ---------------------------------------------------------------- dbx-spark */
  P["dbx-spark"] = {
    simple: [
      "**Apache Spark** is the engine under Databricks. It splits a big job across many machines.",
      "You describe the work with **DataFrames** (tables in code). Steps like `filter` and `join` are **transformations**: Spark only writes them down. An **action** like `write` or `count` makes it actually run.",
      "Spark cuts the plan into **stages** wherever data must be **shuffled** (moved between machines), and each stage into **tasks**, one per data partition.",
      "Optimizers (Catalyst, Adaptive Query Execution, Photon) and choices like broadcast joins make it fast.",
    ],
    analogy: {
      text: "Think of a school sorting a pile of exam papers.",
      left: "Sorting exams", right: "Spark",
      map: [
        ["The head teacher writes the plan first", "Lazy transformations build a plan"],
        ["\"Go!\"", "An action triggers the job"],
        ["Each teacher marks their own pile", "Tasks on partitions, in parallel"],
        ["Everyone swaps papers to group by class", "A shuffle (stage boundary)"],
        ["Handing every teacher a copy of the answer key", "Broadcasting a small table"],
      ],
      breaks: "teachers can shout across the room. Spark machines can only swap data over the network, which is why shuffles are the expensive part.",
    },
    svg: () => {
      let b = box(14, 16, 452, 36, "df.filter(...).groupBy('store').sum('amt').write(...)", null, "plain", { mono: true, size: 11.5, bold: false });
      b += t(240, 72, "write = action → Job", { size: 12, fill: C.accT, bold: true });
      b += t(110, 96, "Stage 1: read + filter", { size: 12.5, bold: true }) + t(370, 96, "Stage 2: sum per store", { size: 12.5, bold: true });
      for (let i = 0; i < 4; i++) b += box(20 + i * 46, 108, 40, 30, "T" + (i + 1), null, "acc", { size: 12 });
      for (let i = 0; i < 3; i++) b += box(306 + i * 52, 108, 44, 30, "T" + (i + 1), null, "vio", { size: 12 });
      b += box(212, 106, 80, 34, "shuffle", null, "warn", { size: 13 });
      b += arrow(200, 123, 210, 123) + arrow(294, 123, 304, 123);
      b += t(240, 172, "one task per partition; tasks run on executor cores", { size: 12, fill: C.dim });
      b += t(240, 196, "the shuffle moves rows with the same store to one task", { size: 12, fill: C.dim });
      return svg(480, 212, b, "A Spark job split into two stages of tasks around a shuffle");
    },
    caption: "An action starts a job; the shuffle splits it into stages; each stage is many parallel tasks.",
    oneline: "Spark writes down your plan, then runs it as many small tasks at once, moving data between machines only when it must.",
  };

  /* ---------------------------------------------------------------- dbx-streaming */
  P["dbx-streaming"] = {
    simple: [
      "**Structured Streaming** lets you write a query once and have Spark keep running it as new data arrives.",
      "You read with `readStream` from a source (Auto Loader for files, Kafka, a Delta table), transform with the normal DataFrame API, and write with `writeStream` to a sink, usually Delta.",
      "It runs in small **micro-batches**. A **trigger** sets how often. A **checkpoint** folder records progress, so after a crash it carries on without losing or repeating data.",
      "**Watermarks** say how long to wait for late events.",
    ],
    analogy: {
      text: "Think of a school canteen serving lunch in waves.",
      left: "Canteen", right: "Structured Streaming",
      map: [
        ["The same recipe all day", "The same query on every batch"],
        ["Serving a wave of pupils every few minutes", "Micro-batches set by the trigger"],
        ["A register of which pupils were served", "The checkpoint"],
        ["Keeping a plate warm for latecomers, until a cut-off", "Watermark for late data"],
      ],
      breaks: "a canteen closes after lunch. A stream runs until you stop it, so its state and checkpoint must be looked after for months.",
    },
    svg: () => {
      let b = box(10, 50, 110, 56, "Source", "Kafka / files / Delta", "plain", { size: 14, size2: 10 });
      b += arrow(122, 78, 150, 78);
      ["batch 41", "batch 42", "batch 43"].forEach((n, i) => { b += box(152 + i * 70, 56, 62, 44, n, null, i === 2 ? "acc" : "ghost", { size: 11, dash: i < 2 }); });
      b += arrow(364, 78, 380, 78);
      b += box(382, 50, 88, 56, "Delta", "sink", "good", { size: 14 });
      b += box(152, 140, 202, 44, "checkpoint", "offsets + state per batch", "warn", { size: 13.5, size2: 11 });
      b += arrow(290, 102, 260, 138, { stroke: C.warnS, dash: true });
      b += t(240, 30, "trigger: every 1 minute", { size: 12.5, fill: C.accT, bold: true });
      b += t(240, 212, "after a crash, restart reads the checkpoint and resumes at batch 43", { size: 12, fill: C.dim });
      return svg(480, 228, b, "Streaming micro-batches from a source to Delta with a checkpoint");
    },
    caption: "Each micro-batch is a small batch query; the checkpoint remembers where the last one stopped.",
    oneline: "Structured Streaming runs your normal query again and again on new data, and remembers where it got to.",
  };

  /* ---------------------------------------------------------------- dbx-sql-bi */
  P["dbx-sql-bi"] = {
    simple: [
      "**Databricks SQL** lets analysts query the lakehouse with plain SQL and build dashboards, without copying data into a separate warehouse.",
      "SQL runs on a **SQL warehouse**: compute made for SQL. **Serverless** warehouses start in seconds, scale with load and stop when idle. **Photon** speeds up the SQL.",
      "BI tools like Power BI and Tableau connect to the same warehouse, and every query goes through Unity Catalog permissions.",
    ],
    analogy: {
      text: "Think of a library reading room open to the public.",
      left: "Reading room", right: "Databricks SQL",
      map: [
        ["The same books the researchers use", "The same Delta tables ETL writes"],
        ["Reading-room desks", "A SQL warehouse"],
        ["More desks put out when it's busy", "Autoscaling clusters"],
        ["Lights off at closing time", "Auto-stop"],
        ["Your library card decides which shelves you can reach", "Unity Catalog grants"],
      ],
      breaks: "a reading room has fixed desks. Serverless warehouses add whole clusters under load, and each running cluster bills DBUs.",
    },
    svg: () => {
      let b = "";
      [["Power BI", 20], ["Tableau", 172], ["DBSQL dashboards", 324]].forEach(([n, x]) => { b += box(x, 16, 136, 40, n, null, "plain", { size: 13 }); b += arrow(x + 68, 58, 240, 88); });
      b += box(120, 90, 240, 56, "Serverless SQL warehouse", "Photon · autoscale · auto-stop", "vio", { size: 14, size2: 11 });
      b += arrow(240, 148, 240, 172);
      b += box(60, 174, 360, 50, "Unity Catalog → Delta tables", "the same governed data as ETL and ML", "good", { size: 14, size2: 11 });
      return svg(480, 238, b, "BI tools querying a serverless SQL warehouse over Unity Catalog tables");
    },
    caption: "BI tools, dashboards and ad-hoc SQL all hit the same governed tables through one warehouse.",
    oneline: "Databricks SQL lets analysts query and chart the lakehouse directly, with no copy into another warehouse.",
  };

  /* ---------------------------------------------------------------- dbx-ml */
  P["dbx-ml"] = {
    simple: [
      "Machine learning on Databricks happens next to the data, with no export step.",
      "**MLflow** records every training run: settings, scores and the model file, so results can be repeated and compared. Models are registered in **Unity Catalog** with versions and aliases like `champion`.",
      "A **feature store** keeps the input features consistent between training and serving. **Model Serving** puts a model behind an API endpoint.",
      "Everything is governed by the same permissions and lineage as your tables.",
    ],
    analogy: {
      text: "Think of a bakery testing new recipes.",
      left: "Recipe testing", right: "ML on Databricks",
      map: [
        ["A notebook of every attempt: oven heat, time, taste score", "MLflow tracking"],
        ["The recipe book with version numbers", "Model registry in Unity Catalog"],
        ["\"Today's recipe\" sticker on the best one", "The champion alias"],
        ["Pre-measured ingredient tubs", "The feature store"],
        ["The shop counter selling the bread", "Model Serving endpoint"],
      ],
      breaks: "a recipe stays good. Models drift as the world changes, so serving needs monitoring and retraining, not just one good test.",
    },
    svg: () => {
      let b = "";
      [["Features", "feature tables", "plain"], ["Train", "MLflow runs", "acc"], ["Register", "UC model v3", "vio"], ["Serve", "endpoint", "good"]].forEach(([n, s, k], i) => {
        const x = 8 + i * 118;
        b += box(x, 40, 106, 56, n, s, k, { size: 14, size2: 11 });
        if (i < 3) b += arrow(x + 108, 68, x + 116, 68);
      });
      b += arrow(420, 98, 420, 140) + box(350, 142, 120, 40, "monitor drift", null, "warn", { size: 12.5 });
      b += arrow(348, 162, 60, 162, { dash: true, stroke: C.faint, label: "retrain when it drifts", dy: -8 });
      b += arrow(60, 160, 60, 100, { dash: true, stroke: C.faint });
      b += t(240, 214, "All governed by Unity Catalog: same grants, same lineage.", { size: 12.5, fill: C.dim });
      return svg(480, 230, b, "ML lifecycle on Databricks from features to serving with a retraining loop");
    },
    caption: "Features feed training, the best run is registered and served, drift sends you back round.",
    oneline: "Databricks tracks every model you train, keeps the best one versioned, and serves it next to the data.",
  };

  /* ---------------------------------------------------------------- dbx-dataops */
  P["dbx-dataops"] = {
    simple: [
      "**DataOps** means treating pipelines like software: written as code, kept in Git, tested, and deployed the same way every time.",
      "On Databricks you describe jobs, pipelines and clusters in a **Declarative Automation Bundle** (formerly Databricks Asset Bundles, or DABs): a `databricks.yml` file with a section per **target** such as dev, staging and prod.",
      "CI (continuous integration) runs `databricks bundle validate` and your tests on every pull request. CD (continuous deployment) runs `databricks bundle deploy -t prod` after approval.",
    ],
    analogy: {
      text: "Think of a theatre show touring different cities.",
      left: "Touring show", right: "DataOps",
      map: [
        ["The script and stage directions", "Bundle: jobs and pipelines as code"],
        ["Notes per venue: stage size, lighting", "Targets: dev, staging, prod settings"],
        ["Dress rehearsal before opening night", "CI tests on a pull request"],
        ["The same show in every city", "Repeatable deploy to each target"],
      ],
      breaks: "a show rehearses with the real cast. Tests in dev often run on small or fake data, so some bugs only show at production scale; monitor the first prod runs.",
    },
    svg: () => {
      let b = box(14, 30, 120, 56, "Git PR", "databricks.yml", "plain", { size: 14, size2: 11, mono2: true });
      b += arrow(136, 58, 164, 58);
      b += box(166, 30, 130, 56, "CI", "validate + tests", "acc", { size: 14, size2: 11 });
      b += arrow(298, 58, 326, 58, { label: "approve", dy: -8 });
      ["dev", "staging", "prod"].forEach((n, i) => { b += box(328, 14 + i * 36, 138, 30, "deploy -t " + n, null, i === 2 ? "good" : "plain", { mono: true, size: 12 }); });
      b += t(240, 140, "The same bundle, different target settings:", { size: 12.5, fill: C.dim });
      b += table(40, 152, ["target", "catalog", "cluster size"], [["dev", "dev", "small"], ["prod", "prod", "autoscale 2-8"]], { cw: [120, 120, 160], rh: 26 });
      return svg(480, 240, b, "Bundle pipeline from Git pull request through CI to deploy per target");
    },
    caption: "One definition in Git, tested once, deployed to each target with its own settings.",
    oneline: "DataOps keeps pipelines in code, tests them automatically, and deploys the same thing to every environment.",
  };

  /* ---------------------------------------------------------------- dbx-spark-execution */
  const exFig = (parts) => {
    const cores = 8, waves = Math.ceil(parts / cores);
    let b = t(240, 20, `${parts} partitions on 8 executor cores → ${waves} wave${waves > 1 ? "s" : ""}`, { bold: true, size: 13.5 });
    for (let c = 0; c < cores; c++) {
      b += t(42, 50 + c * 20, "core " + (c + 1), { size: 10.5, fill: C.dim, a: "end" });
      for (let w = 0; w < waves; w++) {
        const id = w * cores + c; if (id >= parts) continue;
        const wW = Math.min(110, 400 / waves - 4);
        b += `<rect x="${50 + w * (wW + 4)}" y="${38 + c * 20}" width="${wW}" height="16" rx="2" style="fill:${w % 2 ? C.vioS : C.accS}"/>`;
      }
    }
    const idle = waves * cores - parts;
    b += t(240, 216, idle ? `${idle} core-slots sit idle in the last wave` : "every core busy in every wave", { size: 12.5, fill: idle > 3 ? C.warnT : C.goodT, bold: true });
    return b;
  };
  P["dbx-spark-execution"] = {
    simple: [
      "Spark work has a ladder of pieces: **job → stage → task**.",
      "An **action** (like `write`) starts a **job**. The driver cuts the job into **stages** wherever data must be **shuffled** between machines.",
      "Each stage runs as **tasks**, one per partition of the data. A task runs on one executor **core** (a slot).",
      "If you have more tasks than cores, they run in waves. Too few partitions leaves cores idle; far too many adds overhead.",
    ],
    analogy: {
      text: "Think of a car wash with several bays.",
      left: "Car wash", right: "Spark execution",
      map: [
        ["Today's order: wash the whole fleet", "A job"],
        ["Wash first, then move cars to the drying area", "Stages, split at the shuffle"],
        ["One car", "One task (one partition)"],
        ["Wash bays", "Executor cores (slots)"],
        ["Cars queue when bays are full", "Tasks run in waves"],
      ],
      breaks: "cars are all about the same size. Partitions may not be: one huge partition (skew) keeps one bay busy long after the others finish.",
    },
    svg: () => svg(480, 230, exFig(20), "20 tasks scheduled on 8 cores in three waves"),
    caption: "20 partitions on 8 cores need 3 waves, and the last wave leaves 4 cores idle.",
    ix: el => slider(el, { label: "Partitions in the stage", min: 4, max: 48, step: 1, value: 16, fmt: v => v + " partitions" }, v => ({ svg: svg(480, 230, exFig(v), "Tasks over cores"), note: `${v} tasks on 8 cores. A multiple of the core count (8, 16, 24...) fills every wave. Spark's default for shuffles is 200 partitions; Adaptive Query Execution can merge small ones after the shuffle.` })),
    oneline: "Spark turns an action into a job, the job into stages, and each stage into one task per partition running on free cores.",
  };

  /* ---------------------------------------------------------------- dbx-spark-joins */
  const joinFig = (mb) => {
    const bc = mb <= 10;
    let b = t(240, 20, `small table: ${mb} MB → ${bc ? "broadcast hash join" : "sort-merge join"}`, { bold: true, size: 13.5 });
    b += t(240, 40, "default spark.sql.autoBroadcastJoinThreshold = 10 MB", { size: 11.5, fill: C.dim, mono: true });
    if (bc) {
      b += box(180, 56, 120, 36, "dim (copy)", null, "good", { size: 13 });
      for (let i = 0; i < 4; i++) { b += box(20 + i * 116, 140, 96, 50, "fact part " + (i + 1), "+ dim copy", "acc", { size: 12, size2: 10.5 }); b += arrow(240, 94, 68 + i * 116, 138, { stroke: C.goodS }); }
      b += t(240, 214, "no shuffle of the big table: each task joins locally", { size: 12.5, fill: C.goodT, bold: true });
    } else {
      for (let i = 0; i < 3; i++) { b += box(20 + i * 70, 60, 60, 30, "fact " + (i + 1), null, "acc", { size: 11 }); b += box(270 + i * 70, 60, 60, 30, "dim " + (i + 1), null, "good", { size: 11 }); }
      b += box(140, 120, 200, 36, "shuffle both sides by key", null, "warn", { size: 13 });
      b += arrow(120, 92, 180, 118, { stroke: C.warnS }) + arrow(340, 92, 300, 118, { stroke: C.warnS });
      b += box(140, 168, 200, 30, "sort, then merge per key", null, "plain", { size: 12.5 });
      b += arrow(240, 158, 240, 166);
      b += t(240, 220, "both tables cross the network: the costly part", { size: 12.5, fill: C.warnT, bold: true });
    }
    return b;
  };
  P["dbx-spark-joins"] = {
    simple: [
      "To join two tables, rows with the same key must meet on the same machine. Moving them there is the **shuffle**, and it's most of a join's cost.",
      "If one side is small, Spark can **broadcast** it: send a full copy to every executor, so the big table never moves. Spark does this on its own when the small side is under `spark.sql.autoBroadcastJoinThreshold` (10 MB by default).",
      "Otherwise it uses a **sort-merge join**: shuffle both sides by key, sort, and merge. **Adaptive Query Execution** (AQE) can switch strategies at runtime once it sees the real sizes.",
    ],
    analogy: {
      text: "Think of matching pupils to their class teachers on sports day.",
      left: "Sports day", right: "Spark joins",
      map: [
        ["Photocopy the short teacher list for every team", "Broadcast the small table"],
        ["Each team matches its own pupils locally", "Each task joins without a shuffle"],
        ["Both lists huge: everyone walks to their class's corner", "Shuffle both sides by key"],
        ["Each corner lines up names alphabetically to match", "Sort, then merge"],
      ],
      breaks: "photocopies are cheap. Broadcasting a table that's too big can run executors out of memory, which is why there's a threshold.",
    },
    svg: () => svg(480, 236, joinFig(4), "Broadcast hash join: small table copied to every task"),
    caption: "A 4 MB dimension is copied to every task, so the large fact table never shuffles.",
    ix: el => slider(el, { label: "Size of the smaller table", min: 1, max: 200, step: 1, value: 50, fmt: v => v + " MB" }, v => ({ svg: svg(480, 236, joinFig(v), "Join strategy by size"), note: v <= 10 ? "Under the threshold: Spark broadcasts. You can also force it with <code>broadcast(df)</code>, as long as it fits in executor memory." : "Over the threshold: both sides shuffle. If the small side is really only a little over, a broadcast hint or a higher threshold can avoid the shuffle; AQE may also switch at runtime." })),
    oneline: "Spark joins fast by copying a small table everywhere, and slow by shuffling both big tables across the network.",
  };

  /* ---------------------------------------------------------------- dbx-spark-aqe-photon */
  P["dbx-spark-aqe-photon"] = {
    simple: [
      "Three helpers make Spark fast.",
      "**Catalyst** rewrites your query before it runs: it pushes filters down to the scan, reads only needed columns, and picks a join order.",
      "**Adaptive Query Execution** (AQE) re-plans while running, using real sizes measured after each shuffle: it merges tiny partitions, splits skewed ones and can switch to a broadcast join.",
      "**Photon** is Databricks' engine written in C++ that processes data in batches of rows at a time (vectorized), so the same plan runs faster.",
    ],
    analogy: {
      text: "Think of a road trip.",
      left: "Road trip", right: "Spark optimizers",
      map: [
        ["Planning the route on a map before leaving", "Catalyst (before execution)"],
        ["The sat-nav rerouting around a traffic jam", "AQE (using runtime statistics)"],
        ["A faster car on the same route", "Photon (faster execution engine)"],
        ["Leaving the heavy bags at home", "Column pruning and filter pushdown"],
      ],
      breaks: "a sat-nav reroutes anywhere. AQE can only change the plan at shuffle boundaries, after a stage has finished and its sizes are known.",
    },
    svg: () => {
      let b = "";
      [["Your SQL / DataFrame", "what you want", "plain"], ["Catalyst", "before run: pushdown, pruning, join order", "acc"], ["AQE", "at shuffles: merge partitions, split skew", "warn"], ["Photon", "vectorized C++ run", "good"]].forEach(([n, s, k], i) => {
        const y = 14 + i * 54;
        b += box(100, y, 280, 44, n, s, k, { size: 14, size2: 11 });
        if (i < 3) b += arrow(240, y + 46, 240, y + 52);
      });
      b += t(240, 238, "df.explain('formatted') shows the plan", { size: 12, fill: C.dim, mono: true });
      return svg(480, 250, b, "Query passing through Catalyst, AQE and Photon");
    },
    caption: "Plan well before running, re-plan while running, and run the plan on a faster engine.",
    oneline: "Catalyst plans the query, AQE fixes the plan as it runs, and Photon runs it faster.",
  };

  /* ---------------------------------------------------------------- dbx-delta-log */
  const LOG = [
    ["000.json", ["+ a.parquet", "+ b.parquet"], ["a", "b"]],
    ["001.json", ["+ c.parquet"], ["a", "b", "c"]],
    ["002.json", ["- b.parquet", "+ b2.parquet"], ["a", "c", "b2"]],
    ["003.json", ["- a.parquet"], ["c", "b2"]],
  ];
  const logFig = (v) => {
    let b = t(120, 20, "_delta_log/", { bold: true, size: 13.5, mono: true }) + t(370, 20, "table at version " + v, { bold: true, size: 13.5 });
    LOG.forEach(([f, acts], i) => {
      const y = 32 + i * 50, on = i <= v;
      b += box(14, y, 210, 42, f, acts.join(", "), on ? "acc" : "ghost", { mono: true, size: 12.5, size2: 10.5, dash: !on });
    });
    const live = LOG[v][2];
    ["a", "b", "c", "b2"].forEach((f, i) => {
      const y = 40 + i * 46, inT = live.includes(f);
      b += box(280, y, 180, 36, f + ".parquet", inT ? "in the table" : "removed (still on disk)", inT ? "good" : "ghost", { mono: true, size: 12, size2: 10, dash: !inT });
    });
    b += arrow(226, 120, 276, 120, { label: "replay", dy: -8 });
    return b;
  };
  P["dbx-delta-log"] = {
    simple: [
      "A Delta table is a folder of Parquet data files plus a `_delta_log` folder of numbered commit files: `000.json`, `001.json` and so on.",
      "Each commit says which files were **added** and which were **removed**. To read the table, Delta replays the commits in order to find the current set of files.",
      "A write is a new commit file. If two writers try to create the same next number, only one wins and the other retries: **optimistic concurrency**.",
      "About every 10 commits Delta writes a **checkpoint** that sums up the state, so readers don't replay from zero. The log, not the folder listing, decides what's in the table.",
    ],
    analogy: {
      text: "Think of a bank statement.",
      left: "Bank statement", right: "Delta log",
      map: [
        ["Numbered lines: paid in, paid out", "Commits: add file, remove file"],
        ["Your balance = all lines added up", "The table = all commits replayed"],
        ["The monthly opening balance", "A checkpoint"],
        ["A line is final once printed", "A commit is atomic"],
        ["Two cheques with the same number: bank rejects one", "Optimistic concurrency"],
      ],
      breaks: "money removed from an account is gone. A file \"removed\" in the log stays on disk until VACUUM deletes it, which is what makes time travel possible.",
    },
    svg: () => svg(480, 234, logFig(2), "Delta log replayed to version 2: files a, c and b2 are live"),
    caption: "Replaying commits 000-002 gives files a, c and b2; b.parquet is removed but still on disk.",
    ix: el => slider(el, { label: "Read the table at version", min: 0, max: 3, step: 1, value: 3, fmt: v => "v" + v }, v => ({ svg: svg(480, 234, logFig(v), "Table at a version"), note: `Version ${v} = commits 000 to 00${v} replayed. Live files: <b>${LOG[v][2].map(f => f + ".parquet").join(", ")}</b>. This is also how <code>VERSION AS OF ${v}</code> works.` })),
    oneline: "A Delta table is whatever its log of numbered commits says, replayed in order.",
  };

  /* ---------------------------------------------------------------- dbx-delta-timetravel */
  P["dbx-delta-timetravel"] = {
    simple: [
      "Every commit to a Delta table is a numbered **version**. Old data files are kept until `VACUUM` removes them.",
      "So you can read the past: `SELECT * FROM orders VERSION AS OF 12` or `TIMESTAMP AS OF '2026-05-01'`. `DESCRIBE HISTORY` lists who changed what, and when.",
      "If a bad job breaks the table, `RESTORE TABLE orders TO VERSION AS OF 12` puts it back.",
      "How far back you can go is limited by VACUUM's file retention (7 days by default) and the log retention (30 days by default).",
    ],
    analogy: {
      text: "Think of the version history in a shared online document.",
      left: "Document history", right: "Delta time travel",
      map: [
        ["Every save becomes a version", "Every commit is a version"],
        ["\"Show me Tuesday's copy\"", "TIMESTAMP AS OF"],
        ["The list of edits with names", "DESCRIBE HISTORY"],
        ["\"Restore this version\"", "RESTORE TABLE"],
        ["Old versions cleared after a while", "VACUUM and log retention"],
      ],
      breaks: "document history is usually kept forever. Delta's is not: once VACUUM deletes old files, versions that need them can't be read.",
    },
    svg: () => {
      let b = line(30, 70, 450, 70, { sw: 2 });
      [[40, "v10", "good"], [140, "v11", "good"], [240, "v12", "good"], [340, "v13 bad MERGE", "bad"], [440, "v14", "acc"]].forEach(([x, n, k]) => {
        b += `<circle cx="${x}" cy="70" r="8" style="fill:${P2L.C[k + "S"]}"/>`;
        b += t(x, 50, n, { size: 12, bold: true, fill: P2L.C[k + "T"], a: x > 400 ? "end" : x < 60 ? "start" : "middle" });
      });
      b += arrow(430, 96, 252, 96, { stroke: C.accS, label: "RESTORE TO VERSION AS OF 12", dy: 18, size: 11.5 });
      b += box(14, 146, 452, 34, "SELECT * FROM orders VERSION AS OF 12", null, "plain", { mono: true, size: 12, bold: false });
      b += t(240, 210, "Reachable while VACUUM keeps the old files (7 days default).", { size: 12, fill: C.dim });
      return svg(480, 226, b, "Version timeline with a bad commit and a restore to version 12");
    },
    caption: "A bad MERGE at v13 is undone by restoring v12, which writes a new version v14.",
    oneline: "Delta remembers every version of a table, so you can read or restore the past until old files are cleaned up.",
  };

  /* ---------------------------------------------------------------- dbx-delta-merge */
  P["dbx-delta-merge"] = {
    simple: [
      "`MERGE INTO` updates, inserts and deletes rows in a target table from a source, matched on a key, in one atomic step.",
      "You list what to do in each case: `WHEN MATCHED` (update or delete), `WHEN NOT MATCHED` (insert), `WHEN NOT MATCHED BY SOURCE` (delete rows the source no longer has).",
      "It's how incremental loads work: apply today's changes instead of rewriting the whole table.",
      "De-duplicate the source first: if two source rows match one target row, MERGE fails.",
    ],
    analogy: {
      text: "Think of updating a class register from the office's change list.",
      left: "Class register", right: "MERGE",
      map: [
        ["The register", "Target table"],
        ["The office's list of changes", "Source table"],
        ["Pupil on both: update their details", "WHEN MATCHED THEN UPDATE"],
        ["New pupil: add a line", "WHEN NOT MATCHED THEN INSERT"],
        ["Pupil marked \"left\": cross them off", "WHEN MATCHED AND op = 'D' THEN DELETE"],
        ["The same pupil listed twice with different changes", "Duplicate source keys: MERGE fails"],
      ],
      breaks: "a teacher edits one line in place. Delta rewrites every file that holds a changed row (or marks rows with deletion vectors), so a MERGE touching rows in many files is expensive.",
    },
    svg: () => {
      let b = table(14, 30, ["id", "name"], [["1", "Ria"], ["2", "Om"], ["3", "Jay"]], { cw: [50, 90], rh: 28, title: "target" });
      b += table(180, 30, ["id", "name", "op"], [["2", "Omar", "U"], ["3", null, "D"], ["4", "Eli", "I"]], { cw: [40, 70, 40], rh: 28, title: "source" });
      b += arrow(332, 86, 356, 86, { label: "MERGE", dy: -10 });
      b += table(360, 30, ["id", "name"], [["1", "Ria"], ["2", "Omar"], ["4", "Eli"]], { cw: [40, 70], rh: 28, title: "result", hl: { 1: "warn", 2: "good" } });
      b += box(14, 160, 452, 66, null, null, "plain");
      ["MERGE INTO target t USING source s ON t.id = s.id", "WHEN MATCHED AND s.op = 'D' THEN DELETE", "WHEN MATCHED THEN UPDATE SET *  WHEN NOT MATCHED THEN INSERT *"].forEach((l, i) => { b += t(24, 180 + i * 18, l, { size: 11, mono: true, a: "start" }); });
      return svg(480, 240, b, "MERGE applying an update, a delete and an insert");
    },
    caption: "id 2 is updated, id 3 deleted, id 4 inserted, all in one commit.",
    oneline: "MERGE applies a list of changes to a table, updating, adding and deleting rows in one safe step.",
  };

  /* ---------------------------------------------------------------- dbx-delta-optimize */
  const optFig = (files) => {
    const avg = 10240 / files; // 10 GB table
    let b = t(240, 20, `10 GB table in ${files.toLocaleString()} files (avg ${avg >= 1024 ? (avg / 1024).toFixed(1) + " GB" : Math.round(avg) + " MB"})`, { bold: true, size: 13.5 });
    const n = Math.min(files, 120);
    for (let i = 0; i < n; i++) b += `<rect x="${20 + (i % 30) * 14.6}" y="${36 + Math.floor(i / 30) * 16}" width="12" height="12" rx="2" style="fill:${files > 100 ? C.badS : C.goodS}"/>`;
    if (files > 120) b += t(460, 112, "+" + (files - 120).toLocaleString() + " more", { size: 11.5, fill: C.badT, a: "end" });
    const tasks = files;
    b += box(20, 126, 210, 52, tasks.toLocaleString() + " scan tasks", "about one per file", files > 100 ? "bad" : "good", { size: 15 });
    b += box(250, 126, 210, 52, files > 100 ? "slow listing" : "healthy", files > 100 ? "run OPTIMIZE" : "~1 GB files", files > 100 ? "bad" : "good", { size: 15 });
    return b;
  };
  P["dbx-delta-optimize"] = {
    simple: [
      "Delta tables get slow for two reasons: **too many tiny files**, and the values a query filters on are **scattered** across every file.",
      "`OPTIMIZE` rewrites many small files into fewer large ones (about 1 GB). Fewer files means fewer tasks and faster listing.",
      "For layout, **liquid clustering** (`CLUSTER BY`) is now preferred over the older **Z-ORDER**: it groups similar rows so per-file min/max statistics let queries skip files.",
      "**Auto optimize** (optimized writes and auto compaction) and **predictive optimization** can do this maintenance for you.",
    ],
    analogy: {
      text: "Think of a desk drawer full of sticky notes.",
      left: "Sticky notes", right: "Delta files",
      map: [
        ["Hundreds of tiny notes", "Thousands of small files from streaming writes"],
        ["Copying them into one notebook", "OPTIMIZE compaction"],
        ["Grouping notes by topic in the notebook", "Clustering for data skipping"],
        ["A tab on each section: \"A to C\"", "Per-file min/max statistics"],
        ["A helper who tidies every evening", "Auto compaction / predictive optimization"],
      ],
      breaks: "copying notes is free. OPTIMIZE rewrites data, which costs compute and creates a new version; the old small files stay until VACUUM.",
    },
    svg: () => svg(480, 194, optFig(5000), "Table in 5,000 small files"),
    caption: "A 10 GB table in 5,000 small files needs about 5,000 scan tasks. Compacted to ~1 GB files, about 10.",
    ix: el => slider(el, { label: "Number of files", min: 10, max: 5000, step: 10, value: 100, fmt: v => v.toLocaleString() }, v => ({ svg: svg(480, 194, optFig(v), "Files vs scan tasks"), note: v > 100 ? `Average file ${Math.round(10240 / v)} MB. Each file costs a task, a listing call and its own overhead. <code>OPTIMIZE</code> bin-packs them toward ~1 GB.` : "Around 1 GB per file: few tasks, cheap listing. This is what OPTIMIZE aims for." })),
    oneline: "OPTIMIZE packs many tiny files into a few big ones, and clustering groups rows so queries can skip whole files.",
  };

  /* ---------------------------------------------------------------- dbx-delta-vacuum */
  const vacFig = (days) => {
    let b = t(240, 20, `VACUUM ... RETAIN ${days * 24} HOURS (${days} days)`, { bold: true, size: 13.5, mono: true });
    b += line(30, 70, 450, 70, { sw: 2 });
    for (let d = 0; d <= 14; d++) {
      const x = 30 + d * 30, kept = 14 - d <= days;
      b += `<rect x="${x - 10}" y="58" width="20" height="24" rx="3" style="fill:${kept ? C.goodS : C.badS}"/>`;
      if (d % 7 === 0) b += t(x, 100, d === 14 ? "today" : (14 - d) + " days ago", { size: 11, fill: C.dim, a: d === 0 ? "start" : d === 14 ? "end" : "middle" });
    }
    b += box(30, 120, 200, 50, "time travel back", days + " days", "good", { size: 15 });
    b += box(250, 120, 200, 50, "old files deleted", "older than " + days + " days", "bad", { size: 15 });
    b += t(240, 196, "Boxes: days of old (tombstoned) files. Green kept, red deleted.", { size: 12, fill: C.dim });
    return b;
  };
  P["dbx-delta-vacuum"] = {
    simple: [
      "Delta never deletes a data file straight away. An update or delete writes new files and marks the old ones as removed in the log, called **tombstoned**.",
      "Those old files keep costing storage, and they're what lets you time travel.",
      "`VACUUM` permanently deletes tombstoned files older than the retention threshold, **7 days** by default. After that, you can't time travel past that point.",
      "**Deletion vectors** make small deletes and updates cheaper: instead of rewriting a whole file, Delta records which rows in it are deleted.",
    ],
    analogy: {
      text: "Think of a recycling bin on your computer.",
      left: "Recycling bin", right: "VACUUM",
      map: [
        ["Deleted files go to the bin first", "Old files are tombstoned, still on disk"],
        ["You can restore from the bin", "Time travel to older versions"],
        ["Emptying items older than a week", "VACUUM with 7-day retention"],
        ["Crossing out lines instead of reprinting a page", "Deletion vectors"],
      ],
      breaks: "a recycling bin is per person. A Delta table's files may still be needed by a long-running query or stream; setting retention too low can break those readers.",
    },
    svg: () => svg(480, 212, vacFig(7), "VACUUM with 7-day retention keeps a week of old files"),
    caption: "With the default 7 days, the last week of old files stays, so time travel works for a week.",
    ix: el => slider(el, { label: "Retention (days)", min: 0, max: 14, step: 1, value: 14, fmt: v => v + " days" }, v => ({ svg: svg(480, 212, vacFig(v), "Retention vs time travel"), note: v < 7 ? "Below 7 days Delta refuses unless you turn off <code>retentionDurationCheck</code>, because running queries or streams may still need those files." : `Longer retention means more time travel and more storage paid for. ${v} days of old files are kept.` })),
    oneline: "VACUUM deletes old table files after a waiting period, which saves storage but ends time travel past that point.",
  };

  /* ---------------------------------------------------------------- dbx-delta-cdf */
  P["dbx-delta-cdf"] = {
    simple: [
      "Time travel shows a whole table at one version. **Change Data Feed** (CDF) shows the **rows that changed** between versions.",
      "Turn it on with `delta.enableChangeDataFeed = true`. Then `table_changes('silver.customers', 5)` returns each change with `_change_type`: insert, delete, update_preimage (before) or update_postimage (after).",
      "A downstream job reads only those changes and MERGEs them into gold, instead of re-reading the whole table every time.",
    ],
    analogy: {
      text: "Think of the \"track changes\" mode in a document.",
      left: "Track changes", right: "Change Data Feed",
      map: [
        ["Turning track changes on", "enableChangeDataFeed = true"],
        ["Added text in one colour, deleted text in another", "_change_type insert / delete"],
        ["Seeing the old and new wording of an edit", "update_preimage and update_postimage"],
        ["Reviewing only the changes since Monday", "Reading changes from a version onward"],
      ],
      breaks: "track changes only shows edits made after you switched it on. CDF is the same: changes before it was enabled aren't recorded.",
    },
    svg: () => {
      let b = box(14, 20, 140, 50, "silver.customers", "v5 → v6", "acc", { mono: true, size: 12.5, size2: 11 });
      b += arrow(156, 45, 188, 45, { label: "CDF", dy: -8 });
      b += table(190, 20, ["id", "city", "_change_type"], [["7", "Pune", "update_preimage"], ["7", "Delhi", "update_postimage"], ["9", "Goa", "insert"]], { cw: [40, 70, 166], rh: 26, size: 12 });
      b += arrow(328, 128, 328, 158);
      b += box(228, 160, 200, 44, "MERGE into gold", "only 2 keys touched", "good", { size: 13.5, size2: 11 });
      b += t(110, 140, "no full re-scan of", { size: 12, fill: C.dim }) + t(110, 158, "the silver table", { size: 12, fill: C.dim });
      return svg(480, 220, b, "Change data feed rows between two versions feeding a MERGE into gold");
    },
    caption: "One update shows as a before and after row; downstream merges only what changed.",
    oneline: "Change Data Feed lists exactly which rows changed in a table, so the next table only processes those.",
  };

  /* ---------------------------------------------------------------- dbx-delta-schema */
  P["dbx-delta-schema"] = {
    simple: [
      "Many people read a lakehouse table, so Delta guards its shape (its **schema**: column names and types).",
      "**Schema enforcement** is on by default: a write with a wrong type or an unknown column is rejected, not quietly accepted.",
      "**Schema evolution** is opt-in: `ALTER TABLE ... ADD COLUMNS`, or writing with `mergeSchema` when you really mean to add a column.",
      "**Constraints** check values: `NOT NULL` and `CHECK (amount >= 0)` reject bad rows. **Generated columns** are computed from other columns automatically.",
    ],
    analogy: {
      text: "Think of a printed form with boxes.",
      left: "Printed form", right: "Delta schema",
      map: [
        ["Boxes for name, date, amount", "Columns and types"],
        ["Clerk rejects a form with letters in the amount box", "Schema enforcement"],
        ["Printing a new edition with an extra box", "Schema evolution, on purpose"],
        ["\"Amount must not be negative\"", "CHECK constraint"],
        ["The age box filled from the birth date", "Generated column"],
      ],
      breaks: "a clerk can phone you about a mistake. Delta just fails the whole write, so pipelines need to send bad rows somewhere (quarantine) rather than crash every night.",
    },
    svg: () => {
      let b = table(14, 34, ["id INT", "amount DECIMAL", "day DATE"], [["1", "40.00", "2026-11-01"]], { cw: [90, 140, 130], rh: 28, title: "orders schema" });
      [["write with amount = 'abc'", "rejected: type mismatch", "bad"], ["write with new column coupon", "rejected unless mergeSchema", "warn"], ["amount = -5", "rejected by CHECK amount >= 0", "bad"], ["valid row", "committed", "good"]].forEach(([w, r, k], i) => {
        const y = 100 + i * 34;
        b += box(14, y, 210, 28, w, null, "plain", { size: 11.5, bold: false });
        b += arrow(226, y + 14, 246, y + 14);
        b += box(248, y, 218, 28, r, null, k, { size: 11.5 });
      });
      return svg(480, 246, b, "Writes checked against a Delta schema and constraints");
    },
    caption: "Wrong types and surprise columns are refused; constraints catch bad values; good rows commit.",
    oneline: "Delta refuses data that doesn't fit the table's shape or rules, and only changes the shape when you ask.",
  };
})();
