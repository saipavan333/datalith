/* Datalith pass 2 — Track 3: RDBMS & the Relational Model. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- rdbms-relational-model */
  P["rdbms-relational-model"] = {
    simple: [
      "In 1970 Edgar Codd proposed a simple idea: store all data as **tables**, and nothing else. Every SQL database today is built on it.",
      "The maths words map to everyday ones: a **relation** is a table, a **tuple** is a row, an **attribute** is a column, and a **domain** is the set of values a column may hold (for example, whole numbers from 0 to 120 for age).",
      "Two rules matter most: each cell holds one value, and rows have no built-in order, so you ask for order when you need it.",
    ],
    analogy: {
      text: "Think of a deck of identical-format playing cards.",
      left: "The card deck", right: "Relational model",
      map: [
        ["The deck", "A relation (table)"],
        ["One card", "A tuple (row)"],
        ["Suit, rank: the same boxes on every card", "Attributes (columns)"],
        ["Only hearts, spades, clubs, diamonds allowed", "The domain of the suit column"],
        ["Shuffle the deck; it's still the same deck", "Rows have no inherent order"],
      ],
      breaks: "a real deck can't hold two identical cards in theory but can in practice. The relational model says a relation is a set (no duplicate rows), while SQL tables do allow duplicates unless a key forbids them.",
    },
    svg: () => {
      let b = t(240, 22, "relation: student", { bold: true, size: 14, mono: true });
      b += table(40, 54, ["roll_no", "name", "age"], [["1", "Ria", "12"], ["2", "Om", "13"], ["3", "Jay", "12"]], { cw: [130, 140, 130], rh: 32, hl: { 1: "acc" } });
      b += t(240, 44, "header = attributes (columns)", { size: 12, fill: C.dim });
      b += arrow(452, 150, 444, 132, { stroke: C.accS });
      b += t(460, 170, "a tuple (row)", { size: 12.5, fill: C.accT, a: "end", bold: true });
      b += t(240, 210, "domain of age: integers 0-120", { size: 12.5, fill: C.dim });
      b += t(240, 232, "Cells hold single values; row order carries no meaning.", { size: 12.5, fill: C.dim });
      return svg(480, 248, b, "Relational model terms on a small student table");
    },
    caption: "Relation = table, tuple = row, attribute = column, domain = the allowed values of a column.",
    oneline: "The relational model says all data is tables of rows and columns, with one value in each cell.",
  };

  /* ---------------------------------------------------------------- rdbms-keys */
  const ST = [["1", "ria@s.in", "Ria", "10A"], ["2", "om@s.in", "Om", "10A"], ["3", "ria2@s.in", "Ria", "10B"], ["4", "jay@s.in", "Jay", "10B"]];
  const COLS = ["roll_no", "email", "name", "class"];
  P["rdbms-keys"] = {
    simple: [
      "A **key** is a column, or a few columns together, whose values are never repeated, so each row can be pointed at exactly.",
      "A **candidate key** is a smallest such set: take any column away and it stops being unique. You pick one candidate as the **primary key**. A **composite** key uses several columns together.",
      "A **foreign key** is a column in another table that holds those key values, linking the two tables.",
    ],
    analogy: {
      text: "Think of ways to identify a pupil in a school.",
      left: "At school", right: "Key type",
      map: [
        ["Roll number", "Candidate key, chosen as the primary key"],
        ["School email", "Another candidate key (alternate key)"],
        ["Roll number + name", "Super key: unique, but has a spare column"],
        ["Name alone: two pupils called Ria", "Not a key"],
        ["Roll number written on a library card", "Foreign key in another table"],
      ],
      breaks: "\"name + class\" may happen to be unique today. A key must be unique by rule for all future rows, not just in the rows you have now.",
    },
    svg: () => {
      let b = table(20, 40, COLS, ST, { cw: [80, 120, 70, 70], rh: 30, title: "students" });
      b += `<rect x="20" y="40" width="80" height="150" rx="4" style="fill:none;stroke:${C.goodS};stroke-width:2.6"/>`;
      b += t(60, 210, "primary key", { size: 12, fill: C.goodT, bold: true });
      b += table(380, 70, ["roll_no", "book"], [["1", "B7"], ["3", "B2"]], { cw: [50, 40], rh: 30, title: "loans", size: 12 });
      b += t(425, 186, "foreign key", { size: 12, fill: C.accT, bold: true });
      b += arrow(378, 115, 102, 85, { stroke: C.accS, sw: 1.4 });
      b += t(240, 240, "loans.roll_no must match a students.roll_no.", { size: 12.5, fill: C.dim });
      return svg(480, 256, b, "Primary key in students referenced by a foreign key in loans");
    },
    caption: "roll_no identifies each student; loans points at students through it.",
    ix: el => {
      const sets = [["roll_no"], ["email"], ["name"], ["name", "class"], ["roll_no", "name"]];
      choice(el, { label: "Is this a key?", options: sets.map(s => s.join(" + ")), value: 0 }, i => {
        const s = sets[i], idx = s.map(c => COLS.indexOf(c));
        const vals = ST.map(r => idx.map(j => r[j]).join("|"));
        const unique = new Set(vals).size === vals.length;
        const dupes = {}; vals.forEach((v, j) => { if (vals.indexOf(v) !== j || vals.lastIndexOf(v) !== j) dupes[j] = "bad"; });
        const minimal = s.length === 1 || !s.some(c => { const k = COLS.indexOf(c); const v2 = ST.map(r => r[k]); return new Set(v2).size === v2.length; });
        let verdict, kind, note;
        if (!unique) { verdict = "Not a key: values repeat"; kind = "bad"; note = "Two rows share the same value, so it can't point at one row."; }
        else if (s.join() === "name,class") { verdict = "Unique here, but not by rule"; kind = "warn"; note = "No two rows clash <b>today</b>, but a second Ria could join 10A tomorrow. A key must be guaranteed unique."; }
        else if (!minimal) { verdict = "Super key, not a candidate"; kind = "warn"; note = "Unique, but <b>name</b> is spare: roll_no alone is already unique."; }
        else { verdict = "Candidate key"; kind = "good"; note = s[0] === "roll_no" ? "Unique and minimal. A good choice of primary key: short and stable." : "Unique and minimal. Emails can change, so it usually stays an alternate key with a UNIQUE constraint."; }
        const hl = {}; ST.forEach((_, j) => { hl[j] = dupes[j] || (unique ? "good" : "plain"); });
        let b = table(20, 20, COLS, ST, { cw: [80, 120, 70, 70], rh: 30, hl });
        idx.forEach(j => { const x = 20 + [0, 80, 200, 270][j], w = [80, 120, 70, 70][j]; b += `<rect x="${x}" y="20" width="${w}" height="150" rx="4" style="fill:none;stroke:${C.warnS};stroke-width:2.6"/>`; });
        b += box(20, 184, 440, 40, verdict, null, kind, { size: 14 });
        return { svg: svg(480, 240, b, "Key test"), note };
      });
    },
    oneline: "A key is a set of columns that never repeats, so it can point at exactly one row.",
  };

  /* ---------------------------------------------------------------- rdbms-integrity */
  P["rdbms-integrity"] = {
    simple: [
      "**Integrity constraints** are rules the database checks on every insert and update. If a change breaks a rule, the database refuses it.",
      "**Entity integrity**: every row has a primary key that is unique and not empty. **Referential integrity**: a foreign key must point at a row that really exists. **Domain integrity**: each value fits its column's type and rules, like `CHECK (age >= 0)`.",
      "Rules in the database protect the data even when an app has a bug.",
    ],
    analogy: {
      text: "Think of the rules at a school library desk.",
      left: "Library rules", right: "Integrity constraint",
      map: [
        ["Every book must have a unique barcode", "Entity integrity (PRIMARY KEY)"],
        ["You can only borrow with a real member card", "Referential integrity (FOREIGN KEY)"],
        ["Due dates must be real dates in the future", "Domain integrity (types, CHECK)"],
        ["A member can't leave while they still have books", "ON DELETE RESTRICT"],
        ["The librarian refuses, every time", "The whole statement fails"],
      ],
      breaks: "a librarian might let a friend off once. Constraints never bend, which is why some warehouses only declare them (not enforce them) to load faster, and check with tests instead.",
    },
    svg: () => {
      let b = t(240, 22, "Each write is checked before it's saved", { bold: true, size: 14 });
      const W = [["INSERT student id=1 (exists)", "entity: duplicate key", "bad"], ["INSERT loan for student 99", "referential: no student 99", "bad"], ["INSERT age = -4", "domain: CHECK age >= 0", "bad"], ["INSERT student id=5, age 12", "all rules pass", "good"]];
      W.forEach(([w, r, k], i) => {
        const y = 40 + i * 54;
        b += box(16, y, 230, 42, w, null, "plain", { mono: true, size: 11.5 });
        b += arrow(248, y + 21, 270, y + 21);
        b += box(274, y, 190, 42, k === "good" ? "saved" : "rejected", r, k, { size: 13.5, size2: 11 });
      });
      return svg(480, 264, b, "Integrity constraints reject bad inserts and accept a valid one");
    },
    caption: "Three bad writes are rejected, each by a different kind of rule; the good one is saved.",
    oneline: "Integrity constraints are rules the database checks on every change, so bad data is refused automatically.",
  };

  /* ---------------------------------------------------------------- rdbms-relational-algebra */
  const RA = [["1", "Ria", "IN", "40"], ["2", "Om", "US", "15"], ["3", "Jay", "IN", "30"], ["4", "Eli", "UK", "25"]];
  P["rdbms-relational-algebra"] = {
    simple: [
      "**Relational algebra** is a small set of operations that take tables in and give a table out. SQL is a friendly way of writing them.",
      "**Select** (σ, sigma) keeps rows that pass a test: SQL's `WHERE`. **Project** (π, pi) keeps chosen columns: SQL's `SELECT list`. **Join** (⋈) matches rows across tables. **Union** (∪), **intersect** (∩) and **difference** (−) combine tables top to bottom.",
      "Because each output is a table, operations chain together. A query plan is a tree of exactly these steps.",
    ],
    analogy: {
      text: "Think of tools on a kitchen counter for preparing vegetables.",
      left: "Kitchen tools", right: "Algebra operator",
      map: [
        ["A sieve that keeps the good ones", "σ select (rows): WHERE"],
        ["A knife that keeps just the part you want", "π project (columns): SELECT list"],
        ["Pairing each carrot with its matching dip", "⋈ join"],
        ["Tipping two bowls into one", "∪ union"],
        ["Each tool's output can go into the next tool", "Operators compose into a plan tree"],
      ],
      breaks: "kitchen tools work on one bowl at a time. A database optimizer can reorder the tools, like filtering before joining, because the algebra proves the result stays the same.",
    },
    svg: () => {
      let b = t(240, 22, "π name ( σ country = 'IN' ( customers ) )", { mono: true, size: 13.5, fill: C.tx });
      b += table(20, 50, ["id", "name", "cty", "amt"], RA, { cw: [40, 60, 50, 50], rh: 28, title: "", hl: { 0: "good", 2: "good" }, strike: { 1: true, 3: true } });
      b += arrow(224, 120, 270, 120, { label: "σ then π", dy: -8 });
      b += table(290, 78, ["name"], [["Ria"], ["Jay"]], { cw: [120], rh: 28, hl: { 0: "good", 1: "good" } });
      b += t(240, 210, "SQL: SELECT name FROM customers WHERE country = 'IN'", { mono: true, size: 12, fill: C.dim });
      return svg(480, 226, b, "Selection then projection on a customers table");
    },
    caption: "σ keeps the IN rows, then π keeps only the name column.",
    ix: el => {
      const ops = ["σ cty='IN'", "π name, cty", "σ amt>20 then π name", "A ∪ B", "A − B"];
      choice(el, { label: "Apply:", options: ops, value: 0 }, i => {
        let b = "", note = "";
        if (i === 0) { b += table(110, 30, ["id", "name", "cty", "amt"], RA.filter(r => r[2] === "IN"), { cw: [50, 80, 60, 70], rh: 30, hl: { 0: "good", 1: "good" } }); note = "Select keeps whole <b>rows</b> where the test is true. SQL: <code>WHERE cty = 'IN'</code>."; }
        if (i === 1) { b += table(140, 30, ["name", "cty"], RA.map(r => [r[1], r[2]]), { cw: [100, 100], rh: 30 }); note = "Project keeps chosen <b>columns</b>. In pure algebra duplicates vanish; SQL keeps them unless you add DISTINCT."; }
        if (i === 2) { b += table(170, 30, ["name"], RA.filter(r => Number(r[3]) > 20).map(r => [r[1]]), { cw: [140], rh: 30, hl: { 0: "good", 1: "good", 2: "good" } }); note = "Operators chain: the output of σ is the input to π."; }
        if (i === 3 || i === 4) {
          const A = ["Ria", "Om", "Jay"], B = ["Jay", "Eli"];
          b += table(30, 30, ["A"], A.map(x => [x]), { cw: [100], rh: 30 }) + table(150, 30, ["B"], B.map(x => [x]), { cw: [100], rh: 30 });
          const R = i === 3 ? [...new Set([...A, ...B])] : A.filter(x => !B.includes(x));
          b += arrow(256, 75, 296, 75);
          b += table(310, 30, [i === 3 ? "A ∪ B" : "A − B"], R.map(x => [x]), { cw: [140], rh: 30, hl: Object.fromEntries(R.map((_, j) => [j, "good"])) });
          note = i === 3 ? "Union stacks both and drops duplicates (Jay once). SQL: <code>UNION</code>." : "Difference keeps rows of A not in B. SQL: <code>EXCEPT</code>.";
        }
        return { svg: svg(480, 190, b, ops[i] + " result"), note };
      });
    },
    oneline: "Relational algebra is a handful of table-in, table-out operations, and every SQL query is built from them.",
  };

  /* ---------------------------------------------------------------- rdbms-er-modeling */
  P["rdbms-er-modeling"] = {
    simple: [
      "Before building tables, you draw the business as an **ER diagram** (Entity-Relationship): the **things** (entities, like Customer and Order), their **facts** (attributes, like name and date), and how they connect (**relationships**).",
      "Each relationship has a **cardinality**: one-to-one, one-to-many (one customer, many orders) or many-to-many (many students, many courses).",
      "Then you turn it into tables: each entity becomes a table, a one-to-many becomes a foreign key on the \"many\" side, and a many-to-many becomes its own junction table.",
    ],
    analogy: {
      text: "Think of drawing a map of your school before building a model of it.",
      left: "The school map", right: "ER modeling",
      map: [
        ["Buildings: classrooms, library, canteen", "Entities"],
        ["Labels on each building: size, floor", "Attributes"],
        ["Paths between buildings", "Relationships"],
        ["\"One teacher per class, many pupils per class\"", "Cardinality"],
        ["The sign-up sheet linking pupils to clubs", "Junction table for many-to-many"],
      ],
      breaks: "a map shows what exists today. Good ER models also ask what can change: can a customer have two addresses? Getting that wrong means reshaping tables later.",
    },
    svg: () => {
      let b = box(20, 30, 130, 44, "Customer", null, "acc", { size: 15 }) + box(320, 30, 130, 44, "Order", null, "acc", { size: 15 });
      b += line(150, 52, 320, 52, { stroke: C.line, sw: 2 });
      b += t(170, 44, "1", { size: 14, fill: C.warnT, bold: true }) + t(300, 44, "N", { size: 14, fill: C.warnT, bold: true });
      b += t(235, 44, "places", { size: 12.5, fill: C.dim });
      b += box(20, 120, 130, 44, "Student", null, "acc", { size: 15 }) + box(320, 120, 130, 44, "Course", null, "acc", { size: 15 });
      b += line(150, 142, 320, 142, { stroke: C.line, sw: 2 });
      b += t(170, 134, "N", { size: 14, fill: C.warnT, bold: true }) + t(300, 134, "M", { size: 14, fill: C.warnT, bold: true });
      b += arrow(240, 170, 240, 198, { label: "maps to tables", dx: 54, dy: 4 });
      b += box(20, 200, 140, 46, "orders", "FK customer_id", "plain", { mono: true, size: 13, size2: 12 });
      b += box(170, 200, 140, 46, "enrolment", "student_id, course_id", "good", { mono: true, size: 13, size2: 11 });
      b += box(320, 200, 140, 46, "students, courses", "own tables", "plain", { mono: true, size: 12, size2: 12 });
      b += t(90, 270, "1-to-N: FK on the N side", { size: 12, fill: C.dim }) + t(240, 270, "N-to-M: junction table", { size: 12, fill: C.goodT });
      return svg(480, 286, b, "ER relationships and how they map to tables");
    },
    caption: "A one-to-many becomes a foreign key; a many-to-many becomes its own junction table.",
    oneline: "An ER diagram draws the things, their facts and their links, and then each piece turns into tables and keys.",
  };

  /* ---------------------------------------------------------------- rdbms-normalization */
  P["rdbms-normalization"] = {
    simple: [
      "**Normalization** reshapes tables in steps so each fact is stored once.",
      "**1NF**: one value per cell, no lists. **2NF**: with a key made of several columns, every other column must depend on the **whole** key, not just part of it. **3NF**: columns must depend on the key directly, not through another column (no \"transitive\" dependencies).",
      "**BCNF** (Boyce-Codd Normal Form) is a slightly stricter 3NF: anything that decides another column must itself be a key.",
    ],
    analogy: {
      text: "Think of tidying a messy school timetable into neat lists.",
      left: "Tidying the timetable", right: "Normal form",
      map: [
        ["\"Maths, Art\" squeezed into one box", "Breaks 1NF: split into one row each"],
        ["Teacher's phone written on every (class, lesson) line", "Breaks 2NF: depends on only part of the key"],
        ["Room's floor written on every lesson in that room", "Breaks 3NF: floor depends on room, not on the lesson"],
        ["A separate list of rooms with their floor", "The fix: move it to its own table"],
      ],
      breaks: "tidying never makes a timetable slower to read. In databases, more tables means more joins, which is why analytics models later denormalize on purpose.",
    },
    svg: () => {
      let b = t(240, 22, "Fixing a 3NF problem: room → floor", { bold: true, size: 14 });
      b += table(20, 40, ["lesson", "room", "floor"], [["L1", "R12", "1"], ["L2", "R12", "1"], ["L3", "R30", "3"]], { cw: [90, 80, 70], rh: 28 });
      b += `<rect x="190" y="68" width="70" height="84" rx="3" style="fill:none;stroke:${C.badS};stroke-width:2.4"/>`;
      b += t(140, 176, "lesson → room → floor", { size: 12.5, fill: C.badT, mono: true });
      b += arrow(270, 96, 300, 96);
      b += table(310, 40, ["lesson", "room"], [["L1", "R12"], ["L2", "R12"], ["L3", "R30"]], { cw: [70, 80], rh: 28 });
      b += table(310, 172, ["room", "floor"], [["R12", "1"], ["R30", "3"]], { cw: [80, 70], rh: 28, hl: { 0: "good", 1: "good" } });
      b += t(240, 276, "Floor now lives once per room, not once per lesson.", { size: 12.5, fill: C.dim });
      return svg(480, 292, b, "Removing a transitive dependency to reach third normal form");
    },
    caption: "Floor depended on the room, not the lesson, so it moves to a rooms table.",
    oneline: "Normal forms are steps that move each fact to the one table where it truly belongs.",
  };

  /* ---------------------------------------------------------------- rdbms-acid-internals */
  P["rdbms-acid-internals"] = {
    simple: [
      "ACID is a promise. Real databases keep it with two main machines.",
      "The **write-ahead log** (WAL) gives atomicity and durability: every change is logged first, and `COMMIT` waits until the log is safely on disk. After a crash, the log is replayed.",
      "**MVCC** or **locks** give isolation. PostgreSQL and MySQL's InnoDB keep old row versions so readers see a snapshot; SQL Server uses locks by default and offers snapshot isolation as an option. **Constraints** give consistency.",
    ],
    analogy: {
      text: "Think of a bank branch at closing time.",
      left: "The bank", right: "ACID machinery",
      map: [
        ["Every transaction written in the ledger first", "Write-ahead log"],
        ["The ledger locked in the vault at closing", "Log flushed to disk at COMMIT"],
        ["Cashiers each working from a morning statement", "MVCC snapshots"],
        ["\"Only one cashier touches this account at a time\"", "Row locks"],
        ["\"No account may go below zero\"", "CHECK constraints"],
      ],
      breaks: "a bank closes at night. Databases never stop, so the log is also cleaned and archived continuously, and old row versions are vacuumed while users keep working.",
    },
    svg: () => {
      const L = [["A + D", "Atomicity, Durability", "write-ahead log", "acc"], ["I", "Isolation", "MVCC or locks", "vio"], ["C", "Consistency", "constraints + rules", "good"]];
      let b = t(240, 22, "Which machine keeps which promise", { bold: true, size: 14 });
      L.forEach(([k, n, m, kind], i) => {
        const y = 40 + i * 70;
        b += box(20, y, 90, 54, k, null, kind, { size: 18 });
        b += box(126, y, 160, 54, n, null, "plain", { size: 13.5 });
        b += arrow(288, y + 27, 314, y + 27);
        b += box(318, y, 146, 54, m, null, kind, { size: 13 });
      });
      return svg(480, 260, b, "Write-ahead log, MVCC or locks, and constraints mapped to ACID properties");
    },
    caption: "Two engine parts and your rules: the log, the concurrency system, and constraints.",
    oneline: "Databases keep ACID with a log written before every change, snapshots or locks for isolation, and enforced rules.",
  };

  /* ---------------------------------------------------------------- rdbms-indexes-joins */
  P["rdbms-indexes-joins"] = {
    simple: [
      "Two engine skills decide most query speed: finding rows (indexes) and combining tables (join algorithms).",
      "A **nested-loop join** takes each row on one side and looks for matches on the other; with an index on the inner side, that's fast for small inputs. A **hash join** builds a lookup table from the smaller side, then streams the bigger side through it. A **merge join** walks two sorted inputs side by side.",
      "The optimizer picks one based on table sizes, indexes and sort order.",
    ],
    analogy: {
      text: "Think of matching 1,000 guests to their reserved seats.",
      left: "Seating guests", right: "Join algorithm",
      map: [
        ["Walk every guest past every seat", "Nested loop without an index"],
        ["Each guest checks the seating chart by name", "Nested loop with an index"],
        ["Pin a chart: table numbers by surname letter", "Hash join (build on the small side)"],
        ["Guests and seats both lined up A to Z, walk together", "Merge join on sorted inputs"],
      ],
      breaks: "guests can ask for help. If the hash table doesn't fit in memory, a hash join spills to disk and slows down a lot, which is why it's built on the smaller side.",
    },
    svg: () => {
      let b = t(240, 22, "Hash join: build on the small side, probe with the big side", { bold: true, size: 13 });
      b += box(20, 44, 140, 50, "customers", "10,000 rows (small)", "acc", { size: 14, size2: 11.5 });
      b += arrow(162, 69, 196, 69, { label: "build", dy: -8 });
      b += box(200, 44, 120, 50, "hash table", "id → row, in RAM", "good", { size: 13.5, size2: 11 });
      b += box(20, 130, 140, 50, "orders", "1,000,000 rows (big)", "plain", { size: 14, size2: 11.5 });
      b += arrow(162, 155, 230, 98, { label: "probe each row", dx: 30, dy: 8 });
      b += arrow(322, 69, 356, 69);
      b += box(360, 44, 104, 50, "matches", null, "good", { size: 14 });
      b += t(240, 216, "One pass over each table, no sorting needed.", { size: 12.5, fill: C.dim });
      return svg(480, 232, b, "Hash join builds a hash table from the smaller input and probes it with the larger");
    },
    caption: "Build a lookup table from customers, then stream every order through it.",
    ix: el => {
      const A = ["Nested loop (no index)", "Nested loop + index", "Hash join", "Merge join (needs sort)"];
      const n = 1e6, m = 1e4;
      const cost = [n * m, n * Math.log2(m), n + m, n * Math.log2(n) + m * Math.log2(m) + n + m];
      choice(el, { label: "Join 1,000,000 orders with 10,000 customers using:", options: A, value: 2 }, i => {
        let b = t(240, 22, "Rough operation count (log scale)", { bold: true, size: 13.5 });
        A.forEach((a, j) => {
          const y = 40 + j * 40, w = Math.log10(cost[j]) / 10 * 220;
          b += t(16, y + 17, a.replace(" (needs sort)", "").replace(" (no index)", ""), { a: "start", size: 12, fill: j === i ? C.tx : C.dim, bold: j === i });
          b += `<rect x="170" y="${y + 2}" width="${w.toFixed(1)}" height="20" rx="4" style="fill:${j === i ? C.acc : "#2b3446"};stroke:${j === i ? C.accS : C.boxS}"/>`;
          b += t(176 + w, y + 17, "~" + (cost[j] >= 1e9 ? (cost[j] / 1e9).toPrecision(2) + " billion" : cost[j] >= 1e6 ? (cost[j] / 1e6).toPrecision(2) + " million" : Math.round(cost[j]).toLocaleString("en-US")), { a: "start", size: 11, fill: C.dim });
        });
        const notes = [
          "Every order is compared with every customer: about 10 billion comparisons. Only OK for tiny tables.",
          "Each order does a B-tree lookup (about 14 steps for 10,000 keys). Great when the outer side is small.",
          "Build 10,000 entries once, probe 1,000,000 times: about one pass over each table. Usually the winner for big unsorted joins.",
          "Sorting dominates. If both inputs are already sorted on the key (an index or a sorted file), the merge itself is one pass.",
        ];
        return { svg: svg(480, 206, b, A[i] + " cost"), note: notes[i] + " (Counts are textbook estimates, not timings.)" };
      });
    },
    oneline: "Indexes find rows fast, and the database joins tables by looping, hashing or merging, whichever is cheapest.",
  };

  /* ---------------------------------------------------------------- rdbms-vs-nosql */
  P["rdbms-vs-nosql"] = {
    simple: [
      "Relational databases are the safe default: strict schemas, joins, and ACID transactions. They are perfect for money, orders and anything with clear rules.",
      "**NoSQL** stores (document, key-value, wide-column, graph) give up some of that for other strengths: flexible shapes, very fast simple lookups, or easy scaling across many machines.",
      "**NewSQL** systems (like Spanner or CockroachDB) try to offer SQL and ACID across many machines. Choose by your data's shape and how it will be read and written.",
    ],
    analogy: {
      text: "Think of choosing a vehicle for a job.",
      left: "Vehicles", right: "Data store",
      map: [
        ["A family car: safe, does most trips well", "RDBMS (PostgreSQL, MySQL)"],
        ["A delivery scooter: tiny loads, super quick", "Key-value (Redis)"],
        ["A camper van you can rearrange inside", "Document store (MongoDB)"],
        ["A fleet of lorries for huge volumes", "Wide-column (Cassandra, Bigtable)"],
        ["A tour bus following a route map", "Graph database"],
      ],
      breaks: "you can rent a van for one weekend. Changing databases later means migrating data and rewriting code, so the first choice sticks for years.",
    },
    svg: () => {
      let b = t(240, 22, "Pick by need, not by fashion", { bold: true, size: 14 });
      const R = [["money, orders, strict rules", "RDBMS", "acc"], ["flexible JSON per item", "Document", "good"], ["sub-millisecond lookup by key", "Key-value", "warn"], ["huge writes across many nodes", "Wide-column", "vio"], ["many hops between linked things", "Graph", "acc"]];
      R.forEach(([need, db, k], i) => {
        const y = 38 + i * 46;
        b += box(16, y, 250, 36, need, null, "plain", { size: 12.5, bold: false });
        b += arrow(268, y + 18, 296, y + 18);
        b += box(300, y, 164, 36, db, null, k, { size: 14 });
      });
      return svg(480, 280, b, "Matching application needs to types of data store");
    },
    caption: "Start from the need on the left; the store on the right is the usual fit.",
    oneline: "Use a relational database by default, and pick a NoSQL store when its special strength matches your data.",
  };

  /* ---------------------------------------------------------------- rdbms-interview-prep */
  P["rdbms-interview-prep"] = {
    simple: [
      "This page reviews the relational track before an interview.",
      "Expect questions on key types, the normal forms (with an example of each), the three integrity rules, relational algebra symbols, how ACID is built, and join algorithms.",
      "Draw small tables when you answer. A 3-row example makes 2NF or a hash join obvious in seconds.",
    ],
    analogy: {
      text: "Think of a maths exam where you show your working.",
      left: "Showing working", right: "Relational interview",
      map: [
        ["Write the formula first", "Name the rule: \"3NF: no transitive dependency\""],
        ["Then plug in small numbers", "A 3-row example table"],
        ["Then state the answer clearly", "The fix: split into two tables"],
        ["Check the units", "Say the trade-off: more joins"],
      ],
      breaks: "exam questions have one right answer. Design questions often have several, so state your assumptions out loud.",
    },
    svg: () => {
      const Q = [["Candidate vs primary key?", "minimal unique sets; you pick one"], ["2NF vs 3NF?", "whole key vs no transitive deps"], ["Referential integrity?", "FK must point at an existing row"], ["σ vs π?", "rows (WHERE) vs columns (SELECT)"], ["Hash vs merge join?", "build+probe vs walk sorted inputs"]];
      let b = t(240, 22, "Five answers to have ready", { bold: true, size: 14 });
      Q.forEach(([q, a], i) => {
        const y = 38 + i * 50;
        b += box(16, y, 190, 40, q, null, "acc", { size: 12 });
        b += arrow(208, y + 20, 222, y + 20);
        b += box(226, y, 238, 40, a, null, "plain", { size: 11, bold: false });
      });
      return svg(480, 294, b, "Common relational-model interview questions with short answers");
    },
    caption: "Each answer in one line; back it with a tiny table when you speak.",
    oneline: "Relational interviews test keys, normal forms, integrity, algebra and joins, so explain each with a tiny example table.",
  };
})();
