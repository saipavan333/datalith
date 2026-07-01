/* DataForge Academy — diagram pack 31 (galaxy schema + DBMS fundamentals). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* galaxy / fact constellation schema */
  D["galaxy-schema"] = (() => {
    let b = t(320, 20, "Galaxy schema (fact constellation) — facts share conformed dimensions", { bold: true });
    // top row conformed dims
    const dim = (x, lbl, shared) => box(x, 44, 150, 40, { fill: shared ? C.warnFill : C.box, stroke: shared ? C.warn : C.boxS }) +
      t(x + 75, 62, lbl, { bold: true, size: 9.6, fill: shared ? C.warn : C.tx }) + (shared ? t(x + 75, 76, "conformed (shared)", { size: 7, fill: C.dim }) : t(x + 75, 76, "", {}));
    b += dim(40, "dim_date") + dim(245, "dim_product", true) + dim(450, "dim_customer");
    // two facts
    b += box(110, 150, 150, 48, { fill: C.acc, stroke: C.accS }) + t(185, 170, "FACT_SALES", { bold: true, size: 10.5, fill: C.accT }) + t(185, 186, "qty · revenue", { size: 8, fill: C.dim });
    b += box(380, 150, 150, 48, { fill: C.acc, stroke: C.accS }) + t(455, 170, "FACT_RETURNS", { bold: true, size: 10.5, fill: C.accT }) + t(455, 186, "qty · refund", { size: 8, fill: C.dim });
    // connectors (both facts share dim_product)
    b += ln(185, 150, 115, 84) + ln(185, 150, 320, 84, { stroke: C.warn });
    b += ln(455, 150, 525, 84) + ln(455, 150, 320, 84, { stroke: C.warn });
    b += t(320, 224, "two (or more) fact tables reuse the SAME conformed dimensions → integrated, no duplication", { size: 9, fill: C.dim });
    return svg(238, b, "Galaxy schema");
  })();

  /* DBMS vs file system */
  D["dbms-vs-files"] = (() => {
    let b = t(320, 20, "Why a DBMS? File system vs DBMS", { bold: true });
    b += box(20, 44, 290, 180, { r: 11, fill: C.card, stroke: C.badS, sw: 1.6 }) + t(165, 64, "File system", { bold: true, size: 11, fill: C.badT });
    [["app A → its own file"], ["app B → its own file"], ["data duplicated & inconsistent"], ["no integrity / no concurrency"], ["each app re-implements access"]].forEach((s, i) => b += t(36, 88 + i * 24, "• " + s[0], { a: "start", size: 9, fill: C.tx }));
    b += box(330, 44, 290, 180, { r: 11, fill: C.card, stroke: C.goodS, sw: 1.6 }) + t(475, 64, "DBMS", { bold: true, size: 11, fill: C.goodT });
    [["all apps → one DBMS → shared data"], ["no duplication · one source of truth"], ["integrity constraints enforced"], ["concurrency, transactions, recovery"], ["query language + security + backup"]].forEach((s, i) => b += t(346, 88 + i * 24, "• " + s[0], { a: "start", size: 9, fill: C.tx }));
    return svg(236, b, "DBMS vs file system");
  })();

  /* types of DBMS */
  D["dbms-types"] = (() => {
    let b = t(320, 20, "Types of DBMS", { bold: true });
    const types = [
      ["Relational (RDBMS)", "tables + SQL · Postgres, Oracle", C.acc, C.accS, C.accT],
      ["Document", "JSON docs · MongoDB", C.box, C.boxS, C.tx],
      ["Key-Value", "key→value · Redis, DynamoDB", C.box, C.boxS, C.tx],
      ["Column-family", "wide rows · Cassandra", C.box, C.boxS, C.tx],
      ["Graph", "nodes+edges · Neo4j", C.box, C.boxS, C.tx],
      ["Hierarchical / Network", "tree/graph · legacy (IMS)", C.box, C.boxS, C.dim],
      ["NewSQL", "SQL + scale · CockroachDB", C.good, C.goodS, C.goodT],
      ["Time-series / Vector", "metrics · embeddings", C.box, C.boxS, C.tx],
    ];
    types.forEach((ty, i) => {
      const x = 20 + (i % 2) * 305, y = 44 + Math.floor(i / 2) * 44;
      b += box(x, y, 290, 36, { r: 8, fill: ty[2], stroke: ty[3] });
      b += t(x + 12, y + 16, ty[0], { a: "start", bold: true, size: 9.5, fill: ty[4] });
      b += t(x + 12, y + 29, ty[1], { a: "start", size: 7.8, fill: C.dim });
    });
    b += t(320, 244, "relational dominates analytics & OLTP; the rest fit specific shapes/scale needs", { size: 9, fill: C.dim });
    return svg(258, b, "Types of DBMS");
  })();

  /* DBMS architecture / components */
  D["dbms-architecture"] = (() => {
    let b = t(320, 20, "DBMS architecture — the components", { bold: true });
    b += box(200, 40, 240, 28, { r: 7, fill: C.box, stroke: C.boxS }) + t(320, 58, "Applications / SQL clients", { size: 9.5 });
    b += arrowD(320, 68, 84);
    b += box(120, 86, 400, 62, { r: 10, fill: C.acc, stroke: C.accS }) + t(320, 104, "Query processor", { bold: true, size: 10, fill: C.accT });
    ["parser", "optimizer (plan)", "executor"].forEach((s, i) => b += box(140 + i * 125, 116, 110, 22, { r: 5, fill: C.box, stroke: C.boxS }) + t(195 + i * 125, 131, s, { size: 8.2 }));
    b += arrowD(320, 148, 164);
    b += box(120, 166, 400, 60, { r: 10, fill: C.good, stroke: C.goodS }) + t(320, 184, "Storage engine", { bold: true, size: 10, fill: C.goodT });
    ["buffer / cache", "access methods (B-tree)", "data + log files"].forEach((s, i) => b += box(140 + i * 125, 196, 110, 22, { r: 5, fill: C.box, stroke: C.boxS }) + t(195 + i * 125, 211, s, { size: 7.8 }));
    // side managers
    b += box(528, 86, 96, 62, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(576, 108, "Transaction", { size: 8.4, fill: C.warn, bold: true }) + t(576, 122, "manager", { size: 8.4, fill: C.warn }) + t(576, 138, "(ACID)", { size: 7.2, fill: C.dim });
    b += box(528, 166, 96, 60, { r: 9, fill: C.box, stroke: C.boxS }) + t(576, 190, "Catalog", { size: 8.6, bold: true }) + t(576, 206, "(metadata)", { size: 7.4, fill: C.dim });
    return svg(238, b, "DBMS architecture");
  })();

  /* three-schema architecture */
  D["three-schema"] = (() => {
    let b = t(320, 20, "Three-schema architecture & data independence", { bold: true });
    b += box(120, 44, 400, 40, { r: 9, fill: C.acc, stroke: C.accS }) + t(320, 62, "External level — user views", { bold: true, size: 10, fill: C.accT }) + t(320, 77, "what each user/app sees (subset, renamed)", { size: 8, fill: C.dim });
    b += arrowD(250, 84, 104, { stroke: C.goodS }) + t(180, 100, "logical data", { size: 7.4, fill: C.goodT, a: "end" }) + t(180, 110, "independence", { size: 7.4, fill: C.goodT, a: "end" });
    b += box(120, 106, 400, 40, { r: 9, fill: C.good, stroke: C.goodS }) + t(320, 124, "Conceptual level — logical schema", { bold: true, size: 10, fill: C.goodT }) + t(320, 139, "all tables, columns, relationships, constraints", { size: 8, fill: C.dim });
    b += arrowD(250, 146, 166, { stroke: C.warn }) + t(180, 162, "physical data", { size: 7.4, fill: C.warn, a: "end" }) + t(180, 172, "independence", { size: 7.4, fill: C.warn, a: "end" });
    b += box(120, 168, 400, 40, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(320, 186, "Internal level — physical schema", { bold: true, size: 10, fill: C.warn }) + t(320, 201, "files, pages, indexes on disk", { size: 8, fill: C.dim });
    b += t(320, 228, "change one level without breaking the one above = data independence", { size: 9, fill: C.dim });
    return svg(242, b, "Three-schema architecture");
  })();

  /* ACID */
  D["acid-properties"] = (() => {
    let b = t(320, 20, "ACID — what a transaction guarantees", { bold: true });
    const a = [
      ["A — Atomicity", "all steps happen, or none do (rollback)", C.accS, C.accT],
      ["C — Consistency", "moves DB from one valid state to another", C.goodS, C.goodT],
      ["I — Isolation", "concurrent txns don't corrupt each other", C.warn, C.warn],
      ["D — Durability", "once committed, it survives a crash", C.badS, C.badT],
    ];
    a.forEach((p, i) => {
      const x = 24 + (i % 2) * 305, y = 48 + Math.floor(i / 2) * 78;
      b += box(x, y, 290, 66, { r: 11, fill: C.box, stroke: p[2], sw: 1.8 });
      b += t(x + 18, y + 28, p[0], { a: "start", bold: true, size: 12, fill: p[3] });
      b += t(x + 18, y + 48, p[1], { a: "start", size: 8.8, fill: C.tx });
    });
    b += t(320, 222, "transfer $100: debit + credit BOTH commit or BOTH roll back (atomicity) — and persist (durability)", { size: 8.6, fill: C.dim });
    return svg(236, b, "ACID properties");
  })();

  /* transactions & isolation levels */
  D["txn-isolation"] = (() => {
    let b = t(320, 20, "Isolation levels vs concurrency anomalies", { bold: true });
    const cols = ["Dirty read", "Non-repeatable", "Phantom"];
    const rows = [
      ["Read Uncommitted", [1, 1, 1]],
      ["Read Committed", [0, 1, 1]],
      ["Repeatable Read", [0, 0, 1]],
      ["Serializable", [0, 0, 0]],
    ];
    b += t(150, 52, "level", { bold: true, size: 8.6, a: "start", fill: C.dim });
    cols.forEach((c, i) => b += t(330 + i * 100, 52, c, { size: 8.2, fill: C.dim }));
    rows.forEach((r, ri) => {
      const y = 64 + ri * 34;
      b += box(24, y, 280, 28, { r: 6, fill: C.acc, stroke: C.accS }) + t(36, y + 18, r[0], { a: "start", size: 9, fill: C.accT, bold: true });
      r[1].forEach((v, ci) => { const x = 330 + ci * 100;
        b += box(x - 40, y, 80, 28, { r: 6, fill: v ? C.bad : C.good, stroke: v ? C.badS : C.goodS }) + t(x, y + 18, v ? "can occur" : "prevented", { size: 7.6, fill: v ? C.badT : C.goodT }); });
    });
    b += t(320, 214, "stricter level = fewer anomalies, less concurrency · enforced by locks or MVCC (versions)", { size: 8.6, fill: C.dim });
    return svg(228, b, "Isolation levels");
  })();

  /* WAL & recovery */
  D["wal-recovery"] = (() => {
    let b = t(320, 20, "Write-Ahead Logging (WAL) & crash recovery", { bold: true });
    b += box(30, 54, 130, 44, { r: 9, fill: C.acc, stroke: C.accS }) + t(95, 72, "change", { bold: true, size: 9.5, fill: C.accT }) + t(95, 87, "(update row)", { size: 7.6, fill: C.dim });
    b += arrowR(160, 76, 196) + t(178, 68, "1", { size: 8, fill: C.warn });
    b += box(198, 54, 150, 44, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(273, 72, "write to LOG first", { bold: true, size: 9, fill: C.warn }) + t(273, 87, "(durable, sequential)", { size: 7.4, fill: C.dim });
    b += arrowR(348, 76, 384) + t(366, 68, "2", { size: 8, fill: C.good });
    b += box(386, 54, 150, 44, { r: 9, fill: C.good, stroke: C.goodS }) + t(461, 72, "then data pages", { bold: true, size: 9, fill: C.goodT }) + t(461, 87, "(later, buffered)", { size: 7.4, fill: C.dim });
    b += box(120, 124, 400, 40, { r: 10, fill: C.bad, stroke: C.badS }) + t(320, 142, "CRASH → replay the log", { bold: true, size: 10, fill: C.badT }) + t(320, 157, "REDO committed changes · UNDO uncommitted ones", { size: 8.2, fill: C.dim });
    b += arrowD(320, 98, 124, { stroke: C.badS });
    b += t(320, 186, "log is written before data → you can always recover a consistent state (durability + atomicity)", { size: 8.6, fill: C.dim });
    return svg(200, b, "WAL and recovery");
  })();

  /* query processing */
  D["query-processing"] = (() => {
    let b = t(320, 20, "How a query runs — parse → optimize → execute", { bold: true });
    const st = [["SQL query", "what you want"], ["Parser", "syntax + names → tree"], ["Optimizer", "pick the cheapest plan"], ["Executor", "run plan over storage"], ["Result", "rows back"]];
    st.forEach((s, i) => {
      const x = 12 + i * 124;
      b += box(x, 60, 108, 48, { r: 8, fill: i === 0 || i === 4 ? C.acc : C.box, stroke: i === 0 || i === 4 ? C.accS : C.boxS });
      b += t(x + 54, 82, s[0], { bold: true, size: 9.4, fill: i === 0 || i === 4 ? C.accT : C.tx });
      b += t(x + 54, 97, s[1], { size: 7.4, fill: C.dim });
      if (i < 4) b += arrowR(x + 108, 84, x + 136);
    });
    b += box(140, 132, 360, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 151, "optimizer uses statistics + indexes to choose joins & access paths", { size: 8.6, fill: C.warn });
    b += arrowU(320, 132, 110, { stroke: C.warn });
    b += t(320, 184, "same SQL, many possible plans — the optimizer's job is to pick a fast one", { size: 8.8, fill: C.dim });
    return svg(198, b, "Query processing");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
