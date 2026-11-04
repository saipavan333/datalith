/* Datalith pass 2 — Track 26: Capstones (part 2 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const row = P2L.capRow;

  /* ---------------------------------------------------------------- cap-cdc-sync */
  const EVS = [["101", "c", "42", "new"], ["102", "u", "42", "paid"], ["103", "c", "43", "new"]];
  const CDO = [
    ["log order", [0, 1, 2], false, [["42", "paid", "102"], ["43", "new", "103"]], true, "Applied in commit order: the mirror matches the source."],
    ["out of order", [1, 0, 2], false, [["42", "new", "101"], ["43", "new", "103"]], false, "The update arrived first, then the older create overwrote it. Row 42 is wrong: it says new, the source says paid."],
    ["out of order + LSN guard", [1, 0, 2], true, [["42", "paid", "102"], ["43", "new", "103"]], true, "MERGE only updates WHEN source.lsn > target.lsn, so the late, older create (101) is ignored."],
    ["replayed twice", [0, 1, 2, 0, 1, 2], false, [["42", "paid", "102"], ["43", "new", "103"]], true, "A restart re-sent all three events. MERGE by key is idempotent, so nothing changes."],
  ];
  P["cap-cdc-sync"] = {
    simple: [
      "Reloading a whole database copy every night is slow, hammers the source, and leaves the lake a day behind. **CDC** (change data capture) keeps the lake in sync within minutes instead.",
      "There are two ways to do it. **Query-based** CDC asks the database for rows where `updated_at` is newer than last time; it is simple but misses deleted rows. **Log-based** CDC, with a tool such as Debezium, reads the database's own transaction log, so it sees every insert, update and delete with almost no extra load.",
      "Change events travel through Kafka, ordered per key, and a job `MERGE`s them into the lake's silver table. Two rules keep it correct: apply each key's changes in commit order, and make replays harmless.",
    ],
    analogy: {
      text: "Think of keeping a copy of a class register in sync with the teacher's.",
      left: "Class register", right: "CDC to the lake",
      map: [
        ["Asking \"who changed since Monday?\"", "Query-based CDC (misses removed pupils)"],
        ["Reading the teacher's notebook of every change", "Log-based CDC reading the WAL"],
        ["Copying changes in the order they were written", "Ordering per key by commit position (LSN)"],
        ["Copying a page twice changes nothing", "Idempotent MERGE"],
      ],
      breaks: "a notebook keeps every page. A database log doesn't: MySQL purges old binlogs, and Postgres holds WAL back for a stalled replication slot until its disk fills or a size cap drops the slot. Either way, a CDC reader stopped too long must start again from a fresh snapshot.",
    },
    svg: () => {
      let b = t(240, 18, "Log-based CDC from Postgres into the silver table", { bold: true, size: 13 });
      b += row([["Postgres", "WAL", "plain"], ["Debezium", "c / u / d", "acc"], ["Kafka", "key = id", "acc"], ["MERGE", "by id, LSN", "vio"], ["silver", "mirror", "good"]], 12, 32, 84, 44, 9);
      b += box(12, 100, 220, 60, "query-based", "WHERE updated_at > :last, misses deletes", "bad", { size: 12, size2: 9 });
      b += box(248, 100, 220, 60, "log-based", "every c/u/d from the log, low source load", "good", { size: 12, size2: 9.5 });
      b += t(240, 188, "first run: full snapshot, then follow the log from that position", { size: 11, fill: C.dim });
      return svg(480, 202, b, "CDC pipeline and query-based versus log-based capture");
    },
    caption: "The log sees deletes and costs the source almost nothing; MERGE applies each change by primary key.",
    _fig: i => {
      const [n, ord, guard, res, ok] = CDO[i];
      let b = t(240, 18, n + (guard ? "" : ""), { bold: true, size: 13.5 });
      b += t(20, 44, "events in the order applied:", { a: "start", size: 11.5, fill: C.dim });
      ord.forEach((e, j) => { const [l, op, id, st] = EVS[e]; const x = 20 + (j % 6) * 76; b += box(x, 52, 70, 40, op + " " + id + " " + st, "lsn " + l, j >= 3 ? "warn" : "acc", { size: 11, size2: 9.5, mono: true }); });
      b += table(100, 120, ["id", "status", "lsn"], res, { cw: [80, 100, 80], rh: 26, size: 12.5, title: "silver mirror after applying", hl: ok ? {} : { 0: "bad" } });
      b += box(100, 206, 260, 28, ok ? "matches the source" : "drifted from the source", null, ok ? "good" : "bad", { size: 12 });
      return svg(480, 246, b, "CDC events applied to a mirror table");
    },
    ix: el => choice(el, { label: "Delivery", options: CDO.map(c => c[0]), value: 0 }, i => ({ svg: P["cap-cdc-sync"]._fig(i), note: CDO[i][5] })),
    oneline: "Read every change from the database's log and merge it by key, in order, so replays can't hurt.",
  };

  /* ---------------------------------------------------------------- cap-ml-pipeline */
  P["cap-ml-pipeline"] = {
    simple: [
      "This project joins the whole machine learning track into one system that runs by itself: from raw data to a model that serves predictions and retrains when it gets worse.",
      "A **feature pipeline** computes model inputs correctly for each point in time and saves them in a **feature store**: an offline copy for training, an online copy for live requests. A **training pipeline** builds the model, evaluates it, and logs everything to **MLflow**. If it beats the current model, it is registered and promoted to Production.",
      "Serving loads the Production model with online features. **Monitoring** compares live inputs and outcomes with training; when **drift** passes a threshold, retraining starts.",
    ],
    analogy: {
      text: "Think of a weather forecasting office.",
      left: "Weather office", right: "ML pipeline",
      map: [
        ["Instruments recording temperature and pressure", "Ingest into the lake"],
        ["Turning readings into forecast inputs", "Feature pipeline and store"],
        ["Building the forecast model from past years", "Training with MLflow"],
        ["The model approved for broadcast", "Registry: Production version"],
        ["Checking yesterday's forecast against reality", "Monitoring and drift"],
      ],
      breaks: "weather physics doesn't change. Customer behaviour does, which is why the loop back from monitoring to retraining is the heart of the design.",
    },
    svg: () => {
      let b = t(240, 18, "Raw data to a served, monitored, self-retraining model", { bold: true, size: 12.5 });
      b += row([["ingest", "lake", "plain"], ["features", "point-in-time", "acc"], ["train", "MLflow", "vio"], ["registry", "Production", "good"]], 12, 32, 105, 44, 12);
      b += box(36, 108, 160, 40, "feature store", "offline | online", "acc", { size: 12, size2: 9.5 });
      b += arrow(176, 78, 140, 106, { sw: 1.2 });
      b += box(282, 108, 186, 40, "serving", "batch table + online API", "good", { size: 12, size2: 9.5 });
      b += arrow(415, 78, 400, 106, { sw: 1.2 }); b += arrow(198, 128, 280, 128); b += t(239, 164, "online features", { size: 10, fill: C.dim });
      b += box(282, 178, 186, 40, "monitor", "drift, accuracy vs labels", "warn", { size: 12, size2: 9.5 });
      b += arrow(375, 150, 375, 176, { sw: 1.2 });
      b += `<path d="M 280 198 L 160 198 L 160 220 L 60 220 L 60 228" style="fill:none;stroke:${C.badS};stroke-width:1.6;stroke-dasharray:5 4"/>`;
      b += t(180, 252, "drift > threshold: retrain", { a: "start", size: 10.5, fill: C.badT });
      b += arrow(60, 228, 60, 236, { stroke: C.badS }); b += box(12, 236, 160, 22, "trigger training run", null, "bad", { size: 10.5 });
      return svg(480, 268, b, "End-to-end ML pipeline with feature store, registry, serving and monitoring loop");
    },
    caption: "One feature definition feeds both training and serving, and monitoring closes the loop back to training.",
    oneline: "Build features once, train and register the model, serve it, and retrain automatically when it drifts.",
  };

  /* ---------------------------------------------------------------- cap-rag-ingestion */
  const DOC = 6000;
  P["cap-rag-ingestion"] = {
    simple: [
      "**RAG** (retrieval-augmented generation) lets a large language model answer from your own documents: it searches for relevant passages first, then writes its answer using them. The data engineering job is the pipeline that makes those documents searchable.",
      "Offline, the pipeline **loads** files (PDF, HTML), extracts clean text and metadata, **chunks** the text into short overlapping pieces, removes personal data, turns each chunk into an **embedding** (a list of numbers that captures its meaning), and **stores** vectors with stable ids in a vector database.",
      "Chunk size is the biggest setting. This course's notes give recursive chunks of about 512 tokens with 10 to 20% overlap as the common default; smaller suits short fact questions, larger suits questions that need more context.",
    ],
    analogy: {
      text: "Think of making index cards from a textbook for revision.",
      left: "Revision cards", right: "RAG ingestion",
      map: [
        ["Photocopying the chapters", "Load and parse"],
        ["One idea per card, repeating a line from the previous card", "Chunking with overlap"],
        ["Blacking out classmates' names", "PII redaction before embedding"],
        ["Colour-coding cards by topic", "Embeddings (meaning as numbers)"],
        ["A card box with numbered dividers", "Vector store with stable chunk ids"],
      ],
      breaks: "cards are written once. Documents get updated and deleted, so stable doc and chunk ids are needed to replace or remove exactly the right vectors.",
    },
    svg: () => {
      let b = t(240, 18, "Offline indexing pipeline", { bold: true, size: 13.5 });
      b += row([["load", "PDF, HTML", "plain"], ["chunk", "~512 tok", "acc"], ["redact", "PII", "warn"], ["embed", "model", "vio"], ["store", "vectors + ids", "good"]], 12, 32, 84, 44, 9);
      b += t(20, 106, "chunk record:", { a: "start", size: 11.5, fill: C.dim });
      b += table(20, 114, ["doc_id", "chunk_id", "text", "vector", "acl"], [["pol-17", "pol-17#3", "Refunds within...", "[0.12, -0.4, ...]", "staff"]], { cw: [64, 76, 118, 120, 58], rh: 26, size: 10.5 });
      b += t(240, 196, "online: question -> embed -> nearest chunks (filtered by acl) -> LLM", { size: 11, fill: C.dim, max: 456 });
      return svg(480, 210, b, "RAG ingestion pipeline and a stored chunk record");
    },
    caption: "Each chunk keeps its source, a stable id and its access tags, so updates, deletes and permission filters work.",
    _fig: s => {
      const o = Math.round(s * 0.15), n = Math.ceil((DOC - o) / (s - o)), W = 440, sc = W / DOC;
      let b = t(240, 18, "6,000-token document, " + s + "-token chunks, 15% overlap", { bold: true, size: 13 });
      for (let i = 0; i < n; i++) { const st = i * (s - o), en = Math.min(DOC, st + s); const y = 34 + (i % 2) * 18; b += `<rect x="${(20 + st * sc).toFixed(1)}" y="${y}" width="${((en - st) * sc).toFixed(1)}" height="14" rx="3" style="fill:${i % 2 ? C.vioS : C.accS};opacity:.85"/>`; }
      b += t(240, 90, n + " chunks, " + n + " embeddings, overlap " + o + " tokens each", { size: 12.5, bold: true, fill: C.accT });
      b += t(240, 112, s <= 384 ? "precise matches for short fact questions, but a passage may be cut mid-idea" : s >= 896 ? "more context per hit for multi-step questions, but more noise per chunk" : "the common default range for mixed questions", { size: 11.5, fill: C.dim, max: 456 });
      return svg(480, 126, b, "Chunks over a document for a chunk size");
    },
    ix: el => slider(el, { label: "Chunk size (tokens)", min: 256, max: 1024, step: 128, value: 512 }, v => ({ svg: P["cap-rag-ingestion"]._fig(v), note: "Number of chunks = ceil((6000 - overlap) / (size - overlap)). Measure retrieval quality on your own questions before settling on a size." })),
    oneline: "Turn documents into small overlapping chunks with ids and embeddings, so an LLM can search them.",
  };

  /* ---------------------------------------------------------------- cap-iceberg-lakehouse */
  P["cap-iceberg-lakehouse"] = {
    simple: [
      "This project builds an open lakehouse on **Apache Iceberg**, so many engines can share one copy of the data. Spark can write a table, and Trino, Flink, DuckDB or BigQuery can read it.",
      "There are three layers. Parquet **data files** sit in object storage (GCS, S3). Iceberg **metadata** files describe each table version: a snapshot points to manifest files, which list data files with column statistics, so engines skip files they don't need. A **REST catalog** stores the pointer to each table's current metadata.",
      "A write builds new metadata, then asks the catalog to swap the pointer only if nobody else changed it first (**compare-and-swap**). That is what makes concurrent writes on plain object storage safe.",
    ],
    analogy: {
      text: "Think of a shared library catalogue for many branch libraries.",
      left: "Library network", right: "Iceberg lakehouse",
      map: [
        ["The books on the shelves", "Parquet data files"],
        ["Index cards listing which shelf holds what", "Manifests with file statistics"],
        ["Today's edition of the catalogue", "A snapshot"],
        ["The one front desk that says which edition is current", "The REST catalog"],
        ["Any branch can use the same catalogue", "Any engine can read the table"],
      ],
      breaks: "a library edits its catalogue in place. Iceberg never edits metadata files; it writes new ones and moves one pointer, which is why old snapshots stay readable for time travel.",
    },
    svg: () => {
      let b = t(240, 18, "Many engines, one catalog, one copy of the data", { bold: true, size: 13 });
      ["Spark", "Trino", "Flink", "DuckDB", "BigQuery"].forEach((e, i) => { b += box(12 + i * 92, 30, 86, 28, e, null, "vio", { size: 11.5 }); b += arrow(55 + i * 92, 60, 240, 80, { sw: 0.9 }); });
      b += box(150, 82, 180, 34, "REST catalog", "current -> v42.metadata.json", "acc", { size: 12, size2: 9 });
      b += arrow(240, 118, 240, 132, { sw: 1.3 });
      b += box(150, 134, 180, 28, "snapshot 42", null, "warn", { size: 11.5 });
      b += box(330, 134, 138, 28, "snapshot 41 (time travel)", null, "ghost", { size: 9.5 });
      b += arrow(200, 164, 140, 182, { sw: 1.1 }); b += arrow(280, 164, 340, 182, { sw: 1.1 });
      b += box(60, 184, 160, 28, "manifest A: min/max", null, "plain", { size: 10.5 });
      b += box(260, 184, 160, 28, "manifest B: min/max", null, "plain", { size: 10.5 });
      ["a.parquet", "b.parquet", "c.parquet", "d.parquet"].forEach((f, i) => { const x = 20 + i * 116; b += box(x, 230, 100, 24, f, null, i === 3 ? "ghost" : "good", { size: 10, mono: true }); b += line(i < 2 ? 140 : 340, 214, x + 50, 228, { stroke: C.line, sw: 0.9 }); });
      b += t(240, 272, "write = new metadata, then compare-and-swap the catalog pointer", { size: 11, fill: C.dim });
      return svg(480, 284, b, "Iceberg lakehouse with engines, REST catalog, snapshots, manifests and data files");
    },
    caption: "Engines ask the catalog for the current snapshot, then use manifest statistics to read only the files they need.",
    oneline: "Keep one copy of data in Iceberg tables with a shared catalog, so every engine reads and writes it safely.",
  };

  /* ---------------------------------------------------------------- cap-data-contracts */
  P["cap-data-contracts"] = {
    simple: [
      "Most data breaks happen upstream: someone renames a column in an app, and a dashboard three teams away goes blank the next morning. **Shift-left** means catching that change where it starts.",
      "A **data contract** is a file in the producer's repository that says what the data promises: the schema and types, what each field means, freshness and volume **SLAs** (service level agreements), and the owner. This course uses ODCS (Open Data Contract Standard) YAML.",
      "The key is enforcement in **CI** (continuous integration). When the producer opens a change, a tool such as `datacontract-cli` checks it against the contract and blocks the merge if it would break consumers.",
    ],
    analogy: {
      text: "Think of a plug and socket standard.",
      left: "Plugs and sockets", right: "Data contracts",
      map: [
        ["The published plug standard", "The contract YAML"],
        ["A factory testing each plug before shipping", "CI check on every pull request"],
        ["A wrong plug rejected at the factory", "Merge blocked on a breaking change"],
        ["Any certified appliance fits any socket", "Consumers rely on the schema safely"],
      ],
      breaks: "plug standards rarely change. Data contracts must evolve, so they need versions and a deprecation period for breaking changes instead of a hard ban.",
    },
    svg: () => {
      let b = t(240, 18, "A breaking change is caught in CI, not in production", { bold: true, size: 13 });
      b += box(12, 34, 120, 44, "producer PR", "rename amount", "plain", { size: 12, size2: 9.5 });
      b += arrow(134, 56, 160, 56);
      b += box(162, 34, 150, 44, "CI: contract test", "datacontract-cli", "vio", { size: 12, size2: 9.5 });
      b += arrow(314, 46, 346, 38, { stroke: C.badS });
      b += box(348, 22, 120, 30, "breaks: blocked", null, "bad", { size: 11.5 });
      b += arrow(314, 68, 346, 82, { stroke: C.goodS });
      b += box(348, 68, 120, 30, "ok: merge", null, "good", { size: 11.5 });
      b += table(30, 132, ["orders.contract.yaml", ""], [["field amount", "decimal(12,2), required"], ["freshness", "< 1 hour"], ["null rate customer_id", "0%"], ["owner", "checkout-team"]], { cw: [180, 230], rh: 24, size: 11, mono: false, title: "the contract lives next to the producer's code" });
      return svg(480, 262, b, "Data contract enforced in CI with blocked and compliant paths");
    },
    caption: "The contract is code in the producer's repo, and CI turns a would-be incident into a red check. Values are examples.",
    oneline: "Write down what data promises and check it in CI, so breaking changes never ship.",
  };

  /* ---------------------------------------------------------------- cap-realtime-analytics */
  P["cap-realtime-analytics"] = {
    simple: [
      "Some analytics are shown to customers, not just analysts: \"your shop's views in the last 10 minutes\". That needs answers in milliseconds, on data seconds old, for thousands of users at once. A normal warehouse is not built for that.",
      "The design: events go into **Kafka**, optionally through **Flink** to enrich or pre-aggregate, then into a **real-time OLAP** store such as ClickHouse, Apache Pinot or Apache Druid. OLAP means online analytical processing: fast slicing and totals.",
      "These stores ingest the stream continuously and answer quickly using columnar storage, pre-aggregation and indexes. Pinot's star-tree index, for example, stores pre-computed totals for common filter combinations.",
    ],
    analogy: {
      text: "Think of a stadium scoreboard versus the season statistics book.",
      left: "Stadium", right: "Real-time analytics",
      map: [
        ["Scoreboard updated the second a goal goes in", "Real-time OLAP, fresh within seconds"],
        ["Thousands of fans glancing at it at once", "High query concurrency"],
        ["The season book compiled overnight", "The batch warehouse"],
        ["Pre-printed running totals on the board", "Pre-aggregation and indexes"],
      ],
      breaks: "a scoreboard shows one game. A user-facing store serves every customer's own slice, so the data must be partitioned and indexed by the keys users filter on.",
    },
    svg: () => {
      let b = t(240, 18, "Fresh in a second, answered in milliseconds", { bold: true, size: 13.5 });
      b += row([["apps", "clicks, views", "plain"], ["Kafka", "durable log", "acc"], ["Flink", "optional enrich", "vio"], ["OLAP store", "Pinot / ClickHouse", "good"], ["users", "in-product", "good"]], 12, 32, 84, 46, 9, { size2: 8.5 });
      b += `<rect x="12" y="98" width="340" height="16" rx="4" style="fill:${C.warn};stroke:${C.warnS}"/>`;
      b += t(182, 110, "event to queryable: under ~1 s", { size: 10.5, bold: true, fill: C.warnT });
      b += `<rect x="290" y="122" width="178" height="16" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
      b += t(379, 134, "query: milliseconds", { size: 10.5, bold: true, fill: C.goodT });
      b += table(30, 164, ["", "batch warehouse", "real-time OLAP"], [["data age", "hours", "seconds"], ["query time", "seconds+", "milliseconds"], ["users", "analysts", "thousands of customers"]], { cw: [90, 140, 190], rh: 24, size: 11, mono: false });
      return svg(480, 270, b, "Real-time analytics pipeline with latency budget and comparison with a batch warehouse");
    },
    caption: "Two budgets matter: ingest-to-query freshness, and query latency under heavy concurrency.",
    oneline: "For live numbers shown to users, stream events into a real-time OLAP store that answers in milliseconds.",
  };

  /* ---------------------------------------------------------------- cap-finops-observability */
  const LN = { orders_raw: [10, 40], payments_raw: [10, 110], stg_orders: [128, 40], stg_payments: [128, 110], fct_revenue: [246, 75], dash_finance: [366, 40], ml_churn: [366, 110] };
  const LE = [["orders_raw", "stg_orders"], ["payments_raw", "stg_payments"], ["stg_orders", "fct_revenue"], ["stg_payments", "fct_revenue"], ["fct_revenue", "dash_finance"], ["fct_revenue", "ml_churn"]];
  const BR = [["freshness", "orders_raw", "orders_raw is 3 h late (SLA 1 h). Lineage shows the finance dashboard and churn features are both stale."], ["schema", "payments_raw", "A column was renamed upstream. Everything downstream of payments_raw is at risk."], ["volume", "stg_orders", "Row count fell 90% versus the 4-week average: likely an upstream filter bug, not a quiet day."]];
  P["cap-finops-observability"] = {
    simple: [
      "A production platform needs two extra things on top of its pipelines: proof that the data is healthy, and knowledge of what each part costs.",
      "**Data observability** watches five signals on every important table: **freshness** (did it arrive on time?), **volume** (is the row count normal?), **schema** (did columns change?), **distribution** (are values in normal ranges?), and **lineage** (what feeds what). When one breaks, an alert fires, and lineage shows everything downstream that is affected.",
      "**FinOps** (financial operations) treats cost as a signal too: tag every job and warehouse by pipeline and team, report spend per pipeline, and fix the usual waste, such as idle compute, unpruned scans and data copied across regions.",
    ],
    analogy: {
      text: "Think of a car's dashboard.",
      left: "Car dashboard", right: "Observability and FinOps",
      map: [
        ["Warning lights for oil, battery, engine", "Freshness, volume, schema, distribution alerts"],
        ["The wiring diagram showing what a fault affects", "Lineage and blast radius"],
        ["Fuel gauge and trip cost", "Cost per pipeline"],
        ["Engine idling in the driveway", "Idle warehouses still billing"],
      ],
      breaks: "a car has one dashboard designer. Data platforms span many teams, so alerts need owners and SLOs (targets) agreed up front, or every light gets ignored.",
    },
    svg: () => {
      let b = t(240, 18, "Five health signals, plus cost per pipeline", { bold: true, size: 13.5 });
      ["freshness", "volume", "schema", "distribution", "lineage"].forEach((s, i) => { b += box(12 + i * 92, 32, 86, 30, s, null, "acc", { size: 11 }); });
      b += t(240, 84, "alert against an SLO, then trace impact with lineage", { size: 11, fill: C.dim });
      b += t(20, 112, "monthly spend by pipeline (example)", { a: "start", size: 11.5, bold: true });
      [["orders_daily", 410, "good"], ["clickstream", 1180, "warn"], ["ml_features", 760, "acc"], ["idle warehouse", 520, "bad"]].forEach(([n, v, k], i) => { const y = 122 + i * 26; b += t(20, y + 15, n, { a: "start", size: 11 }); b += `<rect x="130" y="${y + 3}" width="${v / 4}" height="16" rx="3" style="fill:${P2L.KIND[k][1]}"/>`; b += t(136 + v / 4, y + 15, "$" + v, { a: "start", size: 11 }); });
      b += t(240, 244, "tags on every job and warehouse make this chart possible", { size: 11, fill: C.dim });
      return svg(480, 256, b, "Five observability signals and cost per pipeline");
    },
    caption: "Health and cost are both measured per table and per pipeline, so problems have owners. Spend figures are examples.",
    _fig: i => {
      const [p, src] = BR[i]; const down = new Set([src]); let grow = true;
      while (grow) { grow = false; LE.forEach(([a, z]) => { if (down.has(a) && !down.has(z)) { down.add(z); grow = true; } }); }
      let b = t(240, 18, p + " breaks at " + src, { bold: true, size: 13.5 });
      LE.forEach(([a, z]) => { const [x1, y1] = LN[a], [x2, y2] = LN[z]; b += arrow(x1 + 101, y1 + 15, x2 - 1, y2 + 15, { sw: 1.2, stroke: down.has(a) ? C.warnS : C.line }); });
      Object.entries(LN).forEach(([n, [x, y]]) => { b += box(x, y, 100, 30, n, null, n === src ? "bad" : down.has(n) ? "warn" : "plain", { size: 10, mono: true }); });
      b += t(240, 172, "red: the failing check   amber: downstream blast radius", { size: 11, fill: C.dim });
      return svg(480, 186, b, "Lineage blast radius for a failing check");
    },
    ix: el => choice(el, { label: "Failing signal", options: BR.map(r => r[0]), value: 0 }, i => ({ svg: P["cap-finops-observability"]._fig(i), note: BR[i][2] })),
    oneline: "Watch freshness, volume, schema, values and lineage on every table, and know what each pipeline costs.",
  };

  /* ---------------------------------------------------------------- cap-bank-platform */
  P["cap-bank-platform"] = {
    simple: [
      "This is the flagship project: a bank's data platform built with the same kind of stack a senior bank data engineer owns, covering both batch and streaming.",
      "In batch, **DataStage** extracts from core banking, cards and market data, sends bad rows to a reject link, and lands raw files in **GCS** as bronze. **Databricks** (PySpark) builds silver: de-duplicated, typed, with an SCD Type 2 customer dimension and referential checks. **Greenplum** with **dbt** builds gold marts: transactions, daily reconciliation, regulatory exposure and fraud summaries.",
      "In streaming, card transactions flow through **Kafka** into Structured Streaming, which scores them for fraud and AML (anti-money laundering) risk in real time. A **data contract** check in CI guards what consumers receive. Running a batch and a stream path side by side like this is called a **Lambda** architecture.",
    ],
    analogy: {
      text: "Think of a bank branch's day.",
      left: "Bank branch", right: "Bank data platform",
      map: [
        ["End-of-day ledgers sent to head office", "Batch: DataStage to GCS bronze"],
        ["Clerks checking and cleaning the ledgers", "Silver in Databricks"],
        ["The daily balance sheet for managers", "Gold marts in Greenplum + dbt"],
        ["The guard watching the door live", "Streaming fraud and AML scoring"],
        ["Counting cash against the ledger at close", "Daily reconciliation control totals"],
      ],
      breaks: "a branch reconciles once a day. The streaming path must also be reconciled against the batch path, or fraud alerts and reports can disagree.",
    },
    svg: () => {
      let b = t(240, 18, "Batch and streaming paths into governed gold marts", { bold: true, size: 13 });
      b += box(12, 30, 80, 120, "sources", "4 systems", "plain", { size: 12, size2: 8 });
      b += t(150, 42, "batch", { size: 11, bold: true, fill: C.accT });
      b += row([["DataStage", "rejects out", "acc"], ["GCS bronze", "raw", "warn"], ["Databricks", "silver, SCD2", "plain"]], 106, 48, 84, 44, 8, { size: 11, size2: 9 });
      b += arrow(94, 70, 104, 70, { sw: 1.2 });
      b += box(384, 48, 84, 44, "Greenplum", "dbt gold", "good", { size: 11, size2: 9 });
      b += arrow(370, 70, 382, 70, { sw: 1.2 });
      b += t(150, 116, "streaming", { size: 11, bold: true, fill: C.badT });
      b += row([["Kafka", "card txns", "acc"], ["Structured", "Streaming", "vio"], ["fraud / AML", "alerts", "bad"]], 106, 122, 84, 40, 8, { size: 11, size2: 9 });
      b += arrow(94, 140, 104, 140, { sw: 1.2 });
      b += box(12, 182, 456, 26, "data contract CI gate between layers and consumers", null, "vio", { size: 11 });
      b += table(30, 230, ["gold marts", "", "", ""], [["fact_transactions", "daily reconciliation", "regulatory exposure", "fraud summary"]], { cw: [105, 105, 105, 105], rh: 24, size: 9.5, mono: false });
      return svg(480, 286, b, "Bank data platform with batch and streaming paths into gold marts");
    },
    caption: "A Lambda layout: the batch path builds trusted history, the streaming path catches fraud now, and contracts guard both.",
    oneline: "A bank platform runs a careful batch path and a fast fraud stream side by side, checked by contracts.",
  };

  /* ---------------------------------------------------------------- cap-interview-prep */
  P["cap-interview-prep"] = {
    simple: [
      "Your projects are your strongest interview material, if you can explain them clearly in a few minutes.",
      "Present every project in the same order: the **problem** and who had it, the **architecture**, the key **decisions and trade-offs**, how you made it **reliable**, and the **results** with numbers.",
      "Expect follow-ups that probe the same few ideas: is it safe to rerun (idempotency), do you keep raw data before modelling it, where are the quality gates, and what happens when something fails?",
    ],
    analogy: {
      text: "Think of showing a house you built to a buyer.",
      left: "House tour", right: "Project walkthrough",
      map: [
        ["Why the family needed this house", "Problem"],
        ["The floor plan", "Architecture diagram"],
        ["\"We chose brick over wood because...\"", "Decisions and trade-offs"],
        ["Fire doors and the fuse box", "Reliability: retries, gates, idempotency"],
        ["The energy bill is half the old one", "Results with numbers"],
      ],
      breaks: "a buyer sees the house. An interviewer only hears you, so draw the architecture as you talk and keep the numbers honest.",
    },
    svg: () => {
      let b = t(240, 18, "A five-part project walkthrough", { bold: true, size: 13.5 });
      b += row([["problem", "who, why", "plain"], ["architecture", "draw it", "acc"], ["decisions", "trade-offs", "vio"], ["reliability", "fail-safe", "warn"], ["results", "numbers", "good"]], 12, 32, 84, 46, 9);
      const Q = [["Rerun safe?", "idempotent writes, MERGE"], ["Raw kept?", "bronze before models"], ["Bad data?", "gates + quarantine"], ["It fails?", "retries, DLQ, alerts"]];
      Q.forEach(([a, z], i) => { const x = 12 + (i % 2) * 232, y = 104 + Math.floor(i / 2) * 54; b += box(x, y, 224, 44, a, z, "plain", { size: 12, size2: 10 }); });
      b += t(240, 228, "Have one honest number per project: rows/day, latency, cost, hours saved.", { size: 11, fill: C.dim, max: 456 });
      return svg(480, 240, b, "Project walkthrough structure and common follow-up questions");
    },
    caption: "Five parts in order, and four follow-ups you should be ready for on every project.",
    oneline: "Explain each project as problem, design, decisions, reliability and results, and be ready to defend it.",
  };
})();
