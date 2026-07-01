/* DataForge Academy — diagram pack 34 (dbt in depth). Clean geometry, directional arrows. */
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
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dbt-project-flow — dbt is the T in ELT, inside the warehouse */
  D["dbt-project-flow"] = (() => {
    let b = t(320, 20, "dbt = the T in ELT — transformations that run IN your warehouse", { bold: true });
    b += box(14, 64, 132, 70, { r: 9, fill: C.acc, stroke: C.accS }) + t(80, 88, "Raw sources", { bold: true, size: 10.5, fill: C.accT });
    b += t(80, 106, "loaded by EL", { size: 8.4, fill: C.dim }) + t(80, 120, "(Fivetran/Airbyte)", { size: 8, fill: C.dim });
    b += arrowR(146, 99, 178);
    // dbt project box with 3 layers
    b += box(180, 46, 280, 150, { r: 11, fill: C.card, stroke: C.goodS, sw: 2 }) + t(320, 64, "dbt project (SQL + YAML)", { bold: true, size: 10.5, fill: C.goodT });
    const layers = [["staging — clean & rename 1:1 with sources", 78], ["intermediate — joins & business logic", 116], ["marts — facts & dims for consumers", 154]];
    layers.forEach(([s, y], i) => { b += box(196, y, 248, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(320, y + 19, s, { size: 8.4, fill: C.goodT }); if (i < 2) b += arrowD(320, y + 30, layers[i + 1][1]); });
    b += arrowR(460, 121, 492);
    b += box(494, 86, 132, 70, { r: 9 }) + t(560, 108, "BI · ML", { bold: true, size: 10.5 }) + t(560, 126, "reverse-ETL", { size: 8.6, fill: C.dim });
    b += t(320, 214, "dbt compiles each model (a SELECT) into warehouse DDL/DML and runs them in dependency order — versioned, tested, documented", { size: 8.8, fill: C.dim });
    return svg(228, b, "dbt project flow");
  })();

  /* dbt-dag — ref() builds the DAG */
  D["dbt-dag"] = (() => {
    let b = t(320, 20, "ref() builds the DAG — dbt resolves run order automatically", { bold: true });
    const node = (x, y, w, label, col) => box(x, y, w, 30, { r: 7, fill: col[0], stroke: col[1] }) + t(x + w / 2, y + 19, label, { size: 8.6, fill: col[2], mono: true });
    const A = [C.acc, C.accS, C.accT], G = [C.good, C.goodS, C.goodT], W = [C.warnFill, C.warn, C.warn];
    // column labels
    ["sources", "staging", "intermediate", "marts"].forEach((s, i) => b += t([74, 236, 411, 567][i], 46, s, { size: 8, fill: C.dim }));
    // sources
    b += node(16, 60, 116, "raw.orders", A); b += node(16, 140, 116, "raw.customers", A);
    // staging
    b += node(176, 60, 120, "stg_orders", G); b += node(176, 140, 120, "stg_customers", G);
    // intermediate
    b += node(346, 100, 130, "int_orders_joined", W);
    // marts
    b += node(510, 60, 114, "fct_orders", G); b += node(510, 140, 114, "dim_customers", G);
    // raw -> staging
    b += arrowR(132, 75, 174) + arrowR(132, 155, 174);
    // staging -> intermediate (clean junction at x=321, y=115)
    b += ln(296, 75, 321, 75) + ln(321, 75, 321, 115);
    b += ln(296, 155, 321, 155) + ln(321, 155, 321, 115);
    b += arrowR(321, 115, 344);
    // intermediate -> fct (up-right elbow)
    b += ln(476, 115, 493, 115) + ln(493, 115, 493, 75) + arrowR(493, 75, 508);
    // staging customers -> dim (straight, below intermediate)
    b += arrowR(298, 155, 508);
    b += t(320, 198, "you write SELECT … FROM {{ ref('stg_orders') }}; dbt parses every ref() into a dependency graph and runs upstream-first (in parallel where it can)", { size: 8.2, fill: C.dim });
    return svg(214, b, "dbt DAG from ref");
  })();

  /* dbt-materializations — view / table / incremental / ephemeral */
  D["dbt-materializations"] = (() => {
    let b = t(320, 20, "Materializations — how dbt builds a model in the warehouse", { bold: true });
    const cards = [
      ["view", "CREATE VIEW", "always fresh, no storage; recomputed on every read", C.acc, C.accS, C.accT],
      ["table", "CREATE TABLE AS", "fast reads, full rebuild each run", C.good, C.goodS, C.goodT],
      ["incremental", "INSERT/MERGE new rows", "only process new/changed rows on big tables", C.warnFill, C.warn, C.warn],
      ["ephemeral", "inlined as a CTE", "no DB object; reused SQL in dependents", C.box, C.boxS, C.tx]];
    cards.forEach((c, i) => {
      const x = 16 + i * 154;
      b += box(x, 48, 142, 132, { r: 9, fill: c[3], stroke: c[4] });
      b += t(x + 71, 70, c[0], { bold: true, size: 12, fill: c[5] });
      b += box(x + 12, 84, 118, 26, { r: 5, fill: C.card, stroke: C.boxS }) + t(x + 71, 101, c[1], { size: 7.6, mono: true, fill: C.dim });
      // wrap description into 3 lines
      const words = c[2].split(" "); let lines = [""];
      words.forEach(w => { if ((lines[lines.length - 1] + " " + w).trim().length > 20) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim(); });
      lines.slice(0, 4).forEach((ln2, j) => b += t(x + 71, 128 + j * 13, ln2, { size: 7.8, fill: C.dim }));
    });
    b += t(320, 200, "pick by size & freshness: view (small/fresh) · table (default) · incremental (huge append-mostly) · ephemeral (helper SQL)", { size: 8.6, fill: C.dim });
    return svg(214, b, "dbt materializations");
  })();

  /* dbt-testing — the quality layers */
  D["dbt-testing"] = (() => {
    let b = t(320, 20, "Testing & contracts — trust every model", { bold: true });
    // input
    b += box(16, 70, 110, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(71, 92, "a model", { bold: true, size: 10, fill: C.accT }) + t(71, 110, "(or source)", { size: 8, fill: C.dim });
    b += arrowR(126, 98, 158);
    // test types stacked
    const tests = [
      ["Generic tests", "unique · not_null · relationships · accepted_values", C.good, C.goodS, C.goodT, 48],
      ["Singular tests", "one-off SQL that should return zero rows", C.good, C.goodS, C.goodT, 84],
      ["Unit tests", "mock inputs → assert exact output of the SQL logic", C.acc, C.accS, C.accT, 120],
      ["Contracts + freshness", "enforce column types/constraints · source SLA", C.warnFill, C.warn, C.warn, 156]];
    tests.forEach(([title, sub, f, s, tc, y]) => {
      b += box(160, y, 318, 32, { r: 7, fill: f, stroke: s }) + t(172, y + 14, title, { a: "start", bold: true, size: 9, fill: tc }) + t(172, y + 27, sub, { a: "start", size: 7.6, fill: C.dim });
    });
    b += arrowR(478, 110, 510);
    b += box(512, 84, 114, 52, { r: 9, fill: C.bad, stroke: C.badS }) + t(569, 106, "fail → stop", { bold: true, size: 9.5, fill: C.badT }) + t(569, 123, "block the run", { size: 8, fill: C.dim });
    b += t(320, 206, "`dbt build` runs models + their tests together; a failing test halts the pipeline so bad data never reaches marts", { size: 8.6, fill: C.dim });
    return svg(220, b, "dbt testing");
  })();

  /* dbt-deploy — dev -> CI -> prod */
  D["dbt-deploy"] = (() => {
    let b = t(320, 20, "Deploying dbt — dev → CI → production", { bold: true });
    const st = [
      ["Develop", "dbt run / build", "models, tests, docs", C.acc, C.accS, C.accT],
      ["Pull request", "Slim CI: dbt build", "state:modified+ only", C.warnFill, C.warn, C.warn],
      ["Production", "scheduled dbt build", "prod schema, fresh data", C.good, C.goodS, C.goodT]];
    st.forEach(([title, mid, sub, f, s, tc], i) => {
      const x = 22 + i * 200;
      b += box(x, 56, 172, 74, { r: 10, fill: f, stroke: s }) + t(x + 86, 78, title, { bold: true, size: 11, fill: tc });
      b += t(x + 86, 98, mid, { size: 8.6, mono: true, fill: C.tx }) + t(x + 86, 114, sub, { size: 8, fill: C.dim });
      if (i < 2) b += arrowR(x + 172, 93, x + 222);
    });
    b += box(22, 150, 596, 34, { r: 8 }) + t(320, 166, "every run regenerates docs + column-level lineage; orchestrate with dbt Cloud / Airflow / Dagster", { size: 8.8, fill: C.tx }) + t(320, 179, "dbt Core v2 (open-source Fusion engine) adds a faster Rust runtime, SQL comprehension & live lineage", { size: 8, fill: C.accT });
    b += t(320, 208, "Slim CI rebuilds only what changed (and its children) using state comparison — fast, safe pull-request checks", { size: 8.6, fill: C.dim });
    return svg(222, b, "dbt deployment");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
