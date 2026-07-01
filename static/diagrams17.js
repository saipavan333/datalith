/* DataForge Academy — diagram pack 17 (Python professional, engineering & stdlib). */
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

  /* py-dates */
  D["py-datetime"] = (() => {
    let b = t(320, 20, "Dates & time: store UTC, convert for display", { bold: true });
    b += box(24, 54, 150, 42, { r: 8 }) + t(99, 78, "'2024-03-15", { size: 10, mono: true }) + t(99, 92, "T14:30Z'", { size: 10, mono: true });
    b += box(232, 54, 168, 42, { r: 8, fill: C.acc, stroke: C.accS }) + t(316, 76, "datetime (UTC)", { bold: true, fill: C.accT, size: 11 }) + t(316, 90, "aware: has tzinfo", { size: 8.5, fill: C.dim });
    b += box(458, 54, 158, 42, { r: 8, fill: C.good, stroke: C.goodS }) + t(537, 76, "10:30 EDT", { bold: true, fill: C.goodT, size: 11 }) + t(537, 90, "local, for display", { size: 8.5, fill: C.dim });
    b += arrowR(174, 75, 230) + t(202, 67, "parse", { size: 8, fill: C.dim });
    b += arrowR(400, 75, 456) + t(428, 67, "astimezone", { size: 8, fill: C.dim });
    b += box(24, 116, 290, 36, { r: 8, fill: C.bad, stroke: C.badS }) + t(169, 138, "NAIVE = no tzinfo → bug-prone", { size: 10, fill: C.badT });
    b += box(326, 116, 290, 36, { r: 8, fill: C.good, stroke: C.goodS }) + t(471, 138, "AWARE = tzinfo attached → safe", { size: 10, fill: C.goodT });
    b += t(320, 174, "parse: strptime / fromisoformat · format: strftime / isoformat · use now(timezone.utc)", { fill: C.dim, size: 9.5, mono: true });
    return svg(188, b, "Python datetime");
  })();

  /* py-functional */
  D["py-functional"] = (() => {
    let b = t(320, 20, "map / filter / reduce", { bold: true });
    const stages = [["[1,2,3,4,5]", C.box, C.boxS, C.tx], ["map(x²)", C.acc, C.accS, C.accT], ["filter(even)", C.acc, C.accS, C.accT], ["reduce(+)", C.good, C.goodS, C.goodT]];
    const outs = ["", "[1,4,9,16,25]", "[4,16]", "20"];
    stages.forEach((s, i) => {
      const x = 24 + i * 152;
      b += box(x, 62, 132, 40, { r: 8, fill: s[1], stroke: s[2] }) + t(x + 66, 86, s[0], { bold: i > 0, fill: s[3], size: 11, mono: true });
      if (outs[i]) b += t(x + 66, 122, outs[i], { size: 9.5, mono: true, fill: C.goodT });
      if (i < 3) b += arrowR(x + 132, 82, x + 176 - 0);
    });
    b += t(320, 158, "map applies · filter keeps matches · reduce folds to one value (functools.reduce)", { fill: C.dim, size: 10 });
    b += t(320, 178, "in Python, comprehensions often read better than map/filter", { fill: C.warn, size: 9.5 });
    return svg(192, b, "Functional Python");
  })();

  /* py-venv-packaging */
  D["py-venv"] = (() => {
    let b = t(320, 20, "Virtual environments & reproducible deps", { bold: true });
    b += box(34, 50, 250, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(159, 72, "Project A · .venv", { bold: true, fill: C.accT, size: 11 }) + t(159, 92, "pandas==2.1", { size: 10, mono: true, fill: C.dim });
    b += box(356, 50, 250, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(481, 72, "Project B · .venv", { bold: true, fill: C.goodT, size: 11 }) + t(481, 92, "pandas==1.5", { size: 10, mono: true, fill: C.dim });
    b += t(320, 80, "isolated", { size: 9, fill: C.dim }) + t(320, 94, "no clash", { size: 9, fill: C.dim });
    b += box(150, 128, 340, 34, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 149, "lockfile: pinned versions (pip freeze / poetry.lock)", { size: 10, fill: C.warn });
    b += path("M159 106 V126", { stroke: C.boxS }) + triD(159, 126);
    b += path("M481 106 V126", { stroke: C.boxS }) + triD(481, 126);
    b += t(320, 184, "same pinned env builds identically in dev, CI & prod — kills 'works on my machine'", { fill: C.dim, size: 10 });
    return svg(198, b, "Virtual environments");
  })();

  /* py-testing */
  D["py-pytest"] = (() => {
    let b = t(320, 20, "Testing with pytest", { bold: true });
    const aaa = [["Arrange", "fixture / sample data", C.acc, C.accS, C.accT], ["Act", "call the function", C.box, C.boxS, C.tx], ["Assert", "result == expected", C.good, C.goodS, C.goodT]];
    aaa.forEach((s, i) => {
      const x = 30 + i * 200;
      b += box(x, 58, 168, 46, { r: 9, fill: s[2], stroke: s[3] }) + t(x + 84, 80, s[0], { bold: true, fill: s[4], size: 12 }) + t(x + 84, 96, s[1], { size: 8.5, fill: C.dim });
      if (i < 2) b += arrowR(x + 168, 81, x + 198);
    });
    b += box(30, 124, 250, 34, { r: 8 }) + t(155, 145, "@fixture → reusable setup", { size: 9.5, mono: true, fill: C.accT });
    b += box(308, 124, 298, 34, { r: 8 }) + t(457, 145, "@parametrize → many input→expected", { size: 9.5, mono: true, fill: C.goodT });
    b += t(320, 180, "test pure functions · keep I/O out of logic · cover edge cases (null, empty, dup)", { fill: C.dim, size: 10 });
    return svg(194, b, "pytest");
  })();

  /* py-decorators */
  D["py-decorator"] = (() => {
    let b = t(320, 20, "A decorator wraps a function", { bold: true });
    b += box(60, 50, 520, 120, { r: 12, fill: C.warnFill, stroke: C.warn });
    b += t(110, 74, "@retry  (wrapper)", { a: "start", bold: true, fill: C.warn, size: 12, mono: true });
    b += t(150, 100, "before: log / time / acquire", { a: "start", size: 9.5, fill: C.dim });
    b += box(220, 110, 200, 40, { r: 9, fill: C.acc, stroke: C.accS }) + t(320, 134, "original func()", { bold: true, fill: C.accT, size: 12, mono: true });
    b += t(470, 100, "after: retry / release / cache", { a: "end", size: 9.5, fill: C.dim });
    b += arrowR(120, 130, 218) + t(168, 122, "call", { size: 8.5, fill: C.dim });
    b += arrowR(420, 130, 520) + t(472, 122, "result", { size: 8.5, fill: C.dim });
    b += t(320, 192, "func = decorator(func) · use functools.wraps · real uses: retry, timing, cache, register", { fill: C.dim, size: 9.5 });
    return svg(206, b, "Decorators");
  })();

  /* py-logging-config */
  D["py-logging"] = (() => {
    let b = t(320, 20, "Logging: levels → logger → handlers", { bold: true });
    const lv = [["DEBUG", C.dim], ["INFO", C.accT], ["WARNING", C.warn], ["ERROR", C.badT], ["CRITICAL", C.badS]];
    lv.forEach((l, i) => { const x = 24 + i * 118; b += box(x, 50, 108, 28, { r: 6 }) + t(x + 54, 68, l[0], { size: 10, bold: true, fill: l[1] }); if (i < 4) b += arrowR(x + 108, 64, x + 118 - 2, { sw: 1.2 }); });
    b += t(320, 92, "a logger emits records at/above its threshold →", { size: 9.5, fill: C.dim });
    const h = [["file", C.acc, C.accS], ["stdout", C.good, C.goodS], ["JSON (structured)", C.warnFill, C.warn]];
    h.forEach((hh, i) => { const x = 60 + i * 180; b += box(x, 108, 160, 34, { r: 8, fill: hh[1], stroke: hh[2] }) + t(x + 80, 129, hh[0], { size: 10, fill: C.tx }); });
    b += t(320, 168, "structured logs ({job, run_id, rows, duration}) are queryable — far better than print()", { fill: C.dim, size: 10 });
    return svg(182, b, "Logging");
  })();

  /* py-db-connections */
  D["py-db-conn"] = (() => {
    let b = t(320, 20, "Connecting to a database safely", { bold: true });
    b += box(24, 56, 130, 44, { r: 9, fill: C.acc, stroke: C.accS }) + t(89, 78, "pool", { bold: true, fill: C.accT, size: 12 }) + t(89, 94, "reuse conns", { size: 8.5, fill: C.dim });
    b += box(196, 56, 230, 44, { r: 9, fill: C.good, stroke: C.goodS }) + t(311, 78, "parameterized query", { bold: true, fill: C.goodT, size: 11 }) + t(311, 94, "WHERE id = %s   (value sent apart)", { size: 8.5, mono: true, fill: C.dim });
    b += box(468, 56, 148, 44, { r: 9 }) + t(542, 82, "result rows", { size: 11 });
    b += arrowR(154, 78, 194);
    b += arrowR(426, 78, 466);
    b += box(24, 116, 592, 34, { r: 8, fill: C.bad, stroke: C.badS }) + t(320, 137, "NEVER: f\"... WHERE id = {user_input}\"  → SQL injection", { size: 10, mono: true, fill: C.badT });
    b += t(320, 174, "bulk load with COPY / executemany — not row-by-row inserts (round-trips are the cost)", { fill: C.dim, size: 9.5 });
    return svg(188, b, "Database connections");
  })();

  /* py-apis-ingestion */
  D["py-api-ingest"] = (() => {
    let b = t(320, 20, "Reliable REST API ingestion", { bold: true });
    const st = [["API", C.box, C.boxS, C.tx], ["paginate", C.acc, C.accS, C.accT], ["retry + backoff", C.warnFill, C.warn, C.warn], ["land (Parquet)", C.good, C.goodS, C.goodT]];
    st.forEach((s, i) => { const x = 22 + i * 152; b += box(x, 58, 130, 40, { r: 8, fill: s[1], stroke: s[2] }) + t(x + 65, 82, s[0], { bold: i > 0, fill: s[3], size: 10.5 }); if (i < 3) b += arrowR(x + 130, 78, x + 174); });
    b += path("M87 98 C87 134, 478 134, 478 100", { stroke: C.line }) + triD(478, 100);
    b += t(283, 130, "loop next cursor · checkpoint progress to resume", { size: 9, fill: C.dim });
    b += t(320, 166, "respect 429 / Retry-After · exponential backoff + jitter · upsert by key = idempotent", { fill: C.dim, size: 9.5 });
    return svg(182, b, "API ingestion");
  })();

  /* std-fileops */
  D["py-fileops"] = (() => {
    let b = t(320, 20, "Filesystem toolkit (stdlib)", { bold: true });
    const cells = [
      ["shutil", "copy · move · rmtree · disk_usage", C.acc, C.accS, C.accT, 24, 46],
      ["glob", "match patterns: glob('*.csv')", C.good, C.goodS, C.goodT, 324, 46],
      ["tempfile", "TemporaryDirectory() — auto-cleans", C.warnFill, C.warn, C.warn, 24, 124],
      ["gzip / bz2 / lzma", "open('f.gz','rt') — stream compressed", C.box, C.boxS, C.dim, 324, 124]];
    cells.forEach(c => {
      b += box(c[5], c[6], 292, 66, { r: 10, fill: c[2], stroke: c[3] });
      b += t(c[5] + 16, c[6] + 26, c[0], { a: "start", bold: true, fill: c[4], size: 13, mono: true });
      b += t(c[5] + 16, c[6] + 48, c[1], { a: "start", size: 9.5, fill: C.dim });
    });
    b += t(320, 212, "pathlib for paths · these cover everyday file chores without shelling out", { fill: C.dim, size: 9.5 });
    return svg(226, b, "Filesystem toolkit");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
