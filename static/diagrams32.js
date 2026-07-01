/* DataForge Academy — diagram pack 32 (RDBMS & the relational model). */
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
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const ell=(cx,cy,rx,ry,o={})=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:1.5"/>`;
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* relational model — a table = relation */
  D["relational-model"] = (() => {
    let b = t(320, 20, "The relational model — a table is a relation", { bold: true });
    const cols = ["student_id", "name", "country"], cw = 150, x0 = 120, y0 = 56;
    // header
    cols.forEach((c, i) => b += box(x0 + i * cw, y0, cw, 30, { r: 0, fill: C.acc, stroke: C.accS }) + t(x0 + i * cw + cw / 2, y0 + 19, c, { bold: true, size: 9.5, fill: C.accT }));
    // rows
    const rows = [["S1", "Ana", "NA"], ["S2", "Beck", "EU"], ["S3", "Chen", "APAC"]];
    rows.forEach((r, ri) => r.forEach((v, ci) => b += box(x0 + ci * cw, y0 + 30 + ri * 28, cw, 28, { r: 0 }) + t(x0 + ci * cw + cw / 2, y0 + 30 + ri * 28 + 18, v, { size: 9, mono: true, fill: C.dim })));
    // labels
    b += t(x0 + 225, 48, "← attributes (columns), each with a DOMAIN", { size: 8, fill: C.warn, a: "start" });
    b += arrowR(x0 - 40, y0 + 72, x0 - 1, { stroke: C.goodS }) + t(x0 - 44, y0 + 75, "tuple (row)", { size: 8, fill: C.goodT, a: "end" });
    b += t(320, y0 + 142, "relation = table · tuple = row · attribute = column · domain = a column's allowed values", { size: 8.8, fill: C.dim });
    b += t(320, y0 + 158, "rows are unordered & unique; every value is atomic (one value per cell)", { size: 8.4, fill: C.dim });
    return svg(232, b, "Relational model");
  })();

  /* relational keys */
  D["relational-keys"] = (() => {
    let b = t(320, 20, "Keys — identify rows & link tables", { bold: true });
    // nested keys (left)
    b += `<ellipse cx="150" cy="120" rx="120" ry="66" style="fill:#1b2740;stroke:${C.boxS}"/>`;
    b += `<ellipse cx="150" cy="124" rx="92" ry="48" style="fill:#22325a;stroke:${C.accS}"/>`;
    b += `<ellipse cx="150" cy="128" rx="58" ry="28" style="fill:${C.acc};stroke:${C.accS}"/>`;
    b += t(150, 70, "super keys", { size: 8.4, fill: C.dim });
    b += t(150, 100, "candidate keys", { size: 8.4, fill: C.accT });
    b += t(150, 132, "primary key", { size: 8.6, fill: C.accT, bold: true });
    // FK link (right): two mini tables
    b += box(330, 56, 130, 64, { r: 8 }) + t(395, 73, "STUDENT", { bold: true, size: 9, fill: C.tx });
    b += t(345, 92, "student_id (PK)", { size: 8, a: "start", fill: C.warn, mono: true }) + t(345, 108, "email (candidate)", { size: 7.6, a: "start", fill: C.dim, mono: true });
    b += box(330, 150, 150, 64, { r: 8 }) + t(405, 167, "ENROLLMENT", { bold: true, size: 9, fill: C.tx });
    b += t(345, 186, "course_id", { size: 8, a: "start", fill: C.dim, mono: true }) + t(345, 202, "student_id (FK)", { size: 8, a: "start", fill: C.goodT, mono: true });
    b += ln(345, 198, 320, 198) + ln(320, 198, 320, 88) + arrowR(320, 88, 343, { stroke: C.goodS });
    b += t(548, 120, "foreign key →", { size: 7.6, fill: C.goodT, a: "end" }) + t(556, 134, "must match a PK", { size: 7.4, fill: C.dim, a: "end" });
    b += t(320, 230, "super ⊇ candidate ⊇ primary · foreign key links tables · composite key = 2+ columns", { size: 8.6, fill: C.dim });
    return svg(244, b, "Relational keys");
  })();

  /* integrity constraints */
  D["integrity-constraints"] = (() => {
    let b = t(320, 20, "Integrity constraints — rules the RDBMS enforces", { bold: true });
    const cards = [
      ["Entity integrity", ["PK is NOT NULL", "and UNIQUE"], "every row is identifiable", C.accS, C.accT],
      ["Referential integrity", ["FK must match an", "existing PK (or NULL)"], "no orphan rows", C.goodS, C.goodT],
      ["Domain integrity", ["values fit the type,", "range & rules"], "e.g. age >= 0", C.warn, C.warn],
    ];
    cards.forEach((c, i) => {
      const x = 20 + i * 200;
      b += box(x, 54, 186, 132, { r: 11, fill: C.box, stroke: c[3], sw: 1.8 });
      b += t(x + 93, 84, c[0], { bold: true, size: 10.2, fill: c[4] });
      c[1].forEach((line, j) => b += t(x + 93, 110 + j * 17, line, { size: 8.8, fill: C.tx }));
      b += t(x + 93, 162, "→ " + c[2], { size: 8, fill: C.dim });
    });
    b += t(320, 208, "constraints keep the data correct automatically — the DBMS rejects violations", { size: 8.8, fill: C.dim });
    return svg(222, b, "Integrity constraints");
  })();

  /* relational algebra */
  D["relational-algebra"] = (() => {
    let b = t(320, 20, "Relational algebra — the operators behind SQL", { bold: true });
    const ops = [
      ["σ  Select", "filter rows (WHERE)"],
      ["π  Project", "pick columns (SELECT)"],
      ["⋈  Join", "combine tables on a key (JOIN)"],
      ["×  Product", "all row combinations (CROSS JOIN)"],
      ["∪  Union", "rows in A or B"],
      ["∩  Intersect", "rows in A and B"],
      ["−  Difference", "rows in A not in B"],
      ["ρ  Rename", "alias a relation/column"],
    ];
    ops.forEach((o, i) => {
      const x = 24 + (i % 2) * 305, y = 46 + Math.floor(i / 2) * 42;
      b += box(x, y, 290, 34, { r: 7, fill: C.acc, stroke: C.accS });
      b += t(x + 14, y + 21, o[0], { a: "start", bold: true, size: 10.5, fill: C.accT });
      b += t(x + 286, y + 21, o[1], { a: "end", size: 8.2, fill: C.dim });
    });
    b += t(320, 232, "SQL is a friendly language over this algebra — every query maps to these operators", { size: 8.8, fill: C.dim });
    return svg(246, b, "Relational algebra");
  })();

  /* ER model */
  D["er-model"] = (() => {
    let b = t(320, 20, "ER model — entities, relationships, attributes", { bold: true });
    // entities
    b += box(40, 96, 150, 50, { r: 6, fill: C.acc, stroke: C.accS, sw: 2 }) + t(115, 126, "CUSTOMER", { bold: true, size: 11, fill: C.accT });
    b += box(450, 96, 150, 50, { r: 6, fill: C.acc, stroke: C.accS, sw: 2 }) + t(525, 126, "ORDER", { bold: true, size: 11, fill: C.accT });
    // relationship diamond
    b += `<polygon points="320,96 372,121 320,146 268,121" style="fill:${C.warnFill};stroke:${C.warn};stroke-width:1.8"/>` + t(320, 125, "places", { size: 9, fill: C.warn, bold: true });
    b += ln(190, 121, 268, 121) + ln(372, 121, 450, 121);
    b += t(230, 113, "1", { size: 9, fill: C.tx }) + t(412, 113, "N", { size: 9, fill: C.tx });
    // attributes (ovals)
    b += ell(70, 56, 44, 18) + t(70, 60, "cust_id", { size: 7.6, fill: C.dim }) + ln(70, 74, 95, 96);
    b += ell(160, 56, 40, 18) + t(160, 60, "name", { size: 7.6, fill: C.dim }) + ln(150, 74, 130, 96);
    b += ell(480, 56, 44, 18) + t(480, 60, "order_id", { size: 7.6, fill: C.dim }) + ln(490, 74, 510, 96);
    b += ell(572, 56, 40, 18) + t(572, 60, "amount", { size: 7.6, fill: C.dim }) + ln(560, 74, 540, 96);
    b += t(320, 184, "entities = rectangles · relationship = diamond · attributes = ovals · 1:N cardinality", { size: 8.8, fill: C.dim });
    b += t(320, 202, "“one CUSTOMER places many ORDERs” → maps to tables with a foreign key", { size: 8.6, fill: C.accT });
    return svg(218, b, "ER model");
  })();

  /* normal forms */
  D["normal-forms"] = (() => {
    let b = t(320, 20, "Normalization — 1NF → 2NF → 3NF → BCNF", { bold: true });
    const nf = [
      ["1NF", "atomic values, no repeating groups (each cell one value)", C.box, C.boxS],
      ["2NF", "1NF + no partial dependency on part of a composite key", C.acc, C.accS],
      ["3NF", "2NF + no transitive dependency (non-keys depend only on the key)", C.good, C.goodS],
      ["BCNF", "stricter 3NF: every determinant is a candidate key", C.warnFill, C.warn],
    ];
    nf.forEach((n, i) => {
      const y = 48 + i * 42;
      b += box(24, y, 90, 32, { r: 7, fill: n[2], stroke: n[3] }) + t(69, y + 20, n[0], { bold: true, size: 11, fill: n[3] === C.boxS ? C.tx : n[3] });
      b += box(124, y, 492, 32, { r: 7, fill: C.box, stroke: C.boxS }) + t(138, y + 20, n[1], { a: "start", size: 8.8, fill: C.tx });
      if (i < 3) b += `<polygon points="69,${y + 32} 64,${y + 42} 74,${y + 42}" style="fill:${C.line}"/>`;
    });
    b += t(320, 232, "each form removes a kind of redundancy/anomaly · OLTP aims for 3NF/BCNF", { size: 8.8, fill: C.dim });
    return svg(246, b, "Normal forms");
  })();

  /* RDBMS vs NoSQL */
  D["rdbms-vs-nosql"] = (() => {
    let b = t(320, 20, "RDBMS vs NoSQL — when to use which", { bold: true });
    b += box(20, 44, 290, 170, { r: 11, fill: C.card, stroke: C.accS, sw: 1.8 }) + t(165, 64, "RDBMS (relational)", { bold: true, size: 11, fill: C.accT });
    [["fixed schema, strong typing"], ["ACID transactions"], ["powerful joins + SQL"], ["scales up (mostly vertical)"], ["best: structured data, integrity, OLTP/BI"]].forEach((s, i) => b += t(36, 88 + i * 24, "• " + s[0], { a: "start", size: 8.8, fill: C.tx }));
    b += box(330, 44, 290, 170, { r: 11, fill: C.card, stroke: C.goodS, sw: 1.8 }) + t(475, 64, "NoSQL", { bold: true, size: 11, fill: C.goodT });
    [["flexible / schema-light"], ["BASE (eventual consistency)"], ["models: doc, KV, column, graph"], ["scales OUT horizontally"], ["best: huge scale, high write, varied shapes"]].forEach((s, i) => b += t(346, 88 + i * 24, "• " + s[0], { a: "start", size: 8.8, fill: C.tx }));
    b += t(320, 230, "not better/worse — different trade-offs; many systems use both (polyglot persistence)", { size: 8.6, fill: C.dim });
    return svg(244, b, "RDBMS vs NoSQL");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
