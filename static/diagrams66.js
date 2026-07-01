/* Datalith — diagram pack 66 (DSA for DE vol. 3: probabilistic & hashing structures at scale). */
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
  const circ=(cx,cy,r,o={})=>`<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${o.fill||'none'};stroke:${o.stroke||C.line};stroke-width:${o.sw||1.6}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dsa-bloom — bloom filter */
  D["dsa-bloom"] = (() => {
    let b = t(320, 20, "Bloom filter — fast 'definitely not / maybe yes'", { bold: true });
    b += t(110, 48, "add(x): set k hash bits", { size: 7.6, fill: C.dsT });
    for (let i = 0; i < 12; i++) { const on = [2, 5, 9].includes(i); b += box(24 + i * 18, 56, 16, 16, { r: 3, fill: on ? C.dsS : C.box, stroke: C.boxS, sw: 1 }); }
    b += t(110, 92, "k hashes → k bits in a bit array", { size: 7, fill: C.dim });
    b += box(280, 50, 160, 64, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(360, 68, "query(y)", { bold: true, size: 8.4, fill: C.dsT }) + t(360, 84, "all k bits set? → MAYBE", { size: 7, fill: C.goodT }) + t(360, 98, "any bit 0? → DEFINITELY NOT", { size: 7, fill: C.badT });
    b += box(460, 54, 164, 60, { r: 9, fill: C.tl, stroke: C.tlS }) + t(542, 72, "no false negatives", { bold: true, size: 7.8, fill: C.tlT }) + t(542, 88, "tunable false positives", { size: 7, fill: C.dim }) + t(542, 102, "tiny memory, O(k)", { size: 7, fill: C.dim });
    b += arrowR(232, 78, 278, { stroke: C.dsS });
    b += box(16, 128, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 145, "membership in O(k) bits: 'have I seen this?' — skip lookups/joins for keys definitely absent (LSM, dedup, cache)", { size: 6.8, fill: C.warn });
    b += t(320, 172, "A Bloom filter answers set membership with NO false negatives and a few false positives, in a tiny bit array.", { size: 6.9, fill: C.dim });
    return svg(186, b, "Bloom filter");
  })();

  /* dsa-hll — hyperloglog */
  D["dsa-hll"] = (() => {
    let b = t(320, 20, "HyperLogLog — approximate COUNT(DISTINCT) in KB", { bold: true });
    b += box(20, 54, 150, 64, { r: 9, fill: C.acc, stroke: C.accS }) + t(95, 72, "billions of ids", { bold: true, size: 8.2, fill: C.accT }) + t(95, 90, "exact distinct =", { size: 7, fill: C.dim }) + t(95, 102, "huge memory", { size: 7, fill: C.badT });
    b += box(200, 50, 196, 72, { r: 10, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(298, 68, "HyperLogLog", { bold: true, size: 8.8, fill: C.dsT }) + t(298, 84, "hash id → count leading zeros", { size: 6.8, fill: C.dim }) + t(298, 96, "max-zeros per register estimates", { size: 6.8, fill: C.dim }) + t(298, 110, "cardinality (probabilistic)", { size: 6.8, fill: C.dim });
    b += box(424, 54, 200, 64, { r: 9, fill: C.good, stroke: C.goodS }) + t(524, 72, "≈ distinct count", { bold: true, size: 8.4, fill: C.goodT }) + t(524, 90, "~1-2% error, a few KB", { size: 7.2, fill: C.dim }) + t(524, 104, "mergeable across shards", { size: 7.2, fill: C.tlT });
    b += arrowR(170, 86, 198, { stroke: C.dsS }) + arrowR(396, 86, 422, { stroke: C.goodS });
    b += box(16, 132, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 149, "estimate distinct count in fixed tiny memory; mergeable → distributed APPROX_COUNT_DISTINCT (BigQuery/Spark/Redshift)", { size: 6.7, fill: C.warn });
    b += t(320, 176, "HyperLogLog approximates cardinality (unique counts) with ~1% error in kilobytes — and HLL sketches merge across partitions.", { size: 6.7, fill: C.dim });
    return svg(190, b, "HyperLogLog");
  })();

  /* dsa-cms — count-min sketch */
  D["dsa-cms"] = (() => {
    let b = t(320, 20, "Count-Min Sketch — approximate frequencies", { bold: true });
    b += t(120, 46, "d rows × w counters", { size: 7.6, fill: C.dsT });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) b += box(24 + c * 26, 54 + r * 18, 24, 16, { r: 2, fill: (r === 0 && c === 3) || (r === 1 && c === 5) || (r === 2 && c === 1) ? C.dsS : C.box, stroke: C.boxS, sw: 0.9 });
    b += t(120, 126, "add(x): d hashes, ++ one counter per row", { size: 6.8, fill: C.dim });
    b += box(264, 56, 168, 64, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(348, 74, "count(x) =", { bold: true, size: 8.2, fill: C.dsT }) + t(348, 90, "MIN of its d counters", { size: 7, fill: C.dim }) + t(348, 104, "(min cancels collisions)", { size: 6.8, fill: C.dim });
    b += box(454, 58, 170, 60, { r: 9, fill: C.good, stroke: C.goodS }) + t(539, 76, "≈ frequency", { bold: true, size: 8.2, fill: C.goodT }) + t(539, 92, "never under-counts", { size: 7, fill: C.dim }) + t(539, 106, "fixed memory; heavy hitters", { size: 6.8, fill: C.dim });
    b += arrowR(224, 86, 262, { stroke: C.dsS }) + arrowR(432, 86, 452, { stroke: C.goodS });
    b += box(16, 132, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 149, "estimate per-key frequency in fixed memory — find heavy hitters / hot keys in a huge stream without storing every key", { size: 6.8, fill: C.warn });
    return svg(168, b, "Count-Min Sketch");
  })();

  /* dsa-consistent-hash — consistent hashing ring */
  D["dsa-consistent-hash"] = (() => {
    let b = t(320, 20, "Consistent hashing — partition with minimal reshuffling", { bold: true });
    const cx = 150, cy = 120, r = 62;
    b += circ(cx, cy, r, { stroke: C.dsS, sw: 2 });
    const nodes = [[-90, "N1"], [20, "N2"], [150, "N3"], [250, "N4"]];
    nodes.forEach(([deg, lbl]) => { const a = deg * Math.PI / 180; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); b += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" style="fill:${C.dsS}"/>` + t(x + (Math.cos(a) > 0 ? 12 : -12), y + 3, lbl, { a: Math.cos(a) > 0 ? "start" : "end", size: 7.4, fill: C.dsT }); });
    const a2 = 200 * Math.PI / 180; b += `<circle cx="${(cx + r * Math.cos(a2)).toFixed(1)}" cy="${(cy + r * Math.sin(a2)).toFixed(1)}" r="4" style="fill:${C.warn}"/>` + t(cx - 4, cy + r + 24, "key → next node clockwise", { size: 6.8, fill: C.dim });
    b += box(258, 56, 366, 128, { r: 9, fill: C.box, stroke: C.boxS });
    ["keys & nodes hash onto one ring", "a key is owned by the next node clockwise", "add/remove a node → only ITS neighbor's", "keys move (≈1/N), not a full reshuffle", "virtual nodes spread load evenly"].forEach((s, i) => b += t(274, 78 + i * 20, "• " + s, { a: "start", size: 7.6, fill: i === 3 ? C.goodT : C.dim }));
    b += box(16, 196, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 213, "hash(key) % N reshuffles EVERYTHING when N changes; consistent hashing moves only ~1/N — sharding, caches, Kafka-style scaling", { size: 6.7, fill: C.warn });
    return svg(232, b, "Consistent hashing");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
