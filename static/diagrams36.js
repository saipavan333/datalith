/* DataForge Academy — diagram pack 36 (Snowflake for DE). Clean geometry. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    snow:"#1a3a5c", snowS:"#29b5e8", snowT:"#7fd4f0" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* snow-architecture — the 3 layers, decoupled storage & compute */
  D["snow-architecture"] = (() => {
    let b = t(320, 20, "Snowflake architecture — three decoupled layers", { bold: true });
    b += box(16, 42, 608, 34, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 58, "CLOUD SERVICES — optimizer · metadata · security · transactions (the brain)", { bold: true, size: 9.5, fill: C.accT }) + t(320, 70, "coordinates everything; no servers to manage", { size: 7.4, fill: C.dim });
    const wh = [["WH · ETL", 40], ["WH · BI", 240], ["WH · Data Science", 440]];
    wh.forEach(([label, x]) => { b += box(x, 96, 160, 52, { r: 9, fill: C.snow, stroke: C.snowS }) + t(x + 80, 116, label, { bold: true, size: 9.5, fill: C.snowT }) + t(x + 80, 132, "independent compute", { size: 7.4, fill: C.dim }) + t(x + 80, 143, "scale & suspend on its own", { size: 7, fill: C.dim }); });
    b += box(16, 168, 608, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(320, 186, "CENTRALIZED STORAGE — micro-partitions (compressed columnar, auto min/max stats)", { bold: true, size: 9.5, fill: C.goodT }) + t(320, 200, "one shared copy of the data, used by every warehouse", { size: 7.4, fill: C.dim });
    [120, 320, 520].forEach(x => { b += ln(x, 76, x, 96, { stroke: C.boxS }); b += ln(x, 148, x, 168, { stroke: C.boxS }); });
    b += t(320, 226, "storage & compute are decoupled: many independent virtual warehouses read/write ONE shared storage; size or suspend each without affecting the others", { size: 8.4, fill: C.dim });
    return svg(240, b, "Snowflake architecture");
  })();

  /* snow-warehouses — scale up vs scale out */
  D["snow-warehouses"] = (() => {
    let b = t(320, 20, "Virtual warehouses — scale UP vs scale OUT", { bold: true });
    b += t(165, 46, "Scale UP — a bigger warehouse", { bold: true, size: 9.5, fill: C.snowT });
    const sizes = [["XS", "1", 30], ["S", "2", 38], ["M", "4", 46], ["L", "8", 54], ["XL", "16", 62]];
    sizes.forEach(([nm, cr, h], i) => { const x = 24 + i * 60, y = 130 - h; b += box(x, y, 48, h, { r: 5, fill: C.snow, stroke: C.snowS }) + t(x + 24, y + h / 2 + 1, nm, { bold: true, size: 9, fill: C.snowT }) + t(x + 24, 144, cr + " cr/hr", { size: 7, fill: C.dim }); });
    b += t(165, 162, "doubles credits each size → one big query runs faster", { size: 8, fill: C.dim });
    b += ln(316, 42, 316, 168, { stroke: C.boxS });
    b += t(478, 46, "Scale OUT — multi-cluster", { bold: true, size: 9.5, fill: C.warn });
    [0, 1, 2].forEach(i => b += box(360 + i * 14, 70 + i * 10, 200, 40, { r: 8, fill: C.warnFill, stroke: C.warn }));
    b += t(474, 96, "+ clusters auto-added", { size: 9, bold: true, fill: C.warn });
    b += t(478, 150, "many concurrent users → no query queuing", { size: 8, fill: C.dim }) + t(478, 162, "(adds clusters, not size)", { size: 7.4, fill: C.dim });
    b += box(16, 184, 608, 30, { r: 8 }) + t(320, 203, "auto-suspend when idle · auto-resume on a query · billed per-second (1-min min) · cost = warehouse size × time running", { size: 8.4, fill: C.tx });
    b += t(320, 232, "scale UP for a single heavy query; scale OUT (multi-cluster) for many users at once — and suspend to pay nothing when idle", { size: 8.4, fill: C.dim });
    return svg(246, b, "Snowflake virtual warehouses");
  })();

  /* snow-ingestion — the ingestion spectrum */
  D["snow-ingestion"] = (() => {
    let b = t(320, 20, "Getting data in — from batch files to real-time rows", { bold: true });
    b += box(16, 92, 96, 50, { r: 9, fill: C.acc, stroke: C.accS }) + t(64, 113, "sources", { bold: true, size: 9.5, fill: C.accT }) + t(64, 129, "files · apps · streams", { size: 7.2, fill: C.dim });
    const rows = [
      ["COPY INTO (from a Stage)", "batch — you run / schedule it", C.box, C.boxS, C.tx, 50],
      ["Snowpipe (auto-ingest)", "micro-batch — loads files as they land", C.acc, C.accS, C.accT, 92],
      ["Snowpipe Streaming", "real-time rows, no files — ~seconds latency", C.snow, C.snowS, C.snowT, 134],
      ["Streams + Tasks · Dynamic Tables", "CDC + scheduled / declarative transforms", C.good, C.goodS, C.goodT, 176]];
    rows.forEach(([title, sub, f, s, tc, y]) => {
      b += box(160, y, 332, 34, { r: 8, fill: f, stroke: s }) + t(174, y + 15, title, { a: "start", bold: true, size: 8.8, fill: tc }) + t(174, y + 28, sub, { a: "start", size: 7.6, fill: C.dim });
    });
    b += box(516, 108, 108, 50, { r: 9 }) + t(570, 129, "tables", { bold: true, size: 9.5 }) + t(570, 145, "ready to query", { size: 7.4, fill: C.dim });
    // sources fan out to the four methods
    b += ln(112, 117, 138, 117, { sw: 1.1 }) + ln(138, 67, 138, 193, { sw: 1.1 });
    [67, 109, 151, 193].forEach(y => b += arrowR(138, y, 158, { sw: 1.1 }));
    // the four methods fan in to the tables box
    [67, 109, 151, 193].forEach(y => b += ln(492, y, 502, y, { sw: 1.1 }));
    b += ln(502, 67, 502, 193, { sw: 1.1 }) + arrowR(502, 133, 514, { sw: 1.1 });
    b += t(320, 226, "pick by latency: COPY (batch) → Snowpipe (files as they arrive) → Snowpipe Streaming (rows in seconds); Dynamic Tables transform continuously", { size: 8.2, fill: C.dim });
    return svg(240, b, "Snowflake ingestion");
  })();

  /* snow-timetravel-clone — time travel + zero-copy clone */
  D["snow-timetravel-clone"] = (() => {
    let b = t(320, 20, "Time Travel, zero-copy Clone & Fail-safe", { bold: true });
    b += t(160, 46, "Time Travel — query the past", { bold: true, size: 9.5, fill: C.snowT });
    b += ln(30, 92, 300, 92, { stroke: C.boxS });
    [["t0", 40], ["UPDATE", 110], ["DELETE", 185], ["now", 290]].forEach(([lab, x]) => { b += `<circle cx="${x}" cy="92" r="4" style="fill:${C.snowS}"/>`; b += t(x, 80, lab, { size: 7.4, fill: C.dim }); });
    b += t(160, 116, "SELECT … AT(offset => -3600)  ·  UNDROP TABLE", { size: 8, mono: true, fill: C.accT });
    b += t(160, 132, "restore data as of any point in the retention window (1–90 days)", { size: 7.6, fill: C.dim });
    b += ln(316, 42, 316, 150, { stroke: C.boxS });
    b += t(478, 46, "Zero-copy Clone", { bold: true, size: 9.5, fill: C.goodT });
    b += box(346, 64, 110, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(401, 88, "PROD table", { size: 9, fill: C.goodT });
    b += box(508, 64, 110, 40, { r: 8, fill: C.box, stroke: C.boxS }) + t(563, 88, "DEV clone", { size: 9, fill: C.tx });
    b += arrowR(456, 84, 506, { stroke: C.goodS });
    b += t(531, 110, "CLONE", { size: 7.6, mono: true, fill: C.dim });
    b += t(482, 128, "points at the SAME micro-partitions —", { size: 7.6, fill: C.dim }) + t(482, 140, "instant, no storage; diverges on write", { size: 7.6, fill: C.dim });
    b += box(16, 160, 608, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 179, "Fail-safe: 7 extra days (Snowflake-managed) after Time Travel for disaster recovery — not user-queryable", { size: 8.4, fill: C.warn });
    b += t(320, 210, "all three exploit immutable micro-partitions: old versions are kept, so the past is queryable and a clone is just a pointer", { size: 8.4, fill: C.dim });
    return svg(224, b, "Time travel and cloning");
  })();

  /* snow-modern — Snowpark, Iceberg, Dynamic Tables, Cortex */
  D["snow-modern"] = (() => {
    let b = t(320, 20, "The modern platform — beyond the warehouse", { bold: true });
    b += box(250, 104, 140, 44, { r: 10, fill: C.snow, stroke: C.snowS, sw: 2 }) + t(320, 124, "Snowflake", { bold: true, size: 11, fill: C.snowT }) + t(320, 139, "one engine", { size: 7.6, fill: C.dim });
    const q = [
      ["Snowpark", "Python/Java/Scala DataFrames,", "UDFs & procs on the warehouse", C.acc, C.accS, C.accT, 16, 48],
      ["Iceberg tables", "open format, full read/write,", "external catalog (open lakehouse)", C.good, C.goodS, C.goodT, 360, 48],
      ["Dynamic Tables", "declarative pipelines: a SELECT", "+ target freshness → auto-refresh", C.warnFill, C.warn, C.warn, 16, 160],
      ["Cortex AI", "LLM functions in SQL — summarize,", "sentiment, PII redaction; data stays in", C.bad, C.badS, C.badT, 360, 160]];
    q.forEach(([title, l1, l2, f, s, tc, x, y]) => {
      b += box(x, y, 264, 44, { r: 9, fill: f, stroke: s }) + t(x + 12, y + 17, title, { a: "start", bold: true, size: 9.5, fill: tc }) + t(x + 12, y + 30, l1, { a: "start", size: 7.4, fill: C.dim }) + t(x + 12, y + 40, l2, { a: "start", size: 7.4, fill: C.dim });
    });
    b += ln(280, 92, 300, 110, { stroke: C.boxS }) + ln(360, 92, 340, 110, { stroke: C.boxS });
    b += ln(280, 160, 300, 142, { stroke: C.boxS }) + ln(360, 160, 340, 142, { stroke: C.boxS });
    b += t(320, 224, "Snowflake runs transformation (Snowpark), open lakehouse tables (Iceberg), declarative pipelines (Dynamic Tables) and AI (Cortex) — all on one platform", { size: 8.2, fill: C.dim });
    return svg(238, b, "Modern Snowflake platform");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
