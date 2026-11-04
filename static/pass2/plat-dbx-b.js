/* Datalith pass 2 — Track 16: Databricks (part b: streaming, Unity Catalog, operations, 2026 features). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- dbx-ss-model */
  const MODES = [
    ["append", [["10:00", "5"]], "Only rows that are final get written, once. With a watermark, a window is written after it closes."],
    ["update", [["10:00", "5"], ["10:05", "3"]], "Only rows that changed in this micro-batch are written: the 10:05 window, still open, shows its new count."],
    ["complete", [["10:00", "5"], ["10:05", "3"], ["10:10", "1"]], "The whole result table is rewritten every batch. Fine for small aggregates, too costly for big ones."],
  ];
  const modeFig = (i) => {
    let b = t(74, 24, "input stream", { bold: true, size: 13 });
    for (let r = 0; r < 6; r++) b += box(14, 34 + r * 24, 120, 20, "event " + (r + 1), null, r >= 4 ? "acc" : "plain", { size: 11, bold: false });
    b += t(74, 194, "new in this batch", { size: 11, fill: C.accT });
    b += arrow(136, 100, 172, 100);
    b += table(176, 40, ["window", "count"], [["10:00", "5"], ["10:05", "3"], ["10:10", "1"]], { cw: [80, 60], rh: 28, title: "result table" });
    b += arrow(318, 90, 346, 90);
    b += table(350, 40, ["window", "count"], MODES[i][1], { cw: [70, 46], rh: 28, title: "sink: " + MODES[i][0], hl: Object.fromEntries(MODES[i][1].map((_, j) => [j, "good"])) });
    return b;
  };
  P["dbx-ss-model"] = {
    simple: [
      "Structured Streaming treats a stream as a table that never stops growing: new rows keep being added at the bottom.",
      "You write a normal query against it. Spark runs that query again on each new chunk of rows (a **micro-batch**), working only on what's new.",
      "A **trigger** sets the pace: every few seconds, as fast as possible, or `availableNow` to process what's there and stop.",
      "The **output mode** says what is written each time: **append** (only finished rows), **update** (only rows that changed) or **complete** (the whole result).",
    ],
    analogy: {
      text: "Think of a scoreboard at a long cricket match.",
      left: "Cricket scoreboard", right: "Streaming model",
      map: [
        ["Balls bowled, one after another, all day", "Rows added to an unbounded table"],
        ["Updating the board after each over", "A micro-batch"],
        ["How often the scorer updates", "The trigger"],
        ["Posting only completed innings", "append mode"],
        ["Changing only the numbers that moved", "update mode"],
        ["Repainting the whole board", "complete mode"],
      ],
      breaks: "a scorer can change any number at any time. In append mode Spark can never change a row it already wrote, which is why it waits for a watermark before writing windows.",
    },
    svg: () => svg(480, 208, modeFig(1), "Streaming result table and what update mode writes"),
    caption: "The query keeps a result table; the output mode decides which of its rows reach the sink.",
    ix: el => choice(el, { label: "Output mode", options: MODES.map(m => m[0]), value: 0 }, i => ({ svg: svg(480, 208, modeFig(i), "Output mode effect"), note: MODES[i][2] })),
    oneline: "A stream is a table that keeps growing, and Spark keeps re-running your query on the new rows.",
  };

  /* ---------------------------------------------------------------- dbx-ss-sources-sinks */
  P["dbx-ss-sources-sinks"] = {
    simple: [
      "A stream that crashes must restart without losing or doubling data. Three parts make that work.",
      "A **replayable source**, like Kafka or Auto Loader, can be read again from a known position.",
      "A **checkpoint** folder stores which positions (offsets) each micro-batch used, plus any state, in a write-ahead log.",
      "An **idempotent or transactional sink**, like Delta, writes each batch exactly once even if it's retried. Together these give **exactly-once** results.",
    ],
    analogy: {
      text: "Think of reading a long book over many evenings.",
      left: "Reading a book", right: "Exactly-once streaming",
      map: [
        ["A book you can reopen at any page", "Replayable source (offsets)"],
        ["Your bookmark, written in pen", "Checkpoint with committed offsets"],
        ["Notes you'd made about the plot so far", "Operator state in the checkpoint"],
        ["A diary that ignores a page you already wrote", "Idempotent sink: a retried batch isn't written twice"],
      ],
      breaks: "you can always find your bookmark. If you change the query in an incompatible way, or delete the checkpoint, the stream can't resume safely and must start again.",
    },
    svg: () => {
      let b = box(10, 40, 120, 60, "Source", "Kafka offsets", "plain", { size: 14, size2: 11 });
      b += arrow(132, 70, 172, 70, { label: "batch 57", dy: -8 });
      b += box(174, 40, 132, 60, "Query", "transform + state", "acc", { size: 14, size2: 11 });
      b += arrow(308, 70, 348, 70);
      b += box(350, 40, 120, 60, "Delta sink", "txn id = batch 57", "good", { size: 14, size2: 10.5 });
      b += box(140, 140, 200, 54, "Checkpoint", "offsets + state + commits", "warn", { size: 14, size2: 11 });
      b += arrow(220, 102, 220, 138, { stroke: C.warnS, dash: true }) + arrow(260, 138, 260, 102, { stroke: C.warnS, dash: true });
      b += t(240, 222, "crash → restart → read checkpoint → redo batch 57 → sink skips if already committed", { size: 11, fill: C.dim });
      return svg(480, 236, b, "Replayable source, checkpoint and transactional sink giving exactly-once");
    },
    caption: "Offsets say where to restart; the sink's transaction id stops a retried batch being written twice.",
    oneline: "Replayable sources, a checkpoint bookmark and a careful sink together make a stream process every row exactly once.",
  };

  /* ---------------------------------------------------------------- dbx-ss-watermark */
  const wmFig = (wm) => {
    const maxSeen = 30, cutoff = maxSeen - wm, late = [12, 18, 24, 28];
    let b = t(240, 20, `latest event time seen: 10:${maxSeen} · watermark ${wm} min → cutoff 10:${String(cutoff).padStart(2, "0")}`, { bold: true, size: 12.5 });
    b += line(20, 80, 460, 80, { sw: 2 });
    for (let m = 0; m <= 30; m += 5) { const x = 20 + m * 14.6; b += line(x, 74, x, 86) + t(x, 102, "10:" + String(m).padStart(2, "0"), { size: 11, fill: C.dim }); }
    const cx = 20 + cutoff * 14.6;
    b += `<rect x="20" y="40" width="${cx - 20}" height="26" style="fill:${C.bad}"/>` + `<rect x="${cx}" y="40" width="${460 - cx}" height="26" style="fill:${C.good}"/>`;
    b += t(Math.max(70, (20 + cx) / 2), 58, cutoff > 3 ? "closed: late rows dropped" : "", { size: 11, fill: C.badT });
    if (460 - cx >= 70) b += t((cx + 460) / 2, 58, "still open", { size: 11.5, fill: C.goodT, bold: true });
    let kept = 0;
    late.forEach((m, i) => {
      const x = 20 + m * 14.6, ok = m >= cutoff; if (ok) kept++;
      b += `<circle cx="${x}" cy="${130 + i * 0}" r="8" style="fill:${ok ? C.goodS : C.badS}"/>` + t(x, 156, "10:" + m, { size: 11, fill: ok ? C.goodT : C.badT, bold: true });
    });
    b += t(20, 134, "late arrivals:", { size: 11.5, fill: C.dim, a: "start" });
    b += box(20, 172, 440, 36, `${kept} of 4 late events counted · state kept for ${wm} min of windows`, null, kept === 4 ? "warn" : "acc", { size: 13 });
    return { b, kept };
  };
  P["dbx-ss-watermark"] = {
    simple: [
      "Events often arrive late: a phone was offline, a network was slow. So count events by **event time** (the time written in the event), not by when they arrived.",
      "A **window** groups events into time buckets, for example every 5 minutes.",
      "A **watermark** says how long to wait for stragglers: `withWatermark('event_ts', '10 minutes')`. Spark tracks the latest event time it has seen. Windows older than that minus 10 minutes are finished; their state is dropped, and events later than that may be dropped.",
      "A longer watermark catches more late data but keeps more state in memory and delays results.",
    ],
    analogy: {
      text: "Think of a teacher collecting homework.",
      left: "Homework", right: "Watermark",
      map: [
        ["The date written on the homework", "Event time"],
        ["When it lands on the desk", "Processing (arrival) time"],
        ["Grouping by the week it was set", "A time window"],
        ["\"I'll accept late work up to two days\"", "The watermark delay"],
        ["After that, the week's marks are final", "Window finalized, state dropped"],
      ],
      breaks: "a teacher's deadline is by the calendar. Spark's clock is the latest event time it has seen, so if events stop arriving, the watermark stops moving and windows stay open.",
    },
    svg: () => svg(480, 222, wmFig(10).b, "Watermark of 10 minutes: events before 10:20 are too late"),
    caption: "Latest event 10:30, watermark 10 minutes: windows before 10:20 are closed, so the 10:12 and 10:18 stragglers miss.",
    ix: el => slider(el, { label: "Watermark delay", min: 0, max: 25, step: 1, value: 2, fmt: v => v + " min" }, v => {
      const r = wmFig(v);
      return { svg: svg(480, 222, r.b, "Watermark effect on late events"), note: `${r.kept} of 4 late events land in a window. A longer delay catches more stragglers but keeps more windows in state and delays final results in append mode.` };
    }),
    oneline: "A watermark tells a stream how long to wait for late events before it closes a time window for good.",
  };

  /* ---------------------------------------------------------------- dbx-ss-stateful */
  P["dbx-ss-stateful"] = {
    simple: [
      "Some streaming steps need memory across batches: running totals, joining two streams, or removing duplicates.",
      "That memory is the **state store** (RocksDB on Databricks), saved in the checkpoint so it survives restarts.",
      "Without limits, state grows forever. A **watermark** lets Spark throw away state that can no longer change, for example old windows or old keys seen for de-duplication.",
      "Watch the state size in the streaming metrics: it's the usual reason a stream slows down or runs out of memory.",
    ],
    analogy: {
      text: "Think of a cloakroom at a concert.",
      left: "Cloakroom", right: "State store",
      map: [
        ["Coats held between arrival and leaving", "State held between micro-batches"],
        ["Matching a ticket to its coat", "Stream-stream join buffers"],
        ["\"This ticket was already used\"", "De-duplication keys"],
        ["Clearing unclaimed coats after closing time", "Watermark-based state cleanup"],
        ["A logbook in case the attendant changes", "Checkpointed state"],
      ],
      breaks: "a cloakroom has a fixed number of hooks. State has no fixed limit until memory runs out, so a missing watermark shows up weeks later as a crash.",
    },
    svg: () => {
      let b = box(14, 30, 120, 50, "batch n", "new rows", "plain", { size: 14 });
      b += arrow(136, 55, 176, 55);
      b += box(178, 20, 140, 70, "Stateful op", "agg · join · dedup", "acc", { size: 14, size2: 11 });
      b += arrow(320, 55, 360, 55);
      b += box(362, 30, 104, 50, "output", null, "good", { size: 14 });
      b += box(178, 120, 140, 56, "State store", "RocksDB, per key", "warn", { size: 14, size2: 11 });
      b += arrow(228, 92, 228, 118, { stroke: C.warnS }) + arrow(268, 118, 268, 92, { stroke: C.warnS });
      b += arrow(320, 148, 400, 148, { stroke: C.badS, label: "evict older than watermark", dy: 18, size: 11 });
      b += box(402, 130, 64, 36, "gone", null, "bad", { size: 12 });
      b += arrow(248, 178, 248, 198, { dash: true });
      b += t(248, 214, "saved in the checkpoint", { size: 12, fill: C.dim });
      return svg(480, 226, b, "Stateful streaming operator reading and writing a state store with watermark eviction");
    },
    caption: "Each batch reads and updates state; the watermark evicts what can no longer change.",
    oneline: "Stateful streams keep a memory between batches, and watermarks stop that memory from growing forever.",
  };

  /* ---------------------------------------------------------------- dbx-autoloader */
  P["dbx-autoloader"] = {
    simple: [
      "**Auto Loader** loads new files from cloud storage into Delta, each file exactly once, without you tracking which ones you've seen.",
      "It's a streaming source called `cloudFiles`. It finds new files either by listing the folder or by **file notifications** from the cloud (better for millions of files).",
      "It records loaded files in its checkpoint, so a restart doesn't reload them.",
      "It can **infer the schema** and **evolve** it when new columns appear, keeping unexpected values in a `_rescued_data` column instead of failing.",
    ],
    analogy: {
      text: "Think of a mailroom that logs every parcel.",
      left: "Mailroom", right: "Auto Loader",
      map: [
        ["Parcels arriving all day", "New files landing in a bucket"],
        ["Walking the shelves to spot new parcels", "Directory listing mode"],
        ["The courier texts you on each delivery", "File notification mode"],
        ["The logbook of parcels already signed for", "Checkpoint: each file loaded once"],
        ["A tray for parcels with odd labels", "_rescued_data for unexpected fields"],
      ],
      breaks: "a mailroom sees each parcel arrive. If a file is overwritten in place with the same name, Auto Loader may not treat it as new; write new files instead of rewriting old ones.",
    },
    svg: () => {
      let b = box(14, 30, 130, 120, null, null, "plain") + t(79, 50, "s3://raw/events/", { size: 11, mono: true, bold: true });
      ["f1.json (done)", "f2.json (done)", "f3.json NEW", "f4.json NEW"].forEach((f, i) => { b += box(22, 60 + i * 21, 114, 18, f, null, i > 1 ? "acc" : "ghost", { size: 9.5, mono: true, bold: false }); });
      b += arrow(146, 90, 186, 90);
      b += box(188, 56, 130, 68, "cloudFiles", "schema infer + evolve", "vio", { mono: true, size: 14, size2: 10.5 });
      b += arrow(320, 90, 356, 90);
      b += box(358, 64, 108, 52, "bronze", "Delta", "good", { size: 14 });
      b += box(188, 150, 130, 40, "checkpoint", null, "warn", { size: 13 });
      b += arrow(253, 126, 253, 148, { stroke: C.warnS, dash: true });
      b += t(253, 214, "remembers f1, f2: only f3, f4 load", { size: 12, fill: C.dim });
      return svg(480, 228, b, "Auto Loader reading only new files from a bucket into a bronze Delta table");
    },
    caption: "Only the files not yet in the checkpoint are loaded.",
    oneline: "Auto Loader notices new files in storage and loads each one exactly once.",
  };

  /* ---------------------------------------------------------------- dbx-dlt */
  P["dbx-dlt"] = {
    simple: [
      "**Lakeflow Spark Declarative Pipelines** (formerly Delta Live Tables, or DLT) let you declare tables instead of writing the steps to build them.",
      "In Python: `from pyspark import pipelines as dp`, then `@dp.table` for a streaming table and `@dp.materialized_view` for a materialized view, each a function returning a DataFrame.",
      "**Expectations** are quality rules like `@dp.expect_or_drop('valid_id', 'id IS NOT NULL')`.",
      "The platform reads your declarations, works out which table depends on which, and handles order, incremental processing, retries and monitoring.",
    ],
    analogy: {
      text: "Think of a recipe card versus cooking by instructions.",
      left: "Cooking", right: "Declarative pipelines",
      map: [
        ["\"A cake made of sponge and icing\"", "Declare tables from other tables"],
        ["The kitchen works out to bake before icing", "The platform builds the dependency graph"],
        ["\"No eggs past their date\"", "Expectations (quality rules)"],
        ["Only bake new sponge when new flour arrives", "Incremental processing"],
        ["The kitchen log of what was made and binned", "Pipeline event log and metrics"],
      ],
      breaks: "a kitchen can improvise. Declarative pipelines want each table defined once by one function; hand-written side effects inside those functions don't fit the model.",
    },
    svg: () => {
      let b = box(14, 14, 452, 70, null, null, "plain");
      ["@dp.table", "def bronze(): return spark.readStream.table('raw')", "@dp.materialized_view  @dp.expect_or_drop('id', 'id IS NOT NULL')"].forEach((l, i) => { b += t(24, 34 + i * 18, l, { size: 11, mono: true, a: "start" }); });
      b += t(240, 104, "the platform builds this graph:", { size: 12, fill: C.dim });
      [["bronze", "streaming table", "warn"], ["silver", "expectations", "acc"], ["gold", "materialized view", "good"]].forEach(([n, s, k], i) => {
        b += box(14 + i * 156, 116, 140, 50, n, s, k, { size: 14, size2: 11 });
        if (i < 2) b += arrow(156 + i * 156, 141, 168 + i * 156, 141);
      });
      b += box(14, 186, 452, 40, "handled for you: order · incremental · retries · data-quality metrics", null, "vio", { size: 12.5 });
      return svg(480, 240, b, "Declared tables turned into a bronze, silver, gold dependency graph");
    },
    caption: "You declare tables and rules; the platform infers the graph and runs it.",
    oneline: "Declarative pipelines let you describe the tables you want and leave the running order and upkeep to Databricks.",
  };

  /* ---------------------------------------------------------------- dbx-uc-model */
  P["dbx-uc-model"] = {
    simple: [
      "Unity Catalog has one **metastore** per cloud region, shared by many workspaces, so the same rules apply everywhere.",
      "Inside it: **catalogs**, then **schemas**, then objects, named `catalog.schema.object`.",
      "Objects include **tables** (managed, where UC controls the files, or external, where files sit at a path you own), **views**, **volumes** for non-table files, **functions** and **models**.",
      "Dropping a managed table removes its data; dropping an external table leaves the files.",
    ],
    analogy: {
      text: "Think of a company's shared file drive.",
      left: "Shared drive", right: "Unity Catalog",
      map: [
        ["The company drive for one country office", "A metastore per region"],
        ["Top folders per department", "Catalogs"],
        ["Project folders", "Schemas"],
        ["Spreadsheets the drive manages", "Managed tables"],
        ["Shortcuts to files on someone's own disk", "External tables"],
        ["A folder of PDFs and images", "Volumes"],
      ],
      breaks: "deleting a shortcut never deletes the file, but deleting a drive file does. UC is the same: DROP on a managed table deletes data, DROP on an external table doesn't.",
    },
    svg: () => {
      let b = box(140, 10, 200, 36, "Metastore (region)", null, "acc", { size: 13.5 });
      b += box(40, 70, 160, 36, "catalog: prod", null, "vio", { size: 13 }) + box(280, 70, 160, 36, "catalog: dev", null, "vio", { size: 13 });
      b += arrow(200, 48, 140, 68) + arrow(280, 48, 340, 68);
      b += box(40, 128, 160, 36, "schema: sales", null, "warn", { size: 13 });
      b += arrow(120, 108, 120, 126);
      [["managed table", "UC owns files", "good"], ["external table", "your path", "plain"], ["volume", "files, PDFs", "plain"]].forEach(([n, s, k], i) => {
        b += box(10 + i * 158, 190, 146, 48, n, s, k, { size: 13, size2: 11 });
        b += arrow(120, 166, 83 + i * 158, 188, { stroke: C.faint });
      });
      return svg(480, 250, b, "Unity Catalog object model from metastore to tables and volumes");
    },
    caption: "One metastore per region; objects live three levels down.",
    oneline: "Unity Catalog organises everything as catalog, schema and object under one regional metastore.",
  };

  /* ---------------------------------------------------------------- dbx-uc-access */
  P["dbx-uc-access"] = {
    simple: [
      "Unity Catalog access uses SQL: `GRANT SELECT ON TABLE prod.sales.orders TO analysts`.",
      "Grants flow downward. `SELECT` granted on a schema covers every table in it, including future ones.",
      "To reach an object you also need `USE CATALOG` and `USE SCHEMA` on the containers above it. These let you step inside but don't let you read data on their own.",
      "Grant to **groups**, not people. Every object has one **owner** with full control.",
    ],
    analogy: {
      text: "Think of keys in an apartment block.",
      left: "Apartment block", right: "UC grants",
      map: [
        ["Front-door key", "USE CATALOG"],
        ["Floor key", "USE SCHEMA"],
        ["Flat key", "SELECT on a table"],
        ["A master key for the whole floor", "SELECT on the schema (inherited)"],
        ["Keys given to the cleaning company, not each cleaner", "Grant to groups"],
      ],
      breaks: "a flat key alone opens a flat if you're already inside. In UC, SELECT without USE CATALOG and USE SCHEMA fails, which is the most common \"I have SELECT but get denied\" puzzle.",
    },
    svg: () => {
      let b = "";
      [["USE CATALOG prod", 14], ["USE SCHEMA prod.sales", 172], ["SELECT ...orders", 330]].forEach(([n, x], i) => {
        b += box(x, 30, 136, 44, n, null, "acc", { mono: true, size: 10 });
        if (i < 2) b += arrow(x + 138, 52, x + 156, 52);
      });
      b += t(240, 100, "group analysts holds all three → query works", { size: 12.5, fill: C.goodT, bold: true });
      b += box(14, 118, 136, 44, "USE CATALOG prod", null, "acc", { mono: true, size: 10 });
      b += box(172, 118, 136, 44, "(missing)", null, "bad", { size: 12.5, dash: true });
      b += box(330, 118, 136, 44, "SELECT ...orders", null, "acc", { mono: true, size: 10 });
      b += arrow(152, 140, 170, 140, { stroke: C.badS }) + arrow(310, 140, 328, 140, { stroke: C.badS });
      b += t(240, 188, "no USE SCHEMA → PERMISSION_DENIED, despite SELECT", { size: 12.5, fill: C.badT, bold: true });
      b += t(240, 214, "SELECT on a schema is inherited by every table in it.", { size: 12, fill: C.dim });
      return svg(480, 230, b, "Unity Catalog grant chain with and without USE SCHEMA");
    },
    caption: "Reading a table needs the whole chain: catalog, schema, then the table privilege.",
    oneline: "In Unity Catalog you need a key for every door on the way to a table, not just the table's own key.",
  };

  /* ---------------------------------------------------------------- dbx-uc-data-objects */
  P["dbx-uc-data-objects"] = {
    simple: [
      "Unity Catalog also controls how Databricks reaches your cloud storage, so nobody handles raw keys.",
      "A **storage credential** wraps a cloud identity: an AWS IAM role, an Azure managed identity or a Google Cloud service account. Admins create it.",
      "An **external location** pairs a credential with a storage path, like `gs://lake/raw/`. You grant users rights on the location, not on the credential.",
      "A **volume** governs non-table files (CSV drops, images, PDFs) at paths like `/Volumes/catalog/schema/volume/`.",
    ],
    analogy: {
      text: "Think of a company car pool.",
      left: "Car pool", right: "UC storage objects",
      map: [
        ["The car keys, kept by the fleet manager", "Storage credential (cloud identity)"],
        ["\"This car may only drive to the depot\"", "External location (credential + path)"],
        ["Staff book the trip, never touch the keys", "Users get grants on the location"],
        ["A lockable boot for parcels", "A volume for files"],
      ],
      breaks: "a car can drive anywhere once you have it. An external location limits access to its path, and UC checks every read and write against it.",
    },
    svg: () => {
      let b = box(14, 20, 140, 56, "Storage credential", "GCP service account", "warn", { size: 13, size2: 10.5 });
      b += arrow(156, 48, 180, 48);
      b += box(182, 20, 150, 56, "External location", "gs://lake/raw/", "acc", { size: 13, size2: 11, mono2: true });
      b += arrow(334, 48, 358, 48);
      b += box(360, 20, 106, 56, "Bucket path", null, "good", { size: 13 });
      b += box(182, 110, 150, 44, "GRANT READ FILES", "to data_engineers", "plain", { mono: true, size: 11.5, size2: 11 });
      b += arrow(257, 108, 257, 78, { stroke: C.faint });
      b += box(14, 180, 452, 40, "/Volumes/prod/raw/landing/  ← governed files (volume)", null, "vio", { mono: true, size: 11.5, bold: false });
      b += t(84, 102, "admins only", { size: 11.5, fill: C.dim });
      return svg(480, 234, b, "Storage credential, external location, grant and volume in Unity Catalog");
    },
    caption: "The credential stays with admins; users get rights on governed paths and volumes.",
    oneline: "Unity Catalog holds the cloud keys itself and lets people use storage only through governed paths.",
  };

  /* ---------------------------------------------------------------- dbx-uc-governance */
  P["dbx-uc-governance"] = {
    simple: [
      "Once data lives in Unity Catalog, some governance comes for free.",
      "**Lineage** is captured automatically, down to columns, for queries, notebooks, jobs and dashboards. Before changing a column you can see everything that uses it.",
      "An **audit log** records who did what. **Tags** and comments label data (for example `pii`), and you can search them.",
      "All of this is queryable in `system` tables, such as `system.access.audit` and the lineage tables.",
    ],
    analogy: {
      text: "Think of a parcel tracking service.",
      left: "Parcel tracking", right: "UC governance",
      map: [
        ["Every hand-off scanned automatically", "Automatic lineage"],
        ["\"Which parcels went through this depot?\"", "Impact analysis on a column"],
        ["Signature on every delivery", "Audit log"],
        ["FRAGILE stickers", "Tags like pii"],
        ["The tracking database you can search", "System tables"],
      ],
      breaks: "every parcel passes a scanner. Lineage only covers work that runs through Unity Catalog; a script that copies files outside it leaves a gap.",
    },
    svg: () => {
      let b = "";
      [["bronze.orders", "plain"], ["silver.orders", "acc"], ["gold.revenue", "good"], ["Sales dashboard", "vio"]].forEach(([n, k], i) => {
        const x = 8 + i * 118;
        b += box(x, 30, 106, 40, n, null, k, { size: 11.5, mono: i < 3 });
        if (i < 3) b += arrow(x + 108, 50, x + 116, 50);
      });
      b += t(240, 98, "column lineage: gold.revenue.amount ← silver.orders.price × qty", { size: 11.5, fill: C.accT, mono: true });
      b += box(14, 120, 140, 50, "Audit log", "who read / changed", "plain", { size: 13.5, size2: 11 });
      b += box(170, 120, 140, 50, "Tags", "pii · finance", "warn", { size: 13.5, size2: 11 });
      b += box(326, 120, 140, 50, "System tables", "query it all", "acc", { size: 13.5, size2: 11 });
      b += t(240, 200, "Captured without extra code, for work run through UC.", { size: 12.5, fill: C.dim });
      return svg(480, 216, b, "Automatic lineage from bronze to a dashboard plus audit, tags and system tables");
    },
    caption: "Lineage is recorded as work runs; audit, tags and system tables make it searchable.",
    oneline: "Unity Catalog records where data came from and who used it, without you writing extra code.",
  };

  /* ---------------------------------------------------------------- dbx-uc-fgac */
  const FG = [["analyst_in", ["IN"], false], ["analyst_us", ["US"], false], ["admins", ["IN", "US", "UK"], true]];
  const fgRows = [["1", "IN", "ria@x.in"], ["2", "US", "om@x.com"], ["3", "UK", "eli@x.uk"], ["4", "IN", "jay@x.in"]];
  const fgFig = (i) => {
    const [g, regions, full] = FG[i];
    const vis = fgRows.filter(r => regions.includes(r[1])).map(r => [r[0], r[1], full ? r[2] : "****@" + r[2].split("@")[1]]);
    let b = box(14, 14, 200, 44, "is_account_group_member", g, "vio", { mono: true, size: 11, size2: 12.5 });
    b += box(230, 14, 116, 44, "row filter", "region", "acc", { size: 13, size2: 11 }) + box(352, 14, 114, 44, "column mask", "email", "warn", { size: 13, size2: 11 });
    b += table(14, 84, ["id", "region", "email"], vis, { cw: [60, 100, 292], rh: 28 });
    b += t(240, 84 + 28 * (vis.length + 1) + 22, `${vis.length} of 4 rows · emails ${full ? "in full" : "masked"}`, { size: 12.5, bold: true, fill: C.goodT });
    return b;
  };
  P["dbx-uc-fgac"] = {
    simple: [
      "Often different people need different slices of the same table: a regional analyst sees only their region, and most people mustn't see emails.",
      "A **row filter** is a SQL function that returns true or false per row. Attached to a table, it runs on every query.",
      "A **column mask** is a function that returns the real value or a masked one, depending on who's asking, often using `is_account_group_member('admins')`.",
      "There's still one table, no copies per audience. **Dynamic views** are the older way to do the same thing.",
    ],
    analogy: {
      text: "Think of a school results board viewed through different glasses.",
      left: "Results board", right: "Row filters and masks",
      map: [
        ["One board for the whole school", "One table"],
        ["Glasses that only show your own class", "Row filter"],
        ["Glasses that blur phone numbers", "Column mask"],
        ["Teachers' glasses show everything", "admins group sees all"],
        ["No second board for each class", "No copies per audience"],
      ],
      breaks: "glasses are worn by choice. Filters and masks are attached to the table, so every query, notebook and dashboard gets them, whatever tool is used.",
    },
    svg: () => svg(480, 254, fgFig(0), "Row filter and column mask applied for the analyst_in group"),
    caption: "analyst_in sees only Indian rows, with emails masked, from the same table.",
    ix: el => choice(el, { label: "Query as group", options: FG.map(f => f[0]), value: 1 }, i => ({ svg: svg(480, 254, fgFig(i), "Rows and masking by group"), note: i === 2 ? "Admins pass both functions untouched: every row, full emails." : "The row filter keeps only this group's region; the column mask hides the email name part. Same <code>SELECT *</code>." })),
    oneline: "Row filters and column masks let one table show each group only the rows and values it's allowed to see.",
  };

  /* ---------------------------------------------------------------- dbx-uc-sharing */
  P["dbx-uc-sharing"] = {
    simple: [
      "Sharing data with another company used to mean exporting files that went stale.",
      "**Delta Sharing** is an open protocol for sharing live tables in place. The provider creates a **share**; the **recipient** reads the data straight from cloud storage using short-lived signed links.",
      "The recipient doesn't need Databricks: pandas, Spark, Power BI and other clients that speak the protocol can read it.",
      "It also powers the **Databricks Marketplace** and **clean rooms**, where parties combine data without seeing each other's raw rows.",
    ],
    analogy: {
      text: "Think of sharing a folder link with a time-limited pass.",
      left: "Shared folder", right: "Delta Sharing",
      map: [
        ["You keep the folder in your drive", "Data stays in the provider's storage"],
        ["Send a link instead of attachments", "Share and recipient, no copy"],
        ["The link expires after a while", "Short-lived signed URLs"],
        ["Anyone can open it with a normal app", "Open protocol: any client"],
        ["A shop window of shared folders", "Marketplace listings"],
      ],
      breaks: "a folder link shows whatever is in the folder. A share only exposes the tables, partitions or views you added, governed by Unity Catalog on the provider side.",
    },
    svg: () => {
      let b = box(14, 30, 150, 50, "Provider (UC)", "share: sales_feed", "acc", { size: 14, size2: 11 });
      b += box(14, 120, 150, 50, "Cloud storage", "Delta files", "good", { size: 14, size2: 11 });
      b += arrow(89, 82, 89, 118, { stroke: C.faint });
      b += box(316, 30, 150, 50, "Recipient", "pandas / Spark / BI", "vio", { size: 14, size2: 11 });
      b += arrow(314, 50, 166, 50, { label: "1. ask (token)", dy: -8 });
      b += arrow(166, 66, 314, 66, { label: "2. signed URLs", dy: 16, stroke: C.accS });
      b += arrow(390, 82, 168, 140, { stroke: C.vioS }) + t(330, 140, "3. read files directly", { size: 12.5, fill: C.vioT, a: "start" });
      b += t(240, 214, "Live data, no copy; recipient needn't use Databricks.", { size: 12.5, fill: C.dim });
      return svg(480, 228, b, "Delta Sharing flow: recipient asks, gets signed URLs, reads storage directly");
    },
    caption: "The provider hands out temporary links; the recipient reads the files itself.",
    oneline: "Delta Sharing gives another organisation live read access to your tables without copying them.",
  };

  /* ---------------------------------------------------------------- dbx-compute */
  P["dbx-compute"] = {
    simple: [
      "A Databricks cluster is one **driver** plus many **workers**. The driver plans and hands out tasks; the workers' executors do the work on data partitions.",
      "**Job clusters** start for one job and end with it. **All-purpose clusters** are for interactive notebooks. **Serverless** compute starts quickly and is managed for you.",
      "**Autoscaling** adds and removes workers with load. **Auto-termination** stops an idle cluster. **Photon** speeds up SQL and DataFrame work.",
      "Which type you pick is one of the biggest cost levers.",
    ],
    analogy: {
      text: "Think of a restaurant kitchen.",
      left: "Kitchen", right: "Cluster",
      map: [
        ["Head chef reading orders and calling them out", "Driver"],
        ["Line cooks at their stations", "Workers / executors"],
        ["Extra cooks called in on busy nights", "Autoscaling"],
        ["Closing the kitchen when no one's eating", "Auto-termination"],
        ["A pop-up kitchen for one banquet", "Job cluster"],
      ],
      breaks: "a head chef can cook too. A Spark driver that's asked to `collect()` a huge result becomes the bottleneck and can run out of memory.",
    },
    svg: () => {
      let b = box(170, 14, 140, 50, "Driver", "plan + schedule", "acc", { size: 14, size2: 11 });
      for (let i = 0; i < 4; i++) {
        const x = 14 + i * 116, dim = i === 3;
        b += box(x, 100, 104, 50, "Worker " + (i + 1), dim ? "added by autoscale" : "executor", dim ? "ghost" : "vio", { size: 13, size2: 9.5, dash: dim });
        b += arrow(240, 66, x + 52, 98, { stroke: dim ? C.faint : C.line, dash: dim });
      }
      b += table(14, 178, ["type", "lifetime", "use"], [["job cluster", "one job", "production ETL"], ["all-purpose", "until stopped", "notebooks"]], { cw: [120, 130, 202], rh: 24, mono: false, size: 12 });
      return svg(480, 256, b, "Driver and workers with an autoscaled worker, plus cluster types");
    },
    caption: "The driver coordinates; workers do the parallel work; autoscaling adds workers under load.",
    oneline: "A cluster is a lead computer that plans and many worker computers that do the work, and it should switch off when idle.",
  };

  /* ---------------------------------------------------------------- dbx-jobs */
  P["dbx-jobs"] = {
    simple: [
      "**Lakeflow Jobs** (formerly Databricks Workflows) runs your work on a schedule or trigger.",
      "A job is a set of **tasks**: notebooks, Python scripts, SQL, pipelines, dbt. Tasks have **dependencies**, so they form a DAG (a flowchart with no loops).",
      "Jobs can start on a time schedule, when a file arrives, or when a table updates. Each task can retry, send alerts, and use its own compute.",
      "There's no separate scheduler to run.",
    ],
    analogy: {
      text: "Think of a recipe with steps that wait for each other.",
      left: "Cooking a meal", right: "Lakeflow Jobs",
      map: [
        ["Chop, boil, fry, plate", "Tasks"],
        ["Can't plate before frying", "Dependencies (the DAG)"],
        ["Dinner starts at 7 pm", "A schedule trigger"],
        ["Start when the shopping arrives", "File-arrival trigger"],
        ["If the sauce burns, make it again", "Task retries"],
      ],
      breaks: "a cook notices smoke. A job only alerts on what you configured, so set failure notifications and timeouts, or a stuck task can wait for hours.",
    },
    svg: () => {
      let b = box(14, 90, 110, 44, "ingest", "Auto Loader", "plain", { size: 13.5, size2: 10.5 });
      b += box(180, 40, 120, 44, "silver", "pipeline", "acc", { size: 13.5, size2: 10.5 });
      b += box(180, 140, 120, 44, "dq_checks", "SQL", "warn", { size: 13, size2: 10.5, mono: true });
      b += box(356, 90, 110, 44, "gold", "notebook", "good", { size: 13.5, size2: 10.5 });
      b += arrow(126, 104, 178, 64) + arrow(126, 120, 178, 160) + arrow(302, 62, 354, 104) + arrow(302, 162, 354, 120);
      b += box(14, 14, 130, 30, "trigger: file arrival", null, "vio", { size: 11.5 });
      b += arrow(79, 46, 69, 88, { stroke: C.vioS });
      b += t(240, 214, "each task: own compute, retries, alerts on failure", { size: 12.5, fill: C.dim });
      return svg(480, 228, b, "A job DAG from ingest to gold with a file-arrival trigger");
    },
    caption: "gold waits for both silver and the quality checks; a new file starts the whole run.",
    oneline: "Lakeflow Jobs runs your tasks in the right order, on a schedule or trigger, and retries or alerts when one fails.",
  };

  /* ---------------------------------------------------------------- dbx-cicd */
  P["dbx-cicd"] = {
    simple: [
      "Production pipelines need software habits: version control, tests and repeatable releases.",
      "**Git folders** (Repos) connect the workspace to GitHub, GitLab or Azure DevOps, so notebooks live in branches and go through pull requests.",
      "A **Declarative Automation Bundle** (formerly Databricks Asset Bundles) packages the code, job definitions and settings in `databricks.yml`.",
      "A CI/CD pipeline runs tests, then `databricks bundle deploy -t staging`, then prod: the same definition everywhere.",
    ],
    analogy: {
      text: "Think of publishing a school newspaper.",
      left: "Newspaper", right: "CI/CD on Databricks",
      map: [
        ["Drafts with tracked edits", "Git branches and pull requests"],
        ["The editor checks before printing", "Code review and CI tests"],
        ["The page layout template", "The bundle (databricks.yml)"],
        ["Proof copy, then the real print run", "Deploy to staging, then prod"],
      ],
      breaks: "a misprint can be recalled. A bad prod deploy may already have written wrong data, so bundles are paired with Delta time travel and job run history for rollback.",
    },
    svg: () => {
      let b = "";
      [["branch", "edit in Git folder", "plain"], ["PR + CI", "tests, validate", "acc"], ["staging", "bundle deploy", "warn"], ["prod", "bundle deploy", "good"]].forEach(([n, s, k], i) => {
        const x = 8 + i * 118;
        b += box(x, 50, 106, 56, n, s, k, { size: 14, size2: 10.5 });
        if (i < 3) b += arrow(x + 108, 78, x + 116, 78);
      });
      b += box(120, 140, 240, 40, "databricks.yml (one bundle)", null, "vio", { mono: true, size: 12.5 });
      b += arrow(240, 138, 297, 108, { stroke: C.vioS }) + arrow(240, 138, 415, 108, { stroke: C.vioS });
      b += t(240, 210, "same definition, per-target settings", { size: 12.5, fill: C.dim });
      return svg(480, 224, b, "Git branch through pull request CI to staging and prod deploys of one bundle");
    },
    caption: "Every change goes branch → review → staging → prod, from one bundle.",
    oneline: "Keep Databricks code and jobs in Git, test every change, and deploy the same bundle to each environment.",
  };

  /* ---------------------------------------------------------------- dbx-cost */
  const costFig = (idle) => {
    const work = 2, on = work + idle, waste = Math.round(idle / on * 100);
    let b = t(240, 20, "All-purpose cluster, 2 hours of real notebook work a day", { bold: true, size: 13 });
    const sc = 18;
    b += `<rect x="20" y="40" width="${work * sc}" height="40" style="fill:${C.goodS}"/>`;
    b += `<rect x="${20 + work * sc}" y="40" width="${idle * sc}" height="40" style="fill:${C.badS}"/>`;
    b += t(20, 98, "work", { size: 11.5, fill: C.goodT, a: "start" }) + t(20 + work * sc + 4, 98, idle ? "idle, still billing" : "", { size: 11.5, fill: C.badT, a: "start" });
    b += box(20, 116, 210, 52, on + " h billed", "DBUs + cloud VMs", idle > 4 ? "bad" : "warn", { size: 16 });
    b += box(250, 116, 210, 52, waste + "% idle", idle ? "pure loss" : "none", idle > 4 ? "bad" : "good", { size: 16 });
    return { b, waste };
  };
  P["dbx-cost"] = {
    simple: [
      "Databricks cost is roughly **DBUs × price per DBU × time**, plus the cloud's virtual machines on classic compute.",
      "The biggest waste is **idle all-purpose clusters**: a notebook cluster left on overnight bills all night. Set **auto-termination** and enforce it with cluster policies.",
      "Run production work on **job clusters** (cheaper DBU rate, end with the job) or serverless. Use **spot** workers where a retry is fine, turn on **Photon**, right-size, and **tag** everything to see who spends what.",
      "The truth is in `system.billing.usage`.",
    ],
    analogy: {
      text: "Think of a hired car with a driver, paid by the hour.",
      left: "Hired car", right: "Databricks cost",
      map: [
        ["Hourly rate × hours", "DBUs × rate × time"],
        ["Driver waiting outside a café all afternoon", "Idle all-purpose cluster"],
        ["\"Leave if I'm not back in 30 minutes\"", "Auto-termination"],
        ["A one-way trip booked for a single errand", "Job cluster"],
        ["Cheaper standby drivers who may be called away", "Spot instances"],
        ["Receipts per department", "Tags + system.billing.usage"],
      ],
      breaks: "a hire firm shows one price. Databricks' $/DBU depends on SKU, tier and cloud, and classic compute adds the VM bill on top; check your contract or the pricing calculator.",
    },
    svg: () => svg(480, 184, costFig(14).b, "Cluster with 2 hours of work and 14 idle hours"),
    caption: "Left on for 16 hours to do 2 hours of work: 88% of the bill is idle time.",
    ix: el => slider(el, { label: "Idle hours before it stops", min: 0, max: 22, step: 1, value: 1, fmt: v => v + " h" }, v => {
      const r = costFig(v);
      return { svg: svg(480, 184, r.b, "Idle time vs bill"), note: `${r.waste}% of what you pay is idle. An auto-termination of 30-60 minutes keeps this near zero for notebook clusters; job clusters end with the job.` };
    }),
    oneline: "Most Databricks waste is idle clusters, so make them stop by themselves and run production on job clusters.",
  };

  /* ---------------------------------------------------------------- dbx-perf */
  P["dbx-perf"] = {
    simple: [
      "Tuning starts with diagnosis, not guessing. The **Spark UI** shows stages, tasks and the SQL plan.",
      "Four problems cause most slowness. **Skew**: one task runs far longer than the rest. **Spill**: tasks write to disk because partitions don't fit in memory. **Big shuffles**: lots of data moved between stages. **Small files**: thousands of tiny tasks.",
      "Each has its own fix: AQE skew handling or salting, more or smaller partitions, broadcast joins, `OPTIMIZE`, caching or Photon.",
    ],
    analogy: {
      text: "Think of a mechanic with a diagnostic computer.",
      left: "Mechanic", right: "Spark UI tuning",
      map: [
        ["Plug in the reader before touching anything", "Open the Spark UI first"],
        ["One cylinder misfiring", "Skew: one task much slower"],
        ["Engine overheating", "Spill to disk"],
        ["Fuel line leaking", "Huge shuffle read/write"],
        ["Too many short trips", "Small files"],
      ],
      breaks: "a car has one engine. A Spark job has many stages, each with its own bottleneck, so fix the slowest stage first and re-measure.",
    },
    svg: () => {
      let b = t(20, 22, "Task durations in one stage", { bold: true, size: 13.5, a: "start" });
      const d = [12, 11, 13, 12, 10, 12, 95, 11];
      d.forEach((v, i) => { b += `<rect x="${30 + i * 52}" y="${150 - v * 1.2}" width="38" height="${v * 1.2}" style="fill:${v > 50 ? C.badS : C.accS}"/>`; });
      b += line(24, 150, 456, 150);
      b += t(361, 28, "skewed task", { size: 12, fill: C.badT, bold: true });
      b += table(14, 166, ["signal in the UI", "fix"], [["one task far slower", "AQE skew join / salt"], ["spill (memory, disk)", "more partitions"], ["huge shuffle", "broadcast, filter early"], ["thousands of tiny tasks", "OPTIMIZE files"]], { cw: [220, 232], rh: 22, mono: false, size: 12 });
      return svg(480, 284, b, "Task duration bars showing skew, and a table of signals and fixes");
    },
    caption: "One bar is eight times the others: that's skew. The table maps each signal to its fix.",
    oneline: "Read the Spark UI to find which of a few problems you have, then apply that problem's fix.",
  };

  /* ---------------------------------------------------------------- dbx-liquid-clustering */
  const LCL = [
    ["No layout", 8, "Rows are in arrival order, so every file covers every customer: a filter on one customer reads all 8 files."],
    ["PARTITIONED BY customer", 8, "Partitioning by a high-cardinality column makes one folder per customer: millions of tiny files and slow listing. Don't."],
    ["CLUSTER BY (customer_id)", 1, "Liquid clustering groups similar customer_ids into the same files, so per-file min/max statistics skip 7 of 8. Keys can change later without rewriting partitions."],
  ];
  const lcFig = (i) => {
    const [n, read] = LCL[i];
    let b = t(240, 20, "WHERE customer_id = 'C-4711'", { bold: true, size: 13.5, mono: true });
    if (i === 1) {
      for (let k = 0; k < 40; k++) b += `<rect x="${20 + (k % 20) * 22}" y="${36 + Math.floor(k / 20) * 22}" width="18" height="18" rx="2" style="fill:${C.badS}"/>`;
      b += t(240, 102, "one folder per customer: millions of tiny files", { size: 12.5, fill: C.badT, bold: true });
    } else {
      for (let k = 0; k < 8; k++) b += box(14 + (k % 4) * 116, 32 + Math.floor(k / 4) * 46, 104, 40, "file " + (k + 1), i === 2 ? "ids " + (k * 125) + "-" + (k * 125 + 124) : "ids: all", i === 2 && k !== 4 ? "ghost" : "acc", { size: 11, size2: 9.5, dash: i === 2 && k !== 4 });
    }
    b += box(14, 130, 452, 40, n + ": read " + (i === 1 ? "many tiny files" : read + " of 8 files"), null, read === 1 ? "good" : "bad", { size: 13.5 });
    return b;
  };
  P["dbx-liquid-clustering"] = {
    simple: [
      "**Liquid clustering** is the recommended way to lay out new Delta tables. You write `CLUSTER BY (customer_id, event_date)`, with up to four keys.",
      "Delta keeps similar rows together in the same files, so the min/max statistics per file let queries skip files. There are no partition folders.",
      "Unlike partitioning, it works for high-cardinality keys; unlike Z-ORDER, `OPTIMIZE` only reclusters new data, and you can change the keys later.",
      "`CLUSTER BY AUTO` lets **predictive optimization** pick and maintain keys on Unity Catalog managed tables.",
    ],
    analogy: {
      text: "Think of a library that shelves books by topic, flexibly.",
      left: "Library", right: "Liquid clustering",
      map: [
        ["Books in the order they were donated", "No layout: rows in arrival order"],
        ["A separate room for every author", "Partitioning by a high-cardinality column"],
        ["Shelving by topic, adjusting as new books come", "CLUSTER BY with incremental OPTIMIZE"],
        ["The shelf labels showing \"A-C\"", "Per-file min/max statistics"],
        ["Re-sorting by a new system when needs change", "ALTER TABLE ... CLUSTER BY new keys"],
        ["A librarian who decides the system for you", "CLUSTER BY AUTO"],
      ],
      breaks: "re-shelving is instant in a small library. On big tables, changing keys only applies to new data until you run `OPTIMIZE ... FULL`.",
    },
    svg: () => svg(480, 184, lcFig(2), "Liquid clustering lets a customer lookup read one of eight files"),
    caption: "Clustered by customer_id, one lookup reads 1 file of 8.",
    ix: el => choice(el, { label: "Table layout", options: LCL.map(l => l[0]), value: 0 }, i => ({ svg: svg(480, 184, lcFig(i), "Layout vs files read"), note: LCL[i][2] })),
    oneline: "Liquid clustering keeps similar rows in the same files so queries skip the rest, and you can change the keys later.",
  };

  /* ---------------------------------------------------------------- dbx-auto-cdc */
  const CDC = [
    ["In order", [["1", "UPDATE", "city=Pune"], ["2", "UPDATE", "city=Delhi"]], "Delhi", "Events arrive in sequence order: the latest one wins."],
    ["Out of order", [["2", "UPDATE", "city=Delhi"], ["1", "UPDATE", "city=Pune"]], "Delhi", "seq 1 arrives late. SEQUENCE BY seq means AUTO CDC still keeps Delhi (seq 2), not whatever arrived last. A hand-written MERGE that trusts arrival order would wrongly keep Pune."],
    ["Delete", [["2", "UPDATE", "city=Delhi"], ["3", "DELETE", ""]], "(deleted)", "APPLY AS DELETE WHEN op = 'DELETE' removes the row (SCD 1) or closes its history (SCD 2)."],
  ];
  const cdcFig = (i) => {
    const [, ev, res] = CDC[i];
    let b = table(14, 34, ["seq", "op", "change"], ev, { cw: [50, 80, 110], rh: 28, title: "arrival order", size: 12 });
    b += arrow(256, 62, 290, 62);
    b += box(292, 36, 174, 56, "customer 7", "city = " + res, res === "(deleted)" ? "bad" : "good", { size: 14, size2: 13 });
    b += box(14, 130, 452, 50, "AUTO CDC INTO customers FROM stream(src) KEYS (id)", "APPLY AS DELETE WHEN op = 'DELETE' SEQUENCE BY seq STORED AS SCD TYPE 1", "plain", { mono: true, size: 11, size2: 9.5, mono2: true, bold: false });
    return b;
  };
  P["dbx-auto-cdc"] = {
    simple: [
      "A **change feed** is a list of inserts, updates and deletes from a source database, each with a key and a sequence number.",
      "**AUTO CDC** (formerly APPLY CHANGES) turns that feed into a correct table inside a Lakeflow pipeline. You give it the `KEYS`, the `SEQUENCE BY` column, and a rule for deletes.",
      "`STORED AS SCD TYPE 1` keeps only the latest value. `SCD TYPE 2` keeps history with start and end markers.",
      "Because it orders by sequence, late or out-of-order events still land correctly. **Lakeflow Connect** can supply the feed from databases and apps.",
    ],
    analogy: {
      text: "Think of a teacher updating pupils' addresses from letters that arrive in any order.",
      left: "Address letters", right: "AUTO CDC",
      map: [
        ["Pupil's roll number", "KEYS (id)"],
        ["Date written on each letter", "SEQUENCE BY seq"],
        ["An old letter arriving after a newer one is ignored", "Out-of-order events handled"],
        ["\"Pupil has left the school\"", "APPLY AS DELETE WHEN"],
        ["Keep only today's address", "SCD type 1"],
        ["Keep every past address with dates", "SCD type 2"],
      ],
      breaks: "a teacher can read the date on a letter. AUTO CDC can only order events if the feed has a reliable sequence column; with no such column, nothing can fix the order.",
    },
    svg: () => svg(480, 194, cdcFig(1), "Out-of-order change events still produce the latest value with SEQUENCE BY"),
    caption: "The older event arrives last, but SEQUENCE BY keeps the newer value.",
    ix: el => choice(el, { label: "Change feed", options: CDC.map(c => c[0]), value: 0 }, i => ({ svg: svg(480, 194, cdcFig(i), "AUTO CDC result"), note: CDC[i][3] })),
    oneline: "AUTO CDC turns a stream of changes into a correct table, even when the changes arrive in the wrong order.",
  };

  /* ---------------------------------------------------------------- dbx-ai-search */
  P["dbx-ai-search"] = {
    simple: [
      "Databricks has several AI tools a data engineer meets.",
      "**AI Functions** call models from SQL: `ai_query` for any served model, and ready-made ones like `ai_classify`, `ai_extract`, `ai_summarize` and `ai_analyze_sentiment`.",
      "**AI Search** (formerly Vector Search) keeps an index of **embeddings** (number lists that capture meaning) synced from a Delta table, so you can find similar text with `vector_search()`.",
      "**Model Serving** hosts models behind endpoints, and **MLflow 3** evaluates them. Inference can be billed on top of compute.",
    ],
    analogy: {
      text: "Think of a library with a very good assistant.",
      left: "Library assistant", right: "Databricks AI",
      map: [
        ["\"Sort these letters into complaints and praise\"", "ai_classify in SQL"],
        ["Finding books that mean the same, not just share words", "AI Search over embeddings"],
        ["The card index kept in step with new books", "Index synced from a Delta table"],
        ["The assistant's desk you can phone", "A Model Serving endpoint"],
        ["Checking the assistant's answers on a test set", "MLflow 3 evaluation"],
      ],
      breaks: "an assistant's time is in the opening hours. AI inference is billed per use on top of compute, so a careless `ai_query` over a billion rows is a real bill.",
    },
    svg: () => {
      let b = box(14, 20, 140, 50, "docs (Delta)", "support tickets", "plain", { size: 13.5, size2: 11 });
      b += arrow(156, 45, 186, 45, { label: "embed", dy: -8 });
      b += box(188, 20, 130, 50, "AI Search index", "synced", "acc", { size: 13, size2: 11 });
      b += arrow(320, 45, 346, 45);
      b += box(348, 20, 118, 50, "top 5 similar", null, "good", { size: 13 });
      b += box(188, 92, 130, 34, "vector_search()", null, "plain", { mono: true, size: 12 });
      b += arrow(253, 90, 253, 72, { stroke: C.faint });
      b += box(14, 150, 220, 50, "ai_classify / ai_extract", "task functions in SQL", "vio", { size: 12.5, size2: 11, mono: true });
      b += box(246, 150, 220, 50, "ai_query", "any Model Serving endpoint", "vio", { size: 13, size2: 11, mono: true });
      b += t(240, 222, "Inference billed on top of compute (system.billing.usage).", { size: 12, fill: C.dim });
      return svg(480, 236, b, "AI Search index synced from Delta plus AI Functions calling served models");
    },
    caption: "AI Search finds similar documents; AI Functions bring model calls into SQL.",
    oneline: "Databricks lets you search by meaning and call AI models straight from SQL, next to your governed data.",
  };
})();
