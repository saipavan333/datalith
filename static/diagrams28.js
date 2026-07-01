/* DataForge Academy — diagram pack 28 (Medallion architecture: complete guide). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    brF:"#2e2117", brS:"#c8884f", brT:"#e0a878", siF:"#222a34", siS:"#9fb0c4", siT:"#c6d2e0", goF:"#322a13", goS:"#e3b341", goT:"#f0cf78" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const medal=(cx,cy,col)=>`<circle cx="${cx}" cy="${cy}" r="9" style="fill:${col};stroke:${col}"/>`;
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* 1) medallion-flow — overall architecture */
  D["medallion-flow"] = (() => {
    let b = t(320, 20, "Medallion architecture — raw → refined in three layers", { bold: true });
    // sources
    b += box(14, 70, 96, 70, { r: 9 }) + t(62, 90, "Sources", { bold: true, size: 10 });
    ["files / DBs", "streaming", "APIs"].forEach((s, i) => b += t(62, 108 + i * 14, s, { size: 8, fill: C.dim }));
    b += arrowR(110, 105, 132);
    const layers = [
      ["BRONZE", "raw · as-received", "+ metadata · append-only", C.brF, C.brS, C.brT, 134],
      ["SILVER", "cleaned · conformed", "typed · deduped · validated", C.siF, C.siS, C.siT, 304],
      ["GOLD", "business-ready", "aggregated · modeled", C.goF, C.goS, C.goT, 474],
    ];
    layers.forEach((L, i) => {
      const x = L[6];
      b += box(x, 70, 150, 70, { r: 10, fill: L[3], stroke: L[4] }) + medal(x + 22, 92, L[4]);
      b += t(x + 88, 92, L[0], { bold: true, size: 12, fill: L[5] });
      b += t(x + 75, 112, L[1], { size: 8.6, fill: C.tx });
      b += t(x + 75, 128, L[2], { size: 7.8, fill: C.dim });
      if (i < 2) b += arrowR(x + 150, 105, x + 154);
    });
    // consumers under gold
    b += t(320, 166, "quality & trust increase left → right   ·   keep raw BRONZE so you can rebuild SILVER & GOLD anytime", { size: 9, fill: C.dim });
    b += box(360, 184, 264, 30, { r: 8, fill: C.good, stroke: C.goodS }) + t(492, 203, "Consumers: BI · ML · apps", { size: 9.2, fill: C.goodT, bold: true });
    b += arrowD(492, 140, 182, { stroke: C.goodS });
    return svg(226, b, "Medallion architecture flow");
  })();

  /* 2) medallion-layers — per-layer responsibilities */
  D["medallion-layers"] = (() => {
    let b = t(320, 20, "What each layer does", { bold: true });
    const cards = [
      ["BRONZE", "raw / landing zone", C.brF, C.brS, C.brT,
        ["ingest exactly as received", "add metadata (ts·source·file)", "append-only, no transforms", "immutable → replayable"],
        "format: original (JSON/CSV/Parquet)", "audience: engineers · reprocessing", 16],
      ["SILVER", "cleaned / conformed", C.siF, C.siS, C.siT,
        ["fix types · handle nulls", "deduplicate", "validate (quality checks)", "standardize keys · conform sources"],
        "format: Delta · fine-grained", "audience: analysts · data science", 224],
      ["GOLD", "business-ready", C.goF, C.goS, C.goT,
        ["aggregate & summarize", "dimensional models (star)", "business logic / KPIs", "ML feature tables"],
        "format: Delta · query-optimized", "audience: BI · execs · ML · apps", 432],
    ];
    cards.forEach((c, idx) => {
      const x = c[8];
      b += box(x, 40, 192, 222, { r: 11, fill: c[2], stroke: c[3] });
      b += medal(x + 24, 62, c[3]) + t(x + 112, 60, c[0], { bold: true, size: 12.5, fill: c[4] });
      b += t(x + 112, 78, c[1], { size: 8.8, fill: C.tx });
      b += ln(x + 14, 88, x + 178, 88, { stroke: c[3], sw: 1 });
      c[5].forEach((op, i) => b += t(x + 14, 108 + i * 22, "• " + op, { a: "start", size: 8.8, fill: C.tx }));
      b += t(x + 14, 212, c[6], { a: "start", size: 8, fill: C.dim });
      b += t(x + 14, 232, c[7], { a: "start", size: 8, fill: C.dim });
      if (idx < 2) b += arrowR(x + 192, 150, x + 224);
    });
    return svg(280, b, "Medallion layers responsibilities");
  })();

  /* 3) medallion-quality — trust progression + silver/gold decision rule */
  D["medallion-quality"] = (() => {
    let b = t(320, 20, "Quality progression & the Silver-vs-Gold rule", { bold: true });
    // trust bar
    b += box(40, 44, 180, 30, { r: 8, fill: C.brF, stroke: C.brS }) + t(130, 63, "BRONZE · untrusted", { size: 9, fill: C.brT, bold: true });
    b += box(230, 44, 180, 30, { r: 8, fill: C.siF, stroke: C.siS }) + t(320, 63, "SILVER · trusted", { size: 9, fill: C.siT, bold: true });
    b += box(420, 44, 180, 30, { r: 8, fill: C.goF, stroke: C.goS }) + t(510, 63, "GOLD · curated", { size: 9, fill: C.goT, bold: true });
    b += arrowR(220, 59, 230) + arrowR(410, 59, 420);
    b += t(320, 92, "trust / structure increase  →", { size: 8.6, fill: C.dim });
    // decision rule
    b += box(150, 104, 340, 30, { r: 9, fill: C.acc, stroke: C.accS }) + t(320, 123, "Does this transform require DOMAIN knowledge?", { bold: true, size: 10, fill: C.accT });
    b += ln(250, 134, 250, 150, { stroke: C.siS }) + arrowD(250, 150, 156, { stroke: C.siS });
    b += ln(410, 134, 410, 150, { stroke: C.goS }) + arrowD(410, 150, 156, { stroke: C.goS });
    b += t(250, 148, "NO", { size: 8.5, fill: C.siT, bold: true }) + t(410, 148, "YES", { size: 8.5, fill: C.goT, bold: true });
    b += box(96, 158, 308, 44, { r: 9, fill: C.siF, stroke: C.siS }) + t(250, 176, "→ SILVER", { bold: true, size: 10, fill: C.siT }) + t(250, 192, "clean · type · dedupe · conform", { size: 8.4, fill: C.dim });
    b += box(420, 158, 196, 44, { r: 9, fill: C.goF, stroke: C.goS }) + t(518, 176, "→ GOLD", { bold: true, size: 10, fill: C.goT }) + t(518, 192, "joins · aggregations · KPIs", { size: 8.4, fill: C.dim });
    b += box(40, 214, 560, 30, { r: 8, fill: C.bad, stroke: C.badS }) + t(320, 233, "anti-pattern: \"I'm already in Silver, let me just add this business logic\" → erodes the layers", { size: 8.8, fill: C.badT });
    return svg(256, b, "Medallion quality and decision rule");
  })();

  /* 4) medallion-databricks — Databricks implementation */
  D["medallion-databricks"] = (() => {
    let b = t(320, 20, "Medallion on Databricks — the platform stack", { bold: true });
    b += box(14, 64, 88, 44, { r: 8 }) + t(58, 82, "Sources", { bold: true, size: 9.5 }) + t(58, 97, "files·Kafka", { size: 7.6, fill: C.dim });
    b += arrowR(102, 86, 120) + t(140, 78, "Auto", { size: 7.4, fill: C.accT }) + t(140, 88, "Loader", { size: 7.4, fill: C.accT });
    const lay = [["BRONZE", C.brF, C.brS, C.brT, 168], ["SILVER", C.siF, C.siS, C.siT, 330], ["GOLD", C.goF, C.goS, C.goT, 492]];
    lay.forEach((L, i) => {
      const x = L[4];
      b += box(x, 64, 134, 44, { r: 9, fill: L[1], stroke: L[2] }) + medal(x + 20, 86, L[2]) + t(x + 78, 83, L[0], { bold: true, size: 10.5, fill: L[3] }) + t(x + 78, 99, "Delta table", { size: 7.6, fill: C.dim });
      if (i < 2) b += arrowR(x + 134, 86, x + 162) + t(x + 148, 78, "DLT", { size: 7.2, fill: C.warn });
    });
    b += t(411, 122, "↑ Delta Live Tables / Lakeflow — declarative + expectations (quarantine bad rows)", { size: 8, fill: C.warn });
    // governance + orchestration bars
    b += box(120, 140, 504, 26, { r: 7, fill: C.acc, stroke: C.accS }) + t(372, 157, "Unity Catalog — governance · lineage · access (domain-first)", { size: 9, fill: C.accT, bold: true });
    b += box(120, 172, 504, 24, { r: 7, fill: C.box, stroke: C.boxS }) + t(372, 188, "Workflows — orchestration (schedule · retries · alerts)", { size: 8.8, fill: C.tx });
    // consumers
    b += box(120, 204, 244, 28, { r: 8, fill: C.good, stroke: C.goodS }) + t(242, 222, "SQL warehouse (Photon) · BI", { size: 8.8, fill: C.goodT, bold: true });
    b += box(380, 204, 244, 28, { r: 8, fill: C.good, stroke: C.goodS }) + t(502, 222, "MLflow · ML / features", { size: 8.8, fill: C.goodT, bold: true });
    b += arrowD(242, 108, 202, { stroke: C.goodS }) + arrowD(502, 108, 202, { stroke: C.goodS });
    return svg(244, b, "Medallion on Databricks");
  })();

  /* 5) medallion-example — concrete e-commerce */
  D["medallion-example"] = (() => {
    let b = t(320, 20, "Worked example — e-commerce orders through the layers", { bold: true });
    // bronze
    b += box(16, 44, 196, 92, { r: 10, fill: C.brF, stroke: C.brS }) + medal(40, 64, C.brS) + t(125, 62, "BRONZE — raw events", { bold: true, size: 9.5, fill: C.brT });
    b += t(28, 84, "{order_id:\"A1\", amt:\"N/A\",", { a: "start", size: 7.8, mono: true, fill: C.dim });
    b += t(28, 98, " region:\"eu\", ts:..., dup}", { a: "start", size: 7.8, mono: true, fill: C.dim });
    b += t(28, 118, "as-received JSON · append-only", { a: "start", size: 7.6, fill: C.dim });
    b += arrowR(212, 90, 236);
    // silver
    b += box(238, 44, 196, 92, { r: 10, fill: C.siF, stroke: C.siS }) + medal(262, 64, C.siS) + t(347, 62, "SILVER — clean orders", { bold: true, size: 9.5, fill: C.siT });
    b += t(250, 84, "order_id·amount(num)·region", { a: "start", size: 7.8, mono: true, fill: C.dim });
    b += t(250, 98, "typed · deduped · valid (amt>0)", { a: "start", size: 7.6, fill: C.dim });
    b += t(250, 118, "one trustworthy row per order", { a: "start", size: 7.6, fill: C.dim });
    b += arrowR(434, 90, 458);
    // gold (two outputs)
    b += box(460, 44, 168, 44, { r: 9, fill: C.goF, stroke: C.goS }) + t(544, 62, "GOLD · revenue mart", { bold: true, size: 8.6, fill: C.goT }) + t(544, 78, "daily revenue by region (star)", { size: 7.4, fill: C.dim });
    b += box(460, 92, 168, 44, { r: 9, fill: C.goF, stroke: C.goS }) + t(544, 110, "GOLD · features", { bold: true, size: 8.6, fill: C.goT }) + t(544, 126, "customer ML feature table", { size: 7.4, fill: C.dim });
    b += t(320, 160, "raw mess → typed & deduped truth → business aggregates + ML features (built on one clean Silver)", { size: 8.8, fill: C.dim });
    return svg(178, b, "Medallion e-commerce example");
  })();

  /* 6) medallion-streaming — unified batch + streaming */
  D["medallion-streaming"] = (() => {
    let b = t(320, 20, "One architecture — batch and streaming", { bold: true });
    b += box(16, 54, 116, 38, { r: 8 }) + t(74, 71, "batch files", { size: 9, fill: C.tx, bold: true }) + t(74, 84, "Auto Loader", { size: 7.6, fill: C.dim });
    b += box(16, 102, 116, 38, { r: 8 }) + t(74, 119, "streaming", { size: 9, fill: C.tx, bold: true }) + t(74, 132, "Kafka", { size: 7.6, fill: C.dim });
    b += arrowR(132, 73, 156, { stroke: C.brS }) + arrowR(132, 121, 156, { stroke: C.brS });
    const lay = [["BRONZE", "append", C.brF, C.brS, C.brT, 158], ["SILVER", "incremental", C.siF, C.siS, C.siT, 318], ["GOLD", "near-real-time", C.goF, C.goS, C.goT, 478]];
    lay.forEach((L, i) => {
      const x = L[5];
      b += box(x, 78, 134, 40, { r: 9, fill: L[2], stroke: L[3] }) + medal(x + 20, 98, L[3]) + t(x + 80, 95, L[0], { bold: true, size: 10, fill: L[4] }) + t(x + 80, 110, L[1] + " refine", { size: 7.6, fill: C.dim });
      if (i < 2) b += arrowR(x + 134, 98, x + 160);
    });
    b += box(300, 150, 324, 30, { r: 8, fill: C.good, stroke: C.goodS }) + t(462, 169, "live dashboards · real-time ML scoring", { size: 9, fill: C.goodT, bold: true });
    b += arrowD(545, 118, 148, { stroke: C.goodS });
    b += t(320, 200, "same Bronze→Silver→Gold layers, whether data arrives in batches or as a continuous stream", { size: 9, fill: C.dim });
    return svg(214, b, "Medallion batch and streaming");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
