/* DataForge Academy — diagram add-on pack 15 (Databases & SQL gold-standard set).
   Self-contained, inline-styled; directional arrowheads up front. */
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
  const path=(dd,o={})=>`<path d="${dd}" style="fill:none;stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x},${y} ${x+4},${y+7}" style="fill:${o.fill||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x},${y} ${x+4},${y-7}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* ---------- sql-select ---------- */
  D["select-anatomy"] = (() => {
    let b = t(320, 20, "SELECT = pick columns, compute expressions (projection)", { bold: true });
    // input table (many cols)
    b += box(28, 50, 150, 132, { r: 9 }) + t(103, 70, "orders", { bold: true, size: 11, fill: C.accT });
    ["id", "customer", "price", "qty", "status", "created_at"].forEach((c, i) => b += t(40, 92 + i * 15, c, { a: "start", size: 9.5, fill: C.dim, mono: true }));
    // SELECT clause in the middle
    b += box(214, 64, 212, 104, { r: 9, fill: C.acc, stroke: C.accS });
    b += t(320, 86, "SELECT DISTINCT", { bold: true, fill: C.accT, size: 11, mono: true });
    b += t(320, 106, "customer,", { fill: C.tx, size: 11, mono: true });
    b += t(320, 124, "price * qty AS total", { fill: C.goodT, size: 11, mono: true });
    b += t(320, 150, "drop dup rows · column · expr+alias", { size: 8.5, fill: C.dim });
    // output table (few cols)
    b += box(462, 64, 150, 104, { r: 9, fill: C.good, stroke: C.goodS }) + t(537, 84, "result", { bold: true, size: 11, fill: C.goodT });
    b += t(474, 108, "customer", { a: "start", size: 9.5, fill: C.tx, mono: true });
    b += t(474, 128, "total", { a: "start", size: 9.5, fill: C.tx, mono: true });
    b += arrowR(180, 116, 212);
    b += arrowR(428, 116, 460);
    b += t(320, 196, "projection chooses & computes columns; DISTINCT removes duplicate result rows", { fill: C.dim, size: 10 });
    return svg(212, b, "SELECT projection anatomy");
  })();

  /* ---------- sql-sorting-limiting ---------- */
  D["order-limit"] = (() => {
    let b = t(320, 20, "ORDER BY sorts · LIMIT/OFFSET pages the result", { bold: true });
    b += t(150, 44, "ORDER BY score DESC", { size: 10, fill: C.accT, mono: true });
    const vals = [95, 88, 72, 60, 55, 40];
    vals.forEach((v, i) => {
      const y = 58 + i * 22;
      const hot = i < 3, pg2 = i >= 3;
      b += box(96, y, 108, 18, { r: 5, fill: hot ? C.acc : (pg2 ? C.warnFill : C.box), stroke: hot ? C.accS : (pg2 ? C.warn : C.boxS) }) + t(150, y + 13, "score = " + v, { size: 9.5, mono: true, fill: hot ? C.accT : C.tx });
    });
    // brackets
    b += path("M214 58 H226 V124 H214", { stroke: C.accS }) + t(232, 92, "LIMIT 3", { a: "start", size: 10, fill: C.accT, bold: true });
    b += t(232, 106, "→ top-N", { a: "start", size: 9, fill: C.dim });
    b += path("M214 124 H226 V190 H214", { stroke: C.warn }) + t(232, 154, "OFFSET 3", { a: "start", size: 10, fill: C.warn, bold: true });
    b += t(232, 168, "LIMIT 3 → page 2", { a: "start", size: 9, fill: C.dim });
    b += box(360, 70, 250, 96, { r: 9 });
    b += t(485, 92, "ORDER BY is the ONLY way", { size: 10.5, bold: true });
    b += t(485, 110, "to guarantee row order.", { size: 10.5 });
    b += t(485, 132, "Pagination = ORDER BY", { size: 9.5, fill: C.dim });
    b += t(485, 148, "+ LIMIT + OFFSET (stable key!)", { size: 9.5, fill: C.dim });
    b += t(320, 206, "no ORDER BY = no defined order; for big offsets prefer keyset pagination (WHERE id > last)", { fill: C.dim, size: 9.5 });
    return svg(220, b, "ORDER BY and pagination");
  })();

  /* ---------- sql-filtering ---------- */
  D["where-filter"] = (() => {
    let b = t(320, 20, "WHERE keeps only rows matching a predicate", { bold: true });
    // input rows
    b += t(80, 48, "all rows", { size: 10, fill: C.dim });
    for (let i = 0; i < 6; i++) b += box(40, 60 + i * 20, 80, 16, { r: 4 });
    // WHERE box
    b += box(200, 64, 240, 108, { r: 10, fill: C.acc, stroke: C.accS }) + t(320, 86, "WHERE", { bold: true, fill: C.accT, size: 12, mono: true });
    ["status = 'paid'", "qty BETWEEN 1 AND 9", "name LIKE 'A%'", "country IN ('US','UK')", "coupon IS NOT NULL"].forEach((p, i) => b += t(320, 104 + i * 14, p, { size: 9, fill: C.tx, mono: true }));
    // output rows (fewer)
    b += t(560, 48, "matches", { size: 10, fill: C.goodT });
    for (let i = 0; i < 3; i++) b += box(520, 78 + i * 20, 80, 16, { r: 4, fill: C.good, stroke: C.goodS });
    b += arrowR(122, 100, 198);
    b += arrowR(442, 118, 518);
    b += t(320, 196, "comparison · IN (set) · BETWEEN (range) · LIKE (pattern) · IS NULL — NULL needs IS, not =", { fill: C.dim, size: 9.5 });
    return svg(212, b, "WHERE filtering");
  })();

  /* ---------- sql-subqueries ---------- */
  D["subquery-types"] = (() => {
    let b = t(320, 20, "Four kinds of subquery — by what they return", { bold: true });
    const cells = [
      ["Scalar", "returns ONE value", "WHERE price > (SELECT AVG(price) …)", C.acc, C.accS, C.accT, 24, 44],
      ["IN / ANY", "returns a LIST", "WHERE id IN (SELECT id FROM …)", C.acc, C.accS, C.accT, 324, 44],
      ["EXISTS", "returns TRUE / FALSE", "WHERE EXISTS (SELECT 1 FROM …)", C.good, C.goodS, C.goodT, 24, 138],
      ["Correlated", "runs PER outer row", "… WHERE o.cid = c.id  (refs outer)", C.warnFill, C.warn, C.warn, 324, 138]];
    cells.forEach(c => {
      b += box(c[6], c[7], 292, 84, { r: 10, fill: c[3], stroke: c[4] });
      b += t(c[6] + 16, c[7] + 26, c[0], { a: "start", bold: true, fill: c[5], size: 13 });
      b += t(c[6] + 16, c[7] + 46, c[1], { a: "start", size: 10, fill: C.tx });
      b += t(c[6] + 16, c[7] + 68, c[2], { a: "start", size: 8.6, fill: C.dim, mono: true });
    });
    b += t(320, 244, "scalar/IN/EXISTS run once; a correlated subquery re-runs for every outer row (often a join is faster)", { fill: C.dim, size: 9.5 });
    return svg(258, b, "Subquery types");
  })();

  /* ---------- sql-case ---------- */
  D["case-expression"] = (() => {
    let b = t(320, 20, "CASE = if/else that returns a value", { bold: true });
    b += box(36, 84, 96, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(84, 102, "score", { bold: true, fill: C.accT, size: 11, mono: true }) + t(84, 117, "input", { size: 8.5, fill: C.dim });
    const rules = [["WHEN ≥ 90", "'A'", C.good, C.goodS, C.goodT, 50], ["WHEN ≥ 75", "'B'", C.good, C.goodS, C.goodT, 100], ["WHEN ≥ 60", "'C'", C.warnFill, C.warn, C.warn, 150], ["ELSE", "'F'", C.bad, C.badS, C.badT, 200]];
    rules.forEach(r => {
      b += box(208, r[5], 150, 36, { r: 7 }) + t(220, r[5] + 22, r[0], { a: "start", size: 10.5, mono: true, fill: C.tx });
      b += box(420, r[5], 80, 36, { r: 7, fill: r[2], stroke: r[3] }) + t(460, r[5] + 22, r[1], { bold: true, fill: r[4], size: 12, mono: true });
      b += arrowR(358, r[5] + 18, 418);
      b += path("M132 104 C170 104, 175 " + (r[5] + 18) + ", 206 " + (r[5] + 18), { stroke: C.boxS });
    });
    b += t(320, 264, "evaluated top-to-bottom; first matching WHEN wins; ELSE is the fallback (NULL if omitted)", { fill: C.dim, size: 9.5 });
    return svg(278, b, "CASE expression");
  })();

  /* ---------- sql-string-funcs ---------- */
  D["string-funcs"] = (() => {
    let b = t(320, 20, "String functions transform & test text", { bold: true });
    b += box(150, 44, 340, 30, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 64, "x = '  DataForge  '", { bold: true, fill: C.accT, size: 12, mono: true });
    const ops = [
      ["TRIM(x)", "'DataForge'"], ["UPPER(x)", "'  DATAFORGE  '"], ["LENGTH(TRIM(x))", "9"],
      ["SUBSTRING(TRIM(x),1,4)", "'Data'"], ["REPLACE(x,'Forge','Lake')", "'  DataLake  '"], ["TRIM(x) LIKE '%Forge'", "true"]];
    ops.forEach((o, i) => {
      const col = i % 2, row = (i / 2) | 0, x = 30 + col * 305, y = 92 + row * 36;
      b += box(x, y, 290, 28, { r: 6 });
      b += t(x + 12, y + 18, o[0], { a: "start", size: 9.5, mono: true, fill: C.tx });
      b += t(x + 278, y + 18, "→ " + o[1], { a: "end", size: 9.5, mono: true, fill: C.goodT });
    });
    b += t(320, 214, "concat with || or CONCAT() · match with LIKE (_ , %) or regexp · positions are 1-based", { fill: C.dim, size: 9.5 });
    return svg(228, b, "String functions");
  })();

  /* ---------- sql-dates ---------- */
  D["datetime-tz"] = (() => {
    let b = t(320, 20, "Dates, times & time zones", { bold: true });
    // anatomy
    b += box(40, 48, 290, 70, { r: 9 }) + t(185, 68, "2024-03-15 14:30:00", { bold: true, size: 12, mono: true, fill: C.accT });
    b += t(185, 90, "year · month · day · hour · min", { size: 9, fill: C.dim });
    b += t(185, 107, "EXTRACT / DATE_PART pull a field", { size: 9, fill: C.dim });
    // truncation
    b += box(40, 130, 290, 56, { r: 9, fill: C.good, stroke: C.goodS });
    b += t(185, 152, "DATE_TRUNC('month', ts) → 2024-03-01", { size: 10, mono: true, fill: C.goodT });
    b += t(185, 172, "bucket timestamps for GROUP BY", { size: 9, fill: C.dim });
    // timezones
    b += box(352, 48, 256, 138, { r: 9, fill: C.warnFill, stroke: C.warn });
    b += t(480, 70, "store UTC, convert on read", { bold: true, size: 11, fill: C.warn });
    b += box(372, 84, 100, 30, { r: 6 }) + t(422, 103, "14:30 UTC", { size: 9.5, mono: true });
    b += box(488, 84, 100, 30, { r: 6 }) + t(538, 103, "10:30 EDT", { size: 9.5, mono: true });
    b += arrowR(474, 99, 486);
    b += t(480, 134, "ts AT TIME ZONE 'America/New_York'", { size: 8.6, mono: true, fill: C.dim });
    b += t(480, 154, "+ INTERVAL '7 days' for date math", { size: 8.6, mono: true, fill: C.dim });
    b += t(480, 172, "DATE vs TIMESTAMP vs TIMESTAMPTZ", { size: 8.6, fill: C.dim });
    b += t(320, 206, "always store UTC (TIMESTAMPTZ); convert to local only for display; mind DST & ambiguous times", { fill: C.dim, size: 9.5 });
    return svg(220, b, "Dates, times and time zones");
  })();

  /* ---------- sql-stored-procedures ---------- */
  D["proc-func-trigger"] = (() => {
    let b = t(320, 20, "Function vs procedure vs trigger", { bold: true });
    const col = (x, name, nc, lines, ex) => {
      let s = box(x, 46, 188, 152, { r: 10, fill: nc.f, stroke: nc.s }) + t(x + 94, 70, name, { bold: true, fill: nc.t, size: 12 });
      lines.forEach((ln2, i) => s += t(x + 94, 92 + i * 18, ln2, { size: 9.5, fill: i === 0 ? C.tx : C.dim }));
      s += box(x + 16, 162, 156, 26, { r: 6 }) + t(x + 94, 179, ex, { size: 9, mono: true, fill: nc.t });
      return s;
    };
    b += col(20, "FUNCTION", { f: C.acc, s: C.accS, t: C.accT }, ["returns a VALUE", "used inside queries", "usually side-effect-free"], "SELECT f(x)");
    b += col(226, "PROCEDURE", { f: C.good, s: C.goodS, t: C.goodT }, ["a called ROUTINE", "can run DML + txns", "no return (OUT params)"], "CALL proc(a)");
    b += col(432, "TRIGGER", { f: C.warnFill, s: C.warn, t: C.warn }, ["runs AUTOMATICALLY", "ON INSERT/UPDATE/DELETE", "audit / enforce rules"], "implicit ⚠");
    b += t(320, 220, "function = value in a query · procedure = explicit routine with side effects · trigger = fires on a data-change event", { fill: C.dim, size: 9.5 });
    return svg(234, b, "Functions, procedures, triggers");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
