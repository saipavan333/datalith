/* DataForge Academy — diagram pack 62 (GCP deep-dive vol. 3: Pub/Sub & Cloud Storage). */
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

  /* ps-model — topics, subscriptions, fan-out */
  D["ps-model"] = (() => {
    let b = t(320, 20, "Pub/Sub — topics, subscriptions & fan-out", { bold: true });
    b += box(20, 60, 120, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(80, 80, "publishers", { bold: true, size: 8.4, fill: C.accT }) + t(80, 98, "publish messages", { size: 7, fill: C.dim });
    b += box(170, 60, 130, 56, { r: 9, fill: C.gB, stroke: C.gBS, sw: 2 }) + t(235, 80, "topic", { bold: true, size: 9, fill: C.gBT }) + t(235, 98, "(named channel)", { size: 7, fill: C.dim });
    [["sub A", 44, C.gG, C.gGS], ["sub B", 88, C.gY, C.gYS]].forEach(([s, dy, f, st]) => b += box(330, 44 + (dy - 44), 120, 30, { r: 7, fill: f, stroke: st }) + t(390, 63 + (dy - 44), s + " (queue)", { size: 7.6, fill: C.tx }));
    b += box(480, 60, 144, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(552, 80, "subscribers", { bold: true, size: 8.4, fill: C.goodT }) + t(552, 98, "each sub = own copy", { size: 6.8, fill: C.dim });
    b += arrowR(140, 88, 168, { stroke: C.gBS }) + ln(300, 88, 315, 88, { stroke: C.gBS }) + ln(315, 59, 315, 103, { stroke: C.gBS }) + arrowR(315, 59, 328, { stroke: C.gGS }) + arrowR(315, 103, 328, { stroke: C.gYS });
    b += arrowR(450, 59, 478, { stroke: C.gGS }) + arrowR(450, 103, 478, { stroke: C.gYS });
    b += box(16, 132, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 142, "one topic → many subscriptions; each subscription gets EVERY message (fan-out); global, auto-scaling, at-least-once", { size: 6.9, fill: C.warn }) + t(320, 153, "decouples producers from consumers — the messaging backbone of GCP streaming", { size: 6.8, fill: C.dim });
    return svg(172, b, "Pub/Sub model");
  })();

  /* ps-delivery — push/pull, ack, ordering, dedup */
  D["ps-delivery"] = (() => {
    let b = t(320, 20, "Delivery — pull/push, ack, ordering, dedup", { bold: true });
    const rows = [["pull vs push", "subscriber pulls (control) OR Pub/Sub pushes to an endpoint"], ["ack / nack + deadline", "ack within deadline or it's redelivered (at-least-once)"], ["ordering keys", "in-order delivery per key (opt-in)"], ["exactly-once", "opt-in: dedup + no redelivery of acked messages"], ["dead-letter topic", "after N failed deliveries → DLQ for inspection"], ["retention + replay / seek", "store msgs; seek to a timestamp/snapshot to reprocess"]];
    rows.forEach(([h, d], i) => { const y = 46 + i * 26; b += box(28, y, 16, 16, { r: 4, fill: C.gB, stroke: C.gBS }) + t(54, y + 13, h, { a: "start", size: 8, fill: C.gBT, bold: true }) + t(210, y + 13, d, { a: "start", size: 7.2, fill: C.dim }); });
    b += box(16, 206, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 222, "default is at-least-once (ack to confirm); enable ordering keys / exactly-once / DLQ / replay as needed", { size: 6.9, fill: C.warn });
    return svg(240, b, "Pub/Sub delivery");
  })();

  /* ps-patterns — streaming ingestion patterns */
  D["ps-patterns"] = (() => {
    let b = t(320, 20, "Streaming patterns — Pub/Sub in pipelines", { bold: true });
    b += box(20, 56, 120, 60, { r: 9, fill: C.acc, stroke: C.accS }) + t(80, 76, "events", { bold: true, size: 8.4, fill: C.accT }) + t(80, 94, "apps / IoT /", { size: 7, fill: C.dim }) + t(80, 106, "logs", { size: 7, fill: C.dim });
    b += box(160, 60, 110, 52, { r: 9, fill: C.gB, stroke: C.gBS, sw: 2 }) + t(215, 82, "Pub/Sub", { bold: true, size: 8.6, fill: C.gBT }) + t(215, 98, "topic", { size: 7, fill: C.dim });
    b += box(292, 44, 150, 30, { r: 7, fill: C.gG, stroke: C.gGS }) + t(367, 63, "Dataflow (transform)", { size: 7.4, fill: C.gGT });
    b += box(292, 84, 150, 30, { r: 7, fill: C.gY, stroke: C.gYS }) + t(367, 103, "BQ subscription (direct)", { size: 7.2, fill: C.gYT });
    b += box(470, 60, 154, 52, { r: 9, fill: C.good, stroke: C.goodS }) + t(547, 80, "BigQuery", { bold: true, size: 8.6, fill: C.goodT }) + t(547, 98, "real-time analytics", { size: 7, fill: C.dim });
    b += arrowR(140, 86, 158, { stroke: C.gBS }) + arrowR(270, 70, 290, { stroke: C.gGS }) + arrowR(270, 99, 290, { stroke: C.gYS }) + arrowR(442, 70, 468, { stroke: C.gGS }) + arrowR(442, 99, 468, { stroke: C.gYS });
    b += box(16, 130, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 147, "events → Pub/Sub → (Dataflow for transforms, OR a direct BigQuery subscription for simple ingest) → analytics", { size: 6.9, fill: C.warn });
    b += t(320, 174, "Pub/Sub is the entry point for streaming on GCP: ingest events, then Dataflow (complex) or a direct BQ subscription (simple).", { size: 7, fill: C.dim });
    return svg(188, b, "Pub/Sub patterns");
  })();

  /* gcs-deep — Cloud Storage essentials */
  D["gcs-deep"] = (() => {
    let b = t(320, 20, "Cloud Storage — buckets, classes, security, events", { bold: true });
    b += t(160, 44, "storage classes (by access)", { size: 7.8, bold: true, fill: C.gBT });
    ["Standard (hot)", "Nearline (~monthly)", "Coldline (~quarterly)", "Archive (rare)"].forEach((s, i) => b += box(24, 52 + i * 22, 270, 18, { r: 4, fill: C.gB, stroke: C.gBS, sw: 1.1 }) + t(36, 65 + i * 22, s, { a: "start", size: 7.2, fill: C.gBT }));
    b += t(470, 44, "governance & ops", { size: 7.8, bold: true, fill: C.gGT });
    [["IAM + uniform bucket access", C.gG], ["lifecycle: class transitions + delete", C.gG], ["versioning + retention/lock", C.gG], ["events → Pub/Sub (Cloud Functions)", C.gG]].forEach(([s, f], i) => b += box(326, 52 + i * 22, 298, 18, { r: 4, fill: f, stroke: C.gGS, sw: 1.1 }) + t(338, 65 + i * 22, s, { a: "start", size: 7, fill: C.gGT }));
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 160, "GCS is GCP's object store / lake foundation: pick a class by access frequency; lifecycle, versioning, and events automate ops", { size: 6.8, fill: C.warn }) + t(320, 171, "Autoclass auto-moves objects between classes; one global namespace, strong consistency", { size: 6.8, fill: C.dim });
    return svg(186, b, "Cloud Storage in depth");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
