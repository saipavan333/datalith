/* DataForge Academy — diagram pack 60 (GCP deep-dive vol. 1: BigQuery in depth). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    gB:"#1a2a52", gBS:"#4285f4", gBT:"#8ab4f8", gR:"#3d1f1d", gRS:"#ea4335", gRT:"#f28b82",
    gY:"#3a3115", gYS:"#fbbc04", gYT:"#fde293", gG:"#14331f", gGS:"#34a853", gGT:"#81c995" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+`<polygon points="${x2+7},${y-4} ${x2},${y} ${x2+7},${y+4}" style="fill:${o.stroke||C.line}"/>`;
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* bq-architecture — Dremel, slots, separated storage/compute */
  D["bq-architecture"] = (() => {
    let b = t(320, 20, "BigQuery — serverless: separated storage & compute", { bold: true });
    b += box(40, 52, 220, 64, { r: 9, fill: C.gB, stroke: C.gBS, sw: 2 }) + t(150, 72, "compute: slots (Dremel)", { bold: true, size: 8.6, fill: C.gBT }) + t(150, 90, "ephemeral query workers", { size: 7.2, fill: C.dim }) + t(150, 104, "no clusters to manage", { size: 7.2, fill: C.dim });
    b += box(380, 52, 220, 64, { r: 9, fill: C.gG, stroke: C.gGS, sw: 2 }) + t(490, 72, "storage: Colossus", { bold: true, size: 8.6, fill: C.gGT }) + t(490, 90, "columnar (Capacitor),", { size: 7.2, fill: C.dim }) + t(490, 104, "durable, compressed", { size: 7.2, fill: C.dim });
    b += box(250, 128, 140, 24, { r: 7, fill: C.gY, stroke: C.gYS }) + t(320, 144, "Jupiter network", { bold: true, size: 8, fill: C.gYT });
    b += arrowR(260, 92, 290, { stroke: C.gYS }) + arrowL(380, 92, 350, { stroke: C.gYS });
    b += ln(150, 116, 150, 140, { stroke: C.gYS }) + ln(150, 140, 248, 140, { stroke: C.gYS }) + ln(490, 116, 490, 140, { stroke: C.gYS }) + ln(490, 140, 392, 140, { stroke: C.gYS });
    b += box(16, 166, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 176, "storage and compute scale independently; a query grabs thousands of slots on demand over the petabit Jupiter network", { size: 6.9, fill: C.warn }) + t(320, 187, "fully serverless — no infrastructure to provision or tune for capacity", { size: 6.8, fill: C.dim });
    b += t(320, 210, "BigQuery decouples columnar storage (Colossus) from massively-parallel compute (Dremel slots) — serverless scale.", { size: 7, fill: C.dim });
    return svg(224, b, "BigQuery architecture");
  })();

  /* bq-partition-cluster — partition + cluster */
  D["bq-partition-cluster"] = (() => {
    let b = t(320, 20, "Partitioning & clustering — scan far less", { bold: true });
    b += t(150, 46, "partition (by date) → prune", { size: 8, bold: true, fill: C.gBT });
    [["2025-05-01", false], ["2025-05-02", true], ["2025-05-03", false]].forEach(([d, hit], i) => { const y = 56 + i * 24; b += box(24, y, 150, 18, { r: 4, fill: hit ? C.gG : C.box, stroke: hit ? C.gGS : C.boxS }) + t(99, y + 13, d, { size: 7.2, mono: true, fill: hit ? C.gGT : C.dim }); });
    b += t(470, 46, "cluster (by user_id) → skip blocks", { size: 8, bold: true, fill: C.gYT });
    b += box(330, 56, 280, 60, { r: 8, fill: C.gY, stroke: C.gYS }) + t(470, 74, "within a partition, rows sorted by", { size: 7.2, fill: C.dim }) + t(470, 86, "cluster keys → block min/max", { size: 7.2, fill: C.dim }) + t(470, 102, "WHERE user_id=42 reads few blocks", { size: 7.2, mono: true, fill: C.gYT });
    b += arrowR(178, 80, 328, { stroke: C.gGS });
    b += box(16, 130, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 140, "partition filter prunes whole partitions; clustering sorts within them so the engine skips blocks — both cut bytes scanned", { size: 6.9, fill: C.warn }) + t(320, 151, "partition by date/ingestion/integer-range; cluster on up to 4 high-cardinality filter/join columns", { size: 6.8, fill: C.dim });
    b += t(320, 174, "Partitioning + clustering are the top BigQuery cost/perf levers — prune partitions, then skip blocks within them.", { size: 7, fill: C.dim });
    return svg(188, b, "BigQuery partitioning and clustering");
  })();

  /* bq-pricing — on-demand vs capacity */
  D["bq-pricing"] = (() => {
    let b = t(320, 20, "Pricing — on-demand (per TB) vs capacity (slots)", { bold: true });
    b += box(24, 50, 290, 92, { r: 9, fill: C.gB, stroke: C.gBS, sw: 2 }) + t(169, 68, "on-demand", { bold: true, size: 9, fill: C.gBT }) + t(169, 86, "$ per TB scanned", { size: 7.6, fill: C.dim }) + t(169, 100, "no commitment, simple", { size: 7.2, fill: C.dim }) + t(169, 118, "→ reduce bytes = reduce $", { size: 7.4, fill: C.gBT }) + t(169, 132, "(partitioning, column select)", { size: 6.8, fill: C.dim });
    b += box(326, 50, 290, 92, { r: 9, fill: C.gG, stroke: C.gGS, sw: 2 }) + t(471, 68, "capacity (slots / editions)", { bold: true, size: 8.6, fill: C.gGT }) + t(471, 86, "reserve/autoscale slots", { size: 7.6, fill: C.dim }) + t(471, 100, "predictable cost at scale", { size: 7.2, fill: C.dim }) + t(471, 118, "Standard/Enterprise editions", { size: 7.2, fill: C.dim }) + t(471, 132, "(steady heavy workloads)", { size: 6.8, fill: C.dim });
    b += box(16, 156, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 166, "on-demand bills bytes scanned (control via layout); capacity buys slots (autoscaling editions) for steady heavy use", { size: 6.9, fill: C.warn }) + t(320, 177, "controls: partition/cluster, BI Engine, materialized views, custom quotas, maximum-bytes-billed", { size: 6.8, fill: C.dim });
    return svg(192, b, "BigQuery pricing");
  })();

  /* bq-loading — batch, streaming, external */
  D["bq-loading"] = (() => {
    let b = t(320, 20, "Loading — batch (free), streaming, external", { bold: true });
    b += box(20, 50, 160, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(100, 68, "batch load", { bold: true, size: 8.6, fill: C.accT }) + t(100, 85, "from GCS (Parquet/Avro/", { size: 6.8, fill: C.dim }) + t(100, 96, "CSV/JSON) — free", { size: 6.8, fill: C.gGT });
    b += box(20, 116, 160, 42, { r: 9, fill: C.gR, stroke: C.gRS }) + t(100, 133, "streaming", { bold: true, size: 8.4, fill: C.gRT }) + t(100, 149, "Storage Write API (real-time)", { size: 6.6, fill: C.dim });
    b += box(238, 76, 170, 56, { r: 10, fill: C.gB, stroke: C.gBS, sw: 2 }) + t(323, 98, "BigQuery", { bold: true, size: 9.5, fill: C.gBT }) + t(323, 116, "managed storage", { size: 7.4, fill: C.dim });
    b += box(460, 76, 164, 56, { r: 9, fill: C.gY, stroke: C.gYS }) + t(542, 96, "external tables", { bold: true, size: 8.2, fill: C.gYT }) + t(542, 114, "query GCS in place", { size: 7, fill: C.dim });
    b += arrowR(180, 78, 236, { stroke: C.accS }) + arrowR(180, 137, 212, { stroke: C.gRS }) + ln(212, 137, 212, 104, { stroke: C.gRS }) + arrowR(212, 104, 236, { stroke: C.gRS });
    b += arrowL(460, 104, 410, { stroke: C.gYS });
    b += box(16, 166, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 183, "batch loads are FREE; streaming (Storage Write API) is real-time but billed; external/BigLake query data in place", { size: 6.9, fill: C.warn });
    return svg(200, b, "BigQuery loading");
  })();

  /* bq-optimization — reduce bytes & shuffle */
  D["bq-optimization"] = (() => {
    let b = t(320, 20, "Query optimization — scan less, shuffle smart", { bold: true });
    const rows = [["select only needed columns", "columnar → never SELECT *"], ["filter on partition + cluster keys", "prune partitions, skip blocks"], ["denormalize / nested+repeated", "avoid big shuffles/joins"], ["broadcast small joins; filter early", "less data through stages"], ["approx aggregations (APPROX_*)", "cheap big-cardinality counts"], ["read the query execution plan", "find skew, stages, bytes"]];
    rows.forEach(([h, d], i) => { const y = 48 + i * 26; b += box(34, y, 14, 14, { r: 3, fill: C.gGS, stroke: C.gGS }) + t(58, y + 12, h, { a: "start", size: 8, fill: C.gGT, bold: true }) + t(366, y + 12, d, { a: "start", size: 7.4, fill: C.dim }); });
    b += box(16, 208, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 224, "on-demand bills bytes scanned, so column/partition pruning is cost; for big joins, manage shuffle & skew via layout", { size: 6.9, fill: C.warn });
    return svg(242, b, "BigQuery query optimization");
  })();

  /* bq-advanced — MV, BI Engine, BQML, BigLake */
  D["bq-advanced"] = (() => {
    let b = t(320, 20, "Advanced — MVs, BI Engine, BQML, BigLake", { bold: true });
    const cards = [["materialized views", "precompute aggregates;\nauto-refresh + smart tuning", C.gB, C.gBS, C.gBT], ["BI Engine", "in-memory acceleration\nfor sub-second dashboards", C.gR, C.gRS, C.gRT], ["BigQuery ML", "train/predict in SQL\n(CREATE MODEL)", C.gY, C.gYS, C.gYT], ["BigLake / external", "govern & query GCS +\nother clouds, fine-grained", C.gG, C.gGS, C.gGT]];
    cards.forEach(([h, d, f, st, tc], i) => { const x = 20 + (i % 2) * 306, y = 48 + Math.floor(i / 2) * 70; b += box(x, y, 290, 58, { r: 9, fill: f, stroke: st }) + t(x + 145, y + 20, h, { bold: true, size: 8.8, fill: tc }); d.split("\n").forEach((ln2, k) => b += t(x + 145, y + 36 + k * 13, ln2, { size: 7.2, fill: C.dim })); });
    b += box(16, 192, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 209, "BigQuery is a platform: precompute (MVs), accelerate (BI Engine), ML-in-SQL (BQML), and govern external data (BigLake)", { size: 6.9, fill: C.warn });
    return svg(232, b, "BigQuery advanced features");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
