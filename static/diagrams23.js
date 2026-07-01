/* Datalith — diagram pack 23 (Cloud foundations: why cloud, service models, architecture). */
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
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* cloud-fundamentals */
  D["cloud-value"] = (() => {
    let b = t(320, 20, "Why cloud? On-prem vs cloud", { bold: true });
    b += box(28, 48, 250, 96, { r: 10, fill: C.bad, stroke: C.badS }) + t(153, 70, "On-premises", { bold: true, fill: C.badT, size: 12 });
    ["buy/rack/maintain servers", "CapEx · fixed capacity", "you manage everything", "weeks to provision · regional"].forEach((s, i) => b += t(153, 90 + i * 15, "• " + s, { size: 9, fill: C.dim }));
    b += box(362, 48, 250, 96, { r: 10, fill: C.good, stroke: C.goodS }) + t(487, 70, "Cloud", { bold: true, fill: C.goodT, size: 12 });
    ["rent — pay-as-you-go (OpEx)", "elastic · scale up/down", "managed services", "minutes to provision · global"].forEach((s, i) => b += t(487, 90 + i * 15, "• " + s, { size: 9, fill: C.dim }));
    b += arrowR(278, 96, 360);
    const dep = [["Public", 60], ["Private", 210], ["Hybrid", 360], ["Multi-cloud", 510]];
    dep.forEach(d => b += box(d[1], 158, 120, 26, { r: 7, fill: C.acc, stroke: C.accS }) + t(d[1] + 60, 175, d[0], { size: 9.5, fill: C.accT }));
    b += t(320, 206, "value: elasticity · pay-per-use · managed services · global reach · speed · deployment models above", { fill: C.dim, size: 9.5 });
    return svg(220, b, "Why cloud");
  })();

  /* cloud-service-models */
  D["service-models"] = (() => {
    let b = t(320, 20, "Service models — who manages what", { bold: true });
    const cols = [["On-prem", 5, "your servers"], ["IaaS", 4, "VMs — EC2, Compute Engine"], ["PaaS", 2, "managed runtime — RDS, App Engine"], ["SaaS", 0, "ready apps — Gmail, Snowflake"]];
    cols.forEach((c, i) => {
      const x = 24 + i * 150, total = 130, yTop = 50;
      const youH = c[1] / 5 * total;
      if (youH > 0) b += box(x, yTop, 130, youH, { r: 6, fill: C.acc, stroke: C.accS }) + t(x + 65, yTop + youH / 2 + 4, "YOU manage", { size: 9, fill: C.accT, bold: true });
      const provY = yTop + youH, provH = total - youH;
      if (provH > 0) b += box(x, provY, 130, provH, { r: 6, fill: C.good, stroke: C.goodS }) + t(x + 65, provY + provH / 2 + 4, "provider", { size: 9, fill: C.goodT, bold: true });
      b += t(x + 65, yTop + total + 18, c[0], { bold: true, size: 11 }) + t(x + 65, yTop + total + 32, c[2], { size: 7.6, fill: C.dim });
    });
    b += t(320, 224, "more you manage ← IaaS · PaaS · SaaS → more the provider manages (control vs convenience)", { fill: C.dim, size: 9.5 });
    return svg(238, b, "IaaS PaaS SaaS");
  })();

  /* cloud-architecture */
  D["cloud-architecture"] = (() => {
    let b = t(320, 20, "Cloud architecture — regions, AZs & shared responsibility", { bold: true });
    b += box(40, 44, 360, 74, { r: 10, fill: C.acc, stroke: C.accS }) + t(220, 60, "Region (e.g. us-east-1)", { bold: true, fill: C.accT, size: 11 });
    [["AZ a", 48], ["AZ b", 168], ["AZ c", 288]].forEach(z => b += box(z[1], 74, 104, 34, { r: 7 }) + t(z[1] + 52, 88, z[0], { size: 9, fill: C.tx }) + t(z[1] + 52, 101, "data center", { size: 7.5, fill: C.dim }));
    b += box(420, 44, 196, 74, { r: 10 }) + t(518, 66, "deploy across AZs", { bold: true, size: 10.5, fill: C.tx }) + t(518, 86, "→ high availability", { size: 9, fill: C.dim }) + t(518, 102, "survive a data-center loss", { size: 8.5, fill: C.dim });
    b += box(40, 132, 280, 50, { r: 9, fill: C.good, stroke: C.goodS }) + t(180, 152, "Provider secures OF the cloud", { bold: true, fill: C.goodT, size: 10 }) + t(180, 170, "hardware · network · hypervisor", { size: 8.5, fill: C.dim });
    b += box(336, 132, 280, 50, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(476, 152, "YOU secure IN the cloud", { bold: true, fill: C.warn, size: 10 }) + t(476, 170, "data · access (IAM) · config · apps", { size: 8.5, fill: C.dim });
    b += t(320, 206, "regions = geography · AZs = isolated data centers (deploy multi-AZ for HA) · shared responsibility model", { fill: C.dim, size: 9.5 });
    return svg(220, b, "Cloud architecture");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
