/* Datalith pass 2 — Track 11: Pipelines & orchestration (part 2 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- pipe-ingestion-tools */
  P["pipe-ingestion-tools"] = {
    simple: [
      "**Ingestion** means getting data from sources (apps, SaaS tools like Salesforce, databases, files) into your lake or warehouse.",
      "**Managed connectors** like Fivetran (paid) and Airbyte (open source, with a paid cloud) ship hundreds of ready-made source connectors. They handle paging, API limits and schema changes for you.",
      "For production databases, **CDC** (change data capture) reads the database's change log, so you copy inserts, updates and deletes without heavy queries on the source.",
    ],
    analogy: {
      text: "Think of getting parcels from many shops delivered to your house.",
      left: "Deliveries", right: "Ingestion",
      map: [
        ["Every shop has its own delivery rules", "Every source has its own API"],
        ["A courier service that knows them all", "Fivetran or Airbyte connectors"],
        ["A tracking feed of every change to your order", "CDC from the database log"],
        ["Dropping parcels in the porch first", "Landing raw data before transforming"],
      ],
      breaks: "a courier charges per parcel you can see. Managed connectors often bill by rows changed per month, so a noisy source table that updates every row daily can cost far more than expected.",
    },
    svg: () => {
      let b = t(240, 22, "Many sources, one landing zone", { bold: true, size: 14 });
      [["Salesforce", "SaaS API"], ["PostgreSQL", "CDC from WAL"], ["S3 / GCS files", "CSV, JSON"]].forEach(([a, z], i) => { b += box(16, 40 + i * 58, 130, 46, a, z, "plain", { size2: 11 }); b += arrow(148, 63 + i * 58, 186, 110, { sw: 1.2 }); });
      b += box(190, 84, 120, 52, "connector", "Airbyte / Fivetran", "vio", { size2: 10.5 });
      b += arrow(312, 110, 340, 110);
      b += box(344, 84, 120, 52, "raw layer", "lake / warehouse", "good", { size2: 11 });
      b += t(240, 230, "Connector handles auth, paging, retries and schema drift.", { size: 12, fill: C.dim });
      return svg(480, 246, b, "Sources flowing through a connector into a raw landing layer");
    },
    caption: "A connector pulls from each source in its own way and lands everything raw in one place.",
    oneline: "Ingestion tools copy data from many sources into one raw landing layer, so you don't build each connector yourself.",
  };

  /* ---------------------------------------------------------------- pipe-cdc */
  const CDCM = ["query-based (polling)", "log-based (Debezium)"];
  P["pipe-cdc"] = {
    simple: [
      "**Change Data Capture** (CDC) copies every change made in a database to somewhere else, such as Kafka or a lake, soon after it happens.",
      "**Query-based** CDC asks the table every few minutes for rows with `updated_at` newer than last time. It is simple, but it misses deletes and in-between updates, and it adds load to the source.",
      "**Log-based** CDC, like **Debezium**, reads the database's own transaction log (PostgreSQL's WAL, MySQL's binlog). It sees every insert, update and delete, in order, with almost no load on the tables.",
    ],
    analogy: {
      text: "Think of keeping a copy of a shared notebook up to date.",
      left: "Shared notebook", right: "CDC",
      map: [
        ["Photocopying pages marked \"edited\" every hour", "Query-based polling"],
        ["Torn-out pages don't show as edited", "Deletes are missed"],
        ["Reading the notebook's own change diary line by line", "Log-based CDC"],
        ["Every change, in the order it happened", "Inserts, updates, deletes from the WAL"],
      ],
      breaks: "a diary is kept forever. Database logs are trimmed; if the CDC reader stops for too long, the log it needs may be gone (or, in PostgreSQL, the replication slot holds WAL and fills the disk).",
    },
    svg: () => P["pipe-cdc"]._fig(1),
    _fig: i => {
      const log = i === 1;
      const ev = [["10:00", "INSERT id=7 qty=1"], ["10:02", "UPDATE id=7 qty=3"], ["10:03", "UPDATE id=7 qty=2"], ["10:04", "DELETE id=9"]];
      let b = t(240, 20, CDCM[i] + ": what reaches the target?", { bold: true, size: 13.5 });
      ev.forEach(([tm, e], j) => {
        const y = 36 + j * 38, got = log || j === 2;
        b += t(20, y + 20, tm, { a: "start", size: 12, mono: true, fill: C.dim });
        b += box(70, y, 210, 30, e, null, "plain", { mono: true, size: 11.5 });
        b += arrow(282, y + 15, 306, y + 15, { stroke: got ? C.goodS : C.badS });
        b += box(310, y, 154, 30, got ? (log ? "captured" : "seen at 10:05 poll") : j === 3 ? "missed: row is gone" : "missed: overwritten", null, got ? "good" : "bad", { size: 11.5 });
      });
      b += box(20, 196, 444, 40, log ? "Every change in order, from the transaction log" : "Only the latest state of rows that still exist", null, log ? "good" : "warn", { size: 12.5 });
      return svg(480, 250, b, "Changes captured by query-based versus log-based CDC");
    },
    caption: "Reading the transaction log captures every change, including deletes; polling sees only what is left.",
    ix: el => choice(el, { label: "CDC method", options: CDCM, value: 0 }, i => ({ svg: P["pipe-cdc"]._fig(i), note: i ? "Debezium streams these into Kafka topics, one per table, with before and after values." : "The 10:05 poll finds id 7 with qty 2: the insert and both updates collapse into one row, so their history is lost, and the deleted id 9 leaves nothing to find." })),
    oneline: "CDC copies every database change elsewhere, and reading the database's log is the way that misses nothing.",
  };

  /* ---------------------------------------------------------------- pipe-enterprise-etl */
  P["pipe-enterprise-etl"] = {
    simple: [
      "Large banks, telecoms and insurers often run **enterprise ETL** tools like IBM DataStage or Informatica PowerCenter. You build pipelines by dragging **stages** (read, transform, join, write) onto a canvas and wiring them together.",
      "DataStage **parallel jobs** split the data into partitions and run each stage on many partitions at once, a bit like Spark but inside one tool.",
      "Many companies are now **modernizing**: moving these jobs to cloud tools (Spark, dbt, BigQuery, Snowflake) while keeping the business rules the same.",
    ],
    analogy: {
      text: "Think of a factory assembly line drawn on a whiteboard.",
      left: "Factory", right: "DataStage job",
      map: [
        ["Machines on the line", "Stages: Sequential File, Transformer, Join"],
        ["Conveyor belts between them", "Links carrying rows"],
        ["Several identical lines side by side", "Partitioned parallel execution"],
        ["Moving the factory to a new building", "Migrating jobs to cloud tools"],
      ],
      breaks: "a factory can be rebuilt from its drawing. Old ETL jobs often hide rules in Transformer expressions and job parameters; migration must extract and test those rules, not just redraw the boxes.",
    },
    svg: () => {
      let b = t(240, 22, "A parallel DataStage-style job", { bold: true, size: 14 });
      [["read", "plain"], ["transform", "acc"], ["join", "vio"], ["write", "good"]].forEach(([n, k], i) => {
        const x = 16 + i * 118;
        [0, 1, 2].forEach(p => { b += box(x, 44 + p * 40, 100, 32, n + " p" + p, null, k, { size: 12 }); if (i < 3) b += arrow(x + 102, 60 + p * 40, x + 116, 60 + p * 40, { sw: 1.1 }); });
      });
      b += t(240, 186, "Data is partitioned once; every stage runs on all partitions at once.", { size: 12, fill: C.dim });
      b += box(16, 200, 448, 34, "Modernize: same rules, rebuilt in Spark / dbt / SQL", null, "warn", { size: 12.5 });
      return svg(480, 246, b, "Partitioned parallel stages in an enterprise ETL job");
    },
    caption: "Each stage runs once per partition, side by side; modernization keeps the rules and swaps the engine.",
    oneline: "Enterprise ETL tools build pipelines visually and run each step in parallel; many are now moving to cloud tools.",
  };

  /* ---------------------------------------------------------------- pipe-reverse-etl */
  P["pipe-reverse-etl"] = {
    simple: [
      "Usually data flows **into** the warehouse. **Reverse ETL** sends modelled data back **out** to the tools teams work in: a CRM like Salesforce, ad platforms, support tools or Slack.",
      "For example, a `customer_ltv` table built in the warehouse can be synced every hour into Salesforce, so sales reps see each customer's value on their screen.",
      "Tools like Hightouch and Census do this, or you can write the sync yourself with the target's API.",
    ],
    analogy: {
      text: "Think of a school sending report cards home.",
      left: "School", right: "Reverse ETL",
      map: [
        ["Marks collected from every teacher", "Data loaded into the warehouse"],
        ["Grades worked out by the office", "Models like lifetime value"],
        ["Report cards posted to each parent", "Synced into CRM and ad tools"],
        ["Parents act on it at home", "Teams act inside their own tools"],
      ],
      breaks: "a report card is a one-off letter. A sync runs repeatedly and writes into live business tools, so a bad model can overwrite good CRM fields for thousands of customers in one run.",
    },
    svg: () => {
      let b = t(240, 22, "Data flows back out to where people work", { bold: true, size: 14 });
      b += box(16, 90, 110, 50, "sources", null, "plain");
      b += arrow(128, 115, 160, 115, { label: "ELT" });
      b += box(164, 80, 150, 70, "warehouse", "customer_ltv model", "acc", { mono2: true, size2: 11 });
      [["Salesforce", 40], ["Google Ads", 100], ["Slack", 160]].forEach(([n, y]) => { b += arrow(316, 115, 350, y + 16, { sw: 1.2, stroke: C.goodS }); b += box(354, y, 110, 32, n, null, "good", { size: 12.5 }); });
      b += t(390, 220, "reverse ETL", { size: 12, fill: C.goodT, bold: true });
      return svg(480, 236, b, "Reverse ETL syncing warehouse models to business tools");
    },
    caption: "Normal ELT brings data in; reverse ETL pushes the finished models out to business tools.",
    oneline: "Reverse ETL sends finished warehouse data back into the tools where teams act on it.",
  };

  /* ---------------------------------------------------------------- pipe-dbt-what */
  P["pipe-dbt-what"] = {
    simple: [
      "Before dbt, warehouse SQL often lived in scripts nobody tested and stored procedures nobody could review. **dbt** brought software engineering habits to that SQL.",
      "Your project is a folder of `.sql` model files plus YAML for tests and docs, kept in Git. Changes go through pull requests and **CI** (continuous integration: automatic checks on every change).",
      "This created the **analytics engineer**: someone who models data in SQL with the discipline of a software engineer.",
    ],
    analogy: {
      text: "Think of moving from loose recipe notes to a published cookbook.",
      left: "Cookbook", right: "dbt workflow",
      map: [
        ["Recipes on scraps of paper", "Ad-hoc SQL scripts"],
        ["A bound book with a contents page", "A dbt project in Git"],
        ["A test kitchen trying every recipe", "Tests in CI"],
        ["An editor checking each change", "Pull-request review"],
      ],
      breaks: "a cookbook is printed once. dbt projects change daily, so they need environments: build in a development schema first, and only the production job writes to production tables.",
    },
    svg: () => {
      let b = t(240, 22, "The dbt change loop", { bold: true, size: 14 });
      const S = [["edit model", "in a branch", "plain"], ["dbt build", "dev schema", "acc"], ["pull request", "review + CI", "vio"], ["merge", "prod job runs", "good"]];
      S.forEach(([a, z, k], i) => { const x = 16 + i * 116; b += box(x, 50, 104, 54, a, z, k, { size: 13, size2: 11 }); if (i < 3) b += arrow(x + 106, 77, x + 114, 77, { sw: 1.4 }); });
      b += line(68, 106, 68, 140, { dash: true }); b += line(68, 140, 412, 140, { dash: true }); b += arrow(412, 140, 412, 108, { dash: true });
      b += t(240, 160, "every change follows the same path", { size: 12, fill: C.dim });
      b += t(240, 196, "models/*.sql + schema.yml (tests, docs) in Git", { size: 12.5, mono: true, fill: C.accT });
      return svg(480, 214, b, "dbt development workflow from branch to production");
    },
    caption: "Change in a branch, build in dev, review with CI, then the production job runs the merged code.",
    oneline: "dbt treats warehouse SQL like software: version control, tests, review and separate environments.",
  };

  /* ---------------------------------------------------------------- pipe-dbt-models */
  P["pipe-dbt-models"] = {
    simple: [
      "A dbt **model** is one `SELECT` statement in one file. `{{ source('shop', 'orders') }}` points to a raw table; `{{ ref('stg_orders') }}` points to another model.",
      "dbt reads all the refs and sources, builds a **DAG**, and runs models in dependency order. It also swaps each ref for the right schema, so the same code builds into dev or prod.",
      "A common layout has three layers: **staging** (one cleaned model per source table), **intermediate** (joins and logic), and **marts** (final facts and dimensions people query).",
    ],
    analogy: {
      text: "Think of a juice bar's prep line.",
      left: "Juice bar", right: "dbt layers",
      map: [
        ["Fruit straight off the delivery van", "Sources (raw tables)"],
        ["Washed and peeled fruit, one tray per fruit", "Staging models"],
        ["Blends mixed from several trays", "Intermediate models"],
        ["Cups served at the counter", "Marts"],
        ["\"Use the tray of peeled mango\"", "`ref('stg_mango')`"],
      ],
      breaks: "a juice bar can grab fruit from any tray. If a mart reads a raw source directly instead of its staging model, cleaning rules get skipped and lineage breaks; keep `source()` inside staging.",
    },
    svg: () => {
      let b = t(240, 22, "Sources -> staging -> intermediate -> marts", { bold: true, size: 13.5 });
      const col = (x, items, k, h) => { b += t(x + 50, 48, h, { size: 11.5, fill: C.dim, bold: true }); items.forEach((n, i) => { b += box(x, 58 + i * 46, 100, 34, n, null, k, { mono: true, size: n.length > 14 ? 9.5 : 10.5 }); }); };
      col(10, ["shop.orders", "shop.users", "crm.accounts"], "plain", "sources");
      col(128, ["stg_orders", "stg_users", "stg_accounts"], "acc", "staging");
      col(246, ["int_order_users"], "vio", "intermediate");
      col(364, ["fct_orders", "dim_customer"], "good", "marts");
      [0, 1, 2].forEach(i => { b += arrow(112, 75 + i * 46, 126, 75 + i * 46, { sw: 1.1 }); });
      b += arrow(230, 75, 244, 75, { sw: 1.1 }); b += arrow(230, 121, 244, 81, { sw: 1.1 });
      b += arrow(348, 75, 362, 75, { sw: 1.1 }); b += arrow(230, 167, 362, 127, { sw: 1.1 }); b += arrow(348, 81, 362, 121, { sw: 1.1 });
      b += t(240, 220, "dbt run executes left to right, in parallel where it can", { size: 12, fill: C.dim });
      return svg(480, 236, b, "dbt model layers connected by ref");
    },
    caption: "Sources feed staging models; marts are built from staging and intermediate models through ref().",
    oneline: "dbt models are SELECT files linked by ref(), arranged in staging, intermediate and mart layers.",
  };

  /* ---------------------------------------------------------------- pipe-dbt-materializations */
  const MAT = [["view", "Stores only the SQL. Query cost paid on every read.", "acc"], ["table", "Rebuilds the whole table each run.", "vio"], ["incremental", "Inserts or merges only new rows each run.", "good"], ["ephemeral", "Not built at all: inlined as a CTE into models that ref it.", "ghost"]];
  P["pipe-dbt-materializations"] = {
    simple: [
      "A **materialization** decides how dbt saves a model in the warehouse.",
      "**view** (the default) saves only the query. **table** rebuilds a full table each run. **incremental** adds or merges only new and changed rows, using `is_incremental()` to filter. **ephemeral** creates nothing and is pasted into other models as a CTE (common table expression).",
      "**Snapshots** are a separate feature: they record how rows change over time as a Type 2 slowly changing dimension, with `dbt_valid_from` and `dbt_valid_to` columns.",
    ],
    analogy: {
      text: "Think of ways a bakery can supply bread.",
      left: "Bakery", right: "Materialization",
      map: [
        ["Bake fresh for every customer", "view: computed on each query"],
        ["Bake the whole batch every morning", "table: full rebuild each run"],
        ["Bake only what sold out yesterday", "incremental: only new rows"],
        ["Dough used inside other loaves, never sold alone", "ephemeral: inlined CTE"],
        ["A logbook of each day's recipe changes", "snapshot: history of changes"],
      ],
      breaks: "baking extra loaves never changes old ones. Incremental models can drift from the truth if late data or logic changes slip past the filter; schedule an occasional `--full-refresh`.",
    },
    svg: () => P["pipe-dbt-materializations"]._fig(2),
    _fig: i => {
      const [m, why, k] = MAT[i];
      let b = t(240, 20, "{{ config(materialized='" + m + "') }}", { bold: true, size: 13.5, mono: true });
      b += box(16, 40, 130, 50, "model SQL", "fct_orders.sql", "plain", { mono2: true, size2: 11 });
      b += arrow(148, 65, 196, 65); b += t(172, 36, "dbt run", { size: 10.5, fill: C.dim });
      if (i === 0) b += box(200, 40, 264, 50, "CREATE VIEW fct_orders", "no data stored", k, { mono: true, size: 12 });
      if (i === 1) b += box(200, 40, 264, 50, "CREATE OR REPLACE TABLE", "all 500M rows rewritten", k, { mono: true, size: 12 });
      if (i === 2) { b += box(200, 40, 264, 50, "MERGE INTO fct_orders", "only rows since max(updated_at)", k, { mono: true, size: 12, size2: 11 }); }
      if (i === 3) b += box(200, 40, 264, 50, "nothing created", "WITH fct_orders AS (...) in callers", k, { size: 12, size2: 11 });
      const cost = [["build cost", ["none", "high", "low", "none"][i]], ["read cost", ["high", "low", "low", "in caller"][i]], ["freshness", ["live", "as of run", "as of run", "live"][i]]];
      b += table(60, 120, ["", m], cost, { cw: [150, 210], rh: 28, size: 12.5 });
      b += box(16, 236, 448, 30, why, null, "ghost", { size: 12, bold: false });
      return svg(480, 278, b, "What a dbt materialization builds and what it costs");
    },
    caption: "Each materialization trades build cost against read cost and freshness.",
    ix: el => choice(el, { label: "materialized=", options: MAT.map(x => x[0]), value: 0 }, i => ({ svg: P["pipe-dbt-materializations"]._fig(i), note: ["Good for light staging models.", "Good for marts read often by dashboards.", "Good for big event tables. Needs a <code>unique_key</code> for merges.", "Good for small helper logic you don't want as a visible object."][i] })),
    oneline: "A materialization tells dbt whether to save a model as a view, a table, an incremental table, or not at all.",
  };

  /* ---------------------------------------------------------------- pipe-dbt-tests */
  P["pipe-dbt-tests"] = {
    simple: [
      "dbt **data tests** are queries that look for bad rows. If the query returns any rows, the test fails.",
      "**Generic** tests are one line of YAML: `unique`, `not_null`, `accepted_values`, `relationships` (every foreign key exists). **Singular** tests are your own SQL files. **Unit tests** (dbt 1.8+) check a model's logic against small fixed inputs and expected outputs.",
      "**Source freshness** checks raw data isn't stale, and **model contracts** fail the build if a model's columns or types change unexpectedly.",
    ],
    analogy: {
      text: "Think of checks at a car factory.",
      left: "Car factory", right: "dbt quality",
      map: [
        ["Every car has a unique chassis number", "`unique` test"],
        ["No car leaves without wheels", "`not_null` test"],
        ["Paint is one of five allowed colours", "`accepted_values`"],
        ["Testing the gearbox design on a bench", "Unit test of model logic"],
        ["The spec sheet the dealer was promised", "Model contract"],
      ],
      breaks: "factory checks happen on every car. dbt data tests run when you run them; if the job runs `dbt run` without `dbt test` (or use `dbt build`), bad data ships untested.",
    },
    svg: () => {
      let b = t(240, 22, "A test is a query for bad rows", { bold: true, size: 14 });
      b += box(16, 40, 200, 96, null, null, "plain");
      ["columns:", "  - name: order_id", "    tests: [unique, not_null]", "  - name: status", "    tests: [accepted_values]"].forEach((l, i) => { b += t(26, 58 + i * 17, l, { a: "start", mono: true, size: 10.5 }); });
      b += arrow(218, 88, 244, 88, { label: "compiles" });
      b += box(248, 40, 216, 96, "SELECT order_id", "GROUP BY 1 HAVING count(*) > 1", "vio", { mono: true, mono2: true, size: 12, size2: 10 });
      b += box(16, 156, 216, 40, "0 rows: pass", null, "good", { size: 13 });
      b += box(248, 156, 216, 40, "12 rows: fail, build stops", null, "bad", { size: 13 });
      b += t(240, 222, "dbt build runs each model, then its tests, before anything downstream", { size: 11.5, fill: C.dim });
      return svg(480, 238, b, "A dbt generic test compiled into a query for bad rows");
    },
    caption: "The YAML test becomes a query that returns offending rows; any rows means failure.",
    oneline: "dbt tests are queries that hunt for bad rows, and a single bad row stops the build.",
  };

  /* ---------------------------------------------------------------- pipe-dbt-deploy */
  const DAGM = ["stg_orders", "stg_users", "int_order_users", "fct_orders", "dim_customer"];
  const DOWN = { 0: [0, 2, 3], 1: [1, 2, 3, 4], 2: [2, 3], 3: [3], 4: [4] };
  P["pipe-dbt-deploy"] = {
    simple: [
      "In production dbt runs on a schedule (dbt Cloud, Airflow, Dagster or a cron job) against the production schema, while developers build into their own dev schemas.",
      "**Slim CI** keeps pull-request checks fast: `dbt build --select state:modified+ --defer --state prod-artifacts/` builds only the changed models and everything downstream of them, and reads unchanged parents from production.",
      "**dbt Mesh** splits a large project into several projects that reference each other's public models, so teams can own their parts.",
    ],
    analogy: {
      text: "Think of fixing one floor of a tall building.",
      left: "Building work", right: "Slim CI",
      map: [
        ["Re-checking every floor after any change", "Full CI: build everything"],
        ["Checking the changed floor and floors above it", "`state:modified+`"],
        ["Trusting the floors below as already inspected", "`--defer` to production"],
        ["Separate teams per tower", "dbt Mesh projects"],
      ],
      breaks: "floors above really do rest on the one below. Slim CI only knows code changes; a change in source data or a macro can break models it didn't select.",
    },
    svg: () => P["pipe-dbt-deploy"]._fig(1),
    _fig: ch => {
      const sel = DOWN[ch];
      let b = t(240, 20, "You changed " + DAGM[ch] + ": state:modified+ builds", { bold: true, size: 13 });
      const pos = [[16, 44], [16, 132], [176, 88], [336, 44], [336, 132]];
      const E = [[0, 2], [1, 2], [2, 3], [0, 3], [1, 4]];
      E.forEach(([a, z]) => { const [x1, y1] = pos[a], [x2, y2] = pos[z]; b += arrow(x1 + 128, y1 + 18, x2, y2 + 18, { sw: 1.2 }); });
      DAGM.forEach((n, i) => { const [x, y] = pos[i]; b += box(x, y, 128, 36, n, null, i === ch ? "warn" : sel.includes(i) ? "acc" : "ghost", { mono: true, size: 11.5 }); });
      b += box(16, 196, 448, 36, sel.length + " of 5 models built; the rest are read from prod (--defer)", null, "plain", { size: 12.5 });
      return svg(480, 246, b, "Models selected by state:modified+ in Slim CI");
    },
    caption: "Amber is the changed model, blue is everything downstream of it; grey models come from production.",
    ix: el => choice(el, { label: "Model you changed", options: DAGM, value: 3 }, i => ({ svg: P["pipe-dbt-deploy"]._fig(i), note: i <= 1 ? "A staging change ripples into everything downstream of it." : i === 2 ? "The intermediate model and the mart built on it." : "Leaf models rebuild alone, so CI takes seconds." })),
    oneline: "In production dbt runs on a schedule, and Slim CI tests only the models a change can affect.",
  };

  /* ---------------------------------------------------------------- pipe-orchestrators */
  P["pipe-orchestrators"] = {
    simple: [
      "Airflow thinks in **tasks**: steps to run in order. Newer orchestrators like **Dagster** think in **assets**: the tables and files a pipeline produces.",
      "In Dagster you declare each asset and what it is built from. The tool then knows the lineage, which assets are stale, and what to rebuild when an upstream asset changes. **Prefect** stays task-based but very Pythonic, with dynamic flows.",
      "Pick based on your team: Airflow has the biggest ecosystem and managed versions (Cloud Composer, MWAA); Dagster fits data platforms built around assets and dbt; Prefect fits Python-heavy teams.",
    ],
    analogy: {
      text: "Think of a to-do list versus a pantry list.",
      left: "Household", right: "Orchestration style",
      map: [
        ["\"Buy milk, then bake\": a list of jobs", "Task-centric (Airflow)"],
        ["\"We need bread; bread needs flour and milk\"", "Asset-centric (Dagster)"],
        ["Seeing the milk is out of date", "Knowing an asset is stale"],
        ["Rebaking only what used the old milk", "Rebuilding downstream assets"],
      ],
      breaks: "a pantry list doesn't do the shopping. Asset tools still run tasks underneath; you gain lineage and freshness awareness, but you must still declare each asset's inputs correctly.",
    },
    svg: () => {
      let b = t(240, 22, "Tasks vs assets", { bold: true, size: 14 });
      b += t(120, 50, "task-centric", { bold: true, size: 13, fill: C.warnT });
      ["extract()", "transform()", "load()"].forEach((n, i) => { b += box(50, 60 + i * 50, 140, 34, n, null, "warn", { mono: true, size: 12.5 }); if (i < 2) b += arrow(120, 94 + i * 50, 120, 108 + i * 50); });
      b += t(360, 50, "asset-centric", { bold: true, size: 13, fill: C.accT });
      ["raw_orders", "stg_orders", "daily_revenue"].forEach((n, i) => { b += box(290, 60 + i * 50, 140, 34, n, i === 2 ? "stale" : "fresh", i === 2 ? "bad" : "acc", { mono: true, size: 12, size2: 10 }); if (i < 2) b += arrow(360, 94 + i * 50, 360, 108 + i * 50); });
      b += t(120, 226, "\"did the steps run?\"", { size: 12, fill: C.dim });
      b += t(360, 226, "\"is each table up to date?\"", { size: 12, fill: C.dim });
      return svg(480, 242, b, "Task-centric versus asset-centric orchestration");
    },
    caption: "Task tools track steps; asset tools track the tables those steps produce and whether each is fresh.",
    oneline: "Airflow schedules tasks; asset-based tools like Dagster schedule the tables those tasks produce.",
  };

  /* ---------------------------------------------------------------- pipe-testing */
  P["pipe-testing"] = {
    simple: [
      "Pipelines need tests at three levels. **Unit tests** check one transform function or SQL model on tiny, hand-made input. **Integration tests** run the pipeline end to end on a small sample. **Data tests** check real output every run: counts, nulls, uniqueness, ranges.",
      "Unit and integration tests run before deploy, in CI. Data tests run in production, after each load.",
      "The aim is to catch logic bugs before release and bad data before anyone uses it.",
    ],
    analogy: {
      text: "Think of testing a new bridge.",
      left: "Bridge", right: "Pipeline testing",
      map: [
        ["Testing one bolt in the lab", "Unit test"],
        ["Building a small model bridge and loading it", "Integration test on sample data"],
        ["Sensors on the real bridge every day", "Data tests in production"],
        ["Closing the bridge when a sensor alarms", "Stopping the pipeline on failure"],
      ],
      breaks: "bridge loads are predictable. Real data surprises you with things no fixture had, so production data tests are needed even when every unit test passes.",
    },
    svg: () => {
      let b = t(240, 22, "Where each kind of test runs", { bold: true, size: 14 });
      b += box(16, 40, 210, 30, "before deploy (CI)", null, "acc", { size: 13 });
      b += box(254, 40, 210, 30, "after each load (prod)", null, "vio", { size: 13 });
      b += box(16, 84, 210, 50, "unit tests", "transform logic, tiny fixtures", "plain", { size2: 11 });
      b += box(16, 146, 210, 50, "integration tests", "whole pipeline on a sample", "plain", { size2: 11 });
      b += box(254, 84, 210, 112, "data tests", "nulls, dupes, counts, freshness", "plain", { size2: 11 });
      b += t(240, 226, "Logic bugs caught before release; bad data caught before use.", { size: 12, fill: C.dim });
      return svg(480, 242, b, "Unit and integration tests in CI, data tests in production");
    },
    caption: "Code tests guard the release; data tests guard every run.",
    oneline: "Test transform logic before release and test the real data after every run.",
  };

  /* ---------------------------------------------------------------- pipe-interview-prep */
  P["pipe-interview-prep"] = {
    simple: [
      "This page collects the pipelines and orchestration track for revision.",
      "Expect: ETL vs ELT, DAGs and Airflow internals, idempotency and backfills, incremental loads and CDC, dbt models and materializations, testing and monitoring.",
      "Design questions often hide one trap: \"what happens when this runs twice?\" Have an idempotent answer ready.",
    ],
    analogy: {
      text: "Think of a pilot's pre-flight checklist.",
      left: "Pre-flight", right: "Pipeline design answer",
      map: [
        ["Where are we flying, and when?", "Sources, targets, schedule"],
        ["What if an engine fails?", "Retries, alerts, idempotent re-runs"],
        ["Fuel for a diversion", "Backfill and late-data plan"],
        ["Instruments to watch", "Freshness, volume, quality checks"],
      ],
      breaks: "pilots follow the same checklist each flight. Interviewers change the scenario mid-answer (\"now the source sends deletes\"), so practise adapting, not reciting.",
    },
    svg: () => {
      let b = t(240, 22, "Answer shape for a pipeline design question", { bold: true, size: 13.5 });
      [["1", "sources and SLA", "acc"], ["2", "ingest: batch, CDC or stream", "vio"], ["3", "transform: dbt layers", "warn"], ["4", "orchestrate: DAG, retries", "plain"], ["5", "re-run safely + monitor", "good"]].forEach(([n, s, k], i) => { const y = 38 + i * 42; b += badge(36, y + 17, n, k === "plain" ? "acc" : k); b += box(58, y, 406, 34, s, null, k, { size: 13 }); });
      return svg(480, 258, b, "Five-step answer structure for pipeline design questions");
    },
    caption: "Walk the pipeline from source to monitoring, and say how each step survives a re-run.",
    oneline: "Know how data gets in, gets transformed, runs on schedule, survives re-runs and is watched.",
  };
})();
