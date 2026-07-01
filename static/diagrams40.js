/* Datalith — diagram pack 40 (GCP for DE, module 1). Clean geometry. */
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
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const dbl=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o)+triL(x1,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* gcp-stack — the GCP data stack */
  D["gcp-stack"] = (() => {
    let b = t(320, 20, "The GCP data stack — a serverless lakehouse", { bold: true });
    b += box(14, 50, 84, 42, { r: 8, fill: C.acc, stroke: C.accS }) + t(56, 70, "sources", { bold: true, size: 9, fill: C.accT }) + t(56, 84, "apps · DBs", { size: 7.2, fill: C.dim });
    b += box(114, 50, 118, 42, { r: 8 }) + t(173, 70, "ingest", { bold: true, size: 9 }) + t(173, 84, "Pub/Sub · Datastream", { size: 6.8, fill: C.dim });
    b += box(248, 44, 196, 54, { r: 9, fill: C.gB, stroke: C.gBs, sw: 2 }) + t(346, 62, "GCS lake + BigQuery", { bold: true, size: 9.5, fill: C.gBt }) + t(346, 78, "raw → curated → marts", { size: 7.6, fill: C.dim }) + t(346, 90, "(Parquet · Iceberg / BigLake)", { size: 7, fill: C.dim });
    b += box(460, 50, 108, 42, { r: 8, fill: C.gG, stroke: C.gGs }) + t(514, 70, "query", { bold: true, size: 9, fill: C.gGt }) + t(514, 84, "BigQuery", { size: 7.2, fill: C.dim });
    b += box(584, 50, 42, 42, { r: 8 }) + t(605, 70, "BI", { bold: true, size: 9 }) + t(605, 84, "Looker", { size: 6.6, fill: C.dim });
    b += arrowR(98, 71, 112) + arrowR(232, 71, 246) + arrowR(444, 71, 458) + arrowR(568, 71, 582);
    b += box(16, 116, 610, 26, { r: 7, fill: C.card, stroke: C.gBs }) + t(320, 133, "BigLake — query GCS & Apache Iceberg as BigQuery tables; BigQuery Omni reaches AWS / Azure", { size: 8.2, fill: C.gBt });
    b += box(16, 148, 610, 26, { r: 7, fill: C.card, stroke: C.gGs }) + t(320, 165, "Dataplex — catalog, lineage, data quality & governance across the lake", { size: 8.2, fill: C.gGt });
    b += t(320, 196, "BigQuery is the centerpiece: a serverless warehouse that also queries the GCS lake (BigLake/Iceberg) — ingest with Pub/Sub & Datastream, transform with Dataflow/Dataform.", { size: 8, fill: C.dim });
    return svg(212, b, "GCP data stack");
  })();

  /* gcp-gcs — Cloud Storage */
  D["gcp-gcs"] = (() => {
    let b = t(320, 20, "Cloud Storage — the data-lake foundation", { bold: true });
    b += box(16, 46, 330, 140, { r: 10, fill: C.gB, stroke: C.gBs }) + t(40, 66, "bucket: gs://acme-lake/", { a: "start", bold: true, size: 9.5, mono: true, fill: C.gBt });
    const tree = ["events/", "  dt=2025-03-01/        ← partition by date", "    region=US/         ← partition by region", "      part-0.parquet   ← columnar object"];
    tree.forEach((s, i) => b += t(40, 90 + i * 20, s, { a: "start", size: 8.2, mono: true, fill: i === 3 ? C.gBt : C.tx }));
    b += t(40, 174, "objects under a prefix — engines treat prefixes as partitions", { a: "start", size: 7.6, fill: C.dim });
    b += t(498, 58, "storage classes (lifecycle)", { size: 8.6, bold: true });
    const sc = [["Standard", "hot", C.good], ["Nearline", "≥ 30 days", C.warnFill], ["Coldline", "≥ 90 days", C.acc], ["Archive", "≥ 365 days", C.box]];
    sc.forEach(([nm, sub, col], i) => { const y = 68 + i * 30; b += box(388, y, 220, 24, { r: 6, fill: col, stroke: C.boxS }) + t(400, y + 16, nm, { a: "start", bold: true, size: 8.2 }) + t(600, y + 16, sub, { a: "end", size: 7.4, fill: C.dim }); if (i < 3) b += ln(498, y + 24, 498, y + 30, { sw: 1.3 }); });
    b += box(16, 196, 608, 26, { r: 7, fill: C.card, stroke: C.gBs }) + t(320, 213, "BigLake — expose GCS data (incl. Iceberg) as BigQuery tables, queried in place with no load", { size: 8.2, fill: C.gBt });
    b += t(320, 244, "One durable, cheap, open store: partition by prefix, tier cold data with lifecycle rules, and surface it to BigQuery through BigLake.", { size: 8, fill: C.dim });
    return svg(256, b, "Cloud Storage");
  })();

  /* gcp-bigquery — serverless architecture */
  D["gcp-bigquery"] = (() => {
    let b = t(320, 20, "BigQuery — serverless lakehouse architecture", { bold: true });
    b += box(40, 54, 214, 56, { r: 9, fill: C.gB, stroke: C.gBs, sw: 2 }) + t(147, 75, "Managed storage", { bold: true, size: 9.5, fill: C.gBt }) + t(147, 91, "Colossus · columnar Capacitor", { size: 7.2, fill: C.dim });
    b += box(386, 54, 214, 56, { r: 9, fill: C.gG, stroke: C.gGs, sw: 2 }) + t(493, 75, "Dremel engine", { bold: true, size: 9.5, fill: C.gGt }) + t(493, 91, "slots · autoscaling compute", { size: 7.2, fill: C.dim });
    b += t(320, 70, "Jupiter", { size: 7.6, fill: C.dim }) + t(320, 81, "petabit", { size: 7.6, fill: C.dim }) + t(320, 92, "network", { size: 7.6, fill: C.dim });
    b += dbl(258, 104, 382, { sw: 1.4 });
    b += t(320, 124, "storage & compute fully decoupled — scale each independently", { size: 7.8, fill: C.dim });
    b += box(40, 150, 250, 48, { r: 8, fill: C.card, stroke: C.gBs }) + t(165, 170, "BigLake", { bold: true, size: 9, fill: C.gBt }) + t(165, 185, "query GCS & Iceberg — no load", { size: 7.2, fill: C.dim });
    b += box(350, 150, 250, 48, { r: 8, fill: C.card, stroke: C.gGs }) + t(475, 170, "Storage Write API", { bold: true, size: 9, fill: C.gGt }) + t(475, 185, "stream rows in real time", { size: 7.2, fill: C.dim });
    b += arrowD(147, 110, 150) + arrowD(493, 110, 150);
    b += t(320, 220, "No clusters to manage: separated storage/compute means elastic slots over one copy of data — and BigLake extends BigQuery onto the open lake.", { size: 8, fill: C.dim });
    return svg(232, b, "BigQuery architecture");
  })();

  /* gcp-bigquery-tuning — performance & cost */
  D["gcp-bigquery-tuning"] = (() => {
    let b = t(320, 20, "BigQuery — performance & cost", { bold: true });
    b += box(16, 64, 120, 44, { r: 9, fill: C.gG, stroke: C.gGs }) + t(76, 84, "your SQL", { bold: true, size: 9.5, fill: C.gGt }) + t(76, 99, "WHERE dt = …", { size: 7.4, mono: true, fill: C.dim });
    b += box(186, 58, 160, 56, { r: 10, fill: C.gB, stroke: C.gBs, sw: 2 }) + t(266, 78, "BigQuery", { bold: true, size: 11, fill: C.gBt }) + t(266, 94, "prunes partitions", { size: 7.6, fill: C.dim }) + t(266, 106, "+ clusters", { size: 7.6, fill: C.dim });
    b += box(396, 64, 134, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(463, 83, "scan only", { bold: true, size: 8.6, fill: C.accT }) + t(463, 97, "matching blocks", { size: 7, fill: C.dim });
    b += box(556, 70, 70, 34, { r: 8, fill: C.gG, stroke: C.gGs }) + t(591, 91, "fast +", { size: 7.6, fill: C.gGt });
    b += arrowR(136, 86, 184) + arrowR(346, 86, 394) + arrowR(530, 86, 554);
    b += box(16, 150, 610, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "cost = TB scanned (on-demand) OR slot-time (capacity / reservations) → partition by date + cluster by key to scan less", { size: 8.4, fill: C.warn });
    b += t(320, 206, "Partitioning + clustering prune data; BI Engine caches hot data in memory and materialized views precompute rollups. Pick on-demand for spiky, slots for steady.", { size: 8, fill: C.dim });
    return svg(220, b, "BigQuery performance and cost");
  })();

  /* gcp-dataflow — Apache Beam */
  D["gcp-dataflow"] = (() => {
    let b = t(320, 20, "Dataflow — Apache Beam (batch + streaming)", { bold: true });
    b += box(16, 64, 118, 46, { r: 9, fill: C.gY, stroke: C.gYs }) + t(75, 84, "Pub/Sub", { bold: true, size: 9.5, fill: C.gYt }) + t(75, 99, "stream source", { size: 7.2, fill: C.dim });
    b += box(160, 52, 212, 70, { r: 10, fill: C.gB, stroke: C.gBs, sw: 2 }) + t(266, 71, "Dataflow — Apache Beam", { bold: true, size: 9, fill: C.gBt }) + t(266, 92, "read → window → transform → write", { size: 7.4, fill: C.dim }) + t(266, 106, "watermarks handle late data", { size: 6.8, fill: C.dim });
    b += box(398, 64, 120, 46, { r: 9, fill: C.gG, stroke: C.gGs }) + t(458, 83, "BigQuery", { bold: true, size: 9.5, fill: C.gGt }) + t(458, 98, "Storage Write API", { size: 6.8, fill: C.dim });
    b += box(540, 64, 86, 46, { r: 8 }) + t(583, 82, "one pipeline:", { size: 6.8, fill: C.dim }) + t(583, 95, "batch OR", { size: 6.8, fill: C.dim }) + t(583, 105, "streaming", { size: 6.8, fill: C.dim });
    b += arrowR(134, 87, 158) + arrowR(372, 87, 396);
    b += arrowD(266, 122, 150);
    b += box(160, 150, 212, 30, { r: 7, fill: C.gR, stroke: C.gRs }) + t(266, 169, "dead-letter queue → GCS (bad records)", { size: 7.6, fill: C.gRt });
    b += t(320, 204, "The canonical streaming pipeline: Pub/Sub → Dataflow → BigQuery. The same Beam code runs batch or streaming; windows + watermarks make late data correct.", { size: 8, fill: C.dim });
    return svg(216, b, "Dataflow Apache Beam");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
