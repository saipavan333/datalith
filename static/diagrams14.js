/* Datalith — diagram add-on pack 14 (Foundations gold-standard set).
   Self-contained, inline-styled figures; merges into window.DIAGRAMS.
   Directional arrowheads (tri=right, triL=left, triU=up, triD=down) defined up front. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const circ=(cx,cy,r,o={})=>`<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw??1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const path=(dd,o={})=>`<path d="${dd}" style="fill:none;stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x},${y} ${x+4},${y+7}" style="fill:${o.fill||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x},${y} ${x+4},${y-7}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* ---------- found-what-is-de ---------- */
  D["de-role"] = (() => {
    let b = t(320, 20, "A data engineer builds the platform everyone else depends on", { bold: true });
    // sources
    b += box(20, 54, 130, 126, { r: 9 }) + t(85, 76, "SOURCES", { bold: true, fill: C.accT, size: 11 });
    ["apps & DBs (OLTP)", "APIs", "files", "events / IoT"].forEach((s, i) => b += t(85, 100 + i * 20, s, { size: 9.5, fill: C.dim }));
    // platform (highlighted)
    b += box(176, 44, 288, 146, { r: 10, fill: C.acc, stroke: C.accS });
    b += t(320, 68, "DATA ENGINEER", { bold: true, fill: C.accT, size: 13 });
    b += t(320, 88, "ingest → store → transform → serve", { size: 10, fill: C.goodT });
    ["• build & operate pipelines", "• model raw → trusted tables", "• quality · governance · cost"].forEach((s, i) => b += t(196, 116 + i * 22, s, { a: "start", size: 10 }));
    // consumers
    b += box(490, 54, 130, 126, { r: 9, fill: C.good, stroke: C.goodS }) + t(555, 76, "CONSUMERS", { bold: true, fill: C.goodT, size: 11 });
    ["analysts (BI)", "data scientists", "ML / AI", "apps (reverse ETL)"].forEach((s, i) => b += t(555, 100 + i * 20, s, { size: 9.5, fill: C.dim }));
    b += arrowR(152, 117, 174);
    b += arrowR(466, 117, 488);
    b += t(320, 208, "you build the kitchen — clean, reliable, accessible data — so analysts, scientists & ML can cook", { fill: C.dim, size: 10 });
    return svg(224, b, "The data engineer role");
  })();

  /* ---------- found-data-types ---------- */
  D["data-shapes"] = (() => {
    let b = t(320, 20, "Three shapes of data — the shape dictates the store", { bold: true });
    const col = (x, name, nc, l1, l2, eg, store) => {
      let s = box(x, 46, 188, 150, { r: 10, fill: nc.f, stroke: nc.s }) + t(x + 94, 70, name, { bold: true, fill: nc.t, size: 12 });
      s += t(x + 94, 94, l1, { size: 10 }) + t(x + 94, 112, l2, { size: 10, fill: C.dim });
      s += ln(x + 20, 126, x + 168, 126, { stroke: nc.s });
      s += t(x + 94, 146, eg, { size: 9.5, fill: C.dim });
      s += box(x + 20, 158, 148, 30, { r: 7 }) + t(x + 94, 177, store, { size: 9.5, fill: C.tx });
      return s;
    };
    b += col(20, "STRUCTURED", { f: C.acc, s: C.accS, t: C.accT }, "rows + typed columns", "fixed schema", "e.g. DB tables, CSV", "→ warehouse / SQL");
    b += col(226, "SEMI-STRUCTURED", { f: C.warnFill, s: C.warn, t: C.warn }, "flexible, self-describing", "nested, can evolve", "e.g. JSON, logs, XML", "→ lake / document DB");
    b += col(432, "UNSTRUCTURED", { f: C.bad, s: C.badS, t: C.badT }, "no predefined model", "raw bytes", "e.g. text, images, audio", "→ object storage + ML");
    b += t(320, 214, "structured = easiest to query · semi/unstructured are growing fast · the lakehouse holds all three", { fill: C.dim, size: 10 });
    return svg(230, b, "Structured vs semi vs unstructured data");
  })();

  /* ---------- found-bits-bytes ---------- */
  D["bytes-encoding"] = (() => {
    let b = t(320, 20, "Text → bytes: get the encoding right", { bold: true });
    b += box(24, 44, 150, 44, { r: 8 }) + t(99, 64, "bit = 0 / 1", { bold: true, size: 11 }) + t(99, 79, "the atom", { size: 9, fill: C.dim });
    b += box(214, 44, 196, 44, { r: 8 }) + t(312, 64, "byte = 8 bits", { bold: true, size: 11 }) + t(312, 79, "256 possible values", { size: 9, fill: C.dim });
    b += box(450, 44, 166, 44, { r: 8 }) + t(533, 64, "char ⇒ encoding", { bold: true, size: 11 }) + t(533, 79, "rules: text→bytes", { size: 9, fill: C.dim });
    b += arrowR(174, 66, 212);
    b += arrowR(410, 66, 448);
    b += t(320, 116, "'A' (ASCII) → 41 · 'é' (UTF-8) → C3 A9 · UTF-8 encodes every language & emoji in 1–4 bytes", { size: 10, fill: C.tx });
    b += box(24, 136, 286, 36, { r: 8, fill: C.good, stroke: C.goodS }) + t(167, 159, "write UTF-8 → read UTF-8  =  café", { fill: C.goodT, size: 10.5 });
    b += box(330, 136, 286, 36, { r: 8, fill: C.bad, stroke: C.badS }) + t(473, 159, "write UTF-8 → read Latin-1  =  cafÃ©", { fill: C.badT, size: 10.5 });
    b += t(320, 196, "use UTF-8 end to end · always declare the encoding on read (encoding='utf-8')", { fill: C.dim, size: 10 });
    return svg(212, b, "Bits, bytes and encodings");
  })();

  /* ---------- found-compression ---------- */
  D["compression-tradeoff"] = (() => {
    let b = t(320, 20, "Compression codecs: ratio vs speed", { bold: true });
    b += t(320, 44, "pick by what's scarce: CPU / scan-heavy → fast · storage / transfer → high ratio", { size: 10, fill: C.dim });
    // axis
    b += ln(70, 110, 570, 110, { sw: 2 }) + triL(70, 110) + tri(570, 110);
    b += t(70, 128, "FAST (low CPU)", { size: 9.5, fill: C.goodT });
    b += t(570, 128, "HIGH RATIO (more CPU)", { size: 9.5, fill: C.accT });
    const mark = (x, name, sub, up) => circ(x, 110, 5, { fill: C.accS, stroke: C.accS }) +
      t(x, up ? 92 : 150, name, { bold: true, size: 10.5 }) + t(x, up ? 80 : 164, sub, { size: 8.5, fill: C.dim });
    b += mark(135, "Snappy / LZ4", "analytics default", true);
    b += mark(300, "Zstd", "tunable: ratio + speed", false);
    b += mark(430, "gzip", "files / archive", true);
    b += mark(545, "bzip2", "rare (slow)", false);
    b += box(40, 182, 560, 34, { r: 8 }) + t(320, 203, "splittability: gzip = NOT splittable (1 big file → 1 worker) · Parquet + Snappy/Zstd = parallel block reads", { size: 9.5, fill: C.tx });
    return svg(228, b, "Compression ratio vs speed");
  })();

  /* ---------- found-serialization ---------- */
  D["serialization-formats"] = (() => {
    let b = t(320, 20, "Serialization: pick the format for the job", { bold: true });
    const X = [24, 150, 250, 342, 442, 616];     // column edges
    const cx = [(X[0]+X[1])/2, (X[1]+X[2])/2, (X[2]+X[3])/2, (X[3]+X[4])/2, (X[4]+X[5])/2];
    const Y = 44, RH = 28, rows = 4;
    b += box(24, Y, 592, RH * (rows + 1), { r: 9 });
    // header
    b += box(24, Y, 592, RH, { r: 9, fill: C.acc, stroke: C.accS });
    ["Format", "Type", "Layout", "Schema", "Best for"].forEach((h, i) => b += t(cx[i], Y + 19, h, { bold: true, fill: C.accT, size: 10.5 }));
    const data = [
      ["JSON", "text", "row", "none", "APIs, config"],
      ["Avro", "binary", "row", "yes (+evolve)", "Kafka / data files"],
      ["Protobuf", "binary", "row", "yes", "fast RPC (gRPC)"],
      ["Parquet", "binary", "columnar", "yes", "analytics storage"]];
    data.forEach((r, ri) => {
      const y = Y + RH * (ri + 1);
      if (ri % 2) b += `<rect x="24" y="${y}" width="592" height="${RH}" style="fill:#1b2230"/>`;
      r.forEach((c, ci) => b += t(cx[ci], y + 19, c, { size: 9.8, bold: ci === 0, fill: ci === 0 ? C.tx : C.dim }));
    });
    // column separators
    [1, 2, 3, 4].forEach(i => b += ln(X[i], Y, X[i], Y + RH * (rows + 1), { stroke: C.boxS, sw: 1 }));
    // row separators
    for (let i = 1; i <= rows; i++) b += ln(24, Y + RH * i, 616, Y + RH * i, { stroke: C.boxS, sw: 1 });
    b += t(320, Y + RH * (rows + 1) + 24, "text = readable & flexible · binary + schema = compact, fast, safe to evolve", { fill: C.dim, size: 10 });
    return svg(Y + RH * (rows + 1) + 40, b, "Serialization formats compared");
  })();

  /* ---------- found-distributed-basics ---------- */
  D["distributed-basics"] = (() => {
    let b = t(320, 20, "Scale across machines: partition · replicate · mind the network", { bold: true });
    b += box(255, 40, 130, 30, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 60, "DATA (1 TB)", { bold: true, fill: C.accT, size: 11 });
    const nodes = [["Node A", "P1 primary", "P3 replica", 30], ["Node B", "P2 primary", "P1 replica", 235], ["Node C", "P3 primary", "P2 replica", 440]];
    nodes.forEach(n => {
      const x = n[3], cxn = x + 85;
      b += box(x, 116, 170, 80, { r: 9 }) + t(cxn, 138, n[0], { bold: true, size: 11 });
      b += box(x + 16, 148, 138, 18, { r: 5, fill: C.good, stroke: C.goodS }) + t(cxn, 161, n[1], { size: 9, fill: C.goodT });
      b += box(x + 16, 170, 138, 18, { r: 5 }) + t(cxn, 183, n[2], { size: 9, fill: C.dim });
      b += path("M320 70 L" + cxn + " 116", { stroke: C.line }) + triD(cxn, 116);
    });
    b += t(320, 216, "partition for scale · replicate for availability · the network is the bottleneck → move compute to the data", { fill: C.dim, size: 9.5 });
    return svg(230, b, "Distributed systems basics");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
