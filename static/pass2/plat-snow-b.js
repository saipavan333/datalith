/* Datalith pass 2 — Track 15: Snowflake (part b: clustering to credits). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- snow-clustering */
  // event_date ranges per micro-partition: loaded by arrival time (messy) vs clustered by date
  const UNCL = [[1, 28], [2, 30], [1, 25], [5, 30], [3, 29], [1, 30], [4, 27], [2, 30]];
  const CL = [[1, 4], [4, 8], [8, 12], [12, 15], [15, 19], [19, 23], [23, 27], [27, 30]];
  const clFig = (clustered) => {
    const parts = clustered ? CL : UNCL, lo = 14, hi = 16;
    let b = t(240, 20, "WHERE event_date BETWEEN 14 AND 16", { bold: true, size: 13.5, mono: true });
    let n = 0;
    parts.forEach(([a, z], i) => {
      const hit = z >= lo && a <= hi; if (hit) n++;
      const x = 14 + (i % 4) * 116, y = 34 + Math.floor(i / 4) * 64;
      b += box(x, y, 104, 54, "MP " + (i + 1), "dates " + a + "-" + z, hit ? "acc" : "ghost", { size: 13, dash: !hit });
    });
    b += box(14, 172, 452, 40, (clustered ? "clustered by event_date: " : "load order, dates mixed: ") + "scan " + n + " of 8", null, n <= 2 ? "good" : "bad", { size: 14 });
    return { b, n };
  };
  P["snow-clustering"] = {
    simple: [
      "Pruning only works when the rows you want sit together in a few micro-partitions.",
      "If a big table arrives in a messy order, every micro-partition holds a wide spread of dates, and a date filter can skip almost nothing.",
      "A **clustering key** (`ALTER TABLE events CLUSTER BY (event_date)`) tells Snowflake to keep rows grouped by that column. A background service reclusters as new data arrives, and it costs credits.",
      "`SYSTEM$CLUSTERING_INFORMATION` reports **average depth**: how many micro-partitions overlap for a value. Lower is better. Small tables rarely need a key.",
    ],
    analogy: {
      text: "Think of a shoe shop's stockroom.",
      left: "Shoe stockroom", right: "Clustering",
      map: [
        ["Boxes stacked as deliveries arrived", "Rows in load order"],
        ["Every shelf has every shoe size", "Every micro-partition spans every date"],
        ["Re-shelving by size", "CLUSTER BY (event_date)"],
        ["A worker who keeps re-shelving new deliveries", "Automatic reclustering (costs credits)"],
        ["\"How many shelves hold size 9?\"", "Clustering depth"],
      ],
      breaks: "re-shelving is a one-off job in a quiet shop. On a table that changes constantly, reclustering never stops, so the credits may cost more than the scans you save.",
    },
    svg: () => svg(480, 226, clFig(false).b, "Unclustered table: a narrow date filter must scan every micro-partition"),
    caption: "In load order, every micro-partition overlaps days 14-16, so nothing is pruned.",
    ix: el => choice(el, { label: "Table layout", options: ["Load order (no key)", "CLUSTER BY event_date"], value: 1 }, i => {
      const r = clFig(i === 1);
      return { svg: svg(480, 226, r.b, "Clustering effect on pruning"), note: i ? `Grouped by date, only <b>${r.n}</b> micro-partitions can hold days 14-16. Average depth is low.` : `Every micro-partition's date range covers 14-16, so all <b>${r.n}</b> are scanned. Average depth is high: a clustering key would help if this table is large and often filtered by date.` };
    }),
    oneline: "A clustering key keeps similar rows together so filters can skip most of a big table.",
  };

  /* ---------------------------------------------------------------- snow-caching */
  const CACHE = [
    ["Same query again, data unchanged", 0, "Result cache hit: the answer comes back instantly, for free, with no warehouse running. It lasts 24 hours."],
    ["Different query, same hot data", 1, "No result-cache match (the text differs), but the warehouse still has those micro-partitions on its local SSD, so it skips the remote read."],
    ["Same query, but table changed", 2, "New data invalidates the result cache. If the warehouse had suspended, its local cache is gone too, so it reads remote storage."],
    ["Warehouse just resumed", 2, "Suspending clears the local disk cache. The first queries after resume read from remote storage (cold), then warm up."],
  ];
  const cacheFig = (i) => {
    const hit = CACHE[i][1];
    let b = box(14, 18, 110, 40, "query", null, "plain", { size: 14 });
    const L = [["1. Result cache", "cloud services, 24 h"], ["2. Local disk cache", "warehouse SSD"], ["3. Remote storage", "always correct"]];
    L.forEach(([n, s], j) => {
      const y = 18 + j * 66, k = j === hit ? (j === 2 ? "warn" : "good") : j < hit ? "ghost" : "plain";
      b += box(190, y, 200, 50, n, s, k, { size: 14, dash: j < hit });
      if (j < 2) b += arrow(290, y + 52, 290, y + 64, { stroke: j < hit ? C.badS : C.faint });
      if (j < hit) b += t(404, y + 30, "miss", { size: 12.5, fill: C.badT, a: "start", bold: true });
      if (j === hit) b += t(404, y + 30, "hit", { size: 13, fill: j === 2 ? C.warnT : C.goodT, a: "start", bold: true });
    });
    b += arrow(126, 38, 188, 40);
    b += t(70, 120, ["instant, free", "fast", "slowest"][hit], { size: 13, bold: true, fill: [C.goodT, C.goodT, C.warnT][hit] });
    return b;
  };
  P["snow-caching"] = {
    simple: [
      "The fastest query is one Snowflake doesn't have to run again. It checks three places in order.",
      "1. The **result cache** keeps finished answers for 24 hours. A word-for-word identical query on unchanged data gets the answer instantly and free, even with the warehouse switched off.",
      "2. The **local disk cache** is the warehouse's own SSD holding micro-partitions it read recently. It's lost when the warehouse suspends.",
      "3. **Remote storage** is the source of truth when neither cache helps.",
    ],
    analogy: {
      text: "Think of answering homework questions.",
      left: "Homework", right: "Snowflake caches",
      map: [
        ["Last night's answer sheet for the same question", "Result cache (identical query, unchanged data)"],
        ["Textbook already open on your desk", "Warehouse local disk cache"],
        ["Walking to the library", "Remote storage"],
        ["Teacher changes the question slightly", "Different query text: no result-cache hit"],
        ["Clearing your desk at bedtime", "Suspend: local cache gone"],
      ],
      breaks: "you'd reuse an answer for a slightly different question. Snowflake won't: the result cache needs the same query and unchanged data, so a dashboard that puts the current time into its SQL never hits it.",
    },
    svg: () => svg(480, 222, cacheFig(0), "Query checking result cache, local disk cache and remote storage in order"),
    caption: "A query tries the cheapest layer first and falls through only on a miss.",
    ix: el => choice(el, { label: "Situation", options: CACHE.map(c => c[0]), value: 0 }, i => ({ svg: svg(480, 222, cacheFig(i), "Which cache layer answers"), note: CACHE[i][2] })),
    oneline: "Snowflake answers from saved results first, then from the warehouse's own disk, and only then from storage.",
  };

  /* ---------------------------------------------------------------- snow-mat-views */
  P["snow-mat-views"] = {
    simple: [
      "A **materialized view** (MV) saves the result of a query and keeps it up to date by itself as the base table changes.",
      "Repeated heavy questions, like daily totals over a billion rows, then read the small saved answer.",
      "The optimizer can even use an MV for a query written against the base table, without you changing the query.",
      "MVs are limited: one table only, no joins, and a restricted set of functions. Keeping them fresh costs serverless credits. For joins or pipelines, use a Dynamic Table.",
    ],
    analogy: {
      text: "Think of a running tally on a whiteboard in a shop.",
      left: "Shop tally", right: "Materialized view",
      map: [
        ["Counting every receipt each time someone asks", "Querying the base table"],
        ["A tally updated with each sale", "MV maintained in the background"],
        ["Staff glance at the board instead of counting", "Optimizer rewrites queries to use the MV"],
        ["Only one till's receipts on that board", "Single table, no joins"],
        ["Someone paid to keep updating it", "Serverless maintenance credits"],
      ],
      breaks: "a whiteboard tally can include anything you like. MVs only support certain aggregates and expressions; anything more complex needs a Dynamic Table.",
    },
    svg: () => {
      let b = box(14, 30, 150, 60, "events", "2 billion rows", "plain", { mono: true, size: 14 });
      b += arrow(166, 60, 214, 60, { label: "auto-maintained", dy: -10, size: 11.5 });
      b += box(216, 30, 150, 60, "mv_daily", "730 rows", "good", { mono: true, size: 14 });
      b += box(14, 130, 452, 40, "select day, count(*) from events group by day", null, "plain", { mono: true, size: 12, bold: false });
      b += arrow(240, 172, 290, 92, { stroke: C.goodS, label: "optimizer reads the MV instead", dx: 80, dy: 0, size: 11.5 });
      b += box(380, 30, 86, 60, "serverless", "credits", "warn", { size: 12.5, size2: 11 });
      b += t(240, 206, "Limits: one table, no joins, restricted functions.", { size: 12.5, fill: C.dim });
      return svg(480, 222, b, "A materialized view maintained from a large table and used by query rewrite");
    },
    caption: "The heavy rollup is kept up to date in the background and read in its place.",
    oneline: "A materialized view keeps a ready-made answer up to date so the same heavy question becomes instant.",
  };

  /* ---------------------------------------------------------------- snow-search-opt */
  P["snow-search-opt"] = {
    simple: [
      "Pruning works by ranges, which is great for \"dates 10 to 13\" but poor for finding one value, like `WHERE user_id = 42`, when user ids are spread everywhere.",
      "The **Search Optimization Service** builds a search access path for chosen columns. It records which micro-partitions hold which values, so a point lookup opens only those.",
      "It helps selective equality and `IN` lookups, some substring and JSON searches, and geography filters.",
      "It costs storage and serverless credits to build and maintain, so turn it on only for columns that get such lookups often.",
    ],
    analogy: {
      text: "Think of the index at the back of a big book.",
      left: "Book index", right: "Search Optimization",
      map: [
        ["Chapters sorted by topic", "Micro-partitions with min/max ranges"],
        ["Looking for one name could mean reading every chapter", "Point lookup on a high-cardinality column"],
        ["The index: name → page numbers", "Search access path: value → micro-partitions"],
        ["Turn straight to pages 41 and 207", "Scan only the matching micro-partitions"],
        ["Someone has to update the index each edition", "Maintenance credits and storage"],
      ],
      breaks: "a book index is written once. Search optimization updates as data changes, and it doesn't speed up wide scans like \"all users in March\"; that's still clustering's job.",
    },
    svg: () => {
      let b = t(240, 20, "WHERE user_id = 42", { bold: true, size: 14, mono: true });
      b += t(120, 44, "without", { size: 12.5, bold: true, fill: C.badT }) + t(360, 44, "with search optimization", { size: 12.5, bold: true, fill: C.goodT });
      for (let i = 0; i < 8; i++) {
        b += box(14 + (i % 4) * 54, 54 + Math.floor(i / 4) * 50, 46, 40, "MP" + (i + 1), null, "bad", { size: 11 });
        b += box(254 + (i % 4) * 54, 54 + Math.floor(i / 4) * 50, 46, 40, "MP" + (i + 1), null, i === 2 ? "good" : "ghost", { size: 11, dash: i !== 2 });
      }
      b += t(120, 172, "ranges overlap: scan all 8", { size: 12, fill: C.dim }) + t(360, 172, "access path says: only MP3", { size: 12, fill: C.dim });
      b += box(14, 190, 452, 36, "Good for: id =, IN (...), some substring/JSON/geo lookups", null, "plain", { size: 12.5, bold: false });
      return svg(480, 240, b, "Point lookup scanning all micro-partitions versus one with search optimization");
    },
    caption: "Ranges can't rule out a scattered id; the search access path can.",
    oneline: "Search optimization is an index for finding a needle, so one-value lookups skip almost the whole table.",
  };

  /* ---------------------------------------------------------------- snow-query-profile */
  P["snow-query-profile"] = {
    simple: [
      "The **Query Profile** in Snowsight shows how a query really ran: each step (operator), how long it took, and how much data moved.",
      "Look for four signals. **Partitions scanned vs total** shows pruning. **Bytes spilled** to local or remote disk shows the warehouse ran out of memory. A join producing far more rows than went in shows an **exploding join**. The operator with the biggest share of time shows where to focus.",
      "Each signal points to a different fix, which is why you read the profile before changing anything.",
    ],
    analogy: {
      text: "Think of a doctor reading an X-ray before treating a limp.",
      left: "Doctor", right: "Query Profile",
      map: [
        ["The X-ray", "The operator tree with statistics"],
        ["Broken bone vs sprain", "Bad pruning vs spilling vs exploding join"],
        ["Cast for a break, rest for a sprain", "Clustering vs bigger warehouse vs fix the join keys"],
        ["Treating without looking", "Resizing the warehouse on a guess"],
      ],
      breaks: "an X-ray shows one moment. A query can behave differently on another day (cold cache, more data), so compare a few runs before deciding.",
    },
    svg: () => {
      let b = box(170, 12, 140, 34, "Result", null, "plain", { size: 13 });
      b += box(170, 64, 140, 40, "Aggregate", "8% of time", "plain", { size: 13, size2: 11 });
      b += box(170, 122, 140, 40, "Join", "in 2 M → out 900 M", "bad", { size: 13, size2: 11 });
      b += box(30, 186, 150, 44, "TableScan orders", "scanned 9,800 / 10,000", "bad", { size: 12, size2: 10.5 });
      b += box(300, 186, 150, 44, "TableScan cust", "spilled 40 GB", "warn", { size: 12, size2: 10.5 });
      b += arrow(240, 62, 240, 48) + arrow(240, 120, 240, 106) + arrow(105, 184, 200, 164) + arrow(375, 184, 280, 164);
      b += t(380, 120, "exploding join:", { size: 11.5, fill: C.badT, a: "start" }) + t(380, 136, "check join keys", { size: 11.5, fill: C.dim, a: "start" });
      b += t(20, 120, "poor pruning:", { size: 11.5, fill: C.badT, a: "start" }) + t(20, 136, "cluster / filter", { size: 11.5, fill: C.dim, a: "start" });
      return svg(480, 244, b, "Query Profile operator tree with pruning, spilling and exploding join signals");
    },
    caption: "Read bottom-up: each warning box names the lever to pull.",
    oneline: "The Query Profile shows exactly where a query wastes time, so you fix the real problem instead of guessing.",
  };

  /* ---------------------------------------------------------------- snow-rbac-model */
  P["snow-rbac-model"] = {
    simple: [
      "Granting tables straight to job roles gets messy fast. The pattern that scales uses two kinds of custom role.",
      "**Access roles** hold privileges on objects, for example `sales_read` has SELECT on the sales schema. **Functional roles** match jobs, like `analyst`, and are granted the access roles they need.",
      "People get functional roles. Functional roles roll up to SYSADMIN so admins can manage everything.",
      "Watch the **USAGE chain**: to read a table you need USAGE on its database and its schema too. **Future grants** cover tables created later.",
    ],
    analogy: {
      text: "Think of keys and key rings in a school.",
      left: "School keys", right: "Role design",
      map: [
        ["Single keys: science lab, library", "Access roles (privileges on objects)"],
        ["A key ring per job: \"science teacher\"", "Functional roles"],
        ["Giving a teacher their ring", "GRANT ROLE analyst TO USER"],
        ["The lab key is useless without the building and corridor keys", "USAGE on database and schema"],
        ["New rooms get keys added to rings automatically", "Future grants"],
      ],
      breaks: "a key ring is fixed. In Snowflake, ownership also matters: the role that creates an object owns it, so objects created by the wrong role can escape your design.",
    },
    svg: () => {
      let b = t(80, 20, "users", { size: 12.5, bold: true, fill: C.dim }) + t(240, 20, "functional roles", { size: 12.5, bold: true, fill: C.dim }) + t(400, 20, "access roles", { size: 12.5, bold: true, fill: C.dim });
      [["Asha", 40], ["Ravi", 110]].forEach(([n, y]) => { b += box(20, y, 120, 40, n, null, "plain", { size: 13 }); });
      [["analyst", 40], ["engineer", 110]].forEach(([n, y]) => { b += box(180, y, 120, 40, n, null, "vio", { size: 13, mono: true }); });
      [["sales_read", 30], ["sales_write", 90], ["hr_read", 150]].forEach(([n, y]) => { b += box(340, y, 128, 36, n, null, "acc", { size: 12.5, mono: true }); });
      b += arrow(142, 60, 178, 60) + arrow(142, 130, 178, 130);
      b += arrow(302, 56, 338, 48) + arrow(302, 124, 338, 52) + arrow(302, 132, 338, 108);
      b += box(20, 196, 448, 40, "sales_read = USAGE db + schema, SELECT on (future) tables", null, "good", { size: 11, mono: true, bold: false });
      return svg(480, 250, b, "Users granted functional roles, which are granted access roles holding privileges");
    },
    caption: "People get job roles; job roles get bundles of object privileges.",
    oneline: "Give people job roles, give job roles access roles, and give access roles the privileges.",
  };

  /* ---------------------------------------------------------------- snow-masking */
  const MASK_ROLES = [["PII_READER", "asha.k@mail.com", "good", "Full value: this role is allowed to see personal data."], ["ANALYST", "*****@mail.com", "warn", "Partly masked: the domain stays, which is enough for analysis by email provider."], ["PUBLIC", "***MASKED***", "bad", "Fully masked. Same table, same query, different answer."]];
  const maskFig = (i) => {
    const [r, v, k] = MASK_ROLES[i];
    let b = box(14, 20, 160, 44, "current_role()", r, "vio", { mono: true, size: 12.5, size2: 12 });
    b += arrow(176, 42, 214, 42);
    b += box(216, 14, 250, 56, "masking policy mask_email", "CASE on role → value", "acc", { mono: true, size: 12, size2: 11 });
    b += table(14, 96, ["id", "email"], [["7", v]], { cw: [80, 372], rh: 32, hl: { 0: k } });
    b += t(240, 186, "One stored copy; the policy rewrites the value at query time.", { size: 12.5, fill: C.dim });
    return b;
  };
  P["snow-masking"] = {
    simple: [
      "**Dynamic Data Masking** hides sensitive column values, like emails or card numbers, from people who shouldn't see them.",
      "A **masking policy** is a small function: it takes the real value and returns either the value or a masked version, based on the caller's role.",
      "It runs at query time. There's still only one copy of the data; different roles simply see different results.",
      "You can attach a policy to each column, or to a **tag** so every column with that tag is masked automatically.",
    ],
    analogy: {
      text: "Think of a document with a black marker applied as you read it.",
      left: "Document", right: "Masking",
      map: [
        ["One original document", "One stored column"],
        ["A clerk who checks your badge before handing it over", "The masking policy checking current_role()"],
        ["Black marker over the phone number", "Masked value returned"],
        ["The original is never actually inked", "No data copied or changed"],
        ["\"Ink every page stamped CONFIDENTIAL\"", "Tag-based masking"],
      ],
      breaks: "a black marker hides text on the page. A masked column can still leak through a filter: `WHERE email = 'x@y.com'` can confirm a value exists, so sensitive lookups need care too.",
    },
    svg: () => svg(480, 200, maskFig(1), "Masking policy returning a partly masked email for the ANALYST role"),
    caption: "The ANALYST role sees a partly masked email from the same stored value.",
    ix: el => choice(el, { label: "Query as role", options: MASK_ROLES.map(r => r[0]), value: 0 }, i => ({ svg: svg(480, 200, maskFig(i), "Masked value by role"), note: MASK_ROLES[i][3] })),
    oneline: "A masking policy shows each role only as much of a sensitive column as it's allowed to see.",
  };

  /* ---------------------------------------------------------------- snow-row-policies */
  const ROWS = [["1", "IN", "40"], ["2", "US", "15"], ["3", "IN", "30"], ["4", "UK", "25"], ["5", "US", "60"]];
  const RP = [["SALES_IN", ["IN"]], ["SALES_US", ["US"]], ["GLOBAL_LEAD", ["IN", "US", "UK"]]];
  const rpFig = (i) => {
    const [role, allowed] = RP[i];
    let b = table(14, 34, ["order", "region", "amount"], ROWS, { cw: [70, 80, 80], rh: 28, title: "sales (stored)", hl: Object.fromEntries(ROWS.map((r, j) => [j, allowed.includes(r[1]) ? "good" : "bad"])), strike: Object.fromEntries(ROWS.map((r, j) => [j, !allowed.includes(r[1])])) });
    b += table(276, 34, ["role", "region"], [[role, allowed.join(", ")]], { cw: [110, 80], rh: 28, title: "mapping table", size: 11.5 });
    b += box(276, 110, 190, 66, "row access policy", "exists(mapping row)?", "acc", { size: 13, size2: 11.5 });
    b += arrow(274, 140, 248, 120, { stroke: C.accS });
    const vis = ROWS.filter(r => allowed.includes(r[1])).length;
    b += t(122, 222, role + " sees " + vis + " of 5 rows", { size: 13, bold: true, fill: C.goodT });
    return { b, vis };
  };
  P["snow-row-policies"] = {
    simple: [
      "Masking hides parts of columns. A **row access policy** hides whole rows.",
      "It's a function that returns true or false for each row. Snowflake applies it to every query on the table, however the table is reached.",
      "The pattern that scales keeps the rules in a **mapping table** (role → allowed region), and the policy just checks that table. Adding a new region means adding a row, not rewriting the policy.",
    ],
    analogy: {
      text: "Think of a school website where each parent sees only their own child's reports.",
      left: "School portal", right: "Row access policy",
      map: [
        ["All pupils' reports in one system", "One table with every region"],
        ["The list of which parent belongs to which child", "The mapping table"],
        ["The login check before each page", "The policy run on every query"],
        ["Other children's reports simply don't appear", "Filtered rows are invisible, not errors"],
      ],
      breaks: "parents can't guess other reports exist. In a database, row counts or aggregates through an unprotected view could still hint at hidden rows, so policies must cover every path.",
    },
    svg: () => svg(480, 236, rpFig(0).b, "Row access policy filtering a sales table to India rows for SALES_IN"),
    caption: "The policy checks the mapping table for each row; SALES_IN sees only Indian orders.",
    ix: el => choice(el, { label: "Query as role", options: RP.map(r => r[0]), value: 0 }, i => {
      const r = rpFig(i);
      return { svg: svg(480, 236, r.b, "Rows visible per role"), note: `Same <code>select * from sales</code>, <b>${r.vis}</b> rows returned. The struck-out rows are filtered before the query sees them.` };
    }),
    oneline: "A row access policy shows each role only the rows it's allowed to see, on every query.",
  };

  /* ---------------------------------------------------------------- snow-tags */
  P["snow-tags"] = {
    simple: [
      "An **object tag** is a label, like `classification = 'pii'` or `cost_center = 'marketing'`, that you attach to tables, columns or warehouses.",
      "By itself a tag is just a note. Its power comes from **binding a policy to the tag**: every column with tag `pii` then gets the masking policy, including columns created next year.",
      "Snowflake can also suggest tags by scanning data (**classification**), and tags on warehouses let you split the bill by team.",
    ],
    analogy: {
      text: "Think of coloured stickers in a library.",
      left: "Library stickers", right: "Snowflake tags",
      map: [
        ["Red sticker = reference only", "Tag pii = sensitive"],
        ["Rule: red-sticker books never leave the building", "A masking policy bound to the tag"],
        ["New red-sticker books follow the rule automatically", "Policy applies to newly tagged columns"],
        ["Search the catalogue for all red stickers", "Discover tagged objects in ACCOUNT_USAGE"],
        ["Blue stickers per department", "cost_center tags for showback"],
      ],
      breaks: "librarians stick labels by hand. A tag only protects what is tagged, so a new PII column nobody tagged is unprotected; classification helps find those gaps.",
    },
    svg: () => {
      let b = box(170, 16, 140, 44, "tag: pii", null, "warn", { mono: true, size: 14 });
      b += box(330, 16, 140, 44, "mask_email", "policy on tag", "acc", { mono: true, size: 12.5, size2: 11 });
      b += arrow(312, 38, 328, 38);
      [["customers.email", 20], ["orders.phone", 175], ["leads.email (new)", 330]].forEach(([n, x]) => {
        b += box(x, 110, 140, 40, n, null, "plain", { mono: true, size: 11.5, bold: false });
        b += arrow(240, 62, x + 70, 108, { stroke: C.warnS });
        b += box(x, 166, 140, 30, "masked", null, "good", { size: 12.5 });
        b += arrow(x + 70, 152, x + 70, 164, { stroke: C.goodS });
      });
      b += t(240, 222, "Tag the column once; the policy follows the tag.", { size: 12.5, fill: C.dim });
      return svg(480, 236, b, "A pii tag with a masking policy applied to three tagged columns");
    },
    caption: "Bind the policy to the tag, and every tagged column, old or new, is masked.",
    oneline: "Tags label data by meaning, and policies tied to a tag protect every column that carries it.",
  };

  /* ---------------------------------------------------------------- snow-network-auth */
  P["snow-network-auth"] = {
    simple: [
      "Before roles and policies matter, Snowflake asks two questions: **where** is this login coming from, and **who** is it really?",
      "**Network policies** allow or block logins by IP address range, for the whole account or one user. **PrivateLink** keeps traffic off the public internet.",
      "**Authentication** proves identity: single sign-on (SSO) for people, multi-factor authentication (MFA) on top, and **key-pair** or **OAuth** for programs.",
      "Service accounts should use key-pair or OAuth, never a password stored in a script.",
    ],
    analogy: {
      text: "Think of entering an office building.",
      left: "Office building", right: "Snowflake",
      map: [
        ["The gate only opens for cars from the staff car park", "Network policy (allowed IP ranges)"],
        ["A private tunnel from the car park", "PrivateLink"],
        ["Showing your staff ID card", "SSO login"],
        ["A PIN code as well", "MFA"],
        ["A delivery robot with its own digital key", "Key-pair auth for a service user"],
        ["Which floors your card opens", "RBAC (the next layer)"],
      ],
      breaks: "a building checks you once at the door. Snowflake checks network and identity on every new session, and a stolen key still works from an allowed network, so keys need rotating.",
    },
    svg: () => {
      let b = box(14, 70, 100, 50, "login", "user / app", "plain", { size: 14 });
      b += arrow(116, 95, 140, 95);
      b += box(142, 50, 120, 90, "Gate 1", "network: IP allowed?", "warn", { size: 14, size2: 10 });
      b += arrow(264, 95, 288, 95);
      b += box(290, 50, 120, 90, "Gate 2", "identity proven?", "acc", { size: 14, size2: 10 });
      b += arrow(412, 95, 430, 95);
      b += box(432, 70, 38, 50, "in", null, "good", { size: 13 });
      b += arrow(202, 142, 202, 172, { stroke: C.badS }) + box(152, 174, 100, 30, "blocked", null, "bad", { size: 12.5 });
      b += arrow(350, 142, 350, 172, { stroke: C.badS }) + box(300, 174, 100, 30, "denied", null, "bad", { size: 12.5 });
      b += t(240, 230, "Then RBAC, masking and row policies decide what it may read.", { size: 12.5, fill: C.dim });
      return svg(480, 244, b, "Two login gates: network policy then authentication");
    },
    caption: "Where from, then who: both must pass before any role matters.",
    oneline: "Network policies decide where logins may come from, and authentication proves who is logging in.",
  };

  /* ---------------------------------------------------------------- snow-snowpark */
  P["snow-snowpark"] = {
    simple: [
      "**Snowpark** lets you write Python, Java or Scala that runs **inside** Snowflake, next to the data.",
      "Its DataFrame API looks like Spark or pandas, but it's lazy: nothing runs until you ask for a result, and then it's turned into SQL that runs on your warehouse.",
      "For logic SQL can't express, you write **UDFs** (user-defined functions) and **stored procedures**, which run in a secure Python sandbox on the warehouse.",
      "No data leaves Snowflake, and the same roles and masking apply.",
    ],
    analogy: {
      text: "Think of writing a recipe in English for a kitchen that only speaks French.",
      left: "Kitchen", right: "Snowpark",
      map: [
        ["You write the recipe in English", "Python DataFrame code"],
        ["A translator turns it into French", "Snowpark compiles it to SQL"],
        ["The cooks work in their own kitchen", "It runs on the Snowflake warehouse"],
        ["A special dish only you know how to make", "A Python UDF for custom logic"],
        ["The food never leaves the kitchen", "Data stays inside Snowflake"],
      ],
      breaks: "a translator can always translate. Some Python (like a row-by-row loop with `collect()`) pulls data to your laptop instead, which is slow and defeats the point.",
    },
    svg: () => {
      let b = box(14, 18, 210, 90, null, null, "plain");
      ["df = session.table('orders')", "  .filter(col('amt') > 0)", "  .group_by('region')", "  .agg(sum('amt'))"].forEach((l, i) => { b += t(22, 40 + i * 20, l, { size: 11, mono: true, a: "start" }); });
      b += arrow(226, 62, 254, 62, { label: "compiles", dy: -10 });
      b += box(256, 18, 210, 90, null, null, "acc");
      ["SELECT region,", "  SUM(amt)", "FROM orders WHERE amt > 0", "GROUP BY region"].forEach((l, i) => { b += t(264, 40 + i * 20, l, { size: 11, mono: true, a: "start", fill: C.accT }); });
      b += arrow(361, 110, 361, 140);
      b += box(256, 142, 210, 50, "Warehouse", "runs SQL + Python UDFs", "vio", { size: 14, size2: 11 });
      b += box(14, 142, 210, 50, "Data stays put", "same roles, same masking", "good", { size: 14, size2: 11 });
      return svg(480, 206, b, "Snowpark DataFrame code compiled to SQL and run on a warehouse");
    },
    caption: "Python is translated to SQL and runs where the data already is.",
    oneline: "Snowpark lets you write Python that Snowflake turns into work done right next to the data.",
  };

  /* ---------------------------------------------------------------- snow-iceberg */
  P["snow-iceberg"] = {
    simple: [
      "**Apache Iceberg** is an open table format: data files plus metadata files that any engine can understand.",
      "**Snowflake Iceberg tables** keep their files in **your** bucket, reached through an **external volume**. Spark, Trino or Flink can read the same tables, so you aren't locked in.",
      "The key question is **who writes**. If Snowflake writes, use the Snowflake catalog (Snowflake-managed) and get full features. If another engine writes, point Snowflake at that engine's catalog and let Snowflake read.",
    ],
    analogy: {
      text: "Think of a shared family photo album kept in a standard format.",
      left: "Photo album", right: "Iceberg tables",
      map: [
        ["Photos saved as JPEGs any phone opens", "Open Parquet + Iceberg metadata files"],
        ["Stored on your own drive", "Your bucket via an external volume"],
        ["The album index listing which photos are in", "The Iceberg catalog"],
        ["One person in charge of adding photos", "The single writer: Snowflake or another engine"],
        ["Everyone can look, whatever phone they have", "Spark, Trino, Flink can read"],
      ],
      breaks: "anyone can add a photo to a shared album. Two engines both writing the same Iceberg table through different catalogs can corrupt it, so pick one owner per table.",
    },
    svg: () => {
      let b = box(14, 18, 140, 48, "Snowflake", "writer (managed)", "acc", { size: 14, size2: 11 });
      b += box(326, 18, 140, 48, "Spark / Trino", "reader", "vio", { size: 14, size2: 11 });
      b += box(170, 86, 140, 44, "Iceberg catalog", "which files = table", "warn", { size: 13, size2: 10.5 });
      b += arrow(84, 68, 198, 86) + arrow(396, 68, 282, 86, { stroke: C.vioS });
      b += box(14, 160, 452, 64, null, null, "good");
      b += t(240, 182, "Your bucket (external volume)", { size: 14, bold: true, fill: C.goodT });
      b += t(240, 204, "Parquet data files + Iceberg metadata", { size: 12, fill: C.dim });
      b += arrow(240, 132, 240, 158);
      return svg(480, 238, b, "Snowflake and Spark sharing Iceberg tables in your bucket through one catalog");
    },
    caption: "One copy of open files in your bucket; the catalog tells every engine what the table is.",
    oneline: "Iceberg tables keep Snowflake data in an open format in your own storage so other engines can use it too.",
  };

  /* ---------------------------------------------------------------- snow-cortex */
  P["snow-cortex"] = {
    simple: [
      "**Cortex** brings AI into Snowflake with no servers to set up.",
      "**Cortex AI Functions** run large language models from SQL: `AI_COMPLETE` (generate text), `AI_CLASSIFY`, `AI_SENTIMENT`, `AI_EXTRACT`, `AI_TRANSLATE`, and `AI_SUMMARIZE` (in Preview). They replace the older `SNOWFLAKE.CORTEX.*` functions.",
      "`AI_SENTIMENT` returns an object with labels like 'positive', not a number from -1 to 1.",
      "**Cortex Search** retrieves relevant documents for question answering, and **Cortex Analyst** turns plain questions into SQL. All of it bills AI credits by tokens.",
    ],
    analogy: {
      text: "Think of a translator and summariser who sits inside the library.",
      left: "Library helper", right: "Cortex",
      map: [
        ["Hand them a book page, get a summary back", "AI_SUMMARIZE on a text column"],
        ["\"Is this review happy or angry?\"", "AI_SENTIMENT"],
        ["\"Which shelf does this belong on?\"", "AI_CLASSIFY"],
        ["Finding the five most relevant pages", "Cortex Search"],
        ["The books never leave the building", "Data stays in Snowflake under its roles"],
        ["Paid per word read and written", "AI credits per million tokens"],
      ],
      breaks: "a human helper can say \"I'm not sure\". An LLM can produce confident wrong answers, so classify and extract results need checks on a sample before they drive decisions.",
    },
    svg: () => {
      let b = table(14, 34, ["review_text"], [["Arrived late, box crushed"], ["Love it, works great"]], { cw: [210], rh: 30, mono: false, title: "reviews" });
      b += arrow(226, 64, 262, 64, { label: "AI_SENTIMENT", dy: -10, size: 11.5 });
      b += table(266, 34, ["sentiment"], [["negative"], ["positive"]], { cw: [200], rh: 30, hl: { 0: "bad", 1: "good" }, title: "label from the object" });
      b += box(14, 140, 452, 34, "ai_sentiment(review_text):categories[0]:sentiment::string", null, "plain", { mono: true, size: 11.5, bold: false });
      b += t(240, 200, "Billed in AI credits by tokens; data stays in your account.", { size: 12.5, fill: C.dim });
      return svg(480, 214, b, "AI_SENTIMENT turning review text into positive or negative labels in SQL");
    },
    caption: "An AI function is just another SQL function over a column.",
    oneline: "Cortex lets you call AI models from plain SQL, right where your data already lives.",
  };

  /* ---------------------------------------------------------------- snow-hybrid */
  P["snow-hybrid"] = {
    simple: [
      "Normal Snowflake tables store data by column: great for scanning millions of rows, slow for reading or changing one row at a time.",
      "**Hybrid Tables** (part of Unistore) add a **row store** with an enforced **primary key** and secondary indexes. Single-row lookups and updates take milliseconds.",
      "So an app's live state, like order status, can live in Snowflake and be joined directly to analytics tables, with no separate database to copy from.",
      "Use standard tables for big analytics and Hybrid Tables for the small, busy, one-row-at-a-time part.",
    ],
    analogy: {
      text: "Think of a library's archive versus its front desk.",
      left: "Library", right: "Snowflake tables",
      map: [
        ["The archive, sorted by subject for research", "Standard columnar tables"],
        ["The front desk loan card, one per member", "A Hybrid Table row by primary key"],
        ["Updating one card in seconds", "Millisecond point upserts"],
        ["Research that combines loans with the archive", "JOIN hybrid and standard tables"],
        ["No second building to keep in sync", "No separate OLTP database plus CDC"],
      ],
      breaks: "a front desk can serve a whole town. Hybrid Tables suit operational workloads within limits; a very high-volume transactional system may still need a dedicated database.",
    },
    svg: () => {
      let b = t(120, 22, "Standard table (columnar)", { bold: true, size: 13 }) + t(360, 22, "Hybrid Table (row store)", { bold: true, size: 13 });
      ["id", "status", "amount"].forEach((c, i) => { b += box(20 + i * 66, 34, 60, 120, c, "column file", "acc", { size: 12.5, size2: 9.5 }); });
      for (let i = 0; i < 4; i++) b += box(270, 34 + i * 30, 190, 26, "id " + (101 + i) + " | status | amount", null, i === 2 ? "good" : "plain", { size: 11, mono: true, bold: false });
      b += t(120, 176, "best: scan millions of rows", { size: 12, fill: C.dim }) + t(365, 176, "best: read/update id 103", { size: 12, fill: C.dim });
      b += box(20, 192, 440, 36, "One query can JOIN both kinds of table", null, "vio", { size: 13 });
      return svg(480, 242, b, "Columnar standard table compared with row-store Hybrid Table");
    },
    caption: "Columns for scanning, rows for one-at-a-time work, joinable in one query.",
    oneline: "Hybrid Tables let Snowflake handle quick one-row app updates as well as big analytic scans.",
  };

  /* ---------------------------------------------------------------- snow-apps */
  P["snow-apps"] = {
    simple: [
      "You can build things on Snowflake, not just query it.",
      "**Streamlit in Snowflake** runs small Python web apps inside your account, on governed tables, with no separate hosting.",
      "**Native Apps** package data and code so another Snowflake account can install them; you can sell them on the Marketplace.",
      "**Data Clean Rooms** let two companies combine data for agreed questions (like audience overlap) without either seeing the other's raw rows.",
    ],
    analogy: {
      text: "Think of a school building used after hours.",
      left: "School building", right: "Snowflake apps",
      map: [
        ["A notice board app for staff, inside the school", "Streamlit in Snowflake"],
        ["A boxed lesson kit other schools can borrow", "A Native App installed by another account"],
        ["Two schools comparing results without swapping registers", "A Data Clean Room"],
        ["The same security guard on every door", "Roles and masking still apply"],
      ],
      breaks: "a lesson kit is copied when it's lent. A Native App runs inside the consumer's account while the provider's code and data stay protected, which a copy can't do.",
    },
    svg: () => {
      let b = box(140, 96, 200, 54, "Governed data", "roles · masking · policies", "good", { size: 14, size2: 11 });
      [["Streamlit", "internal app UI", 14, 20], ["Native App", "installable product", 326, 20], ["Clean Room", "join without seeing", 170, 190]].forEach(([n, s, x, y]) => {
        b += box(x, y, 140, 50, n, s, "vio", { size: 14, size2: 11 });
      });
      b += arrow(156, 46, 190, 94, { stroke: C.vioS }) + arrow(324, 46, 290, 94, { stroke: C.vioS }) + arrow(240, 188, 240, 152, { stroke: C.vioS });
      return svg(480, 252, b, "Streamlit, Native Apps and Clean Rooms built on governed Snowflake data");
    },
    caption: "All three are built on the same governed data, with no data leaving the platform.",
    oneline: "Snowflake lets you build apps, ship data products and share safely without moving the data.",
  };

  /* ---------------------------------------------------------------- snow-cost-credits */
  // worked example from the lesson: Medium warehouse (4 credits/h), 96 queries a day, each 20 s of work
  const ccFig = (sus) => {
    const perBurst = Math.max(60, 20 + sus), credits = 96 * perBurst * 4 / 3600;
    let b = t(240, 20, "Medium warehouse (4 credits/h), 96 short queries a day", { bold: true, size: 13 });
    const W = 440, scale = W / 700;
    b += `<rect x="20" y="40" width="${20 * scale}" height="34" style="fill:${C.goodS}"/>`;
    b += `<rect x="${20 + 20 * scale}" y="40" width="${(perBurst - 20) * scale}" height="34" style="fill:${C.badS}"/>`;
    b += line(20, 80, 460, 80, { stroke: C.faint });
    b += t(20, 98, "one burst: 20 s work + idle until suspend (min 60 s billed)", { size: 11.5, fill: C.dim, a: "start" });
    b += box(20, 114, 210, 54, credits.toFixed(2) + " credits/day", "billed", credits > 20 ? "bad" : "good", { size: 16 });
    b += box(250, 114, 210, 54, "$" + Math.round(credits * 30 * 3).toLocaleString() + " / month", "at $3 per credit", credits > 20 ? "bad" : "good", { size: 16 });
    return { b, credits };
  };
  P["snow-cost-credits"] = {
    simple: [
      "Snowflake bills in **credits**. A warehouse uses credits for every second it runs, after a **60-second minimum** each time it starts. XS uses 1 credit an hour, and each size up doubles it. Newer **Gen2** warehouses use more per hour (1.35 for XS on AWS and GCP) but can finish sooner.",
      "Serverless features (Snowpipe, serverless tasks, search optimization, materialized views) bill credits on their own meters. Cloud services are only billed above 10% of daily warehouse credits.",
      "A credit costs $2, $3 or $4 on Standard, Enterprise or Business Critical in AWS US East. **Resource monitors** cap warehouse credits; **budgets** watch serverless spend too.",
    ],
    analogy: {
      text: "Think of a taxi meter with a minimum fare.",
      left: "Taxi", right: "Snowflake credits",
      map: [
        ["The meter ticks while the taxi is hired", "Credits per second while the warehouse runs"],
        ["A minimum fare every time you get in", "60-second minimum per resume"],
        ["Bigger taxi, faster meter", "Each size doubles credits per hour"],
        ["Asking the driver to wait outside", "AUTO_SUSPEND set too long"],
        ["Separate fees for parking and tolls", "Serverless and storage meters"],
        ["A spending limit on the company card", "Resource monitors and budgets"],
      ],
      breaks: "a taxi waiting for you is obvious. An idle warehouse waiting to auto-suspend is invisible, and with many short queries the waiting time can be most of the bill.",
    },
    svg: () => svg(480, 182, ccFig(600).b, "Credits per day for 96 short queries with a 10-minute auto-suspend"),
    caption: "With AUTO_SUSPEND = 600 s, each 20-second query keeps the warehouse up for 10 more minutes.",
    ix: el => slider(el, { label: "AUTO_SUSPEND (seconds)", min: 0, max: 600, step: 30, value: 600, fmt: v => v + " s" }, v => {
      const r = ccFig(v);
      return { svg: svg(480, 182, r.b, "Credits by auto-suspend setting"), note: `At ${v} s: <b>${r.credits.toFixed(2)}</b> credits a day. 600 s gives 66.13, 60 s gives 8.53 (the lesson's worked example). Below about 40 s nothing more is saved, because each resume bills at least 60 s, and the warehouse cache is lost more often.` };
    }),
    oneline: "Snowflake charges credits for every second a warehouse runs, so idle time and the 60-second minimum decide most bills.",
  };
})();
