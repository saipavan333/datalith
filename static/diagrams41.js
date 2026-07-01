/* Datalith — diagram pack 41 (GCP for DE, module 2). Clean geometry. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    gB:"#16294d", gBs:"#4285F4", gBt:"#9ec1fb", gG:"#13351f", gGs:"#34A853", gGt:"#86d9a4",
    gY:"#3a3410", gYs:"#FBBC04", gYt:"#fdd766", gR:"#3d1a18", gRs:"#EA4335", gRt:"#f3a39c" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* gcp-dataproc — managed Spark/Hadoop */
  D["gcp-dataproc"] = (() => {
    let b = t(320, 20, "Dataproc — managed Spark / Hadoop", { bold: true });
    b += box(16, 40, 408, 130, { r: 10, fill: C.card, stroke: C.boxS }) + t(28, 58, "Dataproc cluster", { a: "start", bold: true, size: 9, fill: C.dim });
    b += box(40, 70, 170, 32, { r: 7, fill: C.gB, stroke: C.gBs }) + t(125, 90, "Master node", { bold: true, size: 8.6, fill: C.gBt });
    b += box(40, 112, 170, 46, { r: 7, fill: C.gG, stroke: C.gGs }) + t(125, 131, "Worker nodes", { bold: true, size: 8.6, fill: C.gGt }) + t(125, 145, "Spark executors", { size: 6.8, fill: C.dim });
    b += box(238, 112, 170, 46, { r: 7, fill: C.gG, stroke: C.gGs }) + t(323, 131, "Secondary workers", { bold: true, size: 8.4, fill: C.gGt }) + t(323, 145, "preemptible · cheap", { size: 6.8, fill: C.dim });
    b += ln(125, 102, 125, 107) + ln(125, 107, 323, 107) + arrowD(125, 107, 112) + arrowD(323, 107, 112);
    b += box(16, 180, 408, 26, { r: 7, fill: C.gY, stroke: C.gYs }) + t(220, 197, "Cloud Storage (GCS connector) — storage, not HDFS → ephemeral clusters", { size: 8, fill: C.gYt });
    b += box(444, 70, 180, 44, { r: 8, fill: C.gB, stroke: C.gBs }) + t(534, 89, "Dataproc Serverless", { bold: true, size: 8.8, fill: C.gBt }) + t(534, 103, "submit a job · no cluster", { size: 6.6, fill: C.dim });
    b += box(444, 126, 180, 40, { r: 8 }) + t(534, 144, "Dataproc on GKE", { bold: true, size: 8.8 }) + t(534, 157, "run on Kubernetes", { size: 6.8, fill: C.dim });
    b += t(320, 224, "Managed Spark/Hadoop/Hive/Presto: spin up an ephemeral cluster that reads & writes GCS, use preemptible workers for cost — or go Dataproc Serverless.", { size: 8, fill: C.dim });
    return svg(238, b, "Dataproc");
  })();

  /* gcp-pubsub — messaging & streaming */
  D["gcp-pubsub"] = (() => {
    let b = t(320, 20, "Pub/Sub — global messaging & streaming", { bold: true });
    b += box(16, 70, 110, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(71, 90, "Publishers", { bold: true, size: 9, fill: C.accT }) + t(71, 104, "apps · services", { size: 6.8, fill: C.dim });
    b += box(160, 66, 150, 52, { r: 9, fill: C.gY, stroke: C.gYs, sw: 2 }) + t(235, 87, "Topic", { bold: true, size: 10, fill: C.gYt }) + t(235, 103, "durable · at-least-once", { size: 7, fill: C.dim });
    b += arrowR(126, 92, 156);
    b += box(360, 52, 150, 34, { r: 7, fill: C.gB, stroke: C.gBs }) + t(435, 73, "Subscription A · push", { size: 7.8, fill: C.gBt });
    b += box(360, 110, 150, 34, { r: 7, fill: C.gB, stroke: C.gBs }) + t(435, 131, "Subscription B · pull", { size: 7.8, fill: C.gBt });
    b += ln(310, 92, 335, 92) + ln(335, 69, 335, 127) + arrowR(335, 69, 358) + arrowR(335, 127, 358);
    b += box(540, 52, 86, 34, { r: 7, fill: C.gG, stroke: C.gGs }) + t(583, 73, "Dataflow", { size: 7.8, fill: C.gGt });
    b += box(540, 110, 86, 34, { r: 7, fill: C.gG, stroke: C.gGs }) + t(583, 131, "worker", { size: 7.8, fill: C.gGt });
    b += arrowR(510, 69, 538) + arrowR(510, 127, 538);
    b += box(16, 162, 610, 26, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(320, 179, "fan-out to many subscriptions · ordering keys keep per-key order · dead-letter topic for poison messages", { size: 8, fill: C.warn });
    b += t(320, 210, "One topic fans out to many independent subscriptions (push or pull); each subscriber reads at its own pace — decoupling producers from consumers.", { size: 8, fill: C.dim });
    return svg(224, b, "Pub/Sub");
  })();

  /* gcp-composer — managed Airflow */
  D["gcp-composer"] = (() => {
    let b = t(320, 20, "Cloud Composer — managed Apache Airflow", { bold: true });
    b += box(40, 66, 118, 40, { r: 8, fill: C.gB, stroke: C.gBs }) + t(99, 90, "extract", { bold: true, size: 8.6, fill: C.gBt });
    b += box(202, 66, 120, 40, { r: 8, fill: C.gB, stroke: C.gBs }) + t(262, 90, "transform", { bold: true, size: 8.6, fill: C.gBt });
    b += box(366, 66, 110, 40, { r: 8, fill: C.gB, stroke: C.gBs }) + t(421, 90, "load", { bold: true, size: 8.6, fill: C.gBt });
    b += box(520, 66, 100, 40, { r: 8 }) + t(570, 90, "notify", { size: 8.4 });
    b += arrowR(158, 86, 200) + arrowR(322, 86, 364) + arrowR(476, 86, 518);
    b += t(320, 130, "a DAG = tasks with dependencies", { size: 8, fill: C.dim });
    b += box(16, 150, 610, 28, { r: 8, fill: C.gG, stroke: C.gGs }) + t(320, 168, "Airflow scheduler on GKE · Python DAGs · retries · backfills · sensors · 100s of operators", { size: 8.2, fill: C.gGt });
    b += t(320, 204, "Composer runs Apache Airflow for you: author DAGs in Python, schedule and backfill them, and orchestrate Dataflow, Dataform, BigQuery and more.", { size: 8, fill: C.dim });
    return svg(218, b, "Cloud Composer");
  })();

  /* gcp-dataform — ELT in BigQuery */
  D["gcp-dataform"] = (() => {
    let b = t(320, 20, "Dataform — ELT in BigQuery (SQLX)", { bold: true });
    b += box(30, 64, 134, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(97, 83, "declaration", { bold: true, size: 8.6, fill: C.accT }) + t(97, 96, "src: raw.orders", { size: 6.8, mono: true, fill: C.dim });
    b += box(206, 64, 134, 40, { r: 8, fill: C.gB, stroke: C.gBs }) + t(273, 83, "stg_orders", { bold: true, size: 8.6, fill: C.gBt }) + t(273, 96, "view", { size: 6.8, fill: C.dim });
    b += box(382, 64, 140, 40, { r: 8, fill: C.gG, stroke: C.gGs }) + t(452, 83, "fct_orders", { bold: true, size: 8.6, fill: C.gGt }) + t(452, 96, "incremental table", { size: 6.6, fill: C.dim });
    b += arrowR(164, 84, 204) + arrowR(340, 84, 380);
    b += box(382, 130, 140, 32, { r: 7, fill: C.gR, stroke: C.gRs }) + t(452, 150, "assertions (tests)", { size: 7.8, fill: C.gRt });
    b += arrowD(452, 104, 130);
    b += t(548, 84, "ref() builds", { a: "start", size: 7, fill: C.dim }) + t(548, 95, "the DAG", { a: "start", size: 7, fill: C.dim });
    b += box(16, 176, 610, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 193, "SQLX models + ref() → a dependency DAG; incremental builds, assertions as tests, version-controlled — dbt-style, native to BigQuery", { size: 7.8, fill: C.warn });
    b += t(320, 222, "Dataform turns SQL into engineered ELT: declare sources, ref() between models to build the DAG, test with assertions, and build incrementally in BigQuery.", { size: 8, fill: C.dim });
    return svg(236, b, "Dataform");
  })();

  /* gcp-datastream-bigtable — CDC & NoSQL */
  D["gcp-datastream-bigtable"] = (() => {
    let b = t(320, 20, "Datastream & Bigtable — CDC and NoSQL", { bold: true });
    b += t(113, 44, "Datastream — serverless CDC", { bold: true, size: 9, fill: C.gBt });
    b += box(28, 54, 170, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(113, 72, "Source DB", { bold: true, size: 8.6, fill: C.accT }) + t(113, 86, "MySQL · Postgres · Oracle", { size: 6.6, fill: C.dim });
    b += box(28, 116, 170, 36, { r: 8, fill: C.gB, stroke: C.gBs }) + t(113, 138, "Datastream (CDC)", { size: 8, fill: C.gBt });
    b += box(28, 170, 170, 36, { r: 8, fill: C.gG, stroke: C.gGs }) + t(113, 192, "BigQuery / GCS", { size: 8, fill: C.gGt });
    b += arrowD(113, 98, 116) + arrowD(113, 152, 170);
    b += t(511, 44, "Bigtable — wide-column NoSQL", { bold: true, size: 9, fill: C.gBt });
    b += box(426, 54, 170, 44, { r: 8, fill: C.gB, stroke: C.gBs }) + t(511, 72, "row key → columns", { bold: true, size: 8.4, fill: C.gBt }) + t(511, 86, "sorted by row key", { size: 6.8, fill: C.dim });
    b += box(426, 116, 170, 36, { r: 8 }) + t(511, 138, "single-digit-ms reads", { size: 8 });
    b += box(426, 170, 170, 36, { r: 8, fill: C.gG, stroke: C.gGs }) + t(511, 192, "HBase API · huge scale", { size: 8, fill: C.gGt });
    b += arrowD(511, 98, 116) + arrowD(511, 152, 170);
    b += ln(320, 48, 320, 206, { dash: true, sw: 1.2 });
    b += t(320, 226, "Datastream replicates operational DBs into BigQuery/GCS with change-data-capture; Bigtable serves massive low-latency key lookups (and feeds the lake).", { size: 8, fill: C.dim });
    return svg(238, b, "Datastream and Bigtable");
  })();

  /* gcp-dataplex — governance */
  D["gcp-dataplex"] = (() => {
    let b = t(320, 20, "Dataplex — govern the lakehouse", { bold: true });
    b += box(16, 70, 174, 72, { r: 9, fill: C.acc, stroke: C.accS }) + t(103, 96, "GCS + BigQuery", { bold: true, size: 9, fill: C.accT }) + t(103, 113, "lakes · zones", { size: 7.4, fill: C.dim }) + t(103, 127, "datasets · tables", { size: 7.4, fill: C.dim });
    b += box(220, 64, 200, 84, { r: 10, fill: C.gB, stroke: C.gBs, sw: 2 }) + t(320, 86, "Dataplex", { bold: true, size: 10.5, fill: C.gBt }) + t(320, 104, "catalog · lineage", { size: 7.6, fill: C.dim }) + t(320, 118, "data quality", { size: 7.6, fill: C.dim }) + t(320, 132, "policy tags · row security", { size: 7.4, fill: C.dim });
    b += box(450, 70, 174, 72, { r: 9, fill: C.gG, stroke: C.gGs }) + t(537, 92, "outcomes", { bold: true, size: 9, fill: C.gGt }) + t(537, 109, "discover · trust", { size: 7.4, fill: C.dim }) + t(537, 123, "secure · share", { size: 7.4, fill: C.dim });
    b += arrowR(190, 106, 218) + arrowR(420, 106, 448);
    b += box(16, 168, 608, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 186, "data mesh: organize lakes into zones, auto-catalog & profile, track lineage, attach policy tags + row-level security on BigQuery", { size: 8, fill: C.warn });
    b += t(320, 222, "Dataplex is the governance plane over GCS + BigQuery: one place to catalog, find, trust (quality + lineage), and secure (policy tags) data across the lakehouse.", { size: 8, fill: C.dim });
    return svg(236, b, "Dataplex");
  })();

  /* gcp-reference-arch — capstone */
  D["gcp-reference-arch"] = (() => {
    let b = t(320, 18, "A reference GCP data platform", { bold: true });
    const src = [["Operational DBs", 115], ["SaaS apps", 320], ["Events / IoT", 525]];
    src.forEach(([s, x]) => b += box(x - 85, 30, 170, 30, { r: 7, fill: C.acc, stroke: C.accS }) + t(x, 49, s, { size: 8, fill: C.accT }));
    const ing = [["Datastream (CDC)", 115], ["Transfer / DTS", 320], ["Pub/Sub → Dataflow", 525]];
    ing.forEach(([s, x]) => b += box(x - 85, 78, 170, 30, { r: 7 }) + t(x, 97, s, { size: 7.6 }));
    [115, 320, 525].forEach(x => b += arrowD(x, 60, 78) + arrowD(x, 108, 126));
    b += box(30, 126, 580, 44, { r: 9, fill: C.gB, stroke: C.gBs, sw: 2 }) + t(320, 145, "GCS lake + BigQuery:  raw → curated → marts   (BigLake / Iceberg)", { bold: true, size: 9, fill: C.gBt }) + t(320, 161, "transform with Dataform (SQL) · Dataflow / Dataproc (code)", { size: 7.6, fill: C.dim });
    b += box(150, 190, 200, 34, { r: 8, fill: C.gG, stroke: C.gGs }) + t(250, 211, "BigQuery (serve)", { size: 8.4, fill: C.gGt });
    b += box(388, 190, 150, 34, { r: 8 }) + t(463, 211, "Looker (BI)", { size: 8.4 });
    b += arrowD(250, 170, 190) + arrowR(350, 207, 386);
    b += t(320, 244, "Govern with Dataplex (catalog/lineage/quality/policy) · orchestrate with Cloud Composer (Airflow) · serverless-first, BigQuery-centric.", { size: 7.8, fill: C.dim });
    return svg(254, b, "GCP reference architecture");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
