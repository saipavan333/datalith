/* Datalith pass 2 — Track 13: Lakehouse. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- lake-why */
  P["lake-why"] = {
    simple: [
      "A **data warehouse** (BigQuery, Snowflake) gives reliable tables, transactions and fast SQL, but stores data in its own format. A **data lake** keeps any files cheaply in object storage (GCS, S3), but plain files have no transactions, so a failed job can leave half-written data.",
      "Many companies ran both and copied data between them, paying twice and keeping two versions of the truth.",
      "A **lakehouse** adds a table format (Delta Lake, Iceberg, Hudi) on top of lake files. You get warehouse features (ACID transactions, schema checks, time travel) on cheap open storage that many engines can read.",
    ],
    analogy: {
      text: "Think of a big storeroom and a tidy shop.",
      left: "Storage", right: "Data platform",
      map: [
        ["A huge cheap storeroom, boxes anywhere", "Data lake"],
        ["A tidy shop with a till and stock records", "Data warehouse"],
        ["Carrying stock between them every night", "Copy pipelines between lake and warehouse"],
        ["Putting a stock ledger and shelves in the storeroom", "Lakehouse: table format on lake storage"],
      ],
      breaks: "a ledger in a storeroom is just paper. A table format only gives warehouse guarantees if every engine writes through it; a tool that writes raw files into the folder can corrupt the table.",
    },
    svg: () => {
      let b = t(240, 22, "Lake + warehouse  ->  lakehouse", { bold: true, size: 14 });
      b += box(16, 44, 140, 60, "data lake", "cheap, open, no ACID", "plain", { size2: 11 });
      b += box(16, 120, 140, 60, "warehouse", "ACID, fast, closed", "plain", { size2: 11 });
      b += arrow(86, 106, 86, 118, { label: "copy", dx: 22, dy: 6 });
      b += arrow(160, 112, 200, 112);
      b += box(204, 40, 260, 144, null, null, "acc");
      b += t(334, 62, "lakehouse", { bold: true, size: 14, fill: C.accT });
      b += box(220, 74, 228, 30, "engines: Spark, Trino, BigQuery", null, "plain", { size: 11.5 });
      b += box(220, 110, 228, 30, "table format: log, schema, versions", null, "vio", { size: 11.5 });
      b += box(220, 146, 228, 30, "Parquet on object storage", null, "good", { size: 11.5 });
      b += t(240, 212, "One copy of the data, warehouse guarantees, lake prices.", { size: 12, fill: C.dim });
      return svg(480, 228, b, "Lakehouse combining lake storage with warehouse features");
    },
    caption: "The lakehouse removes the copy step by giving lake files warehouse-style tables.",
    oneline: "A lakehouse gives cheap lake storage the reliable tables of a warehouse, so you keep one copy of data.",
  };

  /* ---------------------------------------------------------------- lake-time-travel */
  const VERS = [["v0", "CREATE + INSERT 3 rows", [["1", "Pune", "100"], ["2", "Goa", "80"], ["3", "Delhi", "120"]]], ["v1", "UPDATE id=2 amt=95", [["1", "Pune", "100"], ["2", "Goa", "95"], ["3", "Delhi", "120"]]], ["v2", "MERGE: insert id=4", [["1", "Pune", "100"], ["2", "Goa", "95"], ["3", "Delhi", "120"], ["4", "Surat", "60"]]], ["v3", "DELETE id=1 (bad row)", [["2", "Goa", "95"], ["3", "Delhi", "120"], ["4", "Surat", "60"]]]];
  P["lake-time-travel"] = {
    simple: [
      "Each change to a lakehouse table is a numbered **commit** in its transaction log. The old files aren't overwritten; the log just records which files make up each version.",
      "That gives **time travel**: `SELECT * FROM orders VERSION AS OF 2` (or `TIMESTAMP AS OF '2026-11-03'`) reads the table as it was. You can audit changes, reproduce last week's report, or roll back a bad load.",
      "**MERGE** does inserts, updates and deletes in one atomic commit: match source rows to target rows on a key, update the matches, insert the rest.",
    ],
    analogy: {
      text: "Think of a document's version history.",
      left: "Shared document", right: "Lakehouse table",
      map: [
        ["Each save gets a version number", "Each commit is a table version"],
        ["\"See version from yesterday\"", "`VERSION AS OF` / `TIMESTAMP AS OF`"],
        ["\"Restore this version\"", "`RESTORE TABLE ... TO VERSION AS OF`"],
        ["Accept a batch of suggested edits at once", "MERGE as one commit"],
      ],
      breaks: "a document keeps all versions forever. A table keeps old files only until `VACUUM` (or snapshot expiry) deletes them; after that, older versions can't be read.",
    },
    svg: () => P["lake-time-travel"]._fig(3),
    _fig: v => {
      let b = t(240, 20, "SELECT * FROM orders VERSION AS OF " + v, { bold: true, size: 13.5, mono: true });
      VERS.forEach(([n, op], i) => { b += box(16, 36 + i * 46, 170, 38, n + ": " + op, null, i === v ? "acc" : i < v ? "plain" : "ghost", { size: 10, mono: true }); });
      b += arrow(188, 55 + v * 46, 214, 100);
      b += table(220, 46, ["id", "city", "amt"], VERS[v][2], { cw: [60, 110, 70], rh: 28, size: 12.5 });
      return svg(480, 228, b, "Reading a table at an earlier version");
    },
    caption: "Each commit is a version; any version still in the log can be read or restored.",
    ix: el => slider(el, { label: "Version", min: 0, max: 3, value: 1, fmt: v => "v" + v }, v => ({ svg: P["lake-time-travel"]._fig(v), note: v === 3 ? "Deleted id 1 by mistake? <code>RESTORE TABLE orders TO VERSION AS OF 2</code> brings it back." : "Older versions are still readable because their files haven't been vacuumed." })),
    oneline: "A lakehouse table keeps numbered versions, so you can read, compare or restore the past.",
  };

  /* ---------------------------------------------------------------- lake-table-formats */
  P["lake-table-formats"] = {
    simple: [
      "A folder of Parquet files isn't a table: there's no way to add files atomically, and two writers can clash. A **table format** adds a metadata layer that lists exactly which files belong to each version of the table.",
      "Writers add new files, then **commit** by atomically adding an entry to the log. Readers read the log first, so they always see a complete version, never a half-written one.",
      "The three open formats are **Delta Lake** (from Databricks), **Apache Iceberg** (from Netflix) and **Apache Hudi** (from Uber). All store data in Parquet.",
    ],
    analogy: {
      text: "Think of a photo album with an index page.",
      left: "Photo album", right: "Table format",
      map: [
        ["Loose photos in a shoebox", "Parquet files in a folder"],
        ["The index page listing which photos are in the album", "Metadata / transaction log"],
        ["Adding a page of photos and updating the index in one go", "Atomic commit"],
        ["Old index pages kept at the back", "Older table versions"],
      ],
      breaks: "an index page is easy to update twice at once by accident. Table formats need an atomic \"swap the pointer\" step; on object stores this comes from a catalog or the store's conditional writes, which is why the catalog matters.",
    },
    svg: () => {
      let b = t(240, 22, "A table = metadata that lists files", { bold: true, size: 14 });
      b += box(16, 44, 200, 120, null, null, "vio");
      b += t(116, 64, "transaction log", { bold: true, size: 13, fill: C.vioT });
      ["000.json  add f1, f2", "001.json  add f3", "002.json  remove f1, add f4"].forEach((l, i) => { b += t(28, 88 + i * 24, l, { a: "start", size: 11, mono: true }); });
      b += arrow(218, 104, 250, 104, { label: "v2 =" });
      ["f2", "f3", "f4"].forEach((f, i) => { b += box(256 + i * 70, 84, 60, 40, f, ".parquet", "good", { size: 12, mono: true, size2: 9.5 }); });
      b += box(256, 140, 60, 30, "f1", null, "ghost", { size: 11, mono: true, dash: true }); b += t(330, 160, "no longer in v2", { a: "start", size: 11, fill: C.faint });
      b += t(240, 210, "Readers see v2 = f2, f3, f4. Never half a commit.", { size: 12, fill: C.dim });
      return svg(480, 226, b, "Transaction log entries defining which Parquet files make up a version");
    },
    caption: "The log, not the folder listing, says which files are in the table at each version.",
    oneline: "A table format is a log that lists which data files make up each version of a table.",
  };

  /* ---------------------------------------------------------------- lake-schema-evolution */
  const SCH = [["write row with an extra column", "rejected by enforcement (or added with mergeSchema)", "warn"], ["ADD COLUMN discount", "safe: old rows read as NULL", "good"], ["widen int -> bigint", "safe in most formats", "good"], ["rename column", "Iceberg: safe (column IDs); Delta: needs column mapping", "warn"], ["change string -> int", "not allowed in place: rewrite the table", "bad"]];
  P["lake-schema-evolution"] = {
    simple: [
      "**Schema enforcement** checks every write against the table's schema. A write with unexpected columns or wrong types is rejected, so bad data can't sneak in.",
      "**Schema evolution** changes the schema on purpose: add a column, widen a type, sometimes rename or drop a column. Old files are not rewritten; readers fill in NULL for columns that didn't exist yet.",
      "Iceberg tracks columns by ID, so renames are safe. Delta needs **column mapping** turned on to rename or drop columns.",
    ],
    analogy: {
      text: "Think of a printed school register.",
      left: "Register", right: "Schema",
      map: [
        ["Refusing a page with an extra unknown column scribbled in", "Enforcement"],
        ["Adding a new \"email\" column from today", "ADD COLUMN"],
        ["Old pages just have that column blank", "NULL for older rows"],
        ["Changing \"marks\" from numbers to letter grades", "Incompatible type change"],
      ],
      breaks: "an old page can be rewritten by hand. In a table, changing a column's type in place would leave old files unreadable, so incompatible changes mean rewriting the data or adding a new column.",
    },
    svg: () => P["lake-schema-evolution"]._fig(1),
    _fig: i => {
      const [op, res, k] = SCH[i];
      let b = t(240, 20, "orders schema change: " + op, { bold: true, size: 13 });
      b += table(16, 38, ["id", "city", "amt"], [["1", "Pune", "100"], ["2", "Goa", "80"]], { cw: [50, 80, 70], rh: 28, size: 12, title: "" });
      b += t(116, 134, "existing files (not rewritten)", { size: 11, fill: C.dim });
      b += arrow(220, 80, 250, 80);
      const cols = i === 1 ? ["id", "city", "amt", "discount"] : ["id", "city", "amt"];
      const rows = i === 1 ? [["1", "Pune", "100", null], ["2", "Goa", "80", null], ["3", "Surat", "60", "5"]] : [["1", "Pune", "100"], ["2", "Goa", "80"]];
      b += table(256, 38, cols, rows, { cw: cols.map(c => c === "discount" ? 66 : c === "city" ? 60 : 44), rh: 28, size: 11.5 });
      b += box(16, 160, 448, 44, res, null, k, { size: 12, bold: false });
      return svg(480, 218, b, "Result of a schema change on a lakehouse table");
    },
    caption: "Adding a column changes only the metadata; old rows read the new column as NULL.",
    ix: el => choice(el, { label: "Change", options: ["extra column", "add column", "widen type", "rename", "retype"], value: 0 }, i => ({ svg: P["lake-schema-evolution"]._fig(i), note: ["Delta and Iceberg reject the write by default. Opt in with <code>mergeSchema</code> (Delta) when the new column is intended.", "A metadata-only change: no data files are touched.", "Old files keep int; readers widen them on the fly.", "Iceberg maps columns by ID, so old files still line up. Delta needs <code>delta.columnMapping.mode = 'name'</code> first.", "Add a new column with the new type, backfill it, then drop the old one."][i] })),
    oneline: "Enforcement blocks unexpected schema changes; evolution allows planned ones without rewriting old data.",
  };

  /* ---------------------------------------------------------------- lake-medallion */
  P["lake-medallion"] = {
    simple: [
      "The **medallion architecture** organises lakehouse tables into three layers by quality.",
      "**Bronze** holds raw data exactly as it arrived, append-only, so you can always reprocess. **Silver** holds cleaned, deduplicated, typed and conformed data. **Gold** holds business-ready tables: facts, dimensions and aggregates for dashboards and ML.",
      "Each layer is built from the one before it, so a bug in silver can be fixed and rebuilt from bronze.",
    ],
    analogy: {
      text: "Think of a water bottling plant.",
      left: "Bottling plant", right: "Medallion layer",
      map: [
        ["Water straight from the spring, in a tank", "Bronze: raw, as received"],
        ["Filtered and tested water", "Silver: cleaned and conformed"],
        ["Labelled bottles on the shop shelf", "Gold: ready for use"],
        ["Keeping the spring water so you can re-filter", "Reprocessing from bronze"],
      ],
      breaks: "a plant runs in strict order. Medallion is a naming habit, not a rule: some data goes straight from bronze to a gold report, and some teams need more layers, so don't force three hops when one does the job.",
    },
    svg: () => {
      let b = t(240, 22, "Bronze -> silver -> gold", { bold: true, size: 14 });
      b += box(16, 50, 130, 50, "sources", "apps, CDC, files", "plain", { size2: 11 });
      [["bronze", "raw, append-only", "warn", 50], ["silver", "clean, dedup, typed", "plain", 112], ["gold", "facts, marts, KPIs", "good", 174]].forEach(([n, s, k, y], i) => { b += box(180, y, 150, 50, n, s, k, { size2: 11 }); if (i < 2) b += arrow(255, y + 52, 255, y + 60); });
      b += arrow(148, 75, 176, 75);
      b += arrow(332, 199, 362, 199); b += box(366, 174, 98, 50, "BI, ML", null, "acc");
      b += line(178, 146, 160, 146, { dash: true }); b += line(160, 146, 160, 82, { dash: true });
      b += t(100, 160, "rebuild silver", { size: 11, fill: C.dim }); b += t(100, 175, "from bronze", { size: 11, fill: C.dim });
      return svg(480, 240, b, "Medallion architecture layers");
    },
    caption: "Raw data lands in bronze, gets cleaned into silver, and is modelled into gold for users.",
    oneline: "Medallion layers go from raw bronze to clean silver to business-ready gold.",
  };

  /* ---------------------------------------------------------------- lake-partitioning */
  const LAY = [["no layout", 1000, "scans every file"], ["partition by date", 35, "only that day's folder"], ["date + Z-order(customer)", 5, "file min/max for customer skip the rest"]];
  P["lake-partitioning"] = {
    simple: [
      "How files are arranged decides how much a query has to read.",
      "**Partitioning** stores rows in folders by a column, usually a date: `dt=2026-11-04/`. A query filtered on that date reads only that folder. Pick a column with modest cardinality; partitioning by customer ID makes millions of tiny folders.",
      "**Z-ordering** (or Delta's liquid clustering, Iceberg's sort orders) sorts data inside files by other columns, so each file's min/max statistics are narrow and the engine can skip files that can't match.",
    ],
    analogy: {
      text: "Think of a library.",
      left: "Library", right: "Data layout",
      map: [
        ["Books in a random heap", "No layout: full scan"],
        ["A room per year", "Partition by date"],
        ["Within a room, shelves sorted by author", "Z-order / clustering"],
        ["A room per reader's name: thousands of tiny rooms", "Over-partitioning"],
      ],
      breaks: "library shelves stay sorted. New data arrives unsorted, so clustering decays over time and needs `OPTIMIZE` (or automatic clustering) to restore it.",
    },
    svg: () => P["lake-partitioning"]._fig(2),
    _fig: i => {
      const [n, read, why] = LAY[i];
      let b = t(240, 20, "WHERE dt = '2026-11-04' AND customer_id = 42", { bold: true, size: 12.5, mono: true });
      b += t(240, 40, n + ": files read about " + read.toLocaleString("en-US") + " of 1,000", { size: 12.5, fill: C.tx, bold: true });
      for (let f = 0; f < 200; f++) {
        const x = 16 + (f % 25) * 18, y = 52 + Math.floor(f / 25) * 18;
        const hit = i === 0 || (i === 1 ? Math.floor(f / 25) === 3 && f % 25 < 7 : f === 77);
        b += `<rect x="${x}" y="${y}" width="15" height="15" rx="2" style="fill:${hit ? C.acc : C.box};stroke:${hit ? C.accS : C.boxS}"/>`;
      }
      b += t(240, 214, "(1 square = 5 files) " + why, { size: 12, fill: C.dim });
      return svg(480, 228, b, "Files read under different data layouts");
    },
    caption: "Partition pruning skips other days; clustering inside the partition skips files for other customers.",
    ix: el => choice(el, { label: "Layout", options: LAY.map(l => l[0]), value: 0 }, i => ({ svg: P["lake-partitioning"]._fig(i), note: ["Without layout the engine opens every file.", "Partition pruning: one day out of about 30.", "File statistics now skip most files in the day too."][i] })),
    oneline: "Partition folders and sorted files let the engine skip data a query doesn't need.",
  };

  /* ---------------------------------------------------------------- lake-catalogs */
  P["lake-catalogs"] = {
    simple: [
      "A **catalog** is the directory of tables: it maps a name like `sales.orders` to where the table's metadata lives, and often decides who may read or write it.",
      "Classic choices are the **Hive Metastore** and AWS Glue. Newer ones are **Unity Catalog** (Databricks, now open source), and Iceberg **REST catalogs** such as Apache Polaris or Nessie. BigQuery and Snowflake can also act as catalogs for Iceberg tables.",
      "For Iceberg, the catalog also does the atomic commit: it swaps the table's pointer to the new metadata file, so two writers can't both win.",
    ],
    analogy: {
      text: "Think of a phone's contacts app.",
      left: "Contacts", right: "Catalog",
      map: [
        ["Name: \"Mum\"", "Table name `sales.orders`"],
        ["Her current phone number", "Pointer to current metadata"],
        ["Updating the number when she changes it", "Atomic commit to a new version"],
        ["Hiding some contacts from a child's account", "Access control"],
      ],
      breaks: "one phone has one contacts list. Companies often have several catalogs, and a table registered in one isn't visible in another unless the engines are configured to share it.",
    },
    svg: () => {
      let b = t(240, 22, "Engines find tables through the catalog", { bold: true, size: 14 });
      [["Spark", 16], ["Trino", 130], ["BigQuery", 244], ["Snowflake", 358]].forEach(([n, x]) => { b += box(x, 40, 106, 32, n, null, "plain", { size: 12.5 }); b += arrow(x + 53, 74, 240, 100, { sw: 1.1 }); });
      b += box(130, 102, 220, 52, "catalog", "sales.orders -> metadata v57", "warn", { mono2: true, size2: 11 });
      b += arrow(240, 156, 240, 176);
      b += box(100, 178, 280, 40, "metadata + Parquet in object storage", null, "good", { size: 12 });
      b += t(240, 236, "Also: permissions, lineage, audit", { size: 11.5, fill: C.dim });
      return svg(480, 250, b, "A catalog resolving a table name for several engines");
    },
    caption: "Every engine asks the catalog where sales.orders is; the catalog points to the current metadata.",
    oneline: "A catalog maps table names to their current metadata and controls who can use them.",
  };

  /* ---------------------------------------------------------------- lake-format-comparison */
  P["lake-format-comparison"] = {
    simple: [
      "Delta Lake, Iceberg and Hudi all add ACID tables on top of Parquet, but they were built for different first jobs.",
      "**Delta** grew inside Databricks and Spark and is simplest there. **Iceberg** was designed for many engines and huge tables, with hidden partitioning and partition evolution; BigQuery, Snowflake, Trino and Spark all support it. **Hudi** was built at Uber for fast upserts and incremental pulls, with copy-on-write and merge-on-read tables.",
      "They are converging: projects like Apache XTable and Delta UniForm let one table be read as more than one format.",
    ],
    analogy: {
      text: "Think of three brands of shipping container.",
      left: "Containers", right: "Table formats",
      map: [
        ["Same standard box size", "All use Parquet files"],
        ["One fits one shipping line's cranes best", "Delta: Databricks / Spark"],
        ["One accepted at every port", "Iceberg: broad engine support"],
        ["One with a side door for quick swaps", "Hudi: fast upserts"],
        ["Adapters so any crane lifts any box", "XTable / UniForm"],
      ],
      breaks: "containers really are identical inside. Formats differ in metadata, features and how each engine supports them, so check your engines' support for the features you need, not just the format name.",
    },
    svg: () => {
      let b = t(240, 22, "Three formats, different first jobs", { bold: true, size: 14 });
      b += table(16, 40, ["", "Delta", "Iceberg", "Hudi"], [["origin", "Databricks", "Netflix", "Uber"], ["sweet spot", "Spark", "many engines", "upserts"], ["metadata", "_delta_log", "manifest tree", "timeline"], ["partitions", "explicit", "hidden", "explicit"]], { cw: [100, 116, 116, 116], rh: 32, size: 12, hl: { 1: "acc" } });
      b += t(240, 222, "All: ACID, time travel, schema evolution, Parquet data", { size: 12, fill: C.dim });
      return svg(480, 238, b, "Comparison of Delta, Iceberg and Hudi");
    },
    caption: "Same foundations; the differences are in origin, metadata design and where each is strongest.",
    oneline: "Delta, Iceberg and Hudi all make Parquet tables transactional, each strongest in a different setting.",
  };

  /* ---------------------------------------------------------------- lake-streaming-ingest */
  P["lake-streaming-ingest"] = {
    simple: [
      "Lakehouse tables can be written continuously: a streaming job (Spark Structured Streaming, Flink) appends events, or applies CDC changes with MERGE, every few seconds or minutes.",
      "Each micro-batch is one commit, so readers always see whole batches. Checkpoints make sure a restarted job neither skips nor repeats a batch.",
      "The catch is **small files**: frequent commits write many tiny files, which slow reads. Schedule compaction, or use features like Hudi's merge-on-read or Delta's optimized writes.",
    ],
    analogy: {
      text: "Think of filling a jar with coins every few minutes.",
      left: "Coin jar", right: "Streaming ingest",
      map: [
        ["A handful of coins added at a time", "One micro-batch per commit"],
        ["Counting only full handfuls", "Readers see whole commits"],
        ["A note of how many handfuls you've added", "Checkpoint offsets"],
        ["Swapping piles of small coins for notes", "Compaction of small files"],
      ],
      breaks: "coins stay where you drop them. CDC data also updates and deletes old rows, so each MERGE may rewrite files across the table, which is far heavier than appending.",
    },
    svg: () => {
      let b = t(240, 22, "Kafka -> stream job -> lakehouse table", { bold: true, size: 14 });
      b += box(16, 44, 100, 46, "Kafka", "CDC topic", "plain");
      b += arrow(118, 67, 146, 67);
      b += box(150, 40, 140, 54, "micro-batch", "every 60 s: MERGE", "acc", { size2: 11 });
      b += arrow(292, 67, 320, 67);
      b += box(324, 40, 140, 54, "orders table", "commit per batch", "good", { size2: 11 });
      for (let i = 0; i < 24; i++) b += `<rect x="${330 + (i % 12) * 11}" y="${108 + Math.floor(i / 12) * 11}" width="8" height="8" style="fill:${C.warnS}"/>`;
      b += t(394, 148, "many small files", { size: 11, fill: C.warnT });
      b += arrow(394, 154, 394, 172, { label: "OPTIMIZE", dx: 40 });
      b += box(344, 174, 100, 30, "few big files", null, "good", { size: 11.5 });
      b += t(150, 140, "checkpoint: offsets + batch id", { size: 11.5, fill: C.dim });
      return svg(480, 218, b, "Streaming CDC into a lakehouse table with compaction");
    },
    caption: "Each micro-batch commits atomically; compaction later merges the small files it leaves.",
    oneline: "Streaming jobs commit small batches into lakehouse tables, and compaction cleans up the small files.",
  };

  /* ---------------------------------------------------------------- lake-optimize */
  P["lake-optimize"] = {
    simple: [
      "Lakehouse tables need housekeeping. **OPTIMIZE** (compaction) rewrites many small files into fewer large ones, around 1 GB in Delta by default, and can cluster them (Z-order) at the same time.",
      "**VACUUM** deletes files no longer referenced by any version newer than the retention period (7 days by default in Delta). That frees storage but ends time travel beyond that point.",
      "The log itself is compacted too: Delta writes a Parquet **checkpoint** every 10 commits so readers don't replay thousands of JSON files. Iceberg's equivalents are rewriting data files, expiring snapshots and rewriting manifests.",
    ],
    analogy: {
      text: "Think of tidying a busy kitchen.",
      left: "Kitchen", right: "Table maintenance",
      map: [
        ["Combining half-empty jars into full ones", "OPTIMIZE / compaction"],
        ["Sorting the spice rack while you're at it", "Z-ordering"],
        ["Throwing out jars nobody has used for a week", "VACUUM after retention"],
        ["Rewriting the shopping list neatly", "Log checkpoints"],
      ],
      breaks: "an old jar thrown away harms nobody. VACUUM with too short a retention can delete files a long-running query or a slow reader still needs, which is why Delta blocks retention under 7 days by default.",
    },
    svg: () => P["lake-optimize"]._fig(0),
    _fig: s => {
      let b = t(240, 20, ["before: 2,000 small files", "after OPTIMIZE", "after VACUUM (7 days)"][s], { bold: true, size: 14 });
      if (s === 0) for (let i = 0; i < 120; i++) b += `<rect x="${16 + (i % 30) * 15}" y="${40 + Math.floor(i / 30) * 15}" width="11" height="11" style="fill:${C.warnS}"/>`;
      if (s >= 1) for (let i = 0; i < 4; i++) b += box(16 + i * 112, 40, 104, 56, "1 GB file", null, "good", { size: 12 });
      if (s === 1) { b += t(240, 118, "old small files still on storage for time travel", { size: 12, fill: C.warnT }); for (let i = 0; i < 60; i++) b += `<rect x="${16 + (i % 30) * 15}" y="${128 + Math.floor(i / 30) * 15}" width="11" height="11" style="fill:none;stroke:${C.warnS}"/>`; }
      if (s === 2) b += t(240, 128, "unreferenced old files deleted: storage freed", { size: 12, fill: C.goodT });
      b += table(40, 170, ["", "files read per query", "storage", "time travel"], [[["before", "after OPTIMIZE", "after VACUUM"][s], ["many", "few", "few"][s], ["1x", "about 2x", "1x"][s], ["full", "full", "7 days"][s]]], { cw: [110, 130, 80, 80], rh: 28, size: 11.5 });
      return svg(480, 240, b, "Table files before and after OPTIMIZE and VACUUM");
    },
    caption: "OPTIMIZE adds big files and keeps the old small ones for time travel until VACUUM removes them.",
    ix: el => choice(el, { label: "Step", options: ["before", "OPTIMIZE", "VACUUM"], value: 1 }, i => ({ svg: P["lake-optimize"]._fig(i), note: ["Each query opens thousands of small files: slow planning, slow reads.", "Reads are fast now, but storage doubled for a while.", "Storage is back down; versions older than the retention can no longer be read."][i] })),
    oneline: "OPTIMIZE merges small files for speed, and VACUUM deletes old ones to save storage.",
  };

  /* ---------------------------------------------------------------- lake-delta */
  P["lake-delta"] = {
    simple: [
      "A Delta table is a folder of Parquet files plus a `_delta_log/` folder. Each commit is a JSON file (`00000000000000000012.json`) listing files added and removed, plus schema and stats.",
      "Every 10 commits Delta writes a Parquet **checkpoint** summarising the whole state, so a reader loads the latest checkpoint plus the few JSON files after it.",
      "Writers use **optimistic concurrency**: they write data files, then try to create the next numbered log file. If another writer got that number first, Delta checks for conflicts and retries or fails.",
    ],
    analogy: {
      text: "Think of a numbered receipt roll at a shop.",
      left: "Receipt roll", right: "Delta log",
      map: [
        ["Receipt 12: sold 2 items, returned 1", "Commit 12: add files, remove files"],
        ["End-of-day summary sheet", "Checkpoint every 10 commits"],
        ["Two cashiers can't both print receipt 13", "Only one writer creates version 13"],
        ["The loser re-checks and prints 14", "Conflict check and retry"],
      ],
      breaks: "a shop's printer guarantees unique numbers. On object storage, \"create only if it doesn't exist\" needs support from the store or a coordinator; S3 only added conditional writes in 2024, before which Delta needed a DynamoDB-based log store for multi-cluster writes.",
    },
    svg: () => {
      let b = t(240, 22, "orders/_delta_log/", { bold: true, size: 14, mono: true });
      for (let i = 0; i <= 12; i++) {
        const x = 16 + i * 35, cp = i === 10;
        b += box(x, 44, 31, 44, String(i), cp ? "cp" : "json", cp ? "warn" : i > 10 ? "acc" : "ghost", { mono: true, size: 11, size2: 9 });
      }
      b += t(240, 112, "reader loads checkpoint 10 + JSON 11, 12", { size: 12, fill: C.accT });
      b += box(16, 128, 210, 50, "writer A creates 13.json", "wins", "good");
      b += box(254, 128, 210, 50, "writer B tries 13.json", "conflict check, retry as 14", "warn", { size2: 11 });
      b += t(240, 206, "Parquet data files live next to _delta_log/", { size: 12, fill: C.dim });
      return svg(480, 222, b, "Delta transaction log with JSON commits and a checkpoint");
    },
    caption: "A reader starts from the newest checkpoint and applies the JSON commits after it.",
    oneline: "Delta tracks every change in numbered log files, with periodic checkpoints and one winner per version.",
  };

  /* ---------------------------------------------------------------- lake-iceberg */
  P["lake-iceberg"] = {
    simple: [
      "Iceberg keeps a tree of metadata. The catalog points to the current **metadata file**, which lists **snapshots**. Each snapshot points to a **manifest list**, which points to **manifest files**, which list the **data files** with per-column statistics.",
      "Planning a query walks that tree and skips whole manifests and files using partition values and min/max stats, without listing folders in storage.",
      "**Hidden partitioning** means you declare `partitioned by days(event_ts)` once; queries just filter on `event_ts` and Iceberg prunes for you. The scheme can even change later (**partition evolution**) without rewriting old data.",
    ],
    analogy: {
      text: "Think of a library's catalogue system.",
      left: "Library catalogue", right: "Iceberg metadata",
      map: [
        ["The front-desk pointer to today's catalogue edition", "Catalog pointer to metadata file"],
        ["Each edition of the catalogue", "Snapshot"],
        ["Section index: which drawers cover which subjects", "Manifest list"],
        ["Drawer cards listing each book and its range", "Manifests with file stats"],
        ["The books", "Data files"],
      ],
      breaks: "old catalogue editions are cheap to keep. Every snapshot keeps its files alive, so you must expire old snapshots or storage keeps growing.",
    },
    svg: () => {
      let b = t(240, 20, "Iceberg metadata tree", { bold: true, size: 14 });
      b += box(170, 32, 140, 30, "catalog pointer", null, "warn", { size: 12 });
      b += arrow(240, 64, 240, 76);
      b += box(150, 78, 180, 30, "metadata.json (snapshots)", null, "vio", { size: 11.5 });
      b += arrow(240, 110, 240, 122);
      b += box(170, 124, 140, 30, "manifest list", null, "acc", { size: 12 });
      [100, 240, 380].forEach((x, i) => { b += arrow(240, 156, x, 170, { sw: 1.1 }); b += box(x - 55, 172, 110, 28, "manifest " + (i + 1), null, i === 1 ? "acc" : "ghost", { size: 11 }); });
      [[195, "f7"], [240, "f8"], [285, "f9"]].forEach(([x, f]) => { b += arrow(240, 202, x, 214, { sw: 1 }); b += box(x - 20, 216, 40, 24, f, null, f === "f8" ? "good" : "plain", { size: 10.5, mono: true }); });
      b += t(60, 230, "grey: skipped by stats", { size: 10.5, fill: C.faint });
      return svg(480, 252, b, "Iceberg catalog pointer, metadata file, manifest list, manifests and data files");
    },
    caption: "Query planning walks down the tree and skips manifests and files whose stats can't match.",
    oneline: "Iceberg finds data through a tree of metadata files, so it can skip most files without listing storage.",
  };

  /* ---------------------------------------------------------------- lake-interview-prep */
  P["lake-interview-prep"] = {
    simple: [
      "This page collects the lakehouse track for revision.",
      "Expect: why lakehouses exist, how a transaction log gives ACID, time travel and MERGE, schema evolution, medallion layers, partitioning vs clustering, small files and maintenance, and Delta vs Iceberg vs Hudi.",
      "Strong answers explain the mechanism (the log, the commit, the metadata tree), not just the feature names.",
    ],
    analogy: {
      text: "Think of explaining how a bank keeps accounts correct.",
      left: "Bank", right: "Lakehouse interview",
      map: [
        ["The ledger of every transaction", "The transaction log"],
        ["A statement for any past date", "Time travel"],
        ["Two tellers can't post the same entry", "Optimistic concurrency"],
        ["Archiving old paperwork", "VACUUM / snapshot expiry"],
      ],
      breaks: "a bank has one ledger. A lakehouse has a log per table, so cross-table transactions are generally not atomic; say so if asked about multi-table consistency.",
    },
    svg: () => {
      let b = t(240, 22, "Lakehouse answers: mechanism first", { bold: true, size: 14 });
      [["1", "files + log = table version", "acc"], ["2", "atomic commit, one winner", "vio"], ["3", "layout: partition, cluster", "warn"], ["4", "maintenance: OPTIMIZE, VACUUM", "good"], ["5", "format choice by engines used", "plain"]].forEach(([n, s, k], i) => { const y = 38 + i * 42; b += badge(36, y + 17, n, k === "plain" ? "acc" : k); b += box(58, y, 406, 34, s, null, k, { size: 13 }); });
      return svg(480, 258, b, "Five lakehouse topics, mechanism first");
    },
    caption: "Explain the log and the commit first; every other feature follows from them.",
    oneline: "Know how the transaction log makes tables reliable, how layout speeds reads, and how to keep tables tidy.",
  };
})();
