/* ===================== DataForge Academy — diagram library =====================
   Self-contained inline-styled SVGs (fixed dark "figure card" palette) so they
   render identically in every browser and renderer. Each diagram is a string keyed
   by name; a lesson's `diagram` field selects one and app.js injects it. */
window.DIAGRAMS = (function () {
  const C = {
    card: "#161b26", tx: "#e8edf5", dim: "#aab4c4",
    box: "#222a38", boxS: "#3b4760",
    acc: "#27406e", accS: "#5b9bff", accT: "#8fb6ff",
    good: "#173d31", goodS: "#36c98a", goodT: "#5fd6a4",
    warnFill: "#3a3320", warn: "#f5b850",
    line: "#8a97aa", bronze: "#c08a4a", silver: "#9fb0c4", gold: "#e3b341",
  };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const box = (x, y, w, h, o = {}) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 8}" style="fill:${o.fill || C.box};stroke:${o.stroke || C.boxS};stroke-width:${o.sw || 1.6}"/>`;
  const circ = (cx, cy, r, o = {}) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${o.fill || C.box};stroke:${o.stroke || C.boxS};stroke-width:${o.sw ?? 1.6}${o.op ? ";opacity:" + o.op : ""}"/>`;
  const t = (x, y, s, o = {}) =>
    `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" style="fill:${o.fill || C.tx};font-size:${o.size || 12.5}px;font-weight:${o.bold ? 700 : 400};${F}">${esc(s)}</text>`;
  const ln = (x1, y1, x2, y2, o = {}) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke || C.line};stroke-width:${o.sw || 1.7}${o.dash ? ";stroke-dasharray:5 4" : ""}"/>`;
  const path = (dd, o = {}) => `<path d="${dd}" style="fill:none;stroke:${o.stroke || C.line};stroke-width:${o.sw || 1.7}"/>`;
  const tri = (x, y, o = {}) => `<polygon points="${x - 7},${y - 4} ${x},${y} ${x - 7},${y + 4}" style="fill:${o.fill || C.line}"/>`; // points right at (x,y)
  const arrowR = (x1, y, x2) => ln(x1, y, x2, y) + tri(x2, y);
  const svg = (h, body, label) =>
    `<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;

  const D = {};

  /* pipeline flow */
  D["pipeline-flow"] = (() => {
    const st = [["Sources", "apps · DBs · APIs"], ["Ingest", "batch / stream"], ["Store", "lake / warehouse"], ["Transform", "clean · model"], ["Serve", "BI · ML · apps"]];
    let b = "";
    st.forEach((s, i) => { const x = 10 + i * 124; b += box(x, 32, 104, 48, { fill: i === 4 ? C.good : C.box, stroke: i === 4 ? C.goodS : C.boxS }) + t(x + 52, 54, s[0], { bold: true }) + t(x + 52, 70, s[1], { fill: C.dim, size: 11 }); if (i < 4) b += arrowR(x + 114, 56, x + 124); });
    b += box(10, 100, 600, 30, { fill: C.warnFill, stroke: C.warn }) + t(310, 119, "＋ data quality · monitoring · governance throughout", { size: 11.5 });
    return svg(142, b, "Data pipeline flow");
  })();

  /* SQL joins — Venn with correct intersection shading */
  D["joins"] = (() => {
    const defs = `<defs><clipPath id="jc0"><circle cx="68" cy="54" r="33"/></clipPath></defs>`;
    const jn = [["INNER", "both"], ["LEFT", "all A + match"], ["RIGHT", "all B + match"], ["FULL", "all of both"]];
    let b = defs;
    jn.forEach(([nm, sub], i) => {
      const cx = 90 + i * 150, a = cx - 22, bb = cx + 22, fill = `style="fill:${C.accS};opacity:.36"`;
      if (i === 0) b += `<circle cx="${bb}" cy="54" r="33" clip-path="url(#jc0)" ${fill}/>`;
      if (i === 1) b += `<circle cx="${a}" cy="54" r="33" ${fill}/>`;
      if (i === 2) b += `<circle cx="${bb}" cy="54" r="33" ${fill}/>`;
      if (i === 3) b += `<circle cx="${a}" cy="54" r="33" ${fill}/><circle cx="${bb}" cy="54" r="33" ${fill}/>`;
      b += circ(a, 54, 33, { fill: "none", stroke: C.dim, sw: 2 }) + circ(bb, 54, 33, { fill: "none", stroke: C.dim, sw: 2 });
      b += t(a - 12, 58, "A", { fill: C.dim, size: 11 }) + t(bb + 12, 58, "B", { fill: C.dim, size: 11 });
      b += t(cx, 114, nm, { bold: true }) + t(cx, 130, sub, { fill: C.dim, size: 11 });
    });
    b += t(320, 158, 'blue = rows kept · "no match" = LEFT JOIN … WHERE B.key IS NULL', { fill: C.dim, size: 11 });
    return svg(170, b, "SQL join types");
  })();

  /* star schema */
  D["star-schema"] = (() => {
    let b = box(250, 92, 140, 56, { fill: C.acc, stroke: C.accS }) + t(320, 114, "FACT_SALES", { bold: true, fill: C.accT }) + t(320, 132, "qty · revenue · keys", { fill: C.dim, size: 11 });
    const dims = [["dim_date", "year · month", 320, 18], ["dim_product", "name · category", 70, 98], ["dim_customer", "name · country", 570, 98], ["dim_store", "city · region", 320, 188]];
    dims.forEach(dm => { const w = 132, x = dm[2] - w / 2, y = dm[3]; b += box(x, y, w, 44) + t(dm[2], y + 19, dm[0], { bold: true }) + t(dm[2], y + 34, dm[1], { fill: C.dim, size: 11 }); });
    b += ln(320, 62, 320, 92) + ln(136, 120, 250, 120) + ln(390, 120, 504, 120) + ln(320, 148, 320, 188);
    b += t(320, 250, "central fact (events) · dimensions (context) around it", { fill: C.dim, size: 11 });
    return svg(262, b, "Star schema");
  })();

  /* window vs group by */
  D["window-vs-groupby"] = (() => {
    let b = t(165, 18, "GROUP BY — collapses rows", { bold: true }) + t(480, 18, "WINDOW — keeps every row", { bold: true });
    for (let i = 0; i < 3; i++) b += box(72, 32 + i * 24, 186, 20, { r: 4 }) + t(165, 46 + i * 24, "A·10   B·20   A·30", { fill: C.dim, size: 11 });
    b += ln(165, 106, 165, 120) + tri(165, 124) /*down? use small*/;
    b = b.replace(tri(165, 124), `<polygon points="161,120 165,127 169,120" style="fill:${C.line}"/>`);
    b += box(72, 128, 186, 40, { fill: C.good, stroke: C.goodS }) + t(165, 145, "A·40", { fill: C.goodT, size: 11 }) + t(165, 161, "B·20", { fill: C.goodT, size: 11 });
    ["A·10 → running 10", "B·20 → running 20", "A·30 → running 40"].forEach((r, i) => { b += box(388, 32 + i * 32, 200, 26, { fill: C.acc, stroke: C.accS }) + t(488, 49 + i * 32, r, { fill: C.accT, size: 11 }); });
    b += t(488, 150, "SUM() OVER(...) adds a column", { fill: C.dim, size: 11 });
    return svg(180, b, "Window function vs GROUP BY");
  })();

  /* partitions & shuffle */
  D["partitions-shuffle"] = (() => {
    let b = t(320, 18, "A shuffle moves rows across the network by key", { bold: true });
    for (let i = 0; i < 4; i++) b += box(30 + i * 150, 34, 120, 40, { r: 7 }) + t(90 + i * 150, 58, "partition " + (i + 1), { fill: C.dim, size: 11 });
    b += t(320, 98, "▼  SHUFFLE — costly: network + disk  ▼", { fill: C.warn, bold: true, size: 12 });
    for (let i = 0; i < 4; i++) b += path(`M${90 + i * 150} 74 C ${90 + i * 150} 112, ${110 + i * 120} 118, ${110 + i * 120} 150`, { stroke: C.line });
    ["key A", "key B", "key C", "key D"].forEach((k, i) => { b += box(30 + i * 150, 150, 120, 40, { r: 7, fill: C.acc, stroke: C.accS }) + t(90 + i * 150, 174, k, { fill: C.accT, size: 11 }); });
    b += t(320, 212, "filter BEFORE the shuffle so fewer rows move", { fill: C.dim, size: 11 });
    return svg(224, b, "Spark partitions and shuffle");
  })();

  /* medallion */
  D["medallion"] = (() => {
    const m = [["BRONZE", "raw · as-received", C.bronze], ["SILVER", "cleaned · conformed", C.silver], ["GOLD", "business-ready", C.gold]];
    let b = "";
    m.forEach((mm, i) => { const x = 24 + i * 205; b += box(x, 40, 170, 60, { stroke: mm[2] }) + circ(x + 26, 70, 11, { fill: mm[2], stroke: mm[2] }) + t(x + 100, 66, mm[0], { bold: true, fill: mm[2] }) + t(x + 100, 84, mm[1], { fill: C.dim, size: 11 }); if (i < 2) b += arrowR(x + 170, 70, x + 205); });
    b += t(320, 130, "keep raw bronze → you can always rebuild silver & gold", { fill: C.dim, size: 11 });
    return svg(148, b, "Medallion architecture");
  })();

  /* row vs column */
  D["row-vs-column"] = (() => {
    let b = t(165, 18, "Row store (OLTP)", { bold: true }) + t(480, 18, "Column store (OLAP)", { bold: true });
    for (let r = 0; r < 3; r++)[["id", C.box], ["name", C.box], ["amount", C.acc]].forEach((c, ci) => { b += box(40 + ci * 72, 34 + r * 28, 68, 22, { r: 4, fill: c[1], stroke: c[1] === C.acc ? C.accS : C.boxS }) + t(74 + ci * 72, 49 + r * 28, c[0], { fill: c[1] === C.acc ? C.accT : C.dim, size: 10.5 }); });
    b += t(165, 142, "reads whole rows → fetch one record", { fill: C.dim, size: 11 });
    [["id", C.box], ["name", C.box], ["amount", C.acc]].forEach((c, ci) => { b += box(348 + ci * 92, 34, 84, 84, { r: 5, fill: c[1], stroke: c[1] === C.acc ? C.accS : C.boxS }) + t(390 + ci * 92, 80, c[0], { fill: c[1] === C.acc ? C.accT : C.dim, size: 11 }); });
    b += t(480, 142, "SUM(amount) reads one column → scans less", { fill: C.dim, size: 11 });
    return svg(160, b, "Row vs column storage");
  })();

  /* CAP */
  D["cap"] = (() => {
    let b = `<polygon points="320,32 110,182 530,182" style="fill:none;stroke:${C.boxS};stroke-width:1.8"/>`;
    b += circ(320, 32, 6, { fill: C.accS, stroke: C.accS }) + circ(110, 182, 6, { fill: C.accS, stroke: C.accS }) + circ(530, 182, 6, { fill: C.accS, stroke: C.accS });
    b += t(320, 22, "Consistency", { bold: true }) + t(96, 200, "Availability", { bold: true }) + t(548, 200, "Partition tol.", { bold: true });
    b += t(320, 110, "During a partition,", { fill: C.dim, size: 11 }) + t(320, 128, "pick C or A", { fill: C.accT, bold: true, size: 12 });
    b += t(208, 160, "AP", { fill: C.dim, size: 11 }) + t(432, 160, "CP", { fill: C.dim, size: 11 });
    return svg(212, b, "CAP theorem");
  })();

  /* ETL vs ELT */
  D["etl-elt"] = (() => {
    let b = "";
    [["ETL", ["Extract", "Transform", "Load"], 34], ["ELT", ["Extract", "Load", "Transform"], 100]].forEach(row => {
      b += t(46, row[2] + 24, row[0], { bold: true, a: "middle" });
      row[1].forEach((step, i) => { const x = 90 + i * 168; b += box(x, row[2], 148, 40, { fill: step === "Transform" ? C.acc : C.box, stroke: step === "Transform" ? C.accS : C.boxS }) + t(x + 74, row[2] + 24, step, { fill: step === "Transform" ? C.accT : C.tx, size: 12 }); if (i < 2) b += arrowR(x + 148, row[2] + 20, x + 168); });
    });
    b += t(320, 158, "ELT loads raw first, transforms in the warehouse — the modern default", { fill: C.dim, size: 11 });
    return svg(170, b, "ETL versus ELT");
  })();

  /* streaming windows */
  D["streaming-windows"] = (() => {
    let b = t(20, 22, "Tumbling — fixed, no overlap", { a: "start", fill: C.dim, size: 11, bold: true });
    [[40, 150], [160, 270], [280, 390]].forEach((w, i) => b += box(w[0], 30, w[1] - w[0], 20, { r: 4, fill: i % 2 ? C.acc : C.box, stroke: i % 2 ? C.accS : C.boxS }));
    b += t(20, 78, "Sliding — overlapping", { a: "start", fill: C.dim, size: 11, bold: true });
    [[40, 200], [120, 280], [200, 360]].forEach((w, i) => b += box(w[0], 86, w[1] - w[0], 18, { r: 4, fill: i % 2 ? C.acc : C.box, stroke: i % 2 ? C.accS : C.boxS, sw: 1.4 }));
    b += t(20, 134, "Session — bursts split by gaps", { a: "start", fill: C.dim, size: 11, bold: true });
    [[40, 130], [170, 230], [300, 420]].forEach(w => b += box(w[0], 142, w[1] - w[0], 20, { r: 4 }));
    b += t(540, 96, "grouped by", { fill: C.dim, size: 11 }) + t(540, 112, "event time", { fill: C.accT, bold: true, size: 11 });
    return svg(180, b, "Streaming window types");
  })();

  /* watermark */
  D["watermark"] = (() => {
    let b = arrowR(30, 92, 612) + t(600, 112, "event time →", { a: "end", fill: C.dim, size: 11 });
    b += box(60, 62, 180, 30, { r: 5, fill: C.acc, stroke: C.accS }) + t(150, 82, "window 10:00–10:01", { fill: C.accT, size: 11 });
    b += ln(372, 40, 372, 112, { dash: true, stroke: C.warn }) + t(372, 32, "watermark", { bold: true, fill: C.warn }) + t(372, 128, "= max seen − grace", { fill: C.dim, size: 11 });
    b += circ(120, 92, 5, { fill: C.goodS, stroke: C.goodS }) + circ(210, 92, 5, { fill: C.goodS, stroke: C.goodS }) + circ(470, 92, 5, { fill: C.warn, stroke: C.warn });
    b += t(470, 76, "late!", { fill: C.warn, size: 11, bold: true });
    b += t(150, 150, "on-time events counted", { fill: C.dim, size: 11 }) + t(470, 150, "after watermark → late-data policy", { fill: C.dim, size: 11 });
    return svg(165, b, "Watermark and late data");
  })();

  /* lakehouse = lake + log */
  D["lakehouse"] = (() => {
    let b = box(36, 44, 168, 74, { r: 10 }) + t(120, 38, "Data Lake", { bold: true }) + t(120, 74, "cheap files (Parquet)", { fill: C.dim, size: 11 }) + t(120, 92, "in object storage", { fill: C.dim, size: 11 });
    b += t(244, 88, "＋", { bold: true, size: 22 });
    b += box(280, 44, 170, 74, { r: 10, fill: C.acc, stroke: C.accS }) + t(365, 38, "Transaction log", { bold: true, fill: C.accT }) + t(365, 74, "Delta · Iceberg · Hudi", { fill: C.dim, size: 11 }) + t(365, 92, "ACID · updates · time-travel", { fill: C.dim, size: 10.5 });
    b += t(486, 88, "＝", { bold: true, size: 22 });
    b += box(512, 44, 110, 74, { r: 10, fill: C.good, stroke: C.goodS }) + t(567, 78, "Lakehouse", { bold: true, fill: C.goodT }) + t(567, 96, "scale + safety", { fill: C.dim, size: 11 });
    b += t(320, 144, "lake cost & scale + warehouse reliability", { fill: C.dim, size: 11 });
    return svg(160, b, "Lakehouse architecture");
  })();

  /* lambda vs kappa */
  D["lambda-kappa"] = (() => {
    let b = t(165, 18, "Lambda — two paths", { bold: true });
    b += box(40, 36, 90, 30, { r: 6 }) + t(85, 56, "source", { fill: C.dim, size: 11 });
    b += box(190, 32, 120, 26, { r: 6, fill: C.acc, stroke: C.accS }) + t(250, 49, "stream (fast)", { fill: C.accT, size: 10.5 });
    b += box(190, 70, 120, 26, { r: 6 }) + t(250, 87, "batch (accurate)", { fill: C.dim, size: 10.5 });
    b += path("M130 51 H160 M160 51 V45 H190 M160 51 V83 H190", { stroke: C.line });
    b += box(40, 116, 270, 28, { r: 6, fill: C.good, stroke: C.goodS }) + t(175, 135, "serving layer merges both", { fill: C.goodT, size: 11 });
    b += t(165, 168, "powerful but two codebases", { fill: C.dim, size: 11 });
    b += ln(330, 20, 330, 178, { dash: true, stroke: C.boxS });
    b += t(490, 18, "Kappa — one path", { bold: true });
    b += box(380, 50, 90, 30, { r: 6 }) + t(425, 70, "source", { fill: C.dim, size: 11 });
    b += box(500, 50, 110, 30, { r: 6, fill: C.acc, stroke: C.accS }) + t(555, 70, "stream only", { fill: C.accT, size: 10.5 });
    b += arrowR(470, 65, 500);
    b += box(430, 116, 150, 28, { r: 6, fill: C.good, stroke: C.goodS }) + t(505, 135, "serving layer", { fill: C.goodT, size: 11 });
    b += t(490, 168, "simpler · reprocess by replay", { fill: C.dim, size: 11 });
    return svg(184, b, "Lambda vs Kappa architecture");
  })();

  /* sharding & replication */
  D["sharding-replication"] = (() => {
    let b = t(165, 18, "Sharding — split by key", { bold: true });
    ["A–H", "I–P", "Q–Z"].forEach((s, i) => b += box(40 + i * 90, 40, 76, 40, { r: 7, fill: C.acc, stroke: C.accS }) + t(78 + i * 90, 64, s, { fill: C.accT, size: 11 }));
    b += t(165, 108, "handles size (more data)", { fill: C.dim, size: 11 });
    b += t(485, 18, "Replication — copies", { bold: true });
    b += box(445, 40, 80, 34, { r: 7, fill: C.acc, stroke: C.accS }) + t(485, 62, "primary", { fill: C.accT, size: 11 });
    b += box(385, 92, 80, 30, { r: 7 }) + t(425, 112, "replica", { fill: C.dim, size: 11 }) + box(505, 92, 80, 30, { r: 7 }) + t(545, 112, "replica", { fill: C.dim, size: 11 });
    b += path("M485 74 V82 M425 82 H545 M425 82 V92 M545 82 V92", { stroke: C.line });
    b += t(485, 142, "reliability + read scale", { fill: C.dim, size: 11 });
    return svg(156, b, "Sharding and replication");
  })();

  /* spark architecture */
  D["spark-architecture"] = (() => {
    let b = box(240, 20, 160, 46, { r: 9, fill: C.acc, stroke: C.accS }) + t(320, 40, "Driver", { bold: true, fill: C.accT }) + t(320, 57, "plans the DAG", { fill: C.dim, size: 11 });
    b += box(250, 90, 140, 30, { r: 7 }) + t(320, 110, "Cluster manager", { fill: C.dim, size: 11 });
    for (let i = 0; i < 3; i++) b += box(60 + i * 190, 148, 150, 44, { r: 8 }) + t(135 + i * 190, 168, "Executor " + (i + 1), { bold: true }) + t(135 + i * 190, 184, "runs tasks on partitions", { fill: C.dim, size: 10 });
    b += ln(320, 66, 320, 90);
    for (let i = 0; i < 3; i++) b += path(`M320 120 C 320 134, ${135 + i * 190} 134, ${135 + i * 190} 148`, { stroke: C.line });
    return svg(202, b, "Spark cluster architecture");
  })();

  /* SCD type 2 */
  D["scd2"] = (() => {
    let b = t(320, 18, "SCD2 — customer moves city, history kept", { bold: true });
    b += box(40, 40, 560, 30, { r: 6 }) + t(54, 60, "key 1 · Ava · London · valid 2024-01→2025-05 · current = N", { a: "start", fill: C.dim, size: 11 });
    b += box(40, 80, 560, 30, { r: 6, fill: C.acc, stroke: C.accS }) + t(54, 100, "key 2 · Ava · Berlin · valid 2025-05→∞ · current = Y", { a: "start", fill: C.accT, size: 11 });
    b += t(320, 134, "same natural key (Ava), new surrogate key + validity dates", { fill: C.dim, size: 11 });
    b += t(320, 152, "old facts still point to the old row → history stays correct", { fill: C.dim, size: 11 });
    return svg(166, b, "Slowly changing dimension type 2");
  })();

  /* ---------- new diagrams ---------- */

  /* LSM tree */
  D["lsm-tree"] = (() => {
    let b = t(320, 18, "LSM tree — fast writes via sequential appends", { bold: true });
    b += box(40, 40, 150, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(115, 60, "MemTable", { bold: true, fill: C.accT }) + t(115, 75, "(in memory)", { fill: C.dim, size: 10 });
    b += t(115, 30, "writes →", { fill: C.dim, size: 11 });
    b += path("M190 60 H230", { stroke: C.line }) + tri(230, 60) + t(210, 50, "flush", { fill: C.dim, size: 10 });
    for (let i = 0; i < 3; i++) b += box(245 + i * 90, 40, 78, 40, { r: 6 }) + t(284 + i * 90, 64, "SSTable", { fill: C.dim, size: 10.5 });
    b += t(540, 60, "immutable", { fill: C.dim, size: 10 });
    b += path("M245 88 C 300 120, 420 120, 480 96", { stroke: C.goodS }) + t(360, 128, "compaction merges files in the background", { fill: C.goodT, size: 11 });
    b += t(320, 150, "great for write-heavy / high-ingest (Cassandra, RocksDB)", { fill: C.dim, size: 11 });
    return svg(164, b, "LSM tree storage engine");
  })();

  /* kafka */
  D["kafka"] = (() => {
    let b = t(320, 18, "Kafka topic — partitions + consumer group", { bold: true });
    b += box(20, 40, 90, 30, { r: 6, fill: C.acc, stroke: C.accS }) + t(65, 60, "producer", { fill: C.accT, size: 11 });
    for (let i = 0; i < 3; i++) { const y = 38 + i * 40; b += box(150, y, 250, 30, { r: 5 }) + t(165, y + 19, "P" + i + ":", { a: "start", fill: C.dim, size: 10.5 }); for (let k = 0; k < 5; k++) b += box(196 + k * 38, y + 5, 30, 20, { r: 3, fill: C.box, stroke: C.boxS }) + t(211 + k * 38, y + 19, (k), { fill: C.dim, size: 9 }); b += arrowR(110, 55, 150).replace("55", String(y + 15)); }
    b += t(275, 175, "offsets (ordered within a partition) →", { fill: C.dim, size: 10 });
    [["C1", 38], ["C2", 78], ["C3", 118]].forEach(c => { b += box(440, c[1], 80, 30, { r: 6, fill: C.good, stroke: C.goodS }) + t(480, c[1] + 19, "consumer " + c[0][1], { fill: C.goodT, size: 10 }); b += arrowR(400, c[1] + 15, 440); });
    b += t(560, 95, "one partition", { fill: C.dim, size: 10 }) + t(560, 109, "per consumer", { fill: C.dim, size: 10 });
    return svg(192, b, "Kafka topic, partitions and consumer group");
  })();

  /* normalization */
  D["normalization"] = (() => {
    let b = t(150, 18, "One wide table (repeats data)", { bold: true });
    b += box(30, 32, 250, 70, { r: 8, fill: C.warnFill, stroke: C.warn });
    b += t(44, 52, "order · Ava · London · Laptop", { a: "start", fill: C.tx, size: 10.5 }) + t(44, 70, "order · Ava · London · Mouse", { a: "start", fill: C.tx, size: 10.5 }) + t(44, 88, "order · Ava · London · Desk", { a: "start", fill: C.tx, size: 10.5 });
    b += t(155, 118, "'Ava · London' repeated → update anomalies", { fill: C.warn, size: 10.5 });
    b += path("M290 66 H330", { stroke: C.line }) + tri(330, 66) + t(310, 56, "3NF", { fill: C.dim, size: 10 });
    b += box(345, 30, 130, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(410, 50, "customers", { bold: true, fill: C.accT }) + t(410, 65, "id · name · city", { fill: C.dim, size: 10 });
    b += box(345, 86, 130, 44, { r: 8 }) + t(410, 106, "orders", { bold: true }) + t(410, 121, "id · cust_id · item", { fill: C.dim, size: 10 });
    b += path("M410 74 V86", { stroke: C.line });
    b += t(540, 80, "each fact", { fill: C.dim, size: 10.5 }) + t(540, 95, "stored once", { fill: C.dim, size: 10.5 });
    return svg(146, b, "Normalization splits repeating data");
  })();

  /* lakehouse partition layout */
  D["lakehouse-layout"] = (() => {
    let b = t(320, 18, "Partition by date → prune to one folder", { bold: true });
    b += box(30, 36, 120, 96, { r: 8 }) + t(90, 54, "events/", { a: "start", fill: C.dim, size: 11 });
    ["2025-05-01", "2025-05-02", "2025-05-03"].forEach((dd, i) => b += box(46, 64 + i * 22, 90, 18, { r: 3, fill: i === 1 ? C.acc : C.box, stroke: i === 1 ? C.accS : C.boxS }) + t(58, 77 + i * 22, dd, { a: "start", fill: i === 1 ? C.accT : C.dim, size: 9.5 }));
    b += path("M150 84 H196", { stroke: C.line }) + tri(196, 84) + t(173, 74, "query", { fill: C.dim, size: 9.5 }) + t(173, 100, "date=05-02", { fill: C.dim, size: 9 });
    b += box(210, 60, 160, 48, { r: 8, fill: C.good, stroke: C.goodS }) + t(290, 80, "reads 1 folder", { bold: true, fill: C.goodT, size: 11.5 }) + t(290, 97, "not the whole table", { fill: C.dim, size: 10 });
    b += t(500, 70, "+ Z-order / cluster", { fill: C.dim, size: 11 }) + t(500, 86, "→ skip files via", { fill: C.dim, size: 11 }) + t(500, 102, "min/max stats", { fill: C.dim, size: 11 });
    b += t(320, 150, "scanning less data = faster AND cheaper", { fill: C.dim, size: 11 });
    return svg(164, b, "Partitioning and data skipping");
  })();

  /* encryption */
  D["encryption"] = (() => {
    let b = t(165, 18, "At rest — stored data", { bold: true });
    b += box(60, 36, 210, 44, { r: 8 }) + t(110, 60, "disk", { fill: C.tx, size: 12 }) + t(200, 54, "encrypted files", { fill: C.dim, size: 10.5 }) + t(200, 70, "useless without key", { fill: C.dim, size: 10 });
    b += t(485, 18, "In transit — over network", { bold: true });
    b += box(380, 40, 70, 34, { r: 7, fill: C.acc, stroke: C.accS }) + t(415, 61, "app", { fill: C.accT, size: 11 });
    b += box(540, 40, 80, 34, { r: 7, fill: C.acc, stroke: C.accS }) + t(580, 61, "storage", { fill: C.accT, size: 11 });
    b += path("M450 57 H540", { stroke: C.goodS }) + t(495, 47, "TLS", { fill: C.goodT, size: 10.5 });
    b += box(180, 104, 280, 32, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(320, 124, "keys live in a KMS — rotated & access-controlled", { fill: C.warn, size: 11 });
    return svg(150, b, "Encryption at rest and in transit");
  })();

  /* data mesh */
  D["data-mesh"] = (() => {
    let b = t(320, 18, "Data mesh — domains own data products", { bold: true });
    ["Orders", "Payments", "Marketing"].forEach((dm, i) => { const x = 40 + i * 200; b += box(x, 36, 170, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(x + 85, 56, dm + " domain", { bold: true, fill: C.accT, size: 11.5 }) + t(x + 85, 74, "owns its data product", { fill: C.dim, size: 10 }) + t(x + 85, 87, "(docs · SLA · quality)", { fill: C.dim, size: 9.5 }); });
    b += box(40, 108, 530, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(305, 127, "self-serve platform  +  federated governance (contracts · security)", { fill: C.goodT, size: 11 });
    return svg(150, b, "Data mesh");
  })();

  /* scaling */
  D["scaling"] = (() => {
    let b = t(160, 18, "Vertical — bigger machine", { bold: true });
    b += box(120, 60, 80, 30, { r: 6 }) + box(112, 44, 96, 46, { r: 7, fill: "none", stroke: C.accS }) + t(160, 80, "1 big node", { fill: C.dim, size: 10.5 });
    b += t(160, 116, "simple, but limited", { fill: C.dim, size: 11 });
    b += ln(320, 24, 320, 130, { dash: true, stroke: C.boxS });
    b += t(480, 18, "Horizontal — more machines", { bold: true });
    for (let i = 0; i < 4; i++) b += box(380 + i * 58, 50, 46, 34, { r: 6, fill: C.acc, stroke: C.accS });
    b += t(480, 73, "+  +  +  +", { fill: C.accT, size: 11 });
    b += t(480, 116, "scale out via sharding", { fill: C.dim, size: 11 });
    return svg(140, b, "Vertical vs horizontal scaling");
  })();

  /* broadcast join */
  D["broadcast-join"] = (() => {
    let b = t(320, 18, "Broadcast join — copy small table to every executor", { bold: true });
    b += box(250, 34, 140, 34, { r: 7, fill: C.acc, stroke: C.accS }) + t(320, 55, "small dim (10k rows)", { fill: C.accT, size: 10.5 });
    for (let i = 0; i < 3; i++) { const x = 70 + i * 200; b += box(x, 120, 150, 46, { r: 8 }) + t(x + 75, 140, "Executor " + (i + 1), { bold: true, size: 11 }) + t(x + 75, 156, "big partition + copy", { fill: C.dim, size: 10 }); b += path(`M320 68 C 320 95, ${x + 75} 95, ${x + 75} 120`, { stroke: C.goodS }); }
    b += t(320, 188, "no shuffle of the big table — joins happen locally", { fill: C.goodT, size: 11 });
    return svg(202, b, "Broadcast join");
  })();

  /* quorum */
  D["quorum"] = (() => {
    let b = t(320, 18, "Quorum: R + W > N → read sees latest write", { bold: true });
    b += t(120, 44, "N = 3 replicas", { fill: C.dim, size: 11 });
    for (let i = 0; i < 3; i++) b += circ(70 + i * 70, 92, 24, { fill: i < 2 ? C.acc : C.box, stroke: i < 2 ? C.accS : C.boxS }) + t(70 + i * 70, 96, "R" + (i + 1), { fill: i < 2 ? C.accT : C.dim, size: 11 });
    b += t(140, 140, "W = 2 (write to 2)", { fill: C.accT, size: 11 });
    b += t(460, 60, "R = 2  +  W = 2  =  4", { bold: true, size: 13 }) + t(460, 84, "4 > 3 ✓  → strong consistency", { fill: C.goodT, size: 11.5 });
    b += t(460, 116, "R=1, W=1 → fast but maybe stale", { fill: C.dim, size: 11 });
    return svg(158, b, "Quorum consistency");
  })();

  /* CDC flow */
  D["cdc-flow"] = (() => {
    let b = t(320, 18, "CDC — stream DB changes (incl. deletes) to the lakehouse", { bold: true });
    const steps = [["Source DB", "binlog/WAL"], ["Debezium", "reads log"], ["Kafka", "change events"], ["MERGE", "into Delta/Iceberg"]];
    steps.forEach((s, i) => { const x = 20 + i * 158; b += box(x, 50, 140, 46, { r: 8, fill: i === 3 ? C.good : C.box, stroke: i === 3 ? C.goodS : C.boxS }) + t(x + 70, 70, s[0], { bold: true, fill: i === 3 ? C.goodT : C.tx, size: 11.5 }) + t(x + 70, 86, s[1], { fill: C.dim, size: 10 }); if (i < 3) b += arrowR(x + 140, 73, x + 162); });
    b += t(320, 124, "lakehouse table mirrors the source — inserts, updates AND deletes", { fill: C.dim, size: 11 });
    return svg(140, b, "Change data capture flow");
  })();

  /* semantic layer */
  D["semantic-layer"] = (() => {
    let b = t(320, 18, "Semantic layer — one definition, every tool agrees", { bold: true });
    b += box(250, 40, 140, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 58, "metric: revenue", { bold: true, fill: C.accT, size: 11 }) + t(320, 73, "defined once", { fill: C.dim, size: 10 });
    ["BI dashboard", "notebook", "API"].forEach((c, i) => { const x = 70 + i * 180; b += box(x, 120, 130, 36, { r: 7 }) + t(x + 65, 142, c, { fill: C.dim, size: 11 }); b += path(`M320 80 C 320 100, ${x + 65} 100, ${x + 65} 120`, { stroke: C.line }); });
    b += t(320, 178, "no more 'three teams, three revenue numbers'", { fill: C.goodT, size: 11 });
    return svg(192, b, "Semantic layer");
  })();

  /* OLTP -> OLAP movement */
  D["oltp-olap-flow"] = (() => {
    let b = t(150, 18, "OLTP (run the business)", { bold: true });
    b += box(60, 38, 180, 52, { r: 9, fill: C.acc, stroke: C.accS }) + t(150, 60, "app databases", { bold: true, fill: C.accT, size: 11.5 }) + t(150, 77, "many tiny txns · row-store", { fill: C.dim, size: 10 });
    b += arrowR(240, 64, 400) + t(320, 54, "pipeline (ELT)", { fill: C.dim, size: 10.5 }) + t(320, 80, "extract · load", { fill: C.dim, size: 10 });
    b += t(500, 18, "OLAP (analyze it)", { bold: true });
    b += box(410, 38, 200, 52, { r: 9, fill: C.good, stroke: C.goodS }) + t(510, 60, "warehouse / lakehouse", { bold: true, fill: C.goodT, size: 11 }) + t(510, 77, "big scans · column-store", { fill: C.dim, size: 10 });
    b += t(320, 118, "DE moves data from OLTP sources into OLAP analytics — without slowing the business", { fill: C.dim, size: 11 });
    return svg(134, b, "Moving data from OLTP to OLAP");
  })();

  return D;
})();
/* DataForge diagram library — 28 figures, inline-styled, self-contained. */
