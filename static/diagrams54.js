/* Datalith — diagram pack 54 (AWS deep-dive vol. 2: Glue in depth). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    aws:"#3a2a10", awsS:"#ff9900", awsT:"#ffc266", vio:"#2c2350", vioS:"#a78bfa", vioT:"#c4b5fd" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* aws-glue-catalog — central metastore */
  D["aws-glue-catalog"] = (() => {
    let b = t(320, 20, "Glue Data Catalog — one metastore for the lake", { bold: true });
    b += box(220, 50, 200, 76, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(320, 70, "Glue Data Catalog", { bold: true, size: 9.5, fill: C.awsT }) + t(320, 88, "database → table →", { size: 7.6, mono: true, fill: C.dim }) + t(320, 100, "partitions", { size: 7.6, mono: true, fill: C.dim }) + t(320, 117, "schema · S3 location · SerDe", { size: 7, fill: C.dim });
    [["Athena", 40, 44], ["Redshift Spectrum", 470, 44], ["EMR / Spark", 40, 150], ["Glue ETL", 470, 150]].forEach(([s, x, y]) => b += box(x, y, 130, 30, { r: 7, fill: C.acc, stroke: C.accS }) + t(x + 65, y + 19, s, { size: 8, fill: C.accT }));
    b += arrowR(170, 59, 218, { stroke: C.awsS }) + arrowL(470, 59, 422, { stroke: C.awsS });
    b += arrowR(170, 165, 218, { stroke: C.awsS }) + arrowL(470, 165, 422, { stroke: C.awsS });
    b += ln(105, 74, 105, 150, { stroke: C.boxS }) + ln(535, 74, 535, 150, { stroke: C.boxS });
    b += box(16, 192, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 209, "one catalog defines tables once; every engine reads the same schema/location — the lake's shared metastore (Hive-compatible)", { size: 7, fill: C.warn });
    return svg(232, b, "Glue Data Catalog");
    function arrowL(x1, y, x2, o = {}) { return ln(x1, y, x2, y, o) + `<polygon points="${x2 + 7},${y - 4} ${x2},${y} ${x2 + 7},${y + 4}" style="fill:${o.stroke || C.line}"/>`; }
  })();

  /* aws-glue-crawlers — schema inference */
  D["aws-glue-crawlers"] = (() => {
    let b = t(320, 20, "Crawlers — infer schema & partitions from S3", { bold: true });
    b += box(20, 58, 140, 76, { r: 9, fill: C.acc, stroke: C.accS }) + t(90, 78, "S3 data", { bold: true, size: 9, fill: C.accT }) + t(90, 96, "year=/month=/", { size: 7.2, mono: true, fill: C.dim }) + t(90, 108, "*.parquet", { size: 7.2, mono: true, fill: C.dim }) + t(90, 126, "raw files", { size: 7, fill: C.dim });
    b += box(196, 52, 168, 88, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(280, 70, "crawler", { bold: true, size: 9.5, fill: C.awsT }) + t(280, 88, "classifiers detect format", { size: 7, fill: C.dim }) + t(280, 102, "infer columns + types", { size: 7, fill: C.dim }) + t(280, 116, "discover partitions", { size: 7, fill: C.dim }) + t(280, 130, "(scheduled / on-demand)", { size: 6.8, fill: C.dim });
    b += box(400, 58, 220, 76, { r: 9, fill: C.good, stroke: C.goodS }) + t(510, 78, "Catalog table", { bold: true, size: 9, fill: C.goodT }) + t(510, 96, "schema + partitions registered", { size: 7, fill: C.dim }) + t(510, 112, "→ queryable in Athena now", { size: 7.2, fill: C.dim });
    b += arrowR(160, 96, 194, { stroke: C.awsS }) + arrowR(364, 96, 398, { stroke: C.awsS });
    b += box(16, 154, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 171, "crawlers automate cataloging, but cost runs & can mis-infer; often better: define the table once + ADD PARTITION / projection", { size: 7, fill: C.warn });
    b += t(320, 200, "A crawler scans files, infers schema and partitions, and registers a Catalog table — handy, but not always the cheapest path.", { size: 7.1, fill: C.dim });
    return svg(214, b, "Glue crawlers");
  })();

  /* aws-glue-etl — Spark jobs + DynamicFrame */
  D["aws-glue-etl"] = (() => {
    let b = t(320, 20, "Glue ETL — serverless Spark with DynamicFrames", { bold: true });
    b += box(20, 56, 130, 64, { r: 9, fill: C.acc, stroke: C.accS }) + t(85, 76, "source", { bold: true, size: 8.6, fill: C.accT }) + t(85, 94, "Catalog table", { size: 7.2, fill: C.dim }) + t(85, 106, "/ S3 / JDBC", { size: 7.2, fill: C.dim });
    b += box(176, 50, 180, 76, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(266, 68, "Glue Spark job", { bold: true, size: 9, fill: C.awsT }) + t(266, 86, "DynamicFrame transforms", { size: 7, fill: C.dim }) + t(266, 100, "(ApplyMapping, Resolve,", { size: 6.8, fill: C.dim }) + t(266, 112, "Relationalize) ↔ DataFrame", { size: 6.8, fill: C.dim });
    b += box(382, 56, 130, 64, { r: 9, fill: C.good, stroke: C.goodS }) + t(447, 76, "sink", { bold: true, size: 8.6, fill: C.goodT }) + t(447, 94, "S3 Parquet /", { size: 7.2, fill: C.dim }) + t(447, 106, "Redshift / catalog", { size: 7.2, fill: C.dim });
    b += box(536, 56, 88, 64, { r: 9, fill: C.vio, stroke: C.vioS }) + t(580, 76, "Glue", { bold: true, size: 8, fill: C.vioT }) + t(580, 90, "Studio", { bold: true, size: 8, fill: C.vioT }) + t(580, 106, "visual + code", { size: 6.6, fill: C.dim });
    b += arrowR(150, 88, 174, { stroke: C.awsS }) + arrowR(356, 88, 380, { stroke: C.awsS }) + arrowR(512, 88, 534, { stroke: C.boxS });
    b += box(16, 144, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 161, "DynamicFrame = schema-flexible (handles messy/changing data); convert to DataFrame for full Spark SQL; serverless DPUs", { size: 7, fill: C.warn });
    b += t(320, 190, "Glue runs Spark without managing clusters; DynamicFrames tolerate schema drift, then drop to DataFrames when you need SQL.", { size: 7, fill: C.dim });
    return svg(204, b, "Glue ETL jobs");
  })();

  /* aws-glue-bookmarks — incremental + workflows */
  D["aws-glue-bookmarks"] = (() => {
    let b = t(320, 20, "Job bookmarks & workflows — incremental orchestration", { bold: true });
    b += t(165, 46, "job bookmark (incremental)", { bold: true, size: 8.6, fill: C.awsT });
    ["run 1", "run 2", "run 3"].forEach((s, i) => { const x = 30 + i * 100; b += box(x, 56, 80, 34, { r: 7, fill: C.aws, stroke: C.awsS }) + t(x + 40, 77, s, { size: 8, fill: C.awsT }); if (i < 2) b += arrowR(x + 80, 73, x + 100 - 2, { stroke: C.awsS }); });
    b += box(30, 100, 280, 24, { r: 6, fill: C.good, stroke: C.goodS }) + t(170, 116, "each run processes ONLY new data since last", { size: 7.4, fill: C.goodT });
    b += t(478, 46, "workflow (DAG)", { bold: true, size: 8.6, fill: C.vioT });
    [["crawler", C.acc], ["job: clean", C.vio], ["job: load", C.good]].forEach(([s, f], i) => { const y = 56 + i * 34; b += box(360, y, 240, 26, { r: 6, fill: f, stroke: C.boxS }) + t(480, y + 17, s, { size: 8, fill: C.tx }); if (i < 2) b += arrowD(480, y + 26, 56 + (i + 1) * 34 - 2, { stroke: C.vioS }); });
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "bookmarks make jobs incremental (no reprocessing); triggers/workflows chain crawlers + jobs on schedule or events", { size: 7, fill: C.warn });
    b += t(320, 196, "Bookmarks track what's processed for incremental runs; workflows/triggers orchestrate crawlers and jobs into pipelines.", { size: 7, fill: C.dim });
    return svg(210, b, "Glue bookmarks and workflows");
  })();

  /* aws-glue-quality — DQ + DataBrew */
  D["aws-glue-quality"] = (() => {
    let b = t(320, 20, "Data Quality, DataBrew & interactive sessions", { bold: true });
    b += box(20, 54, 200, 92, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(120, 72, "Glue Data Quality", { bold: true, size: 8.8, fill: C.awsT }) + t(120, 90, "DQDL rules:", { size: 7.4, mono: true, fill: C.dim }) + t(120, 104, "Completeness > 0.95", { size: 7, mono: true, fill: C.goodT }) + t(120, 116, "IsUnique \"id\"", { size: 7, mono: true, fill: C.goodT }) + t(120, 132, "→ pass/fail + metrics", { size: 7, fill: C.dim });
    b += box(236, 54, 188, 92, { r: 9, fill: C.vio, stroke: C.vioS }) + t(330, 72, "Glue DataBrew", { bold: true, size: 8.8, fill: C.vioT }) + t(330, 90, "visual data prep", { size: 7.4, fill: C.dim }) + t(330, 104, "250+ transforms,", { size: 7, fill: C.dim }) + t(330, 116, "reusable recipes", { size: 7, fill: C.dim }) + t(330, 132, "(no code)", { size: 7, fill: C.dim });
    b += box(440, 54, 184, 92, { r: 9, fill: C.acc, stroke: C.accS }) + t(532, 72, "interactive sessions", { bold: true, size: 8.4, fill: C.accT }) + t(532, 90, "notebook dev on", { size: 7.4, fill: C.dim }) + t(532, 104, "Glue Spark; iterate", { size: 7, fill: C.dim }) + t(532, 116, "before deploying", { size: 7, fill: C.dim }) + t(532, 132, "the job", { size: 7, fill: C.dim });
    b += box(16, 158, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 175, "build quality gates with DQDL rules; prep visually in DataBrew; develop jobs interactively — all within Glue", { size: 7.1, fill: C.warn });
    b += t(320, 200, "Glue is more than ETL: declarative data-quality rules, no-code prep, and notebook development around the same catalog.", { size: 7, fill: C.dim });
    return svg(214, b, "Glue Data Quality and DataBrew");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
