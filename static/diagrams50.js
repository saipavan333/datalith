/* DataForge Academy — diagram pack 50 (Databricks deep-dive vol. 4: Structured Streaming in depth). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    dx:"#3a1a12", dxS:"#ff5a36", dxT:"#ff9b85", vio:"#2c2350", vioS:"#a78bfa", vioT:"#c4b5fd" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dbx-ss-model — unbounded table + micro-batch */
  D["dbx-ss-model"] = (() => {
    let b = t(320, 20, "Structured Streaming — a stream is an unbounded table", { bold: true });
    b += box(16, 54, 150, 80, { r: 9, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(91, 72, "input stream", { bold: true, size: 9, fill: C.dxT }) + t(91, 90, "rows arrive", { size: 7.4, fill: C.dim }) + t(91, 104, "over time", { size: 7.4, fill: C.dim }) + t(91, 124, "Kafka / files", { size: 7.2, mono: true, fill: C.dim });
    b += box(196, 54, 160, 80, { r: 9, fill: C.acc, stroke: C.accS }) + t(276, 71, "unbounded input table", { bold: true, size: 8.6, fill: C.accT });
    [0, 1, 2].forEach(i => b += box(216, 82 + i * 11, 120, 7, { r: 2, fill: i === 2 ? C.dxS : C.boxS, sw: 0.8 }));
    b += t(276, 128, "rows appended forever", { size: 7, fill: C.dim });
    b += box(386, 54, 130, 80, { r: 9 }) + t(451, 72, "your query", { bold: true, size: 9 }) + t(451, 90, "select / agg", { size: 7.4, mono: true, fill: C.dim }) + t(451, 104, "/ join", { size: 7.4, mono: true, fill: C.dim }) + t(451, 124, "incremental", { size: 7.2, fill: C.dxT });
    b += box(546, 54, 78, 80, { r: 9, fill: C.good, stroke: C.goodS }) + t(585, 78, "result", { bold: true, size: 8.6, fill: C.goodT }) + t(585, 96, "table", { size: 8, fill: C.goodT }) + t(585, 116, "→ sink", { size: 7.4, fill: C.dim });
    b += arrowR(166, 94, 194) + arrowR(356, 94, 384) + arrowR(516, 94, 544);
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "engine runs the query incrementally per micro-batch (trigger); output modes: append · update · complete", { size: 7.4, fill: C.warn });
    b += t(320, 196, "You write a batch-style query once; the engine keeps re-running it on new rows as a continuous, incremental computation.", { size: 7.2, fill: C.dim });
    return svg(210, b, "Structured Streaming model");
  })();

  /* dbx-ss-sources-sinks — checkpoint exactly-once */
  D["dbx-ss-sources-sinks"] = (() => {
    let b = t(320, 20, "Sources + sinks + checkpoint = exactly-once", { bold: true });
    b += box(20, 54, 132, 76, { r: 9, fill: C.acc, stroke: C.accS }) + t(86, 72, "sources", { bold: true, size: 9, fill: C.accT });
    ["Kafka", "Auto Loader", "Delta table"].forEach((s, i) => b += t(86, 90 + i * 14, s, { size: 7.6, mono: true, fill: C.dim }));
    b += box(186, 54, 150, 76, { r: 9, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(261, 74, "streaming query", { bold: true, size: 9, fill: C.dxT }) + t(261, 94, "readStream", { size: 7.4, mono: true, fill: C.dim }) + t(261, 108, "→ transform →", { size: 7.4, mono: true, fill: C.dim }) + t(261, 122, "writeStream", { size: 7.4, mono: true, fill: C.dim });
    b += box(370, 54, 132, 76, { r: 9, fill: C.good, stroke: C.goodS }) + t(436, 72, "sinks", { bold: true, size: 9, fill: C.goodT });
    ["Delta table", "Kafka", "foreachBatch"].forEach((s, i) => b += t(436, 90 + i * 14, s, { size: 7.6, mono: true, fill: C.dim }));
    b += box(516, 60, 108, 64, { r: 9, fill: C.vio, stroke: C.vioS }) + t(570, 80, "checkpoint", { bold: true, size: 8.6, fill: C.vioT }) + t(570, 98, "offsets +", { size: 7.2, mono: true, fill: C.dim }) + t(570, 110, "state + WAL", { size: 7.2, mono: true, fill: C.dim });
    b += arrowR(152, 92, 184) + arrowR(336, 92, 368);
    b += ln(261, 130, 261, 142, { stroke: C.vioS }) + ln(261, 142, 570, 142, { stroke: C.vioS }) + ln(570, 142, 570, 124, { stroke: C.vioS }) + tri(570, 126, { fill: C.vioS, });
    b += box(16, 156, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 173, "checkpoint records progress (offsets) + state; replay after failure + idempotent/transactional sink ⇒ exactly-once", { size: 7.3, fill: C.warn });
    b += t(320, 202, "The checkpoint is the heart of fault tolerance: never delete it, and never share one between two different queries.", { size: 7.2, fill: C.dim });
    return svg(216, b, "Streaming sources sinks checkpoint");
  })();

  /* dbx-ss-watermark — event time + windows */
  D["dbx-ss-watermark"] = (() => {
    let b = t(320, 20, "Event-time windows & watermarks", { bold: true });
    b += ln(40, 96, 600, 96, { stroke: C.line, sw: 1.4 }) + t(610, 99, "time", { a: "end", size: 7.4, fill: C.dim });
    [["10:00", 90], ["10:05", 230], ["10:10", 370], ["10:15", 510]].forEach(([lbl, x]) => b += ln(x, 92, x, 100, { stroke: C.dim }) + t(x, 114, lbl, { size: 7, mono: true, fill: C.dim }));
    // windows
    [[60, "w1"], [200, "w2"], [340, "w3"]].forEach(([x, w]) => b += box(x, 60, 130, 24, { r: 5, fill: C.acc, stroke: C.accS, sw: 1.2 }) + t(x + 65, 76, w + " [5-min]", { size: 7.4, fill: C.accT }));
    // on-time event
    b += `<circle cx="150" cy="96" r="5" style="fill:${C.goodS}"/>` + t(150, 52, "on-time", { size: 6.8, fill: C.goodT });
    // late event within watermark
    b += `<circle cx="300" cy="96" r="5" style="fill:${C.warn}"/>`;
    // watermark line
    b += ln(470, 56, 470, 104, { stroke: C.dxS, sw: 2 }) + t(470, 134, "watermark", { size: 7.4, fill: C.dxT, bold: true }) + t(470, 146, "max event time − delay", { size: 6.8, fill: C.dim });
    // too-late event
    b += `<circle cx="250" cy="96" r="5" style="fill:${C.badS}"/>` + t(250, 158, "too late → dropped", { size: 7, fill: C.badT });
    b += box(16, 168, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 185, "watermark = how long to wait for late data; past it, windows finalize & their state is dropped (bounds memory)", { size: 7.3, fill: C.warn });
    b += t(320, 214, "Aggregate by event time, not arrival time; the watermark trades a little latency for correct, bounded-state results.", { size: 7.2, fill: C.dim });
    return svg(228, b, "Event time windows and watermarks");
  })();

  /* dbx-ss-stateful — state store */
  D["dbx-ss-stateful"] = (() => {
    let b = t(320, 20, "Stateful streaming — aggregations, joins, dedup", { bold: true });
    ["batch t1", "batch t2", "batch t3"].forEach((s, i) => { const x = 24 + i * 92; b += box(x, 56, 80, 34, { r: 7, fill: C.dx, stroke: C.dxS }) + t(x + 40, 77, s, { size: 8, fill: C.dxT, mono: true }); if (i < 2) b += arrowR(x + 80, 73, x + 92 - 2); });
    b += box(330, 50, 294, 90, { r: 10, fill: C.vio, stroke: C.vioS, sw: 2 }) + t(477, 70, "state store (RocksDB)", { bold: true, size: 9, fill: C.vioT });
    ["running aggregates per key", "join buffers (stream-stream)", "seen keys (dropDuplicates)"].forEach((s, i) => b += t(346, 90 + i * 15, "• " + s, { a: "start", size: 7.6, fill: C.dim }));
    b += ln(304, 73, 320, 73, { stroke: C.vioS }) + ln(320, 73, 320, 95, { stroke: C.vioS }) + arrowR(320, 95, 328, { stroke: C.vioS });
    b += box(16, 152, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "state persists across micro-batches (checkpointed); a watermark expires old state so it can't grow forever", { size: 7.4, fill: C.warn });
    b += t(320, 198, "Stateful ops remember across batches; always pair them with a watermark so the state store stays bounded.", { size: 7.2, fill: C.dim });
    return svg(212, b, "Stateful streaming and the state store");
  })();

  /* dbx-autoloader — incremental file ingestion */
  D["dbx-autoloader"] = (() => {
    let b = t(320, 20, "Auto Loader — incremental file ingestion at scale", { bold: true });
    b += box(20, 56, 150, 80, { r: 9, fill: C.acc, stroke: C.accS }) + t(95, 74, "cloud storage", { bold: true, size: 9, fill: C.accT }) + t(95, 92, "new files land", { size: 7.4, fill: C.dim }) + t(95, 106, "JSON/CSV/Parquet", { size: 7, mono: true, fill: C.dim }) + t(95, 124, "millions of files", { size: 7.2, fill: C.dim });
    b += box(200, 50, 230, 92, { r: 10, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(315, 68, "Auto Loader (cloudFiles)", { bold: true, size: 8.8, fill: C.dxT });
    ["tracks processed files (RocksDB)", "directory listing OR file events", "schema inference + evolution"].forEach((s, i) => b += t(216, 86 + i * 15, "• " + s, { a: "start", size: 7.2, fill: C.dim }));
    b += box(460, 56, 164, 80, { r: 9, fill: C.good, stroke: C.goodS }) + t(542, 74, "Delta Bronze", { bold: true, size: 9, fill: C.goodT }) + t(542, 92, "exactly-once", { size: 7.4, fill: C.dim }) + t(542, 106, "incremental load", { size: 7.4, fill: C.dim }) + t(542, 124, "rescue bad data", { size: 7.2, fill: C.dim });
    b += arrowR(170, 96, 198) + arrowR(430, 96, 458);
    b += box(16, 156, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 173, "only new files are processed (no re-scan); scales to millions of files; _rescued_data catches mismatched fields", { size: 7.3, fill: C.warn });
    b += t(320, 202, "Auto Loader is the standard way to ingest files into the lakehouse: incremental, exactly-once, schema-aware.", { size: 7.2, fill: C.dim });
    return svg(216, b, "Auto Loader incremental ingestion");
  })();

  /* dbx-dlt — declarative pipelines */
  D["dbx-dlt"] = (() => {
    let b = t(320, 20, "Lakeflow Declarative Pipelines (DLT) — managed medallion", { bold: true });
    b += box(16, 56, 178, 86, { r: 9, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(105, 74, "you declare tables", { bold: true, size: 8.8, fill: C.dxT }) + t(105, 94, "@dlt.table def silver()", { size: 7, mono: true, fill: C.dim }) + t(105, 108, "return spark.read…", { size: 7, mono: true, fill: C.dim }) + t(105, 126, "+ EXPECT quality rules", { size: 7, fill: C.dim });
    b += arrowR(194, 99, 222, { stroke: C.dxS, sw: 2 });
    // pipeline graph
    [["Bronze", C.acc, C.accS], ["Silver", C.vio, C.vioS], ["Gold", C.good, C.goodS]].forEach(([s, f, st], i) => { const x = 230 + i * 100; b += box(x, 74, 84, 48, { r: 8, fill: f, stroke: st }) + t(x + 42, 102, s, { bold: true, size: 9, fill: C.tx }); if (i < 2) b += arrowR(x + 84, 98, x + 100 - 2); });
    b += t(372, 64, "auto-built dependency graph", { size: 7, fill: C.dim });
    b += box(16, 156, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 173, "the platform infers the DAG, orchestrates, retries, autoscales, and enforces expectations (drop / quarantine / fail)", { size: 7.2, fill: C.warn });
    b += t(320, 202, "You declare what each table is and its quality rules; the platform runs, monitors, and recovers the pipeline for you.", { size: 7.2, fill: C.dim });
    return svg(216, b, "Declarative pipelines DLT");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
