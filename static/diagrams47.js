/* DataForge Academy — diagram pack 47 (Databricks deep-dive vol. 1: Spark in depth). */
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
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dbx-spark-execution — the execution model */
  D["dbx-spark-execution"] = (() => {
    let b = t(320, 20, "Spark execution — Job → Stages → Tasks", { bold: true });
    b += t(320, 42, "transformations are lazy (build a DAG); an action submits a Job", { size: 8, fill: C.dim });
    b += box(16, 58, 120, 40, { r: 8, fill: C.dx, stroke: C.dxS }) + t(76, 82, "Job (action)", { bold: true, size: 8.6, fill: C.dxT });
    b += box(166, 52, 140, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(236, 72, "Stage 1", { bold: true, size: 9, fill: C.accT }) + t(236, 88, "narrow ops", { size: 7, fill: C.dim }) + t(236, 100, "tasks = partitions", { size: 6.8, fill: C.dim });
    b += box(336, 52, 140, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(406, 72, "Stage 2", { bold: true, size: 9, fill: C.accT }) + t(406, 88, "post-shuffle", { size: 7, fill: C.dim });
    b += box(486, 58, 138, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(555, 82, "result", { bold: true, size: 8.6, fill: C.goodT });
    b += arrowR(136, 80, 164) + arrowR(306, 80, 334, { stroke: C.dxS }) + t(321, 122, "shuffle = stage boundary", { size: 6.6, fill: C.dxT });
    b += arrowR(476, 80, 484);
    b += box(16, 128, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 145, "Job → Stages (split at each shuffle) → Tasks (one per partition) → run on Executor slots in parallel", { size: 7.6, fill: C.warn });
    b += box(16, 160, 608, 24, { r: 8, fill: C.card, stroke: C.dxS }) + t(320, 176, "the Driver builds the DAG and schedules tasks; a wide transform (join/groupBy) forces a shuffle = a new stage", { size: 7.4, fill: C.dxT });
    b += t(320, 206, "Nothing runs until an action; the driver splits the plan into stages at shuffle boundaries and tasks across executors.", { size: 7.6, fill: C.dim });
    return svg(220, b, "Spark execution model");
  })();

  /* dbx-spark-joins — join strategies */
  D["dbx-spark-joins"] = (() => {
    let b = t(320, 20, "Join strategies — broadcast vs sort-merge vs shuffle-hash", { bold: true });
    const j = [["Broadcast Hash", ["small side → every", "executor; big side", "NOT shuffled"], "fastest: one side small", C.good, C.goodS, C.goodT],
      ["Sort-Merge", ["both sides shuffled", "by key + sorted,", "then merged"], "default: large ⋈ large", C.dx, C.dxS, C.dxT],
      ["Shuffle-Hash", ["shuffle by key,", "build a hash on", "one side"], "medium tables", C.acc, C.accS, C.accT]];
    j.forEach(([nm, lines, foot, f, s, tc], i) => { const x = 16 + i * 204; b += box(x, 50, 192, 96, { r: 9, fill: f, stroke: s, sw: 1.8 }) + t(x + 96, 70, nm, { bold: true, size: 9.2, fill: tc }); lines.forEach((l, k) => b += t(x + 96, 88 + k * 14, l, { size: 7.2, fill: C.dim })); b += t(x + 96, 136, foot, { size: 7, bold: true, fill: tc }); });
    b += box(16, 160, 608, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 178, "AQE picks the strategy at runtime from real sizes — broadcast the small side to skip the shuffle entirely", { size: 7.6, fill: C.warn });
    b += t(320, 208, "A join's cost is the shuffle; eliminating it (broadcast) or minimizing/sorting it (sort-merge) is the whole game.", { size: 7.6, fill: C.dim });
    return svg(222, b, "Spark join strategies");
  })();

  /* dbx-spark-aqe-photon — optimizers */
  D["dbx-spark-aqe-photon"] = (() => {
    let b = t(320, 20, "Catalyst, AQE & Photon — the optimizers", { bold: true });
    b += box(16, 64, 110, 46, { r: 8, fill: C.acc, stroke: C.accS }) + t(71, 84, "query / DF", { bold: true, size: 8.6, fill: C.accT }) + t(71, 99, "your code", { size: 6.8, fill: C.dim });
    b += box(156, 58, 150, 58, { r: 9, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(231, 78, "Catalyst", { bold: true, size: 9.5, fill: C.dxT }) + t(231, 94, "optimize the plan", { size: 7.2, fill: C.dim }) + t(231, 107, "(rule + cost-based)", { size: 6.8, fill: C.dim });
    b += box(336, 58, 150, 58, { r: 9, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(411, 78, "AQE", { bold: true, size: 9.5, fill: C.dxT }) + t(411, 94, "re-optimize", { size: 7.2, fill: C.dim }) + t(411, 107, "at runtime", { size: 6.8, fill: C.dim });
    b += box(516, 64, 108, 46, { r: 8, fill: C.good, stroke: C.goodS }) + t(570, 84, "Photon", { bold: true, size: 9, fill: C.goodT }) + t(570, 99, "vectorized C++", { size: 6.6, fill: C.dim });
    b += arrowR(126, 87, 154) + arrowR(306, 87, 334) + arrowR(486, 87, 514);
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "AQE at runtime: coalesce shuffle partitions · split skewed partitions · switch join strategy from real stats", { size: 7.4, fill: C.warn });
    b += box(16, 182, 608, 24, { r: 8, fill: C.card, stroke: C.dxS }) + t(320, 198, "Photon is the vectorized C++ engine that accelerates SQL/DataFrame ops — enable it on the cluster / SQL warehouse", { size: 7.3, fill: C.dxT });
    b += t(320, 224, "Catalyst optimizes the plan before running; AQE adapts it using real runtime stats; Photon executes it fast.", { size: 7.6, fill: C.dim });
    return svg(238, b, "Catalyst AQE Photon");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
