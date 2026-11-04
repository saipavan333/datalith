/* Datalith pass 2 — Track 6: Python for Data Engineering (part 2 of 3). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- py-oop */
  P["py-oop"] = {
    simple: [
      "A **class** is a blueprint. It says what data a thing holds and what it can do. An **object** is one real thing built from that blueprint.",
      "`__init__` runs when an object is made and stores its data on `self`. **Methods** are functions that belong to the class and work on that data.",
      "**Inheritance** lets a new class reuse an old one and change only what differs, like a `CsvSource` built on a general `Source`.",
    ],
    analogy: {
      text: "Think of a cookie cutter and the cookies it makes.",
      left: "Baking", right: "Python OOP",
      map: [
        ["The cookie cutter", "The class"],
        ["Each cookie you press out", "An object (instance)"],
        ["This cookie's icing colour", "An attribute on `self`"],
        ["\"Add sprinkles\" works on any cookie", "A method"],
        ["A star cutter with a hole added", "A subclass that overrides one thing"],
      ],
      breaks: "a cutter is used up front and forgotten. A class stays live: change a class attribute and every object without its own copy sees the change.",
    },
    svg: () => {
      let b = t(240, 22, "class Source  ->  class CsvSource(Source)", { bold: true, size: 13, mono: true });
      b += box(150, 38, 180, 62, "Source", "read(), validate()", "acc", { mono2: true });
      b += arrow(240, 102, 240, 126, { label: "inherits", dx: 34, dy: 4 });
      b += box(150, 128, 180, 62, "CsvSource", "read() overridden", "vio", { mono2: true });
      b += arrow(190, 192, 100, 222); b += arrow(290, 192, 380, 222);
      b += box(20, 224, 160, 50, "orders", "path='orders.csv'", "good", { mono2: true, size2: 11 });
      b += box(300, 224, 160, 50, "users", "path='users.csv'", "good", { mono2: true, size2: 11 });
      b += t(240, 254, "objects", { size: 12, fill: C.goodT, bold: true });
      b += t(240, 298, "validate() is reused; read() is replaced.", { size: 12.5, fill: C.dim });
      return svg(480, 312, b, "A base class, a subclass and two objects");
    },
    caption: "CsvSource reuses validate() from Source and replaces read(); each object holds its own path.",
    oneline: "A class is a blueprint, and each object is one thing built from it with its own data.",
  };

  /* ---------------------------------------------------------------- py-venv-packaging */
  P["py-venv-packaging"] = {
    simple: [
      "Each project needs its own versions of libraries. One job may need pandas 1.5 while another needs pandas 2.2.",
      "A **virtual environment** (venv) is a private folder with its own Python packages, so projects don't break each other. Make one with `python -m venv .venv`.",
      "Write the exact versions down (in `requirements.txt` or `pyproject.toml` with a lock file) so the server installs the same thing your laptop ran.",
    ],
    analogy: {
      text: "Think of each school subject having its own pencil case.",
      left: "Pencil cases", right: "Python environments",
      map: [
        ["One pencil case per subject", "One venv per project"],
        ["Maths needs a compass, art needs crayons", "Different packages and versions"],
        ["A list taped inside the lid", "`requirements.txt` / lock file"],
        ["Packing an identical case for a friend", "Reproducible install on a server"],
        ["The school's shared cupboard", "System Python: don't install into it"],
      ],
      breaks: "pencils don't depend on each other, but packages do. Pinning only your direct packages leaves their dependencies free to change; a lock file pins those too.",
    },
    svg: () => {
      let b = t(240, 22, "Two projects, two environments, no clash", { bold: true, size: 14 });
      b += box(20, 40, 200, 130, null, null, "acc");
      b += t(120, 62, "etl-jobs/.venv", { bold: true, mono: true, size: 13, fill: C.accT });
      b += box(36, 76, 168, 28, "pandas 1.5.3", null, "plain", { mono: true, size: 12.5 });
      b += box(36, 112, 168, 28, "numpy 1.26.4", null, "plain", { mono: true, size: 12.5 });
      b += box(260, 40, 200, 130, null, null, "vio");
      b += t(360, 62, "ml-features/.venv", { bold: true, mono: true, size: 13, fill: C.vioT });
      b += box(276, 76, 168, 28, "pandas 2.2.3", null, "plain", { mono: true, size: 12.5 });
      b += box(276, 112, 168, 28, "numpy 2.1.3", null, "plain", { mono: true, size: 12.5 });
      b += box(140, 196, 200, 40, "requirements.txt", "pins every version", "warn", { mono: true });
      b += arrow(120, 172, 190, 194, { dash: true }); b += arrow(360, 172, 290, 194, { dash: true });
      b += t(240, 262, "pip install -r requirements.txt rebuilds it anywhere", { size: 12.5, fill: C.dim });
      return svg(480, 278, b, "Two isolated virtual environments with pinned versions");
    },
    caption: "Each project has its own packages; the pinned list lets any machine rebuild the same environment.",
    oneline: "A virtual environment gives each project its own private set of package versions.",
  };

  /* ---------------------------------------------------------------- py-testing */
  P["py-testing"] = {
    simple: [
      "A **test** is a small piece of code that runs your code and checks the answer. If the answer is wrong, the test fails and tells you.",
      "**pytest** finds files named `test_*.py`, runs every function named `test_*`, and reports which ones passed. A plain `assert total(rows) == 42` is all a test needs.",
      "Tests let you change a pipeline on Friday without fearing what breaks on Monday.",
    ],
    analogy: {
      text: "Think of a smoke alarm in a kitchen.",
      left: "Smoke alarm", right: "Automated test",
      map: [
        ["It checks for one specific danger", "One test checks one behaviour"],
        ["It runs all the time, without you", "Tests run on every change (CI)"],
        ["The press-to-test button", "Running `pytest` yourself"],
        ["Fake smoke used to test the alarm", "Fixtures and fake data"],
      ],
      breaks: "an alarm can't tell you what's safe, only what's on fire. Passing tests prove only what they check; untested paths can still be wrong.",
    },
    svg: () => {
      let b = t(240, 22, "pytest: arrange, act, assert", { bold: true, size: 14 });
      const s = [["arrange", "rows = [{'amt': 10}, {'amt': 32}]", "plain"], ["act", "result = total(rows)", "acc"], ["assert", "assert result == 42", "good"]];
      s.forEach(([h, c, k], i) => {
        const y = 40 + i * 58;
        b += badge(36, y + 22, i + 1, k === "plain" ? "acc" : k);
        b += box(60, y, 400, 44, c, h, k, { mono: true, size: 12.5 });
        if (i < 2) b += arrow(260, y + 44, 260, y + 56);
      });
      b += box(60, 222, 190, 36, "pass: green dot", null, "good", { size: 13 });
      b += box(270, 222, 190, 36, "fail: shows both values", null, "bad", { size: 13 });
      return svg(480, 272, b, "The arrange-act-assert shape of a pytest test");
    },
    caption: "Set up input, call the code, assert on the result. pytest reports the values when an assert fails.",
    oneline: "A test runs your code on known input and checks the answer, so mistakes show up at once.",
  };

  /* ---------------------------------------------------------------- py-decorators */
  P["py-decorators"] = {
    simple: [
      "A **decorator** wraps a function in extra behaviour without changing its code. You put `@retry` above `def fetch():` and fetch now retries on failure.",
      "Under the hood, `@retry` above `fetch` means `fetch = retry(fetch)`: a function that takes a function and returns a new one.",
      "A **context manager** does setup and cleanup around a block: `with open(...)` or `with conn:`. The cleanup happens even if the block fails.",
    ],
    analogy: {
      text: "Think of gift-wrapping a present.",
      left: "Gift wrap", right: "Decorator",
      map: [
        ["The present inside", "The original function"],
        ["The wrapping paper around it", "The wrapper function"],
        ["Tag: \"open carefully\"", "Extra behaviour: logging, timing, retry"],
        ["Two layers of paper", "Two stacked decorators"],
        ["The wrap goes on and off around the present", "A context manager's enter and exit"],
      ],
      breaks: "paper hides the present's label. A wrapper hides the function's name and docstring too, unless you use `functools.wraps`.",
    },
    svg: () => {
      let b = t(240, 22, "@timer  @retry(3)  def fetch(): ...", { bold: true, size: 13, mono: true });
      b += `<rect x="40" y="40" width="400" height="190" rx="12" style="fill:none;stroke:${C.warnS};stroke-width:1.8"/>`;
      b += t(240, 60, "timer: start clock ... stop clock", { size: 12.5, fill: C.warnT, bold: true });
      b += `<rect x="80" y="72" width="320" height="140" rx="10" style="fill:none;stroke:${C.vioS};stroke-width:1.8"/>`;
      b += t(240, 92, "retry: try up to 3 times", { size: 12.5, fill: C.vioT, bold: true });
      b += box(140, 110, 200, 80, "fetch()", "the original code", "good", { mono: true });
      b += t(240, 258, "Equivalent: fetch = timer(retry(3)(fetch))", { size: 12.5, mono: true, fill: C.dim });
      return svg(480, 274, b, "Stacked decorators as layers around a function");
    },
    caption: "The decorator nearest the def wraps first; the top one is the outermost layer.",
    oneline: "A decorator wraps a function in extra behaviour, like retries or timing, without editing it.",
  };

  /* ---------------------------------------------------------------- py-concurrency */
  const CONC = [
    ["I/O, threads", "threads overlap while waiting", [[0, 1, "w"], [0, 1, "w"], [0, 1, "w"], [0, 1, "w"]], 1, "good"],
    ["CPU, threads", "the GIL lets one thread run Python at a time", [[0, 1, "c"], [1, 2, "c"], [2, 3, "c"], [3, 4, "c"]], 4, "bad"],
    ["CPU, processes", "each process has its own interpreter and GIL", [[0, 1, "c"], [0, 1, "c"], [0, 1, "c"], [0, 1, "c"]], 1, "good"],
    ["I/O, asyncio", "one thread, switching at each await", [[0, 1, "w"], [0, 1, "w"], [0, 1, "w"], [0, 1, "w"]], 1, "good"],
  ];
  P["py-concurrency"] = {
    simple: [
      "**Concurrency** means doing several jobs in overlapping time. It helps most when a job spends time **waiting**, for a network reply or a disk.",
      "**Threads** share one program. In the standard CPython build, the **GIL** (Global Interpreter Lock) lets only one thread run Python code at a time. That is fine while threads wait on I/O (input/output: network, disk), but it stops them from speeding up heavy maths.",
      "For CPU-heavy work, use **processes** (`multiprocessing`, `ProcessPoolExecutor`): each has its own interpreter. For thousands of network calls, **asyncio** switches between tasks on one thread.",
    ],
    analogy: {
      text: "Think of a kitchen cooking four dishes.",
      left: "Kitchen", right: "Python concurrency",
      map: [
        ["One chef, four pots simmering", "Threads or asyncio on waiting (I/O) work"],
        ["One chef, four piles of onions to chop", "Threads on CPU work: no speed-up"],
        ["Only one chef may hold the knife", "The GIL"],
        ["Four chefs, four knives", "Processes: real parallel CPU work"],
        ["Hiring a chef takes time and space", "Process start-up and memory cost"],
      ],
      breaks: "chefs share one fridge easily. Processes don't share memory: data must be copied (pickled) between them, which can cost more than the work for small tasks. Python 3.13+ also has an optional free-threaded build without the GIL.",
    },
    svg: () => P["py-concurrency"]._fig(1),
    _fig: i => {
      const [name, why, lanes, total, k] = CONC[i];
      let b = t(240, 22, "4 tasks, each 1 second: " + name, { bold: true, size: 13.5 });
      const x0 = 90, u = 88;
      for (let s = 0; s <= 4; s++) { b += line(x0 + s * u, 36, x0 + s * u, 210, { stroke: "#2b3446", sw: 1 }); b += t(x0 + s * u, 226, s + "s", { size: 11.5, fill: C.faint }); }
      lanes.forEach(([a, z, kind], j) => {
        const y = 44 + j * 40;
        b += t(20, y + 21, (i === 2 ? "proc " : i === 3 ? "task " : "thr ") + (j + 1), { a: "start", size: 12, fill: C.dim, mono: true });
        b += `<rect x="${x0 + a * u}" y="${y}" width="${(z - a) * u}" height="28" rx="5" style="fill:${kind === "w" ? C.acc : C.vio};stroke:${kind === "w" ? C.accS : C.vioS}"/>`;
        b += t(x0 + (a + z) / 2 * u, y + 19, kind === "w" ? "waiting" : "computing", { size: 11.5, fill: kind === "w" ? C.accT : C.vioT, max: (z - a) * u - 6 });
      });
      b += box(20, 240, 440, 40, "Total about " + total + " s", why, k, { size: 13.5, size2: 11.5 });
      return svg(480, 294, b, "Timeline of four tasks under one concurrency model");
    },
    caption: "Waiting overlaps well on threads or asyncio; computing only overlaps across processes.",
    ix: el => choice(el, { label: "Workload and tool", options: CONC.map(c => c[0]), value: 0 }, i => ({
      svg: P["py-concurrency"]._fig(i),
      note: ["Use threads for blocking libraries like <code>requests</code> or database drivers.", "Threads take turns holding the GIL, so pure-Python maths runs one after another. Libraries like NumPy release the GIL inside their C code, so they can still overlap.", "Processes run in parallel on 4 cores, at the cost of start-up time and copying data between them.", "Best for thousands of concurrent network calls with an async client like <code>httpx</code> or <code>aiohttp</code>."][i],
    })),
    oneline: "Use threads or asyncio when work waits, and processes when work computes.",
  };

  /* ---------------------------------------------------------------- py-logging-config */
  const LV = [["DEBUG", 10], ["INFO", 20], ["WARNING", 30], ["ERROR", 40], ["CRITICAL", 50]];
  const MSGS = [["DEBUG", "row 18 parsed: {...}"], ["INFO", "loaded 120,000 rows"], ["WARNING", "3 rows had no email"], ["ERROR", "write to warehouse failed"], ["CRITICAL", "disk full, stopping"]];
  P["py-logging-config"] = {
    simple: [
      "`print` is fine on your laptop. In a pipeline that runs at 3 a.m., you need **logs**: messages with a time, a level and a source, saved where you can search them later.",
      "Each message has a **level**: DEBUG, INFO, WARNING, ERROR or CRITICAL. You set a threshold, and only messages at that level or above are kept.",
      "**Configuration** (paths, dates, passwords) belongs outside the code, in environment variables or config files, so one script runs in dev and prod.",
    ],
    analogy: {
      text: "Think of a ship's logbook kept by the crew.",
      left: "Ship's log", right: "Python logging",
      map: [
        ["Time written on every entry", "Timestamp in the log format"],
        ["\"Routine\", \"warning\", \"emergency\" stamps", "Log levels"],
        ["The captain reads only warnings and up", "Logger level set to WARNING"],
        ["Which crew member wrote it", "`logging.getLogger(__name__)`"],
        ["Sealed orders opened at sea, not printed in the log", "Secrets in env vars, never in logs"],
      ],
      breaks: "a logbook is one book. Python logs go through handlers, so the same message can go to the console, a file and a monitoring service at once, each with its own level.",
    },
    svg: () => P["py-logging-config"]._fig(1),
    _fig: lvl => {
      const th = LV[lvl][1];
      let b = t(240, 22, "logger.setLevel(logging." + LV[lvl][0] + ")", { bold: true, size: 13.5, mono: true });
      MSGS.forEach(([l, m], j) => {
        const y = 38 + j * 42, keep = LV[j][1] >= th;
        b += box(20, y, 104, 32, l, null, keep ? (j >= 3 ? "bad" : j === 2 ? "warn" : "acc") : "ghost", { size: 12.5, mono: true });
        b += t(136, y + 21, m, { a: "start", size: 12.5, mono: true, fill: keep ? C.tx : C.faint });
        b += t(462, y + 21, keep ? "kept" : "dropped", { a: "end", size: 12, fill: keep ? C.goodT : C.faint, bold: keep });
      });
      return svg(480, 254, b, "Which log messages pass a level threshold");
    },
    caption: "Messages below the threshold are dropped; the ones at or above it are written.",
    ix: el => choice(el, { label: "Threshold", options: LV.map(l => l[0]), value: 2 }, i => ({
      svg: P["py-logging-config"]._fig(i),
      note: ["Everything is kept. Useful while debugging, far too noisy in production.", "A common production choice: progress plus problems.", "Python's root logger defaults to WARNING, which is why <code>logging.info(...)</code> shows nothing until you configure it.", "Only failures. You lose the context that explains them.", "Almost nothing is kept."][i],
    })),
    oneline: "Logs are timestamped, levelled messages you can search later, and config lives outside the code.",
  };

  /* ---------------------------------------------------------------- py-db-connections */
  P["py-db-connections"] = {
    simple: [
      "Python talks to a database through a **driver** (like `psycopg` for PostgreSQL). You open a **connection**, run SQL through a **cursor**, then **commit** to save.",
      "Always pass values as **parameters** (`cur.execute(\"... WHERE id = %s\", (uid,))`), never by pasting them into the SQL string. That blocks SQL injection.",
      "Every call is a **round trip** over the network. Sending rows in batches, or using bulk paths like `COPY`, is often 100 times faster than one row per call.",
    ],
    analogy: {
      text: "Think of carrying shopping from the car into the house.",
      left: "Carrying shopping", right: "Loading a database",
      map: [
        ["One trip per item", "One INSERT per row"],
        ["Filling a big bag each trip", "Batched or multi-row INSERT"],
        ["Pushing a trolley through the garage", "Bulk load (`COPY`)"],
        ["The walk to the door", "Network round trip"],
        ["Keeping the front door open", "A connection pool"],
      ],
      breaks: "a bag can split if it is too heavy. Very large batches use lots of memory and hold locks longer; a few thousand rows per batch is a usual starting point, then measure.",
    },
    svg: () => P["py-db-connections"]._fig(0),
    _fig: v => {
      const N = 100000, batch = 10 ** v, trips = Math.ceil(N / batch), ms = trips * 1;
      let b = t(240, 22, "Insert 100,000 rows, about 1 ms per round trip", { bold: true, size: 13.5 });
      b += box(20, 40, 100, 60, "Python", "client", "acc");
      b += box(360, 40, 100, 60, "Database", "server", "vio");
      const show = Math.min(trips, 8);
      for (let i = 0; i < show; i++) b += arrow(124, 48 + i * 6.5, 356, 48 + i * 6.5, { stroke: C.line, sw: 1.2 });
      b += t(240, 120, trips.toLocaleString("en-US") + " round trips" + (trips > 8 ? " (8 drawn)" : ""), { size: 13, fill: C.tx, mono: true });
      b += table(80, 140, ["batch size", "round trips", "network wait"], [[batch.toLocaleString("en-US"), trips.toLocaleString("en-US"), ms >= 1000 ? (ms / 1000).toFixed(1) + " s" : ms + " ms"]], { cw: [110, 110, 120], rh: 30, hl: { 0: v >= 3 ? "good" : v <= 1 ? "bad" : "warn" } });
      b += t(240, 226, "Network wait only; server work comes on top.", { size: 12, fill: C.faint });
      return svg(480, 240, b, "Round trips for a bulk insert at a batch size");
    },
    caption: "One row per call means 100,000 trips across the network; batching cuts that by the batch size.",
    ix: el => slider(el, { label: "Rows per batch", min: 0, max: 5, value: 3, fmt: v => (10 ** v).toLocaleString("en-US") }, v => ({
      svg: P["py-db-connections"]._fig(v),
      note: v === 0 ? "One row per call: 100,000 trips, about 100 s of pure waiting." : v >= 4 ? "Few trips now. Past this point the server's work, not the network, decides the time." : "Each 10x bigger batch cuts the trips by 10x.",
    })),
    oneline: "Connect, run parameterised SQL, commit, and send rows in batches to save round trips.",
  };

  /* ---------------------------------------------------------------- py-apis-ingestion */
  P["py-apis-ingestion"] = {
    simple: [
      "A **REST API** (an HTTP interface to someone else's data) answers requests like `GET /orders?page=2` with JSON.",
      "Big results come in **pages**: you ask for page after page until the API says there are no more. APIs also set **rate limits**, like 10 requests per second.",
      "A good ingester retries with growing waits (**backoff**) when it gets 429 (too many requests) or 5xx (server error), and records where it stopped so a rerun can carry on.",
    ],
    analogy: {
      text: "Think of borrowing a long series of books, a few at a time, from a library with a strict desk.",
      left: "Library desk", right: "API ingestion",
      map: [
        ["Only 100 books per visit", "Page size limit"],
        ["Only 10 visits a minute, or they turn you away", "Rate limit, HTTP 429"],
        ["A slip saying \"next: book 301\"", "Cursor or `next` link"],
        ["Come back later when it's closed", "Retry with backoff"],
        ["Your notebook of what you already have", "Saved checkpoint"],
      ],
      breaks: "library books don't change while you borrow them. API data can change between pages, so offset paging can skip or repeat rows; cursor paging on a stable sort key avoids that.",
    },
    svg: () => P["py-apis-ingestion"]._fig(10),
    _fig: ps => {
      const N = 1000000, rps = 10, req = Math.ceil(N / ps), secs = req / rps;
      let b = t(240, 22, "Pull 1,000,000 records at 10 requests per second", { bold: true, size: 13.5 });
      b += box(20, 40, 110, 56, "ingester", "GET ?page=n", "acc", { mono2: true });
      b += box(350, 40, 110, 56, "API", "page_size=" + ps, "vio", { mono2: true, size2: 11.5 });
      b += arrow(132, 58, 346, 58, { label: "request" });
      b += arrow(346, 80, 132, 80, { label: ps + " records + next cursor", dy: 16, stroke: C.goodS });
      const fmt = s => s >= 3600 ? (s / 3600).toFixed(1) + " h" : s >= 60 ? (s / 60).toFixed(1) + " min" : s.toFixed(0) + " s";
      b += table(60, 130, ["page size", "requests", "time at limit"], [[String(ps), req.toLocaleString("en-US"), fmt(secs)]], { cw: [110, 120, 130], rh: 30, hl: { 0: secs > 3600 ? "bad" : secs > 600 ? "warn" : "good" } });
      b += t(240, 216, "On 429 or 5xx: wait 1, 2, 4, 8 s ... then retry.", { size: 12.5, fill: C.dim });
      return svg(480, 232, b, "Requests and time needed to page through an API");
    },
    caption: "At 10 records a page the load needs 100,000 requests and nearly 3 hours; bigger pages cut both.",
    ix: el => slider(el, { label: "Page size", min: 10, max: 1000, step: 10, value: 100 }, v => ({
      svg: P["py-apis-ingestion"]._fig(v),
      note: v < 100 ? "Small pages: the rate limit, not the data, sets the run time." : "Many APIs cap page size (100 is common), so check the docs before assuming a big page works.",
    })),
    oneline: "Page through the API politely, back off on errors, and save where you stopped.",
  };

  /* ---------------------------------------------------------------- std-os-sys */
  P["std-os-sys"] = {
    simple: [
      "`os` lets your script talk to the operating system: read **environment variables**, list folders, make directories, check if a file exists.",
      "`sys` is about the Python program itself: `sys.argv` holds the command-line words, `sys.exit(1)` stops with an error code, and `sys.path` says where imports are searched.",
      "Schedulers like cron or Airflow judge a job by its **exit code**: 0 means it worked, anything else means it failed.",
    ],
    analogy: {
      text: "Think of a hotel room you've checked into.",
      left: "Hotel room", right: "os / sys",
      map: [
        ["Notes the front desk left for you", "Environment variables (`os.environ`)"],
        ["Opening drawers and cupboards", "`os.listdir`, `os.makedirs`"],
        ["Your booking: name and dates", "`sys.argv`"],
        ["Checking out: \"all good\" or \"problem\"", "Exit code 0 or non-zero"],
      ],
      breaks: "a hotel note is the same for every guest in the room. Environment variables are copied into each child process when it starts; changing them later in the parent doesn't reach a child that is already running.",
    },
    svg: () => {
      let b = t(240, 22, "python load.py 2026-11-04", { bold: true, size: 13.5, mono: true });
      b += box(20, 40, 200, 50, "sys.argv", "['load.py', '2026-11-04']", "acc", { mono: true, mono2: true, size2: 11 });
      b += box(260, 40, 200, 50, "os.environ['DB_URL']", "set outside the code", "vio", { mono: true, size: 12.5 });
      b += arrow(120, 92, 200, 124); b += arrow(360, 92, 280, 124);
      b += box(140, 126, 200, 44, "your script runs", null, "plain");
      b += arrow(200, 172, 110, 204); b += arrow(280, 172, 370, 204);
      b += box(20, 206, 180, 44, "sys.exit(0)", "success", "good", { mono: true });
      b += box(280, 206, 180, 44, "sys.exit(1)", "scheduler marks failed", "bad", { mono: true });
      return svg(480, 264, b, "Arguments and environment in, exit code out");
    },
    caption: "Inputs arrive through argv and the environment; the exit code tells the scheduler how it went.",
    oneline: "os talks to the operating system and sys talks about the running program, including its exit code.",
  };

  /* ---------------------------------------------------------------- std-pathlib */
  P["std-pathlib"] = {
    simple: [
      "`pathlib` treats a file path as an object instead of a string. You join parts with `/`: `Path('data') / 'raw' / 'orders.csv'`.",
      "It works the same on Windows (backslashes) and Linux (forward slashes), so one script runs on both.",
      "Useful parts: `.name`, `.stem`, `.suffix`, `.parent`, `.exists()`, `.glob('*.csv')`, `.read_text()` and `.mkdir(parents=True, exist_ok=True)`.",
    ],
    analogy: {
      text: "Think of a postal address written in parts.",
      left: "Postal address", right: "Path object",
      map: [
        ["Country / city / street / house", "Folders joined with `/`"],
        ["The house number", "`.name` (`orders.csv`)"],
        ["The street it sits on", "`.parent`"],
        ["Kind of building: flat or shop", "`.suffix` (`.csv`)"],
        ["Each country writes addresses its own way", "Windows vs POSIX separators handled for you"],
      ],
      breaks: "an address exists whether or not anyone lives there. A Path is just a name too: making one doesn't create the file, and `.exists()` checks the disk at that moment only.",
    },
    svg: () => {
      let b = t(240, 22, "p = Path('data') / 'raw' / 'orders_2026.csv'", { bold: true, size: 12.5, mono: true });
      const parts = [["data", 20, 90], ["raw", 120, 80], ["orders_2026", 210, 140], [".csv", 350, 70]];
      parts.forEach(([s, x, w], i) => { b += box(x, 44, w, 40, s, null, i === 2 ? "acc" : i === 3 ? "warn" : "plain", { mono: true, size: 13 }); });
      b += t(115, 70, "/", { size: 16, mono: true, fill: C.dim }); b += t(205, 70, "/", { size: 16, mono: true, fill: C.dim });
      b += line(20, 98, 200, 98, { stroke: C.vioS, sw: 2.4 }); b += t(110, 116, "p.parent", { mono: true, size: 12.5, fill: C.vioT });
      b += line(210, 130, 420, 130, { stroke: C.goodS, sw: 2.4 }); b += t(315, 148, "p.name", { mono: true, size: 12.5, fill: C.goodT });
      b += line(210, 98, 350, 98, { stroke: C.accS, sw: 2.4 }); b += t(280, 116, "p.stem", { mono: true, size: 12.5, fill: C.accT });
      b += line(350, 98, 420, 98, { stroke: C.warnS, sw: 2.4 }); b += t(385, 116, "p.suffix", { mono: true, size: 12.5, fill: C.warnT });
      b += t(240, 186, "Windows: data\\raw\\orders_2026.csv", { mono: true, size: 12.5, fill: C.dim });
      b += t(240, 208, "Linux:   data/raw/orders_2026.csv", { mono: true, size: 12.5, fill: C.dim });
      return svg(480, 224, b, "Parts of a pathlib Path");
    },
    caption: "One Path object, split into parent, stem and suffix, printed correctly on each operating system.",
    oneline: "pathlib turns file paths into objects you join with / and pick apart safely on any system.",
  };

  /* ---------------------------------------------------------------- std-re */
  const RTEXT = "Order #A-1042 paid 1250.50 on 2026-11-04 by ria@datalith.in";
  const RPAT = [["\\d+", /\d+/g], ["\\d{4}-\\d{2}-\\d{2}", /\d{4}-\d{2}-\d{2}/g], ["[\\w.]+@[\\w.]+", /[\w.]+@[\w.]+/g], ["#([A-Z])-(\\d+)", /#([A-Z])-(\d+)/g], ["\\d+\\.\\d{2}", /\d+\.\d{2}/g]];
  P["std-re"] = {
    simple: [
      "A **regular expression** (regex) is a small pattern language for finding text. `\\d` means \"a digit\", `+` means \"one or more\", so `\\d+` finds every run of digits.",
      "Python's `re` module runs patterns: `re.search` finds the first match, `re.findall` finds all, `re.sub` replaces them.",
      "Write patterns as raw strings, `r\"\\d+\"`, so Python doesn't treat the backslashes itself.",
    ],
    analogy: {
      text: "Think of a stencil you slide along a line of text.",
      left: "Stencil", right: "Regex",
      map: [
        ["A hole shaped like \"any digit\"", "`\\d`"],
        ["\"As many of these as fit\"", "`+`, `*`, `{4}`"],
        ["Slide the stencil left to right", "The engine scans the text"],
        ["Mark every place it fits", "`re.findall`"],
        ["Coloured windows for parts you want", "Groups `( )`"],
      ],
      breaks: "a stencil checks one spot at a time. Some regexes backtrack: badly written patterns like `(a+)+$` can take exponential time on certain inputs and stall a pipeline.",
    },
    svg: () => P["std-re"]._fig(3),
    _fig: i => {
      const [src, re] = RPAT[i]; re.lastIndex = 0;
      const ms = [...RTEXT.matchAll(re)];
      let b = t(240, 22, "re.findall(r\"" + src + "\", text)", { bold: true, size: 13, mono: true });
      const halves = [RTEXT.slice(0, 30), RTEXT.slice(30)];
      halves.forEach((h, row) => {
        const off = row * 30, y = 46 + row * 36;
        for (let k = 0; k < h.length; k++) {
          const pos = off + k, hit = ms.some(m => pos >= m.index && pos < m.index + m[0].length);
          const x = 20 + k * 14.6;
          if (hit) b += `<rect x="${x}" y="${y}" width="14.6" height="26" style="fill:${C.good};stroke:none"/>`;
          b += t(x + 7.3, y + 18, h[k], { mono: true, size: 13, fill: hit ? C.goodT : C.dim });
        }
      });
      const rows = ms.slice(0, 6).map(m => [m[0], m.length > 1 ? m.slice(1).join(", ") : "-"]);
      b += table(60, 132, ["match", "groups"], rows.length ? rows : [["(none)", "-"]], { cw: [200, 160], rh: 24, size: 12.5 });
      const h = 132 + 24 * (Math.max(rows.length, 1) + 1) + 14;
      return svg(480, Math.max(h, 210), b, "Regex matches highlighted in a line of text");
    },
    caption: "Green characters matched. With groups in the pattern, findall returns the groups, not the whole match.",
    ix: el => choice(el, { label: "Pattern", options: RPAT.map(p => p[0]), value: 0 }, i => ({
      svg: P["std-re"]._fig(i),
      note: ["Every run of digits, including the 50 after the decimal point and each part of the date.", "Exactly 4 digits, dash, 2, dash, 2: an ISO date.", "A quick email finder. Real email rules are far looser; don't use this to validate addresses.", "With groups, Python's findall returns tuples of the groups: ('A', '1042').", "Digits, a literal dot (escaped), then exactly 2 digits."][i],
    })),
    oneline: "A regex is a text pattern, and Python's re module finds, extracts or replaces whatever matches it.",
  };

  /* ---------------------------------------------------------------- std-collections */
  P["std-collections"] = {
    simple: [
      "The `collections` module adds containers for jobs the basic ones do clumsily.",
      "**Counter** counts things: `Counter(cities).most_common(3)`. **defaultdict** makes missing keys start with a default, like an empty list. **deque** (double-ended queue) adds and removes at both ends fast. **namedtuple** gives tuple fields names.",
      "They replace pages of `if key not in d:` code with one line, and they are faster too.",
    ],
    analogy: {
      text: "Think of special tools in a school office.",
      left: "School office", right: "collections",
      map: [
        ["A tally sheet for votes", "`Counter`"],
        ["A filing cabinet that grows a new folder when you name one", "`defaultdict(list)`"],
        ["A queue where people join and leave at both ends", "`deque`"],
        ["A form with labelled boxes", "`namedtuple`"],
      ],
      breaks: "a filing cabinet doesn't add folders when you just look. A defaultdict does: even reading `d['x']` creates the key. Use `d.get('x')` or `'x' in d` to check without creating it.",
    },
    svg: () => {
      let b = t(240, 22, "Counter(['Pune','Goa','Pune','Delhi','Pune','Goa'])", { bold: true, size: 12, mono: true });
      const data = [["Pune", 3], ["Goa", 2], ["Delhi", 1]];
      data.forEach(([c, n], i) => {
        const y = 44 + i * 40;
        b += t(80, y + 20, c, { a: "end", mono: true, size: 13 });
        b += `<rect x="92" y="${y + 2}" width="${n * 80}" height="26" rx="4" style="fill:${C.acc};stroke:${C.accS}"/>`;
        b += t(100 + n * 80, y + 20, String(n), { a: "start", mono: true, size: 13, fill: C.accT, bold: true });
      });
      b += t(240, 186, ".most_common(1)  ->  [('Pune', 3)]", { mono: true, size: 13, fill: C.goodT });
      b += t(240, 212, "deque(maxlen=3): keeps only the last 3 items", { size: 12.5, fill: C.dim });
      return svg(480, 228, b, "Counter tallies values");
    },
    caption: "Counter builds the tally in one pass; most_common reads off the top entries.",
    oneline: "collections gives you ready-made counters, auto-filling dicts and fast queues.",
  };

  /* ---------------------------------------------------------------- std-itertools */
  P["std-itertools"] = {
    simple: [
      "`itertools` holds building blocks for working with streams of items without building big lists.",
      "`chain` joins streams end to end. `islice` takes the first N. `groupby` groups items that sit next to each other with the same key. `batched` (Python 3.12+) cuts a stream into chunks.",
      "`functools` holds tools for functions: `lru_cache` remembers past answers, `partial` fixes some arguments, `reduce` folds a stream into one value.",
    ],
    analogy: {
      text: "Think of a model railway and its track pieces.",
      left: "Model railway", right: "itertools",
      map: [
        ["Joining two tracks into one line", "`chain`"],
        ["Letting only the first 10 wagons through", "`islice`"],
        ["Coupling wagons of the same colour that are already next to each other", "`groupby`"],
        ["Splitting the train into groups of 5", "`batched`"],
      ],
      breaks: "the railway lets you sort wagons in the yard first. `groupby` does not sort: if the same key appears in two separate runs, you get two groups. Sort by the key first when you need one group per key.",
    },
    svg: () => {
      let b = t(240, 22, "groupby only joins neighbours", { bold: true, size: 14 });
      const s = ["A", "A", "B", "A", "C", "C"];
      s.forEach((v, i) => { b += box(60 + i * 62, 40, 52, 36, v, null, v === "A" ? "acc" : v === "B" ? "vio" : "good", { mono: true }); });
      b += t(30, 64, "in", { size: 12, fill: C.dim });
      const g = [["A x2", 60, 114], ["B", 184, 52], ["A", 246, 52], ["C x2", 308, 114]];
      g.forEach(([l, x, w], i) => { b += `<rect x="${x - 3}" y="94" width="${w + 6}" height="36" rx="8" style="fill:none;stroke:${i === 2 ? C.badS : C.line};stroke-width:1.6"/>`; b += t(x + w / 2, 117, l, { mono: true, size: 13 }); });
      b += t(30, 117, "out", { size: 12, fill: C.dim });
      b += t(272, 150, "A appears twice: input wasn't sorted", { size: 12, fill: C.badT });
      b += t(240, 188, "sorted first: A A A | B | C C", { size: 13, mono: true, fill: C.goodT });
      b += t(240, 214, "batched(range(7), 3) -> (0,1,2) (3,4,5) (6,)", { size: 12.5, mono: true, fill: C.dim });
      return svg(480, 230, b, "itertools.groupby on unsorted input");
    },
    caption: "groupby starts a new group each time the key changes, so sort by the key first.",
    oneline: "itertools gives you lazy building blocks for streams, and functools gives you tools for functions.",
  };
})();
