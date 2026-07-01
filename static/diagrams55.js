/* Datalith — diagram pack 55 (AWS deep-dive vol. 3: Athena in depth). */
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

  /* aws-athena-engine — serverless Trino, pay per scan */
  D["aws-athena-engine"] = (() => {
    let b = t(320, 20, "Athena — serverless SQL on S3, pay per data scanned", { bold: true });
    b += box(20, 56, 130, 72, { r: 9, fill: C.acc, stroke: C.accS }) + t(85, 76, "S3 data", { bold: true, size: 9, fill: C.accT }) + t(85, 94, "Parquet / JSON", { size: 7.2, fill: C.dim }) + t(85, 110, "+ Glue Catalog", { size: 7.2, fill: C.dim });
    b += box(186, 50, 180, 84, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(276, 70, "Athena (Trino engine)", { bold: true, size: 9, fill: C.awsT }) + t(276, 88, "no servers to manage", { size: 7.2, fill: C.dim }) + t(276, 102, "reads catalog → scans S3", { size: 7.2, fill: C.dim }) + t(276, 118, "ANSI SQL", { size: 7.2, mono: true, fill: C.dim });
    b += box(402, 56, 130, 72, { r: 9, fill: C.good, stroke: C.goodS }) + t(467, 76, "results", { bold: true, size: 9, fill: C.goodT }) + t(467, 94, "to S3 +", { size: 7.2, fill: C.dim }) + t(467, 108, "JDBC/console", { size: 7.2, fill: C.dim });
    b += box(550, 56, 74, 72, { r: 9, fill: C.dx || C.bad, stroke: C.awsS }) + t(587, 80, "$ per", { bold: true, size: 8, fill: C.awsT }) + t(587, 96, "TB", { bold: true, size: 8, fill: C.awsT }) + t(587, 112, "scanned", { size: 6.8, fill: C.dim });
    b += arrowR(150, 92, 184, { stroke: C.awsS }) + arrowR(366, 92, 400, { stroke: C.awsS }) + arrowR(532, 92, 548, { stroke: C.awsS });
    b += box(16, 152, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "cost = bytes scanned, so columnar + compression + partition pruning directly cut the bill; no infra to run", { size: 7.2, fill: C.warn });
    b += t(320, 198, "Athena is serverless Trino over the Glue Catalog: you pay per TB scanned, so reducing data read is the whole game.", { size: 7.1, fill: C.dim });
    return svg(212, b, "Athena engine");
  })();

  /* aws-athena-partitioning — projection */
  D["aws-athena-partitioning"] = (() => {
    let b = t(320, 20, "Partitioning & projection — prune to scan less", { bold: true });
    b += box(20, 52, 180, 92, { r: 9, fill: C.acc, stroke: C.accS }) + t(110, 70, "register partitions", { bold: true, size: 8.4, fill: C.accT }) + t(110, 88, "ADD PARTITION", { size: 7.4, mono: true, fill: C.dim }) + t(110, 102, "MSCK REPAIR TABLE", { size: 7.4, mono: true, fill: C.dim }) + t(110, 118, "crawler", { size: 7.4, mono: true, fill: C.dim }) + t(110, 134, "(metadata in catalog)", { size: 6.8, fill: C.dim });
    b += t(320, 70, "vs", { bold: true, size: 9, fill: C.dim });
    b += box(236, 52, 200, 92, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(336, 70, "partition projection", { bold: true, size: 8.6, fill: C.awsT }) + t(336, 88, "Athena computes partitions", { size: 7, fill: C.dim }) + t(336, 102, "from a path pattern", { size: 7, fill: C.dim }) + t(336, 120, "no ADD PARTITION,", { size: 7, fill: C.goodT }) + t(336, 132, "no crawler, instant", { size: 7, fill: C.goodT });
    b += box(456, 60, 168, 76, { r: 9, fill: C.good, stroke: C.goodS }) + t(540, 80, "WHERE year=2025", { bold: true, size: 7.8, mono: true, fill: C.goodT }) + t(540, 98, "→ reads only that", { size: 7, fill: C.dim }) + t(540, 110, "prefix (pruning)", { size: 7, fill: C.dim }) + t(540, 126, "huge cost saving", { size: 7, fill: C.awsT });
    b += arrowR(436, 98, 454, { stroke: C.awsS });
    b += box(16, 156, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 173, "projection is ideal for predictable date layouts: no partition management, new data queryable instantly, full pruning", { size: 7, fill: C.warn });
    b += t(320, 200, "Partitions let Athena skip data; projection computes them from the path so you skip partition management entirely.", { size: 7.1, fill: C.dim });
    return svg(214, b, "Athena partitioning and projection");
  })();

  /* aws-athena-ctas — CTAS / INSERT */
  D["aws-athena-ctas"] = (() => {
    let b = t(320, 20, "CTAS & INSERT INTO — transform with SQL", { bold: true });
    b += box(20, 58, 160, 70, { r: 9, fill: C.acc, stroke: C.accS }) + t(100, 78, "raw table", { bold: true, size: 8.6, fill: C.accT }) + t(100, 96, "CSV/JSON,", { size: 7.2, fill: C.dim }) + t(100, 108, "unpartitioned", { size: 7.2, fill: C.dim });
    b += box(212, 50, 196, 86, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(310, 70, "CREATE TABLE AS SELECT", { bold: true, size: 8.2, fill: C.awsT, mono: true }) + t(310, 88, "format='PARQUET',", { size: 7, mono: true, fill: C.dim }) + t(310, 100, "partitioned_by=...,", { size: 7, mono: true, fill: C.dim }) + t(310, 112, "bucketed_by=...", { size: 7, mono: true, fill: C.dim }) + t(310, 128, "(writes new S3 + catalog)", { size: 6.8, fill: C.dim });
    b += box(440, 58, 184, 70, { r: 9, fill: C.good, stroke: C.goodS }) + t(532, 78, "optimized table", { bold: true, size: 8.6, fill: C.goodT }) + t(532, 96, "Parquet, partitioned,", { size: 7, fill: C.dim }) + t(532, 108, "cheap to query", { size: 7, fill: C.dim });
    b += arrowR(180, 93, 210, { stroke: C.awsS }) + arrowR(408, 93, 438, { stroke: C.awsS });
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "CTAS converts raw → columnar/partitioned in one SQL statement; INSERT INTO appends — lightweight ELT inside Athena", { size: 7, fill: C.warn });
    b += t(320, 196, "CTAS and INSERT INTO let Athena do ELT: reshape raw data into optimized, partitioned Parquet tables with pure SQL.", { size: 7.1, fill: C.dim });
    return svg(210, b, "Athena CTAS");
  })();

  /* aws-athena-perf — cost/perf levers */
  D["aws-athena-perf"] = (() => {
    let b = t(320, 20, "Performance & cost — scan less, structure better", { bold: true });
    const rows = [["columnar + compression (Parquet/ZSTD)", "read only needed columns/bytes"], ["partition + projection", "prune to relevant prefixes"], ["compact files (128MB–1GB)", "fewer reads, less overhead"], ["select only needed columns", "never SELECT * on wide tables"], ["bucketing / sorting", "skip row groups on join/filter keys"], ["workgroups + per-query data limits", "govern cost, separate teams"]];
    rows.forEach(([h, d], i) => { const y = 50 + i * 26; b += box(34, y, 14, 14, { r: 3, fill: C.good, stroke: C.goodS }) + t(58, y + 12, h, { a: "start", size: 8, fill: C.goodT, bold: true }) + t(360, y + 12, d, { a: "start", size: 7.6, fill: C.dim }); });
    b += box(16, 210, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 226, "Athena bills per byte scanned — every lever here reduces bytes read, cutting both latency and cost", { size: 7.2, fill: C.warn });
    return svg(244, b, "Athena performance and cost");
  })();

  /* aws-athena-advanced — federation, UDF, Iceberg */
  D["aws-athena-advanced"] = (() => {
    let b = t(320, 20, "Advanced Athena — federation, UDFs, Iceberg", { bold: true });
    b += box(20, 54, 190, 92, { r: 9, fill: C.vio, stroke: C.vioS }) + t(115, 72, "federated queries", { bold: true, size: 8.6, fill: C.vioT }) + t(115, 90, "Lambda connectors to", { size: 7, fill: C.dim }) + t(115, 102, "RDS, DynamoDB,", { size: 7, fill: C.dim }) + t(115, 114, "Redshift, more", { size: 7, fill: C.dim }) + t(115, 132, "join across sources", { size: 7, fill: C.vioT });
    b += box(224, 54, 190, 92, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(319, 72, "Iceberg tables", { bold: true, size: 8.8, fill: C.awsT }) + t(319, 90, "ACID on the lake:", { size: 7, fill: C.dim }) + t(319, 102, "UPDATE / DELETE / MERGE", { size: 6.8, mono: true, fill: C.goodT }) + t(319, 116, "time travel, schema", { size: 7, fill: C.dim }) + t(319, 128, "evolution", { size: 7, fill: C.dim });
    b += box(428, 54, 196, 92, { r: 9, fill: C.good, stroke: C.goodS }) + t(526, 72, "UDFs & ML", { bold: true, size: 8.6, fill: C.goodT }) + t(526, 90, "Lambda UDFs in SQL,", { size: 7, fill: C.dim }) + t(526, 102, "SageMaker inference,", { size: 7, fill: C.dim }) + t(526, 116, "Spark (notebooks)", { size: 7, fill: C.dim }) + t(526, 130, "for big ETL", { size: 7, fill: C.dim });
    b += box(16, 158, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 175, "Athena goes beyond S3 SQL: query other stores in place, run ACID Iceberg tables, and call UDFs/ML from SQL", { size: 7, fill: C.warn });
    b += t(320, 202, "Federation queries external stores in place; Iceberg adds ACID/updates/time-travel; UDFs & Spark extend Athena's reach.", { size: 7, fill: C.dim });
    return svg(216, b, "Athena advanced features");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
