/* Datalith — diagram pack 20 (NoSQL, Spark, Pipelines extras). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* nosql-timeseries */
  D["timeseries-db"] = (() => {
    let b = t(320, 20, "Time-series databases — built for timestamped data", { bold: true });
    b += box(28, 56, 150, 70, { r: 10, fill: C.acc, stroke: C.accS }) + t(103, 78, "sensors / metrics", { bold: true, fill: C.accT, size: 11 });
    b += t(103, 98, "(t, value) points", { size: 9.5, mono: true, fill: C.dim }) + t(103, 114, "very high write rate", { size: 8.5, fill: C.dim });
    b += box(246, 56, 150, 70, { r: 10, fill: C.good, stroke: C.goodS }) + t(321, 82, "TSDB", { bold: true, fill: C.goodT, size: 13 }) + t(321, 102, "time-partitioned", { size: 9, fill: C.dim }) + t(321, 116, "append-optimized", { size: 9, fill: C.dim });
    b += box(462, 56, 150, 70, { r: 10 }) + t(537, 78, "queries", { bold: true, size: 11 }) + t(537, 98, "time-range scans", { size: 9, fill: C.dim }) + t(537, 114, "rollups / aggregates", { size: 9, fill: C.dim });
    b += arrowR(178, 91, 244);
    b += arrowR(396, 91, 460);
    b += box(28, 142, 584, 34, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 163, "downsampling (1s → 1m → 1h) + retention/TTL keep storage bounded as data ages", { size: 9.5, fill: C.warn });
    b += t(320, 198, "examples: InfluxDB · TimescaleDB · Prometheus · for IoT, metrics & monitoring", { fill: C.dim, size: 9.5 });
    return svg(212, b, "Time-series databases");
  })();

  /* bd-flink-trino */
  D["flink-trino"] = (() => {
    let b = t(320, 20, "Beyond Spark — Flink & Trino", { bold: true });
    b += box(24, 48, 288, 138, { r: 10, fill: C.acc, stroke: C.accS }) + t(168, 70, "Apache Flink", { bold: true, fill: C.accT, size: 13 });
    b += t(168, 90, "true streaming — one event at a time", { size: 9.5, fill: C.tx });
    ["low latency · stateful · exactly-once", "event-time windows + watermarks", "(Spark streaming = micro-batch)"].forEach((s, i) => b += t(168, 112 + i * 20, "• " + s, { size: 9, fill: C.dim }));
    b += box(328, 48, 288, 138, { r: 10, fill: C.good, stroke: C.goodS }) + t(472, 70, "Trino / Presto", { bold: true, fill: C.goodT, size: 13 });
    b += t(472, 90, "distributed SQL query engine", { size: 9.5, fill: C.tx });
    ["no storage — query data in place", "federates lake + RDBMS + warehouse", "interactive / ad-hoc analytics"].forEach((s, i) => b += t(472, 112 + i * 20, "• " + s, { size: 9, fill: C.dim }));
    b += t(320, 206, "Spark = general-purpose batch + micro-batch · Flink = streaming-first · Trino = fast federated SQL", { fill: C.dim, size: 9.5 });
    return svg(220, b, "Flink and Trino");
  })();

  /* pipe-monitoring-alerting */
  D["pipeline-monitoring"] = (() => {
    let b = t(320, 20, "Data observability — monitor the data, not just the run", { bold: true });
    const pills = [["Freshness", "on time?", C.acc, C.accS, C.accT], ["Volume", "row counts", C.acc, C.accS, C.accT], ["Schema", "cols & types", C.good, C.goodS, C.goodT], ["Quality", "nulls · ranges", C.good, C.goodS, C.goodT], ["Lineage", "up→downstream", C.warnFill, C.warn, C.warn]];
    pills.forEach((p, i) => { const x = 16 + i * 124; b += box(x, 46, 112, 66, { r: 9, fill: p[2], stroke: p[3] }) + t(x + 56, 70, p[0], { bold: true, fill: p[4], size: 11 }) + t(x + 56, 92, p[1], { size: 8.5, fill: C.dim }); });
    b += box(40, 128, 560, 42, { r: 9 }) + t(320, 148, "anomaly vs normal → alert (Slack / PagerDuty) → fix before consumers notice", { size: 10, fill: C.tx }) + t(320, 164, "a job can SUCCEED while emitting bad data — that's why you observe the DATA", { size: 8.5, fill: C.dim });
    b += t(320, 194, "the five pillars catch most pipeline failures proactively", { fill: C.dim, size: 9.5 });
    return svg(208, b, "Data observability");
  })();

  /* pipe-testing */
  D["pipeline-testing"] = (() => {
    let b = t(320, 20, "Testing data pipelines", { bold: true });
    b += box(28, 48, 280, 120, { r: 10, fill: C.acc, stroke: C.accS }) + t(168, 70, "Unit tests (the CODE)", { bold: true, fill: C.accT, size: 12 });
    ["pure transform functions", "known input → expected output", "fixtures + parametrize (pytest)", "edge cases: null, empty, dupes"].forEach((s, i) => b += t(168, 92 + i * 17, "• " + s, { size: 9, fill: C.dim }));
    b += box(332, 48, 280, 120, { r: 10, fill: C.good, stroke: C.goodS }) + t(472, 70, "Data tests (the OUTPUT)", { bold: true, fill: C.goodT, size: 12 });
    ["schema · not-null · unique", "accepted ranges / values", "referential integrity", "freshness · row counts"].forEach((s, i) => b += t(472, 92 + i * 17, "• " + s, { size: 9, fill: C.dim }));
    b += box(28, 180, 584, 34, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 201, "run in CI (before deploy) + at runtime (every load) → on failure: quarantine + alert, don't publish", { size: 9.5, fill: C.warn });
    b += t(320, 236, "keep transforms PURE so they're unit-testable; gate bad data at the boundary", { fill: C.dim, size: 9.5 });
    return svg(250, b, "Testing data pipelines");
  })();

  /* cloud-cost-finops */
  D["finops"] = (() => {
    let b = t(320, 20, "Cloud cost & FinOps — the levers", { bold: true });
    const levers = [["Compute", "right-size · spot", "autoscale · serverless", C.acc, C.accS, C.accT, 20], ["Storage", "tiers (hot→cold)", "lifecycle · delete unused", C.good, C.goodS, C.goodT, 225], ["Egress / transfer", "minimize cross-region", "& internet movement", C.warnFill, C.warn, C.warn, 430]];
    levers.forEach(l => { b += box(l[6], 46, 190, 68, { r: 10, fill: l[3], stroke: l[4] }) + t(l[6] + 95, 70, l[0], { bold: true, fill: l[5], size: 12 }) + t(l[6] + 95, 90, l[1], { size: 8.5, fill: C.dim }) + t(l[6] + 95, 104, l[2], { size: 8.5, fill: C.dim }); });
    b += box(40, 138, 160, 34, { r: 8 }) + t(120, 159, "Visibility (tag/monitor)", { size: 9.5 });
    b += box(240, 138, 160, 34, { r: 8 }) + t(320, 159, "Optimize", { size: 9.5 });
    b += box(440, 138, 160, 34, { r: 8 }) + t(520, 159, "Govern (budgets)", { size: 9.5 });
    b += arrowR(200, 155, 238) + arrowR(400, 155, 438);
    b += t(320, 196, "pay only for what you use; the biggest wins are right-sizing compute and cutting egress", { fill: C.dim, size: 9.5 });
    return svg(210, b, "Cloud cost FinOps");
  })();

  /* cloud-networking */
  D["cloud-networking"] = (() => {
    let b = t(320, 20, "Cloud networking & data movement", { bold: true });
    b += box(24, 48, 250, 130, { r: 10, fill: C.acc, stroke: C.accS }) + t(149, 70, "VPC (private network)", { bold: true, fill: C.accT, size: 12 });
    b += box(44, 86, 210, 32, { r: 7 }) + t(149, 106, "compute (private subnet)", { size: 9.5 });
    b += box(44, 128, 210, 32, { r: 7 }) + t(149, 148, "storage via VPC endpoint", { size: 9.5 });
    b += box(360, 60, 256, 46, { r: 9, fill: C.good, stroke: C.goodS }) + t(488, 82, "Private: VPC endpoint / PrivateLink", { size: 10, fill: C.goodT }) + t(488, 98, "stays in-network — secure, no egress", { size: 8.5, fill: C.dim });
    b += box(360, 120, 256, 46, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(488, 142, "Public: internet gateway", { size: 10, fill: C.warn }) + t(488, 158, "egress charges (cross-region/internet)", { size: 8.5, fill: C.dim });
    b += arrowR(274, 83, 358) + arrowR(274, 143, 358);
    b += t(320, 198, "keep traffic private (endpoints); egress is the hidden cost; regions + AZs give latency & HA", { fill: C.dim, size: 9.5 });
    return svg(212, b, "Cloud networking");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
