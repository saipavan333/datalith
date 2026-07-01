/* Datalith — diagram pack 19 (Data Modeling & Warehousing). */
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

  /* model-keys */
  D["surrogate-key"] = (() => {
    let b = t(320, 20, "Surrogate vs natural keys", { bold: true });
    b += box(28, 48, 290, 138, { r: 10, fill: C.acc, stroke: C.accS }) + t(173, 70, "SURROGATE key", { bold: true, fill: C.accT, size: 12 });
    b += t(173, 92, "customer_key = 1, 2, 3 …", { size: 10, mono: true });
    ["meaningless integer", "stable — never changes", "compact joins · enables SCD2 history"].forEach((s, i) => b += t(173, 112 + i * 20, "• " + s, { a: "middle", size: 9.5, fill: C.dim }));
    b += box(322, 48, 290, 138, { r: 10, fill: C.warnFill, stroke: C.warn }) + t(467, 70, "NATURAL key", { bold: true, fill: C.warn, size: 12 });
    b += t(467, 92, "email / SSN / order_no", { size: 10, mono: true });
    ["a business value", "can change (email!) → breaks joins", "may expose PII · keep as an attribute"].forEach((s, i) => b += t(467, 112 + i * 20, "• " + s, { a: "middle", size: 9.5, fill: C.dim }));
    b += t(320, 206, "use a surrogate PK for dimensions; keep the natural/business key as a column for lookups", { fill: C.dim, size: 10 });
    return svg(220, b, "Surrogate vs natural keys");
  })();

  /* model-advanced-dims */
  D["advanced-dims"] = (() => {
    let b = t(320, 20, "Advanced dimension techniques", { bold: true });
    const cells = [
      ["Role-playing", "one date dim used as order_date, ship_date, …", C.acc, C.accS, C.accT, 24, 44],
      ["Junk", "bundle low-cardinality flags into one small dim", C.acc, C.accS, C.accT, 324, 44],
      ["Degenerate", "a key in the fact with no dim (order_number)", C.good, C.goodS, C.goodT, 24, 116],
      ["Conformed", "one shared dim joined across many facts", C.good, C.goodS, C.goodT, 324, 116],
      ["Bridge", "resolve many-to-many (account ↔ customer)", C.warnFill, C.warn, C.warn, 24, 188],
      ["Mini / outrigger", "split fast-changing or shared sub-attributes", C.warnFill, C.warn, C.warn, 324, 188]];
    cells.forEach(c => {
      b += box(c[5], c[6], 292, 60, { r: 9, fill: c[2], stroke: c[3] });
      b += t(c[5] + 14, c[6] + 25, c[0], { a: "start", bold: true, fill: c[4], size: 12 });
      b += t(c[5] + 14, c[6] + 45, c[1], { a: "start", size: 9, fill: C.dim });
    });
    b += t(320, 268, "these techniques keep the star clean while handling real-world complexity", { fill: C.dim, size: 9.5 });
    return svg(282, b, "Advanced dimensions");
  })();

  /* model-aggregates */
  D["aggregate-table"] = (() => {
    let b = t(320, 20, "Aggregate / summary tables", { bold: true });
    b += box(34, 54, 200, 70, { r: 10 }) + t(134, 78, "fact_sales (detail)", { bold: true, size: 11 }) + t(134, 98, "2 billion rows", { size: 10, fill: C.dim }) + t(134, 114, "one row per line item", { size: 8.5, fill: C.dim });
    b += box(406, 54, 200, 70, { r: 10, fill: C.good, stroke: C.goodS }) + t(506, 78, "agg_sales_daily", { bold: true, fill: C.goodT, size: 11 }) + t(506, 98, "~50k rows", { size: 10, fill: C.dim }) + t(506, 114, "pre-summed per day × store", { size: 8.5, fill: C.dim });
    b += arrowR(234, 89, 404) + t(320, 80, "GROUP BY day, store", { size: 9.5, mono: true, fill: C.accT }) + t(320, 100, "(built once, refreshed nightly)", { size: 8.5, fill: C.dim });
    b += box(34, 150, 572, 40, { r: 9, fill: C.acc, stroke: C.accS }) + t(320, 167, "dashboard query hits the small agg table → milliseconds, not a full 2B-row scan", { size: 10, fill: C.accT }) + t(320, 183, "trade storage + refresh cost for huge read speedups on common rollups", { size: 8.5, fill: C.dim });
    b += t(320, 212, "keep the detailed fact for drill-down; serve common aggregations from summaries", { fill: C.dim, size: 9.5 });
    return svg(226, b, "Aggregate tables");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
