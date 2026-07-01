/* Datalith — diagram pack 38 (AWS for Data Engineering). Clean geometry. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    aws:"#3a2a10", awsS:"#ff9900", awsT:"#ffbf66" };
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
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* aws-stack — the serverless lakehouse pipeline */
  D["aws-stack"] = (() => {
    let b = t(320, 20, "The AWS data stack — a serverless lakehouse pipeline", { bold: true });
    b += box(14, 50, 84, 42, { r: 8, fill: C.acc, stroke: C.accS }) + t(56, 70, "sources", { bold: true, size: 9, fill: C.accT }) + t(56, 84, "apps · DBs", { size: 7.2, fill: C.dim });
    b += box(114, 50, 108, 42, { r: 8 }) + t(168, 70, "ingest", { bold: true, size: 9, fill: C.tx }) + t(168, 84, "Kinesis · DMS · Zero-ETL", { size: 6.8, fill: C.dim });
    b += box(238, 44, 196, 54, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(336, 62, "S3 data lake", { bold: true, size: 10, fill: C.awsT }) + t(336, 78, "Raw → Processed → Curated", { size: 7.6, fill: C.dim }) + t(336, 90, "(Parquet · S3 Tables / Iceberg)", { size: 7, fill: C.dim });
    b += box(450, 50, 116, 42, { r: 8, fill: C.good, stroke: C.goodS }) + t(508, 70, "query", { bold: true, size: 9, fill: C.goodT }) + t(508, 84, "Athena · Redshift", { size: 7.2, fill: C.dim });
    b += box(582, 50, 44, 42, { r: 8 }) + t(604, 70, "BI", { bold: true, size: 9, fill: C.tx }) + t(604, 84, "QS", { size: 7.2, fill: C.dim });
    b += arrowR(98, 71, 112) + arrowR(222, 71, 236) + arrowR(434, 71, 448) + arrowR(566, 71, 580);
    b += box(16, 116, 610, 26, { r: 7, fill: C.card, stroke: C.accS }) + t(320, 133, "AWS Glue Data Catalog — one shared schema for Athena, Redshift, EMR & Spark", { size: 8.4, fill: C.accT });
    b += box(16, 148, 610, 26, { r: 7, fill: C.card, stroke: C.warn }) + t(320, 165, "Lake Formation / SageMaker Lakehouse — central permissions & governance over the lake", { size: 8.4, fill: C.warn });
    b += t(320, 196, "land raw in S3 → catalog it with Glue → transform to Parquet/Iceberg → query serverlessly (Athena) or in the warehouse (Redshift)", { size: 8.4, fill: C.dim });
    return svg(212, b, "AWS data stack");
  })();

  /* aws-s3-lake — S3 as the data lake */
  D["aws-s3-lake"] = (() => {
    let b = t(320, 20, "Amazon S3 — the data-lake foundation", { bold: true });
    b += box(16, 46, 330, 138, { r: 10, fill: C.aws, stroke: C.awsS }) + t(40, 66, "bucket: s3://acme-lake/", { a: "start", bold: true, size: 9.5, mono: true, fill: C.awsT });
    const tree = ["events/", "  dt=2025-03-01/        ← partition by date", "    region=US/         ← partition by region", "      part-0.parquet   ← columnar object"];
    tree.forEach((s, i) => b += t(40, 90 + i * 20, s, { a: "start", size: 8.2, mono: true, fill: i === 3 ? C.awsT : C.tx }));
    b += t(40, 172, "prefixes = partitions → engines prune to scan less", { a: "start", size: 7.8, fill: C.dim });
    b += t(498, 56, "storage classes (lifecycle)", { size: 8.6, bold: true, fill: C.tx });
    const sc = [["S3 Standard", "hot", C.good], ["S3 Standard-IA", "warm", C.warn], ["S3 Glacier", "cold / archive", C.acc]];
    sc.forEach(([nm, sub, col], i) => { const y = 70 + i * 34; b += box(388, y, 220, 26, { r: 6, fill: col, stroke: C.boxS }) + t(400, y + 17, nm, { a: "start", bold: true, size: 8.4 }) + t(600, y + 17, sub, { a: "end", size: 7.6, fill: C.dim }); if (i < 2) b += arrowD(498, y + 26, y + 34); });
    b += box(388, 172, 220, 26, { r: 6, fill: C.card, stroke: C.awsS }) + t(498, 189, "S3 Tables = managed Iceberg", { size: 8, fill: C.awsT });
    b += t(320, 212, "one durable, cheap, open store for all your data; partition by prefix, tier with lifecycle, and use S3 Tables for managed Iceberg", { size: 8.2, fill: C.dim });
    return svg(226, b, "Amazon S3 data lake");
  })();

  /* aws-glue — catalog + ETL */
  D["aws-glue"] = (() => {
    let b = t(320, 20, "AWS Glue — the catalog and serverless Spark ETL", { bold: true });
    b += box(16, 52, 110, 40, { r: 8 }) + t(71, 72, "Crawler", { bold: true, size: 9, fill: C.tx }) + t(71, 85, "infers schema", { size: 7, fill: C.dim });
    b += box(255, 48, 150, 48, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(330, 68, "Glue Data Catalog", { bold: true, size: 9, fill: C.awsT }) + t(330, 83, "tables · schemas · partitions", { size: 6.8, fill: C.dim });
    b += arrowR(126, 72, 253);
    b += t(470, 58, "engines read it:", { a: "start", size: 7.4, fill: C.dim });
    const eng = ["Athena", "Redshift", "EMR / Spark"];
    eng.forEach((e, i) => b += t(472, 74 + i * 13, "↤ " + e, { a: "start", size: 8.4, fill: C.goodT }));
    b += arrowL(468, 80, 407);
    b += box(60, 130, 120, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(120, 150, "S3 raw", { bold: true, size: 9, fill: C.accT }) + t(120, 163, "JSON / CSV", { size: 7, fill: C.dim });
    b += box(260, 126, 140, 48, { r: 9, fill: C.good, stroke: C.goodS }) + t(330, 146, "Glue ETL (Spark)", { bold: true, size: 9, fill: C.goodT }) + t(330, 161, "clean · join · convert", { size: 7, fill: C.dim });
    b += box(470, 130, 120, 40, { r: 8, fill: C.aws, stroke: C.awsS }) + t(530, 150, "S3 curated", { bold: true, size: 9, fill: C.awsT }) + t(530, 163, "Parquet", { size: 7, fill: C.dim });
    b += arrowR(180, 150, 258) + arrowR(400, 150, 468);
    b += t(320, 196, "a crawler catalogs S3 into the Glue Data Catalog (shared by every engine); Glue Spark jobs transform raw → curated Parquet", { size: 8.2, fill: C.dim });
    return svg(212, b, "AWS Glue catalog and ETL");
  })();

  /* aws-athena — serverless SQL on S3 */
  D["aws-athena"] = (() => {
    let b = t(320, 20, "Amazon Athena — serverless SQL on S3 (pay per scan)", { bold: true });
    b += box(16, 64, 110, 44, { r: 9, fill: C.good, stroke: C.goodS }) + t(71, 84, "your SQL", { bold: true, size: 9.5, fill: C.goodT }) + t(71, 99, "SELECT … FROM t", { size: 7.4, mono: true, fill: C.dim });
    b += box(176, 58, 150, 56, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(251, 78, "Athena", { bold: true, size: 11, fill: C.awsT }) + t(251, 94, "Trino / Presto", { size: 8, fill: C.dim }) + t(251, 106, "serverless — no clusters", { size: 7, fill: C.dim });
    b += box(376, 50, 130, 32, { r: 7 }) + t(441, 70, "Glue Catalog", { size: 8.4, fill: C.accT });
    b += box(376, 92, 130, 40, { r: 7, fill: C.acc, stroke: C.accS }) + t(441, 110, "scan S3", { bold: true, size: 9, fill: C.accT }) + t(441, 123, "only matching partitions", { size: 6.8, fill: C.dim });
    b += box(548, 70, 78, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(587, 90, "results", { bold: true, size: 8.6, fill: C.goodT }) + t(587, 103, "+ CTAS", { size: 7, fill: C.dim });
    b += arrowR(126, 86, 174);
    b += arrowR(326, 78, 374) + arrowR(326, 100, 374);
    b += arrowR(506, 90, 546);
    b += box(16, 150, 610, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "cost = bytes scanned → partition the data + store columnar Parquet → scan far less → pay far less (and run faster)", { size: 8.6, fill: C.warn });
    b += t(320, 204, "Athena queries S3 directly via the Glue Catalog with no servers; it also reads Iceberg / S3 Tables and can write tables with CTAS", { size: 8.2, fill: C.dim });
    return svg(218, b, "Amazon Athena");
  })();

  /* aws-redshift — the warehouse */
  D["aws-redshift"] = (() => {
    let b = t(320, 20, "Amazon Redshift — the cloud data warehouse", { bold: true });
    b += box(228, 44, 184, 32, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 64, "Leader node — plans & coordinates", { bold: true, size: 8.6, fill: C.accT });
    [0, 1, 2].forEach(i => { const x = 40 + i * 200; b += box(x, 104, 150, 44, { r: 8, fill: C.aws, stroke: C.awsS }) + t(x + 75, 123, "Compute node", { bold: true, size: 8.6, fill: C.awsT }) + t(x + 75, 137, "columnar · MPP slices", { size: 6.8, fill: C.dim }); });
    b += ln(320, 76, 320, 90) + ln(115, 90, 515, 90);
    [115, 315, 515].forEach(x => b += arrowD(x, 90, 104));
    b += box(16, 168, 290, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(161, 187, "Spectrum → query S3 directly (external tables)", { size: 8, fill: C.goodT });
    b += box(334, 168, 292, 30, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(480, 187, "streaming ingestion ← Kinesis → materialized view", { size: 8, fill: C.warn });
    b += t(320, 218, "MPP columnar warehouse (RA3 nodes or Serverless) for fast SQL; tune with dist/sort keys — Spectrum reads S3, Zero-ETL syncs sources, Iceberg read/write", { size: 7.8, fill: C.dim });
    return svg(232, b, "Amazon Redshift");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
