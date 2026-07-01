/* DataForge Academy — diagram pack 52 (Databricks deep-dive vol. 6: DataOps & platform). */
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
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dbx-compute — clusters & Photon */
  D["dbx-compute"] = (() => {
    let b = t(320, 20, "Compute: driver + workers, Photon, autoscaling", { bold: true });
    b += box(28, 52, 120, 86, { r: 9, fill: C.vio, stroke: C.vioS, sw: 2 }) + t(88, 72, "driver", { bold: true, size: 9, fill: C.vioT }) + t(88, 90, "plans the job,", { size: 7.2, fill: C.dim }) + t(88, 102, "schedules tasks,", { size: 7.2, fill: C.dim }) + t(88, 118, "collects results", { size: 7.2, fill: C.dim });
    [0, 1, 2].forEach(i => { const x = 196 + i * 104; b += box(x, 52, 92, 60, { r: 8, fill: C.acc, stroke: C.accS }) + t(x + 46, 72, "worker " + (i + 1), { bold: true, size: 8, fill: C.accT }) + t(x + 46, 90, "executors", { size: 7, fill: C.dim }) + t(x + 46, 103, "run tasks", { size: 7, fill: C.dim }); });
    b += arrowR(148, 82, 194);
    b += box(196, 120, 300, 22, { r: 6, fill: C.dx, stroke: C.dxS }) + t(346, 135, "Photon — vectorized C++ engine (faster, fewer DBUs)", { size: 7.4, fill: C.dxT });
    b += box(512, 52, 112, 90, { r: 9, fill: C.box, stroke: C.boxS }) + t(568, 70, "autoscaling", { bold: true, size: 8.2, fill: C.tx }) + t(568, 86, "add/remove", { size: 7, fill: C.dim }) + t(568, 98, "workers to load", { size: 7, fill: C.dim }) + t(568, 116, "auto-terminate", { size: 7, fill: C.goodT }) + t(568, 128, "when idle", { size: 7, fill: C.dim });
    b += box(16, 156, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 173, "job clusters (per-run, cheap) vs all-purpose (interactive, shared); serverless = instant, fully managed compute", { size: 7.3, fill: C.warn });
    b += t(320, 202, "One driver coordinates many workers; Photon speeds SQL/DataFrame work; autoscaling + auto-terminate control cost.", { size: 7.2, fill: C.dim });
    return svg(216, b, "Databricks compute model");
  })();

  /* dbx-jobs — workflows DAG */
  D["dbx-jobs"] = (() => {
    let b = t(320, 20, "Workflows (Jobs) — orchestrate multi-task DAGs", { bold: true });
    b += box(24, 64, 96, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(72, 88, "ingest", { bold: true, size: 8.4, fill: C.accT });
    b += box(168, 40, 96, 40, { r: 8, fill: C.vio, stroke: C.vioS }) + t(216, 64, "transform A", { size: 8, fill: C.vioT });
    b += box(168, 92, 96, 40, { r: 8, fill: C.vio, stroke: C.vioS }) + t(216, 116, "transform B", { size: 8, fill: C.vioT });
    b += box(312, 64, 96, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(360, 88, "publish", { bold: true, size: 8.4, fill: C.goodT });
    b += ln(120, 84, 144, 84) + ln(144, 60, 144, 112) + arrowR(144, 60, 166) + arrowR(144, 112, 166);
    b += ln(264, 60, 288, 60) + ln(264, 112, 288, 112) + ln(288, 60, 288, 112) + arrowR(288, 84, 310);
    b += box(430, 50, 194, 70, { r: 9, fill: C.box, stroke: C.boxS }) + t(527, 68, "per task:", { bold: true, size: 8.2, fill: C.tx }) + t(527, 84, "retries · timeout · alerts", { size: 7.2, fill: C.dim }) + t(527, 98, "schedule (cron) / trigger", { size: 7.2, fill: C.dim }) + t(527, 112, "job cluster, git source", { size: 7.2, fill: C.dim });
    b += box(16, 138, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 155, "tasks form a DAG with dependencies; the platform schedules, retries, alerts, and can run each task on its own job cluster", { size: 7.2, fill: C.warn });
    b += t(320, 184, "Define tasks + dependencies; Workflows runs them in order with retries, scheduling, and notifications built in.", { size: 7.2, fill: C.dim });
    return svg(198, b, "Databricks Workflows");
  })();

  /* dbx-cicd — asset bundles */
  D["dbx-cicd"] = (() => {
    let b = t(320, 20, "CI/CD — Repos, Asset Bundles, dev → prod", { bold: true });
    b += box(20, 58, 130, 64, { r: 9, fill: C.acc, stroke: C.accS }) + t(85, 78, "Git repo", { bold: true, size: 9, fill: C.accT }) + t(85, 96, "notebooks, jobs,", { size: 7, fill: C.dim }) + t(85, 108, "DLT, bundle.yml", { size: 7, mono: true, fill: C.dim });
    b += box(176, 58, 140, 64, { r: 9, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(246, 78, "Asset Bundle", { bold: true, size: 9, fill: C.dxT }) + t(246, 96, "code + jobs +", { size: 7, fill: C.dim }) + t(246, 108, "config as one unit", { size: 7, fill: C.dim });
    b += box(342, 58, 120, 64, { r: 9, fill: C.vio, stroke: C.vioS }) + t(402, 78, "CI pipeline", { bold: true, size: 8.6, fill: C.vioT }) + t(402, 96, "test + validate", { size: 7, fill: C.dim }) + t(402, 108, "bundle deploy", { size: 7, mono: true, fill: C.dim });
    ["dev", "staging", "prod"].forEach((s, i) => { b += box(488, 50 + i * 26, 120, 22, { r: 6, fill: C.good, stroke: C.goodS }) + t(548, 65 + i * 26, s + " workspace", { size: 7.6, fill: C.goodT }); });
    b += arrowR(150, 90, 174) + arrowR(316, 90, 340) + arrowR(462, 90, 486);
    b += box(16, 138, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 155, "Asset Bundles package code + jobs + config; one definition deploys identically to dev/staging/prod via CI/CD", { size: 7.3, fill: C.warn });
    b += t(320, 184, "Version everything in Git, bundle it, and promote the same definition across environments — reproducible, reviewed releases.", { size: 7.1, fill: C.dim });
    return svg(198, b, "Databricks CI/CD asset bundles");
  })();

  /* dbx-cost — cost levers */
  D["dbx-cost"] = (() => {
    let b = t(320, 20, "Cost control — DBUs × levers", { bold: true });
    b += box(244, 44, 152, 30, { r: 8, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(320, 63, "cost = DBUs × rate × time", { bold: true, size: 8.2, fill: C.dxT });
    const lev = [["job clusters", "ephemeral, cheaper than all-purpose"], ["autoscale + auto-terminate", "no idle clusters burning money"], ["spot / fleet instances", "big discount for workers"], ["Photon", "more throughput per DBU"], ["right-size + serverless", "match compute to the workload"]];
    lev.forEach(([h, d], i) => { const y = 88 + i * 26; b += box(40, y, 16, 16, { r: 4, fill: C.good, stroke: C.goodS }) + t(64, y + 13, h + " —", { a: "start", size: 8.4, fill: C.goodT, bold: true }) + t(64 + h.length * 5.2 + 14, y + 13, d, { a: "start", size: 7.8, fill: C.dim }); });
    b += box(16, 228, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 244, "biggest wins: kill idle clusters (auto-terminate), use job clusters + spot, enable Photon; attribute spend via tags", { size: 7.1, fill: C.warn });
    return svg(262, b, "Databricks cost optimization");
  })();

  /* dbx-perf — tuning */
  D["dbx-perf"] = (() => {
    let b = t(320, 20, "Performance tuning — diagnose then fix", { bold: true });
    b += box(24, 52, 250, 104, { r: 9, fill: C.bad, stroke: C.badS }) + t(149, 70, "symptoms (Spark UI)", { bold: true, size: 8.8, fill: C.badT });
    ["one slow straggler task → skew", "spill to disk → memory too small", "huge shuffle read/write", "many tiny tasks/files"].forEach((s, i) => b += t(40, 90 + i * 16, "• " + s, { a: "start", size: 7.6, fill: C.dim }));
    b += box(366, 52, 250, 104, { r: 9, fill: C.good, stroke: C.goodS }) + t(491, 70, "fixes", { bold: true, size: 8.8, fill: C.goodT });
    ["AQE: skew join + coalesce parts", "broadcast the small side of a join", "salt keys / repartition on skew", "OPTIMIZE files; cache reuse; Photon"].forEach((s, i) => b += t(382, 90 + i * 16, "• " + s, { a: "start", size: 7.6, fill: C.dim }));
    b += arrowR(276, 104, 364, { stroke: C.dxS, sw: 2 });
    b += box(16, 170, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 187, "read the Spark UI first (stages, tasks, shuffle, spill); fix the actual bottleneck — skew, spill, shuffle, or small files", { size: 7.2, fill: C.warn });
    b += t(320, 216, "Most Spark slowness is skew, spill, shuffle, or small files; diagnose in the UI, then apply the matching fix.", { size: 7.2, fill: C.dim });
    return svg(230, b, "Spark performance tuning");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
