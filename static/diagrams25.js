/* DataForge Academy — diagram pack 25 (Interview question bank: the loop + system-design method). */
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
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* interview-bank loop */
  D["de-interview-loop"] = (() => {
    let b = t(320, 20, "Data Engineer interview loop (50LPA+) — 2026", { bold: true });
    b += box(16, 44, 132, 46, { r: 9, fill: C.box, stroke: C.boxS }) + t(82, 64, "Recruiter screen", { bold: true, size: 10 }) + t(82, 80, "fit · background", { size: 8, fill: C.dim });
    b += arrowR(148, 67, 172);
    b += box(174, 44, 198, 46, { r: 9, fill: C.acc, stroke: C.accS }) + t(273, 64, "Technical screen", { bold: true, size: 10, fill: C.accT }) + t(273, 80, "SQL + coding (CoderPad)", { size: 8, fill: C.dim });
    b += arrowR(372, 67, 396);
    b += box(398, 44, 226, 46, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(511, 64, "Onsite loop (virtual)", { bold: true, size: 10, fill: C.warn }) + t(511, 80, "4-5 rounds · 45-60 min each", { size: 8, fill: C.dim });
    b += arrowD(511, 90, 116);
    // onsite rounds container
    b += box(16, 120, 608, 70, { r: 10, fill: C.box, stroke: C.boxS });
    b += t(320, 137, "ONSITE ROUNDS", { bold: true, size: 9.5, fill: C.dim });
    const rounds = [["SQL", "joins · windows"], ["Coding / DSA", "Python"], ["Data modeling", "schema · SCD"], ["System design", "pipeline / warehouse"], ["Behavioral", "STAR · LPs · values"]];
    rounds.forEach((r, i) => {
      const x = 26 + i * 120;
      b += box(x, 146, 110, 36, { r: 7, fill: C.acc, stroke: C.accS });
      b += t(x + 55, 162, r[0], { bold: true, size: 9.5, fill: C.accT });
      b += t(x + 55, 175, r[1], { size: 7.4, fill: C.dim });
    });
    b += arrowD(320, 190, 214);
    b += box(228, 218, 184, 36, { r: 9, fill: C.good, stroke: C.goodS }) + t(320, 240, "Offer / team match", { bold: true, size: 10, fill: C.goodT });
    // legend
    [["Easy", C.goodS, 470], ["Medium", C.warn, 528], ["Hard", C.badS, 590]].forEach(g => b += `<circle cx="${g[2]-22}" cy="232" r="5" style="fill:${g[1]}"/>` + t(g[2], 236, g[0], { size: 8.5, fill: C.dim, a: "middle" }));
    return svg(266, b, "DE interview loop");
  })();

  /* system-design method */
  D["system-design-method"] = (() => {
    let b = t(320, 20, "System / pipeline design — the 6-step method", { bold: true });
    const steps = [
      ["1 · Clarify", "requirements, scale, SLAs, batch vs stream"],
      ["2 · Estimate", "volume/sec, storage, QPS, latency target"],
      ["3 · High-level", "ingest → store → process → serve (draw it)"],
      ["4 · Deep-dive", "schema, partitioning, formats, key components"],
      ["5 · Trade-offs", "bottlenecks, failure, cost, alternatives"],
      ["6 · Wrap", "recap, monitoring/observability, what you'd improve"]
    ];
    steps.forEach((s, i) => {
      const y = 44 + i * 33;
      b += box(40, y, 560, 27, { r: 7, fill: i % 2 ? C.box : C.acc, stroke: i % 2 ? C.boxS : C.accS });
      b += t(120, y + 17, s[0], { bold: true, size: 10, a: "middle", fill: i % 2 ? C.tx : C.accT });
      b += t(360, y + 17, s[1], { size: 9, a: "middle", fill: C.dim });
      if (i < 5) b += arrowD(320, y + 27, y + 33);
    });
    b += t(320, 252, "drive the conversation · state assumptions · always name the trade-off", { size: 9, fill: C.dim });
    return svg(264, b, "System design method");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
