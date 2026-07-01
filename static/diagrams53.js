/* DataForge Academy — diagram pack 53 (AWS deep-dive vol. 1: S3 in depth). */
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

  /* aws-s3-layout — lake zones + partitioning */
  D["aws-s3-layout"] = (() => {
    let b = t(320, 20, "S3 data-lake layout — zones, prefixes, partitioning", { bold: true });
    [["raw", "as-ingested", C.acc, C.accS], ["clean", "validated, Parquet", C.vio, C.vioS], ["curated", "modeled, serving", C.good, C.goodS]].forEach(([z, d, f, st], i) => { const x = 24 + i * 158; b += box(x, 54, 140, 56, { r: 9, fill: f, stroke: st }) + t(x + 70, 74, z + "/", { bold: true, size: 9.5, fill: C.tx, mono: true }) + t(x + 70, 92, d, { size: 7.2, fill: C.dim }); if (i < 2) b += arrowR(x + 140, 82, x + 158 - 2, { stroke: C.awsS }); });
    b += box(498, 54, 126, 56, { r: 9, fill: C.aws, stroke: C.awsS }) + t(561, 74, "Athena /", { size: 8, fill: C.awsT }) + t(561, 90, "Glue / Redshift", { size: 8, fill: C.awsT }) + t(561, 104, "read curated", { size: 6.8, fill: C.dim });
    b += arrowR(478, 82, 496, { stroke: C.awsS });
    b += box(24, 126, 600, 40, { r: 8, fill: C.box, stroke: C.boxS }) + t(40, 144, "s3://lake/clean/orders/year=2025/month=05/day=01/part-0001.parquet", { a: "start", size: 8, mono: true, fill: C.awsT }) + t(40, 159, "Hive-style partition prefixes → engines prune by folder; aim for 128 MB–1 GB columnar files", { a: "start", size: 7.2, fill: C.dim });
    b += box(16, 178, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 194, "S3 has no real folders — prefixes are the partition scheme; good partitioning + file sizing = cheap, fast queries", { size: 7.2, fill: C.warn });
    b += t(320, 222, "Organize the lake in raw→clean→curated zones with partitioned prefixes and right-sized files; engines read it directly.", { size: 7.2, fill: C.dim });
    return svg(236, b, "S3 data lake layout");
  })();

  /* aws-s3-storage-classes — tiers + lifecycle */
  D["aws-s3-storage-classes"] = (() => {
    let b = t(320, 20, "Storage classes & lifecycle — cost vs access", { bold: true });
    const tiers = [["Standard", "hot, ms", C.good], ["Standard-IA", "warm, ms", C.acc], ["Glacier IR", "cold, ms", C.vio], ["Glacier Flex", "archive, min-hr", C.box], ["Deep Archive", "frozen, hours", C.bad]];
    tiers.forEach(([n, d], i) => { const x = 16 + i * 124; b += box(x, 56, 112, 50, { r: 8, fill: tiers[i][2], stroke: C.boxS }) + t(x + 56, 76, n, { bold: true, size: 8, fill: C.tx }) + t(x + 56, 92, d, { size: 6.8, fill: C.dim }); if (i < 4) b += arrowR(x + 112, 81, x + 124 - 2, { stroke: C.awsS }); });
    b += t(56, 124, "$ higher", { size: 7.4, fill: C.goodT }) + t(584, 124, "$ lower / slower", { size: 7.4, fill: C.badT });
    b += ln(16, 132, 624, 132, { stroke: C.boxS, sw: 1 });
    b += box(16, 144, 608, 28, { r: 8, fill: C.aws, stroke: C.awsS }) + t(320, 160, "lifecycle policy: transition objects to colder tiers after N days, expire after M — automatic cost control", { size: 7.4, fill: C.awsT }) + t(320, 169, "Intelligent-Tiering auto-moves objects by access pattern (no policy, small monitoring fee)", { size: 7, fill: C.dim });
    b += box(16, 180, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 196, "match tier to access frequency; lifecycle rules + Intelligent-Tiering cut storage cost without manual moves", { size: 7.2, fill: C.warn });
    return svg(216, b, "S3 storage classes and lifecycle");
  })();

  /* aws-s3-security — access + encryption */
  D["aws-s3-security"] = (() => {
    let b = t(320, 20, "S3 security — layered access + encryption", { bold: true });
    b += t(165, 46, "who can access", { bold: true, size: 8.6, fill: C.accT });
    ["IAM policy (identity)", "bucket policy (resource)", "Block Public Access (guardrail)", "access points (per-app rules)", "VPC endpoint (private network)"].forEach((s, i) => b += box(28, 56 + i * 24, 280, 20, { r: 5, fill: C.acc, stroke: C.accS, sw: 1.1 }) + t(40, 70 + i * 24, s, { a: "start", size: 7.6, fill: C.accT }));
    b += t(475, 46, "encryption", { bold: true, size: 8.6, fill: C.goodT });
    [["SSE-S3", "AWS-managed keys (default)"], ["SSE-KMS", "your KMS key + audit/rotation"], ["SSE-C", "you supply the key"], ["in transit", "TLS / HTTPS enforced"]].forEach(([h, d], i) => b += box(332, 56 + i * 28, 292, 24, { r: 6, fill: C.good, stroke: C.goodS, sw: 1.1 }) + t(344, 72 + i * 28, h + " — " + d, { a: "start", size: 7.4, fill: C.goodT }));
    b += box(16, 188, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 205, "least-privilege IAM + bucket policy, Block Public Access ON, default encryption (KMS for sensitive) — the baseline", { size: 7.1, fill: C.warn });
    return svg(226, b, "S3 security and encryption");
  })();

  /* aws-s3-performance — scale + multipart */
  D["aws-s3-performance"] = (() => {
    let b = t(320, 20, "S3 performance — prefixes scale, multipart, S3 Select", { bold: true });
    b += box(20, 54, 250, 80, { r: 9, fill: C.acc, stroke: C.accS }) + t(145, 72, "request rate scales per prefix", { bold: true, size: 8, fill: C.accT }) + t(145, 90, "5,500 GET + 3,500 PUT", { size: 7.6, mono: true, fill: C.dim }) + t(145, 102, "per prefix, per second", { size: 7.2, fill: C.dim }) + t(145, 122, "spread keys → more parallelism", { size: 7, fill: C.awsT });
    b += box(290, 46, 160, 50, { r: 8, fill: C.aws, stroke: C.awsS }) + t(370, 64, "multipart upload", { bold: true, size: 8.2, fill: C.awsT }) + t(370, 80, "split big object → parallel", { size: 7, fill: C.dim }) + t(370, 90, "parts; resumable", { size: 7, fill: C.dim });
    b += box(290, 102, 160, 44, { r: 8, fill: C.vio, stroke: C.vioS }) + t(370, 120, "S3 Select / byte-range", { bold: true, size: 8, fill: C.vioT }) + t(370, 136, "read only needed bytes", { size: 7, fill: C.dim });
    b += box(470, 54, 154, 92, { r: 9, fill: C.good, stroke: C.goodS }) + t(547, 72, "also", { bold: true, size: 8.2, fill: C.goodT }) + t(547, 90, "Transfer Accel.", { size: 7.2, fill: C.dim }) + t(547, 104, "(edge uploads)", { size: 6.8, fill: C.dim }) + t(547, 122, "retry w/ backoff", { size: 7.2, fill: C.dim }) + t(547, 136, "on 503 slowdown", { size: 6.8, fill: C.dim });
    b += box(16, 160, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 177, "S3 scales ~infinitely if you spread load across prefixes; multipart for large objects; read less with Select/byte-range", { size: 7.1, fill: C.warn });
    b += t(320, 206, "Performance is about parallelism: distribute keys across prefixes, upload in parts, and fetch only the bytes you need.", { size: 7.1, fill: C.dim });
    return svg(220, b, "S3 performance and scale");
  })();

  /* aws-s3-events — event-driven + replication */
  D["aws-s3-events"] = (() => {
    let b = t(320, 20, "Event-driven S3 — notifications & replication", { bold: true });
    b += box(20, 56, 130, 64, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(85, 78, "object created", { bold: true, size: 8.4, fill: C.awsT }) + t(85, 96, "(PUT to bucket)", { size: 7.2, fill: C.dim }) + t(85, 110, "S3 event", { size: 7.2, mono: true, fill: C.dim });
    b += box(186, 50, 150, 78, { r: 9, fill: C.box, stroke: C.boxS }) + t(261, 68, "notification target", { bold: true, size: 8.2, fill: C.tx });
    ["Lambda (process)", "SQS (queue)", "SNS (fan-out)", "EventBridge (route)"].forEach((s, i) => b += t(202, 84 + i * 12, "• " + s, { a: "start", size: 7.2, fill: C.dim }));
    b += box(372, 60, 144, 58, { r: 9, fill: C.good, stroke: C.goodS }) + t(444, 80, "downstream", { bold: true, size: 8.4, fill: C.goodT }) + t(444, 98, "trigger Glue/ETL,", { size: 7, fill: C.dim }) + t(444, 110, "update catalog", { size: 7, fill: C.dim });
    b += arrowR(150, 88, 184, { stroke: C.awsS }) + arrowR(336, 88, 370, { stroke: C.awsS });
    b += box(536, 60, 88, 58, { r: 9, fill: C.vio, stroke: C.vioS }) + t(580, 80, "replication", { bold: true, size: 7.8, fill: C.vioT }) + t(580, 96, "CRR / SRR", { size: 7, fill: C.dim }) + t(580, 108, "DR / latency", { size: 6.8, fill: C.dim });
    b += box(16, 144, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 161, "new objects fire events → serverless pipelines react instantly (no polling); replication copies data cross-region/bucket", { size: 7, fill: C.warn });
    b += t(320, 190, "S3 events turn the lake into an event source: a file landing can automatically kick off ingestion or cataloging.", { size: 7.1, fill: C.dim });
    return svg(204, b, "Event-driven S3");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
