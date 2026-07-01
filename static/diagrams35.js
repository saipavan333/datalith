/* DataForge Academy — diagram pack 35 (Data Vault 2.0). Clean geometry. */
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
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dv-architecture — the layered DV2.0 architecture */
  D["dv-architecture"] = (() => {
    let b = t(320, 20, "Data Vault 2.0 — the layered architecture", { bold: true });
    const cols = [
      ["Sources", ["CRM · ERP", "apps & files", "(business keys)"], C.acc, C.accS, C.accT],
      ["Staging", ["+ hash keys", "+ hashdiff", "+ load_date", "+ record_source"], C.box, C.boxS, C.tx],
      ["Raw Vault", ["Hubs · Links", "Satellites", "insert-only,", "source-faithful"], C.good, C.goodS, C.goodT],
      ["Business Vault", ["PITs · Bridges", "computed sats", "soft business", "rules"], C.warnFill, C.warn, C.warn],
      ["Info Marts", ["star schemas", "/ views", "for BI & ML"], C.acc, C.accS, C.accT]];
    cols.forEach((c, i) => {
      const x = 12 + i * 126, w = i === 4 ? 100 : 112;
      b += box(x, 50, w, 116, { r: 9, fill: c[2], stroke: c[3] });
      b += t(x + w / 2, 72, c[0], { bold: true, size: 10, fill: c[4] });
      c[1].forEach((s, j) => b += t(x + w / 2, 92 + j * 16, s, { size: 8, fill: C.dim }));
      if (i < 4) b += arrowR(x + w, 108, 12 + (i + 1) * 126 - 2);
    });
    b += t(320, 192, "raw vault = data exactly as received (auditable, insert-only); business vault adds logic; marts serve BI — each layer loads independently", { size: 8.3, fill: C.dim });
    return svg(206, b, "Data Vault architecture");
  })();

  /* dv-entities — Hubs, Links, Satellites column anatomy */
  D["dv-entities"] = (() => {
    let b = t(320, 20, "Hubs, Links & Satellites — the three building blocks", { bold: true });
    const card = (x, title, sub, col, rows) => {
      let s = box(x, 44, 190, 150, { r: 10, fill: col[0], stroke: col[1] });
      s += t(x + 95, 64, title, { bold: true, size: 12, fill: col[2] }) + t(x + 95, 80, sub, { size: 8, fill: C.dim });
      rows.forEach((r, i) => s += t(x + 14, 102 + i * 18, r, { a: "start", size: 8.4, mono: true, fill: i === 0 ? col[2] : C.tx }));
      return s;
    };
    b += card(16, "HUB", "a business entity", [C.acc, C.accS, C.accT], ["customer_hk  (PK)", "customer_id  ← biz key", "load_date", "record_source"]);
    b += card(225, "LINK", "a relationship", [C.warnFill, C.warn, C.warn], ["cust_order_hk (PK)", "customer_hk  (FK)", "order_hk     (FK)", "load_date", "record_source"]);
    b += card(434, "SATELLITE", "the context + history", [C.good, C.goodS, C.goodT], ["customer_hk  (FK)", "load_date    (PK)", "hashdiff", "name, email, …", "record_source"]);
    b += t(320, 214, "Hubs hold business keys; Links connect Hubs (keys only); Satellites hang off a Hub or Link and hold all descriptive attributes + history", { size: 8.3, fill: C.dim });
    return svg(228, b, "Data Vault entities");
  })();

  /* dv-loading — insert-only load pattern */
  D["dv-loading"] = (() => {
    let b = t(320, 20, "Loading the Raw Vault — insert-only, idempotent, parallel", { bold: true });
    b += box(16, 66, 150, 86, { r: 10, fill: C.box, stroke: C.boxS }) + t(91, 88, "STAGING", { bold: true, size: 11, fill: C.tx });
    b += t(91, 108, "per row, compute:", { size: 8.2, fill: C.dim }) + t(91, 124, "hash keys + hashdiff", { size: 8.2, fill: C.accT, mono: true }) + t(91, 140, "load_date · record_source", { size: 7.6, fill: C.dim });
    const tg = [["HUB", "insert a business key only if it is NEW (dedupe on the key)", C.acc, C.accS, C.accT, 60],
      ["LINK", "insert a relationship only if that combination is NEW", C.warnFill, C.warn, C.warn, 106],
      ["SAT", "insert a row only when the HASHDIFF changed (a new version)", C.good, C.goodS, C.goodT, 152]];
    // fan from staging
    b += ln(166, 109, 196, 109);
    tg.forEach(([title, desc, f, s, tc, y]) => {
      b += ln(196, 109, 196, y + 19) ; b += arrowR(196, y + 19, 224);
      b += box(226, y, 392, 38, { r: 8, fill: f, stroke: s }) + t(240, y + 16, title, { a: "start", bold: true, size: 9.5, fill: tc }) + t(240, y + 30, desc, { a: "start", size: 8, fill: C.dim });
    });
    b += t(320, 206, "every load is INSERT-only and key-driven → re-runnable, fully auditable, and all hubs/links/sats can load in parallel", { size: 8.6, fill: C.dim });
    return svg(220, b, "Data Vault loading");
  })();

  /* dv-pit-bridge — business vault performance helpers */
  D["dv-pit-bridge"] = (() => {
    let b = t(320, 20, "Business Vault — PITs & Bridges make queries fast", { bold: true });
    b += box(16, 60, 170, 110, { r: 10, fill: C.good, stroke: C.goodS }) + t(101, 80, "RAW VAULT", { bold: true, size: 10, fill: C.goodT });
    b += t(101, 100, "Hub + many Satellites", { size: 8.2, fill: C.tx }) + t(101, 116, "(versions over time)", { size: 8, fill: C.dim }) + t(101, 138, "querying = lots of", { size: 8, fill: C.dim }) + t(101, 152, "range-joins (slow)", { size: 8, fill: C.badT });
    b += arrowR(186, 115, 222);
    b += box(224, 62, 196, 50, { r: 9, fill: C.acc, stroke: C.accS }) + t(322, 82, "PIT — Point-in-Time", { bold: true, size: 9.5, fill: C.accT }) + t(322, 99, "1 row per hub per date → the active sat versions", { size: 7.8, fill: C.dim });
    b += box(224, 120, 196, 50, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(322, 140, "BRIDGE", { bold: true, size: 9.5, fill: C.warn }) + t(322, 157, "pre-joined hub→link→hub query paths", { size: 7.8, fill: C.dim });
    b += arrowR(420, 87, 456) + arrowR(420, 145, 456);
    b += box(458, 90, 166, 50, { r: 9 }) + t(541, 110, "Info Marts", { bold: true, size: 10, fill: C.tx }) + t(541, 127, "fast, equi-join reads", { size: 8, fill: C.dim });
    b += t(320, 192, "PITs and bridges are pre-computed helper tables in the business vault — they replace expensive satellite range-joins with simple, fast lookups", { size: 8.6, fill: C.dim });
    return svg(206, b, "PIT and bridge tables");
  })();

  /* dv-model-example — a worked customer/order DV model */
  D["dv-model-example"] = (() => {
    let b = t(320, 20, "A worked Data Vault model — customers & orders", { bold: true });
    const A = { fill: C.acc, stroke: C.accS }, G = { fill: C.good, stroke: C.goodS }, W = { fill: C.warnFill, stroke: C.warn };
    // hubs
    b += box(44, 50, 156, 40, A) + t(122, 68, "HUB_CUSTOMER", { bold: true, size: 9.5, fill: C.accT }) + t(122, 82, "customer_hk · customer_id", { size: 7.6, mono: true, fill: C.dim });
    b += box(440, 50, 156, 40, A) + t(518, 68, "HUB_ORDER", { bold: true, size: 9.5, fill: C.accT }) + t(518, 82, "order_hk · order_id", { size: 7.6, mono: true, fill: C.dim });
    // link
    b += box(242, 104, 156, 42, W) + t(320, 122, "LINK_CUST_ORDER", { bold: true, size: 9.5, fill: C.warn }) + t(320, 137, "customer_hk + order_hk", { size: 7.6, mono: true, fill: C.dim });
    // sats
    b += box(44, 150, 156, 46, G) + t(122, 168, "SAT_CUSTOMER", { bold: true, size: 9.5, fill: C.goodT }) + t(122, 182, "name, email, segment", { size: 7.4, fill: C.dim }) + t(122, 193, "+ hashdiff, load_date", { size: 7, fill: C.dim });
    b += box(440, 150, 156, 46, G) + t(518, 168, "SAT_ORDER", { bold: true, size: 9.5, fill: C.goodT }) + t(518, 182, "status, amount", { size: 7.4, fill: C.dim }) + t(518, 193, "+ hashdiff, load_date", { size: 7, fill: C.dim });
    // sat -> hub (up)
    b += arrowU(122, 150, 92); b += arrowU(518, 150, 92);
    // link -> hubs
    b += ln(242, 117, 200, 117) + arrowU(200, 117, 92);
    b += ln(398, 117, 440, 117) + arrowU(440, 117, 92);
    b += t(320, 218, "Information Mart built on top: dim_customers (hub + sat) and fct_orders (link + sats) form a star schema for BI", { size: 8.6, fill: C.dim });
    return svg(232, b, "Worked Data Vault model");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
