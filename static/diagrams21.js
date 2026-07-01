/* Datalith — diagram pack 21 (DataOps, Governance, Performance, System Design extras). */
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

  /* dataops-testing-cicd */
  D["data-testing-cicd"] = (() => {
    let b = t(320, 20, "Data testing in CI/CD", { bold: true });
    const st = [["PR / commit", C.box, C.boxS, C.tx], ["CI: unit + data tests", C.acc, C.accS, C.accT], ["merge + deploy", C.box, C.boxS, C.tx], ["prod: runtime tests", C.good, C.goodS, C.goodT]];
    st.forEach((s, i) => { const x = 16 + i * 156; b += box(x, 54, 138, 44, { r: 8, fill: s[1], stroke: s[2] }) + t(x + 69, 80, s[0], { bold: i === 1 || i === 3, fill: s[3], size: 10.5 }); if (i < 3) b += arrowR(x + 138, 76, x + 154); });
    b += t(320, 124, "CI runs unit tests (logic) + data tests on a sample BEFORE merge; prod re-tests on every load", { fill: C.dim, size: 9.5 });
    b += box(40, 140, 560, 34, { r: 8, fill: C.bad, stroke: C.badS }) + t(320, 161, "test fails → block the merge / roll back → bad code & bad data never reach production", { size: 9.5, fill: C.badT });
    return svg(190, b, "Data testing in CI/CD");
  })();

  /* dataops-observability */
  D["data-slas"] = (() => {
    let b = t(320, 20, "Data SLAs, SLOs & error budgets", { bold: true });
    b += box(28, 50, 280, 84, { r: 10, fill: C.acc, stroke: C.accS }) + t(168, 72, "SLA — the promise", { bold: true, fill: C.accT, size: 12 });
    ["freshness < 1 hour", "completeness 100% of rows", "quality > 99% pass rate"].forEach((s, i) => b += t(168, 94 + i * 16, "• " + s, { size: 9.5, fill: C.dim }));
    b += box(332, 50, 280, 84, { r: 10, fill: C.good, stroke: C.goodS }) + t(472, 72, "SLO + error budget", { bold: true, fill: C.goodT, size: 12 });
    ["SLO = the internal target", "error budget = allowed breach", "burn it → freeze changes, fix"].forEach((s, i) => b += t(472, 94 + i * 16, "• " + s, { size: 9.5, fill: C.dim }));
    b += t(320, 160, "measure freshness/quality continuously → alert on SLA breach → consumers can trust the data", { fill: C.dim, size: 9.5 });
    return svg(176, b, "Data SLAs and SLOs");
  })();

  /* dataops-docker-k8s */
  D["kubernetes-data"] = (() => {
    let b = t(320, 20, "Containers & Kubernetes for data", { bold: true });
    b += box(24, 56, 150, 60, { r: 9, fill: C.acc, stroke: C.accS }) + t(99, 80, "Docker image", { bold: true, fill: C.accT, size: 11 }) + t(99, 100, "reproducible env", { size: 8.5, fill: C.dim });
    b += box(232, 48, 384, 92, { r: 10, fill: C.good, stroke: C.goodS }) + t(424, 70, "Kubernetes cluster", { bold: true, fill: C.goodT, size: 12 });
    [["pod", 260], ["pod", 340], ["pod", 420], ["pod", 500]].forEach(p => b += box(p[1], 82, 64, 26, { r: 6 }) + t(p[1] + 32, 99, p[0], { size: 9, fill: C.dim }));
    b += t(424, 128, "schedules pods on nodes · restarts failures · autoscales", { size: 8.5, fill: C.dim });
    b += arrowR(174, 86, 230);
    b += t(320, 162, "package once (image) → run anywhere identically · K8s handles scaling & self-healing", { fill: C.dim, size: 9.5 });
    return svg(176, b, "Kubernetes for data");
  })();

  /* dataops-secrets */
  D["secrets-mgmt"] = (() => {
    let b = t(320, 20, "Secrets & configuration management", { bold: true });
    b += box(28, 50, 584, 44, { r: 9, fill: C.bad, stroke: C.badS }) + t(320, 70, "NEVER: API_KEY = 'sk-123...' hard-coded in code", { size: 10.5, mono: true, fill: C.badT }) + t(320, 86, "→ committed to git → leaked forever (history!)", { size: 9, fill: C.dim });
    b += box(28, 106, 584, 60, { r: 9, fill: C.good, stroke: C.goodS }) + t(320, 128, "secrets manager (Vault / AWS Secrets Manager / env vars)", { bold: true, size: 11, fill: C.goodT });
    b += t(320, 148, "injected at runtime · rotated automatically · access-controlled & audited", { size: 9, fill: C.dim });
    b += t(320, 192, "keep secrets OUT of code & config files; never commit them; rotate on exposure", { fill: C.dim, size: 9.5 });
    return svg(206, b, "Secrets management");
  })();

  /* dataops-monitoring */
  D["monitoring-oncall"] = (() => {
    let b = t(320, 20, "Monitoring, alerting & on-call", { bold: true });
    const st = [["Monitor", "metrics · logs", C.acc, C.accS, C.accT], ["Detect", "anomaly vs normal", C.acc, C.accS, C.accT], ["Alert", "page / Slack by severity", C.warnFill, C.warn, C.warn], ["Respond", "runbook → fix", C.good, C.goodS, C.goodT], ["Postmortem", "blameless · learn", C.good, C.goodS, C.goodT]];
    st.forEach((s, i) => { const x = 14 + i * 124; b += box(x, 54, 112, 56, { r: 8, fill: s[2], stroke: s[3] }) + t(x + 56, 76, s[0], { bold: true, fill: s[4], size: 11 }) + t(x + 56, 94, s[1], { size: 7.6, fill: C.dim }); if (i < 4) b += arrowR(x + 112, 82, x + 122, { sw: 1.3 }); });
    b += path("M590 110 C590 146, 70 146, 70 112", { stroke: C.boxS, dash: true }) + triU(70, 112);
    b += t(330, 140, "feed lessons back into better monitoring", { size: 8.5, fill: C.dim });
    b += t(320, 178, "alert only on actionable signals · a runbook per alert · blameless postmortems improve the system", { fill: C.dim, size: 9.5 });
    return svg(192, b, "Monitoring and on-call");
  })();

  /* gov-privacy-compliance */
  D["privacy-compliance"] = (() => {
    let b = t(320, 20, "Privacy law & compliance (GDPR / PII)", { bold: true });
    b += box(230, 44, 180, 30, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 64, "PII / personal data", { bold: true, fill: C.accT, size: 11 });
    const rights = [["Right to access", C.good], ["Erasure (RTBF)", C.good], ["Portability", C.good], ["Consent / lawful basis", C.warn], ["Data minimization", C.warn], ["Breach notice (72h)", C.warn]];
    rights.forEach((r, i) => { const x = 24 + (i % 3) * 200, y = 92 + ((i / 3) | 0) * 40; b += box(x, y, 184, 30, { r: 7, fill: i < 3 ? C.good : C.warnFill, stroke: i < 3 ? C.goodS : C.warn }) + t(x + 92, y + 20, r[0], { size: 9.5, fill: i < 3 ? C.goodT : C.warn }); });
    b += t(320, 196, "subject rights (green) + controller obligations (amber) — design pipelines to honor deletes & consent", { fill: C.dim, size: 9.5 });
    return svg(210, b, "Privacy and GDPR");
  })();

  /* gov-mdm */
  D["mdm"] = (() => {
    let b = t(320, 20, "Master Data Management — the golden record", { bold: true });
    const src = [["CRM", "Jon Smith"], ["Billing", "Jonathan Smith"], ["Support", "J. Smith"]];
    src.forEach((s, i) => { const y = 46 + i * 44; b += box(24, y, 170, 36, { r: 8 }) + t(40, y + 16, s[0], { a: "start", bold: true, size: 10, fill: C.accT }) + t(40, y + 30, s[1], { a: "start", size: 9.5, fill: C.dim, mono: true }); b += arrowR(194, y + 18, 250); });
    b += box(252, 56, 150, 100, { r: 9, fill: C.acc, stroke: C.accS }) + t(327, 102, "MDM", { bold: true, fill: C.accT, size: 13 }) + t(327, 122, "match · merge · resolve", { size: 8.5, fill: C.dim });
    b += arrowR(402, 98, 444);
    b += box(446, 70, 170, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(531, 92, "Golden record", { bold: true, fill: C.goodT, size: 12 }) + t(531, 112, "one canonical customer", { size: 8.5, fill: C.dim });
    b += t(320, 196, "reconcile conflicting records across systems into one trusted source of truth per entity", { fill: C.dim, size: 9.5 });
    return svg(210, b, "Master data management");
  })();

  /* gov-compliance-frameworks */
  D["compliance-frameworks"] = (() => {
    let b = t(320, 20, "Compliance frameworks — who they protect", { bold: true });
    const fw = [["GDPR", "EU personal data / privacy", C.acc, C.accS, C.accT], ["HIPAA", "US health data (PHI)", C.acc, C.accS, C.accT], ["SOC 2", "security controls + audit", C.good, C.goodS, C.goodT], ["PCI-DSS", "payment card data", C.good, C.goodS, C.goodT], ["CCPA", "California consumer privacy", C.warnFill, C.warn, C.warn], ["ISO 27001", "infosec management", C.warnFill, C.warn, C.warn]];
    fw.forEach((f, i) => { const x = 24 + (i % 3) * 200, y = 46 + ((i / 3) | 0) * 64; b += box(x, y, 184, 54, { r: 9, fill: f[2], stroke: f[3] }) + t(x + 92, y + 24, f[0], { bold: true, fill: f[4], size: 13 }) + t(x + 92, y + 42, f[1], { size: 8.5, fill: C.dim }); });
    b += t(320, 192, "know which regulation applies to your data (privacy / health / payments / security) and design controls for it", { fill: C.dim, size: 9.5 });
    return svg(206, b, "Compliance frameworks");
  })();

  /* gov-classification-retention */
  D["classification-retention"] = (() => {
    let b = t(320, 20, "Data classification & retention", { bold: true });
    const cls = [["Public", "no harm if shared", C.good, C.goodS, C.goodT], ["Internal", "company-only", C.acc, C.accS, C.accT], ["Confidential", "PII / financials", C.warnFill, C.warn, C.warn], ["Restricted", "secrets / health", C.bad, C.badS, C.badT]];
    cls.forEach((cl, i) => { const x = 16 + i * 152; b += box(x, 48, 140, 50, { r: 9, fill: cl[2], stroke: cl[3] }) + t(x + 70, 70, cl[0], { bold: true, fill: cl[4], size: 12 }) + t(x + 70, 88, cl[1], { size: 8.5, fill: C.dim }); });
    b += t(320, 118, "more sensitive → stricter access, encryption, masking & audit →", { size: 9.5, fill: C.dim });
    b += box(40, 132, 560, 40, { r: 9 }) + t(320, 152, "Retention: keep per policy (e.g., 7 yrs) → then DELETE; legal hold pauses deletion; minimize what you keep", { size: 9.5, fill: C.tx }) + t(320, 167, "less data retained = less risk and lower cost", { size: 8.5, fill: C.dim });
    return svg(188, b, "Classification and retention");
  })();

  /* perf-mindset */
  D["perf-mindset"] = (() => {
    let b = t(320, 20, "Measure, then optimize", { bold: true });
    const st = [["1. Measure / profile", C.acc, C.accS, C.accT], ["2. Find the bottleneck", C.box, C.boxS, C.tx], ["3. Optimize it", C.good, C.goodS, C.goodT]];
    st.forEach((s, i) => { const x = 36 + i * 196; b += box(x, 58, 168, 44, { r: 9, fill: s[1], stroke: s[2] }) + t(x + 84, 84, s[0], { bold: true, fill: s[3], size: 11 }); if (i < 2) b += arrowR(x + 168, 80, x + 194); });
    b += path("M624 102 C624 138, 36 138, 120 104", { stroke: C.boxS, dash: true }) + triU(120, 104);
    b += t(330, 134, "re-measure — the bottleneck moves", { size: 8.5, fill: C.dim });
    b += t(320, 168, "don't guess: profile first · fix the BIGGEST bottleneck (Amdahl's law) · avoid premature optimization", { fill: C.dim, size: 9.5 });
    return svg(182, b, "Performance mindset");
  })();

  /* perf-cost */
  D["perf-cost"] = (() => {
    let b = t(320, 20, "Cost & scaling efficiency", { bold: true });
    b += box(60, 46, 520, 38, { r: 9, fill: C.acc, stroke: C.accS }) + t(320, 70, "cost ≈ compute-time × resources × data scanned", { bold: true, fill: C.accT, size: 13, mono: true });
    const lev = [["scan less", "partition · prune · columnar"], ["right-size", "match compute to the job"], ["spot / autoscale", "cheap, elastic capacity"], ["cache / precompute", "avoid repeat work"]];
    lev.forEach((l, i) => { const x = 24 + (i % 2) * 300, y = 100 + ((i / 2) | 0) * 44; b += box(x, y, 290, 36, { r: 8, fill: C.good, stroke: C.goodS }) + t(x + 14, y + 16, l[0], { a: "start", bold: true, size: 10, fill: C.goodT }) + t(x + 14, y + 30, l[1], { a: "start", size: 8.5, fill: C.dim }); });
    b += t(320, 210, "the cheapest query is the one that scans the least data — efficiency IS cost control", { fill: C.dim, size: 9.5 });
    return svg(224, b, "Cost and scaling efficiency");
  })();

  /* sd-batch-vs-stream-choice */
  D["batch-stream-choice"] = (() => {
    let b = t(320, 20, "Batch vs streaming — let latency decide", { bold: true });
    const z = [["Streaming", "seconds", "Flink / Kafka", C.bad, C.badS, C.badT], ["Micro-batch", "minutes", "Spark Structured Streaming", C.warnFill, C.warn, C.warn], ["Batch", "hours / daily", "Spark / dbt / SQL", C.good, C.goodS, C.goodT]];
    z.forEach((zz, i) => { const x = 20 + i * 202; b += box(x, 50, 190, 76, { r: 10, fill: zz[3], stroke: zz[4] }) + t(x + 95, 74, zz[0], { bold: true, fill: zz[5], size: 13 }) + t(x + 95, 96, "latency: " + zz[1], { size: 9.5, fill: C.dim }) + t(x + 95, 114, zz[2], { size: 9, fill: C.dim }); });
    b += t(320, 152, "← lower latency = higher cost & complexity   ·   higher latency = cheaper & simpler →", { size: 9.5, fill: C.dim });
    b += t(320, 178, "ask: what freshness does the use case truly need? don't stream what a daily batch can serve", { fill: C.warn, size: 9.5 });
    return svg(192, b, "Batch vs streaming choice");
  })();

  /* sd-capacity-estimation */
  D["capacity-estimation"] = (() => {
    let b = t(320, 20, "Capacity & cost estimation (back-of-envelope)", { bold: true });
    const steps = [["50M events", "/day"], ["× 500 B", "/event"], ["= 25 GB", "/day"], ["× 365", "= ~9 TB/yr"]];
    steps.forEach((s, i) => { const x = 20 + i * 152; b += box(x, 54, 130, 44, { r: 8, fill: i === 3 ? C.good : C.acc, stroke: i === 3 ? C.goodS : C.accS }) + t(x + 65, 76, s[0], { bold: true, fill: i === 3 ? C.goodT : C.accT, size: 11, mono: true }) + t(x + 65, 91, s[1], { size: 8.5, fill: C.dim, mono: true }); if (i < 3) b += arrowR(x + 130, 76, x + 152 - 2); });
    b += box(40, 118, 560, 40, { r: 9 }) + t(320, 138, "then adjust: ÷ compression (columnar ~5×) · × replication (2–3×) · QPS = events ÷ 86,400", { size: 9.5, fill: C.tx }) + t(320, 153, "state your assumptions out loud — the method matters more than the exact number", { size: 8.5, fill: C.dim });
    return svg(174, b, "Capacity estimation");
  })();

  /* sd-storage-selection */
  D["storage-selection"] = (() => {
    let b = t(320, 20, "Choose the store by access pattern", { bold: true });
    const rows = [["point read/write (OLTP)", "RDBMS — Postgres/MySQL"], ["big scans & aggregations", "warehouse / lakehouse"], ["key lookup / cache", "key-value — Redis/DynamoDB"], ["full-text search", "search — Elasticsearch"], ["similarity / embeddings", "vector DB — pgvector/Pinecone"], ["event stream / log", "Kafka"]];
    rows.forEach((r, i) => { const y = 44 + i * 26; b += `<rect x="24" y="${y}" width="592" height="24" rx="5" style="fill:${i % 2 ? "#1b2230" : C.box}"/>`; b += t(40, y + 17, r[0], { a: "start", size: 9.5, fill: C.dim }); b += t(330, y + 17, "→", { size: 10, fill: C.line }); b += t(360, y + 17, r[1], { a: "start", size: 9.5, fill: C.accT, bold: true }); });
    b += t(320, 222, "no 'best' database — match the store to how the data is written and read", { fill: C.dim, size: 9.5 });
    return svg(236, b, "Storage selection");
  })();

  /* sd-interview-process */
  D["interview-process"] = (() => {
    let b = t(320, 20, "Acing the DE system-design interview", { bold: true });
    const st = [["1. Clarify", "requirements, scale, SLAs"], ["2. High-level", "sketch the pipeline"], ["3. Deep dive", "key components"], ["4. Scale", "& trade-offs"], ["5. Wrap up", "risks, next steps"]];
    st.forEach((s, i) => { const x = 14 + i * 124; b += box(x, 52, 112, 50, { r: 8, fill: C.acc, stroke: C.accS }) + t(x + 56, 73, s[0], { bold: true, fill: C.accT, size: 10.5 }) + t(x + 56, 90, s[1], { size: 7.6, fill: C.dim }); if (i < 4) b += arrowR(x + 112, 77, x + 122, { sw: 1.3 }); });
    b += box(40, 122, 560, 38, { r: 9, fill: C.good, stroke: C.goodS }) + t(320, 142, "behavioral: answer with STAR — Situation · Task · Action · Result", { size: 10, fill: C.goodT }) + t(320, 156, "think out loud, state assumptions & trade-offs — there's no single right answer", { size: 8.5, fill: C.dim });
    return svg(176, b, "DE interview process");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
