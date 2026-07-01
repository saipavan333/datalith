/* DataForge Academy — diagram pack 61 (GCP deep-dive vol. 2: Dataflow / Apache Beam). */
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
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* df-beam-model — unified pipeline */
  D["df-beam-model"] = (() => {
    let b = t(320, 20, "Apache Beam — one model, batch + streaming", { bold: true });
    b += box(20, 56, 110, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(75, 76, "source", { bold: true, size: 8.4, fill: C.accT }) + t(75, 94, "GCS / Pub/Sub", { size: 7, fill: C.dim });
    b += box(150, 56, 130, 56, { r: 9, fill: C.gB, stroke: C.gBS, sw: 2 }) + t(215, 74, "PCollection", { bold: true, size: 8.4, fill: C.gBT }) + t(215, 90, "→ PTransform →", { size: 7, mono: true, fill: C.dim }) + t(215, 104, "(ParDo, GroupBy…)", { size: 6.8, fill: C.dim });
    b += box(300, 56, 130, 56, { r: 9, fill: C.gB, stroke: C.gBS, sw: 2 }) + t(365, 74, "PCollection", { bold: true, size: 8.4, fill: C.gBT }) + t(365, 90, "transformed", { size: 7, fill: C.dim });
    b += box(450, 56, 110, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(505, 76, "sink", { bold: true, size: 8.4, fill: C.goodT }) + t(505, 94, "BigQuery / GCS", { size: 7, fill: C.dim });
    b += box(578, 56, 46, 56, { r: 8, fill: C.gY, stroke: C.gYS }) + t(601, 80, "run", { bold: true, size: 7.4, fill: C.gYT }) + t(601, 96, "-ner", { size: 6.8, fill: C.dim });
    b += arrowR(130, 84, 148) + arrowR(280, 84, 298) + arrowR(430, 84, 448) + arrowR(560, 84, 576, { stroke: C.gYS });
    b += box(16, 128, 304, 26, { r: 8, fill: C.gG, stroke: C.gGS }) + t(168, 145, "bounded (batch) + unbounded (streaming) — SAME code", { size: 7.2, fill: C.gGT });
    b += box(328, 128, 296, 26, { r: 8, fill: C.gY, stroke: C.gYS }) + t(476, 145, "portable: Dataflow / Flink / Spark runners", { size: 7.2, fill: C.gYT });
    b += t(320, 174, "Beam is a unified, portable model: define a pipeline of PCollections + transforms; one code path for batch and streaming.", { size: 7, fill: C.dim });
    return svg(188, b, "Apache Beam model");
  })();

  /* df-windowing — windows + watermarks + triggers */
  D["df-windowing"] = (() => {
    let b = t(320, 20, "Windowing, watermarks & triggers (event time)", { bold: true });
    b += ln(40, 92, 600, 92, { stroke: C.line, sw: 1.3 }) + t(610, 95, "time", { a: "end", size: 7, fill: C.dim });
    [[60, "fixed"], [200, "fixed"], [340, "sliding"]].forEach(([x, w]) => b += box(x, 58, 130, 22, { r: 5, fill: C.gB, stroke: C.gBS, sw: 1.2 }) + t(x + 65, 73, w + " window", { size: 7, fill: C.gBT }));
    b += `<circle cx="150" cy="92" r="4.5" style="fill:${C.gGS}"/>` + `<circle cx="300" cy="92" r="4.5" style="fill:${C.gYS}"/>` + `<circle cx="250" cy="92" r="4.5" style="fill:${C.gRS}"/>`;
    b += ln(470, 54, 470, 100, { stroke: C.gRS, sw: 2 }) + t(470, 116, "watermark", { size: 7.2, fill: C.gRT, bold: true }) + t(470, 127, "(event-time progress)", { size: 6.6, fill: C.dim });
    b += t(250, 142, "too late → allowed-lateness / dropped", { size: 7, fill: C.badT });
    b += box(16, 152, 608, 38, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "triggers decide WHEN to emit a window's result: on watermark (on-time), early (speculative), late (updates)", { size: 7, fill: C.warn }) + t(320, 181, "+ accumulation mode (accumulating vs discarding) — full control over completeness vs latency", { size: 6.9, fill: C.dim });
    return svg(200, b, "Beam windowing and triggers");
  })();

  /* df-transforms — core transforms */
  D["df-transforms"] = (() => {
    let b = t(320, 20, "Core transforms — the Beam building blocks", { bold: true });
    const rows = [["ParDo", "per-element map/flatmap (the workhorse, like a DoFn)"], ["GroupByKey / CoGroupByKey", "group by key / join two keyed collections"], ["Combine (+PerKey)", "associative aggregation (sum/avg/custom)"], ["side inputs", "broadcast a small view into a ParDo (lookup/enrich)"], ["stateful DoFn + timers", "per-key state & event-time timers (sessions, CEP)"], ["composite transforms", "package sub-pipelines as reusable PTransforms"]];
    rows.forEach(([h, d], i) => { const y = 48 + i * 26; b += box(28, y, 16, 16, { r: 4, fill: C.gB, stroke: C.gBS }) + t(54, y + 13, h, { a: "start", size: 8, fill: C.gBT, bold: true }) + t(280, y + 13, d, { a: "start", size: 7.2, fill: C.dim }); });
    b += box(16, 208, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 224, "transforms compose into a DAG; ParDo + GroupByKey + Combine cover most ETL, with state/timers for advanced streaming", { size: 6.9, fill: C.warn });
    return svg(242, b, "Beam transforms");
  })();

  /* df-runner — Dataflow service */
  D["df-runner"] = (() => {
    let b = t(320, 20, "Dataflow runner — serverless, autoscaling execution", { bold: true });
    b += box(20, 54, 150, 70, { r: 9, fill: C.gB, stroke: C.gBS } ) + t(95, 72, "Beam pipeline", { bold: true, size: 8.4, fill: C.gBT }) + t(95, 90, "submitted as a", { size: 7, fill: C.dim }) + t(95, 102, "Dataflow job", { size: 7, fill: C.dim });
    b += box(200, 48, 240, 84, { r: 10, fill: C.gG, stroke: C.gGS, sw: 2 }) + t(320, 66, "Dataflow service", { bold: true, size: 9, fill: C.gGT });
    ["autoscaling workers (no cluster)", "fusion: merge stages; dynamic rebalancing", "Shuffle / Streaming Engine (offloaded)"].forEach((s, i) => b += t(216, 84 + i * 14, "• " + s, { a: "start", size: 7, fill: C.dim }));
    b += box(470, 54, 154, 70, { r: 9, fill: C.good, stroke: C.goodS }) + t(547, 72, "sinks", { bold: true, size: 8.4, fill: C.goodT }) + t(547, 90, "BigQuery / GCS /", { size: 7, fill: C.dim }) + t(547, 102, "Pub/Sub", { size: 7, fill: C.dim });
    b += arrowR(170, 90, 198, { stroke: C.gGS }) + arrowR(440, 90, 468, { stroke: C.gGS });
    b += box(16, 146, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 163, "fully managed: no clusters; autoscales to load, balances stragglers, offloads shuffle/state — you submit, it runs", { size: 7, fill: C.warn });
    b += t(320, 188, "The Dataflow service executes Beam serverlessly — autoscaling, fusion, dynamic work rebalancing, managed shuffle/state.", { size: 7, fill: C.dim });
    return svg(202, b, "Dataflow runner");
  })();

  /* df-templates-patterns — templates & choosing */
  D["df-templates-patterns"] = (() => {
    let b = t(320, 20, "Templates & when to use Dataflow", { bold: true });
    b += box(20, 50, 290, 58, { r: 9, fill: C.gB, stroke: C.gBS } ) + t(165, 68, "templates (flex / classic)", { bold: true, size: 8.4, fill: C.gBT }) + t(165, 86, "package a pipeline → launch by params", { size: 7, fill: C.dim }) + t(165, 99, "Google-provided templates (no code)", { size: 7, fill: C.dim });
    b += box(326, 50, 298, 58, { r: 9, fill: C.gG, stroke: C.gGS }) + t(475, 68, "use Dataflow when…", { bold: true, size: 8.4, fill: C.gGT }) + t(475, 86, "streaming/event-time, autoscaling,", { size: 7, fill: C.dim }) + t(475, 99, "Beam portability, complex transforms", { size: 7, fill: C.dim });
    b += box(20, 120, 190, 44, { r: 8, fill: C.gR, stroke: C.gRS }) + t(115, 137, "vs Dataproc", { bold: true, size: 7.8, fill: C.gRT }) + t(115, 152, "existing Spark/Hadoop", { size: 6.8, fill: C.dim });
    b += box(225, 120, 190, 44, { r: 8, fill: C.gY, stroke: C.gYS }) + t(320, 137, "vs BigQuery", { bold: true, size: 7.8, fill: C.gYT }) + t(320, 152, "SQL-expressible ELT", { size: 6.8, fill: C.dim });
    b += box(430, 120, 194, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(527, 137, "vs Pub/Sub→BQ", { bold: true, size: 7.8, fill: C.accT }) + t(527, 152, "simple direct ingest", { size: 6.8, fill: C.dim });
    b += box(16, 176, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 192, "Dataflow for streaming/complex Beam pipelines; Dataproc for Spark; BigQuery/Dataform for SQL ELT; pick by the workload", { size: 6.9, fill: C.warn });
    return svg(210, b, "Dataflow templates and choosing");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
