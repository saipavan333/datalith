/* Datalith — diagram pack "platforms" (Nov 2026 upgrade: GCP, Databricks, Snowflake, cross-platform).
   Same helpers and colour language as the other packs: blue = compute/primary, green = result/good,
   amber = caution/control, red = risk. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    gB:"#1a2a52", gBS:"#4285f4", gBT:"#8ab4f8", sF:"#12324a", sFS:"#29b5e8", sFT:"#8fd8f5",
    dB:"#3a1f1a", dBS:"#ff5f46", dBT:"#ffab9c" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||9}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.6}${o.dash?";stroke-dasharray:4 3":""}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2-6,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2-6,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  // a titled box with up to 3 lines of small text
  const card=(x,y,w,h,title,lines,pal)=>{
    let b=box(x,y,w,h,{fill:pal[0],stroke:pal[1],r:9})+t(x+w/2,y+17,title,{bold:true,size:9.4,fill:pal[2]});
    lines.forEach((s,i)=>{ b+=t(x+w/2,y+33+i*13,s,{size:7.8,fill:C.dim}); });
    return b;
  };
  const BLUE=[C.acc,C.accS,C.accT], GREEN=[C.good,C.goodS,C.goodT], AMBER=[C.warnFill,C.warn,C.warn],
        RED=[C.bad,C.badS,C.badT], GCP=[C.gB,C.gBS,C.gBT], SNOW=[C.sF,C.sFS,C.sFT], DBX=[C.dB,C.dBS,C.dBT], GREY=[C.box,C.boxS,C.tx];
  const banner=(y,s,pal=AMBER)=>box(16,y,608,24,{fill:pal[0],stroke:pal[1],r:8})+t(320,y+16,s,{size:8,fill:pal[2]});
  const D = {};

  /* ---------- cross-platform ---------- */
  D["xp-terraform"] = (() => {
    let b = t(320, 22, "Terraform: desired code + state + real world -> plan -> apply", { bold: true, size: 11 });
    b += card(20, 44, 150, 70, ".tf code (git)", ["what you WANT", "reviewed in a PR"], BLUE);
    b += card(20, 128, 150, 70, "state file", ["what TF made last time", "remote: GCS bucket + lock"], AMBER);
    b += card(245, 86, 150, 70, "terraform plan", ["diff: + ~ -/+ -", "refresh finds drift"], GREY);
    b += ln(170, 79, 200, 79) + ln(200, 79, 200, 104) + arrowR(200, 104, 245, {}) + ln(170, 163, 200, 163) + ln(200, 163, 200, 138) + arrowR(200, 138, 245, {});
    b += card(470, 30, 150, 52, "google provider", ["datasets, IAM, reservations"], GCP);
    b += card(470, 96, 150, 52, "databricks provider", ["UC, jobs, cluster policies"], DBX);
    b += card(470, 162, 150, 52, "snowflake provider", ["warehouses, roles, grants"], SNOW);
    b += arrowR(395, 121, 470, {}) + t(432, 112, "apply", { size: 8, fill: C.goodT });
    b += ln(450, 56, 450, 188) + arrowR(450, 56, 470, {}) + arrowR(450, 188, 470, {});
    b += banner(226, "Review every '-' and '-/+' line: replace = destroy + create. Drift = someone clicked in the console.");
    return svg(262, b, "Terraform plan and apply across GCP, Databricks and Snowflake");
  })();

  D["xp-finops"] = (() => {
    let b = t(320, 22, "FinOps: one cost table from three platforms -> inform, optimize, operate", { bold: true, size: 11 });
    b += card(16, 42, 196, 66, "GCP", ["billing export to BigQuery", "INFORMATION_SCHEMA.JOBS"], GCP);
    b += card(222, 42, 196, 66, "Databricks", ["system.billing.usage", "x system.billing.list_prices"], DBX);
    b += card(428, 42, 196, 66, "Snowflake", ["ACCOUNT_USAGE metering views", "credits x price per credit"], SNOW);
    b += arrowD(114, 108, 140) + arrowD(320, 108, 140) + arrowD(526, 108, 140);
    b += box(16, 140, 608, 34, { fill: C.box, stroke: C.boxS }) + t(320, 161, "unified usage table: day, provider, service, team tag, quantity, unit, cost", { size: 8.6 });
    b += arrowD(114, 174, 196) + arrowD(320, 174, 196) + arrowD(526, 174, 196);
    b += card(16, 196, 196, 58, "inform", ["showback by team", "tag coverage %"], BLUE);
    b += card(222, 196, 196, 58, "optimize", ["auto-suspend, right-size", "commitments, pruning"], GREEN);
    b += card(428, 196, 196, 58, "operate", ["budgets + alerts", "anomaly per team/day"], AMBER);
    b += banner(266, "Track a unit cost (e.g. $ per 1,000 orders) so growth and waste can be told apart.");
    return svg(300, b, "FinOps data flow across GCP, Databricks and Snowflake");
  })();

  D["xp-openlineage"] = (() => {
    let b = t(320, 22, "OpenLineage: producers emit run events, any backend builds the graph", { bold: true, size: 11 });
    const prod = [["Airflow / Composer", "openlineage provider"], ["Spark / Dataproc", "openlineage-spark listener"], ["dbt", "openlineage-dbt"], ["your Python job", "openlineage-python client"]];
    prod.forEach((p, i) => { b += card(16, 40 + i * 50, 160, 42, p[0], [p[1]], BLUE); b += arrowR(176, 61 + i * 50, 232, {}); });
    b += box(232, 66, 176, 140, { fill: C.box, stroke: C.boxS, r: 10 }) + t(320, 86, "RunEvent (JSON)", { bold: true, size: 9.6 });
    ["eventType START/COMPLETE/FAIL", "run.runId (UUID)", "job.namespace + name", "inputs[] / outputs[]", "facets: schema, sql, ..."].forEach((s, i) => { b += t(320, 106 + i * 18, s, { size: 7.8, mono: true, fill: C.dim }); });
    b += arrowR(408, 106, 460, {}) + arrowR(408, 166, 460, {});
    b += card(460, 60, 164, 66, "backends", ["Marquez (reference)", "Google Data Lineage API"], GREEN);
    b += card(460, 140, 164, 66, "you get", ["upstream / downstream", "blast radius, who to page"], GREEN);
    b += banner(250, "Unity Catalog and Snowflake keep their own lineage (system.access.table_lineage, GET_LINEAGE); OpenLineage joins the gaps.");
    return svg(286, b, "OpenLineage producers, run events and lineage backends");
  })();

  D["xp-choose-platform"] = (() => {
    let b = t(320, 22, "Choosing a platform: start from the workload, not the logo", { bold: true, size: 11 });
    b += box(200, 38, 240, 40, { fill: C.box, stroke: C.boxS }) + t(320, 55, "your workload + team + cloud", { bold: true, size: 9.4 }) + t(320, 69, "SQL vs Spark? latency? ML? where is the data?", { size: 7.8, fill: C.dim });
    b += ln(320, 78, 320, 92) + ln(110, 92, 530, 92) + arrowD(110, 92, 108) + arrowD(320, 92, 108) + arrowD(530, 92, 108);
    b += card(16, 108, 188, 96, "BigQuery-centred", ["serverless SQL, no clusters", "already on GCP, SQL team", "pay per TiB or per slot-hour"], GCP);
    b += card(226, 108, 188, 96, "Databricks lakehouse", ["Spark + streaming + ML", "open Delta/Iceberg files", "any cloud, DBU billing"], DBX);
    b += card(436, 108, 188, 96, "Snowflake", ["SQL-first, many BI users", "sharing, strong governance", "credits per warehouse-sec"], SNOW);
    b += banner(218, "Mixing is normal: Iceberg/Delta tables + shared catalogs let two engines read one copy of the data.", GREEN);
    b += banner(250, "Score with weights agreed up front, then test the top two on YOUR heaviest query before signing.");
    return svg(286, b, "Decision map for BigQuery, Databricks and Snowflake");
  })();

  /* ---------- GCP ---------- */
  D["gcp-iam-security"] = (() => {
    let b = t(320, 22, "A BigQuery query passes four gates before data comes back", { bold: true, size: 11 });
    b += box(10, 36, 620, 200, { fill: "none", stroke: C.warn, r: 12, sw: 1.4 }) + t(560, 52, "VPC-SC perimeter", { size: 8, fill: C.warn });
    b += card(22, 62, 112, 70, "principal", ["user, group or", "service account"], GREY);
    b += card(152, 62, 140, 70, "1  IAM", ["jobUser on project", "dataViewer on data"], GCP);
    b += card(310, 62, 140, 70, "2  column tags", ["policy tag needs", "Fine-Grained Reader"], AMBER);
    b += card(468, 62, 150, 70, "3  row policy", ["GRANT TO ... FILTER", "not listed = 0 rows"], AMBER);
    b += arrowR(134, 97, 152, {}) + arrowR(292, 97, 310, {}) + arrowR(450, 97, 468, {});
    b += t(160, 152, "inherited: organization > folder > project > dataset > table", { a: "start", size: 8, fill: C.dim });
    b += card(152, 166, 200, 56, "4  encryption", ["CMEK (Cloud KMS) on dataset"], BLUE);
    b += card(372, 166, 246, 56, "result", ["only allowed rows and columns"], GREEN);
    b += arrowR(352, 194, 372, {});
    b += banner(246, "Fail modes differ: no IAM -> error; tagged column -> error; no matching row policy -> empty result.", RED);
    return svg(282, b, "BigQuery access gates: IAM, policy tags, row access policies, CMEK, VPC-SC");
  })();

  D["gcp-datastream-cdc"] = (() => {
    let b = t(320, 22, "Datastream: change log in, BigQuery table out", { bold: true, size: 11 });
    b += card(16, 46, 150, 84, "source database", ["MySQL binlog (ROW)", "Postgres publication", "Oracle / SQL Server logs"], GREY);
    b += card(236, 46, 168, 84, "Datastream", ["backfill: snapshot", "CDC: ongoing changes", "serverless, per GiB"], GCP);
    b += arrowR(166, 88, 236, {});
    b += card(474, 40, 150, 60, "BigQuery: merge", ["mirror of source", "max_staleness sets cost"], GREEN);
    b += card(474, 112, 150, 60, "BigQuery: append-only", ["every change a row", "CHANGE_TYPE, SORT_KEYS"], BLUE);
    b += arrowR(404, 70, 474, {}) + ln(404, 116, 440, 116) + ln(440, 116, 440, 142) + arrowR(440, 142, 474, {});
    b += card(236, 150, 168, 50, "Cloud Storage", ["Avro/JSON files"], GREY);
    b += arrowD(320, 130, 150) + t(330, 222, "-> Dataflow template -> Cloud SQL / Spanner / custom", { size: 8, fill: C.dim });
    b += banner(234, "Order by SOURCE_TIMESTAMP / sequence, never by arrival. Processed bytes can be 2-5x the raw rows.");
    return svg(270, b, "Datastream CDC from operational databases into BigQuery");
  })();

  D["gcp-serverless-spark"] = (() => {
    let b = t(320, 22, "Managed Service for Apache Spark: two ways to run the same Spark code", { bold: true, size: 11 });
    b += card(16, 44, 296, 112, "clusters (was Dataproc on Compute Engine)", ["you pick machine types and worker counts", "pay VM + disk + service fee per second", "keep warm, idle time still bills", "good for long-lived, tuned, custom images"], GCP);
    b += card(328, 44, 296, 112, "serverless batches (was Dataproc Serverless)", ["you submit a batch; it sizes executors", "pay DCU-seconds + shuffle storage", "scales to zero between runs", "Standard $0.06 / Premium $0.089 per DCU-h"], GREEN);
    b += box(16, 170, 608, 40, { fill: C.box, stroke: C.boxS }) + t(320, 187, "reads/writes GCS, BigQuery (Spark BigQuery connector), Iceberg via BigLake", { size: 8.6 }) + t(320, 201, "gcloud dataproc clusters ... | gcloud dataproc batches submit pyspark ...", { size: 8, mono: true, fill: C.dim });
    b += banner(222, "1 vCPU-h = 0.6 DCU; RAM 0.1 DCU per GiB-h up to 8 GiB/vCPU, 0.2 above. Default minimum: 12 DCUs.");
    return svg(258, b, "Cluster versus serverless Spark on Google Cloud");
  })();

  D["bq-ai-vector"] = (() => {
    let b = t(320, 22, "AI inside BigQuery: models in SQL, embeddings, vector search, generation", { bold: true, size: 11 });
    b += card(16, 44, 140, 64, "table", ["tickets, products,", "documents (ObjectRef)"], GREY);
    b += card(176, 44, 140, 64, "embed", ["AI.GENERATE_EMBEDDING", "AI.EMBED (one value)"], GCP);
    b += card(336, 44, 140, 64, "vector index", ["CREATE VECTOR INDEX", "IVF or TreeAH"], AMBER);
    b += card(496, 44, 128, 64, "search", ["VECTOR_SEARCH", "top_k, COSINE"], GREEN);
    b += arrowR(156, 76, 176, {}) + arrowR(316, 76, 336, {}) + arrowR(476, 76, 496, {});
    b += card(336, 124, 288, 58, "RAG answer", ["top-k rows -> AI.GENERATE prompt -> text"], GREEN);
    b += arrowD(560, 108, 124);
    b += card(16, 124, 300, 58, "BigQuery ML (classic)", ["CREATE MODEL ... OPTIONS(model_type=...)", "ML.EVALUATE / ML.PREDICT"], BLUE);
    b += banner(196, "Standard edition: no BigQuery ML, no vector indexes (brute force only). Enterprise or on-demand needed.", RED);
    return svg(232, b, "BigQuery ML, embeddings, vector search and generation");
  })();

  /* ---------- Databricks ---------- */
  D["dbx-liquid-clustering"] = (() => {
    let b = t(320, 22, "From partitions + Z-ORDER to liquid clustering", { bold: true, size: 11 });
    b += card(16, 42, 296, 116, "old: PARTITIONED BY + ZORDER", ["layout fixed at create time", "high-cardinality key -> tiny files", "change the key = rewrite the table", "ZORDER rewrites big chunks each run"], RED);
    b += card(328, 42, 296, 116, "liquid: CLUSTER BY (up to 4 keys)", ["no partition folders", "OPTIMIZE is incremental", "ALTER TABLE ... CLUSTER BY (new) anytime", "CLUSTER BY AUTO picks keys for you"], GREEN);
    b += box(16, 172, 608, 42, { fill: C.box, stroke: C.boxS }) + t(320, 189, "CLUSTER BY AUTO needs predictive optimization on a Unity Catalog managed table", { size: 8.6 }) + t(320, 204, "OPTIMIZE t FULL reclusters old data after you change keys (DBR 16.0+)", { size: 8, fill: C.dim });
    b += banner(226, "Not compatible with partitioning or ZORDER on the same table. GA for Delta on DBR 15.4 LTS+.");
    return svg(262, b, "Partitioning and Z-order compared with liquid clustering");
  })();

  D["dbx-auto-cdc"] = (() => {
    let b = t(320, 22, "AUTO CDC: a change feed becomes a correct SCD1 or SCD2 table", { bold: true, size: 11 });
    b += card(16, 44, 170, 92, "change feed", ["Lakeflow Connect, Debezium,", "Delta CDF, Datastream files", "op + key + sequence"], GREY);
    b += card(226, 44, 188, 92, "AUTO CDC INTO target", ["KEYS (id)", "SEQUENCE BY seq", "APPLY AS DELETE WHEN op='D'"], DBX);
    b += arrowR(186, 90, 226, {});
    b += card(454, 40, 170, 50, "SCD TYPE 1", ["latest row per key"], GREEN);
    b += card(454, 100, 170, 50, "SCD TYPE 2", ["__START_AT / __END_AT"], BLUE);
    b += arrowR(414, 65, 454, {}) + arrowR(414, 125, 454, {});
    b += box(16, 150, 398, 50, { fill: C.box, stroke: C.boxS }) + t(215, 170, "handles out-of-order events with SEQUENCE BY", { size: 8.6 }) + t(215, 186, "(a hand-written MERGE usually does not)", { size: 8, fill: C.dim });
    b += banner(212, "APPLY CHANGES was renamed AUTO CDC; same syntax. Python: dp.create_auto_cdc_flow().");
    return svg(248, b, "AUTO CDC flow from change feed to SCD tables");
  })();

  D["dbx-ai-search"] = (() => {
    let b = t(320, 22, "AI on Databricks for data engineers: govern, enrich, retrieve, serve", { bold: true, size: 11 });
    b += card(16, 44, 140, 70, "Unity Catalog", ["Delta tables, volumes", "permissions + lineage"], DBX);
    b += card(172, 44, 140, 70, "AI Functions", ["ai_query, ai_classify", "ai_extract, ai_parse_document"], BLUE);
    b += card(328, 44, 140, 70, "AI Search index", ["formerly Vector Search", "syncs from a Delta table"], AMBER);
    b += card(484, 44, 140, 70, "Model Serving", ["endpoints for LLMs", "and your models"], GREEN);
    b += arrowR(156, 79, 172, {}) + arrowR(312, 79, 328, {}) + arrowR(468, 79, 484, {});
    b += box(16, 130, 608, 40, { fill: C.box, stroke: C.boxS }) + t(320, 147, "SELECT * FROM vector_search(index => 'main.support.tickets_idx', query_text => 'refund', num_results => 5)", { size: 7.8, mono: true }) + t(320, 162, "runs on serverless SQL warehouses (not classic)", { size: 7.8, fill: C.dim });
    b += box(16, 182, 608, 30, { fill: C.good, stroke: C.goodS }) + t(320, 201, "MLflow 3: tracing, evaluation and prompt versions for anything above", { size: 8.6, fill: C.goodT });
    b += banner(222, "Inference is billed on top of the compute you call it from: check the AI_FUNCTIONS / MODEL_SERVING usage rows.");
    return svg(258, b, "Databricks AI Functions, AI Search, Model Serving and MLflow");
  })();

  /* ---------- Snowflake ---------- */
  D["snow-cost-credits"] = (() => {
    let b = t(320, 22, "Where Snowflake credits go, and which control stops each one", { bold: true, size: 11 });
    b += card(16, 42, 196, 86, "virtual warehouses", ["size x seconds running", "60 s minimum per resume", "Gen2 XS = 1.35 cr/h"], SNOW);
    b += card(222, 42, 196, 86, "serverless features", ["Snowpipe, tasks, clustering,", "MVs, search optimization", "own multipliers"], BLUE);
    b += card(428, 42, 196, 86, "cloud services", ["compile, metadata, auth", "free up to 10% of daily", "warehouse credits"], GREY);
    b += arrowD(114, 128, 152) + arrowD(320, 128, 152) + arrowD(526, 128, 152);
    b += card(16, 152, 196, 62, "resource monitors", ["warehouses ONLY", "notify / suspend at %"], AMBER);
    b += card(222, 152, 196, 62, "budgets", ["serverless + AI spend", "alerts by tag or object"], AMBER);
    b += card(428, 152, 196, 62, "query + design", ["auto_suspend 60 s, pruning", "QUERY_ATTRIBUTION_HISTORY"], GREEN);
    b += banner(226, "List price per credit (AWS US East): Standard $2, Enterprise $3, Business Critical $4. Storage $23/TB-month.");
    return svg(262, b, "Snowflake credit consumers and the controls for each");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
