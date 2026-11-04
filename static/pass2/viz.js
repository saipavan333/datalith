/* Datalith pass 2 — Track 28: Data visualization (part 1 of 2). Diagrams compare chart choices on the same data. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const rect = (x, y, w, h, fill, o = {}) => `<rect x="${x.toFixed ? x.toFixed(1) : x}" y="${y.toFixed ? y.toFixed(1) : y}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="${o.r ?? 2}" style="fill:${fill}${o.op ? ";opacity:" + o.op : ""}${o.stroke ? ";stroke:" + o.stroke : ""}"/>`;
  const poly = (pts, col, sw = 2.2) => `<polyline points="${pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")}" style="fill:none;stroke:${col};stroke-width:${sw}"/>`;
  const dot = (x, y, r, col, op) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" style="fill:${col}${op ? ";opacity:" + op : ""}"/>`;
  /* seeded random numbers so every render is identical */
  const rng = seed => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const gauss = r => { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  P2L.viz = { rect, poly, dot, rng, gauss };
  const REV = [["APAC", 42], ["EMEA", 35], ["NA", 31], ["LATAM", 12], ["ANZ", 9]];
  const PAL = [C.accS, C.goodS, C.warnS, C.vioS, C.badS];

  /* mini charts for viz-choose, drawn into a w x h box at (x,y) */
  const mini = {
    bar: (x, y, w, h) => REV.map(([, v], i) => rect(x + 6, y + 6 + i * (h - 12) / 5, (w - 14) * v / 42, (h - 12) / 5 - 3, C.accS)).join(""),
    line: (x, y, w, h) => poly([3, 4, 3.6, 5, 5.8, 5.4, 6.8, 7.5].map((v, i) => [x + 6 + i * (w - 12) / 7, y + h - 6 - (v - 3) / 4.5 * (h - 12)]), C.goodS),
    hist: (x, y, w, h) => [2, 5, 9, 6, 3, 4, 8, 5, 2].map((v, i) => rect(x + 6 + i * (w - 12) / 9, y + h - 6 - v / 9 * (h - 12), (w - 12) / 9 - 1, v / 9 * (h - 12), C.warnS, { r: 0 })).join(""),
    scatter: (x, y, w, h) => { const r = rng(7); let s = ""; for (let i = 0; i < 26; i++) { const a = r(); s += dot(x + 8 + a * (w - 16), y + h - 8 - (a * 0.8 + r() * 0.25) * (h - 18), 2.6, C.vioS); } return s; },
    stack: (x, y, w, h) => { let s = "", cx = x + 6; [0.45, 0.3, 0.15, 0.1].forEach((f, i) => { s += rect(cx, y + h / 2 - 10, f * (w - 12), 20, PAL[i], { r: 0 }); cx += f * (w - 12); }); return s; },
  };
  const QS = [["compare categories", "bar", "Revenue by region: lengths from a common zero are the easiest thing for eyes to compare."], ["change over time", "line", "Monthly signups: the slope of the line is the rate of change."], ["spread / shape", "hist", "Query latency: the histogram shows two humps that an average would hide."], ["two variables related?", "scatter", "Table size vs query time: the cloud's shape shows the relationship."], ["share of a whole", "stack", "Storage by team: a 100% bar shows each part's share of one total."]];

  /* ---------------------------------------------------------------- viz-choose */
  P["viz-choose"] = {
    simple: [
      "A chart answers a question. So name the question first, then pick the chart that answers it at a glance.",
      "Five questions cover most charts in data work. Comparing categories: a **bar** chart. Change over time: a **line** chart. The spread of values: a **histogram** or **box plot**. Whether two numbers move together: a **scatter** plot. Shares of a whole: a **stacked bar** or **treemap**.",
      "Before drawing, write the one sentence you want the reader to take away, such as \"APAC grew fastest\". If the chart doesn't make that sentence obvious, change the chart.",
    ],
    analogy: {
      text: "Think of choosing a tool from a toolbox.",
      left: "Toolbox", right: "Chart choice",
      map: [
        ["Measuring tape to compare lengths", "Bar chart for comparisons"],
        ["A growth chart on the kitchen door", "Line chart for change over time"],
        ["Sorting socks into piles by size", "Histogram for distribution"],
        ["Height vs shoe size for the class", "Scatter for relationships"],
        ["Cutting a cake into shares", "Part-to-whole charts"],
      ],
      breaks: "a toolbox job has one right tool. A dataset can answer several questions, so you may need two charts, one per question, rather than one chart that tries to do both.",
    },
    svg: () => {
      let b = t(240, 18, "Name the question, then the chart follows", { bold: true, size: 13.5 });
      QS.forEach(([q, k], i) => {
        const y = 30 + i * 46;
        b += box(12, y, 190, 38, q, null, "plain", { size: 12 });
        b += arrow(204, y + 19, 236, y + 19, { sw: 1.3 });
        b += rect(240, y, 96, 38, "#1f2634", { r: 6, stroke: C.boxS });
        b += mini[k](240, y, 96, 38);
        b += t(348, y + 24, ["bar", "line", "histogram", "scatter", "100% stacked bar"][i], { a: "start", size: 12, bold: true, fill: C.accT });
      });
      return svg(480, 264, b, "Mapping from analytical question to chart type");
    },
    caption: "Five questions, five chart families. The question comes first.",
    _fig: i => {
      const [q, k] = QS[i];
      let b = t(240, 18, "Question: " + q, { bold: true, size: 13.5 });
      Object.keys(mini).forEach((m, j) => { const x = 12 + j * 93; b += rect(x, 34, 86, 64, m === k ? C.good : "#1f2634", { r: 8, stroke: m === k ? C.goodS : C.boxS }); b += mini[m](x, 34, 86, 64); b += t(x + 43, 116, ["bar", "line", "histogram", "scatter", "stacked"][j], { size: 11, bold: m === k, fill: m === k ? C.goodT : C.dim }); });
      return svg(480, 130, b, "Chart chosen for a question");
    },
    ix: el => choice(el, { label: "Question", options: QS.map(q => q[0]), value: 0 }, i => ({ svg: P["viz-choose"]._fig(i), note: QS[i][2] })),
    oneline: "Decide what question the chart answers first, and the right chart type follows.",
  };

  /* ---------------------------------------------------------------- viz-comparison */
  const CMPO = [["sorted, from zero", true, 0], ["unsorted", false, 0], ["axis starts at 30", true, 30]];
  P["viz-comparison"] = {
    simple: [
      "When you compare values across categories, use a **bar chart**. Eyes judge lengths from a shared starting line far better than angles or areas.",
      "Two rules keep bars honest. **Start the axis at zero**, because the bar's length is the value; cutting the axis makes small differences look huge. **Sort the bars** by value unless the categories have a natural order (like months), so the ranking reads instantly.",
      "Use horizontal bars when labels are long or categories are many. Grouped bars compare two or three series per category; stacked bars show totals but make inner segments hard to compare.",
    ],
    analogy: {
      text: "Think of children standing against a height chart on a wall.",
      left: "Height chart", right: "Bar chart",
      map: [
        ["Everyone stands on the same floor", "A shared zero baseline"],
        ["Lining up from tallest to shortest", "Sorting by value"],
        ["Measuring only from the shoulders up", "A truncated axis"],
        ["Name tags at eye level", "Direct labels on the bars"],
      ],
      breaks: "children are measured from the floor naturally. Charting tools often start the axis wherever the data starts, so you have to set the zero yourself.",
    },
    svg: () => P["viz-comparison"]._fig(0),
    _fig: i => {
      const [n, sorted, base] = CMPO[i];
      const R = sorted ? REV.slice() : [REV[3], REV[0], REV[4], REV[2], REV[1]];
      let b = t(240, 18, i === 2 ? "Same data, axis from 30: NA looks a fraction of EMEA" : "Revenue by region ($M)" + (sorted ? ", sorted" : ", unsorted"), { bold: true, size: 13 });
      const X = v => 90 + (v - base) / (45 - base) * 340;
      R.forEach(([r, v], j) => { const y = 34 + j * 34; b += t(80, y + 17, r, { a: "end", size: 12 }); const w = X(Math.max(v, base)) - 90; b += rect(90, y + 4, w, 20, v < base ? C.boxS : C.accS, { r: 3 }); b += t(96 + w, y + 18, v < base ? v + " (off the axis)" : String(v), { a: "start", size: 11.5, bold: true }); });
      b += line(90, 30, 90, 206, { stroke: i === 2 ? C.badS : C.line, sw: 2 });
      b += t(90, 222, String(base), { size: 11, fill: i === 2 ? C.badT : C.dim });
      return svg(480, 234, b, "Bar chart comparison variant");
    },
    caption: "Sorted bars from a zero baseline: the ranking and the gaps read in one glance.",
    ix: el => choice(el, { label: "Version", options: CMPO.map(c => c[0]), value: 2 }, i => ({ svg: P["viz-comparison"]._fig(i), note: ["Sorted and from zero: the order and the real size of each gap are obvious.", "Same numbers, random order: the reader now has to hunt for the ranking.", "Truncated axis: 31 vs 35 looks like a 1-to-5 gap, and the two small regions vanish. Never do this with bars."][i] })),
    oneline: "For comparisons use bars that start at zero and are sorted, so lengths tell the truth.",
  };

  /* ---------------------------------------------------------------- viz-trend */
  const SIGN = [120, 135, 128, 150, 172, 165, 190, 230, 214, 260, 300, 340];
  P["viz-trend"] = {
    simple: [
      "When the question is \"how does this change over time?\", use a **line chart**. Joining the points in order shows direction, speed of change and turning points.",
      "The slope of the line is the rate of change, so several lines let you compare whose growth is fastest. An **area** chart fills under the line to stress volume; a **stacked area** shows how the mix changes, though middle bands are hard to read.",
      "Keep the time axis in order and evenly spaced by real time. A line chart's y-axis doesn't have to start at zero, because the shape is the message, but say so if you zoom in.",
    ],
    analogy: {
      text: "Think of the pencil marks on a door frame as a child grows.",
      left: "Door-frame marks", right: "Line chart",
      map: [
        ["A mark each birthday", "One point per period"],
        ["Joining the marks shows the growth spurt", "The slope shows the rate"],
        ["Two siblings' marks side by side", "Two series compared"],
        ["Missing a birthday leaves a gap", "Missing data must show as a gap, not a straight join"],
      ],
      breaks: "birthdays are a year apart. If your dates are uneven (some days missing), a category axis would squash time; use a real date axis so gaps stay proportional.",
    },
    svg: () => {
      let b = t(240, 18, "Monthly signups (thousands): line vs bars", { bold: true, size: 13 });
      const X = (i, x0) => x0 + 10 + i * 16.5, Y = v => 190 - (v - 0) / 360 * 150;
      b += t(120, 40, "line: slope is visible", { size: 11.5, bold: true, fill: C.goodT });
      b += t(360, 40, "bars: 12 separate heights", { size: 11.5, bold: true, fill: C.warnT });
      b += line(16, 190, 224, 190); b += line(256, 190, 464, 190);
      b += poly(SIGN.map((v, i) => [X(i, 16), Y(v)]), C.goodS, 2.6);
      SIGN.forEach((v, i) => { b += dot(X(i, 16), Y(v), 2.6, C.goodS); b += rect(X(i, 256) - 6, Y(v), 12, 190 - Y(v), C.warnS, { r: 1 }); });
      b += t(186, 74, "growth speeds up", { size: 10.5, fill: C.goodT });
      b += t(240, 212, "Jan to Dec. Bars work for a few periods; for a continuous trend the line wins.", { size: 10.5, fill: C.dim, max: 456 });
      return svg(480, 224, b, "Same time series as a line chart and a bar chart");
    },
    caption: "Both show the same 12 numbers; only the line makes the acceleration in the second half obvious.",
    oneline: "Use a line for change over time, so the slope shows how fast things are moving.",
  };

  /* ---------------------------------------------------------------- viz-distribution */
  const LAT = (() => { const r = rng(11), a = []; for (let i = 0; i < 220; i++) a.push(Math.max(1, 18 + gauss(r) * 5)); for (let i = 0; i < 180; i++) a.push(Math.max(1, 52 + gauss(r) * 7)); return a; })();
  P["viz-distribution"] = {
    simple: [
      "An average hides a lot. Two datasets with the same average can look completely different. A **distribution** chart shows the whole shape: where values cluster, how spread out they are, and the outliers.",
      "A **histogram** groups values into bins and draws a bar per bin. The **bin width** matters: too few bins hide the shape, too many make noise. A **box plot** summarises with the median, the middle 50% (the box), whiskers and outliers; it is compact for comparing groups but can't show two humps.",
      "A **violin** plot is a smoothed histogram mirrored on both sides, which shows the shape and compares groups.",
    ],
    analogy: {
      text: "Think of sorting a class's test scores into trays labelled 0-10, 11-20 and so on.",
      left: "Score trays", right: "Histogram",
      map: [
        ["Each tray covers a range of scores", "A bin"],
        ["How full each tray is", "The bar height (count)"],
        ["Only two trays: pass and fail", "Too few bins hide the shape"],
        ["A tray for every single mark", "Too many bins: noisy"],
        ["Writing only the class average", "A single number hides the humps"],
      ],
      breaks: "test scores have natural tray sizes. Most data doesn't, so try a few bin counts and pick the one that shows the real shape without noise.",
    },
    svg: () => {
      const s = LAT.slice().sort((a, z) => a - z), q = p => s[Math.floor(p * (s.length - 1))], mean = s.reduce((a, z) => a + z, 0) / s.length;
      let b = t(240, 18, "400 query latencies (ms): box plot vs histogram", { bold: true, size: 13 });
      const X = v => 30 + v / 80 * 420;
      b += t(30, 44, "box plot", { a: "start", size: 11.5, bold: true, fill: C.accT });
      b += line(X(q(0.02)), 70, X(q(0.98)), 70); b += rect(X(q(0.25)), 56, X(q(0.75)) - X(q(0.25)), 28, C.acc, { stroke: C.accS, r: 3 }); b += line(X(q(0.5)), 56, X(q(0.5)), 84, { stroke: C.accT, sw: 2.4 });
      b += t(X(q(0.5)), 98, "median " + q(0.5).toFixed(0), { size: 10.5, fill: C.accT });
      const bins = Array(20).fill(0); LAT.forEach(v => { bins[Math.min(19, Math.floor(v / 4))]++; }); const mx = Math.max(...bins);
      b += t(30, 122, "histogram, 20 bins", { a: "start", size: 11.5, bold: true, fill: C.warnT });
      bins.forEach((c, i) => { b += rect(X(i * 4) + 1, 214 - c / mx * 80, X(4) - X(0) - 2, c / mx * 80, C.warnS, { r: 0 }); });
      b += line(30, 214, 450, 214);
      b += line(X(mean), 110, X(mean), 214, { stroke: C.badS, dash: true }); b += t(X(mean) + 4, 136, "mean " + mean.toFixed(0) + ": almost no queries here", { a: "start", size: 10.5, fill: C.badT });
      [0, 20, 40, 60, 80].forEach(v => { b += t(X(v), 228, String(v), { size: 10, fill: C.dim }); });
      return svg(480, 240, b, "Box plot and histogram of bimodal latency data");
    },
    caption: "Two groups of queries (cache hits and misses). The box plot and the mean hide them; the histogram shows both humps.",
    _fig: n => {
      const w = 80 / n, bins = Array(n).fill(0); LAT.forEach(v => { bins[Math.min(n - 1, Math.floor(v / w))]++; }); const mx = Math.max(...bins);
      let b = t(240, 18, "Same 400 latencies with " + n + " bins (each " + w.toFixed(w < 10 ? 1 : 0) + " ms wide)", { bold: true, size: 13 });
      const X = v => 30 + v / 80 * 420;
      bins.forEach((c, i) => { b += rect(X(i * w) + (n > 40 ? 0 : 1), 180 - c / mx * 140, X(w) - X(0) - (n > 40 ? 0.4 : 2), c / mx * 140, C.warnS, { r: 0 }); });
      b += line(30, 180, 450, 180); [0, 20, 40, 60, 80].forEach(v => { b += t(X(v), 196, String(v), { size: 10, fill: C.dim }); });
      return svg(480, 206, b, "Histogram with a chosen bin count");
    },
    ix: el => slider(el, { label: "Bins", min: 2, max: 60, value: 4 }, v => ({ svg: P["viz-distribution"]._fig(v), note: v <= 4 ? "Too few bins: the two groups merge into one lump." : v >= 40 ? "Too many bins: random noise starts to look like structure." : "Enough bins to see both humps clearly, few enough to stay smooth." })),
    oneline: "Show the whole spread of values, not just the average, and pick histogram bins with care.",
  };

  /* ---------------------------------------------------------------- viz-relationship */
  const SC = (() => { const r = rng(5), a = []; for (let i = 0; i < 160; i++) { const x = r(); a.push([x, Math.min(1, Math.max(0, 0.15 + 0.7 * x + gauss(r) * 0.08))]); } return a; })();
  P["viz-relationship"] = {
    simple: [
      "To see whether two numbers move together, use a **scatter plot**: one dot per row, placed by its two values. The shape of the cloud tells the story.",
      "A cloud rising to the right means a positive relationship; falling means negative; no shape means little or none. A tight cloud is a strong relationship, a curve is a non-linear one, separate blobs are segments, and lone dots are outliers. A trend line summarises the direction.",
      "Add a third variable with dot size (a bubble chart) or colour. When thousands of dots overlap into a blob, switch to a **hexbin** or density plot, which counts how many points fall in each area.",
    ],
    analogy: {
      text: "Think of every pupil in a school standing on a playground grid by height and shoe size.",
      left: "Playground grid", right: "Scatter plot",
      map: [
        ["Each pupil stands at their own spot", "One dot per row"],
        ["Taller pupils tend to stand further right and up", "Positive correlation"],
        ["A teacher standing far away from the crowd", "An outlier"],
        ["So crowded you can't count heads", "Overplotting: use hexbin"],
      ],
      breaks: "height really causes bigger shoes. In data, two things moving together may share a hidden cause, so a scatter plot shows correlation, not causation.",
    },
    svg: () => {
      let b = t(240, 18, "Table size vs query time: scatter vs hexbin", { bold: true, size: 13 });
      const X = (v, x0) => x0 + 8 + v * 196, Y = v => 196 - v * 150;
      b += t(120, 40, "scatter + trend line", { size: 11.5, bold: true, fill: C.vioT });
      b += t(360, 40, "hexbin-style counts", { size: 11.5, bold: true, fill: C.accT });
      SC.forEach(([x, y]) => { b += dot(X(x, 12), Y(y), 2.6, C.vioS, 0.75); });
      b += line(X(0, 12), Y(0.15), X(1, 12), Y(0.85), { stroke: C.warnS, sw: 2.2 });
      const g = {}; SC.forEach(([x, y]) => { const k = Math.min(7, Math.floor(x * 8)) + "," + Math.min(7, Math.floor(y * 8)); g[k] = (g[k] || 0) + 1; }); const mx = Math.max(...Object.values(g));
      Object.entries(g).forEach(([k, c]) => { const [i, j] = k.split(",").map(Number); b += rect(252 + 8 + i * 24.5, Y((j + 1) / 8), 23, 150 / 8 - 1, C.accS, { op: (0.2 + 0.8 * c / mx).toFixed(2), r: 2 }); });
      b += line(16, 196, 224, 196); b += line(256, 196, 464, 196);
      b += t(240, 216, "x: table size, y: query time. Darker cell = more queries there.", { size: 10.5, fill: C.dim, max: 456 });
      return svg(480, 228, b, "Scatter plot with a trend line beside a binned density view");
    },
    caption: "The scatter shows each query and the trend; the binned view still works when there are a million points.",
    oneline: "Use a scatter plot to see if two numbers move together, and density bins when dots pile up.",
  };

  /* ---------------------------------------------------------------- viz-partwhole */
  const TEAM = [["Ads", 34], ["Search", 27], ["Maps", 18], ["Mail", 12], ["Other", 9]];
  P["viz-partwhole"] = {
    simple: [
      "Some questions ask what share each part makes of a whole, such as storage used by each team. Others ask how amounts **flow** between stages, such as users moving from visit to signup to purchase.",
      "For shares, a **100% stacked bar** is the reliable default. A **treemap** (nested rectangles sized by value) handles many parts or a hierarchy. A **pie** only works for two or three slices, because people compare angles badly.",
      "For flows, a **funnel** shows drop-off between steps, a **waterfall** shows how a starting total moves up and down to an end total, and a **Sankey** shows amounts splitting and merging between stages.",
    ],
    analogy: {
      text: "Think of a pizza shared by friends.",
      left: "Pizza", right: "Part-to-whole charts",
      map: [
        ["Slices of one pizza", "Pie: works for a few big shares"],
        ["Two slices that are almost the same size", "Hard to compare angles"],
        ["Lining the slices up in a row", "Stacked bar: shares as lengths"],
        ["A box of many small slices of different toppings", "Treemap for many parts"],
      ],
      breaks: "a pizza is always one whole. Comparing shares across two years needs two wholes side by side, which bars do and pies do badly.",
    },
    svg: () => {
      let b = t(240, 18, "Flows: a funnel shows where users drop off", { bold: true, size: 13.5 });
      const F = [["visit", 10000], ["signup", 3200], ["trial", 1400], ["paid", 380]];
      F.forEach(([s, v], i) => { const w = 290 * v / 10000, y = 34 + i * 40; b += rect(250 - w / 2, y, w, 30, PAL[i], { r: 4 }); b += t(20, y + 20, s, { a: "start", size: 12, bold: true }); b += t(470, y + 20, v.toLocaleString("en-US") + (i ? "  (" + (v / F[i - 1][1] * 100).toFixed(0) + "%)" : ""), { a: "end", size: 11.5 }); });
      b += t(240, 214, "biggest loss: visit -> signup; that is where to look first", { size: 11.5, fill: C.dim });
      return svg(480, 226, b, "Conversion funnel with step percentages");
    },
    caption: "Each bar is the users left at that step, with the share kept from the step before. Figures are examples.",
    _fig: i => {
      let b = t(240, 18, "Warehouse storage by team (%) as a " + ["pie", "100% stacked bar", "treemap"][i], { bold: true, size: 13 });
      if (i === 0) {
        let a0 = -Math.PI / 2; TEAM.forEach(([n, v], j) => { const a1 = a0 + v / 100 * 2 * Math.PI, cx = 160, cy = 120, r = 84; const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); b += `<path d="M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${v > 50 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" style="fill:${PAL[j]};stroke:${C.card};stroke-width:2"/>`; a0 = a1; });
        TEAM.forEach(([n], j) => { b += rect(300, 50 + j * 26, 14, 14, PAL[j]); b += t(322, 62 + j * 26, n, { a: "start", size: 12 }); });
        b += t(240, 226, "Is Maps bigger than Mail? Hard to tell from angles.", { size: 11.5, fill: C.warnT });
      } else if (i === 1) {
        let x = 20; TEAM.forEach(([n, v], j) => { const w = 440 * v / 100; b += rect(x, 70, w, 50, PAL[j], { r: 0 }); b += t(x + w / 2, 100, n, { size: 11, bold: true, fill: "#10141c", max: w - 4 }); b += t(x + w / 2, 140, v + "%", { size: 11.5, fill: C.tx }); x += w; });
        b += t(240, 190, "Lengths on one line: 18 vs 12 is now obvious.", { size: 11.5, fill: C.goodT });
      } else {
        const L = (x, y, w, h, n, v, c) => rect(x, y, w, h, c, { r: 2, stroke: C.card }) + t(x + 6, y + 16, n + " " + v + "%", { a: "start", size: 11, bold: true, fill: "#10141c", max: w - 8 });
        b += L(20, 34, 220, 180, "Ads", 34, PAL[0]) + L(240, 34, 220, 100, "Search", 27, PAL[1]) + L(240, 134, 130, 80, "Maps", 18, PAL[2]) + L(370, 134, 90, 52, "Mail", 12, PAL[3]) + L(370, 186, 90, 28, "Other", 9, PAL[4]);
        b += t(240, 232, "Area = value (approximate layout); scales to many parts.", { size: 11.5, fill: C.dim });
      }
      return svg(480, 244, b, "Part-to-whole chart variant");
    },
    ix: el => choice(el, { label: "Chart", options: ["pie", "100% bar", "treemap"], value: 0 }, i => ({ svg: P["viz-partwhole"]._fig(i), note: ["Five slices: fine for \"Ads is about a third\", poor for comparing the middle slices.", "The default for shares: one baseline, easy to compare, easy to put several years side by side.", "Good for many parts or a hierarchy (team, then dataset). Exact comparisons are still harder than bars."][i] })),
    oneline: "Show shares with stacked bars or treemaps, flows with funnels or Sankeys, and save pies for two or three slices.",
  };

  /* ---------------------------------------------------------------- viz-principles */
  const PR = [["honest", "One message, zero baseline, direct labels, one highlight colour."], ["3-D + rainbow", "3-D perspective makes front bars look bigger; every bar a different colour suggests categories mean something they don't."], ["dual axes", "Two y-axes with free scales: you can make any two lines appear to move together by choosing the scales."]];
  P["viz-principles"] = {
    simple: [
      "A chart is an argument, and it can mislead as easily as it informs. A few rules keep it honest and clear.",
      "Don't distort: start bars at zero, avoid two y-axes with different scales (use two aligned charts instead), and avoid 3-D, which bends lengths and areas.",
      "Make the message obvious: one message per chart, stated in the title (\"APAC grew fastest\", not \"Revenue by region\"), bars sorted, values labelled directly instead of a legend, and colour used on purpose: grey for context, one strong colour for the point. Check that it still works for colour-blind readers.",
    ],
    analogy: {
      text: "Think of a shop window display.",
      left: "Shop window", right: "Chart design",
      map: [
        ["One featured product under a spotlight", "One highlight colour for the message"],
        ["A sign saying \"50% off winter coats\"", "A title that states the takeaway"],
        ["A curved mirror that makes items look bigger", "3-D and truncated axes"],
        ["Clutter that hides the product", "Chartjunk: heavy grids, shadows, extra decoration"],
      ],
      breaks: "a shop window is meant to persuade. A chart for decisions should persuade only by showing the data plainly, or people stop trusting your charts.",
    },
    svg: () => P["viz-principles"]._fig(0),
    _fig: i => {
      let b = t(240, 18, i === 0 ? "APAC grew fastest this year" : i === 1 ? "Revenue by region (3-D, rainbow)" : "Signups vs revenue: two axes, chosen scales", { bold: true, size: 13.5 });
      if (i === 0) {
        REV.forEach(([r, v], j) => { const y = 36 + j * 32; b += t(80, y + 16, r, { a: "end", size: 12 }); b += rect(90, y + 3, v / 45 * 330, 20, j === 0 ? C.accS : "#55607a", { r: 3 }); b += t(96 + v / 45 * 330, y + 17, v + "M", { a: "start", size: 11.5, bold: j === 0, fill: j === 0 ? C.accT : C.dim }); });
      } else if (i === 1) {
        REV.forEach(([r, v], j) => { const x = 40 + j * 84, h = v / 45 * 150, sk = 12; b += `<polygon points="${x},${200 - h} ${x + sk},${188 - h} ${x + 50 + sk},${188 - h} ${x + 50},${200 - h}" style="fill:${PAL[(j + 2) % 5]};opacity:.7"/>`; b += rect(x, 200 - h, 50, h, PAL[(j + 2) % 5], { r: 0 }); b += `<polygon points="${x + 50},${200 - h} ${x + 50 + sk},${188 - h} ${x + 50 + sk},188 ${x + 50},200" style="fill:${PAL[(j + 2) % 5]};opacity:.45"/>`; b += t(x + 25, 216, r, { size: 11 }); });
      } else {
        const A = [10, 12, 13, 15, 16, 18], Bv = [400, 405, 410, 412, 420, 424];
        b += poly(A.map((v, j) => [60 + j * 72, 200 - (v - 10) / 8 * 150]), C.accS, 2.6); b += poly(Bv.map((v, j) => [60 + j * 72, 200 - (v - 400) / 24 * 150]), C.warnS, 2.6);
        b += t(30, 40, "signups 10k-18k", { a: "start", size: 10.5, fill: C.accT }); b += t(450, 40, "revenue 400-424", { a: "end", size: 10.5, fill: C.warnT });
        b += t(240, 218, "revenue rose 6%, signups 80%, yet the lines look identical", { size: 11, fill: C.badT });
      }
      return svg(480, 230, b, "Chart principle example");
    },
    caption: "The title states the message, one colour carries it, and everything else stays grey.",
    ix: el => choice(el, { label: "Version", options: PR.map(p => p[0]), value: 2 }, i => ({ svg: P["viz-principles"]._fig(i), note: PR[i][1] })),
    oneline: "Keep charts honest and simple: zero baselines, one message in the title, colour only where it matters.",
  };
})();
