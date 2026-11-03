/* Datalith pass 2 — Track 4 (SQL), part D: NULLs, strings, dates, JSON, DDL/DML,
   normalization, views, stored code, indexes, transactions, EXPLAIN, interview prep. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- sql-null-handling */
  const NR = [["Ava", "IN"], ["Ben", null], ["Cai", "UK"], ["Dev", null]];
  P["sql-null-handling"] = {
    simple: [
      "`NULL` means **\"we don't know\"**. It is not zero and not an empty word. It is a blank that nobody has filled in.",
      "Because it's unknown, `NULL = 'IN'` isn't true or false. It is **UNKNOWN**. SQL uses three answers: TRUE, FALSE and UNKNOWN.",
      "`WHERE` keeps only TRUE rows, so NULL rows vanish from most filters. To find them, write `IS NULL`, never `= NULL`.",
    ],
    analogy: {
      text: "Think of a sealed envelope that may or may not hold a birthday card.",
      left: "The sealed envelope", right: "In SQL",
      map: [
        ["\"Is the card in it blue?\" Nobody can say", "`NULL = 'blue'` is UNKNOWN"],
        ["\"Are these two sealed envelopes the same?\" Can't tell", "`NULL = NULL` is UNKNOWN, not TRUE"],
        ["\"Is this envelope still sealed?\" Yes, you can see that", "`col IS NULL` is TRUE or FALSE"],
        ["Leave sealed envelopes out when adding up money", "`SUM`, `AVG`, `COUNT(col)` skip NULLs"],
        ["\"If it's sealed, assume 0\"", "`COALESCE(col, 0)`"],
      ],
      breaks: "an envelope will be opened one day. A NULL may never get a value, and some places treat NULLs as equal anyway: GROUP BY puts all NULLs in one group, and DISTINCT keeps one NULL.",
    },
    svg: () => {
      let b = t(240, 22, "Three-valued logic: what each test returns", { bold: true, size: 14 });
      const rows = [["'IN' = 'IN'", "TRUE", "good"], ["'IN' = 'UK'", "FALSE", "bad"], ["NULL = 'IN'", "UNKNOWN", "warn"], ["NULL = NULL", "UNKNOWN", "warn"], ["NULL IS NULL", "TRUE", "good"]];
      rows.forEach(([e, v, k], i) => {
        const y = 38 + i * 40;
        b += box(40, y, 200, 32, e, null, "plain", { mono: true, size: 13.5 });
        b += arrow(242, y + 16, 280, y + 16);
        b += box(284, y, 150, 32, v, null, k, { size: 13.5 });
      });
      b += line(20, 250, 460, 250, { stroke: "#2b3446" });
      b += t(240, 276, "WHERE keeps TRUE only. UNKNOWN is treated like FALSE.", { size: 13, fill: C.tx });
      b += t(240, 300, "Trap: x NOT IN (1, 2, NULL) is never TRUE, so it returns no rows.", { size: 12.5, fill: C.badT });
      b += t(240, 320, "Use NOT EXISTS, or filter the NULLs out of the list.", { size: 12.5, fill: C.dim });
      return svg(480, 336, b, "Comparisons with NULL return UNKNOWN, which WHERE treats as not true");
    },
    caption: "Any normal comparison with NULL gives UNKNOWN. Only IS NULL and IS NOT NULL give a clear answer.",
    ix: el => {
      const tests = ["country = 'IN'", "country <> 'IN'", "country IS NULL", "COALESCE(country,'?') <> 'IN'"];
      choice(el, { label: "WHERE", options: tests, value: 1 }, i => {
        const ev = c => {
          if (i === 0) return c === null ? "UNKNOWN" : c === "IN" ? "TRUE" : "FALSE";
          if (i === 1) return c === null ? "UNKNOWN" : c !== "IN" ? "TRUE" : "FALSE";
          if (i === 2) return c === null ? "TRUE" : "FALSE";
          return (c === null ? "?" : c) !== "IN" ? "TRUE" : "FALSE";
        };
        const res = NR.map(r => ev(r[1]));
        const hl = {}, st = {}; res.forEach((v, j) => { hl[j] = v === "TRUE" ? "good" : v === "FALSE" ? "bad" : "warn"; if (v !== "TRUE") st[j] = true; });
        let b = t(240, 24, "SELECT name FROM people WHERE " + tests[i], { mono: true, size: 12, fill: C.tx });
        b += table(80, 52, ["name", "country", "test is"], NR.map((r, j) => [r[0], r[1], res[j]]), { cw: [90, 110, 120], rh: 30, hl, strike: st });
        const kept = res.filter(v => v === "TRUE").length;
        const notes = [
          "Ben and Dev give UNKNOWN, so they are dropped along with Cai.",
          "Most people expect Ben and Dev here. They are missing: \"NULL is not IN\" is UNKNOWN, not TRUE.",
          "IS NULL is the only way to ask \"is it blank?\". It finds exactly Ben and Dev.",
          "COALESCE swaps NULL for '?' first, so the test has a real value and Ben and Dev come back.",
        ];
        return { svg: svg(480, 52 + 30 * 5 + 16, b, "NULL test result"), note: `<b>${kept} of 4</b> rows kept. ` + notes[i] };
      });
    },
    oneline: "NULL means unknown, so comparing with it gives unknown, and WHERE throws unknown rows away.",
  };

  /* ---------------------------------------------------------------- sql-string-funcs */
  P["sql-string-funcs"] = {
    simple: [
      "Text from real systems is messy. Names have extra spaces, emails mix capitals, and codes hide inside longer strings.",
      "SQL has small tools for each job: `TRIM` removes edge spaces, `LOWER` and `UPPER` fix capitals, `SUBSTRING` cuts out a piece, `REPLACE` swaps text, and `||` or `CONCAT` glues strings together.",
      "Cleaning text **before** you join or group on it stops \"Ava@x.com \" and \"ava@x.com\" being treated as two different people.",
    ],
    analogy: {
      text: "Think of tidying name tags before a school event.",
      left: "Name tags", right: "In SQL",
      map: [
        ["Cut off the extra tape at both ends", "`TRIM(name)`"],
        ["Write every tag in small letters", "`LOWER(email)`"],
        ["Keep just the first 3 letters for the class code", "`SUBSTRING(code FROM 1 FOR 3)`"],
        ["Change \"Std\" to \"Standard\" on every tag", "`REPLACE(label, 'Std', 'Standard')`"],
        ["Stick first and last name together", "`first || ' ' || last`"],
      ],
      breaks: "a blank tag stays blank when you glue it. In SQL, `'Ava' || NULL` is NULL, and `CONCAT('Ava', NULL)` gives 'Ava' in PostgreSQL and SQL Server but NULL in MySQL, Snowflake and BigQuery. Check your engine, or wrap the column in `COALESCE`.",
    },
    svg: () => {
      let b = t(240, 24, "Clean the key before you match on it", { bold: true, size: 14 });
      const steps = [["'  Ava.Patel@X.com '", "raw value from the app", "bad"], ["TRIM(...)", "'Ava.Patel@X.com'", "warn"], ["LOWER(...)", "'ava.patel@x.com'", "acc"], ["SPLIT_PART(..., '@', 2)", "'x.com' (the domain)", "good"]];
      steps.forEach(([a, s, k], i) => {
        const y = 40 + i * 70;
        b += box(60, y, 360, 50, a, s, k, { mono: true, mono2: true, size: 14, size2: 13 });
        if (i < 3) b += arrow(240, y + 50, 240, y + 68);
      });
      b += t(240, 326, "SPLIT_PART is PostgreSQL; other databases have SPLIT or SUBSTRING_INDEX.", { size: 12, fill: C.dim });
      return svg(480, 342, b, "A messy email cleaned step by step with TRIM, LOWER and a split");
    },
    caption: "Each function fixes one kind of mess. Chained together they turn a raw value into a clean key.",
    oneline: "String functions trim, re-case, cut and glue text so messy values match the way people expect.",
  };

  /* ---------------------------------------------------------------- sql-dates */
  P["sql-dates"] = {
    simple: [
      "Almost every record has a time on it: when an order was placed, when a user signed up.",
      "SQL can add time (`+ INTERVAL '7 days'`), pull out a part (`EXTRACT(MONTH FROM ts)`), and snap a time down to the start of its day or month (`DATE_TRUNC('month', ts)`) for reports.",
      "The hard part is **time zones**. Store times in UTC (the world's reference clock) and convert to local time only when you show them. Otherwise late-night orders land in the wrong day or month.",
    ],
    analogy: {
      text: "Think of a calendar on the wall and a clock that has a different time in every city.",
      left: "Calendar and clocks", right: "In SQL",
      map: [
        ["Count 7 squares forward", "`order_date + INTERVAL '7 days'`"],
        ["Read just the month off the page", "`EXTRACT(MONTH FROM ts)`"],
        ["Tear back to the 1st of the month", "`DATE_TRUNC('month', ts)`"],
        ["One shared clock in the town square", "Store `timestamptz` / UTC"],
        ["Each family's own wall clock", "Convert for display: `AT TIME ZONE 'Asia/Kolkata'`"],
      ],
      breaks: "a wall calendar ignores daylight-saving jumps. Real time zones shift by an hour on some dates in many countries, so always use named zones, never a fixed offset you typed by hand.",
    },
    svg: () => {
      let b = t(240, 24, "One order, two clocks, two months", { bold: true, size: 14 });
      b += box(30, 44, 190, 58, "01:30, 1 Feb", "India (UTC+5:30)", "warn", { size: 15, size2: 12.5 });
      b += box(260, 44, 190, 58, "20:00, 31 Jan", "UTC (stored)", "acc", { size: 15, size2: 12.5 });
      b += arrow(222, 73, 256, 73, { label: "−5:30", dy: -8 });
      b += box(30, 140, 190, 50, "DATE_TRUNC('month')", "→ February", "warn", { mono: true, size: 13, size2: 13 });
      b += box(260, 140, 190, 50, "DATE_TRUNC('month')", "→ January", "acc", { mono: true, size: 13, size2: 13 });
      b += arrow(125, 104, 125, 138) + arrow(355, 104, 355, 138);
      b += t(240, 226, "The same instant falls in different months.", { size: 13.5, fill: C.tx });
      b += t(240, 248, "Decide which zone the business reports in,", { size: 12.5, fill: C.dim });
      b += t(240, 266, "convert once, then truncate.", { size: 12.5, fill: C.dim });
      return svg(480, 284, b, "A timestamp near midnight lands in different months depending on the time zone");
    },
    caption: "India is 5 hours 30 minutes ahead of UTC, so an early-morning order on 1 Feb is still 31 Jan in UTC.",
    oneline: "Store times on one world clock (UTC) and convert to local time only when you show or group them.",
  };

  /* ---------------------------------------------------------------- sql-json */
  P["sql-json"] = {
    simple: [
      "Apps and APIs often send data as **JSON** (JavaScript Object Notation): nested labels and values like `{\"user\": {\"id\": 7}}`.",
      "Modern databases can store JSON in a column and reach inside it. In PostgreSQL, `->` steps into a field and `->>` takes the value out as text.",
      "JSON is handy when the shape keeps changing. Fields you filter or join on all the time are better pulled out into proper columns.",
    ],
    analogy: {
      text: "Think of a parcel with smaller boxes packed inside it.",
      left: "The parcel", right: "In SQL (PostgreSQL)",
      map: [
        ["The whole parcel in one locker", "A `JSONB` column called `payload`"],
        ["Open the box labelled \"user\"", "`payload -> 'user'` (still JSON)"],
        ["Read the note inside, as plain words", "`payload -> 'user' ->> 'id'` (text)"],
        ["A box of 3 identical toys, laid out one per row", "`jsonb_array_elements(payload -> 'items')`"],
        ["Sticking the most-used note on the outside", "Promote a hot field to a real column (or index it)"],
      ],
      breaks: "a parcel's label is checked by a person. A JSON field has no type rules unless you add them, so a missing or misspelled key quietly gives NULL instead of an error.",
    },
    svg: () => {
      let b = box(20, 20, 440, 70, "{ \"event\": \"buy\", \"user\": { \"id\": 7 },", "\"items\": [ {\"sku\": \"A\"}, {\"sku\": \"B\"} ] }", "plain", { mono: true, mono2: true, size: 13, size2: 13 });
      const ex = [["payload ->> 'event'", "'buy'", "text"], ["payload -> 'user' ->> 'id'", "'7'", "text; cast to int"], ["jsonb_array_elements(payload->'items')", "2 rows", "{sku:A} and {sku:B}"]];
      ex.forEach(([e, r, r2], i) => {
        const y = 118 + i * 66;
        b += box(16, y, 300, 44, e, null, "acc", { mono: true, size: 11.5 });
        b += arrow(318, y + 22, 334, y + 22);
        b += box(338, y, 126, 44, r, r2, "good", { size: 13.5, size2: 11.5 });
      });
      b += arrow(240, 92, 160, 116, { stroke: C.accS });
      return svg(480, 326, b, "Extracting fields and unnesting arrays from a JSON document in SQL");
    },
    caption: "Arrows walk into the document. -> keeps JSON, ->> hands back text, and the array becomes rows.",
    oneline: "JSON columns hold nested data, and SQL operators reach inside to pull fields out as normal values.",
  };

  /* ---------------------------------------------------------------- sql-ddl-dml */
  P["sql-ddl-dml"] = {
    simple: [
      "SQL has two big families of commands. **DDL** (Data Definition Language) builds the shape: `CREATE`, `ALTER` and `DROP` tables.",
      "**DML** (Data Manipulation Language) changes the rows inside: `INSERT`, `UPDATE` and `DELETE`.",
      "When you build a table you also set **types** (number, text, date) and **constraints**: rules like \"must be unique\" or \"can't be empty\" that the database checks on every change.",
    ],
    analogy: {
      text: "Think of a school library: building the shelves versus moving the books.",
      left: "The library", right: "In SQL",
      map: [
        ["Build a new shelf with labelled slots", "`CREATE TABLE` (DDL)"],
        ["Add a slot for \"author\" to every shelf", "`ALTER TABLE ... ADD COLUMN`"],
        ["Put a new book on the shelf", "`INSERT` (DML)"],
        ["Fix a book's label", "`UPDATE ... SET ... WHERE`"],
        ["Take a book away", "`DELETE ... WHERE`"],
        ["\"Every book needs a unique barcode\"", "`PRIMARY KEY` / `UNIQUE` / `NOT NULL` constraints"],
      ],
      breaks: "a librarian might bend a rule once. A constraint never does: the whole statement fails, which is exactly what keeps bad data out.",
    },
    svg: () => {
      let b = t(120, 26, "DDL: the shape", { bold: true, size: 14 }) + t(360, 26, "DML: the rows", { bold: true, size: 14 });
      ["CREATE TABLE", "ALTER TABLE", "DROP TABLE"].forEach((c, i) => { b += box(30, 42 + i * 50, 180, 38, c, null, "vio", { mono: true, size: 14 }); });
      ["INSERT", "UPDATE", "DELETE"].forEach((c, i) => { b += box(270, 42 + i * 50, 180, 38, c, null, "acc", { mono: true, size: 14 }); });
      b += box(30, 210, 420, 50, "Constraints check every INSERT and UPDATE", "PRIMARY KEY · FOREIGN KEY · UNIQUE · NOT NULL · CHECK", "warn", { size: 14, size2: 12.5 });
      b += arrow(360, 194, 360, 208) + arrow(120, 194, 120, 208, { label: "defines", dx: 30, dy: 4 });
      b += box(60, 290, 160, 40, "INSERT id=1 again", null, "bad", { mono: true, size: 12.5 });
      b += arrow(222, 310, 262, 310);
      b += box(266, 290, 184, 40, "rejected: duplicate key", null, "bad", { size: 13 });
      return svg(480, 346, b, "DDL defines table structure; DML changes rows; constraints check every change");
    },
    caption: "DDL builds and changes the table; DML moves rows in and out; constraints stand guard in between.",
    oneline: "DDL builds the shelves, DML moves the books, and constraints are the rules that refuse bad books.",
  };

  /* ---------------------------------------------------------------- sql-normalization-forms */
  P["sql-normalization-forms"] = {
    simple: [
      "**Normalization** means arranging tables so each fact is written down in exactly **one** place.",
      "If a customer's city is copied onto every order, changing the city means fixing many rows, and missing one leaves the data contradicting itself.",
      "The \"normal forms\" (1NF, 2NF, 3NF, BCNF) are a checklist. The short version: every column should depend on **the key, the whole key, and nothing but the key**.",
    ],
    analogy: {
      text: "Think of a class contact list that someone keeps copying by hand.",
      left: "The contact list", right: "In database terms",
      map: [
        ["Two phone numbers squeezed into one box", "Breaks 1NF: one value per cell"],
        ["Teacher's name written on every pupil's row", "A fact copied many times (update anomaly)"],
        ["Fixing the teacher's name on 30 rows, missing one", "Data that disagrees with itself"],
        ["A separate \"teachers\" card, pupils just say which class", "Split into tables joined by a key (3NF)"],
        ["Look up the card when you need the teacher", "A join at query time"],
      ],
      breaks: "copying is sometimes the right call. Warehouses deliberately repeat data (denormalize) so big reports need fewer joins. Normalize where data is written; denormalize where it is mostly read.",
    },
    svg: () => {
      let b = t(240, 22, "Before: one wide table with copies", { bold: true, size: 14 });
      b += table(20, 34, ["order", "cust", "cust_city", "amount"], [["101", "Ava", "Pune", "40"], ["102", "Ava", "Pune", "15"], ["103", "Ava", "Pune", "60"]], { cw: [80, 90, 130, 90], rh: 28, hl: {} });
      b += `<rect x="190" y="62" width="130" height="84" rx="4" style="fill:none;stroke:${C.badS};stroke-width:2.4"/>`;
      b += t(406, 100, "city copied", { size: 12.5, fill: C.badT, a: "start", bold: true });
      b += t(406, 116, "3 times", { size: 12.5, fill: C.badT, a: "start", bold: true });
      b += arrow(240, 156, 240, 190, { label: "split by what each column depends on", dx: 0, dy: -4 });
      b += table(20, 214, ["cust", "cust_city"], [["Ava", "Pune"]], { cw: [90, 130], rh: 28, title: "customers", hl: { 0: "good" } });
      b += table(260, 214, ["order", "cust", "amount"], [["101", "Ava", "40"], ["102", "Ava", "15"], ["103", "Ava", "60"]], { cw: [70, 70, 70], rh: 28, title: "orders" });
      b += arrow(256, 256, 232, 256, { stroke: C.accS });
      b += t(130, 310, "city stored once", { size: 12.5, fill: C.goodT, bold: true });
      b += t(240, 346, "cust_city depends on cust, not on the order, so it moves out.", { size: 12.5, fill: C.dim });
      return svg(480, 362, b, "Normalization splits a table so a repeated fact is stored once");
    },
    caption: "The city depended on the customer, not the order. Moving it to its own table stores it once.",
    oneline: "Normalization stores every fact in one place, so fixing it once fixes it everywhere.",
  };

  /* ---------------------------------------------------------------- sql-views */
  P["sql-views"] = {
    simple: [
      "A **view** is a saved query with a name. You can read it like a table, but it holds no data. Each time you read it, its query runs again on fresh data.",
      "A **materialized view** saves the **answer** too. Reading it is fast, but it shows the data as of its last refresh.",
      "Views hide messy joins and can hide private columns. Materialized views trade freshness for speed.",
    ],
    analogy: {
      text: "Think of a recipe card versus a cake in the fridge.",
      left: "In the kitchen", right: "In SQL",
      map: [
        ["A recipe card with a name: \"chocolate cake\"", "A view: a named, saved query"],
        ["Bake from the card every time someone asks", "Reading a view runs its query on today's tables"],
        ["A cake baked this morning, kept in the fridge", "A materialized view: stored results"],
        ["The fridge cake doesn't know about the new eggs", "Stale until `REFRESH MATERIALIZED VIEW`"],
        ["Show guests the cake, not the pantry", "Grant access to the view, not the base tables"],
      ],
      breaks: "a recipe card can't get faster. Some warehouses keep materialized views up to date automatically, and some databases rewrite a query to use one, so the details depend on the engine.",
    },
    svg: () => {
      let b = t(120, 24, "View: runs on every read", { bold: true, size: 14 }) + t(360, 24, "Materialized: stored answer", { bold: true, size: 14 });
      b += box(30, 40, 180, 40, "orders + customers", "base tables", "plain", { size: 13.5 });
      b += box(30, 120, 180, 44, "VIEW (just SQL)", "no data stored", "acc", { size: 14, size2: 12 });
      b += box(30, 204, 180, 40, "SELECT * FROM view", null, "plain", { mono: true, size: 13 });
      b += arrow(120, 82, 120, 118, { label: "query runs", dx: 46, dy: 4 }) + arrow(120, 166, 120, 202, { label: "fresh rows", dx: 44, dy: 4 });
      b += box(270, 40, 180, 40, "orders + customers", "base tables", "plain", { size: 13.5 });
      b += box(270, 120, 180, 44, "MATERIALIZED VIEW", "rows saved on disk", "good", { size: 13.5, size2: 12 });
      b += box(270, 204, 180, 40, "SELECT * FROM mv", null, "plain", { mono: true, size: 13 });
      b += arrow(360, 82, 360, 118, { label: "REFRESH only", dx: 50, dy: 4, stroke: C.warnS, lfill: C.warnT, dash: true }) + arrow(360, 166, 360, 202, { label: "fast, maybe old", dx: 52, dy: 4 });
      b += t(240, 286, "View = always current, costs a full query each read.", { size: 12.5, fill: C.dim });
      b += t(240, 306, "Materialized = quick to read, current only as of the last refresh.", { size: 12.5, fill: C.dim });
      return svg(480, 322, b, "A view re-runs its query on each read; a materialized view stores results until refreshed");
    },
    caption: "Left: the query runs on every read. Right: the answer is stored, and only a refresh brings it up to date.",
    oneline: "A view is a saved question that is asked again each time, and a materialized view is a saved answer.",
  };

  /* ---------------------------------------------------------------- sql-stored-procedures */
  P["sql-stored-procedures"] = {
    simple: [
      "Databases can store small programs and run them right next to the data.",
      "A **stored procedure** is a named set of steps you start with `CALL`, such as \"copy old orders to the archive, then delete them\". A **function** takes inputs and returns a value you can use inside a query.",
      "A **trigger** runs by itself whenever a row is inserted, updated or deleted. Triggers are powerful but easy to forget, which makes bugs hard to find.",
    ],
    analogy: {
      text: "Think of the routines in a school office.",
      left: "In the school office", right: "In the database",
      map: [
        ["A written routine: \"end of term: file reports, then clear trays\"", "A stored procedure: `CALL archive_old_orders(...)`"],
        ["A calculator rule: give it marks, get a grade", "A function (UDF): `SELECT grade(marks)`"],
        ["A bell that rings whenever the gate opens", "A trigger on `INSERT` / `UPDATE` / `DELETE`"],
        ["New staff don't know the bell exists", "Hidden logic: hard to test, version and debug"],
      ],
      breaks: "office routines are written on paper anyone can read. Database code often lives outside your git repo and CI, so data teams usually keep transformations in versioned SQL (for example dbt) instead.",
    },
    svg: () => {
      let b = "";
      b += box(20, 30, 200, 50, "CALL archive_old_orders()", "you start it", "acc", { mono: true, size: 12.5, size2: 12.5 });
      b += arrow(120, 82, 120, 108);
      b += box(20, 110, 200, 104, null, null, "plain");
      b += t(120, 134, "BEGIN", { mono: true, size: 13, fill: C.accT, bold: true });
      b += t(120, 158, "INSERT INTO archive ...", { mono: true, size: 12, fill: C.tx });
      b += t(120, 180, "DELETE FROM orders ...", { mono: true, size: 12, fill: C.tx });
      b += t(120, 202, "END", { mono: true, size: 13, fill: C.accT, bold: true });
      b += box(260, 30, 200, 50, "UPDATE orders SET ...", "an app changes a row", "plain", { mono: true, size: 12.5, size2: 12.5 });
      b += arrow(360, 82, 360, 108, { label: "fires", dx: 24, dy: 4, stroke: C.warnS, lfill: C.warnT });
      b += box(260, 110, 200, 50, "TRIGGER audit_change", "runs automatically", "warn", { mono: true, size: 12.5, size2: 12.5 });
      b += arrow(360, 162, 360, 188);
      b += box(260, 190, 200, 40, "INSERT INTO audit_log", null, "plain", { mono: true, size: 12.5 });
      b += t(240, 268, "Procedure: you decide when it runs.", { size: 13, fill: C.tx });
      b += t(240, 290, "Trigger: a data change decides, which is easy to forget.", { size: 12.5, fill: C.dim });
      return svg(480, 306, b, "A stored procedure runs when called; a trigger fires automatically on a data change");
    },
    caption: "A procedure is started on purpose. A trigger is started by a change to a row.",
    oneline: "Stored procedures and functions are programs kept inside the database, and triggers run them by themselves when data changes.",
  };

  /* ---------------------------------------------------------------- sql-indexes-internals */
  P["sql-indexes-internals"] = {
    simple: [
      "Without help, finding one row means reading the **whole table**, like flipping every page of a book to find one word.",
      "An **index** is a separate, sorted list of one column's values, each pointing to where its row lives. Most indexes are **B-trees**: short, wide trees where each step narrows the search a lot.",
      "Even a billion rows need only a few steps. The price: every insert and update must also fix the index, and indexes take disk space.",
    ],
    analogy: {
      text: "Think of the index at the back of a textbook.",
      left: "The textbook", right: "In the database",
      map: [
        ["Reading every page to find \"volcano\"", "A full table scan"],
        ["The index at the back, in A to Z order", "A B-tree index on one column"],
        ["Jump to V, then to \"vo\", then to the entry", "Walking down the tree levels"],
        ["The entry says \"page 214\"", "A pointer to the row on disk"],
        ["Adding a page means updating the index too", "The write cost of every index"],
      ],
      breaks: "a book index has one level. A B-tree has several, and each node holds hundreds of keys, so the tree stays only 3 or 4 levels deep even for huge tables.",
    },
    svg: () => {
      let b = t(240, 22, "B-tree: find customer_id = 4521", { bold: true, size: 14 });
      b += box(150, 36, 180, 40, "root: < 3000 | ≥ 3000", null, "vio", { size: 13 });
      b += box(30, 120, 180, 40, "< 3000 ...", null, "plain", { size: 13 });
      b += box(250, 120, 210, 40, "3000-4499 | 4500-5999 | 6000+", null, "acc", { size: 12 });
      b += arrow(200, 78, 140, 118, { stroke: C.line }) + arrow(280, 78, 350, 118, { stroke: C.accS, sw: 2.4 });
      b += box(200, 204, 120, 40, "3000-4499", null, "plain", { size: 13 });
      b += box(340, 204, 120, 40, "4500-5999", "leaf: 4521 here", "good", { size: 13, size2: 11 });
      b += arrow(340, 162, 260, 202) + arrow(380, 162, 400, 202, { stroke: C.accS, sw: 2.4 });
      b += arrow(400, 246, 400, 280, { label: "row pointer", dx: -46, dy: 4, stroke: C.goodS, lfill: C.goodT });
      b += box(300, 282, 160, 36, "row on disk", null, "good", { size: 13 });
      b += box(20, 210, 160, 98, null, null, "ghost", { dash: true });
      b += t(100, 236, "3 hops", { size: 15, bold: true, fill: C.accT });
      b += t(100, 258, "instead of reading", { size: 12.5, fill: C.dim });
      b += t(100, 276, "every row", { size: 12.5, fill: C.dim });
      return svg(480, 334, b, "A B-tree lookup walks from the root to a leaf in a few hops");
    },
    caption: "Each level picks one branch. A leaf holds the key and a pointer to the full row.",
    ix: el => {
      const fan = 300, perPage = 100;
      slider(el, { label: "Rows in the table (10 to the power of):", min: 3, max: 10, value: 6, fmt: v => "10^" + v }, e => {
        const n = Math.pow(10, e), depth = Math.max(1, Math.ceil(Math.log(n) / Math.log(fan))), pages = Math.ceil(n / perPage);
        const lg = Math.log10(pages);
        let b = t(240, 22, `${n.toLocaleString("en-US")} rows`, { bold: true, size: 15 });
        b += t(20, 58, "Full scan", { a: "start", size: 13, fill: C.badT, bold: true });
        b += `<rect x="130" y="44" width="${(lg / 8 * 320).toFixed(1)}" height="22" rx="4" style="fill:${C.bad};stroke:${C.badS}"/>`;
        b += t(130 + lg / 8 * 320 + 6 > 400 ? 470 : 136 + lg / 8 * 320, 82, pages.toLocaleString("en-US") + " pages", { a: lg / 8 * 320 + 136 > 400 ? "end" : "start", size: 12.5, fill: C.tx });
        b += t(20, 118, "B-tree", { a: "start", size: 13, fill: C.goodT, bold: true });
        b += `<rect x="130" y="104" width="${Math.max(4, Math.log10(depth + 1) / 8 * 320).toFixed(1)}" height="22" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
        b += t(150, 142, `${depth + 1} pages (${depth} level${depth > 1 ? "s" : ""} + the row)`, { a: "start", size: 12.5, fill: C.tx });
        for (let i = 0; i < depth; i++) b += box(30 + i * 60, 160, 50, 26, "L" + (i + 1), null, "acc", { size: 12 });
        b += t(240, 214, "bar length is on a log scale: each step right = 10x more pages", { size: 11.5, fill: C.faint });
        return { svg: svg(480, 228, b, "Pages read by a full scan versus a B-tree lookup"), note: `A scan reads about <b>${pages.toLocaleString("en-US")}</b> pages; the index reads about <b>${depth + 1}</b>. Model: ${perPage} rows per page and ${fan} keys per index page (real numbers depend on row and key size).` };
      });
    },
    oneline: "An index is a sorted signpost tree that finds a row in a few hops instead of reading the whole table.",
  };

  /* ---------------------------------------------------------------- sql-transactions */
  const ISO = {
    "READ UNCOMMITTED": [true, true, true],
    "READ COMMITTED": [false, true, true],
    "REPEATABLE READ": [false, false, true],
    "SERIALIZABLE": [false, false, false],
  };
  P["sql-transactions"] = {
    simple: [
      "A **transaction** wraps several changes into one all-or-nothing package. A bank transfer takes money out of one account **and** puts it into another. It must never do only half.",
      "The rules are called **ACID**: Atomic (all or nothing), Consistent (rules still hold), Isolated (people working at the same time don't trip over each other), Durable (once saved, it stays saved even after a crash).",
      "**Isolation levels** choose how strictly people are kept apart. Stricter is safer but can be slower.",
    ],
    analogy: {
      text: "Think of a shared notebook that a whole class edits.",
      left: "The class notebook", right: "In the database",
      map: [
        ["Write your changes in pencil, then ink them all at once", "`BEGIN` ... `COMMIT`"],
        ["Rub out the pencil if you change your mind", "`ROLLBACK`"],
        ["Peeking at a friend's pencil notes before they ink them", "Dirty read"],
        ["Reading a line twice and it changed in between", "Non-repeatable read"],
        ["Counting names twice and a new name appeared", "Phantom read"],
        ["Each student gets a photocopy taken when they start", "MVCC snapshots (used by PostgreSQL and others)"],
      ],
      breaks: "a notebook has one copy. Databases keep several versions of a row so readers don't block writers, and each database bends the standard levels a bit (PostgreSQL treats READ UNCOMMITTED as READ COMMITTED).",
    },
    svg: () => {
      let b = t(240, 22, "Transfer 100 from account 1 to account 2", { bold: true, size: 14 });
      b += box(20, 40, 140, 36, "BEGIN", null, "acc", { mono: true, size: 14 });
      b += arrow(162, 58, 186, 58);
      b += box(190, 40, 270, 36, "UPDATE acct 1: −100", null, "plain", { mono: true, size: 13 });
      b += arrow(325, 78, 325, 96);
      b += box(190, 98, 270, 36, "UPDATE acct 2: +100", null, "plain", { mono: true, size: 13 });
      b += arrow(325, 136, 260, 162, { stroke: C.goodS }) + arrow(325, 136, 400, 162, { stroke: C.badS });
      b += box(170, 164, 140, 50, "COMMIT", "both saved", "good", { mono: true, size: 14, size2: 12 });
      b += box(330, 164, 130, 50, "crash / ROLLBACK", "neither saved", "bad", { size: 13, size2: 12 });
      b += t(90, 186, "never half", { size: 13, fill: C.warnT, bold: true });
      b += t(90, 204, "a transfer", { size: 13, fill: C.warnT, bold: true });
      b += line(20, 236, 460, 236, { stroke: "#2b3446" });
      b += t(240, 260, "ACID: Atomic · Consistent · Isolated · Durable", { size: 13.5, fill: C.tx, bold: true });
      b += t(240, 282, "Stricter isolation blocks more anomalies, at some speed cost.", { size: 12.5, fill: C.dim });
      return svg(480, 298, b, "A transaction either commits all its changes or rolls them all back");
    },
    caption: "Both updates land together at COMMIT, or neither lands at all.",
    ix: el => {
      const lv = Object.keys(ISO);
      choice(el, { label: "Isolation level:", options: lv, value: 1 }, i => {
        const a = ISO[lv[i]], names = ["Dirty read", "Non-repeatable read", "Phantom read"], desc = ["see uncommitted changes", "a row changes between two reads", "new rows appear between two reads"];
        let b = t(240, 24, "SET TRANSACTION ISOLATION LEVEL " + lv[i], { mono: true, size: 12.5, fill: C.tx });
        names.forEach((n, j) => {
          const y = 44 + j * 60;
          b += box(30, y, 230, 46, n, desc[j], "plain", { size: 14, size2: 12 });
          b += arrow(262, y + 23, 290, y + 23);
          b += box(294, y, 160, 46, a[j] ? "can happen" : "prevented", null, a[j] ? "bad" : "good", { size: 14 });
        });
        b += t(240, 240, "Per the SQL standard. Engines may be stricter than this.", { size: 12, fill: C.faint });
        const notes = [
          "Fastest, least safe. PostgreSQL silently runs it as READ COMMITTED.",
          "The default in PostgreSQL, Oracle and SQL Server. Each statement sees data committed before it started.",
          "The default in MySQL InnoDB. PostgreSQL's REPEATABLE READ also blocks phantoms, because it uses one snapshot.",
          "Behaves as if transactions ran one at a time. Some may fail and must be retried.",
        ];
        return { svg: svg(480, 256, b, "Anomalies allowed at " + lv[i]), note: notes[i] };
      });
    },
    oneline: "A transaction makes several changes count as one, so they all happen or none do.",
  };

  /* ---------------------------------------------------------------- sql-explain-optimize */
  P["sql-explain-optimize"] = {
    simple: [
      "You write SQL to say **what** you want. The database's **optimizer** decides **how** to get it: which index to use, which table to read first, how to join.",
      "`EXPLAIN` shows that plan. `EXPLAIN ANALYZE` actually runs the query and shows real times and row counts next to the guesses.",
      "Read the plan from the innermost step outward. Look for the slowest step, and for places where the guessed row count is far from the real one.",
    ],
    analogy: {
      text: "Think of a phone map app planning your route to school.",
      left: "The map app", right: "In the database",
      map: [
        ["\"Get me to school\"", "Your SQL query (what, not how)"],
        ["The app picks roads and turns", "The optimizer builds a plan"],
        ["Preview the route before you leave", "`EXPLAIN` (estimated plan)"],
        ["Drive it and record each leg's time", "`EXPLAIN ANALYZE` (real timings)"],
        ["The app thinks a road is empty, but it's jammed", "Bad estimate from stale statistics: run `ANALYZE`"],
        ["Taking the motorway instead of side streets", "Index scan instead of a full scan"],
      ],
      breaks: "a map app learns traffic live. A database only knows what its statistics say, so after big loads you may need to refresh them yourself.",
    },
    svg: () => {
      let b = t(240, 22, "A plan is a tree. Rows flow upward.", { bold: true, size: 14 });
      b += box(150, 36, 180, 44, "Sort", "actual 12 ms", "plain", { size: 14, size2: 12 });
      b += box(150, 112, 180, 44, "Hash Join", "actual 40 ms", "acc", { size: 14, size2: 12 });
      b += box(20, 196, 200, 54, "Seq Scan orders", "est 1,000 · actual 4,800,000", "bad", { size: 14, size2: 12 });
      b += box(260, 196, 200, 54, "Index Scan customers", "est 120 · actual 118", "good", { size: 13.5, size2: 12 });
      b += arrow(120, 194, 210, 158, { stroke: C.badS, sw: 2.6 }) + arrow(360, 194, 270, 158);
      b += arrow(240, 110, 240, 82);
      b += t(120, 276, "slow step, and the estimate", { size: 12.5, fill: C.badT });
      b += t(120, 294, "is 4,800x off: stale stats?", { size: 12.5, fill: C.badT });
      b += t(360, 276, "estimate close to real: fine", { size: 12.5, fill: C.goodT });
      return svg(480, 312, b, "An EXPLAIN ANALYZE plan tree with a bad row estimate on a sequential scan");
    },
    caption: "Start at the leaves. The red scan is slow and its guess is far from reality, so check statistics and indexes there first.",
    oneline: "EXPLAIN shows the route the database chose, so you can find the slow step instead of guessing.",
  };

  /* ---------------------------------------------------------------- sql-interview-prep */
  P["sql-interview-prep"] = {
    simple: [
      "This page gathers the whole SQL track for a quick review before an interview.",
      "Most SQL interview questions are a handful of patterns in disguise: top-N per group, rows with no match, running totals, removing duplicates, and gaps between dates.",
      "If you can say **which pattern** a question is, and why the clauses run in their real order, you can solve most of them on a whiteboard.",
    ],
    analogy: {
      text: "Think of a cricket batter's practice: a few strokes, drilled until they are automatic.",
      left: "Practice nets", right: "SQL interview",
      map: [
        ["The cover drive", "Top-N per group: `ROW_NUMBER() OVER (PARTITION BY ...)`, keep `rn <= N`"],
        ["Leaving the ball outside off", "Anti-join: `LEFT JOIN ... WHERE b.id IS NULL` or `NOT EXISTS`"],
        ["Rotating the strike", "Running totals: `SUM() OVER (ORDER BY ...)`"],
        ["Playing the same ball once", "Dedup: `ROW_NUMBER()` and keep `rn = 1`"],
        ["Judging the gap between fielders", "Gaps and islands: `LAG()` or `date − ROW_NUMBER()`"],
      ],
      breaks: "in the nets you know which ball is coming. In an interview you must first spot the pattern, so practise naming it out loud before writing any SQL.",
    },
    svg: () => {
      let b = t(240, 22, "Spot the pattern, then reach for the tool", { bold: true, size: 14 });
      const P5 = [["\"top 3 per category\"", "ROW_NUMBER + PARTITION BY"], ["\"customers with no orders\"", "NOT EXISTS / anti-join"], ["\"running total per day\"", "SUM() OVER (ORDER BY day)"], ["\"keep the latest record\"", "ROW_NUMBER ... rn = 1"], ["\"streaks of login days\"", "gaps & islands with LAG"]];
      P5.forEach(([q, a], i) => {
        const y = 38 + i * 52;
        b += box(16, y, 200, 40, q, null, "plain", { size: 13, bold: false });
        b += arrow(218, y + 20, 246, y + 20);
        b += box(250, y, 214, 40, a, null, "acc", { mono: true, size: 12 });
      });
      b += t(240, 312, "Always remember: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY", { size: 11.5, fill: C.dim, mono: true });
      return svg(480, 326, b, "Five common SQL interview question patterns and the technique for each");
    },
    caption: "Each interview question on the left is one of a few patterns; the right column is the tool.",
    oneline: "Most SQL interviews are five or six patterns in disguise, so learn to name the pattern first.",
  };
})();
