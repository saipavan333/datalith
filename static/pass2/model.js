/* Datalith pass 2 — Track 5: Data Modeling & Warehousing, part A
   (modeling for analytics, dimensional modelling, philosophies & serving). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- model-normalization */
  P["model-normalization"] = {
    simple: [
      "The same data gets shaped two opposite ways, depending on its job.",
      "An app's database (**OLTP**, Online Transaction Processing) handles many tiny writes: \"place this order\". It stores each fact once, split across many tables, so writes stay safe and fast.",
      "An analytics warehouse (**OLAP**, Online Analytical Processing) answers big questions over millions of rows: \"sales by region per month\". It copies facts into fewer, wider tables so those questions need fewer joins. A data engineer's job is moving data from the first shape to the second.",
    ],
    analogy: {
      text: "Think of a restaurant kitchen versus the owner's monthly report.",
      left: "The restaurant", right: "In data systems",
      map: [
        ["Each order ticket written once, clipped to its table", "OLTP: normalized (3NF), each fact once"],
        ["Waiters adding and changing tickets all night", "Many small, concurrent writes"],
        ["The owner's sheet: dish, region, month, takings on one line", "OLAP: denormalized, wide tables"],
        ["Copying the night's tickets into the report", "ETL/ELT from OLTP to the warehouse"],
      ],
      breaks: "a paper report is done once. A warehouse reloads every day, so the copies must be rebuilt or updated reliably, which is where most pipeline work goes.",
    },
    svg: () => {
      let b = t(120, 24, "OLTP: write-optimised", { bold: true, size: 14 }) + t(360, 24, "OLAP: read-optimised", { bold: true, size: 14 });
      b += box(20, 42, 90, 36, "customers", null, "plain", { size: 13 }) + box(130, 42, 90, 36, "orders", null, "plain", { size: 13 });
      b += box(20, 110, 90, 36, "products", null, "plain", { size: 13 }) + box(130, 110, 90, 36, "categories", null, "plain", { size: 12.5 });
      b += line(110, 60, 130, 60) + line(175, 78, 175, 110) + line(110, 128, 130, 128) + line(65, 78, 65, 110, { dash: true });
      b += t(120, 176, "many narrow tables, many joins", { size: 12, fill: C.dim });
      b += t(120, 194, "fast, safe single-row writes", { size: 12, fill: C.goodT });
      b += box(270, 42, 190, 104, null, null, "acc");
      b += t(365, 66, "sales_wide", { bold: true, size: 14, fill: C.accT });
      ["date · region · product", "category · customer", "qty · amount"].forEach((s, i) => { b += t(365, 90 + i * 20, s, { size: 12.5, fill: C.tx }); });
      b += t(365, 176, "few wide tables, few joins", { size: 12, fill: C.dim });
      b += t(365, 194, "fast scans over millions of rows", { size: 12, fill: C.goodT });
      b += arrow(222, 94, 266, 94, { label: "ETL", stroke: C.warnS, lfill: C.warnT });
      b += box(20, 220, 440, 48, "Same facts, two shapes: normalize where data is written,", "denormalize where it is read.", "warn", { size: 13.5, size2: 13.5 });
      return svg(480, 284, b, "Normalized OLTP tables are reshaped into denormalized analytics tables by ETL");
    },
    caption: "Left: the app's normalized tables. Right: the warehouse's wide table built from them.",
    oneline: "Apps store each fact once so writing is safe, and warehouses copy facts together so reading is fast.",
  };

  /* ---------------------------------------------------------------- model-star-schema */
  P["model-star-schema"] = {
    simple: [
      "A **star schema** is the most common way to arrange data for reports.",
      "In the middle sits a **fact table**: one row per event, like one sale, holding numbers such as quantity and amount. Around it sit **dimension tables** that describe the event: when, which product, which customer, which store.",
      "Drawn out, it looks like a star. Every question is one join from the middle to a point, which keeps queries simple and fast.",
    ],
    analogy: {
      text: "Think of a till receipt pinned to a noticeboard, with strings to cards that explain it.",
      left: "The noticeboard", right: "In the warehouse",
      map: [
        ["The receipt line: 2 mugs, 24 rupees", "A fact row with measures (qty, amount)"],
        ["The string to the \"date\" card", "Foreign key to `dim_date`"],
        ["The product card: mug, kitchen, homeware", "`dim_product` with flat attributes"],
        ["The customer card: name, city", "`dim_customer`"],
        ["\"Total takings by city\"", "Join fact to dim_customer, GROUP BY city"],
      ],
      breaks: "a noticeboard holds a few receipts. A real fact table holds billions of rows, so it stays narrow (keys and numbers) while the description lives on the cards.",
    },
    svg: () => {
      let b = box(170, 120, 140, 70, "fact_sales", "keys · qty · amount", "acc", { size: 15, size2: 12.5 });
      const D = [["dim_date", "day · month · year", 170, 20], ["dim_product", "name · category", 10, 128], ["dim_customer", "name · city", 330, 128], ["dim_store", "city · region", 170, 236]];
      D.forEach(([n, s, x, y]) => { b += box(x, y, 140, 54, n, s, "plain", { size: 14, size2: 12 }); });
      b += line(240, 74, 240, 120) + line(150, 155, 170, 155) + line(310, 155, 330, 155) + line(240, 190, 240, 236);
      b += t(240, 316, "Every dimension is one join from the fact.", { size: 13, fill: C.tx });
      b += t(240, 336, "Measures live in the fact; descriptions live in the dimensions.", { size: 12.5, fill: C.dim });
      return svg(480, 352, b, "Star schema: a central fact table joined to four dimension tables");
    },
    caption: "The fact in the middle holds the numbers. Each point of the star describes one side of the event.",
    oneline: "A star schema puts the numbers in one middle table and the descriptions in tables around it.",
  };

  /* ---------------------------------------------------------------- model-scd2 */
  P["model-scd2"] = {
    simple: [
      "Descriptions change. A customer moves from Pune to Delhi. A product moves to a new category.",
      "A **Slowly Changing Dimension** (SCD) is the rule for what to do then. **Type 1** overwrites the old value, so history is lost. **Type 2** keeps the old row, closes it with an end date, and adds a new row. **Type 3** keeps just one \"previous value\" column.",
      "Type 2 is the one interviewers ask about. It lets last year's sales stay under the city the customer lived in back then.",
    ],
    analogy: {
      text: "Think of the pencil marks on a door frame where a family records a child's height.",
      left: "The door frame", right: "In the dimension",
      map: [
        ["Rub out the old mark, draw the new one", "Type 1: overwrite, no history"],
        ["Keep every mark, each with its date", "Type 2: a new row per version"],
        ["The date the next mark was drawn", "`valid_to` of the old row"],
        ["The top mark is today's height", "`is_current = true` (or `valid_to` NULL)"],
        ["Write \"was 120 cm\" next to the new mark", "Type 3: one `previous_city` column"],
      ],
      breaks: "the door frame has one child. A dimension has millions of customers, and each version gets its own surrogate key, so facts point at the exact version that was true when the sale happened.",
    },
    svg: () => {
      let b = t(240, 22, "Ava moves from Pune to Delhi on 2026-03-01 (Type 2)", { bold: true, size: 13.5 });
      b += table(14, 40, ["key", "cust", "city", "valid_from", "valid_to", "cur"], [["17", "Ava", "Pune", "2024-05-10", "2026-03-01", "N"], ["42", "Ava", "Delhi", "2026-03-01", null, "Y"]], { cw: [44, 52, 64, 100, 100, 40], rh: 30, hl: { 0: "plain", 1: "good" } });
      b += t(240, 148, "Old row closed, new row added with a new surrogate key.", { size: 12.5, fill: C.dim });
      b += box(20, 170, 200, 50, "sale on 2025-11-02", "fact row → key 17 (Pune)", "acc", { size: 13.5, size2: 12 });
      b += box(260, 170, 200, 50, "sale on 2026-04-15", "fact row → key 42 (Delhi)", "acc", { size: 13.5, size2: 12 });
      b += arrow(120, 168, 120, 132, { stroke: C.accS }) + arrow(360, 168, 360, 132, { stroke: C.accS });
      b += t(240, 254, "Sales by city now stay true to history.", { size: 13, fill: C.tx });
      return svg(480, 270, b, "SCD Type 2 closes the old dimension row and adds a new version");
    },
    caption: "Each fact points at the version that was current when it happened.",
    ix: el => {
      choice(el, { label: "Handle the move with:", options: ["Type 1", "Type 2", "Type 3"], value: 1 }, i => {
        let b = "", note = "";
        if (i === 0) {
          b += table(70, 50, ["key", "cust", "city"], [["17", "Ava", "Delhi"]], { cw: [80, 100, 160], rh: 30, title: "dim_customer after the move", hl: { 0: "warn" } });
          b += box(70, 136, 340, 48, "2025 Pune sale now reports as Delhi", null, "bad", { size: 13.5 });
          note = "One row, overwritten. Simple and small, but <b>history is rewritten</b>: old sales move to Delhi.";
        } else if (i === 1) {
          b += table(30, 50, ["key", "city", "valid_from", "valid_to"], [["17", "Pune", "2024-05-10", "2026-03-01"], ["42", "Delhi", "2026-03-01", null]], { cw: [60, 90, 135, 135], rh: 30, title: "dim_customer after the move", hl: { 1: "good" } });
          b += box(70, 156, 340, 48, "2025 sale stays Pune; 2026 sale is Delhi", null, "good", { size: 13.5 });
          note = "Two rows. Full history, and each fact joins to its own version. The table grows with every change.";
        } else {
          b += table(40, 50, ["key", "cust", "city", "previous_city"], [["17", "Ava", "Delhi", "Pune"]], { cw: [60, 80, 120, 140], rh: 30, title: "dim_customer after the move", hl: { 0: "warn" } });
          b += box(70, 136, 340, 48, "Only one step back; a 2nd move loses Pune", null, "warn", { size: 13.5 });
          note = "One row with a previous-value column. Good for \"compare with last value\", but it only remembers one change.";
        }
        return { svg: svg(480, 220, b, "SCD result"), note };
      });
    },
    oneline: "SCD Type 2 never rubs out the past: it closes the old row and adds a new one with dates.",
  };

  /* ---------------------------------------------------------------- model-warehouse-vs-lake */
  P["model-warehouse-vs-lake"] = {
    simple: [
      "Analytics data lives in one of three kinds of place.",
      "A **warehouse** (BigQuery, Snowflake) holds clean tables with a fixed shape, checked on the way in. A **data lake** (files in cloud storage) holds anything, raw and cheap, and you work out the shape when you read it.",
      "A **lakehouse** keeps data as open files in the lake but adds a table layer on top (Delta Lake, Apache Iceberg, Apache Hudi) that gives warehouse features: transactions, schemas and time travel.",
    ],
    analogy: {
      text: "Think of three ways to store a family's photos.",
      left: "The photos", right: "Storage paradigm",
      map: [
        ["Printed, labelled and filed in albums", "Warehouse: schema-on-write"],
        ["Every phone dump thrown into one big drive", "Lake: schema-on-read, cheap, any format"],
        ["The same drive, plus a catalog app that tracks every album", "Lakehouse: open files + table format"],
        ["Albums are quick to browse, slow to add to", "Warehouse: fast, governed, less flexible"],
        ["The drive fills with duplicates nobody can find", "A \"data swamp\""],
      ],
      breaks: "a photo app can't run SQL. The point of the lakehouse is that many engines (Spark, Trino, warehouses) can read the same files as proper tables.",
    },
    svg: () => {
      const cols = [["Warehouse", "acc", ["clean tables", "schema on write", "fast SQL, BI"]], ["Lake", "warn", ["raw files, any format", "schema on read", "cheap, flexible"]], ["Lakehouse", "good", ["open files + tables", "ACID, time travel", "one copy, many tools"]]];
      let b = "";
      cols.forEach(([n, k, items], i) => {
        const x = 12 + i * 156;
        b += box(x, 20, 144, 40, n, null, k, { size: 15 });
        items.forEach((s, j) => { b += box(x, 72 + j * 44, 144, 36, s, null, "plain", { size: 12, bold: false }); });
      });
      b += box(168, 220, 300, 44, "Delta Lake · Apache Iceberg · Apache Hudi", "table layer over Parquet files", "good", { size: 13, size2: 12 });
      b += arrow(396, 206, 396, 218, { stroke: C.goodS });
      b += box(12, 220, 144, 44, "cloud storage", "GCS · S3 · ADLS", "plain", { size: 13, size2: 12 });
      b += arrow(158, 242, 166, 242);
      return svg(480, 280, b, "Warehouse, lake and lakehouse compared");
    },
    caption: "The lakehouse keeps the lake's cheap open files and adds a table layer so they behave like warehouse tables.",
    oneline: "Warehouses store tidy tables, lakes store anything as files, and lakehouses add table rules on top of the lake files.",
  };

  /* ---------------------------------------------------------------- model-mpp-greenplum */
  P["model-mpp-greenplum"] = {
    simple: [
      "One computer reading 10 TB takes a long time. **MPP** (Massively Parallel Processing) splits the table across many machines, and they all work at once.",
      "Each machine (a **segment** in Greenplum) owns its own slice of rows and its own disk. A **coordinator** takes your SQL, sends the plan to every segment, and merges their answers.",
      "How rows are spread matters. You choose a **distribution key**. A good key spreads rows evenly; a bad one piles them on one segment, and everyone waits for it.",
    ],
    analogy: {
      text: "Think of a class marking a huge pile of exam papers.",
      left: "Marking the exams", right: "In an MPP database",
      map: [
        ["The teacher hands out the work", "The coordinator plans and dispatches"],
        ["Each student gets their own stack", "Each segment owns a slice of rows"],
        ["Papers split by roll number", "Hash of the distribution key picks the segment"],
        ["Everyone marks at the same time", "Segments scan in parallel"],
        ["One student got half the pile", "Data skew: the slowest segment sets the speed"],
        ["Passing papers between desks to compare", "Redistribute / broadcast motion before a join"],
      ],
      breaks: "students can swap papers quickly across a room. Moving rows between machines goes over the network, which is why you pick distribution keys that let big joins happen locally.",
    },
    svg: () => {
      let b = box(150, 14, 180, 44, "Coordinator", "plans, merges results", "vio", { size: 15, size2: 12 });
      for (let i = 0; i < 4; i++) {
        const x = 12 + i * 118;
        b += arrow(240, 60, x + 52, 102, { stroke: C.vioS, sw: 1.4 });
        b += box(x, 104, 104, 48, "segment " + (i + 1), "own CPU + disk", "acc", { size: 13.5, size2: 11.5 });
        b += box(x + 8, 166, 88, 26, "~25% of rows", null, "plain", { size: 11, bold: false });
      }
      b += t(240, 222, "DISTRIBUTED BY (customer_id): hash(key) picks the segment", { size: 12, mono: true, fill: C.tx });
      b += t(240, 246, "Even spread = all segments finish together.", { size: 12.5, fill: C.goodT });
      b += t(240, 266, "Skewed key = one segment does most of the work.", { size: 12.5, fill: C.badT });
      return svg(480, 282, b, "MPP shared-nothing architecture with a coordinator and four segments");
    },
    caption: "Shared nothing: each segment scans only its own rows, in parallel, and the coordinator merges the answers.",
    ix: el => {
      choice(el, { label: "Distribute 1,000,000 orders by:", options: ["order_id", "customer_id", "country", "status"], value: 0 }, i => {
        // illustrative shares of rows per segment (8 segments) for each key choice
        const S = [
          [12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5],
          [13.1, 12.2, 12.9, 11.8, 12.6, 12.4, 12.7, 12.3],
          [61, 9, 8, 7, 6, 4, 3, 2],
          [70, 25, 5, 0, 0, 0, 0, 0],
        ][i];
        const why = [
          "Unique ids hash evenly: every segment gets about 1/8.",
          "Many customers: close to even, and joins to <code>customers</code> on the same key stay local.",
          "Few values and one big country: most rows land on one segment (skew).",
          "Only 3 values (shipped, delivered, cancelled): at most 3 segments do any work.",
        ][i];
        let b = t(240, 22, "Share of rows per segment (illustrative)", { size: 13, fill: C.tx, bold: true });
        S.forEach((v, j) => {
          const x = 30 + j * 54, h = v * 2.2;
          b += `<rect x="${x}" y="${200 - h}" width="40" height="${h}" rx="3" style="fill:${v > 20 ? C.bad : C.acc};stroke:${v > 20 ? C.badS : C.accS}"/>`;
          b += t(x + 20, 196 - h, v + "%", { size: 11, fill: C.tx });
          b += t(x + 20, 218, "s" + (j + 1), { size: 11.5, fill: C.dim });
        });
        b += line(24, 200, 456, 200, { stroke: "#3b4760" });
        const slow = Math.max(...S) / 12.5;
        b += t(240, 244, `Query time ≈ slowest segment: ${slow.toFixed(1)}x an even spread`, { size: 12.5, fill: slow > 1.5 ? C.badT : C.goodT });
        return { svg: svg(480, 260, b, "Row distribution across segments"), note: why };
      });
    },
    oneline: "MPP splits a table across many machines that work at once, so the key that spreads the rows decides the speed.",
  };

  /* ---------------------------------------------------------------- model-fact-dimension */
  P["model-fact-dimension"] = {
    simple: [
      "Dimensional modeling uses two kinds of table. **Facts** record things that happened, with numbers you add up. **Dimensions** describe them, with words you filter and group by.",
      "Before anything else you declare the **grain**: what exactly one fact row means. \"One row per order line\" is a grain. So is \"one row per product per store per day\".",
      "Get the grain wrong and totals double-count. Get it right and every number adds up.",
    ],
    analogy: {
      text: "Think of a school's attendance register.",
      left: "The register", right: "In the model",
      map: [
        ["One tick per pupil per day", "The grain: pupil × day"],
        ["The tick itself (present = 1)", "A measure in the fact table"],
        ["The pupil's name, class, house", "Attributes in `dim_pupil`"],
        ["The date, term, weekday", "Attributes in `dim_date`"],
        ["Mixing daily ticks with weekly totals on one page", "Mixed grain: sums come out wrong"],
      ],
      breaks: "a register has one kind of tick. Real facts have measures that don't always add up: you can sum sales across days, but not account balances (those are semi-additive).",
    },
    svg: () => {
      let b = t(240, 22, "Grain: one row per order line", { bold: true, size: 14 });
      b += table(20, 40, ["date_key", "prod_key", "cust_key", "qty", "amount"], [["20261101", "7", "301", "2", "24.0"], ["20261101", "9", "301", "1", "3.5"], ["20261102", "7", "544", "5", "60.0"]], { cw: [96, 86, 86, 64, 80], rh: 30, title: "", hl: {} });
      b += `<rect x="20" y="40" width="268" height="120" rx="4" style="fill:none;stroke:${C.accS};stroke-width:2.4"/>`;
      b += `<rect x="288" y="40" width="144" height="120" rx="4" style="fill:none;stroke:${C.goodS};stroke-width:2.4"/>`;
      b += t(154, 180, "keys → dimensions (context)", { size: 12.5, fill: C.accT, bold: true });
      b += t(360, 180, "measures (add up)", { size: 12.5, fill: C.goodT, bold: true });
      b += box(20, 200, 140, 40, "dim_date", null, "acc", { size: 13.5 }) + box(170, 200, 140, 40, "dim_product", null, "acc", { size: 13.5 }) + box(320, 200, 140, 40, "dim_customer", null, "acc", { size: 13.5 });
      b += t(240, 270, "Rule of thumb: if you SUM it, it's a measure;", { size: 12.5, fill: C.dim });
      b += t(240, 288, "if you filter or group by it, it's a dimension attribute.", { size: 12.5, fill: C.dim });
      return svg(480, 304, b, "A fact table with dimension keys and additive measures at a declared grain");
    },
    caption: "Each fact row is one order line: keys point to descriptions, measures hold the numbers.",
    ix: el => {
      choice(el, { label: "Declare the grain:", options: ["order line", "order", "product × day"], value: 0 }, i => {
        const G = [
          ["one row per order line", "50,000,000", "per product: yes · per order: yes", "good", "Finest grain: answers everything, biggest table."],
          ["one row per order", "18,000,000", "per product: no (lines merged)", "warn", "Smaller, but you can no longer ask \"which products?\" from this fact."],
          ["one row per product per day", "up to 730,000", "per customer: no · per order: no", "warn", "A summary grain: great for daily dashboards, useless for customer questions."],
        ][i];
        let b = t(240, 26, "Fact grain: " + G[0], { bold: true, size: 14 });
        b += box(40, 48, 400, 46, "rows per year (example shop)", G[1], "acc", { size: 13, size2: 15 });
        b += box(40, 108, 400, 46, "can you break it down…", G[2], G[3], { size: 13, size2: 13 });
        b += t(240, 186, "Example shop: 18 M orders/yr, ~2.8 lines per order, 2,000 products.", { size: 11.5, fill: C.faint });
        return { svg: svg(480, 202, b, "Effect of choosing a grain"), note: G[4] };
      });
    },
    oneline: "Facts hold the numbers, dimensions hold the descriptions, and the grain says what one fact row means.",
  };

  /* ---------------------------------------------------------------- model-keys */
  P["model-keys"] = {
    simple: [
      "Every dimension row needs an id that facts can point to.",
      "A **natural key** comes from the real world or the source app: an email, a product code, the app's `customer_id`. A **surrogate key** is a plain number the warehouse makes up: 1, 2, 3 ...",
      "Warehouses usually point facts at surrogate keys. They never change, they're small and fast to join, and they let one customer have several versions over time (SCD Type 2).",
    ],
    analogy: {
      text: "Think of the token you get at a coat check.",
      left: "At the coat check", right: "In the warehouse",
      map: [
        ["Your name", "Natural key: meaningful, can change or clash"],
        ["Token number 214", "Surrogate key: meaningless, never reused"],
        ["Two guests both called \"Ravi Kumar\"", "Natural keys that collide across sources"],
        ["You swap coats; you get a new token", "A new SCD2 version gets a new surrogate key"],
        ["The token list still has your name next to it", "The natural key is kept as a column"],
      ],
      breaks: "a coat token is thrown away at night. Surrogate keys live forever, and if a pipeline re-generates them in a different order, every fact points at the wrong row. Generate them once and keep them stable.",
    },
    svg: () => {
      let b = table(20, 40, ["customer_key", "customer_id", "source", "city"], [["1", "C-100", "app", "Pune"], ["2", "C-100", "crm", "Pune"], ["3", "C-100", "app", "Delhi"]], { cw: [110, 110, 80, 80], rh: 30, title: "dim_customer", hl: { 2: "good" } });
      b += `<rect x="20" y="40" width="110" height="120" rx="4" style="fill:none;stroke:${C.accS};stroke-width:2.6"/>`;
      b += t(75, 182, "surrogate: unique, stable", { size: 12, fill: C.accT, bold: true });
      b += t(185, 182, "natural: repeats", { size: 12, fill: C.warnT, bold: true });
      b += box(20, 210, 220, 44, "fact_sales.customer_key = 3", null, "acc", { mono: true, size: 12.5 });
      b += arrow(130, 208, 90, 158, { stroke: C.accS });
      b += t(360, 220, "Same C-100 from two systems,", { size: 12.5, fill: C.dim });
      b += t(360, 238, "and a version after a move:", { size: 12.5, fill: C.dim });
      b += t(360, 256, "only the surrogate tells them apart.", { size: 12.5, fill: C.dim });
      return svg(480, 272, b, "Surrogate keys uniquely identify dimension rows where natural keys repeat");
    },
    caption: "The natural key C-100 appears three times. The surrogate key is what makes each row unique.",
    oneline: "Warehouses give every dimension row its own made-up number, because real-world ids change and clash.",
  };

  /* ---------------------------------------------------------------- model-denormalization */
  P["model-denormalization"] = {
    simple: [
      "**Denormalization** means copying data on purpose so reading is faster.",
      "Instead of joining product → category → department every time, you write the category and department names straight into the product table.",
      "You pay with extra storage and with more work when a name changes, because every copy must be updated. In analytics, where data is read far more than written, that trade usually wins.",
    ],
    analogy: {
      text: "Think of a school timetable printed on every classroom door.",
      left: "The timetable", right: "In the warehouse",
      map: [
        ["One master timetable in the office", "Normalized: one copy, joined on demand"],
        ["A copy taped on every door", "Denormalized: the data repeated where it's read"],
        ["Nobody walks to the office to check", "No join at query time"],
        ["A lesson moves: reprint every door", "Update cost: every copy must change"],
        ["One door still shows the old time", "Inconsistency if the rebuild misses a copy"],
      ],
      breaks: "reprinting doors is slow and manual. Pipelines rebuild denormalized tables automatically from the normalized source, which is what keeps the copies honest.",
    },
    svg: () => {
      let b = t(240, 22, "Before: 3 joins per query", { bold: true, size: 14 });
      [["dim_product", 20], ["dim_category", 175], ["dim_department", 330]].forEach(([n, x], i) => { b += box(x, 36, 130, 40, n, null, "plain", { size: 13 }); if (i < 2) b += arrow(x + 132, 56, x + 153, 56); });
      b += arrow(240, 88, 240, 120, { label: "flatten once in the pipeline", dx: 0, dy: -4 });
      b += t(240, 140, "After: 0 joins", { bold: true, size: 14 });
      b += table(30, 152, ["product", "category", "department"], [["Mug", "Kitchen", "Home"], ["Lamp", "Lighting", "Home"]], { cw: [130, 140, 150], rh: 30, hl: { 0: "good", 1: "good" } });
      b += t(240, 268, "\"Home\" is now stored twice: faster reads, more to update.", { size: 12.5, fill: C.dim });
      return svg(480, 284, b, "Denormalization flattens a chain of dimension tables into one wide table");
    },
    caption: "The chain of joins is done once by the pipeline, so every later query reads one flat table.",
    oneline: "Denormalizing copies data next to where it's read, trading extra copies for fewer joins.",
  };

  /* ---------------------------------------------------------------- model-inmon-kimball */
  P["model-inmon-kimball"] = {
    simple: [
      "There are two classic ways to build a company's data warehouse.",
      "**Inmon** (top-down): first build one big, tidy, normalized warehouse for the whole company, then cut smaller **data marts** from it for each department.",
      "**Kimball** (bottom-up): build star-schema marts one business process at a time, and make them fit together by sharing the same dimensions (**conformed dimensions**). Modern stacks often mix both.",
    ],
    analogy: {
      text: "Think of two ways to build a town library system.",
      left: "The libraries", right: "Warehouse philosophy",
      map: [
        ["Build one huge central library first", "Inmon: the enterprise data warehouse (3NF)"],
        ["Then open small branches stocked from it", "Data marts derived from the EDW"],
        ["Open a branch per neighbourhood straight away", "Kimball: one dimensional mart per process"],
        ["All branches use the same catalogue cards", "Conformed dimensions (the bus matrix)"],
      ],
      breaks: "towns rarely tear down a library. Companies change source systems often, which is why some add a Data Vault as the central layer and Kimball marts on top.",
    },
    svg: () => {
      let b = t(120, 22, "Inmon: top-down", { bold: true, size: 14 }) + t(360, 22, "Kimball: bottom-up", { bold: true, size: 14 });
      b += box(20, 36, 200, 36, "sources", null, "plain", { size: 13 });
      b += arrow(120, 74, 120, 96);
      b += box(20, 98, 200, 48, "Enterprise DW (3NF)", "integrated first", "vio", { size: 13.5, size2: 12 });
      b += arrow(70, 148, 60, 176) + arrow(170, 148, 180, 176);
      b += box(20, 178, 90, 36, "mart", null, "acc", { size: 13 }) + box(130, 178, 90, 36, "mart", null, "acc", { size: 13 });
      b += box(260, 36, 200, 36, "sources", null, "plain", { size: 13 });
      b += arrow(310, 74, 310, 96) + arrow(410, 74, 410, 96);
      b += box(260, 98, 90, 48, "sales", "star", "acc", { size: 13, size2: 12 }) + box(370, 98, 90, 48, "returns", "star", "acc", { size: 13, size2: 12 });
      b += box(260, 178, 200, 36, "conformed dims", null, "good", { size: 13 });
      b += line(305, 148, 305, 178, { stroke: C.goodS }) + line(415, 148, 415, 178, { stroke: C.goodS });
      b += t(240, 252, "Inmon: integrate first, slower start. Kimball: deliver marts fast,", { size: 12, fill: C.dim });
      b += t(240, 270, "keep them consistent through shared dimensions.", { size: 12, fill: C.dim });
      return svg(480, 286, b, "Inmon builds a central normalized warehouse first; Kimball builds marts linked by conformed dimensions");
    },
    caption: "Inmon goes sources → central warehouse → marts. Kimball goes sources → marts, tied together by shared dimensions.",
    oneline: "Inmon builds one big tidy warehouse first, Kimball builds small star schemas that share the same dimensions.",
  };

  /* ---------------------------------------------------------------- model-data-vault */
  P["model-data-vault"] = {
    simple: [
      "**Data Vault** is a way to build the central warehouse layer when you have many source systems that keep changing.",
      "It uses only three kinds of table. **Hubs** list the business ids (every customer id). **Links** record relationships (this customer placed that order). **Satellites** hold the descriptions and keep every version over time.",
      "Because each piece is separate, a new source or a new column means adding a table, not rebuilding the model.",
    ],
    analogy: {
      text: "Think of a school's records kept as cards in three boxes.",
      left: "The record boxes", right: "Data Vault",
      map: [
        ["A box of roll-number cards, nothing else", "Hub: unique business keys"],
        ["A box of \"pupil X is in club Y\" cards", "Link: relationships between hubs"],
        ["Dated cards of each pupil's address, phone, house", "Satellite: attributes with history"],
        ["A new club? Add more link cards", "New relationships don't change existing tables"],
        ["Never rub out a card, just add a newer one", "Insert-only loading, full audit trail"],
      ],
      breaks: "nobody reads card boxes directly to make a report. Data Vault is hard to query, so you build star-schema marts on top for analysts.",
    },
    svg: () => {
      let b = box(30, 40, 130, 54, "hub_customer", "customer_hk · id", "vio", { size: 13.5, size2: 11.5 });
      b += box(320, 40, 130, 54, "hub_order", "order_hk · id", "vio", { size: 13.5, size2: 11.5 });
      b += box(175, 40, 130, 54, "link_cust_order", "customer_hk, order_hk", "acc", { size: 12.5, size2: 11 });
      b += line(160, 67, 175, 67, { stroke: C.accS, sw: 2 }) + line(305, 67, 320, 67, { stroke: C.accS, sw: 2 });
      b += box(30, 140, 130, 54, "sat_customer", "name · city · dates", "warn", { size: 13.5, size2: 11.5 });
      b += box(320, 140, 130, 54, "sat_order", "status · amount", "warn", { size: 13.5, size2: 11.5 });
      b += line(95, 94, 95, 140, { stroke: C.warnS, sw: 2 }) + line(385, 94, 385, 140, { stroke: C.warnS, sw: 2 });
      b += t(240, 230, "Hubs = who/what (keys) · Links = how they relate", { size: 12.5, fill: C.tx });
      b += t(240, 250, "Satellites = descriptions + history, one row per change", { size: 12.5, fill: C.tx });
      b += t(240, 276, "New source? Add a satellite. Nothing existing changes.", { size: 12.5, fill: C.goodT });
      return svg(480, 292, b, "Data Vault hubs, a link and satellites for customers and orders");
    },
    caption: "Purple hubs hold ids, the blue link joins them, and yellow satellites hang off them with dated history.",
    oneline: "Data Vault splits a warehouse into ids (hubs), relationships (links) and dated descriptions (satellites) so it can grow without rebuilding.",
  };

  /* ---------------------------------------------------------------- model-advanced-dims */
  P["model-advanced-dims"] = {
    simple: [
      "Real data has awkward cases, and dimensional modeling has a named trick for each.",
      "A **role-playing** dimension is one table used in several roles: one date table serving as order date, ship date and delivery date. A **junk** dimension bundles small yes/no flags into one table. A **degenerate** dimension is an id like an order number kept in the fact with no table of its own.",
      "A **bridge** table handles many-to-many links, like a patient with several diagnoses. A **mini-dimension** splits out attributes that change often, like age band.",
    ],
    analogy: {
      text: "Think of how a school office handles odd paperwork.",
      left: "The school office", right: "Dimension technique",
      map: [
        ["One calendar, used for term start, exam day and results day", "Role-playing `dim_date`"],
        ["A tray for all the little tick-boxes on forms", "Junk dimension of flags"],
        ["The form number, kept on the form itself", "Degenerate dimension (order number in the fact)"],
        ["A list linking pupils to every club they're in", "Bridge table for many-to-many"],
        ["A separate sheet for things that change termly", "Mini-dimension for volatile attributes"],
      ],
      breaks: "an office can improvise. In a warehouse each trick changes how queries join, so name and document them, or analysts will double-count through a bridge.",
    },
    svg: () => {
      let b = box(160, 110, 160, 60, "fact_orders", "order_no (degenerate)", "acc", { size: 14, size2: 12 });
      b += box(10, 20, 140, 40, "dim_date as order_date", null, "plain", { size: 11.5 });
      b += box(170, 20, 140, 40, "dim_date as ship_date", null, "plain", { size: 11.5 });
      b += box(330, 20, 140, 40, "dim_date as deliv_date", null, "plain", { size: 11.5 });
      b += line(80, 60, 200, 110) + line(240, 60, 240, 110) + line(400, 60, 280, 110);
      b += box(10, 210, 140, 50, "dim_junk_flags", "gift · rush · promo", "warn", { size: 13, size2: 11.5 });
      b += box(330, 210, 140, 50, "bridge_order_promo", "many-to-many", "vio", { size: 12.5, size2: 11.5 });
      b += line(150, 235, 200, 170) + line(330, 235, 280, 170);
      b += t(240, 292, "One physical date table, three roles; flags in one junk table;", { size: 12, fill: C.dim });
      b += t(240, 310, "a bridge for orders with several promotions.", { size: 12, fill: C.dim });
      return svg(480, 326, b, "Role-playing, degenerate, junk and bridge dimensions around one fact table");
    },
    caption: "Several special dimension types around one fact. Each solves one awkward modeling case.",
    oneline: "Advanced dimensions are named tricks for awkward data: one table in many roles, bundled flags, bridges for many-to-many.",
  };

  /* ---------------------------------------------------------------- model-semantic-layer */
  P["model-semantic-layer"] = {
    simple: [
      "Ask three teams for \"revenue\" and you often get three numbers. One includes refunds, one counts tax, one uses a different date.",
      "A **semantic layer** (also called a metrics layer) writes down each business metric **once**, with its exact formula and the tables it comes from.",
      "Dashboards, notebooks and AI tools then ask the layer for \"revenue by month\", and the layer writes the SQL. Everyone gets the same number.",
    ],
    analogy: {
      text: "Think of a school's official marking scheme.",
      left: "The marking scheme", right: "Semantic layer",
      map: [
        ["Every teacher marking their own way", "Each dashboard defining revenue itself"],
        ["One printed scheme: 2 marks per step, minus 1 for no units", "One metric definition in code"],
        ["Teachers look up the scheme, not their memory", "Tools query the layer, not raw tables"],
        ["The scheme changes; every teacher follows it", "Change the definition once, every report updates"],
      ],
      breaks: "teachers can still ignore the scheme. A semantic layer only works if tools are actually wired to it and raw-table access for metrics is discouraged.",
    },
    svg: () => {
      let b = "";
      ["Looker / Tableau", "Notebook", "AI assistant"].forEach((n, i) => { b += box(14 + i * 156, 20, 140, 40, n, null, "plain", { size: 13 }); b += arrow(84 + i * 156, 62, 240, 104, { stroke: C.accS, sw: 1.4 }); });
      b += box(90, 106, 300, 70, "Semantic layer", "revenue = SUM(amount) − refunds, by order_date", "good", { size: 15, size2: 12 });
      b += arrow(240, 178, 240, 210, { label: "generated SQL", dx: 50, dy: 4 });
      b += box(90, 212, 300, 44, "warehouse tables (fct_orders, dims)", null, "acc", { size: 13 });
      b += t(240, 288, "One definition in, the same number out, everywhere.", { size: 13, fill: C.tx });
      return svg(480, 304, b, "Tools query a semantic layer that turns metric definitions into SQL against the warehouse");
    },
    caption: "Every tool asks the same layer, so every tool gets the same revenue.",
    oneline: "A semantic layer writes each business metric down once so every tool computes it the same way.",
  };

  /* ---------------------------------------------------------------- model-bi-serving */
  P["model-bi-serving"] = {
    simple: [
      "Clean tables in a warehouse only matter once people can use them. The **serving layer** is the last step: getting trusted numbers in front of decision-makers.",
      "It usually has three parts: **gold marts** (final, business-ready tables), a **semantic layer** that defines each metric once, and the **BI tools** (Business Intelligence: Power BI, Looker, Tableau) or APIs that people actually open.",
      "Speed tricks like caches and aggregate tables live here too, so dashboards load in seconds.",
    ],
    analogy: {
      text: "Think of a restaurant's front of house.",
      left: "The restaurant", right: "The serving layer",
      map: [
        ["The kitchen preparing finished dishes", "Gold marts built by pipelines"],
        ["The menu with fixed recipes", "The semantic layer (metric definitions)"],
        ["Waiters bringing plates to tables", "BI tools and APIs"],
        ["Popular dishes kept warm and ready", "Caches and aggregate tables"],
        ["The same dish tastes the same at every table", "Every dashboard shows the same number"],
      ],
      breaks: "diners don't change the recipe. Business users often want their own tweaks, so good serving layers allow safe self-service on top of governed metrics instead of locking everything down.",
    },
    svg: () => {
      const st = [["bronze → silver", "raw → cleaned", "plain"], ["gold marts", "business-ready stars", "acc"], ["semantic layer", "metrics defined once", "good"], ["BI · APIs · AI", "what people open", "vio"]];
      let b = "";
      st.forEach(([a, s, k], i) => {
        const y = 16 + i * 66;
        b += box(110, y, 260, 50, a, s, k, { size: 14.5, size2: 12 });
        if (i < 3) b += arrow(240, y + 50, 240, y + 64);
      });
      b += box(390, 148, 80, 50, "cache", "aggs", "warn", { size: 13, size2: 11.5 });
      b += arrow(388, 173, 372, 173, { stroke: C.warnS });
      b += t(54, 190, "serving", { size: 12.5, fill: C.goodT, bold: true });
      b += t(54, 208, "layer", { size: 12.5, fill: C.goodT, bold: true });
      return svg(480, 280, b, "The serving layer: gold marts, semantic layer and BI tools, with caching");
    },
    caption: "Data climbs from raw to gold, then the semantic layer and BI tools serve it to people.",
    oneline: "The serving layer delivers trusted, fast numbers from gold tables to the tools people open.",
  };
})();
