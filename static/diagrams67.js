/* Datalith — diagram pack 67 (DSA for DE vol. 4: storage-engine & tree structures). */
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

  /* dsa-btree-lsm — B-tree vs LSM */
  D["dsa-btree-lsm"] = (() => {
    let b = t(320, 20, "B-tree vs LSM-tree — the two storage engines", { bold: true });
    b += box(20, 46, 290, 110, { r: 9, fill: C.acc, stroke: C.accS }) + t(165, 64, "B-tree (read-optimized)", { bold: true, size: 8.8, fill: C.accT });
    ["balanced tree, O(log n) lookups", "update in place (random writes)", "great reads; OLTP/relational indexes", "Postgres/MyS/most RDBMS, SQL indexes"].forEach((s, i) => b += t(36, 82 + i * 16, "• " + s, { a: "start", size: 7.4, fill: C.dim }));
    b += box(330, 46, 294, 110, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(477, 64, "LSM-tree (write-optimized)", { bold: true, size: 8.8, fill: C.dsT });
    ["buffer writes in memory (memtable)", "flush sorted runs (SSTables); compact", "fast writes; reads merge runs (+Bloom)", "Cassandra/RocksDB/HBase; Delta-ish lakes"].forEach((s, i) => b += t(346, 82 + i * 16, "• " + s, { a: "start", size: 7.4, fill: C.dim }));
    b += box(16, 170, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 180, "B-tree = update-in-place, read-optimized (random writes); LSM = append + compact, write-optimized (sequential writes)", { size: 6.8, fill: C.warn }) + t(320, 191, "the fundamental index trade-off: read vs write amplification — pick by workload", { size: 6.8, fill: C.dim });
    return svg(206, b, "B-tree vs LSM-tree");
  })();

  /* dsa-trie — trie / prefix tree */
  D["dsa-trie"] = (() => {
    let b = t(320, 20, "Trie — prefix tree for strings", { bold: true });
    // root
    b += `<circle cx="320" cy="52" r="9" style="fill:${C.ds};stroke:${C.dsS}"/>` + t(320, 40, "root", { size: 7, fill: C.dim });
    const nodes = [["c", 200, 92], ["a", 320, 92], ["t", 200, 132], ["r", 280, 132], ["t", 360, 132], ["t2", 200, 172]];
    // draw edges root->c, root->a; c->a(t? ) keep simple: build "cat","car","at"
    const N = { root: [320, 52], c: [220, 92], a: [400, 92], ca: [180, 132], ar: [400, 132], cat: [140, 172], car: [220, 172], at: [400, 172] };
    const edges = [["root", "c", "c"], ["root", "a", "a"], ["c", "ca", "a"], ["a", "ar", "t"], ["ca", "cat", "t"], ["ca", "car", "r"], ["ar", "at", "✓ 'at'"]];
    edges.forEach(([p, q, lbl]) => { const [x1, y1] = N[p], [x2, y2] = N[q]; b += ln(x1, y1 + 9, x2, y2 - 9, { stroke: C.boxS, sw: 1.3 }); });
    Object.entries(N).forEach(([k, [x, y]]) => { if (k === "root") return; const word = k.length >= 2; b += `<circle cx="${x}" cy="${y}" r="9" style="fill:${word ? C.tl : C.box};stroke:${word ? C.tlS : C.boxS}"/>` + t(x, y + 3, k.slice(-1), { size: 7.2, mono: true, fill: word ? C.tlT : C.dim }); });
    b += t(140, 188, "'cat'", { size: 6.8, fill: C.tlT }) + t(220, 188, "'car'", { size: 6.8, fill: C.tlT }) + t(400, 188, "'at'", { size: 6.8, fill: C.tlT });
    b += box(470, 70, 154, 96, { r: 9, fill: C.ds, stroke: C.dsS }) + t(547, 88, "shared prefixes", { bold: true, size: 8, fill: C.dsT }) + t(547, 104, "O(L) lookup by", { size: 7, fill: C.dim }) + t(547, 116, "key length, not n", { size: 7, fill: C.dim }) + t(547, 134, "autocomplete,", { size: 7, fill: C.dim }) + t(547, 146, "routing, dictionary", { size: 7, fill: C.dim });
    b += box(16, 204, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 220, "a trie stores strings by shared prefix → O(key length) lookup & prefix search — autocomplete, IP routing, prefix matching", { size: 6.8, fill: C.warn });
    return svg(238, b, "Trie prefix tree");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
