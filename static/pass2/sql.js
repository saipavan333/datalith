/* Datalith pass 2 — Track 4: Databases & SQL. Plain-English openings, analogies, mechanism
   diagrams and interactives. Rendered by static/pass2/p2lib.js (see the header there). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- sql-relational */
  const ORD = [
    { id: 1, who: "Ava", country: "IN", amount: 40 }, { id: 2, who: "Ben", country: "US", amount: 15 },
    { id: 3, who: "Cai", country: "IN", amount: 30 }, { id: 4, who: "Dev", country: "UK", amount: 60 },
    { id: 5, who: "Eli", country: "US", amount: 25 }, { id: 6, who: "Fay", country: "IN", amount: 10 },
    { id: 7, who: "Gus", country: "UK", amount: 20 }, { id: 8, who: "Hal", country: "US", amount: 35 },
  ];
  P["sql-relational"] = {
    simple: [
      "A database keeps information in **tables**, like a grid in a spreadsheet. Each **row** is one thing (one customer, one order). Each **column** is one fact about it (a name, a price).",
      "A **key** is a column that tells rows apart, like a roll number in a class. Keys also link tables together.",
      "You ask questions with **SQL** (Structured Query Language). You write the clauses in one order, but the database reads them in a different order. Knowing that reading order explains most \"why doesn't my query work?\" puzzles.",
    ],
    analogy: {
      text: "Think of a query as a kitchen order for a fruit salad. The cook does the steps in a fixed order, no matter how you wrote the note.",
      left: "In the kitchen", right: "In SQL",
      map: [
        ["Fetch the crate of fruit", "`FROM` / `JOIN`: get the rows"],
        ["Throw out the bruised fruit", "`WHERE`: drop rows you don't want"],
        ["Sort the fruit into bowls by kind", "`GROUP BY`: one group per value"],
        ["Keep only bowls with enough fruit", "`HAVING`: drop whole groups"],
        ["Write the label on each bowl", "`SELECT`: pick and compute output columns"],
        ["Line the bowls up, biggest first", "`ORDER BY`: sort the result"],
        ["Carry the first two to the table", "`LIMIT`: keep the first N rows"],
      ],
      breaks: "a real database may do the work in a cleverer physical order (the optimizer reorders and skips steps). It only promises the same answer as this logical order. The order explains meaning, not speed.",
    },
    svg: () => {
      const W = ["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT"];
      const R = ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY", "LIMIT"];
      let b = t(99, 30, "How you WRITE it", { bold: true, size: 15 }) + t(375, 30, "How it RUNS", { bold: true, size: 15 });
      W.forEach((c, i) => { b += box(24, 46 + i * 46, 150, 36, c, null, "plain", { mono: true, size: 15 }); });
      R.forEach((c, i) => { const k = c === "SELECT" ? "warn" : "acc"; b += box(306, 46 + i * 46, 150, 36, c, null, k, { mono: true, size: 15 }) + badge(288, 64 + i * 46, i + 1, k); });
      W.forEach((c, i) => {
        const j = R.indexOf(c), y1 = 64 + i * 46, y2 = 64 + j * 46, sel = c === "SELECT";
        b += arrow(176, y1, 272, y2, { stroke: sel ? C.warnS : C.line, sw: sel ? 2.4 : 1.4 });
      });
      b += t(240, 386, "SELECT is written first but runs 5th.", { size: 14, fill: C.tx });
      b += t(240, 406, "That is why WHERE can't use a SELECT alias.", { size: 13, fill: C.dim });
      return svg(480, 420, b, "Written order of SQL clauses versus the logical order the database evaluates them");
    },
    caption: "Same clauses, two orders. The arrows show where each written clause really runs.",
    ix: el => {
      const steps = ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY", "LIMIT"];
      choice(el, { label: "Run the query up to:", options: steps, value: 0 }, i => {
                let rows = ORD.map(r => ({ ...r, keep: true })), note = "";
        let groups = null;
        const kept = rows.filter(r => r.amount >= 20);
        const g = {}; kept.forEach(r => { (g[r.country] = g[r.country] || { country: r.country, total: 0, n: 0 }); g[r.country].total += r.amount; g[r.country].n++; });
        let G = Object.values(g);
        let body = "", H = 0;
        const head = t(240, 22, "SELECT country, SUM(amount) AS total", { size: 12, mono: true, fill: C.dim }) + t(240, 38, "FROM orders WHERE amount >= 20 GROUP BY country", { size: 12, mono: true, fill: C.dim }) + t(240, 54, "HAVING SUM(amount) > 65 ORDER BY total DESC LIMIT 1", { size: 12, mono: true, fill: C.dim });
        if (i <= 1) {
          const hl = {}, strike = {};
          ORD.forEach((r, k) => { if (i === 1 && r.amount < 20) { hl[k] = "bad"; strike[k] = true; } });
          body = table(50, 90, ["id", "who", "country", "amount"], ORD.map(r => [String(r.id), r.who, r.country, String(r.amount)]), { cw: [60, 100, 100, 80], hl, strike, rh: 25, title: i === 0 ? "FROM orders: all 8 rows" : "WHERE amount >= 20: 2 rows dropped" });
          H = 90 + 25 * 9 + 16;
          note = i === 0 ? "Step 1 gets every row of <b>orders</b>." : "Step 2 tests each row on its own. Ben (15) and Fay (10) fail, so they never reach the groups.";
        } else {
          const hl = {}, strike = {};
          let shown = G.map(x => ({ ...x }));
          if (i >= 3) G.forEach((x, k) => { if (x.total <= 65) { hl[k] = "bad"; strike[k] = true; } });
          let cols = ["country", "rows in group", "SUM(amount)"], data = shown.map(x => [x.country, String(x.n), String(x.total)]), cw = [110, 130, 140];
          let title = "GROUP BY country: 6 rows become 3 groups";
          note = "Step 3 puts rows with the same country in one bucket and adds up each bucket.";
          if (i === 3) { title = "HAVING SUM(amount) > 65: US (60) dropped"; note = "Step 4 judges whole groups. WHERE couldn't do this: the sums didn't exist yet."; }
          if (i >= 4) {
            const live = G.filter(x => x.total > 65);
            let out = live.map(x => [x.country, String(x.total)]);
            if (i >= 5) out.sort((a, b) => Number(b[1]) - Number(a[1]));
            const hl2 = {}, st2 = {};
            if (i === 6) out.forEach((r, k) => { if (k >= 1) { hl2[k] = "bad"; st2[k] = true; } else hl2[k] = "good"; });
            cols = ["country", "total"]; data = out; cw = [150, 150];
            title = i === 4 ? "SELECT country, SUM(amount) AS total" : i === 5 ? "ORDER BY total DESC" : "LIMIT 1: the final answer";
            note = i === 4 ? "Step 5 builds the output columns. Only now does the alias <b>total</b> exist." : i === 5 ? "Step 6 sorts. ORDER BY may use the alias, because SELECT already ran." : "Step 7 keeps the first row. The answer is <b>UK, 80</b>.";
            body = table(90, 96, cols, data, { cw, rh: 28, title, hl: hl2, strike: st2 });
          } else body = table(50, 96, cols, data, { cw, rh: 28, title, hl, strike });
          H = 96 + 28 * 4 + 24;
        }
        return { svg: svg(480, Math.max(H, 230), head + body, "Intermediate result after " + steps[i]), note };
      });
    },
    oneline: "A table is a grid of rows and columns, and SQL always runs FROM first and SELECT near the end, whatever order you typed.",
  };

  /* ---------------------------------------------------------------- sql-select */
  P["sql-select"] = {
    simple: [
      "`SELECT` decides **what each answer row looks like**. Other clauses choose *which* rows. `SELECT` chooses *which columns* come out, and can make new ones.",
      "You can do maths (`price * 0.9`), join words together, and give the new column a name with `AS`. `DISTINCT` removes rows that are exact copies of each other.",
      "Nothing in the table changes. `SELECT` only shapes the answer you get back.",
    ],
    analogy: {
      text: "Imagine copying a school register onto a fresh sheet for the sports teacher.",
      left: "Making the copy", right: "In SQL",
      map: [
        ["The full register on the desk", "The table after `FROM` and `WHERE`"],
        ["Copy only the name and height boxes", "List columns: `SELECT name, height`"],
        ["Write a new box: height in feet", "An expression: `height_cm / 30.48`"],
        ["Write \"feet\" on top of that box", "An alias: `AS height_ft`"],
        ["List each class section once", "`SELECT DISTINCT section`"],
      ],
      breaks: "the copy is made fresh every time you ask; nothing is saved unless you store it (for example with `CREATE TABLE AS`). And `DISTINCT` compares whole rows, not one column.",
    },
    svg: () => {
      let b = "";
      const src = [["Mug", "Home", "12.0", "40"], ["Pen", "Office", "2.5", "300"], ["Lamp", "Home", "30.0", "15"]];
      b += table(90, 44, ["name", "category", "price", "stock"], src, { cw: [80, 90, 70, 60], title: "products (stored in the table)", rh: 28 });
      b += `<rect x="90" y="44" width="80" height="112" rx="3" style="fill:none;stroke:${C.goodS};stroke-width:2.6"/>`;
      b += `<rect x="260" y="44" width="70" height="112" rx="3" style="fill:none;stroke:${C.goodS};stroke-width:2.6"/>`;
      b += arrow(240, 160, 240, 184);
      b += box(40, 186, 400, 44, "SELECT name, price * 0.9 AS sale_price", null, "warn", { mono: true, size: 14.5 });
      b += arrow(240, 232, 240, 262);
      b += table(130, 284, ["name", "sale_price"], [["Mug", "10.8"], ["Pen", "2.25"], ["Lamp", "27.0"]], { cw: [100, 120], title: "result (a new shape)", rh: 28, hl: { 0: "acc", 1: "acc", 2: "acc" } });
      b += t(240, 418, "category and stock are left out; price feeds a new column", { size: 12.5, fill: C.dim });
      b += line(20, 436, 460, 436, { stroke: "#2b3446" });
      b += table(40, 480, ["category"], [["Home"], ["Office"], ["Home"]], { cw: [140], title: "SELECT category", rh: 28 });
      b += arrow(190, 538, 290, 538, { label: "DISTINCT", stroke: C.goodS, lfill: C.goodT });
      b += table(300, 480, ["category"], [["Home"], ["Office"]], { cw: [140], title: "SELECT DISTINCT category", rh: 28, hl: { 0: "good", 1: "good" } });
      b += t(240, 618, "Three rows in, two out: the second Home was an exact copy.", { size: 12.5, fill: C.dim });
      return svg(480, 634, b, "SELECT picks and computes columns; DISTINCT removes duplicate rows");
    },
    caption: "Top: SELECT keeps two columns and builds a third. Bottom: DISTINCT turns three rows into two.",
    oneline: "SELECT is the stencil that decides which columns you see and what new ones you make, without touching the table.",
  };
})();
