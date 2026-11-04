/* Datalith pass 2 — Track 4 (SQL), part C: subqueries, CTEs, window functions, grouping sets,
   analytic functions, CASE and pivoting. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- sql-subqueries */
  P["sql-subqueries"] = {
    simple: [
      "A **subquery** is a question inside a question. The inner query runs and hands its answer to the outer one.",
      "The inner answer can be one number (\"the average price\"), a list (\"all customer ids with an order\"), or a whole little table.",
      "A **correlated** subquery is special. It mentions the outer row, so it is asked again for every outer row, like \"does *this* customer have an order?\"",
    ],
    analogy: {
      text: "Think of a teacher who asks one student to look something up before she decides.",
      left: "In class", right: "In SQL",
      map: [
        ["\"What's the class average?\" then \"who scored above it?\"", "Scalar subquery: `WHERE score > (SELECT AVG(score) ...)`"],
        ["\"Fetch the list of kids on the team\" then check each name", "`WHERE id IN (SELECT ...)`"],
        ["Asking about each kid in turn: \"did *you* hand in homework?\"", "Correlated `EXISTS (SELECT 1 ... WHERE h.kid = k.id)`"],
        ["A worksheet made first, then used like a book", "Derived table: `FROM (SELECT ...) AS t`"],
      ],
      breaks: "the teacher really would ask each kid one by one. A good database often rewrites a correlated subquery into a join, so it isn't slow just because it reads that way.",
    },
    svg: () => {
      let b = t(120, 26, "Scalar: runs once", { bold: true, size: 14 }) + t(360, 26, "Correlated: once per outer row", { bold: true, size: 14 });
      b += box(30, 42, 180, 46, "SELECT AVG(price)", "inner query", "vio", { mono: true, size: 13.5 });
      b += arrow(120, 90, 120, 122, { label: "returns 25", dx: 44, dy: 4 });
      b += box(20, 126, 200, 46, "WHERE price > 25", "outer query", "acc", { mono: true, size: 13.5 });
      b += t(120, 200, "1 inner run, then a normal filter", { size: 12.5, fill: C.dim });
      b += line(240, 40, 240, 330, { stroke: "#2b3446" });
      const cust = ["Ava", "Ben", "Cai"], has = [true, false, true];
      cust.forEach((c, i) => {
        const y = 46 + i * 72;
        b += box(256, y, 76, 40, c, null, "acc", { size: 14 });
        b += arrow(334, y + 20, 362, y + 20, { stroke: C.vioS });
        b += box(366, y, 100, 40, "EXISTS?", null, "vio", { mono: true, size: 13 });
        b += t(416, y + 58, has[i] ? "yes: keep" : "no: drop", { size: 12.5, fill: has[i] ? C.goodT : C.badT, bold: true });
      });
      b += t(360, 290, "the inner query sees each outer row", { size: 12.5, fill: C.dim });
      b += t(360, 308, "(in meaning; optimizers often", { size: 12, fill: C.faint });
      b += t(360, 324, "turn it into a join)", { size: 12, fill: C.faint });
      return svg(480, 340, b, "A scalar subquery runs once; a correlated subquery is evaluated for each outer row");
    },
    caption: "Left: the inner query answers once. Right: the inner question is asked again for each customer.",
    oneline: "A subquery is a small question whose answer the big question uses; a correlated one is asked again for every row.",
  };

  /* ---------------------------------------------------------------- sql-cte */
  P["sql-cte"] = {
    simple: [
      "A **CTE** (Common Table Expression) gives a name to a step of your query, using `WITH step_name AS (...)`.",
      "Later steps can use that name as if it were a table. Your query then reads top to bottom, like a recipe, instead of inside out.",
      "A **recursive** CTE can also call itself. That lets SQL walk a family tree, an org chart, or count 1, 2, 3 ... until a stop rule says enough.",
    ],
    analogy: {
      text: "Think of a recipe card with numbered steps.",
      left: "The recipe", right: "In SQL",
      map: [
        ["Step 1: wash the vegetables (call them \"clean veg\")", "`WITH cleaned AS (SELECT ... WHERE ...)`"],
        ["Step 2: chop the clean veg", "`, chopped AS (SELECT ... FROM cleaned)`"],
        ["Serve: put the chopped veg in a bowl", "The final `SELECT ... FROM chopped`"],
        ["\"Fold the dough, then fold it again, until it has 8 layers\"", "Recursive CTE: anchor + repeat step + stop rule"],
      ],
      breaks: "a recipe makes each step once and keeps it. Many databases just paste the CTE's SQL where you use it, so a CTE used twice may run twice. It names a step; it doesn't always save the result.",
    },
    svg: () => {
      let b = t(120, 24, "A readable pipeline", { bold: true, size: 14 });
      [["raw_orders", "plain"], ["cleaned", "acc"], ["per_customer", "acc"], ["final SELECT", "good"]].forEach(([n, k], i) => {
        const y = 38 + i * 68;
        b += box(30, y, 180, 44, n, null, k, { mono: true, size: 14 });
        if (i < 3) b += arrow(120, y + 44, 120, y + 66);
      });
      b += t(360, 24, "Recursive: walk an org chart", { bold: true, size: 14 });
      const lv = [["Asha (CEO)", "anchor"], ["Bo, Chen", "step 1"], ["Dina, Eli, Fay", "step 2"], ["no new rows", "stop"]];
      lv.forEach(([n, s], i) => {
        const y = 38 + i * 68;
        b += box(270, y, 190, 44, n, s, i === 3 ? "bad" : i === 0 ? "vio" : "acc", { size: 14, size2: 12 });
        if (i < 3) b += arrow(365, y + 44, 365, y + 66, { label: "join employees on manager", dx: -2, dy: 6, size: 10.5 });
      });
      b += t(240, 316, "Each round finds the reports of the people found last round.", { size: 12.5, fill: C.dim });
      return svg(480, 332, b, "Chained CTEs as a pipeline, and a recursive CTE expanding level by level");
    },
    caption: "Left: each CTE feeds the next. Right: a recursive CTE adds one level per round and stops when a round finds nobody.",
    oneline: "WITH lets you name the steps of a query so it reads like a recipe, and a recursive CTE repeats a step until nothing new turns up.",
  };

  /* ---------------------------------------------------------------- sql-window */
  const SC = [["Ava", "A", 90], ["Ben", "A", 85], ["Cai", "A", 85], ["Dev", "A", 70], ["Eli", "B", 95], ["Fay", "B", 80]];
  function ranks(kind, byClass) {
    const out = [];
    const groups = byClass ? ["A", "B"] : ["*"];
    groups.forEach(g => {
      const rows = SC.filter(r => g === "*" || r[1] === g).slice().sort((a, b) => b[2] - a[2]);
      let rn = 0, rank = 0, dense = 0, prev = null;
      rows.forEach((r, i) => {
        rn = i + 1;
        if (r[2] !== prev) { rank = i + 1; dense++; prev = r[2]; }
        const n = rows.length, tile = Math.floor(i * 2 / n) + 1;
        const v = kind === "ROW_NUMBER" ? rn : kind === "RANK" ? rank : kind === "DENSE_RANK" ? dense : kind === "NTILE(2)" ? tile : Math.round(rows.reduce((s, x) => s + x[2], 0) / n * 10) / 10;
        out.push([r[0], r[1], String(r[2]), String(v)]);
      });
    });
    return out;
  }
  P["sql-window"] = {
    simple: [
      "`GROUP BY` squashes rows into one row per group. Sometimes you want a group number **next to every row** instead, like each student's rank inside their class.",
      "A **window function** does that. `OVER (...)` says which rows each row can \"see\" while it computes.",
      "`PARTITION BY class` gives each class its own window. `ORDER BY score DESC` lines the window up, so `RANK()` can count positions.",
    ],
    analogy: {
      text: "Think of a sports day where every child keeps their own card, and the teacher writes their place in their class on it.",
      left: "Sports day", right: "In SQL",
      map: [
        ["Every child keeps their own card", "Every row stays (no collapsing)"],
        ["Look only at your own class's results", "`PARTITION BY class`"],
        ["Line the class up by score", "`ORDER BY score DESC`"],
        ["Write 1st, 2nd, 3rd on each card", "`ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`"],
        ["Two kids tie for 2nd; the next is 4th", "`RANK()` leaves a gap; `DENSE_RANK()` doesn't"],
      ],
      breaks: "a teacher can break a tie by eye. `ROW_NUMBER()` breaks ties in whatever order the database meets the rows, so add a second ORDER BY column if you need the same answer every time.",
    },
    svg: () => {
      let b = t(240, 24, "RANK() OVER (PARTITION BY class ORDER BY score DESC)", { mono: true, size: 12.5 });
      const rows = ranks("RANK", true);
      b += table(30, 52, ["name", "class", "score", "rank"], rows, { cw: [90, 80, 90, 100], rh: 30, hl: { 0: "acc", 1: "acc", 2: "acc", 3: "acc", 4: "vio", 5: "vio" } });
      b += `<rect x="24" y="80" width="372" height="124" rx="6" style="fill:none;stroke:${C.accS};stroke-width:2;stroke-dasharray:6 4"/>`;
      b += `<rect x="24" y="202" width="372" height="64" rx="6" style="fill:none;stroke:${C.vioS};stroke-width:2;stroke-dasharray:6 4"/>`;
      b += t(404, 146, "window A", { size: 12, fill: C.accT, a: "start", bold: true });
      b += t(404, 238, "window B", { size: 12, fill: C.vioT, a: "start", bold: true });
      b += t(240, 300, "6 rows in, 6 rows out. Ranking restarts in each window.", { size: 13, fill: C.tx });
      b += t(240, 320, "Ben and Cai tie on 85, share rank 2, and Dev gets 4.", { size: 12.5, fill: C.dim });
      return svg(480, 336, b, "Window function ranks rows inside each partition without collapsing them");
    },
    caption: "Each dashed box is one window. Every row keeps its detail and gains a rank inside its class.",
    ix: el => {
      const kinds = ["ROW_NUMBER", "RANK", "DENSE_RANK", "NTILE(2)", "AVG(score)"];
      let byClass = true;
      el.innerHTML = `<div class="p2-ctl"><span class="p2-lbl">PARTITION BY class:</span><span class="p2-btns"><button type="button" class="p2-btn p2-part on" aria-pressed="true">on</button><button type="button" class="p2-btn p2-part" aria-pressed="false">off</button></span></div><div class="p2-sub"></div>`;
      const sub = el.querySelector(".p2-sub"), pb = [...el.querySelectorAll(".p2-part")];
      let last = 1;
      const draw = () => choice(sub, { label: "Function:", options: kinds, value: last }, i => {
        last = i;
        const k = kinds[i], rows = ranks(k, byClass);
        const hl = {}; rows.forEach((r, j) => { hl[j] = r[1] === "A" ? "acc" : "vio"; });
        const over = k === "AVG(score)" ? (byClass ? "PARTITION BY class" : "") : (byClass ? "PARTITION BY class " : "") + "ORDER BY score DESC";
        let b = t(240, 24, `${k === "AVG(score)" ? "AVG(score)" : k === "NTILE(2)" ? "NTILE(2)" : k + "()"} OVER (${over})`, { mono: true, size: 12, fill: C.tx });
        b += table(60, 48, ["name", "class", "score", k.length > 10 ? "value" : k.toLowerCase()], rows, { cw: [90, 80, 90, 100], rh: 28, hl: byClass ? hl : {} });
        const notes = {
          ROW_NUMBER: "1, 2, 3 ... with no ties. Ben or Cai could swap places between runs, because they tie.",
          RANK: "Ties share a number and leave a gap after them (2, 2, then 4).",
          DENSE_RANK: "Ties share a number with no gap (2, 2, then 3).",
          "NTILE(2)": "Splits each window into 2 nearly equal buckets: top half 1, bottom half 2.",
          "AVG(score)": "Any aggregate works with OVER. With PARTITION BY and no ORDER BY it repeats each class's average on every row. Add <code>ORDER BY score DESC</code> inside OVER and it becomes a running average instead (Ava 90, Ben and Cai 86.7, Dev 82.5), because the default frame then stops at the current row and its ties.",
        };
        return { svg: svg(480, 48 + 28 * 7 + 16, b, k + " result"), note: notes[k] + (byClass ? "" : " <b>Without PARTITION BY</b>, all six rows form one window.") };
      });
      pb.forEach((btn, i) => btn.addEventListener("click", () => { byClass = i === 0; pb.forEach((x, j) => { x.classList.toggle("on", i === j); x.setAttribute("aria-pressed", String(i === j)); }); draw(); }));
      draw();
    },
    oneline: "A window function writes a group answer, like a rank or an average, onto every row instead of squashing the rows.",
  };

  /* ---------------------------------------------------------------- sql-grouping-sets */
  P["sql-grouping-sets"] = {
    simple: [
      "Reports often need totals at several levels at once: sales per region **and** category, per region, and one grand total.",
      "You could run three queries and glue them with `UNION ALL`. `GROUPING SETS` asks for all the levels in one query, so the data is read once.",
      "`ROLLUP(region, category)` is a shortcut for the usual staircase of subtotals. `CUBE` gives every possible combination.",
    ],
    analogy: {
      text: "Think of a shop's receipt pile being totalled for the owner.",
      left: "The shop owner's sheet", right: "In SQL",
      map: [
        ["Total per shelf in each aisle", "The set `(region, category)`"],
        ["Total per aisle", "The set `(region)`"],
        ["Total for the whole shop", "The empty set `()`: grand total"],
        ["\"Give me the staircase: shelf, aisle, shop\"", "`ROLLUP(region, category)`"],
        ["\"Give me every way of slicing it\"", "`CUBE(region, category)`, which adds `(category)`"],
        ["A blank in the aisle box on the shop-total line", "`NULL` in a column that isn't grouped at that level"],
      ],
      breaks: "on paper a blank clearly means \"all\". In SQL that NULL could also be real missing data, so use `GROUPING(col)` to tell a subtotal row apart from a NULL value.",
    },
    svg: () => {
      let b = t(240, 24, "GROUP BY ROLLUP(region, category)", { mono: true, size: 13.5 });
      const rows = [["EU", "Toys", "40"], ["EU", "Books", "60"], ["EU", null, "100"], ["US", "Toys", "30"], ["US", null, "30"], [null, null, "130"]];
      b += table(70, 48, ["region", "category", "SUM(sales)"], rows, { cw: [100, 110, 120], rh: 30, hl: { 2: "acc", 4: "acc", 5: "good" } });
      b += t(410, 63 + 30 * 3, "region total", { size: 12, fill: C.accT, a: "start", bold: true });
      b += t(410, 63 + 30 * 5, "region total", { size: 12, fill: C.accT, a: "start", bold: true });
      b += t(410, 63 + 30 * 6, "grand total", { size: 12, fill: C.goodT, a: "start", bold: true });
      b += t(240, 290, "ROLLUP(a, b) = GROUPING SETS ((a, b), (a), ())", { mono: true, size: 12.5, fill: C.dim });
      b += t(240, 310, "CUBE(a, b) = GROUPING SETS ((a, b), (a), (b), ())", { mono: true, size: 12.5, fill: C.dim });
      return svg(480, 326, b, "ROLLUP adds subtotal and grand-total rows with NULL in rolled-up columns");
    },
    caption: "Plain rows are details; blue rows are region subtotals; the green row is the grand total. NULL means \"all\" here.",
    oneline: "GROUPING SETS, ROLLUP and CUBE work out details, subtotals and grand totals in one pass over the data.",
  };

  /* ---------------------------------------------------------------- sql-analytics-funcs */
  const DAILY = [20, 35, 10, 40, 25, 50, 30, 45];
  P["sql-analytics-funcs"] = {
    simple: [
      "These are the window tricks people use every day at work.",
      "`LAG` peeks at the row before and `LEAD` peeks at the row after. That makes \"how much did sales change since yesterday?\" a one-liner.",
      "A **frame** like `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` says how far back each row looks. That gives running totals and moving averages. `ROW_NUMBER()` then helps you keep just the newest copy of each duplicated record.",
    ],
    analogy: {
      text: "Think of a train of carriages, each carrying one day's sales.",
      left: "On the train", right: "In SQL",
      map: [
        ["The carriages in order", "`OVER (ORDER BY day)`"],
        ["Look back into the carriage behind you", "`LAG(sales)`"],
        ["Look into the carriage in front", "`LEAD(sales)`"],
        ["Count everything from the engine back to you", "Running total: `SUM(sales) OVER (ORDER BY day)`"],
        ["Look at only your carriage and the 2 behind", "`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`"],
        ["The first carriage has nobody behind it", "`LAG` returns `NULL` unless you give a default"],
      ],
      breaks: "carriages never tie, but rows can. With only ORDER BY, the default frame is RANGE, which counts tied rows together. Write ROWS explicitly when you mean \"exactly N rows\".",
    },
    svg: () => {
      let b = t(240, 24, "Each row looks at its neighbours", { bold: true, size: 14 });
      DAILY.slice(0, 6).forEach((v, i) => {
        const x = 18 + i * 76, cur = i === 3;
        b += box(x, 44, 68, 50, "day " + (i + 1), String(v), cur ? "warn" : (i >= 1 && i <= 2) ? "acc" : "plain", { size: 13.5, size2: 14 });
      });
      b += arrow(246, 104, 200, 104, { stroke: C.vioS }) + t(222, 124, "LAG", { size: 12.5, fill: C.vioT, bold: true });
      b += arrow(286, 104, 330, 104, { stroke: C.vioS }) + t(308, 124, "LEAD", { size: 12.5, fill: C.vioT, bold: true });
      b += `<rect x="90" y="38" width="226" height="62" rx="10" style="fill:none;stroke:${C.accS};stroke-width:2;stroke-dasharray:6 4"/>`;
      b += t(240, 150, "Frame for day 4: ROWS BETWEEN 2 PRECEDING AND CURRENT ROW", { size: 12, mono: true, fill: C.accT });
      b += table(40, 172, ["day", "sales", "LAG", "running", "avg 3"], DAILY.slice(0, 4).map((v, i) => {
        const run = DAILY.slice(0, i + 1).reduce((a, c) => a + c, 0), w = DAILY.slice(Math.max(0, i - 2), i + 1);
        return [String(i + 1), String(v), i ? String(DAILY[i - 1]) : null, String(run), (w.reduce((a, c) => a + c, 0) / w.length).toFixed(1)];
      }), { cw: [60, 80, 70, 100, 90], rh: 28, hl: { 3: "warn" } });
      return svg(480, 330, b, "LAG and LEAD read neighbouring rows; a frame sets how many rows an aggregate covers");
    },
    caption: "Day 4 (yellow) reads day 3 with LAG and day 5 with LEAD. Its 3-row average covers days 2-4.",
    ix: el => {
      slider(el, { label: "Moving-average window (rows):", min: 1, max: 5, value: 3 }, n => {
        const avg = DAILY.map((v, i) => { const w = DAILY.slice(Math.max(0, i - n + 1), i + 1); return w.reduce((a, c) => a + c, 0) / w.length; });
        const X = i => 50 + i * 56, Y = v => 196 - v * 3;
        let b = t(240, 22, `AVG(sales) OVER (ORDER BY day ROWS BETWEEN ${n - 1} PRECEDING AND CURRENT ROW)`, { mono: true, size: 10.5, fill: C.tx });
        b += line(36, 196, 456, 196, { stroke: "#3b4760" }) + line(36, 40, 36, 196, { stroke: "#3b4760" });
        [0, 25, 50].forEach(v => { b += t(30, Y(v) + 4, String(v), { a: "end", size: 11, fill: C.faint }); });
        DAILY.forEach((v, i) => { b += `<rect x="${X(i) - 14}" y="${Y(v)}" width="28" height="${v * 3}" rx="3" style="fill:#2b3446;stroke:${C.boxS}"/>`; b += t(X(i), 214, "d" + (i + 1), { size: 11, fill: C.dim }); });
        b += `<polyline points="${avg.map((v, i) => `${X(i)},${Y(v).toFixed(1)}`).join(" ")}" style="fill:none;stroke:${C.warnS};stroke-width:3"/>`;
        avg.forEach((v, i) => { b += `<circle cx="${X(i)}" cy="${Y(v).toFixed(1)}" r="4" style="fill:${C.warnS}"/>`; });
        b += box(300, 228, 14, 14, null, null, "plain", { r: 3 }) + t(320, 240, "daily sales", { a: "start", size: 12, fill: C.dim });
        b += `<rect x="60" y="233" width="22" height="4" style="fill:${C.warnS}"/>` + t(88, 240, "moving average", { a: "start", size: 12, fill: C.dim });
        const swing = Math.max(...avg.slice(n - 1)) - Math.min(...avg.slice(n - 1));
        return { svg: svg(480, 254, b, "Moving average with a window of " + n + " rows"), note: n === 1 ? "A 1-row window is just the raw value, so the line follows every bar." : `A ${n}-row window smooths the line: from day ${n} on, the average swings by <b>${swing.toFixed(1)}</b> instead of 40. The first ${n - 1} day(s) average fewer rows, because nothing comes before them.` };
      });
    },
    oneline: "LAG and LEAD peek at the neighbour rows, and a frame decides how many rows a running total or average covers.",
  };

  /* ---------------------------------------------------------------- sql-case */
  P["sql-case"] = {
    simple: [
      "`CASE` is how SQL says \"if this, then that, otherwise something else\".",
      "It checks its `WHEN` rules from top to bottom and uses the **first** one that is true. If none is true, it uses `ELSE`, or `NULL` if you left `ELSE` out.",
      "You can put `CASE` anywhere a value goes: to label rows, to sort in a custom order, or inside `SUM` to count only some rows.",
    ],
    analogy: {
      text: "Think of a ticket counter at a zoo that prices tickets by age.",
      left: "At the zoo", right: "In SQL",
      map: [
        ["\"Under 3? Free.\"", "`WHEN age < 3 THEN 0`"],
        ["\"Otherwise, under 12? Child price.\"", "`WHEN age < 12 THEN 5`"],
        ["\"Everyone else pays full price.\"", "`ELSE 10`"],
        ["The clerk stops at the first rule that fits", "The first true `WHEN` wins"],
        ["Counting child tickets sold today", "`SUM(CASE WHEN age < 12 THEN 1 ELSE 0 END)`"],
      ],
      breaks: "the clerk knows a missing age means \"ask again\". In SQL, `NULL < 3` is unknown, so no WHEN matches and the row falls through to ELSE (or NULL).",
    },
    svg: () => {
      let b = t(240, 24, "Each row walks down the rules and stops at the first TRUE", { size: 13, fill: C.tx });
      const rules = [["WHEN price >= 500", "'premium'"], ["WHEN price >= 100", "'mid'"], ["ELSE", "'budget'"]];
      rules.forEach(([w, v], i) => {
        const y = 48 + i * 70;
        b += box(150, y, 180, 44, w, null, i === 2 ? "plain" : "warn", { mono: true, size: 13.5 });
        b += arrow(332, y + 22, 370, y + 22, { label: "yes", dy: -6 });
        b += box(374, y + 4, 92, 36, v, null, "good", { mono: true, size: 13.5 });
        if (i < 2) b += arrow(240, y + 44, 240, y + 68, { label: "no", dx: 16, dy: 4 });
      });
      [["Lamp", "650", 70], ["Mug", "120", 140], ["Pen", "3", 210]].forEach(([n, p, y]) => {
        b += box(14, y, 104, 40, n, "price " + p, "acc", { size: 14, size2: 12.5 });
        b += arrow(120, y + 20, 148, 62, { stroke: C.accS, sw: 1.4 });
      });
      b += t(240, 280, "Lamp stops at rule 1, Mug at rule 2, Pen falls to ELSE.", { size: 12.5, fill: C.dim });
      b += t(240, 300, "Order matters: put the strictest rule first.", { size: 12.5, fill: C.dim });
      return svg(480, 316, b, "CASE tests WHEN conditions top to bottom and returns the first match");
    },
    caption: "A CASE is a ladder of rules. Each row climbs down until one fits.",
    oneline: "CASE is SQL's if-then-else: it tries the rules in order and gives the answer of the first one that fits.",
  };

  /* ---------------------------------------------------------------- sql-pivot */
  P["sql-pivot"] = {
    simple: [
      "Data can be **long** (one row per customer per status) or **wide** (one row per customer, one column per status).",
      "**Pivoting** turns long into wide: the values in a column become new column headings. **Unpivoting** turns wide back into long.",
      "The trick that works in every database is `SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END)`, one line per new column.",
    ],
    analogy: {
      text: "Think of a class register of homework handed in.",
      left: "The register", right: "In SQL",
      map: [
        ["A diary: one line each time a kid hands something in", "Long table: one row per event"],
        ["A grid: kids down the side, weekdays across the top", "Wide table after a pivot"],
        ["Counting a kid's ticks under \"Monday\"", "`SUM(CASE WHEN day='Mon' THEN 1 ELSE 0 END) AS mon`"],
        ["Copying the grid back into diary lines", "Unpivot: `UNION ALL` or `UNPIVOT` / `LATERAL`"],
      ],
      breaks: "a teacher can add a Saturday column whenever. In SQL the pivot columns are written into the query, so a new status needs a code change (or dynamic SQL).",
    },
    svg: () => {
      const long = [["1", "shipped"], ["1", "shipped"], ["1", "cancelled"], ["2", "shipped"], ["2", "delivered"]];
      let b = table(20, 44, ["cust", "status"], long, { cw: [60, 110], title: "long: one row per order", rh: 30 });
      b += arrow(196, 120, 240, 120, { label: "pivot", stroke: C.goodS, lfill: C.goodT });
      b += table(250, 74, ["cust", "shipped", "deliv.", "cancel."], [["1", "2", "0", "1"], ["2", "1", "1", "0"]], { cw: [50, 64, 56, 58], title: "wide: one row per customer", rh: 30, hl: { 0: "good", 1: "good" } });
      b += arrow(364, 176, 364, 214, { label: "unpivot", dx: 32, dy: 4, stroke: C.accS, lfill: C.accT });
      b += box(20, 230, 440, 70, "SUM(CASE WHEN status='shipped' THEN 1 ELSE 0 END) AS shipped", "one expression per new column, then GROUP BY cust", "warn", { mono: true, size: 11.5, size2: 12.5 });
      return svg(480, 316, b, "Pivot turns status values into columns using conditional aggregation");
    },
    caption: "Five long rows become two wide rows. Each CASE inside SUM fills one new column.",
    oneline: "Pivoting turns row values into column headings, and unpivoting turns them back into rows.",
  };
})();
