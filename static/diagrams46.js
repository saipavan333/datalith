/* Datalith — diagram pack 46 (deep-dive lessons, vol. 3: Snowflake modern platform). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    sn:"#10303a", snS:"#29b5e8", snT:"#7fd6f2" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* snow-snowpark — code in Snowflake */
  D["snow-snowpark"] = (() => {
    let b = t(320, 20, "Snowpark — run Python/Scala inside Snowflake", { bold: true });
    b += box(16, 66, 144, 52, { r: 8, fill: C.acc, stroke: C.accS }) + t(88, 86, "Python / Scala", { bold: true, size: 8.8, fill: C.accT }) + t(88, 101, "DataFrames + UDFs", { size: 7, fill: C.dim });
    b += box(186, 58, 180, 68, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(276, 80, "Snowpark", { bold: true, size: 10, fill: C.snT }) + t(276, 97, "compiles to SQL", { size: 7.4, fill: C.dim }) + t(276, 110, "(lazy DataFrame API)", { size: 6.8, fill: C.dim });
    b += box(396, 66, 150, 52, { r: 8, fill: C.good, stroke: C.goodS }) + t(471, 86, "warehouse", { bold: true, size: 8.8, fill: C.goodT }) + t(471, 101, "runs next to data", { size: 7, fill: C.dim });
    b += arrowR(160, 92, 184) + arrowR(366, 92, 394);
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "code executes inside Snowflake — no separate Spark cluster, no data export", { size: 7.7, fill: C.warn });
    b += box(16, 182, 608, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(320, 198, "Snowpark ML: feature engineering, training & a model registry, all in-platform", { size: 7.4, fill: C.snT });
    b += t(320, 226, "Write DataFrame/UDF/procedure code in Python or Scala; it compiles to SQL and runs on your warehouse, beside the governed data.", { size: 7.5, fill: C.dim });
    return svg(240, b, "Snowpark");
  })();

  /* snow-iceberg — open table format */
  D["snow-iceberg"] = (() => {
    let b = t(320, 20, "Iceberg tables — open format, your storage", { bold: true });
    b += box(16, 70, 152, 46, { r: 8, fill: C.good, stroke: C.goodS }) + t(92, 90, "Snowflake engine", { bold: true, size: 8.4, fill: C.goodT }) + t(92, 104, "fast SQL + governance", { size: 6.6, fill: C.dim });
    b += box(220, 58, 200, 70, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(320, 80, "Iceberg table", { bold: true, size: 9.5, fill: C.snT }) + t(320, 97, "your cloud storage", { size: 7.2, fill: C.dim }) + t(320, 110, "(external volume)", { size: 6.8, fill: C.dim });
    b += box(472, 70, 152, 46, { r: 8, fill: C.acc, stroke: C.accS }) + t(548, 90, "Spark · Trino", { bold: true, size: 8.4, fill: C.accT }) + t(548, 104, "Flink · others", { size: 6.6, fill: C.dim });
    b += arrowR(168, 93, 218) + arrowL(472, 93, 422);
    b += box(16, 152, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "managed: Snowflake writes (best perf) · unmanaged: external catalog (Glue / Iceberg REST), Snowflake reads", { size: 7.4, fill: C.warn });
    b += box(16, 184, 608, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(320, 200, "open Apache Iceberg in your bucket — no lock-in; many engines read/write the same tables", { size: 7.4, fill: C.snT });
    b += t(320, 228, "Keep data in open Iceberg in your own storage; Snowflake provides the engine and governance, while other engines share the tables.", { size: 7.4, fill: C.dim });
    return svg(242, b, "Iceberg tables");
  })();

  /* snow-cortex — AI/ML in SQL */
  D["snow-cortex"] = (() => {
    let b = t(320, 20, "Cortex — built-in AI/ML you call from SQL", { bold: true });
    b += box(16, 68, 144, 48, { r: 8, fill: C.acc, stroke: C.accS }) + t(88, 88, "your data", { bold: true, size: 8.8, fill: C.accT }) + t(88, 103, "text · tables", { size: 7, fill: C.dim });
    b += box(186, 58, 180, 68, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(276, 80, "Cortex", { bold: true, size: 10, fill: C.snT }) + t(276, 97, "LLM + ML functions", { size: 7.4, fill: C.dim }) + t(276, 110, "(serverless, in SQL)", { size: 6.8, fill: C.dim });
    b += box(396, 68, 150, 48, { r: 8, fill: C.good, stroke: C.goodS }) + t(471, 88, "enriched", { bold: true, size: 8.8, fill: C.goodT }) + t(471, 103, "sentiment · forecast", { size: 6.8, fill: C.dim });
    b += arrowR(160, 92, 184) + arrowR(366, 92, 394);
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "LLM: COMPLETE · SUMMARIZE · SENTIMENT · TRANSLATE     ML: FORECAST · ANOMALY_DETECTION", { size: 7.3, fill: C.warn });
    b += box(16, 182, 608, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(320, 198, "Cortex Analyst (natural language → SQL) · Cortex Search (RAG over your text)", { size: 7.4, fill: C.snT });
    b += t(320, 226, "Call LLMs and ML straight from SQL — no infrastructure, no data movement; the data and the models live together.", { size: 7.5, fill: C.dim });
    return svg(240, b, "Cortex");
  })();

  /* snow-hybrid — Hybrid Tables / Unistore */
  D["snow-hybrid"] = (() => {
    let b = t(320, 20, "Hybrid Tables (Unistore) — OLTP beside analytics", { bold: true });
    b += box(16, 64, 140, 50, { r: 8, fill: C.acc, stroke: C.accS }) + t(86, 84, "OLTP app", { bold: true, size: 8.8, fill: C.accT }) + t(86, 99, "point read / write", { size: 7, fill: C.dim });
    b += box(186, 56, 200, 66, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(286, 78, "Hybrid Table", { bold: true, size: 10, fill: C.snT }) + t(286, 95, "row-store + PK + indexes", { size: 7, fill: C.dim }) + t(286, 108, "(Unistore)", { size: 6.8, fill: C.dim });
    b += box(416, 64, 150, 50, { r: 8, fill: C.good, stroke: C.goodS }) + t(491, 84, "analytics", { bold: true, size: 8.8, fill: C.goodT }) + t(491, 99, "join standard tables", { size: 7, fill: C.dim });
    b += arrowR(156, 89, 184) + arrowR(386, 89, 414);
    b += box(16, 148, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 165, "row store + enforced primary key + secondary indexes → single-row lookups/upserts in milliseconds", { size: 7.4, fill: C.warn });
    b += box(16, 180, 608, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(320, 196, "transactional + analytical on one platform — no separate OLTP database to sync", { size: 7.4, fill: C.snT });
    b += t(320, 224, "Serve app-style point lookups and upserts (with PK enforcement) on the same platform as analytics — no operational DB to copy from.", { size: 7.4, fill: C.dim });
    return svg(238, b, "Hybrid Tables");
  })();

  /* snow-apps — apps & data products */
  D["snow-apps"] = (() => {
    let b = t(320, 20, "Apps & data products — build and distribute", { bold: true });
    b += box(16, 76, 150, 52, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(91, 97, "governed data", { bold: true, size: 9, fill: C.snT }) + t(91, 112, "+ logic (in Snowflake)", { size: 6.8, fill: C.dim });
    b += box(196, 64, 300, 28, { r: 7, fill: C.acc, stroke: C.accS }) + t(210, 82, "Streamlit in Snowflake — interactive apps", { a: "start", size: 7.6, fill: C.accT });
    b += box(196, 96, 300, 28, { r: 7, fill: C.good, stroke: C.goodS }) + t(210, 114, "Native Apps — package & sell on Marketplace", { a: "start", size: 7.6, fill: C.goodT });
    b += box(196, 128, 300, 28, { r: 7 }) + t(210, 146, "Data Clean Rooms — privacy-preserving joins", { a: "start", size: 7.6, fill: C.tx });
    b += ln(166, 102, 186, 102) + ln(186, 78, 186, 142) + arrowR(186, 78, 194) + arrowR(186, 110, 194) + arrowR(186, 142, 194);
    b += t(508, 82, "interactive", { a: "start", size: 7, fill: C.dim }) + t(508, 114, "distribute", { a: "start", size: 7, fill: C.dim }) + t(508, 146, "collaborate", { a: "start", size: 7, fill: C.dim });
    b += box(16, 174, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 191, "build & distribute apps and data products without moving data or standing up infrastructure", { size: 7.5, fill: C.warn });
    b += t(320, 220, "Ship interactive apps (Streamlit), packaged data+logic (Native Apps), and privacy-safe collaborations (Clean Rooms) — all on governed data.", { size: 7.3, fill: C.dim });
    return svg(234, b, "Apps and data products");
  })();

  /* sql-server-logic — procedure vs function vs trigger */
  D["sql-server-logic"] = (() => {
    let b = t(320, 20, "Server-side logic — procedure vs function vs trigger", { bold: true });
    const cols = [["Procedure", "DOES something", "CALL proc(args)", "multi-step · transactions", C.acc, C.accS, C.accT],
      ["Function (UDF)", "COMPUTES a value", "SELECT f(x)", "scalar · table-valued", C.sn, C.snS, C.snT],
      ["Trigger", "REACTS to writes", "BEFORE/AFTER INSERT…", "audit · derived cols", C.good, C.goodS, C.goodT]];
    cols.forEach(([nm, doing, call, sub, f, s, tc], i) => { const x = 16 + i * 204; b += box(x, 50, 192, 92, { r: 9, fill: f, stroke: s, sw: 1.8 }) + t(x + 96, 72, nm, { bold: true, size: 9.5, fill: tc }) + t(x + 96, 90, doing, { bold: true, size: 8, fill: C.tx }) + t(x + 96, 107, call, { size: 7.4, mono: true, fill: C.dim }) + t(x + 96, 126, sub, { size: 7, fill: C.dim }); });
    b += box(16, 158, 608, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 175, "run logic in the engine next to the data for data-adjacent ops — keep core business logic in app code / dbt (tested, versioned)", { size: 7.5, fill: C.warn });
    b += t(320, 206, "A procedure performs actions (side effects, CALL); a function returns a value used in queries; a trigger fires automatically on writes.", { size: 7.6, fill: C.dim });
    return svg(220, b, "Server-side logic");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
