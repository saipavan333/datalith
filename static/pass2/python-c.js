/* Datalith pass 2 — Track 6: Python for Data Engineering (part 3 of 3). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- std-subprocess */
  P["std-subprocess"] = {
    simple: [
      "Sometimes the right tool isn't Python: `gsutil`, `dbt`, `pg_dump`, `git`. `subprocess.run` starts another program from your script and waits for it.",
      "Pass the command as a list, `['dbt', 'run', '--select', 'orders']`, so spaces and odd characters can't be misread. Add `capture_output=True, text=True` to read what it printed.",
      "Add `check=True` so a failing command (non-zero exit code) raises an error instead of being silently ignored.",
    ],
    analogy: {
      text: "Think of a head chef sending an order to the pastry kitchen.",
      left: "Restaurant", right: "subprocess",
      map: [
        ["Writing the order on a ticket, word by word", "Command as a list of arguments"],
        ["Waiting for the dessert to come back", "`run()` waits for the process"],
        ["The dessert on the plate", "`stdout`"],
        ["A note saying \"we're out of cream\"", "`stderr` and a non-zero exit code"],
        ["Refusing to serve a failed dish", "`check=True` raises `CalledProcessError`"],
      ],
      breaks: "a ticket is just read. Passing one string with `shell=True` hands it to a shell that interprets it, so text from users or files could run extra commands. Avoid it unless you need shell features.",
    },
    svg: () => {
      let b = t(240, 22, "subprocess.run(['dbt','run'], capture_output=True, check=True)", { bold: true, size: 11, mono: true });
      b += box(20, 44, 150, 60, "your script", "waits", "acc");
      b += box(310, 44, 150, 60, "dbt process", "separate program", "vio");
      b += arrow(172, 64, 306, 64, { label: "args list" });
      b += arrow(306, 88, 172, 88, { label: "stdout, stderr, returncode", dy: 16, stroke: C.goodS });
      b += box(20, 140, 200, 44, "returncode 0", "carry on", "good", { mono: true });
      b += box(260, 140, 200, 44, "returncode 1", "CalledProcessError", "bad", { mono: true, mono2: true });
      b += t(240, 212, "Without check=True a failure is just a number nobody reads.", { size: 12.5, fill: C.dim });
      return svg(480, 228, b, "subprocess.run starts a child process and collects its output");
    },
    caption: "The child process runs on its own; run() collects its output and exit code when it ends.",
    oneline: "subprocess.run starts another program, waits, and hands back its output and exit code.",
  };

  /* ---------------------------------------------------------------- std-argparse */
  P["std-argparse"] = {
    simple: [
      "A script that a scheduler runs every day needs inputs, like which date to load. Editing the code each day is a bad idea.",
      "`argparse` reads **arguments** from the command line: `python load.py 2026-11-04 --env prod --limit 500`. It checks types, fills defaults, and builds a `--help` screen for free.",
      "**Positional** arguments are required and go by order. **Options** start with `--` and are usually optional.",
    ],
    analogy: {
      text: "Think of a form at a bank counter.",
      left: "Bank form", right: "argparse",
      map: [
        ["Boxes you must fill: name, account", "Positional arguments"],
        ["Tick boxes like \"send SMS alert\"", "Flags: `--dry-run`"],
        ["Pre-printed \"Branch: Main\" unless changed", "Defaults"],
        ["The clerk rejects letters in the amount box", "`type=int` validation"],
        ["Instructions printed on the back", "`--help`"],
      ],
      breaks: "a clerk can ask what you meant. argparse can't: a wrong argument stops the script with exit code 2 and a usage message.",
    },
    svg: () => {
      let b = t(240, 22, "python load.py 2026-11-04 --env prod --limit 500", { bold: true, size: 12, mono: true });
      b += arrow(240, 32, 240, 50);
      b += box(140, 52, 200, 40, "parser.parse_args()", null, "acc", { mono: true, size: 13 });
      b += arrow(240, 94, 240, 112);
      b += table(60, 114, ["attribute", "value", "type"], [["args.date", "'2026-11-04'", "str"], ["args.env", "'prod'", "choice"], ["args.limit", "500", "int"], ["args.dry_run", "False", "default"]], { cw: [130, 130, 100], rh: 28, size: 12.5 });
      return svg(480, 262, b, "argparse turns command-line words into typed attributes");
    },
    caption: "argparse parses the words, checks each type, and fills defaults for anything left out.",
    oneline: "argparse turns command-line words into checked, typed settings for your script.",
  };

  /* ---------------------------------------------------------------- std-fileops */
  P["std-fileops"] = {
    simple: [
      "A few standard modules handle everyday file chores so you don't write them by hand.",
      "**shutil** copies, moves and zips folders. **glob** finds files by pattern, like `raw/2026-11-*.csv`. **tempfile** gives you a scratch file or folder that is cleaned up for you. **gzip** and **zipfile** read and write compressed files.",
      "CSV and JSON logs often shrink by 5 to 10 times with gzip, which cuts storage and transfer costs.",
    ],
    analogy: {
      text: "Think of tidying a garage.",
      left: "Garage", right: "Module",
      map: [
        ["Moving boxes to another shelf", "`shutil.move`, `shutil.copytree`"],
        ["\"Find every box labelled 2026\"", "`glob('*2026*')`"],
        ["A workbench you clear when done", "`tempfile.TemporaryDirectory()`"],
        ["Vacuum-packing winter clothes", "`gzip` compression"],
      ],
      breaks: "vacuum packing always helps clothes. Compression only helps data with repeats; already-compressed files like Parquet, JPEG or zip barely shrink and just cost CPU.",
    },
    svg: () => {
      let b = t(240, 22, "A tidy landing step for raw files", { bold: true, size: 14 });
      b += box(20, 44, 130, 52, "glob", "inbox/*.csv", "acc", { mono2: true });
      b += arrow(152, 70, 174, 70);
      b += box(178, 44, 130, 52, "tempfile", "work in scratch", "vio");
      b += arrow(310, 70, 332, 70);
      b += box(336, 44, 130, 52, "gzip", "orders.csv.gz", "warn", { mono2: true });
      b += arrow(401, 98, 401, 124);
      b += box(276, 126, 190, 52, "shutil.move", "into archive/2026-11-04/", "good", { mono2: true, size2: 11 });
      b += t(20, 150, "orders.csv", { a: "start", mono: true, size: 12.5 });
      b += `<rect x="20" y="158" width="220" height="14" rx="3" style="fill:${C.bad};stroke:${C.badS}"/>`;
      b += t(20, 196, "orders.csv.gz", { a: "start", mono: true, size: 12.5 });
      b += `<rect x="20" y="204" width="30" height="14" rx="3" style="fill:${C.good};stroke:${C.goodS}"/>`;
      b += t(58, 216, "often 5-10x smaller for text", { a: "start", size: 12, fill: C.dim });
      return svg(480, 236, b, "Find, process in temp space, compress, archive");
    },
    caption: "Find the files, work in a temporary folder, compress, then move the result into its dated archive.",
    oneline: "shutil, glob, tempfile and gzip handle copying, finding, scratch space and compression for you.",
  };

  /* ---------------------------------------------------------------- std-typing */
  P["std-typing"] = {
    simple: [
      "**Type hints** write down what a function expects and returns: `def load(path: Path, limit: int = 100) -> list[Order]:`.",
      "Python itself ignores hints when running. Tools like **mypy** and your editor read them and warn you before the code runs, like when you pass a string where a number belongs.",
      "A **dataclass** turns a few typed fields into a full record class, with `__init__`, a readable print and `==` comparison written for you.",
    ],
    analogy: {
      text: "Think of labels on the sockets of a power strip.",
      left: "Power strip", right: "Type hints",
      map: [
        ["\"USB-C only\" printed by a socket", "`path: Path`"],
        ["A friend reads the label and warns you", "mypy or your editor"],
        ["The socket itself doesn't check", "Python runs it anyway"],
        ["A printed spec sheet for a device", "`@dataclass` with typed fields"],
      ],
      breaks: "a label won't stop a wrong plug. Hints don't validate data at run time; use Pydantic or explicit checks for data that arrives from outside.",
    },
    svg: () => {
      let b = t(240, 22, "@dataclass  class Order: id: int; city: str; amount: float", { bold: true, size: 11, mono: true });
      b += box(20, 44, 200, 120, null, null, "plain");
      ["@dataclass", "class Order:", "  id: int", "  city: str", "  amount: float"].forEach((l, i) => { b += t(32, 66 + i * 21, l, { a: "start", mono: true, size: 12.5, fill: i < 2 ? C.accT : C.tx }); });
      b += arrow(222, 104, 258, 104, { label: "generates" });
      ["__init__(id, city, amount)", "__repr__  Order(id=1, ...)", "__eq__  compares fields"].forEach((l, i) => { b += box(262, 44 + i * 42, 204, 34, l, null, "good", { mono: true, size: 11.5 }); });
      b += box(20, 186, 446, 42, "load('a.csv') where Path expected", "mypy: incompatible type \"str\"; expected \"Path\"", "warn", { mono: true, size: 12, size2: 11 });
      return svg(480, 242, b, "A dataclass and the methods it generates, plus a type checker warning");
    },
    caption: "The dataclass writes the boilerplate; the type checker catches the wrong argument before run time.",
    oneline: "Type hints say what goes in and out, and dataclasses write record classes for you.",
  };

  /* ---------------------------------------------------------------- lib-boto3 */
  P["lib-boto3"] = {
    simple: [
      "**boto3** is Amazon's official Python library for AWS (Amazon Web Services). With it a script can upload to S3 (Simple Storage Service), start jobs, read queues and more.",
      "You make a **client** for one service, `boto3.client('s3')`, and each method is one API call. Credentials come from the environment or a role, never from the code.",
      "Results come in pages: one `list_objects_v2` call returns at most 1,000 keys, so use a **paginator** to walk them all. (Pavan's day job is on GCP; the Google equivalent is `google-cloud-storage`.)",
    ],
    analogy: {
      text: "Think of a remote control for a huge warehouse.",
      left: "Warehouse remote", right: "boto3",
      map: [
        ["One remote per machine: lift, belt, door", "One client per service"],
        ["Each button does one thing", "Each method is one API call"],
        ["Your staff badge, not a password on the remote", "Credentials from env or an IAM role"],
        ["The shelf list prints 1,000 lines a page", "Paginated results"],
        ["A visitor pass that expires", "A presigned URL"],
      ],
      breaks: "a remote works instantly. Every boto3 call is an HTTP request that can be slow, throttled or fail, so retries and timeouts matter.",
    },
    svg: () => {
      let b = t(240, 22, "Listing 2,500 objects in a bucket", { bold: true, size: 14 });
      b += box(20, 44, 120, 56, "paginator", "list_objects_v2", "acc", { mono2: true, size2: 11 });
      [["page 1", "1,000 keys"], ["page 2", "1,000 keys"], ["page 3", "500 keys"]].forEach(([a, z], i) => {
        b += box(200 + i * 92, 44, 84, 56, a, z, i === 2 ? "good" : "plain", { size2: 11 });
      });
      b += arrow(142, 72, 196, 72);
      b += t(330, 126, "each page carries a ContinuationToken", { size: 12, fill: C.dim });
      b += box(20, 150, 440, 50, "credentials: env vars, ~/.aws, or an IAM role", "never hard-coded in the script", "warn", { size: 13 });
      b += t(240, 226, "boto3.client('s3') -> one method per S3 API call", { mono: true, size: 12, fill: C.dim });
      return svg(480, 242, b, "boto3 paginating through S3 keys");
    },
    caption: "The paginator keeps calling with the continuation token until the last, partial page.",
    oneline: "boto3 is the Python remote control for AWS, one client per service and one method per call.",
  };

  /* ---------------------------------------------------------------- lib-fsspec */
  P["lib-fsspec"] = {
    simple: [
      "Data lives in many places: your disk, Google Cloud Storage (`gs://`), Amazon S3 (`s3://`), Azure (`abfs://`). Each has its own library.",
      "**fsspec** puts one filesystem interface on top of all of them: `open`, `ls`, `glob`, `rm` work the same way whatever the URL says.",
      "That's why `pd.read_parquet('gs://bucket/orders.parquet')` just works: pandas, Polars, Dask and PyArrow call fsspec underneath (with `gcsfs` or `s3fs` installed).",
    ],
    analogy: {
      text: "Think of a universal travel plug adapter.",
      left: "Travel adapter", right: "fsspec",
      map: [
        ["Your laptop's one plug", "Your code: `fs.open(path)`"],
        ["Sockets in India, UK, US", "Local disk, GCS, S3"],
        ["The swappable pin heads", "Backends: `gcsfs`, `s3fs`, `local`"],
        ["Picking the pins by country", "Picking the backend by URL prefix"],
      ],
      breaks: "electricity feels the same through any socket. Cloud storage doesn't: listing millions of objects or renaming a folder is slow on object stores, because folders there are only name prefixes.",
    },
    svg: () => {
      let b = t(240, 22, "One API, many storage backends", { bold: true, size: 14 });
      b += box(130, 40, 220, 44, "pandas / Polars / Dask", null, "acc", { size: 13.5 });
      b += arrow(240, 86, 240, 104);
      b += box(110, 106, 260, 44, "fsspec: open, ls, glob", null, "vio", { mono: true, size: 13 });
      const be = [["local", "file://", 20], ["gcsfs", "gs://", 130], ["s3fs", "s3://", 240], ["adlfs", "abfs://", 350]];
      be.forEach(([n, p, x]) => { b += arrow(240, 152, x + 55, 182); b += box(x, 184, 110, 46, n, p, "plain", { mono: true, mono2: true }); });
      return svg(480, 244, b, "fsspec routes one API call to the right backend");
    },
    caption: "The URL prefix picks the backend; the code above it doesn't change.",
    oneline: "fsspec gives one file API for local disk and every cloud store, picked by the URL prefix.",
  };

  /* ---------------------------------------------------------------- lib-prefect */
  P["lib-prefect"] = {
    simple: [
      "An **orchestrator** runs your pipeline steps in the right order, on a schedule, and retries what fails. **Prefect** does this for plain Python functions.",
      "Add `@task` to each step and `@flow` to the function that calls them. Prefect then records every run, its state and its logs.",
      "`@task(retries=2, retry_delay_seconds=30)` makes a flaky API call try up to three times before the run is marked failed.",
    ],
    analogy: {
      text: "Think of a stage manager running a school play.",
      left: "School play", right: "Prefect",
      map: [
        ["The script of scenes in order", "The `@flow` function"],
        ["Each scene", "A `@task`"],
        ["Calling \"start again from the top\" after a stumble", "Retries"],
        ["The clipboard noting what happened each night", "Run history and states"],
        ["Showtime every Friday at 6", "A schedule on a deployment"],
      ],
      breaks: "a stage manager can't redo yesterday's show. Prefect can rerun a past date, but only if your tasks are safe to run twice (idempotent), like overwriting a partition instead of appending.",
    },
    svg: () => P["lib-prefect"]._fig(3),
    _fig: fails => {
      let b = t(240, 22, "@task(retries=2) fetch() fails " + fails + " time" + (fails === 1 ? "" : "s"), { bold: true, size: 13.5, mono: true });
      for (let a = 0; a < 3; a++) {
        const x = 20 + a * 150, ran = a <= fails && a < 3, ok = a === fails;
        b += box(x, 44, 130, 50, "attempt " + (a + 1), !ran ? "not needed" : ok ? "Completed" : "Failed", !ran ? "ghost" : ok ? "good" : "bad");
        if (a < 2 && a < fails) b += arrow(x + 132, 69, x + 148, 69);
      }
      const done = fails <= 2;
      b += box(80, 124, 320, 50, done ? "flow run: Completed" : "flow run: Failed", done ? "downstream tasks run" : "alert fires; downstream tasks don't run", done ? "good" : "bad");
      b += t(240, 204, "retry_delay_seconds=30 between attempts", { size: 12.5, fill: C.dim, mono: true });
      return svg(480, 220, b, "Prefect task retries and the resulting run state");
    },
    caption: "With retries=2, a task gets three attempts before Prefect marks it Failed.",
    ix: el => choice(el, { label: "fetch() fails this many times", options: ["0", "1", "2", "3"], value: 1 }, i => ({
      svg: P["lib-prefect"]._fig(i),
      note: i === 3 ? "Three failures in a row: the retries are used up, so the run fails and someone gets alerted." : i === 0 ? "No retry needed." : "A retry hides a brief outage. The run history still shows the failed attempt.",
    })),
    oneline: "Prefect turns Python functions into scheduled, logged pipeline steps that retry on failure.",
  };

  /* ---------------------------------------------------------------- lib-beam */
  const EVT = [3, 8, 14, 22, 27, 31, 44, 52, 58];
  P["lib-beam"] = {
    simple: [
      "**Apache Beam** lets you write one pipeline that works on a fixed file (batch) or on data that never stops arriving (streaming).",
      "Data flows as a **PCollection** through **transforms** like `Map`, `Filter` and `GroupByKey`. A **runner** executes it: locally for tests, or on Google Cloud **Dataflow**, Spark or Flink in production.",
      "For streams, **windows** cut endless data into finite groups, such as \"every 1 minute\", so you can count and sum it.",
    ],
    analogy: {
      text: "Think of a bus stop where passengers arrive all day.",
      left: "Bus stop", right: "Beam windowing",
      map: [
        ["Passengers arriving", "Events in a PCollection"],
        ["A bus every 10 minutes", "A fixed window of 10 minutes"],
        ["Counting heads on each bus", "An aggregation per window"],
        ["Someone running up after the doors close", "Late data, handled by the watermark and triggers"],
        ["The timetable works for any city", "The same pipeline on any runner"],
      ],
      breaks: "passengers are counted when they board. Beam groups by the time the event happened (event time), not when it reached the pipeline, so a delayed phone upload still lands in the right window.",
    },
    svg: () => P["lib-beam"]._fig(10),
    _fig: w => {
      const x0 = 30, u = 7;
      let b = t(240, 22, "beam.WindowInto(FixedWindows(" + w + "))  then count", { bold: true, size: 13, mono: true });
      b += line(x0, 80, x0 + 60 * u, 80);
      for (let s = 0; s <= 60; s += 10) b += t(x0 + s * u, 98, s + "s", { size: 11, fill: C.faint });
      const n = Math.ceil(60 / w), counts = [];
      for (let k = 0; k < n; k++) {
        const a = k * w, z = Math.min(60, a + w), c = EVT.filter(e => e >= a && e < z).length; counts.push(c);
        b += `<rect x="${x0 + a * u + 1}" y="40" width="${(z - a) * u - 2}" height="28" rx="5" style="fill:${k % 2 ? C.vio : C.acc};stroke:${k % 2 ? C.vioS : C.accS}"/>`;
        b += t(x0 + (a + z) / 2 * u, 59, "n=" + c, { size: 12, bold: true, fill: k % 2 ? C.vioT : C.accT, max: (z - a) * u - 6 });
      }
      EVT.forEach(e => { b += `<circle cx="${x0 + e * u}" cy="80" r="5" style="fill:${C.goodS}"/>`; });
      b += t(240, 128, "Events at " + EVT.join(", ") + " s (event time)", { size: 12, fill: C.dim });
      b += table(40, 146, ["window", "count"], counts.slice(0, 6).map((c, k) => ["[" + k * w + ", " + Math.min(60, (k + 1) * w) + ")", String(c)]), { cw: [200, 200], rh: 22, size: 12 });
      return svg(480, 146 + 22 * (Math.min(n, 6) + 1) + 14, b, "Fixed windows grouping events by event time");
    },
    caption: "Each event lands in the window that covers its event time; each window is counted separately.",
    ix: el => slider(el, { label: "Window size (seconds)", min: 10, max: 30, step: 10, value: 20 }, v => ({
      svg: P["lib-beam"]._fig(v),
      note: v === 10 ? "Smaller windows give fresher, smaller counts; more windows to compute." : v === 30 ? "Bigger windows smooth out spikes but report later." : "Same 9 events, different groupings: the window size is a business choice.",
    })),
    oneline: "Beam is one pipeline model for batch and streaming that runs on Dataflow, Spark or Flink.",
  };

  /* ---------------------------------------------------------------- lib-faker */
  P["lib-faker"] = {
    simple: [
      "Tests and demos need data, but copying real customer data to a laptop is a privacy risk. **Faker** makes realistic fake names, emails, addresses and dates.",
      "Create `fake = Faker('en_IN')` for Indian-style names and addresses, then call `fake.name()`, `fake.email()`, `fake.date_between('-1y', 'today')`.",
      "Call `Faker.seed(42)` to get the same fake data every run, so a test failure can be reproduced.",
    ],
    analogy: {
      text: "Think of a crash-test dummy in a car factory.",
      left: "Crash test", right: "Faker",
      map: [
        ["A dummy shaped like a real person", "Realistic fake records"],
        ["No real person gets hurt", "No real customer data exposed"],
        ["Dummies in many sizes", "Locales like `en_IN`, `en_US`"],
        ["Running the same crash twice", "`Faker.seed()` for repeatable data"],
      ],
      breaks: "a dummy matches real body sizes. Faker doesn't copy real data patterns: skewed cities, duplicate customers and dirty values only appear if you add them on purpose.",
    },
    svg: () => {
      let b = t(240, 22, "Faker.seed(42);  fake = Faker('en_IN')", { bold: true, size: 13, mono: true });
      b += box(20, 44, 130, 50, "seed 42", "same every run", "acc");
      b += arrow(152, 69, 176, 69);
      b += table(180, 40, ["name()", "city()", "date"], [["Ananya Rao", "Pune", "2026-03-09"], ["Kabir Shah", "Kochi", "2025-12-21"], ["Meera Iyer", "Surat", "2026-07-02"]], { cw: [110, 90, 90], rh: 28, size: 11.5 });
      b += t(325, 176, "example rows, not the real seed-42 output", { size: 11, fill: C.faint });
      b += box(20, 196, 440, 40, "Real customer table never leaves production", null, "good", { size: 13 });
      return svg(480, 250, b, "Seeded Faker producing a repeatable fake table");
    },
    caption: "A fixed seed gives the same fake rows every run, so tests are repeatable and privacy-safe.",
    oneline: "Faker makes realistic fake data, so you can test without touching real customers' details.",
  };

  /* ---------------------------------------------------------------- lib-openpyxl */
  P["lib-openpyxl"] = {
    simple: [
      "Business teams live in Excel, so pipelines often read and write `.xlsx` files.",
      "**openpyxl** reads, edits and writes `.xlsx` files: workbooks, sheets, cells, formulas and styles. **XlsxWriter** only writes, but formats and charts very well. `pandas.read_excel` and `to_excel` use them underneath.",
      "An Excel sheet holds at most 1,048,576 rows and 16,384 columns, so big extracts belong in CSV or Parquet.",
    ],
    analogy: {
      text: "Think of a binder of printed spreadsheets.",
      left: "Binder", right: "openpyxl",
      map: [
        ["The whole binder", "Workbook"],
        ["One tabbed page", "Worksheet"],
        ["One square on the page: B4", "Cell `ws['B4']`"],
        ["A note saying \"add up column C\"", "A formula string `=SUM(C2:C99)`"],
        ["Highlighter and bold pen", "Styles and number formats"],
      ],
      breaks: "a printed page shows the total. openpyxl stores the formula but does not calculate it; the number appears when Excel opens the file (or as a cached value Excel saved earlier).",
    },
    svg: () => {
      let b = t(240, 22, "wb['Sales']['C5'] = '=SUM(C2:C4)'", { bold: true, size: 13, mono: true });
      b += table(60, 40, ["", "A", "B", "C"], [["1", "month", "region", "revenue"], ["2", "Sep", "South", "410"], ["3", "Oct", "South", "455"], ["4", "Nov", "South", "502"], ["5", "", "total", "=SUM(C2:C4)"]], { cw: [40, 90, 100, 130], rh: 28, size: 12, hl: { 4: "warn" } });
      b += t(240, 232, "Stored as a formula; Excel computes 1367 when it opens.", { size: 12.5, fill: C.dim });
      b += box(60, 244, 360, 30, "Sheet limit: 1,048,576 rows x 16,384 columns", null, "ghost", { size: 12.5 });
      return svg(480, 288, b, "An openpyxl worksheet with a formula cell");
    },
    caption: "Cells are addressed like B4; formulas are saved as text and calculated by Excel.",
    oneline: "openpyxl and XlsxWriter let Python read and write Excel files for the people who live in them.",
  };

  /* ---------------------------------------------------------------- lib-matplotlib */
  P["lib-matplotlib"] = {
    simple: [
      "**matplotlib** is the base plotting library in Python. Most other chart libraries, like seaborn and pandas `.plot()`, draw with it.",
      "A **Figure** is the whole image. It holds one or more **Axes**, and each Axes is one chart with its own x-axis, y-axis and title.",
      "Make both explicitly, `fig, ax = plt.subplots()`, then call methods on `ax`: `ax.plot`, `ax.bar`, `ax.set_title`. Save with `fig.savefig('chart.png', dpi=150)`.",
    ],
    analogy: {
      text: "Think of a page in a scrapbook.",
      left: "Scrapbook page", right: "matplotlib",
      map: [
        ["The whole page", "Figure"],
        ["Each photo frame on the page", "An Axes"],
        ["Caption written under one photo", "`ax.set_title`, axis labels"],
        ["A 2 x 2 grid of frames", "`plt.subplots(2, 2)`"],
        ["Printing the page", "`fig.savefig`"],
      ],
      breaks: "a scrapbook page is done once glued. A Figure stays open in memory until closed; scripts that make thousands of charts must call `plt.close(fig)` or memory grows.",
    },
    svg: () => P["lib-matplotlib"]._fig(2),
    _fig: i => {
      const g = [[1, 1], [1, 2], [2, 2]][i], [r, c] = g;
      let b = t(240, 20, "fig, axes = plt.subplots(" + r + ", " + c + ")", { bold: true, size: 13, mono: true });
      b += `<rect x="20" y="32" width="440" height="222" rx="8" style="fill:none;stroke:${C.warnS};stroke-width:1.8"/>`;
      b += t(30, 48, "Figure", { a: "start", size: 12, fill: C.warnT, bold: true });
      const W = 400 / c, H = 180 / r;
      for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
        const bx = 40 + x * W, by = 58 + y * H;
        b += `<rect x="${bx + 4}" y="${by + 4}" width="${W - 8}" height="${H - 8}" rx="5" style="fill:${C.box};stroke:${C.accS};stroke-width:1.4"/>`;
        b += t(bx + W / 2, by + 22, r * c > 1 ? "axes[" + (r > 1 ? y + "," : "") + x + "]" : "ax", { size: 12, mono: true, fill: C.accT });
        const pts = [0, 1, 2, 3, 4].map(k => `${(bx + 14 + k * (W - 28) / 4).toFixed(1)},${(by + H - 16 - ((k * 7 + x * 3 + y * 5) % 5) * (H - 50) / 5).toFixed(1)}`).join(" ");
        b += `<polyline points="${pts}" style="fill:none;stroke:${C.goodS};stroke-width:2"/>`;
      }
      return svg(480, 266, b, "A Figure holding a grid of Axes");
    },
    caption: "One Figure, a grid of Axes: each Axes is a chart you draw on with ax.plot, ax.bar and so on.",
    ix: el => choice(el, { label: "Layout", options: ["1 x 1", "1 x 2", "2 x 2"], value: 0 }, i => ({
      svg: P["lib-matplotlib"]._fig(i),
      note: ["With one chart, <code>ax</code> is a single Axes object.", "With one row, <code>axes</code> is a 1-D array: <code>axes[0]</code>, <code>axes[1]</code>.", "With a grid, <code>axes</code> is a 2-D array: <code>axes[1, 0]</code> is bottom-left."][i],
    })),
    oneline: "A matplotlib Figure is the page, and each Axes on it is one chart you draw on.",
  };

  /* ---------------------------------------------------------------- lib-seaborn */
  P["lib-seaborn"] = {
    simple: [
      "**seaborn** draws statistical charts straight from a DataFrame. You name the columns; it groups, counts and colours for you.",
      "`sns.histplot(df, x='amount')` shows how values spread. `sns.boxplot(df, x='city', y='amount')` compares groups. `sns.heatmap(df.corr(numeric_only=True))` shows which columns move together.",
      "It returns matplotlib Axes, so you can still fix titles, labels and limits with matplotlib.",
    ],
    analogy: {
      text: "Think of a photo booth versus a manual camera.",
      left: "Photo booth", right: "seaborn",
      map: [
        ["Press one button, get a nice print", "One function call from a DataFrame"],
        ["Preset lighting and backgrounds", "Themes and colour palettes"],
        ["The booth still uses a camera inside", "Built on matplotlib"],
        ["Adjusting the print afterwards", "Tweaking the returned Axes"],
      ],
      breaks: "a booth photo is always fine. seaborn's summary charts can hide things: a box plot of 10 rows looks as confident as one of 10 million. Show counts or the raw points when samples are small.",
    },
    svg: () => {
      let b = t(240, 22, "sns.boxplot(df, x='city', y='amount')", { bold: true, size: 13, mono: true });
      b += line(60, 40, 60, 220); b += line(60, 220, 460, 220);
      b += t(30, 130, "amount", { size: 11.5, fill: C.dim });
      [["Pune", 150, 120, 170, 90, 200], ["Goa", 270, 80, 140, 50, 180], ["Delhi", 390, 100, 160, 70, 196]].forEach(([c, x, q1, q3, lo, hi]) => {
        b += line(x, lo, x, q1); b += line(x, q3, x, hi);
        b += line(x - 14, lo, x + 14, lo); b += line(x - 14, hi, x + 14, hi);
        b += `<rect x="${x - 34}" y="${q1}" width="68" height="${q3 - q1}" style="fill:${C.acc};stroke:${C.accS};stroke-width:1.6"/>`;
        b += line(x - 34, (q1 + q3) / 2, x + 34, (q1 + q3) / 2, { stroke: C.warnS, sw: 2.4 });
        b += t(x, 238, c, { size: 12.5 });
      });
      b += t(330, 60, "box = middle 50%", { a: "start", size: 11.5, fill: C.accT });
      b += t(330, 76, "line = median", { a: "start", size: 11.5, fill: C.warnT });
      return svg(480, 252, b, "A seaborn box plot comparing three groups");
    },
    caption: "Each box shows the middle half of one city's amounts; the line inside is the median.",
    oneline: "seaborn turns a DataFrame into statistical charts in one line, on top of matplotlib.",
  };

  /* ---------------------------------------------------------------- python-interview-prep */
  P["python-interview-prep"] = {
    simple: [
      "This page gathers the whole Python track into one place to revise before an interview.",
      "Data engineering interviews test three things in Python: the core language (types, collections, functions, errors), working with data at scale (generators, files, APIs, databases), and engineering habits (tests, logging, packaging, concurrency).",
      "Interviewers care less about memorised syntax and more about why: why a set, why a generator, why processes instead of threads.",
    ],
    analogy: {
      text: "Think of packing a school bag the night before an exam.",
      left: "Exam bag", right: "Interview prep",
      map: [
        ["The textbook chapters", "Earlier lessons in this track"],
        ["One summary sheet per subject", "The cheat sheet below"],
        ["Practising past papers", "The mock interview questions"],
        ["Knowing why an answer is right", "Explaining trade-offs out loud"],
      ],
      breaks: "an exam has fixed questions. Interviews follow your answers, so each \"why\" can lead to a deeper one. Practise saying the trade-off, not just the fact.",
    },
    svg: () => {
      let b = t(240, 22, "What a Python DE interview checks", { bold: true, size: 14 });
      const cols = [["Core language", "acc", ["types, truthiness", "list / dict / set", "functions, scope", "errors"]], ["Data at scale", "vio", ["generators", "files, JSON, CSV", "APIs, paging", "DB batching"]], ["Engineering", "good", ["pytest", "logging, config", "venv, packaging", "threads vs processes"]]];
      cols.forEach(([h, k, items], i) => {
        const x = 16 + i * 154;
        b += box(x, 40, 142, 36, h, null, k, { size: 13.5 });
        items.forEach((it, j) => { b += box(x, 86 + j * 40, 142, 32, it, null, "plain", { size: 12, bold: false }); });
      });
      b += t(240, 268, "Every answer: what it is, when to use it, what it costs.", { size: 12.5, fill: C.dim });
      return svg(480, 284, b, "Three areas a Python data engineering interview covers");
    },
    caption: "Revise by area, and for each topic be ready to say what, when and at what cost.",
    oneline: "Know the core language, how to handle data at scale, and the habits that keep pipelines healthy.",
  };
})();
