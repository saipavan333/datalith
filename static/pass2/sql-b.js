/* Datalith pass 2 — Track 4 (SQL), part B: sorting, filtering, grouping, joins, set operations. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- sql-sorting-limiting */
  const PRICES = [42, 17, 88, 5, 63, 29, 71, 12, 95, 34, 50, 8, 77, 21, 60];
  P["sql-sorting-limiting"] = {
    simple: [
      "A table has **no built-in order**. If you want rows in an order, you must ask with `ORDER BY`.",
      "`LIMIT 3` then keeps only the first 3 rows. Together they answer \"top 3\" questions, like the 3 most expensive products.",
      "`OFFSET` skips rows, which is how websites show page 2, page 3 and so on. On deep pages that gets slow, because the database still reads every row it skips.",
    ],
    analogy: {
      text: "Think of a class lining up for a photo by height.",
      left: "The photo line", right: "In SQL",
      map: [
        ["Kids standing anywhere in the yard", "Rows with no order (no `ORDER BY`)"],
        ["\"Line up, tallest first\"", "`ORDER BY height DESC`"],
        ["Same height? Then by name", "A second sort key: `ORDER BY height DESC, name`"],
        ["Only the first 3 go in the front row", "`LIMIT 3`"],
        ["Skip the first 6 to find row three of the photo", "`LIMIT 3 OFFSET 6`"],
        ["\"Everyone shorter than Ravi, come forward\"", "Keyset paging: `WHERE height < :last ORDER BY height DESC LIMIT 3`"],
      ],
      breaks: "kids can see each other, so they find their spot fast. A database with no index has to read and sort every row before it can hand you the first three.",
    },
    svg: () => {
      let b = t(120, 28, "Rows as stored (any order)", { bold: true, size: 14 }) + t(326, 28, "ORDER BY price DESC", { bold: true, size: 14 });
      const raw = [42, 17, 88, 5, 63, 29, 71];
      raw.forEach((v, i) => { b += box(50, 42 + i * 34, 140, 28, "price " + v, null, "plain", { mono: true, size: 14 }); });
      const sorted = [...raw].sort((a, b) => b - a);
      sorted.forEach((v, i) => {
        const k = i < 3 ? "good" : i < 6 ? "acc" : "plain";
        b += box(256, 42 + i * 34, 140, 28, "price " + v, null, k, { mono: true, size: 14 });
      });
      b += arrow(196, 160, 250, 160, { label: "sort", stroke: C.line });
      b += `<rect x="250" y="38" width="152" height="100" rx="10" style="fill:none;stroke:${C.goodS};stroke-width:2;stroke-dasharray:6 4"/>`;
      b += t(410, 92, "LIMIT 3", { a: "start", size: 12.5, fill: C.goodT, bold: true });
      b += t(410, 194, "page 2", { a: "start", size: 12.5, fill: C.accT, bold: true });
      b += t(240, 300, "LIMIT 3 OFFSET 3 = page 2 (the blue rows).", { size: 13.5, fill: C.tx });
      b += t(240, 320, "The database still sorted and read the 3 rows it skipped.", { size: 12.5, fill: C.dim });
      return svg(480, 336, b, "ORDER BY sorts all rows, LIMIT takes the top, OFFSET skips to later pages");
    },
    caption: "Sort first, then cut. LIMIT keeps the green rows; OFFSET 3 jumps to the blue ones.",
    ix: el => {
      slider(el, { label: "Page number (3 rows per page):", min: 1, max: 5, value: 1 }, p => {
        const sorted = [...PRICES].sort((a, b) => b - a), off = (p - 1) * 3;
        let b = t(240, 24, `ORDER BY price DESC LIMIT 3 OFFSET ${off}`, { mono: true, size: 13, fill: C.tx });
        sorted.forEach((v, i) => {
          const col = i % 5, row = Math.floor(i / 5), x = 30 + col * 86, y = 44 + row * 44;
          const k = i < off ? "bad" : i < off + 3 ? "good" : "plain";
          b += box(x, y, 76, 34, String(v), null, k, { mono: true, size: 14 });
        });
        b += box(30, 186, 14, 14, null, null, "bad", { r: 3 }) + t(52, 198, "read, then thrown away", { a: "start", size: 12.5, fill: C.dim });
        b += box(250, 186, 14, 14, null, null, "good", { r: 3 }) + t(272, 198, "returned to you", { a: "start", size: 12.5, fill: C.dim });
        return { svg: svg(480, 214, b, "Rows read and returned for page " + p), note: `Page ${p}: the database reads <b>${off + 3}</b> sorted rows to return <b>3</b>. Keyset paging (<code>WHERE price &lt; last_seen</code>) would read about 3, using an index on price.` };
      });
    },
    oneline: "Tables have no order until you ask: ORDER BY lines rows up, LIMIT keeps the front of the line.",
  };

  /* ---------------------------------------------------------------- sql-filtering */
  P["sql-filtering"] = {
    simple: [
      "`WHERE` is a test that every row must pass. Rows that pass stay. Rows that fail are dropped before anything else happens.",
      "You build the test from comparisons (`amount >= 20`), lists (`country IN ('IN','UK')`), ranges (`BETWEEN`) and patterns (`LIKE 'A%'`).",
      "One trap: a missing value (`NULL`) is neither equal nor unequal to anything. A row with `NULL` fails almost every test, so it quietly disappears.",
    ],
    analogy: {
      text: "Think of a sieve over a bowl when you wash rice.",
      left: "The sieve", right: "In SQL",
      map: [
        ["Pour all the grains in", "Rows arrive from `FROM`"],
        ["Holes of a certain size", "The `WHERE` condition"],
        ["Grains that fall through to the bowl", "Rows where the test is TRUE: kept"],
        ["Stones left in the sieve", "Rows where the test is FALSE: dropped"],
        ["A grain stuck in a hole, neither in nor out", "A `NULL` row: the test is UNKNOWN, and it is dropped too"],
      ],
      breaks: "a sieve only sorts by size. A WHERE test can combine many checks with AND, OR and NOT, and AND is checked before OR unless you add brackets.",
    },
    svg: () => {
      const rows = [["Ava", "IN", "40"], ["Ben", "US", "15"], ["Cai", "UK", "30"], ["Dev", null, "60"], ["Eli", "IN", "12"]];
      const verdict = rows.map(r => (r[1] === null ? "UNKNOWN" : (["IN", "UK"].includes(r[1]) && Number(r[2]) >= 20) ? "TRUE" : "FALSE"));
      let b = box(20, 16, 440, 40, "WHERE country IN ('IN','UK') AND amount >= 20", null, "warn", { mono: true, size: 13.5 });
      const hl = {}, strike = {};
      verdict.forEach((v, i) => { hl[i] = v === "TRUE" ? "good" : "bad"; if (v !== "TRUE") strike[i] = true; });
      b += table(20, 92, ["who", "country", "amount"], rows, { cw: [80, 90, 80], title: "orders", rh: 30 });
      verdict.forEach((v, i) => {
        const y = 92 + 30 * (i + 1) + 15;
        b += arrow(258, y, 300, y, { stroke: v === "TRUE" ? C.goodS : C.badS });
        b += box(306, y - 13, 150, 26, v === "TRUE" ? "TRUE: kept" : v === "FALSE" ? "FALSE: dropped" : "UNKNOWN: dropped", null, v === "TRUE" ? "good" : v === "FALSE" ? "bad" : "warn", { size: 13 });
      });
      b += t(240, 300, "Dev's country is NULL, so \"NULL IN ('IN','UK')\" is UNKNOWN.", { size: 12.5, fill: C.dim });
      b += t(240, 318, "WHERE keeps only TRUE, so Dev is gone without any error.", { size: 12.5, fill: C.dim });
      return svg(480, 334, b, "Each row is tested by WHERE and kept only when the result is TRUE");
    },
    caption: "Every row gets one verdict. Only TRUE survives; FALSE and UNKNOWN are both dropped.",
    oneline: "WHERE is a sieve: each row is tested on its own, and only rows that pass with a clear TRUE stay.",
  };

  /* ---------------------------------------------------------------- sql-groupby */
  P["sql-groupby"] = {
    simple: [
      "Sometimes you don't want every row. You want a **summary**: how many orders, the total sales, the average price.",
      "Functions like `COUNT`, `SUM`, `AVG`, `MIN` and `MAX` squash many rows into one number.",
      "`GROUP BY category` first sorts rows into buckets, one bucket per category. Then it squashes each bucket on its own, so you get one summary row per category.",
    ],
    analogy: {
      text: "Think of sorting a pile of coins into jars by type, then counting each jar.",
      left: "Coin jars", right: "In SQL",
      map: [
        ["The pile of coins", "The rows after `WHERE`"],
        ["One jar per coin type", "`GROUP BY coin_type`: one group per value"],
        ["\"How many coins in this jar?\"", "`COUNT(*)`"],
        ["\"How much money in this jar?\"", "`SUM(value)`"],
        ["A label on each jar", "The grouped column in `SELECT`"],
        ["A coin with a worn-off face", "A `NULL` key: all NULLs share one group"],
      ],
      breaks: "jars hold the actual coins, but after GROUP BY the single rows are gone. You can only show the grouped columns and the summaries, not a column from one coin.",
    },
    svg: () => {
      const rows = [["Mug", "Home", "12"], ["Pen", "Office", "3"], ["Lamp", "Home", "30"], ["Clip", "Office", "1"], ["Rug", "Home", "45"], ["Tea", "Food", "6"]];
      const k = { Home: "acc", Office: "vio", Food: "warn" };
      let b = table(16, 44, ["name", "category", "price"], rows, { cw: [64, 84, 60], title: "products", rh: 30, hl: Object.fromEntries(rows.map((r, i) => [i, k[r[1]]])) });
      const G = [["Home", 3, 87], ["Office", 2, 4], ["Food", 1, 6]];
      G.forEach(([g, n, s], i) => {
        const y = 50 + i * 82;
        b += box(296, y, 168, 66, g, `COUNT ${n} · SUM ${s}`, k[g], { size: 15, size2: 13.5 });
      });
      rows.forEach((r, i) => {
        const gi = G.findIndex(g => g[0] === r[1]), y1 = 44 + 30 * (i + 1) + 15, y2 = 50 + gi * 82 + 33;
        b += arrow(228, y1, 290, y2, { stroke: (P2L.KIND[k[r[1]]] || [])[1], sw: 1.4 });
      });
      b += t(240, 300, "6 rows in, 3 rows out: one per category.", { size: 13.5, fill: C.tx });
      b += t(240, 320, "SELECT category, COUNT(*), SUM(price) ... GROUP BY category", { size: 12, fill: C.dim, mono: true });
      return svg(480, 336, b, "GROUP BY routes rows into buckets and computes one summary per bucket");
    },
    caption: "Each row travels to its category's bucket. Each bucket becomes one output row.",
    oneline: "GROUP BY sorts rows into buckets, and COUNT, SUM or AVG turn each bucket into one row.",
  };

  /* ---------------------------------------------------------------- sql-aggregates-having */
  P["sql-aggregates-having"] = {
    simple: [
      "`WHERE` and `HAVING` both throw things away. The difference is **what** they throw away and **when**.",
      "`WHERE` checks single rows, before any grouping. `HAVING` checks whole groups, after the totals are worked out.",
      "So \"customers with more than 2 orders\" needs `HAVING COUNT(*) > 2`. `WHERE` can't do it, because when `WHERE` runs, nobody has counted yet.",
    ],
    analogy: {
      text: "Think of choosing which school teams go to a tournament.",
      left: "The tournament", right: "In SQL",
      map: [
        ["Only students with a signed form may play", "`WHERE form_signed`: a rule per student (row)"],
        ["Students join their class team", "`GROUP BY class`"],
        ["Count each team's players", "`COUNT(*)` per group"],
        ["Only teams with at least 5 players go", "`HAVING COUNT(*) >= 5`: a rule per team (group)"],
      ],
      breaks: "in real life you could check team sizes first. In SQL the order is fixed: WHERE, then GROUP BY, then HAVING. A rule on a plain column can also go in HAVING, but it belongs in WHERE: it reads clearer and lets the database drop rows before the grouping work.",
    },
    svg: () => {
      let b = "";
      const st = [
        ["12 order rows", "from orders", "plain"],
        ["WHERE status <> 'cancelled'", "row by row: 12 → 9 rows", "warn"],
        ["GROUP BY customer_id", "9 rows → 4 groups", "acc"],
        ["HAVING COUNT(*) >= 3", "group by group: 4 → 2 groups", "vio"],
        ["2 result rows", "the loyal customers", "good"],
      ];
      st.forEach(([a, s, k], i) => {
        const y = 18 + i * 66;
        b += box(70, y, 340, 50, a, s, k, { mono: i > 0 && i < 4, size: 14.5, size2: 13 });
        if (i < 4) b += arrow(240, y + 50, 240, y + 64);
      });
      b += t(28, 128, "rows", { size: 12.5, fill: C.warnT, bold: true, a: "start" });
      b += t(28, 260, "groups", { size: 12.5, fill: C.vioT, bold: true, a: "start" });
      b += t(240, 362, "WHERE can't use COUNT(*): the groups don't exist yet.", { size: 12.5, fill: C.dim });
      return svg(480, 378, b, "WHERE filters rows before grouping; HAVING filters groups after aggregation");
    },
    caption: "Two filters at two moments. WHERE trims rows on the way in; HAVING trims groups on the way out.",
    oneline: "WHERE throws out rows before the counting, HAVING throws out groups after the counting.",
  };

  /* ---------------------------------------------------------------- sql-joins */
  P["sql-joins"] = {
    simple: [
      "Good databases store each fact once. Customers sit in one table, their orders in another. That avoids copying a name onto every order.",
      "To answer \"who placed this order?\" you **join** the tables back together. The join matches rows where a shared column is equal, like `orders.customer_id = customers.customer_id`.",
      "Watch out: if one customer has 3 orders, that customer appears 3 times in the result. Sums over customer columns then count them 3 times.",
    ],
    analogy: {
      text: "Think of matching lost luggage to passengers using the tag number.",
      left: "At the airport", right: "In SQL",
      map: [
        ["The passenger list", "`customers` (one row per customer)"],
        ["The pile of bags", "`orders` (many rows per customer)"],
        ["The number on the tag and on the ticket", "The join key `customer_id`"],
        ["Pairing each bag with its owner", "`JOIN ... ON o.customer_id = c.customer_id`"],
        ["A passenger with 3 bags appears on 3 claim slips", "Fan-out: one customer row repeated per order"],
      ],
      breaks: "a bag goes to one owner, but SQL joins any rows whose keys match. If the key isn't unique on the \"one\" side, rows multiply in ways the airport never would.",
    },
    svg: () => {
      let b = table(20, 44, ["customer_id", "name"], [["1", "Ava"], ["2", "Ben"], ["3", "Cai"]], { cw: [96, 70], title: "customers", rh: 30 });
      b += table(300, 44, ["order_id", "customer_id"], [["101", "1"], ["102", "1"], ["103", "3"], ["104", "1"]], { cw: [76, 96], title: "orders", rh: 30 });
      const cy = i => 44 + 30 * (i + 1) + 15;
      [[0, 0], [0, 1], [2, 2], [0, 3]].forEach(([c, o]) => { b += line(186, cy(c), 300, cy(o), { stroke: C.accS, sw: 1.6 }); });
      b += arrow(240, 206, 240, 236, { label: "JOIN ON customer_id", dx: 0, dy: -4 });
      b += table(110, 262, ["order_id", "name"], [["101", "Ava"], ["102", "Ava"], ["103", "Cai"], ["104", "Ava"]], { cw: [120, 140], title: "", rh: 30, hl: { 0: "warn", 1: "warn", 3: "warn" } });
      b += t(240, 428, "Ava shows up 3 times (one per order). Ben has no orders, so he is gone.", { size: 12.5, fill: C.dim });
      return svg(480, 444, b, "JOIN matches rows on equal keys; one customer with many orders appears many times");
    },
    caption: "Lines are matching keys. Each line becomes one result row, so Ava's 3 orders make 3 rows.",
    oneline: "A join glues two tables together wherever their key columns match, one result row per match.",
  };

  /* ---------------------------------------------------------------- sql-join-types */
  const CU = [["1", "Ava"], ["2", "Ben"], ["3", "Cai"]];
  const OR = [["101", "1"], ["102", "3"], ["103", "9"]];
  function joinRows(kind) {
    const out = [];
    const match = (c, o) => c[0] === o[1];
    if (kind === "CROSS") { CU.forEach(c => OR.forEach(o => out.push([c[1], o[0], "x"]))); return out; }
    CU.forEach(c => {
      const ms = OR.filter(o => match(c, o));
      if (kind === "ANTI") { if (!ms.length) out.push([c[1], null, "a"]); return; }
      if (kind === "SEMI") { if (ms.length) out.push([c[1], null, "s"]); return; }
      ms.forEach(o => out.push([c[1], o[0], "m"]));
      if (!ms.length && (kind === "LEFT" || kind === "FULL")) out.push([c[1], null, "l"]);
    });
    if (kind === "RIGHT" || kind === "FULL") OR.forEach(o => { if (!CU.some(c => match(c, o))) out.push([null, o[0], "r"]); });
    if (kind === "RIGHT") return out.filter(r => r[2] !== "l");
    return out;
  }
  P["sql-join-types"] = {
    simple: [
      "Every join pairs up rows whose keys match. The join **type** decides what happens to rows that find **no partner**.",
      "`INNER JOIN` drops them. `LEFT JOIN` keeps every row from the left table and fills the missing side with `NULL`. `RIGHT` is the mirror, and `FULL` keeps the leftovers from both sides.",
      "Two handy patterns: a **semi-join** (`EXISTS`) asks \"has at least one match?\", and an **anti-join** (`NOT EXISTS`) asks \"has no match at all?\".",
    ],
    analogy: {
      text: "Think of a school dance where students from two classes pair up by a shared number.",
      left: "At the dance", right: "In SQL",
      map: [
        ["Only pairs go on the floor", "`INNER JOIN`"],
        ["All of class A goes in; anyone without a partner dances alone", "`LEFT JOIN` (partner columns are NULL)"],
        ["Everyone from both classes goes in", "`FULL OUTER JOIN`"],
        ["Every A student dances once with every B student", "`CROSS JOIN` (3 × 3 = 9 rows)"],
        ["List the A students who have a partner", "Semi-join: `WHERE EXISTS (...)`"],
        ["List the A students left without a partner", "Anti-join: `WHERE NOT EXISTS (...)`"],
      ],
      breaks: "a dancer has one partner, but a SQL row can match many rows. Then it appears once per match (fan-out), unless you use EXISTS, which stops at the first match.",
    },
    svg: () => {
      let b = table(30, 44, ["id", "name"], CU, { cw: [60, 90], title: "customers (left)", rh: 30 });
      b += table(290, 44, ["order_id", "cust_id"], OR, { cw: [80, 80], title: "orders (right)", rh: 30 });
      const y = i => 44 + 30 * (i + 1) + 15;
      b += line(180, y(0), 290, y(0), { stroke: C.goodS, sw: 2 }) + line(180, y(2), 290, y(1), { stroke: C.goodS, sw: 2 });
      b += t(240, 184, "Ben (id 2) has no order", { size: 12.5, fill: C.warnT });
      b += t(240, 202, "order 103 points at customer 9, who doesn't exist", { size: 12.5, fill: C.warnT });
      const R = [["INNER", "2 rows", "Ava-101, Cai-102"], ["LEFT", "3 rows", "+ Ben with NULL order"], ["RIGHT", "3 rows", "+ NULL customer for 103"], ["FULL", "4 rows", "+ both leftovers"], ["ANTI (NOT EXISTS)", "1 row", "Ben only"]];
      R.forEach(([k, n, d], i) => {
        const yy = 222 + i * 36;
        b += box(30, yy, 150, 30, k, null, i === 0 ? "good" : i === 4 ? "bad" : "acc", { mono: true, size: 13.5 });
        b += t(194, yy + 20, n, { a: "start", size: 13.5, bold: true });
        b += t(258, yy + 20, d, { a: "start", size: 12.5, fill: C.dim });
      });
      return svg(480, 412, b, "The same two tables give different results for each join type");
    },
    caption: "Green lines are matches. Each join type keeps the matches and decides what to do with Ben and order 103.",
    ix: el => {
      const kinds = ["INNER", "LEFT", "RIGHT", "FULL", "CROSS", "SEMI", "ANTI"];
      const sql = { INNER: "c JOIN o ON o.cust_id = c.id", LEFT: "c LEFT JOIN o ON o.cust_id = c.id", RIGHT: "c RIGHT JOIN o ON o.cust_id = c.id", FULL: "c FULL JOIN o ON o.cust_id = c.id", CROSS: "c CROSS JOIN o", SEMI: "c WHERE EXISTS (match in o)", ANTI: "c WHERE NOT EXISTS (match in o)" };
      choice(el, { label: "Join type:", options: kinds, value: 0 }, i => {
        const k = kinds[i], rows = joinRows(k);
        const hl = {}; rows.forEach((r, j) => { hl[j] = r[2] === "m" ? "good" : r[2] === "x" ? "acc" : r[2] === "s" ? "good" : "warn"; });
        const cols = (k === "SEMI" || k === "ANTI") ? ["customer"] : ["customer", "order_id"];
        const data = rows.map(r => (k === "SEMI" || k === "ANTI") ? [r[0]] : [r[0], r[1]]);
        let b = t(240, 24, "SELECT ... FROM " + sql[k], { mono: true, size: 12.5, fill: C.tx });
        b += table(cols.length === 1 ? 170 : 120, 58, cols, data, { cw: cols.length === 1 ? [140] : [120, 120], rh: 26, hl, title: `${rows.length} row${rows.length === 1 ? "" : "s"}` });
        const H = 58 + 26 * (rows.length + 1) + 16;
        const notes = {
          INNER: "Only matched pairs. Ben and order 103 both vanish.",
          LEFT: "Every customer stays. Ben gets <b>NULL</b> for order_id (yellow).",
          RIGHT: "Every order stays. Order 103 gets <b>NULL</b> for customer.",
          FULL: "Matches plus the leftovers from both sides.",
          CROSS: "No key at all: every customer with every order, 3 × 3 = <b>9</b> rows.",
          SEMI: "Customers with at least one order, each listed <b>once</b> even with many orders.",
          ANTI: "Customers with no order. Same answer as LEFT JOIN ... WHERE o.order_id IS NULL.",
        };
        return { svg: svg(480, Math.max(H, 150), b, k + " join result"), note: notes[k] };
      });
    },
    oneline: "All joins pair matching rows; the join type only decides who gets to stay without a partner.",
  };

  /* ---------------------------------------------------------------- sql-set-ops */
  P["sql-set-ops"] = {
    simple: [
      "A join puts tables **side by side**, adding columns. Set operations stack two results **on top of each other**, adding rows.",
      "`UNION ALL` just stacks them. `UNION` stacks and then removes duplicate rows. `INTERSECT` keeps rows found in both. `EXCEPT` keeps rows in the first but not the second.",
      "Both queries must return the same number of columns, with types that fit together.",
    ],
    analogy: {
      text: "Think of two friends' sticker collections.",
      left: "The stickers", right: "In SQL",
      map: [
        ["Pour both albums into one box", "`UNION ALL` (duplicates stay)"],
        ["Then keep one of each design", "`UNION` (an extra dedup step)"],
        ["Designs both friends own", "`INTERSECT`"],
        ["Designs only the first friend owns", "`EXCEPT` (order matters)"],
        ["Both albums must use the same page layout", "Same number of columns, matching types"],
      ],
      breaks: "you can spot matching stickers at a glance. A database removes duplicates by sorting or hashing every row, which costs real time on big tables. That is why UNION ALL is the default choice.",
    },
    svg: () => {
      const A = ["Ava", "Ben", "Cai"], B = ["Ben", "Cai", "Dev"];
      let b = table(40, 44, ["2024"], A.map(x => [x]), { cw: [120], rh: 28, title: "customers_2024" });
      b += table(320, 44, ["2025"], B.map(x => [x]), { cw: [120], rh: 28, title: "customers_2025" });
      const R = [["UNION ALL", [...A, ...B], "acc"], ["UNION", ["Ava", "Ben", "Cai", "Dev"], "good"], ["INTERSECT", ["Ben", "Cai"], "vio"], ["EXCEPT", ["Ava"], "warn"]];
      R.forEach(([k, rows, kind], i) => {
        const x = 12 + i * 116;
        b += box(x, 180, 106, 30, k, null, kind, { mono: true, size: 13 });
        rows.forEach((r, j) => { b += box(x + 8, 218 + j * 24, 90, 20, r, null, "plain", { size: 12.5, bold: false, r: 4 }); });
        b += t(x + 53, 218 + rows.length * 24 + 16, rows.length + " rows", { size: 12, fill: C.dim });
      });
      b += arrow(100, 160, 100, 176) + arrow(380, 160, 380, 176);
      b += line(100, 166, 380, 166, { stroke: C.line });
      return svg(480, 400, b, "UNION ALL, UNION, INTERSECT and EXCEPT applied to the same two lists");
    },
    caption: "Same two lists, four answers. UNION ALL keeps all 6 rows; EXCEPT (2024 minus 2025) keeps only Ava.",
    oneline: "Set operations stack two answers into one list, and you choose whether to keep, remove, or compare the repeats.",
  };
})();
