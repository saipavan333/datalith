/* DataForge Academy — diagram pack 45 (deep-dive lessons, vol. 2: Snowflake security). */
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
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* snow-rbac-model — functional/access role pattern */
  D["snow-rbac-model"] = (() => {
    let b = t(320, 20, "RBAC — privileges to roles, roles to users", { bold: true });
    b += box(16, 66, 104, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(68, 86, "USER", { bold: true, size: 9, fill: C.accT }) + t(68, 100, "(jdoe)", { size: 7, fill: C.dim });
    b += box(150, 58, 156, 60, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(228, 80, "functional role", { bold: true, size: 8.8, fill: C.snT }) + t(228, 96, "analyst", { size: 7.6, fill: C.dim }) + t(228, 108, "(what you are)", { size: 6.6, fill: C.dim });
    b += box(336, 66, 150, 44, { r: 8 }) + t(411, 86, "access role", { bold: true, size: 8.6 }) + t(411, 100, "marts_read", { size: 7.2, mono: true, fill: C.dim });
    b += box(516, 66, 108, 44, { r: 8, fill: C.good, stroke: C.goodS }) + t(570, 86, "SELECT", { bold: true, size: 8.8, fill: C.goodT }) + t(570, 100, "on marts.*", { size: 7, mono: true, fill: C.dim });
    b += arrowR(120, 88, 148) + arrowR(306, 88, 334) + arrowR(486, 88, 514);
    b += box(16, 148, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 165, "grant privileges → access roles → functional roles → users · never grant to users directly", { size: 7.7, fill: C.warn });
    b += box(16, 180, 608, 26, { r: 8, fill: C.card, stroke: C.snS }) + t(320, 197, "system roles: ACCOUNTADMIN (restrict!) > SECURITYADMIN / SYSADMIN / USERADMIN · future grants cover new objects", { size: 7.4, fill: C.snT });
    b += t(320, 226, "Separate 'what you can touch' (access roles) from 'who you are' (functional roles) — onboarding becomes one grant.", { size: 7.6, fill: C.dim });
    return svg(240, b, "Snowflake RBAC model");
  })();

  /* snow-masking — dynamic data masking */
  D["snow-masking"] = (() => {
    let b = t(320, 20, "Dynamic Data Masking — per-role column values", { bold: true });
    b += box(16, 72, 132, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(82, 92, "email column", { bold: true, size: 8.6, fill: C.accT }) + t(82, 106, "alice@acme.com", { size: 7, mono: true, fill: C.dim });
    b += box(176, 62, 180, 64, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(266, 84, "masking policy", { bold: true, size: 9, fill: C.snT }) + t(266, 100, "checks current_role()", { size: 7, mono: true, fill: C.dim }) + t(266, 113, "at query time", { size: 6.8, fill: C.dim });
    b += box(396, 64, 212, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(404, 83, "PII_READER → alice@acme.com", { a: "start", size: 7.6, mono: true, fill: C.goodT });
    b += box(396, 98, 212, 30, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(404, 117, "ANALYST → ***@***", { a: "start", size: 7.6, mono: true, fill: C.warn });
    b += arrowR(148, 94, 174);
    b += ln(356, 94, 376, 94) + ln(376, 79, 376, 113) + arrowR(376, 79, 394) + arrowR(376, 113, 394);
    b += box(16, 150, 592, 28, { r: 8, fill: C.card, stroke: C.snS }) + t(312, 168, "rewrites the column's value per role/context at query time — one governed copy, no duplication", { size: 7.5, fill: C.snT });
    b += t(320, 198, "The same column returns full or masked data depending on who's asking; policies can read other columns (conditional masking).", { size: 7.5, fill: C.dim });
    return svg(212, b, "Dynamic data masking");
  })();

  /* snow-row-policies — row access policy */
  D["snow-row-policies"] = (() => {
    let b = t(320, 20, "Row Access Policies — per-role row filtering", { bold: true });
    b += box(16, 56, 150, 92, { r: 9, fill: C.acc, stroke: C.accS }) + t(91, 73, "orders (all rows)", { bold: true, size: 8.2, fill: C.accT });
    ["US   · 120", "EU   · 80", "APAC · 60", "US   · 95"].forEach((s, i) => b += t(30, 92 + i * 16, s, { a: "start", size: 7, mono: true, fill: C.dim }));
    b += box(196, 74, 180, 56, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(286, 96, "row access policy", { bold: true, size: 8.8, fill: C.snT }) + t(286, 112, "region = role's region", { size: 7, mono: true, fill: C.dim });
    b += box(406, 56, 200, 92, { r: 9, fill: C.good, stroke: C.goodS }) + t(506, 73, "US-analyst sees:", { bold: true, size: 8.2, fill: C.goodT });
    ["US · 120", "US · 95"].forEach((s, i) => b += t(420, 100 + i * 18, s, { a: "start", size: 7.4, mono: true, fill: C.goodT }));
    b += arrowR(166, 102, 194) + arrowR(376, 102, 404);
    b += box(16, 162, 590, 26, { r: 8, fill: C.card, stroke: C.snS }) + t(311, 179, "filters which rows a role sees, enforced on every query — central, not re-implemented per report", { size: 7.4, fill: C.snT });
    b += t(320, 206, "One policy isolates tenants/regions across all access paths — analysts can't see rows outside their scope.", { size: 7.5, fill: C.dim });
    return svg(220, b, "Row access policies");
  })();

  /* snow-tags — tag-based governance */
  D["snow-tags"] = (() => {
    let b = t(320, 20, "Object tags — govern by classification, at scale", { bold: true });
    b += box(16, 58, 150, 62, { r: 9, fill: C.acc, stroke: C.accS }) + t(91, 80, "PII columns", { bold: true, size: 8.8, fill: C.accT }) + t(91, 96, "email · ssn", { size: 7, mono: true, fill: C.dim }) + t(91, 108, "phone · …", { size: 7, mono: true, fill: C.dim });
    b += box(196, 58, 160, 62, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(276, 80, "tag", { bold: true, size: 9, fill: C.snT }) + t(276, 96, "classification = pii", { size: 7, mono: true, fill: C.dim }) + t(276, 109, "(set once per column)", { size: 6.6, fill: C.dim });
    b += box(386, 64, 110, 50, { r: 8 }) + t(441, 84, "1 policy", { bold: true, size: 8.6 }) + t(441, 98, "bound to tag", { size: 7, fill: C.dim });
    b += box(526, 64, 98, 50, { r: 8, fill: C.good, stroke: C.goodS }) + t(575, 84, "all governed", { bold: true, size: 8, fill: C.goodT }) + t(575, 98, "+ future auto", { size: 6.8, fill: C.dim });
    b += arrowR(166, 89, 194) + arrowR(356, 89, 384) + arrowR(496, 89, 524);
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "classify once → govern every tagged column (now & future); change the policy in one place", { size: 7.6, fill: C.warn });
    b += box(16, 182, 608, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(320, 198, "tags also power discovery, data classification, lineage & cost attribution across the account", { size: 7.4, fill: C.snT });
    b += t(320, 228, "Tag columns by meaning (pii, confidential); bind policies to the tag so governance scales with the data, not your effort.", { size: 7.5, fill: C.dim });
    return svg(242, b, "Object tags");
  })();

  /* snow-network-auth — network policies & identity */
  D["snow-network-auth"] = (() => {
    let b = t(320, 20, "Network policies & authentication", { bold: true });
    b += box(16, 68, 110, 46, { r: 8, fill: C.acc, stroke: C.accS }) + t(71, 88, "user / app", { bold: true, size: 8.6, fill: C.accT }) + t(71, 102, "from an IP", { size: 6.8, fill: C.dim });
    b += box(156, 60, 170, 62, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(241, 82, "network policy", { bold: true, size: 9, fill: C.snT }) + t(241, 98, "allowed IP ranges", { size: 7, fill: C.dim }) + t(241, 111, "(block the rest)", { size: 6.8, fill: C.dim });
    b += box(356, 60, 150, 62, { r: 9 }) + t(431, 82, "authentication", { bold: true, size: 8.6 }) + t(431, 98, "SSO · OAuth", { size: 7, fill: C.dim }) + t(431, 111, "MFA · key-pair", { size: 7, fill: C.dim });
    b += box(536, 68, 88, 46, { r: 8, fill: C.good, stroke: C.goodS }) + t(580, 88, "Snowflake", { bold: true, size: 8.4, fill: C.goodT }) + t(580, 102, "(authorized)", { size: 6.6, fill: C.dim });
    b += arrowR(126, 91, 154) + arrowR(326, 91, 354) + arrowR(506, 91, 534);
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "enforce MFA for human users (mandatory for ACCOUNTADMIN); key-pair auth for service accounts", { size: 7.5, fill: C.warn });
    b += box(16, 182, 608, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(320, 198, "+ secure views to hide logic · least-privilege roles · PrivateLink for private connectivity", { size: 7.4, fill: C.snT });
    b += t(320, 228, "Restrict where logins come from (network policy) and how identity is proven (SSO/MFA/key-pair) — perimeter + identity.", { size: 7.5, fill: C.dim });
    return svg(242, b, "Network and auth");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
