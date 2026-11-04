/* Datalith pass 2 — Track 7: Python data libraries (part 1 of 2: NumPy, pandas, Arrow). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- np-foundations */
  const DT = [["int8", 1], ["int32", 4], ["float32", 4], ["float64", 8], ["object", 8]];
  P["np-foundations"] = {
    simple: [
      "**NumPy** is the library under almost all numeric Python. Its core is the **ndarray**: a grid of numbers that all share one type.",
      "A Python list stores pointers to separate objects scattered in memory. An ndarray stores the raw numbers side by side in one block, like a column in a spreadsheet.",
      "Because every item has the same size, NumPy can find item 1,000,000 by arithmetic and run fast C loops over the whole block.",
    ],
    analogy: {
      text: "Think of an egg tray versus a bag of mixed shopping.",
      left: "Eggs", right: "ndarray",
      map: [
        ["Every cup in the tray is the same size", "One dtype, fixed bytes per item"],
        ["Cups in neat rows and columns", "Shape, like `(1000, 3)`"],
        ["Find egg 12 by counting cups", "Index by arithmetic (strides)"],
        ["A shopping bag: each item wrapped differently", "A Python list of separate objects"],
        ["Small trays for quail eggs", "Smaller dtypes like `int8`, `float32`"],
      ],
      breaks: "an egg tray only holds eggs. An ndarray with `dtype=object` can hold anything, but then it is just an array of pointers and loses NumPy's speed.",
    },
    svg: () => {
      let b = t(240, 22, "list vs ndarray in memory", { bold: true, size: 14 });
      b += t(20, 50, "Python list [3, 7, 2]", { a: "start", size: 12.5, fill: C.badT, bold: true });
      [0, 1, 2].forEach(i => { b += box(20 + i * 44, 58, 40, 30, "ptr", null, "plain", { size: 11, mono: true }); });
      [[150, 100], [260, 108], [380, 96]].forEach(([x, y], i) => { b += box(x, y, 66, 30, "int " + [3, 7, 2][i], null, "bad", { size: 11.5, mono: true }); b += arrow(40 + i * 44, 88, x + 33, y, { sw: 1.2 }); });
      b += t(250, 76, "objects scattered in memory", { a: "start", size: 11.5, fill: C.dim });
      b += t(20, 148, "ndarray int64 [3, 7, 2]", { a: "start", size: 12.5, fill: C.goodT, bold: true });
      [3, 7, 2].forEach((v, i) => { b += box(20 + i * 90, 158, 90, 36, String(v), null, "good", { mono: true, r: 0 }); });
      b += t(300, 182, "one block, 8 bytes each", { a: "start", size: 12, fill: C.dim });
      b += t(240, 222, "item i lives at start + i x 8 bytes", { size: 12.5, mono: true, fill: C.dim });
      return svg(480, 238, b, "Python list of pointers versus a contiguous NumPy array");
    },
    caption: "A list points at objects scattered around memory; an ndarray packs raw values side by side.",
    ix: el => choice(el, { label: "dtype for 10 million values", options: DT.map(d => d[0]), value: 3 }, i => {
      const [n, by] = DT[i], mb = 10 * by;
      let b = t(240, 24, "np.zeros(10_000_000, dtype='" + n + "')", { mono: true, size: 13 });
      DT.forEach(([nm, bb], j) => {
        const y = 40 + j * 34;
        b += t(92, y + 19, nm, { a: "end", mono: true, size: 12.5, fill: j === i ? C.accT : C.dim });
        b += `<rect x="100" y="${y + 4}" width="${bb * 30}" height="22" rx="4" style="fill:${j === i ? C.acc : C.box};stroke:${j === i ? C.accS : C.boxS}"/>`;
        b += t(108 + bb * 30, y + 20, (10 * bb) + " MB" + (nm === "object" ? " + objects" : ""), { a: "start", size: 12, fill: j === i ? C.tx : C.faint });
      });
      return { svg: svg(480, 214, b, "Memory for 10 million values by dtype"), note: n === "object" ? "8 bytes per pointer, plus a full Python object for each value elsewhere, and no fast C loops." : n === "int8" ? "Only holds -128 to 127. Bigger values wrap around silently." : n === "float32" ? "Half the memory of float64, with about 7 significant digits instead of about 15." : mb + " MB for the array data." };
    }),
    oneline: "A NumPy array packs same-typed numbers side by side, which makes it small and fast.",
  };

  /* ---------------------------------------------------------------- np-vectorization */
  const BC = [
    ["(3,) + (3,)", [3], [3], "same shape: element by element"],
    ["(2,3) + (3,)", [2, 3], [3], "row is stretched down both rows"],
    ["(2,3) + (2,1)", [2, 3], [2, 1], "column is stretched across"],
    ["(2,3) + (2,)", [2, 3], [2], "error: 3 and 2 don't match"],
  ];
  P["np-vectorization"] = {
    simple: [
      "**Vectorization** means writing `a * 2` once instead of a Python loop over every item. NumPy runs the loop in fast compiled C code.",
      "A **ufunc** (universal function) like `np.sqrt` or `np.add` works on every element at once.",
      "**Broadcasting** lets arrays of different shapes work together: NumPy lines up the shapes from the right, and a size-1 or missing side is stretched to match, without copying data.",
    ],
    analogy: {
      text: "Think of a stamp roller versus a single rubber stamp.",
      left: "Stamping", right: "NumPy",
      map: [
        ["Stamping each box on a sheet by hand", "A Python `for` loop"],
        ["One roll of the roller across the sheet", "A vectorized operation"],
        ["One row of stamps rolled down every row", "Broadcasting a `(3,)` row over `(2, 3)`"],
        ["A roller the wrong width for the sheet", "Shapes that can't broadcast: error"],
      ],
      breaks: "a roller really prints on every row. Broadcasting doesn't copy the small array; NumPy just reads the same values again, so it costs no extra memory.",
    },
    svg: () => P["np-vectorization"]._fig(1),
    _fig: i => {
      const [lab, A, B, msg] = BC[i];
      let b = t(240, 22, "a" + lab.replace(" + ", " + b"), { bold: true, size: 13.5, mono: true });
      const grid = (x, y, sh, kind, ghost) => {
        const [r, c] = sh.length === 2 ? sh : [1, sh[0]]; let s = "";
        for (let rr = 0; rr < r; rr++) for (let cc = 0; cc < c; cc++) s += box(x + cc * 34, y + rr * 34, 30, 30, "", null, kind, { r: 4 });
        if (ghost) { const [R, Cc] = ghost; for (let rr = 0; rr < R; rr++) for (let cc = 0; cc < Cc; cc++) if (rr >= r || cc >= c) s += box(x + cc * 34, y + rr * 34, 30, 30, "", null, "ghost", { r: 4, dash: true }); }
        return s;
      };
      const ok = i !== 3, out = A.length === 2 ? A : [1, A[0]];
      b += grid(20, 50, A, "acc");
      b += t(140, 84, "+", { size: 20, bold: true });
      b += grid(160, 50, B.length === 2 ? B : [1, B[0]], ok ? "vio" : "bad", ok ? out : null);
      b += t(282, 84, ok ? "=" : "x", { size: 20, bold: true, fill: ok ? C.tx : C.badT });
      if (ok) b += grid(300, 50, out, "good");
      b += box(20, 136, 440, 40, msg, null, ok ? "plain" : "bad", { size: 13 });
      b += t(240, 202, "Compare shapes right to left: equal, or one of them is 1.", { size: 12, fill: C.dim });
      return svg(480, 218, b, "Broadcasting two array shapes");
    },
    caption: "Dashed cells are the broadcast copies NumPy pretends exist; no data is actually copied.",
    ix: el => choice(el, { label: "Shapes", options: BC.map(x => x[0]), value: 0 }, i => ({
      svg: P["np-vectorization"]._fig(i),
      note: ["Same shape, so item i meets item i.", "Shape (3,) is treated as (1,3), then the 1 stretches to 2.", "The (2,1) column stretches across 3 columns: handy for subtracting each row's mean.", "Right-most sizes are 3 and 2: neither is 1, so NumPy raises <code>ValueError: operands could not be broadcast</code>."][i],
    })),
    oneline: "Vectorized NumPy runs one operation over whole arrays, stretching smaller shapes to fit.",
  };

  /* ---------------------------------------------------------------- np-indexing-agg */
  P["np-indexing-agg"] = {
    simple: [
      "You pick parts of an array with **indexing**: `a[0]`, slices like `a[1:4]`, or a **boolean mask** like `a[a > 50]`.",
      "**Aggregations** like `sum`, `mean` and `max` squash many values into one. Give `axis=0` to work down columns, or `axis=1` across rows.",
      "`reshape` changes the shape without changing the data, as long as the total count matches. Basic slices return a **view** of the same memory; masks return a **copy**.",
    ],
    analogy: {
      text: "Think of a cinema seating chart.",
      left: "Cinema", right: "NumPy indexing",
      map: [
        ["Seat row 2, seat 5", "`a[2, 5]`"],
        ["Seats 1 to 4 in every row", "`a[:, 1:5]`"],
        ["Only the seats that are booked", "Mask `a[booked]`"],
        ["Counting bookings per row", "`a.sum(axis=1)`"],
        ["Renumbering 100 seats as 4 rows of 25", "`reshape(4, 25)`"],
      ],
      breaks: "pointing at seats doesn't move people. A slice is a view, so writing into it changes the original array too; call `.copy()` when you need a separate one.",
    },
    svg: () => {
      let b = t(240, 22, "a = sales (3 stores x 4 days)", { bold: true, size: 13.5 });
      const A = [[12, 40, 7, 55], [30, 61, 22, 9], [48, 15, 70, 33]];
      A.forEach((r, i) => r.forEach((v, j) => { b += box(40 + j * 56, 40 + i * 38, 50, 32, String(v), null, v > 50 ? "good" : "plain", { mono: true, size: 13, r: 4 }); }));
      b += t(20, 62, "s0", { size: 11.5, fill: C.dim }); b += t(20, 100, "s1", { size: 11.5, fill: C.dim }); b += t(20, 138, "s2", { size: 11.5, fill: C.dim });
      A.forEach((r, i) => { b += arrow(268, 56 + i * 38, 288, 56 + i * 38); b += t(296, 61 + i * 38, String(r.reduce((x, y) => x + y)), { a: "start", mono: true, size: 13, fill: C.accT }); });
      b += t(380, 61, "sum(axis=1)", { mono: true, size: 12, fill: C.accT });
      b += t(380, 77, "per store", { size: 11.5, fill: C.dim });
      [0, 1, 2, 3].forEach(j => { b += t(65 + j * 56, 176, String(A.reduce((x, r) => x + r[j], 0)), { mono: true, size: 13, fill: C.vioT }); });
      b += t(150, 198, "sum(axis=0): per day", { mono: true, size: 12, fill: C.vioT });
      b += t(240, 226, "a[a > 50] -> [55, 61, 70]  (a copy)", { mono: true, size: 12.5, fill: C.goodT });
      return svg(480, 242, b, "Aggregating along axis 0 and axis 1, and a boolean mask");
    },
    caption: "axis=1 collapses across each row; axis=0 collapses down each column; the mask picks the green cells.",
    oneline: "Index to pick values, aggregate along an axis to summarise, and reshape without moving data.",
  };

  /* ---------------------------------------------------------------- pd-foundations */
  P["pd-foundations"] = {
    simple: [
      "**pandas** is the everyday Python library for tables. A **DataFrame** is a table; each column is a **Series**.",
      "Every DataFrame has an **Index**: the labels on its rows. By default they are 0, 1, 2 ..., but they can be dates, IDs or anything else.",
      "Each column has one **dtype** (data type) and is stored as an array underneath, which is why column maths is fast and row-by-row loops are slow.",
    ],
    analogy: {
      text: "Think of a school register.",
      left: "School register", right: "pandas",
      map: [
        ["The whole register", "DataFrame"],
        ["One column, like \"marks\"", "Series"],
        ["Roll numbers down the left edge", "Index"],
        ["The marks column holds only numbers", "One dtype per column"],
        ["Copying a column into another register", "Index alignment on assignment"],
      ],
      breaks: "copying a column by hand goes row by row in page order. pandas matches rows by index label, so combining two Series with different labels gives NaN where labels don't line up.",
    },
    svg: () => {
      let b = t(240, 22, "df: a DataFrame", { bold: true, size: 14 });
      b += table(80, 44, ["index", "city", "orders", "revenue"], [["0", "Pune", "120", "4,560.0"], ["1", "Goa", "85", "3,010.5"], ["2", "Delhi", "240", "9,870.0"]], { cw: [60, 100, 90, 110], rh: 30, size: 12.5 });
      b += `<rect x="240" y="44" width="90" height="120" rx="4" style="fill:none;stroke:${C.vioS};stroke-width:2.4"/>`;
      b += t(285, 186, "a Series", { size: 12, fill: C.vioT, bold: true });
      b += `<rect x="80" y="74" width="60" height="90" rx="4" style="fill:none;stroke:${C.warnS};stroke-width:2.4"/>`;
      b += t(110, 186, "Index", { size: 12, fill: C.warnT, bold: true });
      b += t(180, 210, "object/str", { size: 11.5, fill: C.dim, mono: true }); b += t(285, 210, "int64", { size: 11.5, fill: C.dim, mono: true }); b += t(385, 210, "float64", { size: 11.5, fill: C.dim, mono: true });
      b += t(240, 236, "one dtype per column", { size: 12.5, fill: C.dim });
      return svg(480, 250, b, "Parts of a pandas DataFrame");
    },
    caption: "A DataFrame is labelled columns (each a Series with its own dtype) sharing one row Index.",
    oneline: "A pandas DataFrame is a table of typed columns that share row labels called the index.",
  };

  /* ---------------------------------------------------------------- pd-selection */
  P["pd-selection"] = {
    simple: [
      "Selecting means picking rows and columns. `df['city']` gets one column; `df[['city', 'revenue']]` gets several.",
      "`.loc` selects by **label**: `df.loc[df.revenue > 5000, 'city']`. `.iloc` selects by **position**: `df.iloc[0:10, 2]`.",
      "To change values, assign through one `.loc` call: `df.loc[mask, 'flag'] = 1`. Chained picks like `df[mask]['flag'] = 1` may change a temporary copy and leave `df` untouched.",
    ],
    analogy: {
      text: "Think of finding seats in a theatre.",
      left: "Theatre", right: "pandas selection",
      map: [
        ["\"Row K, seat 12\" printed on the ticket", "`.loc`: by label"],
        ["\"The 3rd row from the front, 5th seat\"", "`.iloc`: by position"],
        ["\"Everyone with a VIP ticket\"", "A boolean mask"],
        ["Giving the VIPs a free drink", "`df.loc[mask, 'drink'] = 1`"],
      ],
      breaks: "in a theatre, row K is always the same row. In pandas, labels and positions differ after sorting or filtering: label 7 may sit at position 0. Mixing them up is a classic bug.",
    },
    svg: () => {
      let b = t(240, 22, "df.loc[df.revenue > 5000, 'city']", { bold: true, size: 13.5, mono: true });
      b += table(40, 44, ["label", "city", "revenue"], [["7", "Pune", "4,560"], ["3", "Delhi", "9,870"], ["9", "Goa", "3,010"], ["4", "Surat", "6,200"]], { cw: [70, 110, 110], rh: 30, size: 12.5, hl: { 1: "good", 3: "good" } });
      b += `<rect x="110" y="44" width="110" height="150" rx="4" style="fill:none;stroke:${C.accS};stroke-width:2.4"/>`;
      b += arrow(334, 120, 364, 120);
      b += table(370, 74, ["city"], [["Delhi"], ["Surat"]], { cw: [90], rh: 30, size: 12.5, hl: { 0: "good", 1: "good" } });
      b += t(240, 222, "df.iloc[0] is label 7 (Pune), not label 0", { size: 12.5, fill: C.warnT, mono: true });
      return svg(480, 238, b, "Selecting rows with a mask and a column by label");
    },
    caption: "The mask picks rows (green), the label picks the column (blue box); .iloc counts positions instead.",
    oneline: "Use .loc for labels, .iloc for positions, and one .loc call when you assign.",
  };

  /* ---------------------------------------------------------------- pd-groupby */
  const GB = [["Pune", 120], ["Goa", 80], ["Pune", 60], ["Delhi", 200], ["Goa", 40], ["Pune", 30]];
  P["pd-groupby"] = {
    simple: [
      "`groupby` answers questions like \"total revenue per city\". It works in three steps: **split** the rows into groups by a key, **apply** a calculation to each group, then **combine** the results into a new table.",
      "`df.groupby('city')['revenue'].sum()` does all three in one line. `.agg({'revenue': 'sum', 'order_id': 'count'})` does several at once.",
      "`transform` returns one value per original row, like each order's share of its city's total.",
    ],
    analogy: {
      text: "Think of sorting a class's homework into piles by subject, then counting each pile.",
      left: "Homework piles", right: "groupby",
      map: [
        ["Putting each sheet on its subject's pile", "Split by key"],
        ["Counting or adding up each pile", "Apply: sum, mean, count"],
        ["Writing the totals on one summary sheet", "Combine into a result"],
        ["Writing each pile's total back on every sheet", "`transform`"],
      ],
      breaks: "piles exist even if empty. By default pandas drops groups whose key is NaN; pass `dropna=False` to keep them.",
    },
    svg: () => P["pd-groupby"]._fig(0),
    _fig: k => {
      const fn = ["sum", "mean", "count", "max"][k];
      const g = {}; GB.forEach(([c, v]) => (g[c] = g[c] || []).push(v));
      const red = a => k === 0 ? a.reduce((x, y) => x + y) : k === 1 ? Math.round(a.reduce((x, y) => x + y) / a.length * 10) / 10 : k === 2 ? a.length : Math.max(...a);
      const kind = { Pune: "acc", Goa: "vio", Delhi: "warn" };
      let b = t(240, 20, "df.groupby('city')['rev']." + fn + "()", { bold: true, size: 13, mono: true });
      GB.forEach(([c, v], i) => { b += box(16, 34 + i * 32, 120, 28, c + " " + v, null, kind[c], { mono: true, size: 12 }); });
      b += t(76, 236, "split", { size: 12, fill: C.dim, bold: true });
      Object.keys(g).forEach((c, j) => {
        const y = 40 + j * 64;
        b += box(176, y, 140, 50, c, g[c].join(" + "), kind[c], { mono2: true, size2: 11.5 });
        b += arrow(318, y + 25, 346, y + 25);
        b += box(350, y, 110, 50, String(red(g[c])), fn, "good", { mono: true });
      });
      b += t(246, 236, "apply", { size: 12, fill: C.dim, bold: true }); b += t(405, 236, "combine", { size: 12, fill: C.dim, bold: true });
      return svg(480, 250, b, "groupby split, apply, combine");
    },
    caption: "Rows are split by city, each pile is summed, and the sums become a new table.",
    ix: el => choice(el, { label: "Aggregation", options: ["sum", "mean", "count", "max"], value: 1 }, i => ({
      svg: P["pd-groupby"]._fig(i),
      note: ["Same split every time; only the apply step changes.", "Mean of each pile.", "count counts non-null values per group; size() counts rows including nulls.", "The biggest single order in each city."][i],
    })),
    oneline: "groupby splits rows into groups, calculates each group, and combines the answers.",
  };

  /* ---------------------------------------------------------------- pd-merge-reshape */
  const LT = [["1", "Ria"], ["2", "Om"], ["3", "Jay"]], RT = [["1", "450"], ["3", "90"], ["4", "300"]];
  P["pd-merge-reshape"] = {
    simple: [
      "`pd.merge` joins two tables on a shared key, just like SQL `JOIN`. `how=` picks which rows survive: `inner`, `left`, `right` or `outer`.",
      "`pd.concat` stacks tables on top of each other (or side by side) without matching keys.",
      "**Reshaping** turns tables around: `pivot` / `pivot_table` make long data wide (one column per month), `melt` makes wide data long again.",
    ],
    analogy: {
      text: "Think of matching a class list with a list of who brought a permission slip.",
      left: "Class lists", right: "merge",
      map: [
        ["Only pupils on both lists", "`how='inner'`"],
        ["Every pupil, slip or not", "`how='left'`"],
        ["Every slip, even from a pupil not in this class", "`how='right'`"],
        ["Everyone from both lists", "`how='outer'`"],
        ["Stapling two class lists together", "`concat`"],
      ],
      breaks: "each pupil brings one slip. If a key repeats on both sides, merge returns every pairing, so rows multiply; pass `validate='one_to_one'` to catch that.",
    },
    svg: () => P["pd-merge-reshape"]._fig(1),
    _fig: i => {
      const how = ["inner", "left", "right", "outer"][i];
      const keys = { inner: ["1", "3"], left: ["1", "2", "3"], right: ["1", "3", "4"], outer: ["1", "2", "3", "4"] }[how];
      const L = Object.fromEntries(LT), R = Object.fromEntries(RT);
      let b = t(240, 20, "pd.merge(users, orders, on='id', how='" + how + "')", { bold: true, size: 12.5, mono: true });
      b += table(16, 46, ["id", "name"], LT, { cw: [40, 60], rh: 26, size: 12, title: "users", tsize: 12 });
      b += table(16, 170, ["id", "amt"], RT, { cw: [40, 60], rh: 26, size: 12, title: "orders", tsize: 12 });
      b += arrow(124, 140, 170, 140);
      const rows = keys.map(k => [k, L[k] || "NaN", R[k] || "NaN"]);
      const hl = {}; rows.forEach((r, j) => { hl[j] = r[1] !== "NaN" && r[2] !== "NaN" ? "good" : "warn"; });
      b += table(180, 60, ["id", "name", "amt"], rows, { cw: [60, 100, 100], rh: 30, size: 12.5, hl });
      if (how !== "inner") b += t(330, 60 + 30 * (rows.length + 1) + 22, "amber rows have a NaN side", { size: 11.5, fill: C.warnT });
      return svg(480, 280, b, "Result of a pandas merge");
    },
    caption: "A left merge keeps every user; Om has no order, so his amount is NaN.",
    ix: el => choice(el, { label: "how=", options: ["inner", "left", "right", "outer"], value: 0 }, i => ({
      svg: P["pd-merge-reshape"]._fig(i),
      note: ["Only ids 1 and 3 appear on both sides.", "All users; missing orders become NaN.", "All orders; order 4 has no user, a sign of a broken foreign key.", "Everything from both sides. Add <code>indicator=True</code> to see which side each row came from."][i],
    })),
    oneline: "merge joins tables on keys like SQL, concat stacks them, and pivot or melt reshape them.",
  };

  /* ---------------------------------------------------------------- pd-timeseries-perf */
  P["pd-timeseries-perf"] = {
    simple: [
      "With a **DatetimeIndex**, pandas understands time: `df.resample('D').sum()` turns minute data into daily totals, and `rolling('7D').mean()` gives a 7-day moving average.",
      "Performance comes from **dtypes** and **vectorization**. A text column with few distinct values (like city) shrinks a lot as the `category` dtype. Column maths beats `apply` and `iterrows` by 10 to 100 times.",
      "pandas works in memory. When data is bigger than RAM, read only the columns you need, use chunks, or move to Polars, DuckDB or Spark.",
    ],
    analogy: {
      text: "Think of a fitness tracker's step data.",
      left: "Step tracker", right: "pandas time series",
      map: [
        ["A reading every minute", "Minute-level DatetimeIndex"],
        ["\"Steps per day\" on the app", "`resample('D').sum()`"],
        ["\"Average over the last week\"", "`rolling('7D').mean()`"],
        ["Storing \"Walking\" as code 1 instead of the word", "`category` dtype"],
      ],
      breaks: "a tracker knows your time zone. A naive pandas timestamp doesn't; resample a UTC series to days and the days are UTC days, not Indian ones. Convert with `tz_convert` first.",
    },
    svg: () => {
      let b = t(240, 22, "resample('D').sum(): minutes into days", { bold: true, size: 14 });
      for (let i = 0; i < 36; i++) { const h = 10 + ((i * 37) % 23); b += `<rect x="${20 + i * 12}" y="${110 - h}" width="9" height="${h}" style="fill:${C.acc};stroke:none"/>`; }
      b += line(20, 112, 452, 112);
      [0, 1, 2].forEach(d => { b += `<rect x="${18 + d * 144}" y="44" width="142" height="72" rx="6" style="fill:none;stroke:${C.warnS};stroke-dasharray:5 4"/>`; b += t(89 + d * 144, 132, "day " + (d + 1), { size: 12, fill: C.warnT }); });
      b += arrow(240, 140, 240, 160);
      [0, 1, 2].forEach(d => { let sum = 0; for (let i = d * 12; i < d * 12 + 12; i++) sum += 10 + ((i * 37) % 23); b += box(30 + d * 144, 164, 118, 36, "sum " + sum, null, "good", { size: 13, mono: true }); });
      b += t(240, 230, "city as category: 1 small code per row, not a string", { size: 12.5, fill: C.dim });
      return svg(480, 246, b, "Resampling minute data into daily buckets");
    },
    caption: "resample puts each timestamp into its day bucket and aggregates each bucket.",
    oneline: "Give pandas a datetime index to resample and roll over time, and pick small dtypes to stay fast.",
  };

  /* ---------------------------------------------------------------- pa-arrow */
  P["pa-arrow"] = {
    simple: [
      "**Apache Arrow** is a standard way to lay out table data in memory, column by column.",
      "Because pandas, Polars, DuckDB, Spark and many others all understand the same layout, they can hand data to each other **without copying or converting** it (zero-copy).",
      "Each column is a contiguous buffer of values plus a **validity bitmap**: one bit per row saying whether the value is null.",
    ],
    analogy: {
      text: "Think of standard shipping containers.",
      left: "Shipping", right: "Arrow",
      map: [
        ["Every ship, train and truck takes the same box", "Every engine reads the same memory layout"],
        ["No unpacking between ship and train", "Zero-copy hand-off"],
        ["Goods packed by type in each box", "Columnar buffers"],
        ["A tick sheet of which slots are empty", "Validity bitmap"],
      ],
      breaks: "a container moves between places. Zero-copy works inside one machine's memory; sending Arrow over a network (Arrow Flight) still sends bytes, just without conversion work.",
    },
    svg: () => {
      let b = t(240, 22, "Arrow column: amount (int64, 5 rows)", { bold: true, size: 13.5 });
      b += t(20, 54, "validity", { a: "start", size: 12, fill: C.dim });
      [1, 1, 0, 1, 1].forEach((v, i) => { b += box(100 + i * 56, 38, 50, 28, String(v), null, v ? "good" : "bad", { mono: true, size: 13, r: 3 }); });
      b += t(20, 96, "values", { a: "start", size: 12, fill: C.dim });
      ["450", "90", "-", "300", "75"].forEach((v, i) => { b += box(100 + i * 56, 80, 50, 28, v, null, i === 2 ? "ghost" : "acc", { mono: true, size: 13, r: 3 }); });
      b += t(390, 98, "row 3 is null", { a: "start", size: 11.5, fill: C.badT });
      const eng = [["pandas", 20], ["Polars", 136], ["DuckDB", 252], ["PyArrow", 368]];
      b += box(140, 128, 200, 34, "same buffers in memory", null, "vio", { size: 13 });
      eng.forEach(([n, x]) => { b += arrow(240, 164, x + 46, 196, { sw: 1.4 }); b += box(x, 198, 92, 32, n, null, "plain", { size: 13 }); });
      return svg(480, 244, b, "Arrow column buffers shared by several engines");
    },
    caption: "A column is a values buffer plus a null bitmap; engines that speak Arrow read the same bytes.",
    oneline: "Arrow is a shared column layout in memory, so data tools can pass tables without copying.",
  };
})();
