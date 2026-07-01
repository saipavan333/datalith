/* DataForge Academy — diagram pack 64 (DSA for DE vol. 1: complexity & core structures). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    ds:"#241a3d", dsS:"#a78bfa", dsT:"#c4b5fd", tl:"#10333a", tlS:"#2dd4bf", tlT:"#5eead4" };
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

  /* dsa-bigo — complexity ladder for data */
  D["dsa-bigo"] = (() => {
    let b = t(320, 20, "Big-O for data — cost as data grows", { bold: true });
    const rows = [["O(1)", "hash lookup, array index", C.goodT], ["O(log n)", "binary search, B-tree index", C.goodT], ["O(n)", "full scan / filter / map", C.accT], ["O(n log n)", "sort, sort-merge join", C.warn], ["O(n + m)", "hash join (build + probe)", C.tlT], ["O(n × m)", "nested-loop join (avoid!)", C.badT]];
    rows.forEach(([o, ex, col], i) => { const y = 46 + i * 28; b += box(24, y, 120, 22, { r: 6, fill: C.ds, stroke: C.dsS }) + t(84, y + 15, o, { bold: true, size: 9, mono: true, fill: C.dsT }); b += t(160, y + 15, ex, { a: "start", size: 8, fill: col }); });
    b += box(16, 220, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 230, "at scale, the exponent dominates: an O(n²) join on a billion rows is fatal — pick algorithms (and joins) by complexity", { size: 6.9, fill: C.warn }) + t(320, 241, "also mind memory (spill) and the network (shuffle) — the real bottlenecks in distributed data", { size: 6.8, fill: C.dim });
    return svg(254, b, "Big-O for data engineering");
  })();

  /* dsa-hashing — hash map/set */
  D["dsa-hashing"] = (() => {
    let b = t(320, 20, "Hash maps & sets — O(1) lookup, the DE workhorse", { bold: true });
    b += box(20, 56, 110, 60, { r: 9, fill: C.acc, stroke: C.accS }) + t(75, 78, "key", { bold: true, size: 9, fill: C.accT }) + t(75, 96, "user_id=42", { size: 7.4, mono: true, fill: C.dim });
    b += box(168, 60, 110, 52, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(223, 80, "hash(key)", { bold: true, size: 8.6, mono: true, fill: C.dsT }) + t(223, 98, "→ bucket #", { size: 7.4, fill: C.dim });
    b += box(316, 50, 130, 72, { r: 9, fill: C.good, stroke: C.goodS }) + t(381, 68, "buckets", { bold: true, size: 8.6, fill: C.goodT }); [0, 1, 2].forEach(i => b += box(332, 78 + i * 13, 98, 10, { r: 2, fill: i === 1 ? C.dsS : C.box, sw: 0.8 }));
    b += arrowR(130, 86, 166, { stroke: C.dsS }) + arrowR(278, 86, 314, { stroke: C.dsS });
    b += box(470, 54, 154, 68, { r: 9, fill: C.tl, stroke: C.tlS }) + t(547, 72, "DE uses", { bold: true, size: 8.4, fill: C.tlT }) + t(547, 89, "dedup · group by", { size: 7.2, fill: C.dim }) + t(547, 101, "frequency count", { size: 7.2, fill: C.dim }) + t(547, 113, "hash-join build side", { size: 7.2, fill: C.dim });
    b += box(16, 138, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 155, "a hash table gives ~O(1) insert/lookup — the basis of GROUP BY, DISTINCT/dedup, and hash joins (build a map, probe it)", { size: 6.9, fill: C.warn });
    b += t(320, 182, "Hashing turns 'have I seen this key?' and 'group by key' into O(1) operations — the most-used structure in data work.", { size: 7, fill: C.dim });
    return svg(196, b, "Hash maps and sets");
  })();

  /* dsa-two-pointer-window — sliding window */
  D["dsa-two-pointer-window"] = (() => {
    let b = t(320, 20, "Two pointers & sliding window", { bold: true });
    b += t(320, 44, "stream / sorted array of events over time →", { size: 7.6, fill: C.dim });
    const n = 10; const x0 = 40, w = 52;
    for (let i = 0; i < n; i++) { const x = x0 + i * w; const inWin = i >= 3 && i <= 6; b += box(x, 56, w - 6, 26, { r: 4, fill: inWin ? C.tl : C.box, stroke: inWin ? C.tlS : C.boxS, sw: 1.2 }) + t(x + (w - 6) / 2, 73, "e" + i, { size: 7.4, mono: true, fill: inWin ? C.tlT : C.dim }); }
    b += t(x0 + 3 * w + 23, 98, "L", { bold: true, size: 9, mono: true, fill: C.dsT }) + t(x0 + 6 * w + 23, 98, "R", { bold: true, size: 9, mono: true, fill: C.dsT });
    b += ln(x0 + 3 * w, 88, x0 + 7 * w - 6, 88, { stroke: C.dsS, sw: 2 }) + t(x0 + 5 * w, 112, "window [L..R] slides; add R, drop L → O(n) one pass", { size: 7.4, fill: C.dsT });
    b += box(16, 128, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 145, "one linear pass with two moving pointers replaces nested loops — rolling windows, sessionization, top-N-per-window", { size: 6.9, fill: C.warn });
    b += t(320, 172, "Sliding window: maintain a range with two pointers, updating an aggregate incrementally — O(n) instead of O(n·k).", { size: 7, fill: C.dim });
    return svg(186, b, "Two pointers and sliding window");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
