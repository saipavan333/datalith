/* DataForge Academy — diagram pack 68 (DSA for DE vol. 5: graphs & DAGs for pipelines). */
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
  const triA=(x1,y1,x2,y2,o={})=>{const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,px=-uy,py=ux;return `<polygon points="${x2},${y2} ${(x2-8*ux+4*px).toFixed(1)},${(y2-8*uy+4*py).toFixed(1)} ${(x2-8*ux-4*px).toFixed(1)},${(y2-8*uy-4*py).toFixed(1)}" style="fill:${o.stroke||C.line}"/>`;};
  const edge=(x1,y1,x2,y2,o={})=>ln(x1,y1,x2,y2,o)+triA(x1,y1,x2,y2,o);
  const node=(x,y,lbl,o={})=>`<circle cx="${x}" cy="${y}" r="${o.r||16}" style="fill:${o.fill||C.ds};stroke:${o.stroke||C.dsS};stroke-width:2"/>`+t(x,y+4,lbl,{size:o.size||9,bold:true,fill:o.tc||C.dsT});
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dsa-topo-sort — topological order of a DAG */
  D["dsa-topo-sort"] = (() => {
    let b = t(320, 20, "Topological sort — run a pipeline DAG in order", { bold: true });
    const P = { A: [60, 90], B: [160, 60], C: [160, 120], D: [260, 90] };
    b += edge(76, 84, 146, 66, { stroke: C.boxS }) + edge(76, 96, 146, 114, { stroke: C.boxS }) + edge(176, 66, 246, 84, { stroke: C.boxS }) + edge(176, 114, 246, 96, { stroke: C.boxS });
    Object.entries(P).forEach(([k, [x, y]]) => b += node(x, y, k, { fill: C.acc, stroke: C.accS, tc: C.accT }));
    b += t(160, 143, "DAG: A→B, A→C, B→D, C→D", { size: 7.2, mono: true, fill: C.dim });
    b += box(330, 52, 294, 80, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(477, 70, "valid run order (topo sort)", { bold: true, size: 8.4, fill: C.dsT }) + t(477, 88, "A → B → C → D  (or A,C,B,D)", { size: 8, mono: true, fill: C.goodT }) + t(477, 104, "Kahn: repeatedly emit a node with", { size: 7, fill: C.dim }) + t(477, 116, "in-degree 0, remove its edges", { size: 7, fill: C.dim });
    b += box(16, 148, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 158, "a topological order lists every task after its dependencies — how Airflow/Dataform/Spark run a DAG; a CYCLE = no valid order (error)", { size: 6.7, fill: C.warn }) + t(320, 169, "cycle detection: if you can't emit all nodes (some in-degree never hits 0), there's a circular dependency", { size: 6.7, fill: C.dim });
    return svg(184, b, "Topological sort");
  })();

  /* dsa-graph-traversal — BFS/DFS + lineage */
  D["dsa-graph-traversal"] = (() => {
    let b = t(320, 20, "Graph traversal — BFS / DFS for lineage & reachability", { bold: true });
    b += box(20, 48, 290, 100, { r: 9, fill: C.acc, stroke: C.accS }) + t(165, 66, "BFS (queue, level by level)", { bold: true, size: 8.4, fill: C.accT });
    ["explore neighbors before going deeper", "shortest path in UNWEIGHTED graphs", "'all tables within 2 hops downstream'"].forEach((s, i) => b += t(36, 84 + i * 16, "• " + s, { a: "start", size: 7.2, fill: C.dim }));
    b += t(165, 138, "Dijkstra for weighted shortest paths", { size: 6.8, fill: C.dsT });
    b += box(330, 48, 294, 100, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(477, 66, "DFS (stack/recursion, go deep)", { bold: true, size: 8.4, fill: C.dsT });
    ["follow a path to the end, backtrack", "cycle detection, topological sort", "full upstream/downstream lineage"].forEach((s, i) => b += t(346, 84 + i * 16, "• " + s, { a: "start", size: 7.2, fill: C.dim }));
    b += t(477, 138, "track visited set → don't revisit (O(V+E))", { size: 6.8, fill: C.tlT });
    b += box(16, 162, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 172, "data lineage, dependency graphs, reachability, impact analysis are graph problems — traverse with BFS/DFS in O(V+E)", { size: 6.8, fill: C.warn }) + t(320, 183, "'what feeds this table?' = upstream traversal; 'what breaks if I change it?' = downstream traversal", { size: 6.7, fill: C.dim });
    return svg(198, b, "Graph traversal");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
