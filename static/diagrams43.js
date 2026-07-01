/* Datalith — diagram pack 43 (Databricks, module 2). Clean geometry. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    dx:"#3a1a12", dxS:"#ff5a36", dxT:"#ff9b85" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dbx-spark — DataFrames & optimization */
  D["dbx-spark"] = (() => {
    let b = t(320, 20, "Spark on Databricks — lazy DataFrames & tuning", { bold: true });
    b += box(24, 54, 116, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(82, 73, "read Delta", { bold: true, size: 8.6, fill: C.accT }) + t(82, 86, "DataFrame", { size: 6.8, fill: C.dim });
    b += box(166, 54, 116, 40, { r: 8 }) + t(224, 73, "filter / select", { bold: true, size: 8.6 }) + t(224, 86, "narrow", { size: 6.8, fill: C.dim });
    b += box(308, 54, 130, 40, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(373, 73, "join / groupBy", { bold: true, size: 8.6, fill: C.warn }) + t(373, 86, "wide = shuffle", { size: 6.8, fill: C.dim });
    b += box(464, 54, 130, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(529, 73, "write (action)", { bold: true, size: 8.6, fill: C.goodT }) + t(529, 86, "runs the plan", { size: 6.8, fill: C.dim });
    b += arrowR(140, 74, 164) + arrowR(282, 74, 306) + arrowR(438, 74, 462);
    b += t(373, 46, "stage boundary", { size: 6.6, fill: C.dim });
    b += t(320, 116, "transformations are lazy — nothing runs until the action", { size: 7.8, fill: C.dim });
    b += box(16, 128, 608, 44, { r: 9, fill: C.card, stroke: C.dxS });
    b += t(30, 152, "cluster", { a: "start", bold: true, size: 8, fill: C.dxT });
    b += box(74, 135, 132, 30, { r: 6, fill: C.dx, stroke: C.dxS }) + t(140, 154, "Driver — plans", { size: 7.6, fill: C.dxT });
    b += arrowR(206, 150, 234);
    [294, 424, 554].forEach(x => b += box(x - 60, 135, 120, 30, { r: 6, fill: C.box, stroke: C.boxS }) + t(x, 154, "Executor", { size: 7.6 }));
    b += box(16, 182, 608, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 200, "Catalyst optimizer + AQE + Photon (vectorized C++) · broadcast small tables · cache reuse · minimize shuffles", { size: 7.9, fill: C.warn });
    b += t(320, 230, "Spark builds a lazy plan that an action triggers; the driver splits it into stages (at shuffles) and tasks across executors — Photon and AQE speed it up.", { size: 7.8, fill: C.dim });
    return svg(244, b, "Spark on Databricks");
  })();

  /* dbx-streaming — Structured Streaming */
  D["dbx-streaming"] = (() => {
    let b = t(320, 20, "Structured Streaming — readStream → writeStream", { bold: true });
    b += box(16, 62, 132, 48, { r: 9, fill: C.acc, stroke: C.accS }) + t(82, 82, "source", { bold: true, size: 9, fill: C.accT }) + t(82, 98, "Auto Loader · Kafka", { size: 6.8, fill: C.dim });
    b += box(190, 54, 200, 64, { r: 10, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(290, 74, "streaming DataFrame", { bold: true, size: 9, fill: C.dxT }) + t(290, 92, "window + watermark", { size: 7.4, fill: C.dim }) + t(290, 105, "(late-data handling)", { size: 6.8, fill: C.dim });
    b += box(432, 62, 132, 48, { r: 9, fill: C.good, stroke: C.goodS }) + t(498, 82, "Delta sink", { bold: true, size: 9, fill: C.goodT }) + t(498, 98, "append / merge", { size: 6.8, fill: C.dim });
    b += arrowR(148, 86, 188) + arrowR(390, 86, 430);
    b += box(190, 138, 200, 30, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(290, 157, "checkpoint (offsets + state)", { size: 7.8, fill: C.warn });
    b += arrowD(290, 118, 138);
    b += t(498, 140, "exactly-once =", { size: 7, fill: C.dim }) + t(498, 152, "checkpoint +", { size: 7, fill: C.dim }) + t(498, 163, "idempotent Delta", { size: 7, fill: C.dim });
    b += t(320, 192, "The same DataFrame API runs as a stream: micro-batches (or Real-Time Mode), checkpoints give exactly-once, watermarks bound state for late data.", { size: 8, fill: C.dim });
    return svg(206, b, "Structured Streaming");
  })();

  /* dbx-sql-bi — Databricks SQL */
  D["dbx-sql-bi"] = (() => {
    let b = t(320, 20, "Databricks SQL — warehouses & BI on the lakehouse", { bold: true });
    b += box(16, 66, 130, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(81, 86, "BI & SQL", { bold: true, size: 9, fill: C.accT }) + t(81, 102, "Power BI · Tableau", { size: 6.8, fill: C.dim }) + t(81, 114, "SQL editor", { size: 6.8, fill: C.dim });
    b += box(196, 60, 180, 68, { r: 10, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(286, 82, "SQL Warehouse", { bold: true, size: 10, fill: C.dxT }) + t(286, 99, "serverless · Photon", { size: 7.4, fill: C.dim }) + t(286, 113, "ANSI SQL", { size: 7, fill: C.dim });
    b += box(426, 66, 170, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(511, 86, "Delta tables", { bold: true, size: 9, fill: C.goodT }) + t(511, 102, "Unity Catalog", { size: 6.8, fill: C.dim }) + t(511, 114, "governed", { size: 6.8, fill: C.dim });
    b += arrowR(146, 94, 194) + arrowR(376, 94, 424);
    b += box(16, 146, 608, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 164, "dashboards & alerts in Databricks SQL · same Delta/Unity Catalog tables your pipelines write · no separate warehouse to copy into", { size: 7.8, fill: C.warn });
    b += t(320, 196, "Databricks SQL runs ANSI SQL (Photon, serverless) on the lakehouse — BI and dashboards hit the same governed Delta tables your ETL writes.", { size: 7.6, fill: C.dim });
    return svg(210, b, "Databricks SQL");
  })();

  /* dbx-ml — MLflow, Feature Store, serving */
  D["dbx-ml"] = (() => {
    let b = t(320, 20, "Machine learning — MLflow, Feature Store, serving", { bold: true });
    const steps = [["Feature Store", "curated features", C.acc, C.accS, C.accT], ["Train", "MLflow tracks params / metrics / artifacts", C.dx, C.dxS, C.dxT], ["Model Registry", "versions · stages", C.good, C.goodS, C.goodT], ["Serving endpoint", "real-time / batch", C.box, C.boxS, C.tx]];
    steps.forEach(([nm, sub, f, s, tc], i) => { const y = 52 + i * 38; b += box(150, y, 340, 30, { r: 7, fill: f, stroke: s }) + t(168, y + 19, nm, { a: "start", bold: true, size: 8.8, fill: tc }) + t(482, y + 19, sub, { a: "end", size: 7, fill: C.dim }); if (i < 3) b += arrowD(320, y + 30, y + 38); });
    b += t(70, 67, "data +", { size: 7.4, fill: C.dim }) + t(70, 79, "labels", { size: 7.4, fill: C.dim });
    b += t(560, 71, "AutoML &", { size: 7.2, fill: C.dim }) + t(560, 83, "Mosaic AI", { size: 7.2, fill: C.dim }) + t(560, 95, "assist", { size: 7.2, fill: C.dim });
    b += box(16, 206, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 223, "all on the lakehouse: features, experiments, models & serving governed by Unity Catalog — train next to the data, no copies", { size: 7.8, fill: C.warn });
    b += t(320, 252, "MLflow tracks runs and registers versioned models; Feature Store serves features; one-click serving deploys them — full ML lifecycle, one platform.", { size: 7.6, fill: C.dim });
    return svg(264, b, "Databricks ML");
  })();

  /* dbx-dataops — Asset Bundles & CI/CD */
  D["dbx-dataops"] = (() => {
    let b = t(320, 20, "DataOps — Asset Bundles & CI/CD (capstone)", { bold: true });
    b += box(16, 60, 120, 46, { r: 9, fill: C.acc, stroke: C.accS }) + t(76, 80, "Git repo", { bold: true, size: 9, fill: C.accT }) + t(76, 96, "notebooks · SQL", { size: 6.8, fill: C.dim });
    b += box(170, 60, 120, 46, { r: 9 }) + t(230, 80, "CI: tests", { bold: true, size: 9 }) + t(230, 96, "unit · lint", { size: 6.8, fill: C.dim });
    b += box(324, 54, 140, 58, { r: 10, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(394, 74, "Asset Bundle", { bold: true, size: 9.5, fill: C.dxT }) + t(394, 90, "databricks.yml", { size: 7.2, mono: true, fill: C.dim }) + t(394, 103, "jobs · pipelines · clusters", { size: 6.6, fill: C.dim });
    b += box(498, 60, 126, 46, { r: 9, fill: C.good, stroke: C.goodS }) + t(561, 80, "deploy", { bold: true, size: 9, fill: C.goodT }) + t(561, 96, "dev → stg → prod", { size: 6.8, fill: C.dim });
    b += arrowR(136, 83, 168) + arrowR(290, 83, 322) + arrowR(464, 83, 496);
    b += box(16, 132, 608, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 151, "the bundle defines jobs, Lakeflow pipelines, and clusters as code — version-controlled, tested, and promoted across environments", { size: 7.9, fill: C.warn });
    b += box(16, 172, 608, 30, { r: 8, fill: C.card, stroke: C.dxS }) + t(320, 191, "the full stack: Auto Loader → Delta (bronze→silver→gold) → Databricks SQL / ML — governed by Unity Catalog, shipped by CI/CD", { size: 7.9, fill: C.dxT });
    b += t(320, 224, "DataOps = pipelines as software: code in Git, tested in CI, deployed by Asset Bundles to dev/staging/prod — reproducible, reviewable, automated.", { size: 7.8, fill: C.dim });
    return svg(238, b, "Databricks DataOps");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
