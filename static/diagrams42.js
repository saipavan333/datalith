/* DataForge Academy — diagram pack 42 (Snowflake, module 2). Clean geometry. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    sn:"#10303a", snS:"#29b5e8", snT:"#7fd6f2" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* snow-semistructured — VARIANT / JSON */
  D["snow-semistructured"] = (() => {
    let b = t(320, 20, "Semi-structured data — VARIANT, JSON & FLATTEN", { bold: true });
    b += box(16, 56, 180, 70, { r: 9, fill: C.sn, stroke: C.snS }) + t(106, 76, "raw JSON", { bold: true, size: 9, fill: C.snT }) + t(106, 94, "{ user, items:[…] }", { size: 7.4, mono: true, fill: C.dim }) + t(106, 112, "loaded into a VARIANT", { size: 7.2, fill: C.dim });
    b += box(246, 56, 180, 70, { r: 9, fill: C.box, stroke: C.boxS }) + t(336, 76, "query with paths", { bold: true, size: 9, fill: C.tx }) + t(336, 94, "col:user::string", { size: 7.4, mono: true, fill: C.snT }) + t(336, 112, "col:items[0]:sku", { size: 7.4, mono: true, fill: C.snT });
    b += box(476, 56, 148, 70, { r: 9, fill: C.good, stroke: C.goodS }) + t(550, 76, "FLATTEN", { bold: true, size: 9, fill: C.goodT }) + t(550, 94, "explode arrays", { size: 7.2, fill: C.dim }) + t(550, 112, "→ one row / item", { size: 7.2, fill: C.dim });
    b += arrowR(196, 91, 244) + arrowR(426, 91, 474);
    b += box(16, 150, 608, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "schema-on-read: store flexible JSON in a VARIANT, query with : and [] paths, LATERAL FLATTEN to relational rows", { size: 8.2, fill: C.warn });
    b += t(320, 204, "Snowflake ingests JSON/Avro/Parquet/XML into a VARIANT column and queries it with SQL — no rigid schema, yet columnar-fast via automatic sub-columnarization.", { size: 8, fill: C.dim });
    return svg(218, b, "Snowflake semi-structured");
  })();

  /* snow-rbac — security & access */
  D["snow-rbac"] = (() => {
    let b = t(320, 20, "Security & RBAC — roles, masking, row policies", { bold: true });
    b += t(150, 46, "role hierarchy", { bold: true, size: 8.6, fill: C.snT });
    const roles = [["ACCOUNTADMIN", C.bad, C.badS], ["SYSADMIN", C.acc, C.accS], ["analyst role", C.good, C.goodS], ["USER", C.box, C.boxS]];
    roles.forEach(([nm, f, s], i) => { const y = 56 + i * 34; b += box(60, y, 180, 26, { r: 6, fill: f, stroke: s }) + t(150, y + 17, nm, { bold: true, size: 8.2 }); if (i < 3) b += arrowD(150, y + 26, y + 30); });
    b += t(150, 196, "privileges flow down the hierarchy", { size: 7.4, fill: C.dim });
    b += t(450, 46, "data protection (policies)", { bold: true, size: 8.6, fill: C.snT });
    b += box(300, 56, 320, 30, { r: 7, fill: C.box, stroke: C.boxS }) + t(312, 75, "Masking policy → email shows ***@*** unless privileged", { a: "start", size: 7.6 });
    b += box(300, 92, 320, 30, { r: 7, fill: C.box, stroke: C.boxS }) + t(312, 111, "Row access policy → region = current role's region", { a: "start", size: 7.6 });
    b += box(300, 128, 320, 30, { r: 7, fill: C.box, stroke: C.boxS }) + t(312, 147, "Network policy → allow only corp IP ranges", { a: "start", size: 7.6 });
    b += box(300, 164, 320, 26, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(460, 181, "+ OAuth/SSO/MFA · column & row level", { size: 7.4, fill: C.warn });
    b += t(320, 210, "Grant privileges to roles (not users); roles inherit down a hierarchy. Masking & row-access policies enforce column/row security on top.", { size: 8, fill: C.dim });
    return svg(222, b, "Snowflake RBAC");
  })();

  /* snow-performance — tuning */
  D["snow-performance"] = (() => {
    let b = t(320, 20, "Performance — micro-partitions, clustering, caching", { bold: true });
    b += t(150, 46, "pruning", { bold: true, size: 8.6, fill: C.snT });
    b += box(40, 54, 220, 28, { r: 6, fill: C.box, stroke: C.boxS }) + t(150, 72, "table = many micro-partitions", { size: 7.8 });
    [0, 1, 2, 3, 4, 5].forEach(i => { const x = 44 + i * 36; b += box(x, 90, 32, 22, { r: 4, fill: i === 2 || i === 3 ? C.good : C.box, stroke: i === 2 || i === 3 ? C.goodS : C.boxS }); });
    b += t(150, 128, "clustering → query reads only matching", { size: 7.4, fill: C.dim }) + t(150, 140, "partitions (the green ones)", { size: 7.4, fill: C.dim });
    b += arrowD(150, 82, 90);
    b += t(470, 46, "caching layers", { bold: true, size: 8.6, fill: C.snT });
    b += box(330, 54, 290, 26, { r: 6, fill: C.good, stroke: C.goodS }) + t(340, 71, "result cache → identical query = instant, free", { a: "start", size: 7.4, fill: C.goodT });
    b += box(330, 86, 290, 26, { r: 6, fill: C.acc, stroke: C.accS }) + t(340, 103, "warehouse (local SSD) cache → hot data", { a: "start", size: 7.4, fill: C.accT });
    b += box(330, 118, 290, 26, { r: 6, fill: C.box, stroke: C.boxS }) + t(340, 135, "remote storage (the source of truth)", { a: "start", size: 7.4, fill: C.dim });
    b += arrowD(475, 80, 86) + arrowD(475, 112, 118);
    b += box(16, 158, 608, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 177, "also: materialized views (precompute), search optimization (point lookups), Query Profile (find the bottleneck), right-size warehouses", { size: 7.8, fill: C.warn });
    b += t(320, 210, "Snowflake auto-partitions; add a clustering key on big tables so pruning skips partitions, and lean on the three caches before scaling compute.", { size: 8, fill: C.dim });
    return svg(222, b, "Snowflake performance");
  })();

  /* snow-sharing — data sharing & marketplace */
  D["snow-sharing"] = (() => {
    let b = t(320, 20, "Secure Data Sharing & Marketplace", { bold: true });
    b += box(40, 64, 180, 70, { r: 9, fill: C.sn, stroke: C.snS }) + t(130, 86, "Provider account", { bold: true, size: 9, fill: C.snT }) + t(130, 104, "owns the data", { size: 7.2, fill: C.dim }) + t(130, 120, "creates a SHARE", { size: 7.2, fill: C.dim });
    b += box(420, 64, 180, 70, { r: 9, fill: C.good, stroke: C.goodS }) + t(510, 86, "Consumer account", { bold: true, size: 9, fill: C.goodT }) + t(510, 104, "queries live data", { size: 7.2, fill: C.dim }) + t(510, 120, "no copy, no ETL", { size: 7.2, fill: C.dim });
    b += arrowR(220, 99, 418, { sw: 2 });
    b += t(320, 90, "live, governed", { size: 7.6, fill: C.snT }) + t(320, 102, "access (zero-copy)", { size: 7.6, fill: C.dim }) + t(320, 116, "metadata pointer", { size: 6.8, fill: C.dim });
    b += box(16, 158, 608, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 177, "Marketplace = public listings · reader accounts for non-Snowflake consumers · sharing works across regions/clouds", { size: 7.9, fill: C.warn });
    b += t(320, 210, "Sharing grants live, read-only access to the same stored data — no copying, no pipelines. The Marketplace publishes shares as discoverable listings.", { size: 8, fill: C.dim });
    return svg(222, b, "Snowflake data sharing");
  })();

  /* snow-capstone — end-to-end platform */
  D["snow-capstone"] = (() => {
    let b = t(320, 18, "Capstone — an end-to-end Snowflake platform", { bold: true });
    const src = [["files / S3", 110], ["streams", 320], ["apps / CDC", 530]];
    src.forEach(([s, x]) => b += box(x - 80, 30, 160, 28, { r: 7, fill: C.acc, stroke: C.accS }) + t(x, 48, s, { size: 8, fill: C.accT }));
    const ing = [["Snowpipe / COPY", 110], ["Snowpipe Streaming", 320], ["Dynamic Tables", 530]];
    ing.forEach(([s, x]) => b += box(x - 80, 74, 160, 28, { r: 7 }) + t(x, 92, s, { size: 7.4 }));
    [110, 320, 530].forEach(x => b += arrowD(x, 58, 74) + arrowD(x, 102, 120));
    b += box(30, 120, 580, 42, { r: 9, fill: C.sn, stroke: C.snS, sw: 2 }) + t(320, 138, "Snowflake:  raw → staging → marts   (databases · schemas · VARIANT + relational)", { bold: true, size: 8.8, fill: C.snT }) + t(320, 153, "virtual warehouses size compute per workload · Time Travel & cloning", { size: 7.2, fill: C.dim });
    b += box(150, 182, 180, 30, { r: 8, fill: C.good, stroke: C.goodS }) + t(240, 201, "BI / Snowsight", { size: 8, fill: C.goodT });
    b += box(360, 182, 150, 30, { r: 8 }) + t(435, 201, "Snowpark / Cortex", { size: 7.8 });
    b += arrowD(240, 162, 182) + arrowR(330, 197, 358);
    b += t(320, 230, "Govern with RBAC + masking/row policies · tune with clustering + caches · share via the Marketplace — one platform, ingestion to insight.", { size: 7.8, fill: C.dim });
    return svg(240, b, "Snowflake capstone");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
