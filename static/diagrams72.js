/* Datalith - diagram pack 72 (Data Visualization module). Clean geometry, ASCII labels. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", warnT:"#ffd27a", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d",
    purp:"#2b2350", purpS:"#a78bfa", purpT:"#c9b6ff", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12}px;font-weight:${o.bold?700:400};${F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const circ=(cx,cy,r,o={})=>`<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${o.fill||C.accS};stroke:${o.stroke||"none"};stroke-width:${o.sw||0};${o.op?`opacity:${o.op}`:""}"/>`;
  const poly=(pts,o={})=>`<polyline points="${pts}" style="fill:none;stroke:${o.stroke||C.accS};stroke-width:${o.sw||2.4}"/>`;
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* ---- dv-choose : question -> chart mapping ---- */
  D["dv-choose"] = (() => {
    let b = t(320, 24, "Pick the chart from the question you're answering", { bold: true, size: 12.5 });
    const rows = [
      ["Compare categories", "Bar chart", C.accT],
      ["Trend over time", "Line chart", C.goodT],
      ["Distribution / spread", "Histogram / box", C.warnT],
      ["Relationship (x vs y)", "Scatter plot", C.accT],
      ["Share of a whole", "Stacked bar / treemap", C.goodT],
    ];
    rows.forEach((r, i) => {
      const y = 50 + i * 38;
      b += box(34, y, 258, 30, { r: 7 }) + t(44, y + 19, r[0], { a: "start", size: 10.5, fill: C.tx });
      b += arrowR(294, y + 15, 352, { stroke: C.accS });
      b += box(356, y, 258, 30, { r: 7, fill: C.acc, stroke: C.accS }) + t(366, y + 19, r[1], { a: "start", size: 10.5, fill: r[2] });
    });
    return svg(248, b, "Choosing a chart from the question");
  })();

  /* ---- dv-comparison : bar chart ---- */
  D["dv-comparison"] = (() => {
    let b = t(320, 24, "Comparison: bar chart (sorted, zero baseline)", { bold: true, size: 12.5 });
    b += ln(60, 44, 60, 186, { stroke: C.dim }) + ln(60, 186, 600, 186, { stroke: C.dim });
    const vals = [120, 96, 74, 52, 30], labs = ["A", "B", "C", "D", "E"];
    vals.forEach((v, i) => {
      const x = 92 + i * 96, y = 186 - v;
      b += box(x, y, 64, v, { r: 3, fill: C.acc, stroke: C.accS });
      b += t(x + 32, 202, labs[i], { size: 10.5, fill: C.dim });
      b += t(x + 32, y - 6, String(v), { size: 9.5, fill: C.accT });
    });
    b += t(320, 224, "Sorted high to low; axis starts at 0 so bar heights are honest.", { size: 9.5, fill: C.dim });
    return svg(236, b, "Bar chart for comparison");
  })();

  /* ---- dv-trend : line chart ---- */
  D["dv-trend"] = (() => {
    let b = t(320, 24, "Trend over time: line chart", { bold: true, size: 12.5 });
    b += ln(60, 44, 60, 186, { stroke: C.dim }) + ln(60, 186, 600, 186, { stroke: C.dim });
    const ys = [162, 150, 156, 132, 138, 112, 96, 104, 78];
    let pts = "";
    ys.forEach((y, i) => { const x = 80 + i * 62; pts += `${x},${y} `; });
    b += poly(pts.trim(), { stroke: C.goodS, sw: 2.6 });
    ys.forEach((y, i) => { const x = 80 + i * 62; b += circ(x, y, 3.4, { fill: C.goodT }); });
    b += t(600, 202, "time ->", { a: "end", size: 9.5, fill: C.dim });
    b += t(320, 224, "Continuous change over ordered time; the line shows direction & rate.", { size: 9.5, fill: C.dim });
    return svg(236, b, "Line chart for trend over time");
  })();

  /* ---- dv-distribution : histogram + box plot ---- */
  D["dv-distribution"] = (() => {
    let b = t(320, 24, "Distribution: histogram + box plot", { bold: true, size: 12.5 });
    b += ln(52, 42, 52, 150, { stroke: C.dim }) + ln(52, 150, 600, 150, { stroke: C.dim });
    const hs = [14, 30, 54, 84, 100, 82, 54, 30, 15];
    hs.forEach((h, i) => { const x = 66 + i * 58, y = 150 - h; b += box(x, y, 48, h, { r: 2, fill: C.acc, stroke: C.accS }); });
    b += t(596, 164, "value ->", { a: "end", size: 9, fill: C.dim });
    // box plot
    b += ln(120, 192, 250, 192, { stroke: C.goodS }) + ln(430, 192, 545, 192, { stroke: C.goodS });
    b += box(250, 178, 180, 28, { r: 4, fill: C.good, stroke: C.goodS });
    b += ln(340, 178, 340, 206, { stroke: C.goodT, sw: 2.2 });
    b += circ(575, 192, 4, { fill: C.badS });
    b += t(120, 172, "min", { a: "start", size: 8.5, fill: C.dim }) + t(340, 172, "median", { size: 8.5, fill: C.goodT }) + t(575, 178, "outlier", { size: 8.5, fill: C.badT });
    b += t(320, 228, "Histogram = shape of one variable; box = median, spread (IQR), outliers.", { size: 9.5, fill: C.dim });
    return svg(240, b, "Histogram and box plot for distribution");
  })();

  /* ---- dv-relationship : scatter + trend ---- */
  D["dv-relationship"] = (() => {
    let b = t(320, 24, "Relationship: scatter plot (correlation)", { bold: true, size: 12.5 });
    b += ln(60, 44, 60, 186, { stroke: C.dim }) + ln(60, 186, 600, 186, { stroke: C.dim });
    const P = [[95,168],[130,150],[150,164],[185,140],[210,148],[245,128],[270,134],[305,118],[335,126],[370,104],[405,110],[440,92],[475,100],[510,80],[545,88]];
    b += ln(84, 172, 560, 66, { stroke: C.accT, dash: true, sw: 1.8 });
    P.forEach(p => { b += circ(p[0], p[1], 4.2, { fill: C.accS, op: 0.85 }); });
    b += t(600, 202, "x ->", { a: "end", size: 9.5, fill: C.dim });
    b += t(320, 224, "Two numeric variables; an upward cloud = positive correlation (not cause).", { size: 9.5, fill: C.dim });
    return svg(236, b, "Scatter plot for relationship");
  })();

  /* ---- dv-partwhole : 100% stacked bar + treemap ---- */
  D["dv-partwhole"] = (() => {
    let b = t(320, 24, "Part-to-whole: 100% stacked bar & treemap", { bold: true, size: 12.5 });
    // stacked bar
    const segs = [[45, C.acc, C.accS, C.accT], [30, C.good, C.goodS, C.goodT], [15, C.warnFill, C.warn, C.warnT], [10, C.purp, C.purpS, C.purpT]];
    let x = 60; const total = 520;
    b += t(60, 64, "Stacked bar (share of total)", { a: "start", size: 10, fill: C.dim });
    segs.forEach(s => { const w = total * s[0] / 100; b += box(x, 74, w, 34, { r: 2, fill: s[1], stroke: s[2] }) + t(x + w / 2, 96, s[0] + "%", { size: 10, fill: s[3] }); x += w; });
    // treemap
    b += t(60, 140, "Treemap (nested parts, area = value)", { a: "start", size: 10, fill: C.dim });
    b += box(60, 150, 300, 76, { r: 3, fill: C.acc, stroke: C.accS }) + t(210, 192, "A 45%", { fill: C.accT, size: 11 });
    b += box(364, 150, 150, 76, { r: 3, fill: C.good, stroke: C.goodS }) + t(439, 192, "B 30%", { fill: C.goodT, size: 10.5 });
    b += box(518, 150, 96, 36, { r: 3, fill: C.warnFill, stroke: C.warn }) + t(566, 172, "C 15%", { fill: C.warnT, size: 9.5 });
    b += box(518, 190, 96, 36, { r: 3, fill: C.purp, stroke: C.purpS }) + t(566, 212, "D 10%", { fill: C.purpT, size: 9.5 });
    return svg(240, b, "Stacked bar and treemap for part-to-whole");
  })();

  /* ---- dv-principles : zero baseline good vs bad ---- */
  D["dv-principles"] = (() => {
    let b = t(320, 24, "Principle: bars must start at zero", { bold: true, size: 12.5 });
    // left: misleading (truncated axis) - values 102,104,106 look huge
    b += box(34, 44, 268, 176, { r: 8, fill: "#241318", stroke: C.badS });
    b += t(168, 64, "Cut axis - misleading", { size: 10.5, fill: C.badT, bold: true });
    b += ln(60, 80, 60, 196, { stroke: C.dim }) + ln(60, 196, 288, 196, { stroke: C.dim });
    [[102, 20], [104, 56], [106, 104]].forEach((d, i) => { const x = 84 + i * 66, h = d[1]; b += box(x, 196 - h, 44, h, { r: 2, fill: C.bad, stroke: C.badS }); b += t(x + 22, 190 - h, String(d[0]), { size: 9, fill: C.badT }); });
    b += t(168, 212, "axis starts at 100", { size: 8.5, fill: C.badT });
    // right: honest (zero baseline) - same values look near-equal
    b += box(338, 44, 268, 176, { r: 8, fill: "#12251c", stroke: C.goodS });
    b += t(472, 64, "Zero baseline - honest", { size: 10.5, fill: C.goodT, bold: true });
    b += ln(364, 80, 364, 196, { stroke: C.dim }) + ln(364, 196, 592, 196, { stroke: C.dim });
    [[102, 100], [104, 102], [106, 104]].forEach((d, i) => { const x = 388 + i * 66, h = d[1]; b += box(x, 196 - h, 44, h, { r: 2, fill: C.good, stroke: C.goodS }); b += t(x + 22, 190 - h, String(d[0]), { size: 9, fill: C.goodT }); });
    b += t(472, 212, "axis starts at 0", { size: 8.5, fill: C.goodT });
    return svg(232, b, "Zero baseline versus truncated axis");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
