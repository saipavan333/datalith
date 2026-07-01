/* DataForge Academy — diagram pack 58 (AWS deep-dive vol. 6: Lake Formation governance). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    aws:"#3a2a10", awsS:"#ff9900", awsT:"#ffc266", vio:"#2c2350", vioS:"#a78bfa", vioT:"#c4b5fd" };
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

  /* aws-lf-model — central permission layer */
  D["aws-lf-model"] = (() => {
    let b = t(320, 20, "Lake Formation — central lake permissions", { bold: true });
    b += box(20, 54, 140, 70, { r: 9, fill: C.acc, stroke: C.accS }) + t(90, 74, "S3 locations", { bold: true, size: 8.6, fill: C.accT }) + t(90, 92, "registered with", { size: 7, fill: C.dim }) + t(90, 104, "Lake Formation", { size: 7, fill: C.dim });
    b += box(200, 46, 240, 86, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(320, 64, "Lake Formation", { bold: true, size: 9.5, fill: C.awsT }) + t(320, 82, "GRANT on database / table /", { size: 7.4, mono: true, fill: C.dim }) + t(320, 94, "column (not raw IAM/S3)", { size: 7.4, mono: true, fill: C.dim }) + t(320, 112, "+ Glue Catalog · data-lake admin", { size: 7, fill: C.dim });
    b += box(480, 54, 144, 70, { r: 9, fill: C.good, stroke: C.goodS }) + t(552, 74, "principals", { bold: true, size: 8.6, fill: C.goodT }) + t(552, 92, "users / roles get", { size: 7, fill: C.dim }) + t(552, 104, "fine-grained access", { size: 7, fill: C.dim });
    b += arrowR(160, 88, 198, { stroke: C.awsS }) + arrowR(440, 88, 478, { stroke: C.awsS });
    b += box(16, 148, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 165, "instead of managing S3 bucket policies + IAM per dataset, grant database/table/column permissions in one place", { size: 7, fill: C.warn });
    b += t(320, 194, "Lake Formation layers simple GRANT-style permissions over the Glue Catalog, replacing per-bucket IAM for lake data.", { size: 7, fill: C.dim });
    return svg(208, b, "Lake Formation model");
  })();

  /* aws-lf-tags — TBAC + fine-grained */
  D["aws-lf-tags"] = (() => {
    let b = t(320, 20, "LF-Tags & fine-grained access (row/column/cell)", { bold: true });
    b += box(20, 52, 280, 56, { r: 9, fill: C.vio, stroke: C.vioS }) + t(160, 70, "LF-Tags (tag-based access)", { bold: true, size: 8.6, fill: C.vioT }) + t(160, 88, "tag resources: classification=PII, domain=sales", { size: 7, mono: true, fill: C.dim }) + t(160, 100, "grant on TAGS → scales to thousands of tables", { size: 7, fill: C.dim });
    b += box(316, 52, 308, 56, { r: 9, fill: C.aws, stroke: C.awsS }) + t(470, 70, "fine-grained filters", { bold: true, size: 8.6, fill: C.awsT }) + t(470, 88, "column: hide ssn · row: region='US'", { size: 7, mono: true, fill: C.dim }) + t(470, 100, "cell-level via data filters", { size: 7, fill: C.dim });
    b += box(20, 122, 604, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(320, 138, "one table → different principals see different columns/rows", { bold: true, size: 8, fill: C.goodT }) + t(320, 153, "analyst: region rows + masked PII   ·   admin: all rows + full PII", { size: 7.4, fill: C.dim });
    b += box(16, 176, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 193, "LF-Tags scale governance (grant by tag, not per-object); data filters give column/row/cell security — no per-group copies", { size: 6.9, fill: C.warn });
    return svg(212, b, "Lake Formation tags and filters");
  })();

  /* aws-lf-sharing — cross-account / mesh */
  D["aws-lf-sharing"] = (() => {
    let b = t(320, 20, "Cross-account sharing & data mesh", { bold: true });
    b += box(20, 56, 170, 76, { r: 9, fill: C.acc, stroke: C.accS }) + t(105, 76, "producer account", { bold: true, size: 8.6, fill: C.accT }) + t(105, 94, "owns the data &", { size: 7, fill: C.dim }) + t(105, 106, "catalog; grants", { size: 7, fill: C.dim }) + t(105, 122, "cross-account", { size: 7, mono: true, fill: C.dim });
    b += box(232, 56, 176, 76, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(320, 74, "LF + RAM share", { bold: true, size: 8.8, fill: C.awsT }) + t(320, 92, "grant DB/table/tag", { size: 7, fill: C.dim }) + t(320, 104, "to another account", { size: 7, fill: C.dim }) + t(320, 120, "(no data copy)", { size: 7, fill: C.goodT });
    b += box(450, 56, 174, 76, { r: 9, fill: C.good, stroke: C.goodS }) + t(537, 76, "consumer account", { bold: true, size: 8.6, fill: C.goodT }) + t(537, 94, "queries shared data", { size: 7, fill: C.dim }) + t(537, 106, "in place (Athena,", { size: 7, fill: C.dim }) + t(537, 122, "Redshift, EMR)", { size: 7, fill: C.dim });
    b += arrowR(190, 92, 230, { stroke: C.awsS }) + arrowR(408, 92, 448, { stroke: C.goodS });
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "domains own & share data products across accounts with governed grants — the foundation of a data mesh on AWS", { size: 7, fill: C.warn });
    b += t(320, 196, "Lake Formation + Resource Access Manager share catalog data across accounts with fine-grained grants, no copies.", { size: 7, fill: C.dim });
    return svg(210, b, "Lake Formation cross-account sharing");
  })();

  /* aws-lf-integration — engines enforce LF */
  D["aws-lf-integration"] = (() => {
    let b = t(320, 20, "Engines enforce Lake Formation permissions", { bold: true });
    ["Athena", "Redshift", "EMR / Spark", "Glue"].forEach((s, i) => { const x = 24 + i * 152; b += box(x, 50, 132, 30, { r: 7, fill: C.acc, stroke: C.accS }) + t(x + 66, 69, s, { size: 8.2, fill: C.accT }); b += arrowD(x + 66, 80, 96, { stroke: C.awsS }); });
    b += box(120, 100, 400, 34, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(320, 116, "Lake Formation checks grants → vends temporary creds", { bold: true, size: 8.2, fill: C.awsT }) + t(320, 129, "filters columns/rows before data is returned", { size: 7, fill: C.dim });
    b += arrowD(320, 134, 150, { stroke: C.awsS });
    b += box(220, 152, 200, 26, { r: 7, fill: C.good, stroke: C.goodS }) + t(320, 169, "S3 data (only permitted parts)", { size: 7.8, fill: C.goodT });
    b += box(16, 192, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 209, "every engine asks LF for access & gets only the columns/rows the principal may see — one consistent policy, all engines", { size: 6.9, fill: C.warn });
    return svg(228, b, "Lake Formation enforcement");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
