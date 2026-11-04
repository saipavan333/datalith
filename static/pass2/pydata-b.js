/* Datalith pass 2 — Track 7: Python data libraries (part 2 of 2: Parquet, Polars, DuckDB, Dask, SQLAlchemy, validation). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- pa-parquet */
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  P["pa-parquet"] = {
    simple: [
      "**Parquet** is a file format that stores a table column by column, compressed. It is the standard file format of data lakes.",
      "A file is cut into **row groups** (chunks of rows, often around 128 MB). Inside each, every column is stored separately. The **footer** at the end records each chunk's min and max values.",
      "A reader checks the footer first, then reads only the columns a query needs and skips row groups whose min/max can't match the filter. That is called **pushdown**.",
    ],
    analogy: {
      text: "Think of a set of labelled filing boxes in an archive room.",
      left: "Archive room", right: "Parquet",
      map: [
        ["One box per month", "One row group"],
        ["Folders in a box sorted by topic", "Column chunks"],
        ["The index card on the door: what's in each box", "Footer with min/max statistics"],
        ["\"I need May only\": open just that box", "Row-group skipping (predicate pushdown)"],
        ["Pull only the invoice folder", "Reading only needed columns (projection)"],
      ],
      breaks: "archive boxes are filed by month on purpose. Parquet stats only help if the data was written sorted or clustered by the filter column; random order makes every row group's min/max overlap, so nothing gets skipped.",
    },
    svg: () => P["pa-parquet"]._fig(5),
    _fig: m => {
      let b = t(240, 20, "pq.read_table(f, columns=['amt'], filters=[('month', '>=', " + (m + 1) + ")])", { bold: true, size: 10.5, mono: true });
      MON.forEach((mn, i) => {
        const x = 16 + i * 57, read = i >= m;
        b += box(x, 36, 52, 120, null, null, read ? "acc" : "ghost", { dash: !read });
        b += t(x + 26, 54, mn, { size: 12, bold: true, fill: read ? C.accT : C.faint });
        ["id", "amt", "city"].forEach((c, j) => { b += box(x + 5, 64 + j * 29, 42, 24, c, null, read && c === "amt" ? "good" : "plain", { size: 10.5, mono: true, r: 3 }); });
      });
      b += box(16, 168, 448, 34, "footer: min/max of month per row group", null, "warn", { size: 12.5 });
      const rg = 8 - m;
      b += t(240, 228, "Row groups read: " + rg + " of 8. Column chunks read: " + rg + " of 24.", { size: 12.5, fill: C.tx });
      return svg(480, 244, b, "Parquet row groups and column chunks read for a filtered query");
    },
    caption: "The reader uses the footer to skip months that can't match, and reads only the amt column in the rest.",
    ix: el => slider(el, { label: "WHERE month >=", min: 0, max: 7, value: 2, fmt: v => MON[v] }, v => ({
      svg: P["pa-parquet"]._fig(v),
      note: "Reading " + Math.round((8 - v) / 24 * 100) + "% of the column chunks. On object storage that also means fewer bytes downloaded.",
    })),
    oneline: "Parquet stores columns in row-group chunks with min/max notes, so readers skip what they don't need.",
  };

  /* ---------------------------------------------------------------- pl-dataframes */
  P["pl-dataframes"] = {
    simple: [
      "**Polars** is a DataFrame library written in Rust. It stores columns in the Arrow format and uses all your CPU cores by default.",
      "It looks like pandas but has no row index. You select with methods: `df.select(...)`, `df.filter(...)`, `df.with_columns(...)`, `df.group_by(...)`.",
      "It reads CSV, Parquet, JSON and databases, and often runs several times faster than pandas on the same laptop.",
    ],
    analogy: {
      text: "Think of a kitchen with several cooks instead of one.",
      left: "Kitchen", right: "Polars",
      map: [
        ["Several cooks chopping at once", "Multi-threaded on all cores"],
        ["Ingredients in labelled trays by type", "Arrow columns"],
        ["No numbered seats at the table", "No index"],
        ["A written order for the whole meal", "Method chains: select, filter, group_by"],
      ],
      breaks: "more cooks always help with chopping. Polars speed-ups shrink on tiny data, and Python `map_elements` callbacks run one row at a time and lose most of the parallel speed.",
    },
    svg: () => {
      let b = t(240, 22, "One query, split across CPU cores", { bold: true, size: 14 });
      b += box(20, 44, 130, 50, "orders.parquet", "Arrow columns", "plain", { mono: true, size: 12 });
      b += arrow(152, 69, 186, 69);
      [0, 1, 2, 3].forEach(i => { b += box(190, 36 + i * 36, 110, 30, "core " + (i + 1), null, "acc", { size: 12.5 }); b += arrow(302, 51 + i * 36, 336, 92, { sw: 1.2 }); });
      b += box(340, 66, 124, 52, "result", "merged", "good");
      b += t(240, 202, "df.filter(pl.col('amt') > 0).group_by('city').agg(pl.sum('amt'))", { size: 10.5, mono: true, fill: C.dim });
      return svg(480, 218, b, "Polars spreading work across CPU cores");
    },
    caption: "Polars splits the work over all cores and merges the pieces; no index is carried along.",
    oneline: "Polars is a fast, multi-core DataFrame library on Arrow columns, with no row index.",
  };

  /* ---------------------------------------------------------------- pl-expressions */
  P["pl-expressions"] = {
    simple: [
      "In Polars you describe **what** to compute with **expressions**: `pl.col('amt') * 1.18`, `pl.col('city').str.to_uppercase()`, `pl.col('amt').sum().over('city')`.",
      "An expression is a recipe, not a result. It runs only inside a context: `select`, `with_columns`, `filter` or `agg`.",
      "Because Polars sees the whole recipe, it can run independent expressions in parallel and skip work that the result doesn't need.",
    ],
    analogy: {
      text: "Think of a recipe card versus a cooked dish.",
      left: "Recipe", right: "Polars expression",
      map: [
        ["\"Take the tomatoes\"", "`pl.col('amt')`"],
        ["\"... chop them, add salt\"", "`.round(2).alias('amt_r')`"],
        ["Handing the card to a cook", "Passing it to `with_columns`"],
        ["Several cooks working different cards at once", "Expressions in one context run in parallel"],
      ],
      breaks: "a recipe card can say \"use the sauce from step 3\". Expressions in the same `with_columns` call can't see each other's new columns; chain a second `with_columns` for that.",
    },
    svg: () => {
      let b = t(240, 22, "df.with_columns(  ...  )", { bold: true, size: 14, mono: true });
      const ex = [["pl.col('amt') * 1.18", "gross"], ["pl.col('city').str.to_uppercase()", "city_u"], ["pl.col('amt').sum().over('city')", "city_total"]];
      ex.forEach(([e, a], i) => {
        const y = 40 + i * 52;
        b += box(16, y, 300, 40, e, null, "vio", { mono: true, size: 12 });
        b += arrow(318, y + 20, 346, y + 20, { label: "alias", dy: -6, size: 11 });
        b += box(350, y, 114, 40, a, null, "good", { mono: true, size: 13 });
      });
      b += t(240, 214, "Three recipes, run in parallel, become three columns.", { size: 12.5, fill: C.dim });
      return svg(480, 230, b, "Polars expressions inside one with_columns context");
    },
    caption: "Each expression is a recipe for one column; the context runs them together.",
    oneline: "A Polars expression is a recipe for a column that runs inside select, filter or with_columns.",
  };

  /* ---------------------------------------------------------------- pl-lazy */
  const LZ = [["eager: read_parquet", 20, 100, "reads every column and row, then filters in memory"], ["lazy: scan_parquet", 2, 5, "optimizer pushes the column list and filter into the scan"]];
  P["pl-lazy"] = {
    simple: [
      "Polars has two modes. **Eager** runs each step as soon as you call it. **Lazy** (`pl.scan_parquet(...)` or `df.lazy()`) only records the steps, then plans the whole query when you call `.collect()`.",
      "Seeing the whole plan lets the optimizer read only the needed columns (**projection pushdown**), filter while reading (**predicate pushdown**) and drop wasted steps.",
      "`.explain()` prints the plan, and the streaming engine can run some queries on data bigger than memory.",
    ],
    analogy: {
      text: "Think of shopping with a full list versus one item at a time.",
      left: "Shopping", right: "Lazy Polars",
      map: [
        ["Going to the shop for each item as you remember it", "Eager: run each step at once"],
        ["Writing the full list first", "Lazy: record the plan"],
        ["Planning a route that skips aisles you don't need", "Query optimizer"],
        ["Only picking two items from the dairy aisle", "Projection and predicate pushdown"],
        ["Going to the shop", "`.collect()`"],
      ],
      breaks: "a list is free to change until you leave. A lazy plan is fixed once collected; collecting twice runs the whole query twice, so collect once and reuse the result.",
    },
    svg: () => P["pl-lazy"]._fig(1),
    _fig: i => {
      const [lab, cols, rowsPct, why] = LZ[i];
      let b = t(240, 20, "100M rows x 20 columns; need 2 columns where country = 'IN'", { bold: true, size: 11.5 });
      b += t(20, 46, "columns read", { a: "start", size: 12, fill: C.dim });
      for (let c = 0; c < 20; c++) b += `<rect x="${130 + c * 16}" y="34" width="13" height="18" rx="2" style="fill:${c < cols ? C.acc : C.box};stroke:${c < cols ? C.accS : C.boxS}"/>`;
      b += t(20, 86, "rows read", { a: "start", size: 12, fill: C.dim });
      b += `<rect x="130" y="72" width="317" height="18" rx="3" style="fill:${C.box};stroke:${C.boxS}"/>`;
      b += `<rect x="130" y="72" width="${317 * rowsPct / 100}" height="18" rx="3" style="fill:${C.vio};stroke:${C.vioS}"/>`;
      b += t(240, 122, cols + " of 20 columns, about " + rowsPct + "% of rows", { size: 13, bold: true, fill: i ? C.goodT : C.badT });
      b += box(20, 136, 440, 40, lab, why, i ? "good" : "bad", { mono: true, size: 13, size2: 11.5 });
      b += t(240, 200, "Row skipping assumes row groups clustered by country.", { size: 11.5, fill: C.faint });
      return svg(480, 214, b, "Data read by eager versus lazy Polars");
    },
    caption: "The lazy plan reads 2 columns and, with useful row-group stats, a small share of the rows.",
    ix: el => choice(el, { label: "Mode", options: LZ.map(x => x[0]), value: 0 }, i => ({
      svg: P["pl-lazy"]._fig(i),
      note: i ? "Same answer, a fraction of the I/O. Call <code>.explain()</code> to see the pushed-down filter in the plan." : "Eager reads first and asks questions later.",
    })),
    oneline: "Lazy Polars plans the whole query before running it, so it reads and computes only what's needed.",
  };

  /* ---------------------------------------------------------------- duck-engine */
  P["duck-engine"] = {
    simple: [
      "**DuckDB** is an analytical SQL database that runs **inside** your program, like SQLite, with no server to install. `pip install duckdb` and you are ready.",
      "It is built for analytics: columnar storage, **vectorized** execution (processing batches of about 2,048 values at a time) and all CPU cores.",
      "It can query Parquet, CSV and even a pandas or Polars DataFrame directly by name, which makes it the laptop stand-in for BigQuery or Snowflake.",
    ],
    analogy: {
      text: "Think of a calculator app on your phone versus going to a bank's computer centre.",
      left: "Calculator", right: "DuckDB",
      map: [
        ["It's already in your pocket", "In-process: no server"],
        ["Works offline", "Runs on local files"],
        ["Adds a whole column of numbers at once", "Vectorized columnar execution"],
        ["Can read numbers from your photos too", "Queries Parquet, CSV, DataFrames directly"],
      ],
      breaks: "a calculator is for one person. DuckDB allows one process to write a database file at a time; it isn't built for hundreds of users writing at once like PostgreSQL.",
    },
    svg: () => {
      let b = t(240, 22, "DuckDB lives inside your Python process", { bold: true, size: 14 });
      b += `<rect x="16" y="36" width="448" height="120" rx="10" style="fill:none;stroke:${C.accS};stroke-width:1.6;stroke-dasharray:5 4"/>`;
      b += t(30, 54, "python process", { a: "start", size: 12, fill: C.accT, bold: true });
      b += box(36, 66, 150, 70, "your script", "duckdb.sql(...)", "plain", { mono2: true });
      b += arrow(188, 101, 234, 101, { label: "call" });
      b += box(238, 66, 210, 70, "DuckDB engine", "vectorized, all cores", "vio");
      [["orders.parquet", 20], ["logs/*.csv", 176], ["pandas df", 332]].forEach(([n, x]) => { b += box(x, 190, 128, 34, n, null, "good", { mono: true, size: 12 }); b += arrow(x + 64, 188, 343, 140, { sw: 1.2 }); });
      b += t(240, 248, "No server, no network hop, no load step.", { size: 12.5, fill: C.dim });
      return svg(480, 262, b, "DuckDB embedded in a Python process reading files and DataFrames");
    },
    caption: "The engine runs inside the same process and reads files and DataFrames where they are.",
    oneline: "DuckDB is a fast analytical SQL engine that runs inside your program with no server.",
  };

  /* ---------------------------------------------------------------- duck-sql */
  P["duck-sql"] = {
    simple: [
      "DuckDB speaks a rich SQL. You can `SELECT * FROM 'data/*.parquet'` straight from files, without creating tables first.",
      "It adds friendly extras: `GROUP BY ALL`, `SELECT * EXCLUDE (col)`, `QUALIFY` to filter on window functions, and `PIVOT`/`UNPIVOT`.",
      "Results go back into Python as pandas (`.df()`), Polars (`.pl()`) or Arrow (`.arrow()`), and `COPY ... TO 'out.parquet'` writes files.",
    ],
    analogy: {
      text: "Think of a universal remote for every screen in the house.",
      left: "Universal remote", right: "DuckDB SQL",
      map: [
        ["Works on the TV, the projector and the speaker", "Queries Parquet, CSV, JSON, DataFrames"],
        ["A shortcut button for a common action", "`GROUP BY ALL`, `EXCLUDE`"],
        ["Sending the picture to another screen", "`.df()`, `.pl()`, `.arrow()`"],
        ["Recording to a file", "`COPY ... TO 'x.parquet'`"],
      ],
      breaks: "a remote works the same on every TV. `GROUP BY ALL`, `EXCLUDE` and `QUALIFY` are not standard SQL: Snowflake has all three, BigQuery spells `EXCLUDE` as `EXCEPT`, and PostgreSQL has none. Check before copying a query to another engine.",
    },
    svg: () => {
      let b = t(240, 22, "files in, SQL, results out", { bold: true, size: 14 });
      b += box(16, 44, 130, 40, "'raw/*.parquet'", null, "plain", { mono: true, size: 12 });
      b += box(16, 96, 130, 40, "'refs.csv'", null, "plain", { mono: true, size: 12 });
      b += arrow(148, 64, 176, 86); b += arrow(148, 116, 176, 96);
      b += box(180, 50, 160, 82, "SELECT city, sum(amt)", "GROUP BY ALL", "vio", { mono: true, mono2: true, size: 11.5 });
      [[".df()", "pandas", 36], [".pl()", "Polars", 86], ["COPY TO", "out.parquet", 136]].forEach(([a, z, y]) => { b += arrow(342, 91, 362, y + 14, { sw: 1.2 }); b += box(366, y, 98, 34, a, z, "good", { mono: true, size: 11.5, size2: 10.5 }); });
      b += t(240, 206, "No CREATE TABLE or load step needed for files.", { size: 12.5, fill: C.dim });
      return svg(480, 222, b, "DuckDB reading files with SQL and returning DataFrames or files");
    },
    caption: "Query files by path, then return the answer as a DataFrame or write it back as Parquet.",
    oneline: "DuckDB SQL can query files by path and return results as pandas, Polars or Parquet.",
  };

  /* ---------------------------------------------------------------- lib-dask */
  P["lib-dask"] = {
    simple: [
      "**Dask** scales pandas-style code past one machine's memory. A Dask DataFrame is many small pandas DataFrames, called **partitions**.",
      "Calls like `ddf.groupby('city').amt.sum()` don't run at once. Dask builds a **task graph** of small jobs, and `.compute()` runs it, in parallel on cores or across a cluster.",
      "Each partition must fit in a worker's memory, but the whole dataset doesn't have to.",
    ],
    analogy: {
      text: "Think of a teacher splitting a pile of 10,000 exam papers among helpers.",
      left: "Marking", right: "Dask",
      map: [
        ["One bundle of papers per helper", "One partition per task"],
        ["The plan of who marks what", "The task graph"],
        ["Each helper totals their bundle", "Per-partition work"],
        ["The teacher adds the helpers' totals", "The final combine step"],
        ["\"Start marking now\"", "`.compute()`"],
      ],
      breaks: "helpers can mark in any order. Some steps need papers from every bundle, like a sort or a join on a non-partitioned key; that forces a shuffle across workers and is much slower.",
    },
    svg: () => {
      let b = t(240, 22, "ddf.groupby('city').amt.sum().compute()", { bold: true, size: 13, mono: true });
      [0, 1, 2, 3].forEach(i => {
        const x = 20 + i * 114;
        b += box(x, 40, 100, 34, "part " + i, null, "plain", { size: 12.5 });
        b += arrow(x + 50, 76, x + 50, 96);
        b += box(x, 98, 100, 34, "partial sum", null, "acc", { size: 12 });
        b += arrow(x + 50, 134, 240, 166, { sw: 1.2 });
      });
      b += box(160, 168, 160, 40, "combine", "final sums", "good");
      b += t(240, 236, "Nothing runs until .compute(): before that it's only a graph.", { size: 12.5, fill: C.dim });
      return svg(480, 252, b, "A Dask task graph over four partitions");
    },
    caption: "Each partition is summed on its own, then the partial sums are combined.",
    oneline: "Dask splits a big DataFrame into pandas pieces and runs a task graph over them in parallel.",
  };

  /* ---------------------------------------------------------------- sa-core */
  P["sa-core"] = {
    simple: [
      "**SQLAlchemy** is Python's main toolkit for talking to SQL databases. Its **Core** layer gives you an **Engine** and SQL you can build in Python.",
      "Opening a database connection is slow (network handshake, login), so the Engine keeps a **connection pool**: a few open connections that are lent out and returned.",
      "By default the pool keeps up to 5 connections and allows 10 extra in a burst. A 16th request waits, and fails after 30 seconds.",
    ],
    analogy: {
      text: "Think of a bike-share stand outside an office.",
      left: "Bike share", right: "Connection pool",
      map: [
        ["Bikes docked and ready", "`pool_size=5` open connections"],
        ["Extra bikes brought out at rush hour", "`max_overflow=10`"],
        ["Waiting at an empty stand", "Request blocks for a free connection"],
        ["Giving up after 30 seconds", "`pool_timeout=30` then TimeoutError"],
        ["Returning the bike when done", "Leaving the `with engine.connect()` block"],
      ],
      breaks: "a bike is either docked or out. A database can also close a connection that sat idle too long; `pool_pre_ping=True` checks each one before lending it out.",
    },
    svg: () => P["sa-core"]._fig(8),
    _fig: n => {
      let b = t(240, 20, n + " requests at once, pool_size=5, max_overflow=10", { bold: true, size: 13 });
      for (let i = 0; i < 20; i++) {
        const x = 20 + (i % 10) * 45, y = 36 + Math.floor(i / 10) * 44;
        const used = i < n, kind = i < 5 ? (used ? "good" : "ghost") : i < 15 ? (used ? "warn" : "ghost") : (used ? "bad" : "ghost");
        b += box(x, y, 40, 36, i < 15 ? "c" + (i + 1) : "wait", null, kind, { size: 11, mono: true, dash: !used });
      }
      const inPool = Math.min(n, 5), over = Math.max(0, Math.min(n, 15) - 5), wait = Math.max(0, n - 15);
      b += table(40, 140, ["pooled", "overflow", "waiting"], [[String(inPool), String(over), String(wait)]], { cw: [130, 130, 130], rh: 28, hl: { 0: wait ? "bad" : over ? "warn" : "good" } });
      b += t(240, 222, "Overflow connections close when returned; pooled ones stay open.", { size: 12, fill: C.dim });
      return svg(480, 236, b, "Connection pool usage at a level of concurrency");
    },
    caption: "Green connections stay open in the pool; amber ones are extras for a burst; red requests wait.",
    ix: el => slider(el, { label: "Concurrent requests", min: 1, max: 20, value: 4 }, v => ({
      svg: P["sa-core"]._fig(v),
      note: v > 15 ? "Requests past 15 wait up to 30 s, then raise a TimeoutError. Raise the pool or cut concurrency, but check the database's own connection limit first." : v > 5 ? "Burst handled by overflow connections; they are closed when given back." : "All requests served from the warm pool.",
    })),
    oneline: "A SQLAlchemy engine keeps a pool of open connections and lends them out, so you don't reconnect each time.",
  };

  /* ---------------------------------------------------------------- sa-orm */
  P["sa-orm"] = {
    simple: [
      "An **ORM** (object-relational mapper) lets you work with database rows as Python objects: `user.name` instead of a SQL string.",
      "You describe tables as classes. A **Session** tracks every object you load or add, and `session.commit()` sends all the changes as one transaction (the **unit of work**).",
      "The classic trap is **N+1 queries**: loading 100 users, then touching `user.orders` in a loop fires 100 more queries. Eager loading (`selectinload`) fetches them in one extra query.",
    ],
    analogy: {
      text: "Think of a waiter taking a table's order.",
      left: "Restaurant", right: "SQLAlchemy ORM",
      map: [
        ["Menu items as dishes, not recipes", "Rows as Python objects"],
        ["The waiter's notepad of the whole order", "The Session"],
        ["Sending the full order to the kitchen at once", "`commit()`: one transaction"],
        ["Running to the kitchen for each guest's drink", "N+1 queries"],
        ["Bringing all drinks on one tray", "`selectinload`"],
      ],
      breaks: "a waiter sees you change your mind. The Session only sees changes to objects it tracks; bulk `update()` statements skip its notepad, so loaded objects can hold stale values until refreshed.",
    },
    svg: () => {
      let b = t(240, 22, "100 users, then each user's orders", { bold: true, size: 14 });
      b += t(120, 50, "lazy loading (N+1)", { size: 12.5, bold: true, fill: C.badT });
      b += box(30, 60, 180, 30, "SELECT users", null, "plain", { mono: true, size: 12 });
      for (let i = 0; i < 5; i++) b += box(30, 96 + i * 22, 180, 18, "SELECT orders WHERE user=" + (i + 1), null, "bad", { mono: true, size: 9.5, r: 3 });
      b += t(120, 222, "... 101 queries", { size: 12, fill: C.badT, mono: true });
      b += t(360, 50, "selectinload", { size: 12.5, bold: true, fill: C.goodT });
      b += box(270, 60, 180, 30, "SELECT users", null, "plain", { mono: true, size: 12 });
      b += box(270, 96, 180, 40, "SELECT orders", "WHERE user IN (1..100)", "good", { mono: true, mono2: true, size: 12, size2: 10.5 });
      b += t(360, 222, "2 queries", { size: 12, fill: C.goodT, mono: true });
      return svg(480, 238, b, "N+1 lazy loading versus selectinload");
    },
    caption: "Lazy loading fires one query per user; selectinload fetches every user's orders in one go.",
    oneline: "An ORM maps rows to objects and a Session saves your changes together; watch for N+1 queries.",
  };

  /* ---------------------------------------------------------------- lib-pydantic */
  P["lib-pydantic"] = {
    simple: [
      "Data from APIs and files is often wrong: a missing field, a number sent as text, a date in the wrong format.",
      "**Pydantic** checks it. You write a class with typed fields, `class Order(BaseModel): id: int; amount: float`, and `Order.model_validate(raw)` either returns a clean object or raises an error listing every problem.",
      "By default it converts safe cases, like the string `\"42\"` to the int 42. Strict mode refuses even those.",
    ],
    analogy: {
      text: "Think of a security check at an airport.",
      left: "Airport check", right: "Pydantic",
      map: [
        ["The list of what each bag may contain", "The model's typed fields"],
        ["Scanning every bag as it comes in", "`model_validate(raw)`"],
        ["Repacking a bottle into a clear bag", "Coercion: \"42\" becomes 42"],
        ["Stopping a bag with a clear reason", "`ValidationError` naming each field"],
        ["A stricter lane that won't repack anything", "Strict mode"],
      ],
      breaks: "airport checks happen once. Pydantic checks on creation by default, not when you later change a field, unless you set `validate_assignment=True`.",
    },
    svg: () => {
      let b = t(240, 22, "Order.model_validate(raw)", { bold: true, size: 14, mono: true });
      const rows = [["{'id': '42', 'amount': 9.5}", "Order(id=42, amount=9.5)", "good", "'42' coerced to int"], ["{'id': 'abc', 'amount': 9.5}", "ValidationError: id", "bad", "not a valid integer"], ["{'amount': 9.5}", "ValidationError: id", "bad", "field required"]];
      rows.forEach(([i, o, k, why], j) => {
        const y = 40 + j * 62;
        b += box(16, y, 200, 46, i, null, "plain", { mono: true, size: 11 });
        b += arrow(218, y + 23, 246, y + 23);
        b += box(250, y, 214, 46, o, why, k, { mono: true, size: 11.5, size2: 11 });
      });
      return svg(480, 236, b, "Pydantic validating three raw records");
    },
    caption: "Good data becomes a typed object; bad data fails with the field name and the reason.",
    oneline: "Pydantic checks incoming data against typed models and explains exactly what is wrong.",
  };

  /* ---------------------------------------------------------------- lib-requests */
  P["lib-requests"] = {
    simple: [
      "**requests** is the classic Python library for calling web APIs: `requests.get(url, params=..., timeout=10)` returns a response with `.status_code` and `.json()`.",
      "Always set a **timeout**. Without one, a call to a stuck server can wait forever and freeze the pipeline.",
      "**httpx** works almost the same way and adds `async` support, so one program can keep hundreds of requests in flight. A **Session** or **Client** reuses connections for speed.",
    ],
    analogy: {
      text: "Think of phoning a shop to ask about an order.",
      left: "Phone call", right: "HTTP request",
      map: [
        ["Dialling the number and asking", "`GET /orders/42`"],
        ["\"Here's your order\" / \"Never heard of it\" / \"Call back later\"", "Status 200 / 404 / 429 or 503"],
        ["Hanging up after a minute on hold", "`timeout=`"],
        ["Staying on the line for several questions", "A Session reusing the connection"],
        ["A call centre making many calls at once", "httpx `AsyncClient`"],
      ],
      breaks: "on the phone you hear \"call back later\". `requests` doesn't raise on 4xx or 5xx by itself; call `resp.raise_for_status()` or check the code, or a failed call looks like data.",
    },
    svg: () => {
      let b = t(240, 22, "resp = s.get(url, timeout=10)", { bold: true, size: 14, mono: true });
      b += box(20, 44, 120, 56, "your code", "Session", "acc");
      b += box(340, 44, 120, 56, "API server", null, "vio");
      b += arrow(142, 62, 336, 62, { label: "GET /orders?page=2" });
      b += arrow(336, 84, 142, 84, { label: "status + JSON body", dy: 16, stroke: C.goodS });
      [["200", "use .json()", "good"], ["429 / 503", "back off, retry", "warn"], ["404 / 400", "fix the request", "bad"]].forEach(([c, a, k], i) => { b += box(20 + i * 152, 136, 140, 48, c, a, k, { mono: true }); });
      b += t(240, 212, "No timeout = possibly waiting forever.", { size: 12.5, fill: C.badT });
      return svg(480, 228, b, "An HTTP request and how to react to each kind of status code");
    },
    caption: "Send a request, then act on the status code: use the data, retry later, or fix the request.",
    oneline: "requests and httpx call web APIs; always set a timeout and check the status code.",
  };

  /* ---------------------------------------------------------------- lib-great-expectations */
  P["lib-great-expectations"] = {
    simple: [
      "**Great Expectations** (GX) is a library for data quality tests. You write **expectations** like \"order_id is never null\" or \"amount is between 0 and 1,000,000\".",
      "A group of expectations is a **suite**. Running a suite against a batch of data gives a pass or fail per expectation, with the failing values.",
      "Run it in the pipeline before publishing data, so bad loads stop at the gate instead of reaching dashboards. It also builds HTML reports called **Data Docs**.",
    ],
    analogy: {
      text: "Think of quality control at a bottling plant.",
      left: "Bottling plant", right: "Great Expectations",
      map: [
        ["\"Every bottle has a cap\"", "`expect_column_values_to_not_be_null`"],
        ["\"Fill level between 495 and 505 ml\"", "`expect_column_values_to_be_between`"],
        ["The checklist for this product line", "An expectation suite"],
        ["Checking each crate before it ships", "Validating each batch"],
        ["Pulling a crate off the line", "Stopping the pipeline on failure"],
      ],
      breaks: "a plant inspects real bottles. Expectations only check what you thought to write down; a new kind of bad data passes until someone adds a rule for it.",
    },
    svg: () => {
      let b = t(240, 22, "Validate today's batch before publishing", { bold: true, size: 14 });
      b += box(16, 44, 110, 60, "batch", "2026-11-04", "plain", { mono2: true });
      b += arrow(128, 74, 150, 74);
      const ex = [["order_id not null", "pass", "good"], ["amount 0 to 1M", "pass", "good"], ["city in known set", "fail: 12 rows", "bad"]];
      ex.forEach(([e, r, k], i) => { b += box(154, 40 + i * 40, 180, 32, e, null, "plain", { size: 12 }); b += box(342, 40 + i * 40, 122, 32, r, null, k, { size: 12 }); });
      b += arrow(240, 162, 240, 184);
      b += box(100, 186, 280, 42, "suite failed: don't publish", "Data Docs show the 12 bad values", "bad", { size: 13.5, size2: 11.5 });
      return svg(480, 242, b, "An expectation suite validating a batch and blocking publication");
    },
    caption: "One failing expectation fails the suite, which stops the batch before anyone sees it.",
    oneline: "Great Expectations runs written-down data rules on each batch and stops bad data at the gate.",
  };
})();
