/* Datalith — diagram pack 69 (DSA for DE vol. 6: SQL patterns & interview strategy). */
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

  /* dsa-sql-patterns — DSA → SQL */
  D["dsa-sql-patterns"] = (() => {
    let b = t(320, 20, "Algorithmic patterns in SQL — the same ideas", { bold: true });
    const rows = [["dedup / DISTINCT (hashing)", "ROW_NUMBER() OVER(PARTITION BY key) = 1"], ["top-N per group (heap-like)", "QUALIFY ROW_NUMBER()/RANK() OVER(...) <= N"], ["rolling window (sliding window)", "SUM(x) OVER(ORDER BY t ROWS BETWEEN ...)"], ["running total (prefix sum)", "SUM(x) OVER(ORDER BY t)"], ["sessionize / gaps-and-islands (2-ptr)", "LAG()/LEAD() gap flag + running SUM = session id"], ["dependency order (topo sort)", "recursive CTE over the edge list"]];
    rows.forEach(([h, s], i) => { const y = 44 + i * 28; b += box(22, y, 250, 22, { r: 5, fill: C.ds, stroke: C.dsS, sw: 1.1 }) + t(34, y + 15, h, { a: "start", size: 7.4, fill: C.dsT }); b += t(286, y + 15, s, { a: "start", size: 7, mono: true, fill: C.goodT }); });
    b += box(16, 214, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 230, "window functions ARE the algorithms — ROW_NUMBER (dedup/top-N), frames (sliding window), LAG/LEAD (sessionize)", { size: 6.9, fill: C.warn });
    return svg(248, b, "Algorithmic SQL patterns");
  })();

  /* dsa-interview-patterns — pattern recognition map */
  D["dsa-interview-patterns"] = (() => {
    let b = t(320, 20, "DE coding interview — recognize the pattern", { bold: true });
    const rows = [["'seen it?' / 'group/count by key'", "hash map / set", C.gGS || C.goodS], ["'range / rolling / consecutive'", "two pointers / sliding window", C.tlS], ["'top / largest / smallest K'", "heap (priority queue)", C.dsS], ["'sorted / merge / order'", "sort / k-way merge", C.accS], ["'dependencies / schedule / lineage'", "graph / DAG (topo, BFS/DFS)", C.warn], ["'huge scale, approximate OK'", "Bloom / HyperLogLog / Count-Min", C.badS]];
    rows.forEach(([cue, tool, col], i) => { const y = 44 + i * 25; b += t(30, y + 13, cue, { a: "start", size: 7.6, fill: C.dim }); b += arrowR(300, y + 9, 326, { stroke: col }); b += t(336, y + 13, tool, { a: "start", size: 7.8, bold: true, fill: col }); });
    b += box(16, 196, 608, 40, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 211, "strategy: clarify → examples/edge cases → brute force → optimize (right structure) → state complexity → test", { size: 6.9, fill: C.warn }) + t(320, 225, "DE coding leans on hashing, windows, heaps, sort, and SQL — recognize the cue, pick the structure", { size: 6.8, fill: C.dim });
    return svg(246, b, "DE interview patterns");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
