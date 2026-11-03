/* Datalith pass 2 — Track 1: Foundations of Data. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- found-what-is-de */
  P["found-what-is-de"] = {
    simple: [
      "Companies collect huge amounts of data: every order, click, payment and sensor reading. On its own it's scattered, messy and late.",
      "A **data engineer** builds the systems that collect that data, clean it, store it and deliver it on time, every day.",
      "Analysts and data scientists then use it to answer questions and train models. If they are the cooks, the data engineer builds and runs the kitchen.",
    ],
    analogy: {
      text: "Think of a city's water supply.",
      left: "Water supply", right: "Data engineering",
      map: [
        ["Rivers, wells and rain", "Sources: app databases, events, APIs, files"],
        ["Pipes and pumps", "Pipelines: ingestion and orchestration"],
        ["The treatment plant", "Transformation: cleaning and modeling"],
        ["Reservoirs and tanks", "Storage: warehouse or lakehouse"],
        ["Taps in every home", "Serving: dashboards, ML features, APIs"],
        ["Water testing", "Data quality checks and monitoring"],
      ],
      breaks: "water is all the same stuff. Data has meaning, owners and privacy rules, so data engineers also deal with definitions, access control and governance.",
    },
    svg: () => {
      const st = [["Sources", "apps · events · APIs", "plain"], ["Ingest", "batch or stream", "acc"], ["Store", "lake · warehouse", "acc"], ["Transform", "clean · model", "acc"], ["Serve", "BI · ML · apps", "good"]];
      let b = "";
      st.forEach(([a, s, k], i) => {
        const y = 14 + i * 56;
        b += box(40, y, 260, 44, a, s, k, { size: 14.5, size2: 12 });
        if (i < 4) b += arrow(170, y + 44, 170, y + 54);
      });
      b += box(320, 14, 140, 270, null, null, "warn", { dash: true });
      ["quality", "monitoring", "security", "cost", "governance"].forEach((s, i) => { b += t(390, 60 + i * 46, s, { size: 13, fill: C.warnT, bold: true }); });
      b += t(240, 308, "Data engineers build the left column and guard the right one.", { size: 12.5, fill: C.dim });
      return svg(480, 324, b, "The data engineer's platform from sources to serving, with cross-cutting concerns");
    },
    caption: "Data flows top to bottom. Quality, monitoring and security apply at every step.",
    oneline: "A data engineer builds the pipes and tanks that turn scattered raw data into clean, on-time data people can use.",
  };

  /* ---------------------------------------------------------------- found-data-types */
  P["found-data-types"] = {
    simple: [
      "Data comes in three shapes.",
      "**Structured** data fits neat rows and columns, like a bank's transaction table. **Semi-structured** data has labels but a flexible shape, like JSON from an app or a line in a log file.",
      "**Unstructured** data has no table shape at all: emails, PDFs, photos, audio. Each shape is stored and processed differently.",
    ],
    analogy: {
      text: "Think of three ways a school keeps information.",
      left: "At school", right: "Data shape",
      map: [
        ["The marks register: fixed columns for every pupil", "Structured (tables, CSV)"],
        ["Pupils' profile forms: some fill extra boxes, some don't", "Semi-structured (JSON, XML, logs)"],
        ["Essays, drawings and recordings of the school play", "Unstructured (text, images, audio)"],
      ],
      breaks: "the boundaries blur. A JSON field can hold a whole essay, and modern tools can pull structured facts (names, dates) out of unstructured text.",
    },
    svg: () => {
      let b = t(80, 24, "Structured", { bold: true, size: 14 }) + t(240, 24, "Semi-structured", { bold: true, size: 14 }) + t(400, 24, "Unstructured", { bold: true, size: 14 });
      b += table(14, 40, ["id", "amt"], [["1", "40"], ["2", "15"], ["3", "60"]], { cw: [60, 72], rh: 28 });
      b += box(166, 40, 148, 112, null, null, "plain");
      ["{ \"id\": 1,", "  \"tags\": [\"new\"],", "  \"user\": {", "    \"city\": \"Pune\" } }"].forEach((s, i) => { b += t(176, 64 + i * 22, s, { a: "start", size: 11.5, mono: true, fill: C.tx }); });
      b += box(330, 40, 140, 112, null, null, "plain");
      b += `<rect x="346" y="56" width="50" height="40" rx="4" style="fill:#2b3446;stroke:${C.boxS}"/><polyline points="348,94 364,74 378,86 394,66" style="fill:none;stroke:${C.goodS};stroke-width:2"/>`;
      b += `<path d="M410 60 q8 -10 16 0 t16 0 t16 0" style="fill:none;stroke:${C.accS};stroke-width:2"/>`;
      b += t(400, 126, "photo · audio · text", { size: 11.5, fill: C.dim });
      b += t(80, 180, "fixed schema", { size: 12.5, fill: C.goodT, bold: true }) + t(80, 198, "query with SQL", { size: 12, fill: C.dim });
      b += t(240, 180, "flexible schema", { size: 12.5, fill: C.warnT, bold: true }) + t(240, 198, "parse, then query", { size: 12, fill: C.dim });
      b += t(400, 180, "no schema", { size: 12.5, fill: C.badT, bold: true }) + t(400, 198, "store files, extract meaning", { size: 12, fill: C.dim });
      return svg(480, 214, b, "Structured, semi-structured and unstructured data compared");
    },
    caption: "From a fixed table, to labelled but flexible JSON, to files with no table shape at all.",
    oneline: "Data is either a neat table, a flexible labelled document, or a free-form file like a photo.",
  };

  /* ---------------------------------------------------------------- found-files-formats */
  P["found-files-formats"] = {
    simple: [
      "The file format you choose changes how fast and cheap your data is to use.",
      "**CSV** (comma-separated values) and **JSON** store data **row by row**, as plain text. They are easy to read and share, but large and slow to scan.",
      "**Parquet** stores data **column by column**, compressed, with types. A query that needs 3 columns out of 50 reads only those 3, which is why analytics tools love it.",
    ],
    analogy: {
      text: "Think of a box of student report cards versus a register with one page per subject.",
      left: "Report cards", right: "File formats",
      map: [
        ["Each card holds all of one pupil's marks", "Row format: CSV, JSON"],
        ["\"Average maths mark\" means opening every card", "A row-format scan reads every column"],
        ["One page per subject listing everyone's mark", "Columnar format: Parquet, ORC"],
        ["\"Average maths mark\" reads just the maths page", "Read only the needed columns"],
        ["A page of similar numbers squeezes into fewer lines", "Columns compress well"],
      ],
      breaks: "adding one new pupil is easy with cards and awkward with subject pages. Columnar files suit big reads, not frequent single-row updates.",
    },
    svg: () => {
      let b = t(120, 22, "Row layout (CSV)", { bold: true, size: 14 }) + t(360, 22, "Column layout (Parquet)", { bold: true, size: 14 });
      const R = [["1", "Ava", "IN", "40"], ["2", "Ben", "US", "15"], ["3", "Cai", "UK", "30"]];
      R.forEach((r, i) => { r.forEach((v, j) => { b += box(20 + j * 50, 38 + i * 36, 46, 30, v, null, j === 3 ? "warn" : "plain", { size: 12.5, bold: false, mono: true }); }); });
      const cols = [["id", "1 2 3"], ["name", "Ava Ben Cai"], ["cty", "IN US UK"], ["amt", "40 15 30"]];
      cols.forEach(([n, v], j) => { b += box(250, 38 + j * 34, 210, 28, n + ": " + v, null, j === 3 ? "good" : "plain", { size: 12, bold: false, mono: true }); });
      b += t(120, 168, "SUM(amt) reads every row,", { size: 12.5, fill: C.warnT }) + t(120, 186, "all columns", { size: 12.5, fill: C.warnT });
      b += t(360, 186, "SUM(amt) reads one column", { size: 12.5, fill: C.goodT });
      return svg(480, 206, b, "Row-oriented versus column-oriented file layout");
    },
    caption: "Same 3 rows. CSV stores them row after row; Parquet stores each column together.",
    ix: el => {
      slider(el, { label: "Columns your query uses (of 50):", min: 1, max: 50, value: 3 }, k => {
        const total = 1000, col = total * k / 50;
        let b = t(240, 22, "A 1 TB table with 50 equal-size columns (uncompressed)", { size: 12.5, fill: C.tx, bold: true });
        b += t(20, 58, "CSV", { a: "start", size: 13, fill: C.warnT, bold: true });
        b += `<rect x="90" y="44" width="360" height="22" rx="4" style="fill:${C.warn};stroke:${C.warnS}"/>`;
        b += t(270, 60, "1,000 GB scanned", { size: 12, fill: C.tx });
        b += t(20, 104, "Parquet", { a: "start", size: 13, fill: C.goodT, bold: true });
        b += `<rect x="90" y="90" width="${Math.max(3, 360 * k / 50).toFixed(1)}" height="22" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
        b += t(Math.min(96 + 360 * k / 50, 440), 128, col.toLocaleString("en-US") + " GB scanned", { a: k > 40 ? "end" : "start", size: 12, fill: C.tx });
        return { svg: svg(480, 144, b, "Data scanned by row versus columnar format"), note: `Parquet reads <b>${k} of 50</b> columns, about <b>${Math.round(100 * k / 50)}%</b> of the data. Compression usually shrinks it further. On pay-per-byte engines like BigQuery on-demand, that is also the bill.` };
      });
    },
    oneline: "Row files like CSV are easy to share, column files like Parquet let queries read only the columns they need.",
  };

  /* ---------------------------------------------------------------- found-bits-bytes */
  const CH = ["A", "é", "₹", "日", "😀"];
  P["found-bits-bytes"] = {
    simple: [
      "Computers store everything as **bits**: tiny on/off switches written as 1 or 0. Eight bits make a **byte**, which can hold one of 256 values.",
      "To store text, each character needs a number, and those numbers need bytes. A **character encoding** is the rulebook. **UTF-8**, today's standard, uses 1 byte for English letters and 2 to 4 bytes for others, like é, ₹ or emoji.",
      "If one program writes UTF-8 and another reads it with the wrong rulebook, you get garbled text like \"cafÃ©\" instead of \"café\".",
    ],
    analogy: {
      text: "Think of a secret code where friends swap letters for numbers.",
      left: "The secret code", right: "Encodings",
      map: [
        ["Each light bulb on or off", "A bit"],
        ["A row of 8 bulbs", "A byte (0-255)"],
        ["The codebook: A = 65", "A character set (Unicode code points)"],
        ["Rarer letters need more rows of bulbs", "UTF-8 uses 1-4 bytes per character"],
        ["Reading the message with the wrong codebook", "Mojibake: garbled characters"],
      ],
      breaks: "friends agree on a codebook in advance. Files rarely say which encoding they use, so pipelines must state it (and default to UTF-8) every time they read text.",
    },
    svg: () => {
      let b = t(240, 22, "\"café\" in UTF-8", { bold: true, size: 14 });
      const parts = [["c", ["63"]], ["a", ["61"]], ["f", ["66"]], ["é", ["C3", "A9"]]];
      let x = 40;
      parts.forEach(([c, bytes]) => {
        const w = bytes.length * 70 - 6;
        b += box(x, 36, w, 36, c, null, c === "é" ? "warn" : "acc", { size: 16 });
        bytes.forEach((hx, j) => { b += box(x + j * 70, 92, 64, 32, hx, null, "plain", { mono: true, size: 13.5 }); });
        b += arrow(x + w / 2, 74, x + w / 2, 90);
        x += w + 16;
      });
      b += t(240, 152, "4 characters → 5 bytes", { size: 13, fill: C.tx });
      b += box(40, 172, 180, 40, "read as UTF-8", "café", "good", { size: 13, size2: 14 });
      b += box(260, 172, 180, 40, "read as Latin-1", "cafÃ©", "bad", { size: 13, size2: 14 });
      return svg(480, 228, b, "The word café encoded as UTF-8 bytes and misread as Latin-1");
    },
    caption: "é takes 2 bytes in UTF-8. A reader that assumes 1 byte per character shows two wrong symbols.",
    ix: el => {
      choice(el, { label: "Character:", options: CH, value: 1 }, i => {
        const ch = CH[i], bytes = [...new TextEncoder().encode(ch)];
        const hex = bytes.map(v => v.toString(16).toUpperCase().padStart(2, "0"));
        const cp = "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
        let wrong = "";
        try { wrong = new TextDecoder("windows-1252").decode(new Uint8Array(bytes)); } catch { wrong = "?"; }
        let b = t(240, 26, `${ch}  is code point ${cp}`, { size: 15, fill: C.tx, bold: true });
        hex.forEach((h, j) => {
          const x = 240 - hex.length * 46 + j * 92;
          b += box(x, 44, 84, 36, h, null, "acc", { mono: true, size: 15 });
          b += t(x + 42, 98, bytes[j].toString(2).padStart(8, "0"), { mono: true, size: 11.5, fill: C.dim });
        });
        b += box(60, 116, 360, 38, "misread as Windows-1252: " + wrong, null, bytes.length > 1 ? "bad" : "good", { size: 13.5 });
        return { svg: svg(480, 170, b, "UTF-8 bytes for " + ch), note: `<b>${bytes.length} byte${bytes.length > 1 ? "s" : ""}</b> in UTF-8 (computed live by your browser's TextEncoder). ${bytes.length > 1 ? "A reader using the wrong encoding shows the garbage in red." : "Plain English letters are 1 byte and look the same in most encodings."}` };
      });
    },
    oneline: "Everything is stored as bytes, and an encoding like UTF-8 is the rulebook that turns bytes back into letters.",
  };

  /* ---------------------------------------------------------------- found-oltp-olap */
  P["found-oltp-olap"] = {
    simple: [
      "Databases do two very different jobs.",
      "**OLTP** (Online Transaction Processing) runs the business: \"place this order\", \"update my address\". Thousands of tiny reads and writes a second, each touching a few rows, each needing an instant answer.",
      "**OLAP** (Online Analytical Processing) helps understand the business: \"revenue by region for 3 years\". Few queries, each scanning millions of rows. Data engineers copy data from OLTP systems into OLAP systems.",
    ],
    analogy: {
      text: "Think of a supermarket's checkout tills versus the head office.",
      left: "The supermarket", right: "Database job",
      map: [
        ["Tills scanning one basket at a time, all day", "OLTP: many small transactions"],
        ["\"Is this item in stock right now?\"", "Point lookup by key, milliseconds"],
        ["Head office studying a year of sales", "OLAP: big scans and aggregates"],
        ["The nightly sales file sent to head office", "ETL/ELT from OLTP to the warehouse"],
      ],
      breaks: "head office never slows the tills. If you run big analytics queries on the production OLTP database, you really can slow checkout, which is why the data is copied out.",
    },
    svg: () => {
      let b = t(120, 22, "OLTP: run the business", { bold: true, size: 14 }) + t(360, 22, "OLAP: understand it", { bold: true, size: 14 });
      for (let i = 0; i < 5; i++) b += box(30 + (i % 2) * 90, 36 + i * 26, 84, 22, "1 row", null, "acc", { size: 11.5 });
      b += t(120, 186, "many tiny reads/writes", { size: 12.5, fill: C.dim });
      b += t(120, 204, "row store, indexes, ms", { size: 12.5, fill: C.dim });
      b += box(260, 40, 200, 120, null, null, "good");
      for (let r = 0; r < 6; r++) b += line(270, 52 + r * 18, 450, 52 + r * 18, { stroke: C.goodS, sw: 1 });
      b += t(360, 186, "few huge scans", { size: 12.5, fill: C.dim });
      b += t(360, 204, "column store, seconds", { size: 12.5, fill: C.dim });
      b += arrow(216, 100, 256, 100, { label: "ETL", stroke: C.warnS, lfill: C.warnT });
      return svg(480, 220, b, "OLTP handles many small transactions; OLAP runs large analytical scans");
    },
    caption: "Left: thousands of small, fast transactions. Right: a few big scans over everything.",
    oneline: "OLTP databases run the business one small transaction at a time, OLAP systems study all of it at once.",
  };

  /* ---------------------------------------------------------------- found-data-lifecycle */
  P["found-data-lifecycle"] = {
    simple: [
      "Data goes on a journey from where it's created to where it's useful.",
      "It's **generated** by apps and devices, **ingested** into the platform, **stored**, **transformed** into clean tables, **served** to tools, and finally **analyzed** to make decisions.",
      "Every tool and track in this course fits one of these stages, so this map tells you where you are.",
    ],
    analogy: {
      text: "Think of bread, from field to table.",
      left: "Bread", right: "Data lifecycle",
      map: [
        ["Wheat grows in fields", "Generation: apps, sensors, logs"],
        ["Harvest and lorry to the mill", "Ingestion: batch loads, streams"],
        ["The grain silo", "Storage: lake, warehouse"],
        ["Milling and baking", "Transformation: clean, join, model"],
        ["Shops shelve the loaves", "Serving: marts, APIs, features"],
        ["Families eat and decide what to buy next week", "Analysis and decisions"],
      ],
      breaks: "bread goes one way. Data loops back: insights change the apps, which generate new data, and errors found late must flow back to be fixed at the source.",
    },
    svg: () => {
      const S = ["Generate", "Ingest", "Store", "Transform", "Serve", "Analyze"];
      let b = "";
      const cx = 240, cy = 150, R = 110;
      S.forEach((s, i) => {
        const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
        b += box(x - 54, y - 18, 108, 36, s, null, i === 5 ? "good" : "acc", { size: 13.5 });
        const a2 = a + Math.PI / 3, x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
        const sx = x + (x2 - x) * 0.32, sy = y + (y2 - y) * 0.32, ex = x + (x2 - x) * 0.68, ey = y + (y2 - y) * 0.68;
        b += arrow(sx, sy, ex, ey, { stroke: i === 5 ? C.warnS : C.line, dash: i === 5 });
      });
      b += t(240, 146, "quality · security ·", { size: 12, fill: C.warnT, bold: true });
      b += t(240, 164, "orchestration throughout", { size: 12, fill: C.warnT, bold: true });
      return svg(480, 300, b, "The data lifecycle as a loop of six stages");
    },
    caption: "Six stages in a loop: what you learn from analysis feeds back into the systems that generate data.",
    oneline: "Data is born in apps, moved, stored, cleaned, served and finally used to make decisions.",
  };

  /* ---------------------------------------------------------------- found-data-quality */
  P["found-data-quality"] = {
    simple: [
      "Bad data gives wrong answers that look right. That's worse than no answer.",
      "Data quality is usually checked along six **dimensions**: is it **accurate** (true), **complete** (nothing missing), **consistent** (same across systems), **timely** (fresh enough), **valid** (right format and range), and **unique** (no duplicates)?",
      "Each automated check you write tests one of these six.",
    ],
    analogy: {
      text: "Think of a class register the teacher must hand to the head.",
      left: "The register", right: "Quality dimension",
      map: [
        ["Every name spelled right, marks correct", "Accuracy"],
        ["No pupil left off the list", "Completeness"],
        ["Same pupils as in the office's list", "Consistency"],
        ["Handed in today, not next month", "Timeliness"],
        ["Marks between 0 and 100, dates real dates", "Validity"],
        ["No pupil written twice", "Uniqueness"],
      ],
      breaks: "a teacher can eyeball 30 names. Pipelines move millions of rows a day, so quality must be checked by code on every run, with alerts when a check fails.",
    },
    svg: () => {
      const D = [["Accurate", "values are true"], ["Complete", "no missing rows/fields"], ["Consistent", "systems agree"], ["Timely", "fresh enough"], ["Valid", "format & range ok"], ["Unique", "no duplicates"]];
      let b = t(240, 22, "Six questions to ask of every table", { bold: true, size: 14 });
      D.forEach(([n, s], i) => {
        const x = 16 + (i % 2) * 230, y = 38 + Math.floor(i / 2) * 64;
        b += box(x, y, 218, 52, n, s, ["acc", "good", "vio", "warn", "acc", "good"][i], { size: 14.5, size2: 12 });
      });
      b += t(240, 254, "Example check: \"order_id is unique\" tests Uniqueness.", { size: 12.5, fill: C.dim });
      return svg(480, 270, b, "The six dimensions of data quality");
    },
    caption: "Every data test you write checks one of these six things.",
    oneline: "Good data is true, complete, consistent, fresh, valid and free of duplicates, and code checks it on every run.",
  };

  /* ---------------------------------------------------------------- found-compression */
  const CODECS = {
    "gzip": { ratio: 0.85, speed: 0.3, split: "No (whole .gz file)", note: "Small files, slow to write. A big .csv.gz can't be split, so one worker reads it alone." },
    "Snappy": { ratio: 0.55, speed: 0.95, split: "Inside Parquet: yes", note: "Very fast, lighter compression. Long the default for Parquet in Spark." },
    "LZ4": { ratio: 0.55, speed: 1.0, split: "Inside Parquet: yes", note: "Among the fastest. Common for Kafka messages and caches." },
    "Zstd": { ratio: 0.9, speed: 0.75, split: "Inside Parquet: yes", note: "Tunable levels: near-gzip ratio at much higher speed. A popular modern default." },
  };
  P["found-compression"] = {
    simple: [
      "Data is big, and storing or moving it costs money and time. **Compression** finds repeated patterns and writes them more briefly, so files get smaller.",
      "Every method (a **codec**) trades **size** against **speed**. gzip squeezes hard but slowly; Snappy and LZ4 are very fast but squeeze less; Zstd sits in between and is tunable.",
      "Columnar files compress especially well, because one column holds similar values side by side.",
    ],
    analogy: {
      text: "Think of packing clothes for a trip.",
      left: "Packing", right: "Compression",
      map: [
        ["Rolling every item tightly takes ages but fits more", "High ratio, slow (gzip)"],
        ["Throwing things in quickly", "Fast, lower ratio (Snappy, LZ4)"],
        ["A vacuum bag with an adjustable pump", "Zstd: choose the level"],
        ["Socks packed together squash better than mixed items", "Similar values in a column compress well"],
        ["One giant sealed bag only one person can unpack", "A non-splittable file (one big .gz)"],
      ],
      breaks: "packing is done once per trip. Data is read many times, so read speed (decompression) often matters more than how long it took to pack.",
    },
    svg: () => {
      let b = t(240, 22, "Why columns compress well", { bold: true, size: 14 });
      b += box(20, 40, 440, 36, "country: IN IN IN IN IN UK UK UK US US", null, "plain", { mono: true, size: 13 });
      b += arrow(240, 78, 240, 104, { label: "run-length + dictionary encoding", dx: 0, dy: -4 });
      b += box(20, 108, 440, 36, "IN ×5 · UK ×3 · US ×2", null, "good", { mono: true, size: 14 });
      b += t(240, 172, "Then a codec (Snappy, Zstd, gzip) squeezes the encoded pages.", { size: 12.5, fill: C.dim });
      b += t(240, 192, "Parquet compresses page by page, so files stay splittable.", { size: 12.5, fill: C.dim });
      return svg(480, 208, b, "Run-length encoding of a repetitive column before codec compression");
    },
    caption: "Ten values become three runs. Columnar formats get much of their compression from this step.",
    ix: el => {
      const names = Object.keys(CODECS);
      choice(el, { label: "Codec:", options: names, value: 3 }, i => {
        const c = CODECS[names[i]];
        let b = t(240, 22, names[i], { bold: true, size: 15 });
        b += t(20, 58, "Size saved", { a: "start", size: 12.5, fill: C.tx });
        b += `<rect x="130" y="44" width="${(c.ratio * 320).toFixed(0)}" height="20" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
        b += t(20, 96, "Speed", { a: "start", size: 12.5, fill: C.tx });
        b += `<rect x="130" y="82" width="${(c.speed * 320).toFixed(0)}" height="20" rx="4" style="fill:${C.acc};stroke:${C.accS}"/>`;
        b += t(240, 130, "Splittable: " + c.split, { size: 12.5, fill: C.tx });
        b += t(240, 152, "Bars show the usual ranking, not a benchmark: real results depend on the data.", { size: 11, fill: C.faint });
        return { svg: svg(480, 166, b, names[i] + " trade-off"), note: c.note };
      });
    },
    oneline: "Compression makes data smaller by writing repeats briefly, and each codec trades size against speed.",
  };

  /* ---------------------------------------------------------------- found-serialization */
  P["found-serialization"] = {
    simple: [
      "Programs hold data in memory as objects. To save it to a file or send it over a network, it must become a flat stream of bytes. That's **serialization**; turning it back is **deserialization**.",
      "**JSON** is text: easy to read, but large and with no enforced types. **Avro** and **Protobuf** are binary: small and fast, and they use a **schema** that says exactly which fields and types exist.",
      "Schemas make change safe: you can add a field without breaking older readers, if you follow the rules.",
    ],
    analogy: {
      text: "Think of sending a toy model to a friend by post.",
      left: "Posting a model", right: "Serialization",
      map: [
        ["Taking the model apart into a flat box", "Serialize: object → bytes"],
        ["Your friend rebuilding it", "Deserialize: bytes → object"],
        ["Writing \"red wheel goes here\" on every piece", "JSON: field names repeated in every record"],
        ["Numbered pieces plus one instruction sheet", "Avro/Protobuf: compact data + a schema"],
        ["A newer kit with an extra piece", "Schema evolution: add optional fields safely"],
      ],
      breaks: "a parcel goes to one friend. A stream of events is read by many services for years, so schemas are usually stored in a registry and checked for compatibility on every change.",
    },
    svg: () => {
      let b = box(20, 20, 140, 54, "Order object", "in memory", "plain", { size: 14, size2: 12 });
      b += arrow(162, 47, 200, 47, { label: "serialize", dy: -8 });
      b += box(204, 14, 256, 30, "JSON (text): {\"id\":7,\"amt\":40.5}", null, "warn", { mono: true, size: 11 });
      b += box(204, 52, 256, 30, "Avro: 0E 00 00 00 00 00 40 44 40", null, "good", { mono: true, size: 11 });
      b += t(332, 102, "19 bytes vs 9 bytes for this record", { size: 11.5, fill: C.dim });
      b += box(204, 118, 256, 44, "schema: id int, amt double", "kept once in a registry, not in each record", "acc", { mono: true, size: 12.5, size2: 11 });
      b += arrow(332, 164, 332, 192);
      b += box(204, 194, 256, 40, "reader rebuilds the object", null, "plain", { size: 13 });
      return svg(480, 250, b, "An object serialized as JSON text and as Avro binary with a schema");
    },
    caption: "JSON repeats the field names in every record. Avro writes just the values and keeps the schema separately.",
    oneline: "Serialization flattens objects into bytes, and binary formats with schemas do it smaller and safer than JSON.",
  };

  /* ---------------------------------------------------------------- found-distributed-basics */
  P["found-distributed-basics"] = {
    simple: [
      "When data outgrows one computer, you spread it over many. That's a **distributed system**.",
      "Two ideas come up everywhere. **Partitioning** splits the data so each machine holds a piece. **Replication** keeps copies of each piece on several machines, so one failure loses nothing.",
      "The price: machines talk over a network that is slow and sometimes fails, so systems must decide what to do when copies disagree or a machine goes silent.",
    ],
    analogy: {
      text: "Think of a huge encyclopedia kept by a team of librarians.",
      left: "The librarians", right: "Distributed systems",
      map: [
        ["Volumes A-F with one librarian, G-M with another", "Partitioning (sharding)"],
        ["Each volume photocopied for a second librarian", "Replication (for example, 3 copies)"],
        ["A librarian is off sick; the copy-holder answers", "Fault tolerance and failover"],
        ["Two copies get different corrections", "Consistency: which version wins?"],
        ["Walking between rooms to compare notes", "The network: slow and unreliable"],
      ],
      breaks: "librarians can phone each other. Machines can't always tell a slow colleague from a dead one, which is the root of most hard problems in distributed systems.",
    },
    svg: () => {
      let b = t(240, 22, "4 partitions, each replicated 3 times across 4 nodes", { bold: true, size: 13.5 });
      const k = ["acc", "good", "vio", "warn"];
      for (let n = 0; n < 4; n++) {
        const x = 16 + n * 116;
        b += box(x, 40, 104, 150, null, null, "ghost");
        b += t(x + 52, 60, "node " + (n + 1), { size: 13, bold: true, fill: C.dim });
        for (let r = 0; r < 3; r++) {
          const p = (n + r) % 4;
          b += box(x + 10, 72 + r * 38, 84, 30, "P" + (p + 1) + (r === 0 ? " lead" : " copy"), null, r === 0 ? k[p] : "plain", { size: 12 });
        }
      }
      b += box(16, 204, 104, 26, "node 1 fails", null, "bad", { size: 12 });
      b += t(300, 222, "P1 still has copies on nodes 3 and 4.", { size: 12, fill: C.dim });
      b += t(240, 250, "Every partition has 3 copies on different nodes, so one failure loses nothing.", { size: 12, fill: C.tx });
      return svg(480, 266, b, "Partitions replicated across nodes in a cluster");
    },
    caption: "Each colour is one partition. Its lead and two copies sit on different machines.",
    oneline: "Distributed systems split data across machines and keep copies, so they grow bigger and survive failures.",
  };

  /* ---------------------------------------------------------------- found-interview-prep */
  P["found-interview-prep"] = {
    simple: [
      "This page reviews the whole Foundations track before an interview.",
      "Foundations questions test whether you understand **why** things are built the way they are: why Parquet beats CSV for analytics, why OLTP and OLAP are separate, why UTF-8 breaks, why data is replicated.",
      "Answer with the mechanism first, then the trade-off, then a real example at scale.",
    ],
    analogy: {
      text: "Think of the basic drills a footballer does before any match.",
      left: "Football basics", right: "Foundations interview",
      map: [
        ["Passing", "Row vs columnar formats"],
        ["Positioning", "OLTP vs OLAP"],
        ["Ball control", "Encodings, compression, serialization"],
        ["Teamwork", "Distributed systems: partitions, replicas"],
        ["Fitness", "Data quality on every run"],
      ],
      breaks: "drills are the same for everyone. Interviewers add a twist (\"now it's 50 TB a day\"), so practise saying how each answer changes with scale.",
    },
    svg: () => {
      const Q = [["Why Parquet for analytics?", "reads needed columns; compresses"], ["Why copy OLTP to OLAP?", "big scans would slow the app"], ["Why is text garbled?", "bytes read with the wrong encoding"], ["Why replicate?", "survive node failure; scale reads"], ["What is good data?", "passes the six quality checks"]];
      let b = t(240, 22, "Mechanism first, then the trade-off", { bold: true, size: 14 });
      Q.forEach(([q, a], i) => {
        const y = 38 + i * 50;
        b += box(16, y, 180, 40, q, null, "acc", { size: 12 });
        b += arrow(198, y + 20, 214, y + 20);
        b += box(218, y, 246, 40, a, null, "plain", { size: 11, bold: false });
      });
      return svg(480, 294, b, "Common foundations interview questions with short answers");
    },
    caption: "Five classic questions and the core of each answer.",
    oneline: "Foundations interviews test the why behind formats, databases, encodings and copies, so explain the mechanism first.",
  };
})();
