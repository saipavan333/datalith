/* Datalith pass 2 — Track 2: Database Systems (DBMS). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- dbms-what */
  P["dbms-what"] = {
    simple: [
      "You could keep data in plain files. Soon each app has its own copy, the copies disagree, two people saving at once overwrite each other, and a crash mid-save corrupts the file.",
      "A **DBMS** (Database Management System) is software that sits between the apps and the data and solves all of that.",
      "It keeps one shared copy, checks rules on every change, lets many users work at once safely, answers questions in a query language, and recovers after crashes.",
    ],
    analogy: {
      text: "Think of a library with a librarian versus a pile of books on the floor.",
      left: "The library", right: "DBMS",
      map: [
        ["Everyone keeps their own photocopies", "Files per app: duplication, disagreement"],
        ["One shared collection", "One managed database"],
        ["The librarian checks books in and out", "Concurrency control"],
        ["\"No book without a barcode\"", "Integrity constraints"],
        ["The catalogue to find any book", "Query language and indexes"],
        ["A logbook that survives a fire drill", "Logging and crash recovery"],
      ],
      breaks: "a librarian serves one visitor at a time. A DBMS serves thousands at once, which is why so much of it is about concurrency and recovery.",
    },
    svg: () => {
      let b = t(120, 22, "Files", { bold: true, size: 14 }) + t(360, 22, "DBMS", { bold: true, size: 14 });
      ["App A", "App B", "App C"].forEach((a, i) => {
        b += box(20, 40 + i * 56, 80, 40, a, null, "plain", { size: 13 });
        b += arrow(102, 60 + i * 56, 132, 60 + i * 56);
        b += box(136, 40 + i * 56, 84, 40, "copy " + (i + 1), null, "bad", { size: 12.5 });
      });
      b += t(120, 222, "copies drift apart", { size: 12.5, fill: C.badT });
      ["App A", "App B", "App C"].forEach((a, i) => {
        b += box(250, 40 + i * 56, 80, 40, a, null, "plain", { size: 13 });
        b += arrow(332, 60 + i * 56, 366, 108, { stroke: C.accS, sw: 1.4 });
      });
      b += box(370, 70, 96, 80, "DBMS", "one copy", "good", { size: 15, size2: 12 });
      b += t(360, 222, "rules · locks · log · SQL", { size: 12.5, fill: C.goodT });
      return svg(480, 240, b, "Separate files per app versus one shared DBMS");
    },
    caption: "Left: each app owns its own file. Right: every app goes through one DBMS that guards one copy.",
    oneline: "A DBMS is the librarian between your apps and your data: one shared copy, with rules, safe sharing and crash recovery.",
  };

  /* ---------------------------------------------------------------- dbms-types */
  P["dbms-types"] = {
    simple: [
      "There isn't one kind of database. Each family is shaped for a different kind of data and question.",
      "**Relational** databases use tables and SQL. **Document** stores keep JSON-like documents. **Key-value** stores fetch a value by its key, very fast. **Column-family** (wide-column) stores spread huge tables over many machines. **Graph** databases store things and the links between them.",
      "Newer families include **time-series** (metrics over time) and **vector** databases (search by meaning for AI).",
    ],
    analogy: {
      text: "Think of different ways to store things at home.",
      left: "At home", right: "Database family",
      map: [
        ["A filing cabinet with labelled folders and forms", "Relational (PostgreSQL, MySQL)"],
        ["A drawer of notebooks, each written differently", "Document (MongoDB)"],
        ["Hooks by the door, one key per hook", "Key-value (Redis)"],
        ["A huge warehouse of shelves by row number", "Wide-column (Cassandra, Bigtable)"],
        ["A family tree on the wall", "Graph (Neo4j)"],
        ["A thermometer log, one reading a minute", "Time-series"],
      ],
      breaks: "homes keep each thing in one place. Real systems often use several databases together, each for the access pattern it is best at (polyglot persistence).",
    },
    svg: () => {
      const T = [["Relational", "tables + SQL", "acc"], ["Document", "JSON documents", "good"], ["Key-value", "get(key) → value", "warn"], ["Wide-column", "rows spread over nodes", "vio"], ["Graph", "nodes + edges", "acc"], ["Time-series", "values over time", "good"]];
      let b = "";
      T.forEach(([n, s, k], i) => {
        const x = 16 + (i % 2) * 230, y = 16 + Math.floor(i / 2) * 74;
        b += box(x, y, 218, 60, n, s, k, { size: 15, size2: 12.5 });
      });
      b += t(240, 248, "Pick by data shape and access pattern, not by fashion.", { size: 12.5, fill: C.dim });
      return svg(480, 264, b, "Six families of database systems");
    },
    caption: "Six families. Each stores data in the shape its typical question needs.",
    oneline: "Different databases suit different data shapes: tables, documents, key lookups, wide rows, graphs or time series.",
  };

  /* ---------------------------------------------------------------- dbms-architecture */
  P["dbms-architecture"] = {
    simple: [
      "Inside a database are a few parts that pass your query along like a relay team.",
      "The **parser** checks your SQL. The **optimizer** picks the cheapest way to run it. The **executor** runs that plan.",
      "Underneath, the **storage engine** reads and writes pages on disk, the **buffer pool** keeps busy pages in memory, the **transaction manager** handles locks and the log, and the **catalog** records which tables and columns exist.",
    ],
    analogy: {
      text: "Think of a restaurant taking and filling an order.",
      left: "The restaurant", right: "DBMS component",
      map: [
        ["The waiter checks the order makes sense", "Parser (syntax, names)"],
        ["The head chef decides how to cook it fastest", "Optimizer (cost-based plan)"],
        ["Line cooks do the steps", "Executor"],
        ["The menu and the stock list", "Catalog (metadata)"],
        ["Ingredients kept on the counter", "Buffer pool (pages in memory)"],
        ["The cold store out back", "Disk (storage engine)"],
        ["The order book that survives a power cut", "Transaction manager and log"],
      ],
      breaks: "a kitchen has one head chef. A database plans each query in milliseconds using statistics, and a wrong estimate can pick a terrible plan.",
    },
    svg: () => {
      let b = box(160, 10, 160, 34, "SQL query", null, "plain", { mono: true, size: 13 });
      const Q = [["Parser", "syntax + names"], ["Optimizer", "cheapest plan"], ["Executor", "runs the plan"]];
      Q.forEach(([a, s], i) => { b += box(140, 60 + i * 56, 200, 42, a, s, "acc", { size: 14, size2: 11.5 }); b += arrow(240, (i ? 102 + (i - 1) * 56 : 44), 240, 58 + i * 56); });
      b += box(10, 60, 110, 42, "Catalog", "tables, stats", "vio", { size: 13, size2: 11 });
      b += arrow(122, 81, 138, 81, { stroke: C.vioS }) + arrow(122, 90, 138, 132, { stroke: C.vioS });
      b += box(360, 116, 110, 42, "Txn manager", "locks · log", "warn", { size: 12.5, size2: 11 });
      b += arrow(358, 137, 342, 180, { stroke: C.warnS });
      b += arrow(240, 214, 240, 232);
      b += box(140, 234, 200, 42, "Buffer pool", "hot pages in RAM", "good", { size: 14, size2: 11.5 });
      b += arrow(240, 278, 240, 296, { label: "miss", dx: 20, dy: 4 });
      b += box(140, 298, 200, 36, "Disk pages + WAL", null, "plain", { size: 13 });
      return svg(480, 346, b, "Query flow through parser, optimizer, executor, buffer pool and disk");
    },
    caption: "A query flows down: parsed, planned, executed, then served from memory or, on a miss, from disk.",
    oneline: "Inside a database, a query is checked, planned, run, and fed pages from memory or disk, with a log guarding every change.",
  };

  /* ---------------------------------------------------------------- dbms-three-schema */
  P["dbms-three-schema"] = {
    simple: [
      "A database is described at three levels, so a change at one level doesn't break the others.",
      "The **external** level is what each user or app sees: their own view. The **conceptual** level is the full logical design: all tables, columns and rules. The **internal** level is how data is physically stored: files, pages and indexes.",
      "This gives **data independence**: you can add an index or move files (internal) without changing apps, and add a column (conceptual) without breaking views that don't use it.",
    ],
    analogy: {
      text: "Think of a car.",
      left: "The car", right: "Schema level",
      map: [
        ["The dashboard and steering wheel the driver sees", "External level (views per user)"],
        ["The car's design: engine, gears, brakes", "Conceptual level (logical schema)"],
        ["The exact bolts and wiring", "Internal level (storage, indexes)"],
        ["Swap the engine; driving feels the same", "Physical data independence"],
        ["Add a seat; the dashboard still works", "Logical data independence"],
      ],
      breaks: "car parts are fixed at the factory. Logical independence is harder in practice: renaming or dropping a column still breaks the views that use it.",
    },
    svg: () => {
      let b = "";
      ["Sales view", "HR view", "App view"].forEach((v, i) => { b += box(20 + i * 152, 20, 136, 40, v, null, "acc", { size: 13.5 }); b += arrow(88 + i * 152, 62, 240, 104, { stroke: C.accS, sw: 1.4 }); });
      b += t(14, 86, "external", { size: 12, fill: C.accT, a: "start", bold: true });
      b += box(110, 106, 260, 50, "Conceptual schema", "all tables · keys · constraints", "vio", { size: 14.5, size2: 12 });
      b += arrow(240, 158, 240, 190, { label: "mapping", dx: 34, dy: 4 });
      b += box(110, 192, 260, 50, "Internal schema", "files · pages · indexes", "plain", { size: 14.5, size2: 12 });
      b += t(240, 274, "Change the bottom without touching the top.", { size: 12.5, fill: C.goodT });
      return svg(480, 290, b, "External, conceptual and internal schema levels");
    },
    caption: "Views on top, the logical design in the middle, physical storage at the bottom, with mappings between them.",
    oneline: "Three layers (views, design, storage) let you change how data is stored without breaking the apps on top.",
  };

  /* ---------------------------------------------------------------- dbms-transactions-acid */
  P["dbms-transactions-acid"] = {
    simple: [
      "A **transaction** is a group of changes that must happen completely or not at all. Moving money from one account to another is the classic case.",
      "**ACID** names the four promises: **Atomicity** (all or nothing), **Consistency** (the rules still hold afterwards), **Isolation** (transactions running together don't see each other's half-done work), **Durability** (once committed, it survives crashes).",
      "You start with `BEGIN`, end with `COMMIT` to keep everything, or `ROLLBACK` to undo everything.",
    ],
    analogy: {
      text: "Think of swapping trading cards with a friend.",
      left: "Swapping cards", right: "ACID",
      map: [
        ["Both cards change hands, or neither", "Atomicity"],
        ["Each still has the same number of cards", "Consistency (rules hold)"],
        ["Other kids can't grab a card mid-swap", "Isolation"],
        ["Once swapped, it stays swapped tomorrow", "Durability"],
        ["\"Deal!\"", "`COMMIT`"],
        ["\"Changed my mind\"", "`ROLLBACK`"],
      ],
      breaks: "a card swap involves two kids. A database runs thousands of transactions at once, so isolation is a spectrum of levels, not a simple yes or no.",
    },
    svg: () => P["sql-transactions"].svg(),
    caption: "Both updates land together at COMMIT, or a crash or ROLLBACK undoes both.",
    oneline: "A transaction is an all-or-nothing package of changes, and ACID is the four promises that keep it safe.",
  };

  /* ---------------------------------------------------------------- dbms-concurrency */
  P["dbms-concurrency"] = {
    simple: [
      "Many people use a database at the same moment. Without care, one person can read another's half-finished change, or two updates can overwrite each other.",
      "There are two main fixes. **Locking**: a transaction locks the rows it touches, and others wait. **MVCC** (Multi-Version Concurrency Control): the database keeps old versions of rows, so readers see a consistent snapshot while writers make new versions.",
      "**Isolation levels** choose how strict to be. Stricter means fewer surprises but more waiting or retries.",
    ],
    analogy: {
      text: "Think of a shared whiteboard in a classroom.",
      left: "The whiteboard", right: "Concurrency control",
      map: [
        ["\"Hands off while I'm writing\"", "Locks: others wait"],
        ["Everyone gets a photo of the board when they start", "MVCC snapshot"],
        ["The writer keeps writing; readers use their photo", "Readers don't block writers"],
        ["Two students erase the same spot", "Write-write conflict: one must wait or retry"],
        ["Old photos thrown away at the end of the day", "Vacuum / cleanup of old versions"],
      ],
      breaks: "photos cost nothing. Old row versions take disk space and must be cleaned up, or tables bloat.",
    },
    svg: () => {
      let b = t(240, 22, "MVCC: one row, several versions", { bold: true, size: 14 });
      b += box(20, 40, 200, 44, "v1: balance 500", "committed at t1", "plain", { size: 13.5, size2: 11.5 });
      b += box(260, 40, 200, 44, "v2: balance 400", "written by T2 at t3", "warn", { size: 13.5, size2: 11.5 });
      b += arrow(222, 62, 256, 62);
      b += box(20, 120, 200, 46, "T1 snapshot at t2", "reads v1 = 500", "acc", { size: 13.5, size2: 12 });
      b += box(260, 120, 200, 46, "T3 snapshot at t4", "reads v2 = 400", "good", { size: 13.5, size2: 12 });
      b += arrow(120, 118, 120, 86, { stroke: C.accS }) + arrow(360, 118, 360, 86, { stroke: C.goodS });
      b += t(240, 196, "T1 started before T2 committed, so it keeps seeing 500.", { size: 12.5, fill: C.dim });
      b += t(240, 216, "Nobody waited. Old v1 is cleaned up once no snapshot needs it.", { size: 12.5, fill: C.dim });
      return svg(480, 232, b, "MVCC keeps row versions so each transaction reads its own snapshot");
    },
    caption: "Each transaction reads the version that was committed when its snapshot was taken.",
    ix: el => P["sql-transactions"].ix(el),   // same isolation-level explorer as the SQL track
    oneline: "Databases let many people work at once by locking rows or by handing each reader its own snapshot.",
  };

  /* ---------------------------------------------------------------- dbms-recovery */
  P["dbms-recovery"] = {
    simple: [
      "Computers crash, sometimes in the middle of saving. The database must come back with every committed change kept and every half-done change removed.",
      "The trick is the **write-ahead log** (WAL): before changing the data itself, the database writes what it is about to do into an append-only log, and makes sure the log is safely on disk at `COMMIT`.",
      "After a crash it reads the log: **REDO** replays committed changes that hadn't reached the data files, **UNDO** removes changes from transactions that never committed. **Checkpoints** keep the log short.",
    ],
    analogy: {
      text: "Think of a shop's day book.",
      left: "The day book", right: "Recovery",
      map: [
        ["Write the sale in the book before moving the money", "Write-ahead logging"],
        ["The book is in ink and kept in a safe", "Log flushed to durable storage at COMMIT"],
        ["After a power cut, redo every sale written as \"done\"", "REDO committed transactions"],
        ["Cross out sales never marked \"done\"", "UNDO uncommitted transactions"],
        ["\"Everything up to page 40 is in the till\"", "Checkpoint: recovery starts there"],
      ],
      breaks: "a day book is read by a person. Databases replay thousands of log records per second, and the same log also feeds replicas and change-data-capture tools.",
    },
    svg: () => {
      let b = t(240, 22, "The log is written first, the data files later", { bold: true, size: 14 });
      const L = [["T1 update", "acc"], ["T1 commit", "good"], ["checkpoint", "vio"], ["T2 update", "acc"], ["T3 update", "acc"], ["T3 commit", "good"]];
      L.forEach(([s, k], i) => { b += box(14 + i * 76, 40, 70, 40, s, null, k, { size: 10.5 }); });
      b += arrow(14, 96, 466, 96, { label: "time / log order", dy: 16 });
      b += `<line x1="436" y1="36" x2="436" y2="130" style="stroke:${C.badS};stroke-width:3;stroke-dasharray:6 4"/>`;
      b += t(436, 146, "crash", { size: 13, fill: C.badT, bold: true });
      b += box(20, 170, 210, 50, "REDO T3", "committed, maybe not in data files", "good", { size: 14, size2: 11 });
      b += box(250, 170, 210, 50, "UNDO T2", "never committed", "bad", { size: 14, size2: 11 });
      b += t(240, 250, "T1 finished before the checkpoint, so recovery can skip it.", { size: 12.5, fill: C.dim });
      return svg(480, 266, b, "Recovery after a crash redoes committed work and undoes uncommitted work using the log");
    },
    caption: "After the crash, the log says T3 committed (redo it) and T2 never did (undo it).",
    ix: el => {
      choice(el, { label: "The crash happens:", options: ["before T2 writes COMMIT", "after T2's COMMIT is flushed"], value: 0 }, i => {
        let b = box(20, 20, 140, 40, "T2 update", null, "acc", { size: 13 }) + arrow(162, 40, 190, 40);
        b += box(194, 20, 130, 40, "T2 COMMIT", null, i ? "good" : "ghost", { size: 13, dash: !i });
        b += `<line x1="${i ? 344 : 178}" y1="10" x2="${i ? 344 : 178}" y2="72" style="stroke:${C.badS};stroke-width:3;stroke-dasharray:6 4"/>`;
        b += t(i ? 344 : 178, 88, "crash", { size: 12.5, fill: C.badT, bold: true });
        b += box(60, 104, 360, 50, i ? "Recovery: REDO T2" : "Recovery: UNDO T2", i ? "the change is kept, even if data files lagged" : "the half-done change is removed", i ? "good" : "bad", { size: 14.5, size2: 12 });
        return { svg: svg(480, 170, b, "Recovery outcome"), note: i ? "COMMIT returned only after the log record reached disk, so the database <b>must</b> keep T2: that's durability." : "No COMMIT record in the log, so T2 never happened as far as anyone is concerned: that's atomicity." };
      });
    },
    oneline: "A database writes every change to a log first, so after a crash it can redo what was committed and undo what wasn't.",
  };

  /* ---------------------------------------------------------------- dbms-storage-indexing */
  P["dbms-storage-indexing"] = {
    simple: [
      "A database stores tables on disk in fixed-size blocks called **pages** (for example 8 KB in PostgreSQL). Each page holds many rows.",
      "Reading from memory is thousands of times faster than reading from disk, so the database keeps busy pages in a memory area called the **buffer pool**. Finding a page there is a \"hit\".",
      "An **index** (usually a B-tree) is a sorted structure that points to the pages holding the rows you want, so the database reads a few pages instead of all of them.",
    ],
    analogy: {
      text: "Think of a desk and a filing room.",
      left: "Desk and filing room", right: "Storage engine",
      map: [
        ["Folders of 8 sheets each", "Pages of rows"],
        ["The filing room down the corridor", "Disk"],
        ["The folders open on your desk", "Buffer pool in memory"],
        ["Found it on the desk: no walk", "Buffer-pool hit"],
        ["The drawer label \"A-C\"", "An index pointing to the right pages"],
      ],
      breaks: "a desk holds a few folders. A buffer pool holds gigabytes, and the database chooses which pages to evict when it fills, usually the least recently used.",
    },
    svg: () => {
      let b = box(20, 20, 200, 120, null, null, "good");
      b += t(120, 42, "Buffer pool (RAM)", { bold: true, size: 13.5, fill: C.goodT });
      for (let i = 0; i < 6; i++) b += box(34 + (i % 3) * 62, 56 + Math.floor(i / 3) * 40, 54, 30, "p" + [3, 9, 12, 21, 40, 44][i], null, "plain", { size: 12 });
      b += box(260, 20, 200, 120, null, null, "plain");
      b += t(360, 42, "Disk (all pages)", { bold: true, size: 13.5 });
      for (let i = 0; i < 12; i++) b += `<rect x="${274 + (i % 6) * 30}" y="${56 + Math.floor(i / 6) * 36}" width="24" height="28" rx="3" style="fill:#2b3446;stroke:${C.boxS}"/>`;
      b += arrow(258, 100, 222, 100, { label: "miss: load page", dy: -8 });
      b += box(20, 170, 440, 50, "query → index says: page 21", "hit in RAM: well under 1 µs · miss: read from disk", "acc", { size: 13, size2: 11.5 });
      return svg(480, 236, b, "Buffer pool caches disk pages in memory; misses load from disk");
    },
    caption: "Pages on disk are copied into memory on first use; later reads of the same page are hits.",
    ix: el => {
      slider(el, { label: "Buffer-pool hit rate:", min: 50, max: 100, value: 95, fmt: v => v + "%" }, h => {
        const mem = 0.1, ssd = 100; // microseconds: ~100 ns RAM, ~100 µs SSD random read (order of magnitude)
        const avg = (h / 100) * mem + (1 - h / 100) * ssd;
        let b = t(240, 24, "Average time per page read", { bold: true, size: 14 });
        const w = Math.max(4, Math.min(420, avg / 50 * 420));
        b += `<rect x="30" y="44" width="${w.toFixed(1)}" height="26" rx="5" style="fill:${h > 98 ? C.good : h > 90 ? C.warn : C.bad};stroke:${h > 98 ? C.goodS : h > 90 ? C.warnS : C.badS}"/>`;
        b += t(240, 98, avg.toFixed(1) + " µs", { size: 18, bold: true, fill: C.tx });
        b += t(240, 124, "Model: RAM ≈ 0.1 µs, SSD random read ≈ 100 µs (orders of magnitude)", { size: 11.5, fill: C.faint });
        return { svg: svg(480, 140, b, "Average page read time"), note: `At ${h}% hits the misses dominate: <b>${(100 - h)}%</b> of reads cost about 1,000x more than a hit. Going from 95% to 99% makes reads about <b>${((0.05 * 100 + 0.95 * 0.1) / (0.01 * 100 + 0.99 * 0.1)).toFixed(1)}x</b> faster.` };
      });
    },
    oneline: "Databases store rows in pages, keep busy pages in memory, and use indexes to read only the pages they need.",
  };

  /* ---------------------------------------------------------------- dbms-query-processing */
  P["dbms-query-processing"] = {
    simple: [
      "SQL says **what** you want, not **how** to get it. The database works out the how.",
      "It **parses** the query into a tree, then the **optimizer** imagines many possible plans: which table to read first, which index to use, which join method. It estimates each plan's cost from statistics and keeps the cheapest.",
      "Finally the **executor** runs that plan. The same query can have plans that differ by a factor of 1,000 in speed.",
    ],
    analogy: {
      text: "Think of planning a trip across town with errands.",
      left: "The trip", right: "Query processing",
      map: [
        ["\"Buy milk, post a letter, pick up a parcel\"", "Your SQL (the what)"],
        ["Writing it as a checklist", "Parsing into a query tree"],
        ["Trying different routes in your head", "The optimizer enumerating plans"],
        ["Knowing the post office queue is long at noon", "Statistics (row counts, value spread)"],
        ["Walking the chosen route", "The executor running the plan"],
      ],
      breaks: "you know your town well. If the statistics are stale, the optimizer thinks a table is tiny when it's huge, and picks a bad route with full confidence.",
    },
    svg: () => {
      let b = box(20, 20, 140, 40, "SQL text", null, "plain", { mono: true, size: 13 });
      b += arrow(162, 40, 192, 40, { label: "parse", dy: -8 });
      b += box(196, 20, 120, 40, "query tree", null, "acc", { size: 13 });
      b += arrow(318, 40, 348, 40, { label: "plan", dy: -8 });
      b += box(352, 20, 110, 40, "optimizer", null, "vio", { size: 13 });
      const plans = [["Plan A: scan, hash join", "cost 1,200", "plain"], ["Plan B: index, nested loop", "cost 90", "good"], ["Plan C: scan, nested loop", "cost 48,000", "bad"]];
      plans.forEach(([p, c, k], i) => {
        const y = 90 + i * 52;
        b += box(120, y, 240, 42, p, c, k, { size: 13, size2: 12 });
        b += arrow(407, 62, 362, y + 20, { stroke: C.vioS, sw: 1.2 });
      });
      b += t(60, 160, "picks", { size: 13, fill: C.goodT, bold: true });
      b += t(60, 178, "the", { size: 13, fill: C.goodT, bold: true });
      b += t(60, 196, "cheapest", { size: 13, fill: C.goodT, bold: true });
      b += t(240, 268, "Costs are estimates from table statistics, not timings.", { size: 12.5, fill: C.dim });
      return svg(480, 284, b, "The optimizer compares candidate plans by estimated cost");
    },
    caption: "Parsing gives a tree; the optimizer costs several plans and runs the cheapest one.",
    oneline: "The database turns your SQL into many possible plans, estimates their cost, and runs the cheapest.",
  };

  /* ---------------------------------------------------------------- dbms-security-admin */
  P["dbms-security-admin"] = {
    simple: [
      "A database holds a company's most sensitive data, so it checks two things on every request.",
      "**Authentication** asks \"who are you?\" (a password, single sign-on, a certificate). **Authorization** asks \"what may you do?\": `GRANT SELECT ON orders TO analyst` gives one permission to one role.",
      "A **DBA** (Database Administrator) also handles backups, restores, upgrades, monitoring and tuning. Good practice: give each person only the access they need (least privilege), and test that backups really restore.",
    ],
    analogy: {
      text: "Think of a school building.",
      left: "The school", right: "Database security",
      map: [
        ["Showing your ID card at the gate", "Authentication"],
        ["Your card opens the library but not the staff room", "Authorization (privileges)"],
        ["\"All Year 10 pupils\" get the same access", "Roles: grant to the role, add people to it"],
        ["The caretaker who keeps spare keys and fixes boilers", "The DBA"],
        ["A fire drill to test the escape plan", "Test-restoring a backup"],
      ],
      breaks: "a school locks rooms. Databases can also hide rows and columns within a table (row-level security, column masking), which is finer than any door.",
    },
    svg: () => {
      let b = box(20, 20, 120, 44, "analyst", "logs in", "plain", { size: 14, size2: 12 });
      b += arrow(142, 42, 176, 42, { label: "1. who?", dy: -8 });
      b += box(180, 20, 130, 44, "Authentication", "SSO / password", "acc", { size: 13, size2: 11.5 });
      b += arrow(312, 42, 346, 42, { label: "2. may?", dy: -8 });
      b += box(350, 20, 120, 44, "Authorization", "roles + grants", "vio", { size: 13, size2: 11.5 });
      b += box(20, 100, 210, 40, "SELECT ON orders", null, "good", { mono: true, size: 13 });
      b += box(250, 100, 210, 40, "SELECT ON salaries", null, "bad", { mono: true, size: 13 });
      b += arrow(410, 66, 125, 98, { stroke: C.goodS }) + arrow(410, 66, 355, 98, { stroke: C.badS });
      b += t(125, 162, "allowed", { size: 13, fill: C.goodT, bold: true }) + t(355, 162, "denied", { size: 13, fill: C.badT, bold: true });
      b += t(240, 196, "GRANT SELECT ON orders TO analyst_role;", { mono: true, size: 12.5, fill: C.tx });
      return svg(480, 212, b, "Authentication then authorization decide what a user can query");
    },
    caption: "First prove who you are, then the grants on your role decide which tables you can touch.",
    oneline: "Databases check who you are, then what you're allowed to do, and the DBA keeps it all backed up and running.",
  };

  /* ---------------------------------------------------------------- dbms-interview-prep */
  P["dbms-interview-prep"] = {
    simple: [
      "This page reviews the DBMS track before an interview. These are computer-science basics, asked at every level.",
      "Expect: why a DBMS beats files, the parts inside one, ACID, isolation levels and their anomalies, locks versus MVCC, write-ahead logging, and B-tree indexes.",
      "For each, explain the mechanism in one breath, then the trade-off, then a real example.",
    ],
    analogy: {
      text: "Think of a car mechanic's exam.",
      left: "Mechanic's exam", right: "DBMS interview",
      map: [
        ["Name the engine parts", "Parser, optimizer, executor, buffer pool, log"],
        ["Why brakes have two circuits", "Durability: WAL and replicas"],
        ["How the gearbox avoids grinding", "Concurrency: locks and MVCC"],
        ["Finding a fault from the noise", "Reading a query plan"],
      ],
      breaks: "a car has one owner. Interviewers love \"what happens when two transactions...\" questions, so practise drawing a timeline of two transactions side by side.",
    },
    svg: () => {
      const Q = [["DBMS vs files?", "integrity, concurrency, SQL, recovery"], ["What is ACID?", "all-or-nothing, rules, isolation, durable"], ["Locks vs MVCC?", "wait vs read a snapshot"], ["How does recovery work?", "WAL: redo committed, undo the rest"], ["Why a B-tree?", "few hops; supports ranges and ORDER BY"]];
      let b = t(240, 22, "Five questions you will meet", { bold: true, size: 14 });
      Q.forEach(([q, a], i) => {
        const y = 38 + i * 50;
        b += box(16, y, 180, 40, q, null, "acc", { size: 12.5 });
        b += arrow(198, y + 20, 214, y + 20);
        b += box(218, y, 246, 40, a, null, "plain", { size: 11, bold: false });
      });
      return svg(480, 294, b, "Common DBMS interview questions with short answers");
    },
    caption: "The core of each answer, in one line.",
    oneline: "DBMS interviews test how a database stays correct and fast: ACID, concurrency, logging and indexes.",
  };
})();
