/* DataForge Academy — diagram pack 65 (DSA for DE vol. 2: sorting, heaps & selection). */
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
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dsa-sorting — external merge sort */
  D["dsa-sorting"] = (() => {
    let b = t(320, 20, "External merge sort — sorting data bigger than RAM", { bold: true });
    b += box(20, 54, 130, 56, { r: 9, fill: C.bad, stroke: C.badS }) + t(85, 74, "huge file", { bold: true, size: 8.6, fill: C.badT }) + t(85, 92, "> memory", { size: 7.4, fill: C.dim });
    b += box(180, 48, 150, 72, { r: 9, fill: C.acc, stroke: C.accS }) + t(255, 66, "phase 1: make runs", { bold: true, size: 8, fill: C.accT }) + t(255, 84, "read a chunk that fits,", { size: 7, fill: C.dim }) + t(255, 96, "sort in memory,", { size: 7, fill: C.dim }) + t(255, 110, "write sorted run to disk", { size: 7, fill: C.dim });
    b += box(360, 48, 150, 72, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(435, 66, "phase 2: merge runs", { bold: true, size: 8, fill: C.dsT }) + t(435, 84, "k-way merge sorted", { size: 7, fill: C.dim }) + t(435, 96, "runs with a min-heap", { size: 7, fill: C.dim }) + t(435, 110, "→ one sorted output", { size: 7, fill: C.dim });
    b += box(540, 54, 84, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(582, 76, "sorted", { bold: true, size: 8.4, fill: C.goodT }) + t(582, 94, "output", { size: 7.4, fill: C.dim });
    b += arrowR(150, 82, 178) + arrowR(330, 82, 358, { stroke: C.dsS }) + arrowR(510, 82, 538, { stroke: C.goodS });
    b += box(16, 134, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 151, "sort in two phases: make sorted runs that fit in RAM, then merge them — O(n log n) with bounded memory (the Spark shuffle-sort)", { size: 6.8, fill: C.warn });
    b += t(320, 178, "When data exceeds memory, sort by making in-memory sorted runs and merging them — the basis of distributed sort & sort-merge join.", { size: 6.9, fill: C.dim });
    return svg(192, b, "External merge sort");
  })();

  /* dsa-merge-k — merge k sorted with heap */
  D["dsa-merge-k"] = (() => {
    let b = t(320, 20, "Merge k sorted streams with a min-heap", { bold: true });
    ["run A: 1,4,9", "run B: 2,5,8", "run C: 3,6,7"].forEach((s, i) => b += box(24, 50 + i * 32, 150, 24, { r: 6, fill: C.acc, stroke: C.accS }) + t(99, 66 + i * 32, s, { size: 7.6, mono: true, fill: C.accT }));
    b += box(220, 56, 150, 70, { r: 10, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(295, 76, "min-heap (size k)", { bold: true, size: 8.2, fill: C.dsT }) + t(295, 94, "holds head of each run", { size: 7, fill: C.dim }) + t(295, 108, "pop min → push next", { size: 7, fill: C.dim }) + t(295, 120, "from that run", { size: 7, fill: C.dim });
    b += box(416, 62, 200, 58, { r: 9, fill: C.good, stroke: C.goodS }) + t(516, 80, "1,2,3,4,5,6,7,8,9", { bold: true, size: 8.6, mono: true, fill: C.goodT }) + t(516, 98, "single merged sorted output", { size: 7, fill: C.dim }) + t(516, 110, "O(n log k)", { size: 7.4, mono: true, fill: C.dsT });
    b += arrowR(174, 84, 218, { stroke: C.dsS }) + arrowR(370, 90, 414, { stroke: C.goodS });
    b += box(16, 138, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 155, "a min-heap always yields the next-smallest across k runs in O(log k) — merge phase of external sort & k streams", { size: 6.9, fill: C.warn });
    b += t(320, 182, "Merging k sorted inputs: keep each run's head in a min-heap; repeatedly pop the smallest and pull the next from its run.", { size: 6.9, fill: C.dim });
    return svg(196, b, "Merge k sorted streams");
  })();

  /* dsa-heap-topk — top-K with heap */
  D["dsa-heap-topk"] = (() => {
    let b = t(320, 20, "Top-K with a heap — biggest K without sorting all", { bold: true });
    b += box(20, 56, 130, 60, { r: 9, fill: C.acc, stroke: C.accS }) + t(85, 76, "stream of n", { bold: true, size: 8.4, fill: C.accT }) + t(85, 94, "values / rows", { size: 7.2, fill: C.dim }) + t(85, 108, "(n huge)", { size: 7, fill: C.dim });
    b += box(190, 50, 180, 78, { r: 10, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(280, 68, "min-heap of size K", { bold: true, size: 8.4, fill: C.dsT }) + t(280, 86, "for each value: if > heap.min,", { size: 6.8, fill: C.dim }) + t(280, 98, "pop min & push it", { size: 6.8, fill: C.dim }) + t(280, 114, "heap always holds the top K", { size: 6.9, fill: C.dsT });
    b += box(410, 56, 214, 60, { r: 9, fill: C.good, stroke: C.goodS }) + t(517, 74, "top K results", { bold: true, size: 8.6, fill: C.goodT }) + t(517, 92, "O(n log K) time, O(K) memory", { size: 7.2, mono: true, fill: C.dim }) + t(517, 106, "no full O(n log n) sort", { size: 7.2, fill: C.dim });
    b += arrowR(150, 86, 188, { stroke: C.dsS }) + arrowR(370, 86, 408, { stroke: C.goodS });
    b += box(16, 140, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 157, "to get the top K of n, keep a size-K min-heap — O(n log K), O(K) memory — far cheaper than sorting everything", { size: 6.9, fill: C.warn });
    b += t(320, 184, "Top-N queries, biggest spenders, streaming heavy hitters: a size-K heap finds the top K in one pass without sorting all n.", { size: 6.8, fill: C.dim });
    return svg(198, b, "Top-K with a heap");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
