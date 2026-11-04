/* Datalith pass 2 — Track 5: Data Modeling & Warehousing, part B
   (Data Vault 2.0, schema variants & aggregates, interview prep). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- model-dv-why */
  P["model-dv-why"] = {
    simple: [
      "Big companies feed their warehouse from dozens of systems: the app, the CRM (Customer Relationship Management), billing, partners. Those systems change all the time.",
      "A star schema is great to **read**, but every source change ripples through its dimensions. A fully normalized warehouse is tidy but slow to change.",
      "**Data Vault 2.0** sits in the middle. It loads raw history fast and safely in a **raw vault**, adds helper tables in a **business vault**, and builds star-schema **information marts** on top for people to query.",
    ],
    analogy: {
      text: "Think of a city's water system.",
      left: "Water system", right: "Data Vault layers",
      map: [
        ["Rivers and wells, all different", "Many changing source systems"],
        ["The reservoir that takes in everything as it comes", "Raw vault: source-faithful, insert-only, audited"],
        ["The treatment plant", "Business vault: rules, PIT and bridge tables"],
        ["Taps in each home", "Information marts (star schemas) for BI"],
        ["A new river joins: just add a pipe", "A new source: add hubs, links, satellites"],
      ],
      breaks: "a reservoir doesn't keep every drop's history. A raw vault does: nothing is ever updated in place, which is great for audits but makes the vault large.",
    },
    svg: () => {
      const L = [["sources", "app · CRM · billing", "plain"], ["staging", "hash keys added", "plain"], ["raw vault", "hubs · links · satellites", "vio"], ["business vault", "rules · PIT · bridges", "acc"], ["information marts", "stars for BI", "good"]];
      let b = "";
      L.forEach(([a, s, k], i) => {
        const y = 12 + i * 60;
        b += box(100, y, 280, 46, a, s, k, { size: 14.5, size2: 12 });
        if (i < 4) b += arrow(240, y + 46, 240, y + 58);
      });
      b += t(30, 168, "audit", { size: 12, fill: C.vioT, bold: true, a: "start" });
      b += t(394, 288, "serve", { size: 12, fill: C.goodT, bold: true, a: "start" });
      return svg(480, 316, b, "Data Vault 2.0 layers from sources to information marts");
    },
    caption: "Raw history lands untouched in the vault; helper tables and star marts are built on top.",
    oneline: "Data Vault keeps a raw, audited history of every source and builds easy star schemas on top for people.",
  };

  /* ---------------------------------------------------------------- model-dv-entities */
  P["model-dv-entities"] = {
    simple: [
      "Every Data Vault table is one of exactly three types.",
      "A **Hub** is just the list of business ids for one thing, like every customer id ever seen, plus when and where it was first loaded. A **Link** records a relationship between hubs, like \"customer 7 placed order 501\".",
      "A **Satellite** holds the descriptions (name, email, status) for one hub or link, with a new row each time something changes. Keeping these apart is what lets the model absorb change.",
    ],
    analogy: {
      text: "Think of a stamp collection.",
      left: "Stamp collection", right: "Data Vault",
      map: [
        ["The list of each stamp's catalogue number", "Hub: business keys only"],
        ["\"This stamp came on that envelope\"", "Link: a relationship between keys"],
        ["Notes on each stamp's condition, dated", "Satellite: attributes, versioned by load date"],
        ["Condition changes: add a new dated note", "Insert a new satellite row, never update"],
      ],
      breaks: "a collector keeps notes in one book. A vault often has several satellites per hub, split by source or by how often attributes change, so one customer's description may live in three tables.",
    },
    svg: () => {
      let b = table(10, 40, ["customer_hk", "customer_id"], [["a1f3", "C-7"], ["9b2e", "C-8"]], { cw: [100, 100], rh: 28, title: "hub_customer", hl: { 0: "vio", 1: "vio" } });
      b += table(260, 40, ["customer_hk", "order_hk"], [["a1f3", "77c0"], ["a1f3", "e45d"]], { cw: [104, 104], rh: 28, title: "link_customer_order", hl: { 0: "acc", 1: "acc" } });
      b += table(10, 190, ["customer_hk", "load_date", "city"], [["a1f3", "2026-01-04", "Pune"], ["a1f3", "2026-03-01", "Delhi"]], { cw: [100, 120, 80], rh: 28, title: "sat_customer", hl: { 0: "warn", 1: "warn" } });
      b += arrow(110, 126, 110, 176, { stroke: C.warnS }) + arrow(212, 82, 256, 82, { stroke: C.accS });
      b += t(390, 210, "Hub: who exists", { size: 12.5, fill: C.vioT, bold: true });
      b += t(390, 232, "Link: who relates", { size: 12.5, fill: C.accT, bold: true });
      b += t(390, 254, "Satellite: what they", { size: 12.5, fill: C.warnT, bold: true });
      b += t(390, 272, "looked like, when", { size: 12.5, fill: C.warnT, bold: true });
      return svg(480, 296, b, "Hub, link and satellite tables with example rows");
    },
    caption: "The hub holds the id once, the link pairs ids, the satellite keeps each version of the description.",
    oneline: "Hubs list the ids, links connect them, and satellites keep every dated version of their details.",
  };

  /* ---------------------------------------------------------------- model-dv-keys-loading */
  const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };
  P["model-dv-keys-loading"] = {
    simple: [
      "Data Vault 2.0 makes its keys by **hashing** the business id: run `C-7` through a function like MD5 and you always get the same code.",
      "Because anyone can compute that code, hubs, links and satellites can all load **at the same time**, with no lookup to the hub first.",
      "A **hashdiff** is a hash of all the descriptive columns. If today's hashdiff equals the latest stored one, nothing changed and no row is written. Loads only ever **insert**, so re-running them is safe.",
    ],
    analogy: {
      text: "Think of a fingerprint and a photo of someone's outfit.",
      left: "Fingerprint and photo", right: "Hash key and hashdiff",
      map: [
        ["Your fingerprint is the same wherever it's taken", "Hash key: same input, same key, any loader"],
        ["Two offices can file you without calling each other", "Parallel loads, no sequence lookups"],
        ["A photo of today's outfit", "Hashdiff of the descriptive columns"],
        ["Same outfit as yesterday? Don't file a new photo", "Equal hashdiff: skip the insert"],
        ["Filing the same photo twice changes nothing", "Idempotent, insert-only loads"],
      ],
      breaks: "fingerprints are unique by nature. Hashes can in theory collide, and small formatting differences (\"c-7\" vs \"C-7 \") make different hashes, so trim and upper-case keys the same way everywhere before hashing.",
    },
    svg: () => {
      let b = box(20, 20, 160, 44, "'C-7'", "business key", "plain", { mono: true, size: 14, size2: 12 });
      b += arrow(182, 42, 222, 42, { label: "MD5()", dy: -8 });
      b += box(226, 20, 234, 44, "customer_hk", "same key for every loader", "vio", { mono: true, size: 14, size2: 12 });
      b += box(20, 96, 200, 44, "name|city|tier", "today's values", "plain", { mono: true, size: 13, size2: 12 });
      b += arrow(222, 118, 252, 118, { label: "hash", dy: -8 });
      b += box(256, 96, 204, 44, "hashdiff", "compare to latest row", "warn", { mono: true, size: 14, size2: 12 });
      b += arrow(300, 142, 200, 180, { stroke: C.goodS, label: "same", dx: -20, dy: 0 }) + arrow(420, 142, 420, 180, { stroke: C.accS, label: "different", dx: 34, dy: 0 });
      b += box(90, 182, 200, 40, "skip: nothing changed", null, "good", { size: 13 });
      b += box(330, 182, 130, 40, "insert new row", null, "acc", { size: 13 });
      b += t(240, 256, "Hub, link and satellite loads all compute keys themselves,", { size: 12.5, fill: C.dim });
      b += t(240, 274, "so they can run in parallel.", { size: 12.5, fill: C.dim });
      return svg(480, 290, b, "Hash keys from business keys and hashdiff-based change detection");
    },
    caption: "Hash the id to get the key; hash the description to see whether anything changed.",
    ix: el => {
      choice(el, { label: "Today's source row for C-7:", options: ["Pune, Gold (unchanged)", "Delhi, Gold (moved)", "pune , gold (messy)"], value: 0 }, i => {
        const stored = fnv("PUNE|GOLD");
        const raw = [["Pune", "Gold"], ["Delhi", "Gold"], ["pune ", "gold"]][i];
        const clean = raw.map(x => x.trim().toUpperCase()).join("|"), dirty = raw.join("|");
        const hd = fnv(clean), hdRaw = fnv(dirty);
        let b = t(240, 22, "Latest stored hashdiff: " + stored, { mono: true, size: 13, fill: C.tx });
        b += box(20, 40, 440, 40, "hash(TRIM(UPPER(city)) | TRIM(UPPER(tier))) = " + hd, null, hd === stored ? "good" : "acc", { mono: true, size: 12 });
        b += box(20, 92, 440, 40, "without cleaning: hash('" + dirty + "') = " + hdRaw, null, hdRaw === stored ? "good" : "bad", { mono: true, size: 12 });
        b += t(240, 160, "(an 8-digit FNV-1a hash, for illustration; real vaults use MD5 or SHA)", { size: 11.5, fill: C.faint });
        const note = hd === stored
          ? (hdRaw === stored ? "Same values, same hashdiff: <b>no row inserted</b>." : "After trimming and upper-casing, the hashdiff matches: <b>no row inserted</b>. Without cleaning, a difference in case or spacing alone would have created a false \"change\".")
          : "Different hashdiff: <b>insert one new satellite row</b> for C-7. The old row stays for history.";
        return { svg: svg(480, 176, b, "Hashdiff comparison"), note };
      });
    },
    oneline: "Hash keys let every loader compute the same id on its own, and a hashdiff tells it whether anything really changed.",
  };

  /* ---------------------------------------------------------------- model-dv-business-vault */
  P["model-dv-business-vault"] = {
    simple: [
      "The raw vault keeps everything, but asking it \"what did customer 7 look like on 1 March?\" is slow. You must search each satellite's date ranges.",
      "The **business vault** adds helper tables. A **PIT** (Point-In-Time) table stores, for each customer and each snapshot date, exactly which satellite row was valid then. A **bridge** table stores ready-made key paths across hubs and links.",
      "With them, slow date-range joins become simple equal-key joins. Computed satellites also live here, holding business rules like a customer's tier.",
    ],
    analogy: {
      text: "Think of a photo album where someone has already marked the best picture for each birthday.",
      left: "The album", right: "Business vault",
      map: [
        ["Hundreds of dated photos per person", "Satellites full of versions"],
        ["Flipping through to find the one from your 10th birthday", "A range join on load dates"],
        ["A bookmark page: birthday 10 → photo 214", "A PIT row: (customer, snapshot date) → satellite load date"],
        ["A family tree page linking cousins", "A bridge table of hub/link key paths"],
      ],
      breaks: "the bookmark page needs updating when new photos arrive. PIT and bridge tables are rebuilt on a schedule, so they're only as fresh as their last build.",
    },
    svg: () => {
      let b = t(240, 22, "PIT turns a date-range search into exact lookups", { bold: true, size: 13.5 });
      b += table(14, 42, ["hk", "snapshot", "sat_cust_ldts", "sat_tier_ldts"], [["a1f3", "2026-02-01", "2026-01-04", "2025-12-01"], ["a1f3", "2026-04-01", "2026-03-01", "2026-03-20"]], { cw: [60, 110, 130, 130], rh: 30, title: "", hl: { 0: "acc", 1: "acc" } });
      b += arrow(220, 136, 130, 176, { stroke: C.warnS }) + arrow(340, 136, 360, 176, { stroke: C.warnS });
      b += box(20, 178, 200, 44, "sat_customer", "join on hk + load_date =", "warn", { size: 13.5, size2: 12 });
      b += box(260, 178, 200, 44, "sat_tier", "join on hk + load_date =", "warn", { size: 13.5, size2: 12 });
      b += t(240, 254, "Before: load_date <= snapshot < next_load_date (slow)", { size: 12, mono: true, fill: C.badT });
      b += t(240, 274, "After: load_date = pit.sat_ldts (fast equi-join)", { size: 12, mono: true, fill: C.goodT });
      return svg(480, 290, b, "A point-in-time table pointing at the valid satellite rows for each snapshot");
    },
    caption: "Each PIT row says which version of each satellite was valid on that snapshot date.",
    oneline: "The business vault adds bookmark tables (PITs and bridges) so the raw vault can be queried quickly.",
  };

  /* ---------------------------------------------------------------- model-dv-build */
  P["model-dv-build"] = {
    simple: [
      "A small vault for an online shop has two hubs (customer, order), one link between them, and a satellite on each for the details.",
      "Writing all that SQL by hand is repetitive, so teams generate it. dbt packages such as AutomateDV and datavault4dbt turn a short config into hub, link and satellite models.",
      "Then you build star schemas on top. And you ask honestly whether you need a vault at all: for a few stable sources, plain dimensional models are simpler.",
    ],
    analogy: {
      text: "Think of building with a flat-pack furniture kit.",
      left: "Flat-pack kit", right: "Building a Data Vault",
      map: [
        ["The same few panel types in every kit", "Only hubs, links and satellites"],
        ["The instruction booklet", "dbt packages (AutomateDV, datavault4dbt)"],
        ["A cupboard built from the panels", "Information marts (dims and facts) on top"],
        ["You only need a shelf", "Few, stable sources: skip the vault, build stars directly"],
      ],
      breaks: "flat-pack saves money for everyone. A vault adds many tables and joins, which only pays off when sources are many and changing or audits demand full history.",
    },
    svg: () => {
      let b = box(20, 20, 140, 46, "hub_customer", null, "vio", { size: 13.5 }) + box(320, 20, 140, 46, "hub_order", null, "vio", { size: 13.5 });
      b += box(170, 20, 140, 46, "link_cust_order", null, "acc", { size: 12.5 });
      b += box(20, 92, 140, 40, "sat_customer", null, "warn", { size: 13 }) + box(320, 92, 140, 40, "sat_order", null, "warn", { size: 13 });
      b += line(160, 43, 170, 43) + line(310, 43, 320, 43) + line(90, 66, 90, 92) + line(390, 66, 390, 92);
      b += arrow(90, 134, 140, 182, { stroke: C.goodS }) + arrow(240, 68, 300, 182, { stroke: C.goodS }) + arrow(390, 134, 340, 182, { stroke: C.goodS });
      b += box(60, 184, 160, 46, "dim_customers", "via PIT", "good", { size: 13.5, size2: 12 }) + box(260, 184, 160, 46, "fct_orders", "link + sat_order", "good", { size: 13.5, size2: 12 });
      b += t(240, 262, "Generated by dbt macros from a short YAML config", { size: 12.5, fill: C.dim });
      return svg(480, 278, b, "A small Data Vault for customers and orders with marts built on top");
    },
    caption: "Vault tables at the top; the star-schema marts analysts query are built from them.",
    oneline: "Build a vault from a few repeatable table types, generate the SQL, and put star schemas on top, if you truly need one.",
  };

  /* ---------------------------------------------------------------- model-snowflake */
  P["model-snowflake"] = {
    simple: [
      "A **snowflake schema** is a star schema whose dimensions are split into smaller tables.",
      "Instead of one product table holding product, category and department, you get product → category → department, linked by keys. Drawn out, the points of the star branch like a snowflake.",
      "It saves a little space and keeps hierarchies tidy, but every query needs more joins. Most teams keep stars and snowflake only very large or shared hierarchies. (This is unrelated to the company Snowflake.)",
    ],
    analogy: {
      text: "Think of an address book.",
      left: "Address book", right: "Schema choice",
      map: [
        ["Each entry has the full address, city and country", "Star: flat, denormalized dimension"],
        ["Entries hold a city code; a separate city page lists the country", "Snowflake: dimension split into sub-tables"],
        ["One look-up versus flipping two pages", "One join versus a chain of joins"],
      ],
      breaks: "flipping pages is a human cost. In a columnar warehouse the storage saved by snowflaking is usually tiny, so the extra joins rarely pay for themselves.",
    },
    svg: () => {
      let b = t(120, 22, "Star", { bold: true, size: 14 }) + t(360, 22, "Snowflake", { bold: true, size: 14 });
      b += box(20, 40, 120, 40, "fact_sales", null, "acc", { size: 13 });
      b += box(20, 120, 200, 60, "dim_product", "name · category · dept", "plain", { size: 13.5, size2: 12 });
      b += arrow(80, 82, 80, 118);
      b += box(260, 40, 120, 40, "fact_sales", null, "acc", { size: 13 });
      b += box(260, 110, 120, 36, "dim_product", null, "plain", { size: 13 });
      b += box(300, 170, 120, 36, "dim_category", null, "plain", { size: 13 });
      b += box(340, 230, 130, 36, "dim_department", null, "plain", { size: 12.5 });
      b += arrow(320, 82, 320, 108) + arrow(340, 148, 360, 168) + arrow(380, 208, 400, 228);
      b += t(120, 212, "1 join", { size: 13, fill: C.goodT, bold: true });
      b += t(250, 252, "3 joins", { size: 13, fill: C.warnT, bold: true });
      return svg(480, 280, b, "A star dimension versus the same dimension snowflaked into three tables");
    },
    caption: "Same data. The snowflake splits the product hierarchy into a chain, so queries walk more joins.",
    oneline: "A snowflake schema splits a star's dimensions into chains of smaller tables, trading joins for tidiness.",
  };

  /* ---------------------------------------------------------------- model-schema-types */
  const SCHEMAS = {
    "Star": { joins: 1, tables: "1 fact + flat dims", when: "The default for one business process.", k: "good" },
    "Snowflake": { joins: 3, tables: "1 fact + chained dims", when: "Very large or shared hierarchies; tidy, more joins.", k: "warn" },
    "Galaxy": { joins: 1, tables: "several facts + shared dims", when: "Many processes (sales, returns) on the same dimensions.", k: "acc" },
    "One Big Table": { joins: 0, tables: "one wide table", when: "One heavy dashboard on a columnar warehouse; fastest, least flexible.", k: "vio" },
  };
  P["model-schema-types"] = {
    simple: [
      "Warehouse schemas sit on one line, from **split up** (normalized) to **all in one place** (denormalized).",
      "**Snowflake** splits dimensions into chains. **Star** keeps each dimension flat around one fact. **Galaxy** has several facts sharing the same dimensions. **One Big Table** pre-joins everything into a single wide table.",
      "Moving right means fewer joins and faster reads, but more copying and less flexibility.",
    ],
    analogy: {
      text: "Think of ways to pack for a school trip.",
      left: "Packing", right: "Schema type",
      map: [
        ["Small pouches inside bags inside a suitcase", "Snowflake: nested, tidy, slow to unpack"],
        ["One suitcase with a few labelled bags", "Star: one level of grouping"],
        ["Siblings' suitcases sharing one toiletry bag", "Galaxy: facts sharing conformed dimensions"],
        ["Everything stuffed into one big duffel", "One Big Table: grab and go, hard to reorganise"],
      ],
      breaks: "packing is done once. Schemas get re-queried thousands of times a day, so the right choice depends on who queries what, not on which looks neatest.",
    },
    svg: () => {
      let b = t(240, 22, "normalize ←———————————→ denormalize", { size: 13.5, fill: C.tx, bold: true });
      const S = [["Snowflake", "warn", "3 joins"], ["Star", "good", "1 join"], ["Galaxy", "acc", "1 join / fact"], ["One Big Table", "vio", "0 joins"]];
      S.forEach(([n, k, j], i) => {
        const x = 10 + i * 118;
        b += box(x, 40, 108, 46, n, j, k, { size: 13, size2: 12 });
      });
      b += arrow(20, 110, 460, 110, { stroke: C.line });
      b += t(20, 132, "less copying, more joins", { a: "start", size: 12, fill: C.dim });
      b += t(460, 132, "fewer joins, more copying", { a: "end", size: 12, fill: C.dim });
      return svg(480, 150, b, "Schema types on the normalize to denormalize spectrum");
    },
    caption: "Each schema is a point on one line. Pick by how the data is queried.",
    ix: el => {
      const names = Object.keys(SCHEMAS);
      choice(el, { label: "Show me:", options: names, value: 0 }, i => {
        const n = names[i], S = SCHEMAS[n];
        let b = "";
        if (n === "Star") {
          b += box(180, 90, 120, 46, "fact_sales", null, "acc", { size: 13 });
          [["dim_date", 180, 20], ["dim_product", 20, 94], ["dim_customer", 340, 94], ["dim_store", 180, 166]].forEach(([d, x, y]) => { b += box(x, y, 120, 38, d, null, "plain", { size: 12.5 }); });
          b += line(240, 58, 240, 90) + line(140, 113, 180, 113) + line(300, 113, 340, 113) + line(240, 136, 240, 166);
        } else if (n === "Snowflake") {
          b += box(20, 90, 110, 46, "fact_sales", null, "acc", { size: 13 });
          [["dim_product", 160], ["dim_category", 270], ["dim_dept", 380]].forEach(([d, x], j) => { b += box(x - 10, 94, 100, 38, d, null, "plain", { size: 12 }); b += arrow(x - 30 + (j ? 0 : 0), 113, x - 12, 113); });
          b += box(160, 20, 100, 38, "dim_date", null, "plain", { size: 12 }) + line(75, 90, 160, 50);
        } else if (n === "Galaxy") {
          b += box(40, 40, 140, 46, "fact_sales", null, "acc", { size: 13 }) + box(300, 40, 140, 46, "fact_returns", null, "acc", { size: 13 });
          [["dim_date", 20], ["dim_product", 180], ["dim_customer", 340]].forEach(([d, x]) => { b += box(x, 150, 120, 38, d, null, "good", { size: 12.5 }); b += line(110, 86, x + 60, 150) + line(370, 86, x + 60, 150); });
        } else {
          b += box(20, 60, 440, 80, null, null, "vio");
          b += t(240, 90, "sales_obt", { bold: true, size: 14, fill: C.vioT });
          b += t(240, 116, "date · year · product · category · customer · city · qty · amount", { size: 11.5, fill: C.tx });
        }
        b += t(240, 222, `${S.tables} · ${S.joins} join${S.joins === 1 ? "" : "s"} for "sales by category"`, { size: 12.5, fill: C.tx });
        return { svg: svg(480, 238, b, n + " schema"), note: "<b>When:</b> " + S.when };
      });
    },
    oneline: "Star, snowflake, galaxy and One Big Table are points on a line from split-up to all-in-one.",
  };

  /* ---------------------------------------------------------------- model-galaxy-schema */
  P["model-galaxy-schema"] = {
    simple: [
      "A real business tracks many processes: sales, returns, shipments, stock. Each gets its own fact table, at its own grain.",
      "A **galaxy schema** (also called a fact constellation) is several fact tables that **share** the same dimension tables: one `dim_date`, one `dim_product`, one `dim_customer`.",
      "Shared (**conformed**) dimensions mean \"sales minus returns by product\" lines up exactly, because both facts mean the same thing by \"product\".",
    ],
    analogy: {
      text: "Think of several school clubs that all use the same pupil register.",
      left: "School clubs", right: "Galaxy schema",
      map: [
        ["Football club's match sheets", "`fact_sales`"],
        ["Chess club's game sheets", "`fact_returns`"],
        ["One shared pupil register", "Conformed `dim_customer`"],
        ["One shared school calendar", "Conformed `dim_date`"],
        ["\"Who plays both?\" is easy to answer", "Drill-across between facts on shared dims"],
      ],
      breaks: "clubs can share one register easily. In a warehouse, conformed dimensions need agreement between teams on keys and meanings, which is mostly an organisational job.",
    },
    svg: () => {
      let b = box(30, 30, 160, 50, "fact_sales", "grain: order line", "acc", { size: 14, size2: 12 });
      b += box(290, 30, 160, 50, "fact_returns", "grain: return line", "acc", { size: 14, size2: 12 });
      const D = [["dim_date", 20], ["dim_product", 180], ["dim_customer", 340]];
      D.forEach(([d, x]) => { b += box(x, 150, 120, 42, d, "conformed", "good", { size: 13, size2: 11 }); b += line(110, 80, x + 60, 150, { stroke: C.goodS }) + line(370, 80, x + 60, 150, { stroke: C.goodS }); });
      b += t(240, 230, "Both facts join to the same dimension rows,", { size: 12.5, fill: C.dim });
      b += t(240, 248, "so net sales by product can be compared directly.", { size: 12.5, fill: C.dim });
      return svg(480, 264, b, "Galaxy schema with two fact tables sharing three conformed dimensions");
    },
    caption: "Two facts, three shared dimensions. Shared means every report means the same \"product\".",
    oneline: "A galaxy schema is several fact tables sharing the same dimension tables, so their numbers line up.",
  };

  /* ---------------------------------------------------------------- model-obt */
  P["model-obt"] = {
    simple: [
      "**One Big Table** (OBT) goes all the way: the facts and every description are pre-joined into one very wide table.",
      "Columnar warehouses (BigQuery, Snowflake) read only the columns a query uses, so a 200-column table isn't slow if you touch 5 columns. With no joins, dashboards are simple and fast.",
      "The cost: descriptions are copied onto every row, a renamed category means rewriting history, and each OBT tends to serve just one use.",
    ],
    analogy: {
      text: "Think of a printed exam results sheet.",
      left: "Results sheet", right: "One Big Table",
      map: [
        ["Name, class, house, teacher, every mark on one line", "All attributes pre-joined into each row"],
        ["Reading one column down the page", "Columnar scan of just the needed columns"],
        ["No flipping to other sheets", "Zero joins at query time"],
        ["A teacher changes name: reprint the sheet", "Rebuild the OBT when dimensions change"],
      ],
      breaks: "a sheet is small. An OBT of billions of rows repeats every description billions of times; compression helps a lot, but rebuilding it after a dimension change is real work.",
    },
    svg: () => {
      let b = t(240, 22, "sales_obt: everything on one row", { bold: true, size: 14 });
      const cols = ["date", "region", "product", "category", "customer", "qty", "amount"];
      b += table(16, 36, cols, [["11-01", "West", "Mug", "Kitchen", "Ava", "2", "24"], ["11-01", "West", "Pen", "Office", "Ava", "1", "3"]], { cw: [62, 62, 66, 76, 72, 46, 64], rh: 30, size: 12 });
      b += `<rect x="144" y="36" width="142" height="90" rx="3" style="fill:none;stroke:${C.goodS};stroke-width:2.6"/>`;
      b += `<rect x="404" y="36" width="64" height="90" rx="3" style="fill:none;stroke:${C.goodS};stroke-width:2.6"/>`;
      b += t(240, 152, "SELECT category, SUM(amount) reads only the green columns.", { size: 12.5, fill: C.goodT });
      b += t(240, 172, "Columnar storage skips the rest, and there are no joins.", { size: 12.5, fill: C.dim });
      return svg(480, 188, b, "A wide one-big-table where a query reads only two columns");
    },
    caption: "All descriptions sit on each row. A columnar engine reads only the columns the query names.",
    oneline: "One Big Table pre-joins everything into one wide table, so queries need no joins at all.",
  };

  /* ---------------------------------------------------------------- model-aggregates */
  P["model-aggregates"] = {
    simple: [
      "Most dashboards ask the same coarse questions again and again: revenue per month per region.",
      "An **aggregate table** stores those answers already worked out, at a coarser grain. The dashboard reads a few thousand rows instead of adding up billions.",
      "You refresh it as new data arrives, ideally only the latest days. Some warehouses can even send a query to the aggregate automatically (aggregate navigation).",
    ],
    analogy: {
      text: "Think of a shopkeeper who writes the day's total on the calendar each evening.",
      left: "The shop", right: "Aggregate tables",
      map: [
        ["Every receipt in a shoebox", "The detailed fact table (billions of rows)"],
        ["The daily total written on the calendar", "`agg_daily_sales` (one row per day)"],
        ["\"How did March go?\" Add up 31 boxes, not 9,000 receipts", "Query the aggregate, not the fact"],
        ["Each evening, add just today's total", "Incremental refresh of recent partitions"],
        ["A late receipt from last week", "Late data: re-aggregate the affected days"],
      ],
      breaks: "calendar totals can't answer \"which customer bought mugs?\". Aggregates only answer questions at their grain or coarser, so you still keep the detail table.",
    },
    svg: () => {
      let b = box(20, 30, 200, 60, "fact_sales", "2,000,000,000 rows", "plain", { size: 15, size2: 13 });
      b += arrow(222, 60, 258, 60, { label: "GROUP BY day, region", dy: -40, size: 11 });
      b += box(262, 30, 200, 60, "agg_daily_region", "≈ 3,650 rows / year", "good", { size: 14, size2: 13 });
      b += box(140, 140, 200, 46, "dashboard query", "monthly revenue by region", "acc", { size: 14, size2: 12 });
      b += arrow(300, 138, 350, 94, { stroke: C.goodS, sw: 2.4, label: "reads", dx: 36, dy: 0 });
      b += arrow(180, 138, 120, 94, { stroke: C.badS, dash: true, label: "avoids", dx: -40, dy: 0 });
      b += t(240, 220, "Example: 10 regions × 365 days ≈ 3,650 rows a year.", { size: 12.5, fill: C.dim });
      return svg(480, 236, b, "An aggregate table summarises a large fact so dashboards read far fewer rows");
    },
    caption: "The dashboard reads the small daily summary instead of the two-billion-row fact.",
    ix: el => {
      slider(el, { label: "Detail rows in the fact (millions):", min: 10, max: 5000, step: 10, value: 2000, fmt: v => v.toLocaleString("en-US") + " M" }, m => {
        const detail = m * 1e6, agg = 10 * 365 * 3;
        const ratio = detail / agg;
        const X = v => 24 + Math.log10(v) / 10 * 380;
        let b = t(240, 22, "Rows read for \"revenue by region, last 3 years\" (log scale)", { size: 12.5, fill: C.tx, bold: true });
        b += t(20, 58, "fact", { a: "start", size: 12.5, fill: C.badT, bold: true });
        b += `<rect x="70" y="44" width="${(X(detail) - 24).toFixed(1)}" height="22" rx="4" style="fill:${C.bad};stroke:${C.badS}"/>`;
        b += t(20, 108, "agg", { a: "start", size: 12.5, fill: C.goodT, bold: true });
        b += `<rect x="70" y="94" width="${(X(agg) - 24).toFixed(1)}" height="22" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
        b += t(74 + X(agg) - 24, 110, agg.toLocaleString("en-US") + " rows", { a: "start", size: 12, fill: C.tx });
        b += t(240, 150, `The aggregate reads ~${Math.round(ratio).toLocaleString("en-US")}x fewer rows.`, { size: 14, fill: C.goodT, bold: true });
        return { svg: svg(480, 166, b, "Rows read: fact versus aggregate"), note: `Fact: <b>${detail.toLocaleString("en-US")}</b> rows. Aggregate at day × region (10 regions, 3 years): <b>${agg.toLocaleString("en-US")}</b> rows. The aggregate stays the same size however big the fact grows.` };
      });
    },
    oneline: "Aggregate tables keep popular answers ready-made, so dashboards read thousands of rows instead of billions.",
  };

  /* ---------------------------------------------------------------- model-interview-prep */
  P["model-interview-prep"] = {
    simple: [
      "This page reviews the whole Data Modeling track before an interview.",
      "Almost every modeling question comes back to a few ideas: declare the **grain** first, split **facts** from **dimensions**, handle change with **SCD Type 2**, use **surrogate keys**, and pick a schema by how the data will be read.",
      "In a design round, say those decisions out loud in that order. It shows you think like a modeler, not just a SQL writer.",
    ],
    analogy: {
      text: "Think of an architect explaining a house plan.",
      left: "The house plan", right: "A modeling interview",
      map: [
        ["\"Who lives here, and how will they use it?\"", "Business process and questions"],
        ["\"One room per…\"", "Declare the grain"],
        ["Load-bearing walls versus furniture", "Facts (measures) versus dimensions (context)"],
        ["Planning for the family growing", "SCD Type 2 and surrogate keys"],
        ["Open plan or separate rooms", "Star, snowflake, galaxy or One Big Table"],
      ],
      breaks: "a house is built once. Interviewers will change a requirement mid-answer, so show how your model absorbs the change instead of defending the first draft.",
    },
    svg: () => {
      const S = [["1", "Business process", "e.g. online orders"], ["2", "Grain", "one row per order line"], ["3", "Dimensions", "date · product · customer"], ["4", "Facts", "qty · amount · discount"], ["5", "Change & keys", "SCD2 + surrogate keys"]];
      let b = t(240, 22, "The 5-step answer to \"model this for analytics\"", { bold: true, size: 14 });
      S.forEach(([n, a, s], i) => {
        const y = 38 + i * 52;
        b += badge(34, y + 20, n, "acc");
        b += box(56, y, 404, 40, a + ": " + s, null, i === 1 ? "warn" : "plain", { size: 13 });
      });
      return svg(480, 306, b, "Five-step dimensional modeling answer for interviews");
    },
    caption: "Kimball's four steps plus how you handle change. Say the grain before anything else.",
    oneline: "Good modeling answers start with the grain, then facts and dimensions, then how history and keys are handled.",
  };
})();
