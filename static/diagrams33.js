/* Datalith — diagram pack 33 (Hadoop ecosystem + MapReduce flow). */
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

  /* hadoop-ecosystem — the layered stack + tools */
  D["hadoop-ecosystem"] = (() => {
    let b = t(320, 20, "The Hadoop ecosystem — storage, resources, compute & tools", { bold: true });
    const SW = 488;                                  // stack width (left column)
    // ingest row
    b += t(20, 46, "ingest", { a: "start", size: 8, fill: C.dim });
    b += box(16, 50, 234, 30, { r: 7, fill: C.acc, stroke: C.accS }) + t(133, 69, "Sqoop (DB import/export)", { size: 9, fill: C.accT });
    b += box(258, 50, 250, 30, { r: 7, fill: C.acc, stroke: C.accS }) + t(383, 69, "Flume / Kafka (stream ingest)", { size: 9, fill: C.accT });
    // access / tools row
    b += t(20, 96, "access & tools", { a: "start", size: 8, fill: C.dim });
    ["Hive (SQL)", "Pig (dataflow)", "HBase (NoSQL)", "Mahout (ML)"].forEach((s, i) => { const x = 16 + i * 124; b += box(x, 100, 112, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(x + 56, 119, s, { size: 8.2, fill: C.goodT }); });
    // compute engines row
    b += t(20, 146, "compute engines", { a: "start", size: 8, fill: C.dim });
    ["MapReduce", "Tez", "Spark"].forEach((s, i) => { const x = 16 + i * 164; b += box(x, 150, 152, 30, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(x + 76, 169, s, { size: 9, fill: C.warn, bold: true }); });
    // YARN band
    b += box(16, 192, SW, 30, { r: 8, fill: C.box, stroke: C.boxS, sw: 2 }) + t(260, 211, "YARN — cluster resource management & scheduling", { bold: true, size: 9.5, fill: C.tx });
    // HDFS band
    b += box(16, 228, SW, 34, { r: 8, fill: C.acc, stroke: C.accS, sw: 2 }) + t(260, 249, "HDFS — distributed, replicated block storage (commodity nodes)", { bold: true, size: 9.5, fill: C.accT });
    // coordination side column
    b += box(516, 50, 108, 212, { r: 9, fill: C.warnFill, stroke: C.warn });
    b += t(570, 70, "coordination", { bold: true, size: 8.6, fill: C.warn });
    b += t(570, 92, "ZooKeeper", { size: 8.4, fill: C.tx }); b += t(570, 106, "(consensus)", { size: 7.2, fill: C.dim });
    b += t(570, 134, "Oozie", { size: 8.4, fill: C.tx }); b += t(570, 148, "(workflow)", { size: 7.2, fill: C.dim });
    b += t(570, 182, "spans the", { size: 7.4, fill: C.dim }); b += t(570, 194, "whole stack", { size: 7.4, fill: C.dim });
    b += t(320, 282, "from Google's GFS · MapReduce · Bigtable papers → Hadoop: HDFS (store) + YARN (resources) + engines + tools", { size: 8.6, fill: C.dim });
    return svg(296, b, "Hadoop ecosystem");
  })();

  /* mapreduce-flow — map -> shuffle -> reduce */
  D["mapreduce-flow"] = (() => {
    let b = t(320, 20, "MapReduce — map → shuffle → reduce (word count)", { bold: true });
    b += box(14, 70, 96, 48, { r: 8, fill: C.box, stroke: C.boxS }) + t(62, 90, "input", { bold: true, size: 9.5 }) + t(62, 105, "splits (HDFS)", { size: 7.4, fill: C.dim });
    b += arrowR(110, 94, 134);
    // map
    b += box(136, 56, 130, 76, { r: 9, fill: C.acc, stroke: C.accS }) + t(201, 74, "MAP (parallel)", { bold: true, size: 9.5, fill: C.accT });
    b += t(201, 92, "the→(the,1)", { size: 8, mono: true, fill: C.dim }) + t(201, 106, "cat→(cat,1)", { size: 8, mono: true, fill: C.dim }) + t(201, 120, "the→(the,1)", { size: 8, mono: true, fill: C.dim });
    b += arrowR(266, 94, 290) + t(278, 86, "shuffle", { size: 7, fill: C.warn });
    // shuffle
    b += box(292, 56, 120, 76, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(352, 74, "SHUFFLE", { bold: true, size: 9.5, fill: C.warn });
    b += t(352, 92, "group by key", { size: 8, fill: C.dim }) + t(352, 108, "the→[1,1]", { size: 8, mono: true, fill: C.dim }) + t(352, 122, "cat→[1]", { size: 8, mono: true, fill: C.dim });
    b += arrowR(412, 94, 436);
    // reduce
    b += box(438, 56, 130, 76, { r: 9, fill: C.good, stroke: C.goodS }) + t(503, 74, "REDUCE", { bold: true, size: 9.5, fill: C.goodT });
    b += t(503, 92, "sum per key", { size: 8, fill: C.dim }) + t(503, 108, "the→2", { size: 8, mono: true, fill: C.goodT }) + t(503, 122, "cat→1", { size: 8, mono: true, fill: C.goodT });
    b += arrowR(568, 94, 592) ; b += t(600, 98, "out", { size: 7.4, fill: C.dim });
    b += t(320, 158, "map runs in parallel on each split (compute moves to the data); shuffle groups by key; reduce aggregates", { size: 8.8, fill: C.dim });
    b += t(320, 176, "fault-tolerant: a failed task is just re-run · this model is exactly what Spark generalized", { size: 8.6, fill: C.accT });
    return svg(192, b, "MapReduce flow");
  })();

  /* db-security — authn -> authz (roles/grants) -> protected objects */
  D["db-security"] = (() => {
    let b = t(320, 20, "Database security — authentication → authorization → objects", { bold: true });
    // user
    b += box(20, 84, 96, 48, { r: 8 }) + t(68, 105, "user_pavan", { size: 9.5, mono: true, bold: true }) + t(68, 121, "a login", { size: 8, fill: C.dim });
    b += arrowR(116, 108, 150);
    // authentication
    b += box(152, 74, 122, 68, { r: 9, fill: C.acc, stroke: C.accS }) + t(213, 94, "Authentication", { bold: true, size: 10, fill: C.accT });
    b += t(213, 111, "who are you?", { size: 8.4, fill: C.tx }) + t(213, 126, "login · SSO · MFA", { size: 8, fill: C.dim });
    b += arrowR(274, 108, 308);
    // authorization (roles)
    b += box(310, 56, 166, 104, { r: 9, fill: C.good, stroke: C.goodS }) + t(393, 76, "Authorization", { bold: true, size: 10, fill: C.goodT });
    b += t(393, 94, "what may you do?", { size: 8.4, fill: C.tx });
    b += t(393, 112, "role: analyst", { size: 8.6, mono: true, fill: C.goodT });
    b += t(393, 128, "GRANT SELECT", { size: 8.2, mono: true, fill: C.dim });
    b += t(393, 144, "REVOKE · least privilege", { size: 7.6, fill: C.dim });
    b += arrowR(476, 108, 510);
    // objects
    b += box(512, 74, 106, 68, { r: 9 }) + t(565, 93, "reporting.*", { size: 9, mono: true, bold: true, fill: C.accT });
    b += t(565, 110, "tables / views", { size: 8, fill: C.dim }) + t(565, 126, "row/col security", { size: 7.6, fill: C.dim });
    // audit + encryption band
    b += box(20, 176, 598, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 195, "Auditing — log who did what   ·   Encryption at rest & in transit   ·   mask PII", { size: 9, fill: C.warn });
    b += t(320, 226, "AuthN proves identity; AuthZ (roles + GRANT/REVOKE, least privilege) decides access; audit & encryption protect the data", { size: 9, fill: C.dim });
    return svg(240, b, "Database security model");
  })();

  /* dq-agent — data-quality / contract agent flow */
  D["dq-agent"] = (() => {
    let b = t(320, 20, "A data-quality agent — validate, quarantine, investigate, route", { bold: true });
    // source
    b += box(18, 78, 92, 50, { r: 8 }) + t(64, 99, "watched", { size: 9.5, bold: true }) + t(64, 115, "tables", { size: 9, fill: C.dim });
    b += arrowR(110, 103, 144);
    // agent
    b += box(146, 70, 168, 76, { r: 10, fill: C.acc, stroke: C.accS }) + t(230, 90, "Quality Agent", { bold: true, size: 11, fill: C.accT });
    b += t(230, 108, "validate vs contract", { size: 8.6, fill: C.tx });
    b += t(230, 124, "ranges · nulls · schema", { size: 8, fill: C.dim }) + t(230, 138, "uniqueness · SLA", { size: 8, fill: C.dim });
    // pass branch
    b += arrowR(314, 90, 396, { stroke: C.goodS }) + t(355, 83, "pass", { size: 7.6, fill: C.goodT });
    b += box(398, 72, 168, 38, { r: 8, fill: C.good, stroke: C.goodS }) + t(482, 95, "→ downstream / AI pipeline", { size: 8.6, fill: C.goodT });
    // fail branch
    b += arrowR(314, 124, 396, { stroke: C.badS }) + t(355, 117, "fail", { size: 7.6, fill: C.badT });
    b += box(398, 116, 168, 38, { r: 8, fill: C.bad, stroke: C.badS }) + t(482, 139, "quarantine (dead-letter)", { size: 8.6, fill: C.badT });
    // quarantine -> investigate/route
    b += arrowD(482, 154, 184);
    b += box(300, 186, 318, 40, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(459, 203, "investigate (lineage, sample bad rows)", { size: 8.6, fill: C.warn }) + t(459, 218, "→ route: alert · open PR · hand to repair agent", { size: 8, fill: C.dim });
    // human-in-loop policy
    b += box(18, 186, 252, 40, { r: 9 }) + t(144, 203, "Humans set policies & thresholds", { size: 8.6, bold: true }) + t(144, 218, "+ review consequential calls", { size: 8, fill: C.dim });
    b += arrowU(180, 186, 150, { dash: true });
    b += t(190, 174, "set policy", { size: 7.4, fill: C.dim, a: "start" });
    b += t(320, 250, "unlike static tests, the agent investigates & explains failures and adapts thresholds — humans own the policy", { size: 9, fill: C.dim });
    return svg(264, b, "Data-quality agent flow");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
