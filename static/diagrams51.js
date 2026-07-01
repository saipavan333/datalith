/* DataForge Academy — diagram pack 51 (Databricks deep-dive vol. 5: Unity Catalog & governance). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    dx:"#3a1a12", dxS:"#ff5a36", dxT:"#ff9b85", vio:"#2c2350", vioS:"#a78bfa", vioT:"#c4b5fd" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dbx-uc-model — three-level namespace */
  D["dbx-uc-model"] = (() => {
    let b = t(320, 20, "Unity Catalog — one metastore, three-level namespace", { bold: true });
    b += box(232, 40, 176, 30, { r: 8, fill: C.vio, stroke: C.vioS, sw: 2 }) + t(320, 59, "metastore (per region)", { bold: true, size: 8.6, fill: C.vioT });
    [["catalog: prod", 40], ["catalog: dev", 330]].forEach(([s, x]) => b += box(x, 90, 270, 28, { r: 7, fill: C.acc, stroke: C.accS }) + t(x + 135, 108, s, { bold: true, size: 8.6, fill: C.accT }));
    b += arrowD(175, 70, 88, { stroke: C.vioS }) + arrowD(465, 70, 88, { stroke: C.vioS }) + ln(320, 70, 320, 80, { stroke: C.vioS }) + ln(175, 80, 465, 80, { stroke: C.vioS }) + ln(175, 80, 175, 88, { stroke: C.vioS }) + ln(465, 80, 465, 88, { stroke: C.vioS });
    [["schema: sales", 40], ["schema: finance", 188]].forEach(([s, x]) => b += box(x, 134, 130, 26, { r: 6 }) + t(x + 65, 151, s, { size: 8, fill: C.dim, mono: true }));
    b += arrowD(105, 118, 132, { stroke: C.boxS }) + arrowD(253, 118, 132, { stroke: C.boxS });
    ["table", "view", "volume", "function"].forEach((s, i) => { const x = 40 + i * 70; b += box(x, 176, 60, 24, { r: 6, fill: C.good, stroke: C.goodS }) + t(x + 30, 192, s, { size: 7.6, fill: C.goodT }); });
    b += arrowD(70, 160, 174, { stroke: C.boxS });
    b += box(338, 130, 270, 70, { r: 9, fill: C.card, stroke: C.boxS }) + t(473, 148, "fully-qualified name", { bold: true, size: 8.4, fill: C.tx }) + t(473, 166, "catalog.schema.table", { size: 8.4, mono: true, fill: C.accT }) + t(473, 186, "managed (UC owns storage) vs external", { size: 7.2, fill: C.dim });
    b += box(16, 214, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 230, "one metastore governs all workspaces in a region; objects are referenced as catalog.schema.object — central governance", { size: 7.2, fill: C.warn });
    return svg(248, b, "Unity Catalog object model");
  })();

  /* dbx-uc-access — securables + privileges */
  D["dbx-uc-access"] = (() => {
    let b = t(320, 20, "Privileges flow down the securable hierarchy", { bold: true });
    const levels = [["metastore", C.vio, C.vioS], ["catalog", C.acc, C.accS], ["schema", C.box, C.boxS], ["table / view", C.good, C.goodS]];
    levels.forEach(([s, f, st], i) => { const y = 48 + i * 40; b += box(180, y, 280, 30, { r: 8, fill: f, stroke: st }) + t(320, y + 19, s, { bold: true, size: 9, fill: C.tx }); if (i < 3) b += arrowD(320, y + 30, 48 + (i + 1) * 40 - 2, { stroke: C.dxS, sw: 2 }); });
    b += t(150, 70, "GRANT", { a: "end", size: 8, mono: true, fill: C.dxT, bold: true });
    b += t(486, 120, "USE CATALOG", { a: "start", size: 7.6, mono: true, fill: C.dim }) + t(486, 158, "USE SCHEMA", { a: "start", size: 7.6, mono: true, fill: C.dim }) + t(486, 198, "SELECT / MODIFY", { a: "start", size: 7.6, mono: true, fill: C.dim });
    b += box(16, 218, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 234, "GRANT SELECT ON catalog prod TO group analysts → inherited by every schema & table beneath it; ownership implies full control", { size: 7, fill: C.warn });
    return svg(252, b, "Unity Catalog privileges");
  })();

  /* dbx-uc-data-objects — credentials, external locations, volumes */
  D["dbx-uc-data-objects"] = (() => {
    let b = t(320, 20, "Storage credentials → external locations → tables/volumes", { bold: true });
    b += box(20, 56, 150, 70, { r: 9, fill: C.vio, stroke: C.vioS }) + t(95, 74, "storage credential", { bold: true, size: 8.2, fill: C.vioT }) + t(95, 92, "cloud IAM role", { size: 7.4, fill: C.dim }) + t(95, 106, "(who can auth", { size: 7, fill: C.dim }) + t(95, 117, "to the cloud)", { size: 7, fill: C.dim });
    b += box(200, 56, 160, 70, { r: 9, fill: C.acc, stroke: C.accS }) + t(280, 74, "external location", { bold: true, size: 8.4, fill: C.accT }) + t(280, 92, "credential + a path", { size: 7.2, fill: C.dim }) + t(280, 106, "s3://bucket/zone/", { size: 7.2, mono: true, fill: C.dim }) + t(280, 117, "(governed prefix)", { size: 7, fill: C.dim });
    b += box(390, 50, 110, 36, { r: 7, fill: C.good, stroke: C.goodS }) + t(445, 72, "external table", { size: 8, fill: C.goodT });
    b += box(390, 94, 110, 36, { r: 7, fill: C.good, stroke: C.goodS }) + t(445, 116, "volume (files)", { size: 8, fill: C.goodT });
    b += box(516, 56, 108, 70, { r: 9, fill: C.box, stroke: C.boxS }) + t(570, 74, "managed", { bold: true, size: 8.4, fill: C.tx }) + t(570, 92, "UC owns the", { size: 7.2, fill: C.dim }) + t(570, 104, "storage + layout", { size: 7.2, fill: C.dim }) + t(570, 118, "(default, simplest)", { size: 6.8, fill: C.dim });
    b += arrowR(170, 91, 198) + arrowR(360, 68, 388) + arrowR(360, 112, 388);
    b += box(16, 146, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 163, "UC mediates cloud access: grant on the external location, not raw keys; volumes govern non-tabular files (ML, ingest)", { size: 7.2, fill: C.warn });
    b += t(320, 192, "Prefer managed tables for simplicity; use external locations + volumes when data must live at a specific governed path.", { size: 7.2, fill: C.dim });
    return svg(206, b, "Unity Catalog storage objects");
  })();

  /* dbx-uc-governance — lineage, audit, tags */
  D["dbx-uc-governance"] = (() => {
    let b = t(320, 20, "Governance: lineage, audit, tags, discovery", { bold: true });
    ["bronze", "silver", "gold", "dashboard"].forEach((s, i) => { const x = 28 + i * 110; b += box(x, 56, 92, 30, { r: 7, fill: C.acc, stroke: C.accS }) + t(x + 46, 75, s, { size: 8.2, fill: C.accT }); if (i < 3) b += arrowR(x + 92, 71, x + 110 - 2, { stroke: C.dxS }); });
    b += t(248, 102, "automatic column- & table-level lineage", { size: 7.4, fill: C.dim });
    b += box(28, 118, 180, 56, { r: 8, fill: C.vio, stroke: C.vioS }) + t(118, 136, "audit log", { bold: true, size: 8.6, fill: C.vioT }) + t(118, 153, "every access &", { size: 7.2, fill: C.dim }) + t(118, 165, "grant recorded", { size: 7.2, fill: C.dim });
    b += box(228, 118, 180, 56, { r: 8, fill: C.good, stroke: C.goodS }) + t(318, 136, "tags + comments", { bold: true, size: 8.6, fill: C.goodT }) + t(318, 153, "classify PII, find", { size: 7.2, fill: C.dim }) + t(318, 165, "& document data", { size: 7.2, fill: C.dim });
    b += box(428, 118, 184, 56, { r: 8, fill: C.box, stroke: C.boxS }) + t(520, 136, "information_schema", { bold: true, size: 8.2, fill: C.tx, mono: true }) + t(520, 153, "query metadata", { size: 7.2, fill: C.dim }) + t(520, 165, "& privileges as SQL", { size: 7.2, fill: C.dim });
    b += box(16, 186, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 202, "lineage + audit + tags come built-in once data is in UC — discovery, impact analysis, and compliance without extra tooling", { size: 7, fill: C.warn });
    return svg(220, b, "Unity Catalog governance");
  })();

  /* dbx-uc-fgac — row filters & column masks */
  D["dbx-uc-fgac"] = (() => {
    let b = t(320, 20, "Fine-grained access: row filters & column masks", { bold: true });
    b += box(232, 46, 176, 40, { r: 8, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(320, 64, "one table", { bold: true, size: 9, fill: C.dxT }) + t(320, 79, "+ filter & mask policies", { size: 7.4, fill: C.dim });
    b += box(40, 120, 250, 78, { r: 9, fill: C.good, stroke: C.goodS }) + t(165, 138, "analyst (US, non-PII)", { bold: true, size: 8.4, fill: C.goodT }) + t(165, 158, "rows: region = 'US' only", { size: 7.6, mono: true, fill: C.dim }) + t(165, 174, "ssn → ***-**-1234", { size: 7.6, mono: true, fill: C.dim }) + t(165, 190, "(row filter + column mask)", { size: 7, fill: C.dim });
    b += box(350, 120, 250, 78, { r: 9, fill: C.acc, stroke: C.accS }) + t(475, 138, "admin (full access)", { bold: true, size: 8.4, fill: C.accT }) + t(475, 158, "rows: all regions", { size: 7.6, mono: true, fill: C.dim }) + t(475, 174, "ssn → 123-45-1234", { size: 7.6, mono: true, fill: C.dim }) + t(475, 190, "(policies exempt this group)", { size: 7, fill: C.dim });
    b += arrowD(165, 86, 118, { stroke: C.goodS }) + arrowD(475, 86, 118, { stroke: C.accS });
    b += box(16, 210, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 226, "policies are functions attached to the table — same query, different rows/columns per user; no copies, no per-group views", { size: 7, fill: C.warn });
    return svg(244, b, "Fine-grained access control");
  })();

  /* dbx-uc-sharing — Delta Sharing */
  D["dbx-uc-sharing"] = (() => {
    let b = t(320, 20, "Delta Sharing — open, cross-platform data sharing", { bold: true });
    b += box(24, 64, 170, 76, { r: 9, fill: C.acc, stroke: C.accS }) + t(109, 84, "provider", { bold: true, size: 9, fill: C.accT }) + t(109, 102, "shares a table /", { size: 7.4, fill: C.dim }) + t(109, 114, "schema (no copy)", { size: 7.4, fill: C.dim }) + t(109, 132, "Databricks UC", { size: 7.2, mono: true, fill: C.dim });
    b += box(236, 70, 168, 64, { r: 9, fill: C.vio, stroke: C.vioS, sw: 2 }) + t(320, 90, "Delta Sharing", { bold: true, size: 9, fill: C.vioT }) + t(320, 106, "open REST protocol", { size: 7.4, fill: C.dim }) + t(320, 120, "live, short-lived links", { size: 7.2, fill: C.dim });
    b += box(446, 64, 174, 76, { r: 9, fill: C.good, stroke: C.goodS }) + t(533, 84, "recipient", { bold: true, size: 9, fill: C.goodT }) + t(533, 102, "any platform:", { size: 7.4, fill: C.dim }) + t(533, 114, "Spark, pandas,", { size: 7.2, mono: true, fill: C.dim }) + t(533, 126, "Power BI, non-DBX", { size: 7.2, mono: true, fill: C.dim });
    b += arrowR(194, 102, 234) + arrowR(404, 102, 444);
    b += box(16, 154, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 171, "recipients read live data directly from cloud storage — no ETL, no vendor lock-in; powers Marketplace & clean rooms", { size: 7.2, fill: C.warn });
    b += t(320, 200, "Share data across orgs and platforms without copying it; governance (grants, audit) stays with the provider in UC.", { size: 7.2, fill: C.dim });
    return svg(214, b, "Delta Sharing");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
