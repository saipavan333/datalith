/* Datalith — diagram pack 16 (Python core & data work). Directional arrowheads up front. */
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

  /* py-types-structures */
  D["py-types"] = (() => {
    let b = t(320, 20, "Python types: mutable vs immutable", { bold: true });
    b += box(28, 46, 280, 120, { r: 10, fill: C.acc, stroke: C.accS }) + t(168, 68, "IMMUTABLE (hashable)", { bold: true, fill: C.accT, size: 12 });
    b += t(168, 92, "int · float · complex · bool", { size: 10.5, mono: true });
    b += t(168, 112, "str · bytes", { size: 10.5, mono: true });
    b += t(168, 132, "tuple · frozenset", { size: 10.5, mono: true });
    b += t(168, 154, "can be dict keys / set members", { size: 9, fill: C.dim });
    b += box(332, 46, 280, 120, { r: 10, fill: C.good, stroke: C.goodS }) + t(472, 68, "MUTABLE", { bold: true, fill: C.goodT, size: 12 });
    b += t(472, 94, "list", { size: 10.5, mono: true });
    b += t(472, 116, "dict", { size: 10.5, mono: true });
    b += t(472, 138, "set", { size: 10.5, mono: true });
    b += t(472, 158, "change in place · not hashable", { size: 9, fill: C.dim });
    b += t(320, 186, "immutability enables hashing (dict keys) and prevents shared-state bugs", { fill: C.dim, size: 10 });
    return svg(200, b, "Mutable vs immutable types");
  })();

  /* py-collections */
  D["py-collections"] = (() => {
    let b = t(320, 20, "The four built-in collections", { bold: true });
    const X = [24, 168, 286, 404, 522, 616], cx = X.slice(0, 5).map((x, i) => (x + X[i + 1]) / 2);
    const Y = 42, RH = 30, rows = 4;
    b += box(24, Y, 592, RH, { r: 9, fill: C.acc, stroke: C.accS });
    ["", "ordered?", "mutable?", "unique?", "lookup"].forEach((h, i) => b += t(cx[i], Y + 20, h, { bold: true, fill: C.accT, size: 10.5 }));
    const data = [
      ["list  []", "yes", "yes", "no", "O(n)"],
      ["tuple ()", "yes", "no", "no", "O(n)"],
      ["dict  {k:v}", "yes*", "yes", "keys", "O(1)"],
      ["set   {}", "no", "yes", "yes", "O(1)"]];
    data.forEach((r, ri) => {
      const y = Y + RH * (ri + 1);
      if (ri % 2) b += `<rect x="24" y="${y}" width="592" height="${RH}" style="fill:#1b2230"/>`;
      r.forEach((cVal, ci) => b += t(cx[ci], y + 20, cVal, { size: 9.8, bold: ci === 0, mono: ci === 0, fill: ci === 0 ? C.tx : (cVal === "O(1)" ? C.goodT : C.dim) }));
    });
    [1, 2, 3, 4].forEach(i => b += ln(X[i], Y, X[i], Y + RH * 5, { stroke: C.boxS, sw: 1 }));
    for (let i = 1; i <= rows; i++) b += ln(24, Y + RH * i, 616, Y + RH * i, { stroke: C.boxS, sw: 1 });
    b += t(320, Y + RH * 5 + 22, "* dicts keep insertion order (3.7+) · use set/dict for fast membership, not a list", { fill: C.dim, size: 9.5 });
    return svg(Y + RH * 5 + 38, b, "List, tuple, dict, set");
  })();

  /* py-functions-loops */
  D["py-loops"] = (() => {
    let b = t(320, 20, "Loops: for / while + break / continue", { bold: true });
    b += box(28, 92, 96, 34, { r: 8 }) + t(76, 113, "start", { size: 10.5 });
    b += `<polygon points="200,80 270,112 200,144 130,112" style="fill:${C.acc};stroke:${C.accS};stroke-width:1.6"/>`;
    b += t(200, 108, "more items?", { size: 9.5, fill: C.accT }) + t(200, 122, "/ cond true?", { size: 9.5, fill: C.accT });
    b += box(330, 95, 120, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(390, 116, "run body", { size: 10.5, fill: C.goodT });
    b += box(500, 95, 112, 34, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(556, 116, "exit loop", { size: 10.5, fill: C.warn });
    b += arrowR(124, 112, 130);
    b += arrowR(270, 112, 328) + t(299, 104, "yes", { size: 9, fill: C.goodT });
    b += arrowR(450, 112, 498) + t(474, 104, "break", { size: 8.5, fill: C.badT });
    b += path("M200 144 V172", { stroke: C.line }) + triD(200, 172) + t(214, 165, "no → exit", { a: "start", size: 9, fill: C.dim });
    b += path("M390 95 C390 56, 200 56, 200 80", { stroke: C.line }) + triD(200, 80) + t(300, 50, "loop / continue", { size: 9, fill: C.dim });
    b += t(320, 196, "for = iterate a known iterable · while = repeat while a condition holds", { fill: C.dim, size: 10 });
    return svg(210, b, "Python loops");
  })();

  /* py-functions */
  D["py-function-anatomy"] = (() => {
    let b = t(320, 20, "Anatomy of a function", { bold: true });
    b += box(40, 46, 560, 40, { r: 9, fill: C.acc, stroke: C.accS });
    b += t(60, 71, "def load(path, sep=',', *args, **kwargs):", { a: "start", bold: true, fill: C.accT, size: 13, mono: true });
    const ann = [["path", "required positional", 120], ["sep=','", "default value", 250], ["*args", "extra positional → tuple", 370], ["**kwargs", "extra keyword → dict", 510]];
    ann.forEach(a => { b += path("M" + a[2] + " 86 V104", { stroke: C.boxS }) + triD(a[2], 104); });
    ann.forEach((a, i) => { const y = 118 + (i % 2) * 30; b += t(a[2], y, a[0], { size: 9.5, mono: true, fill: C.goodT }) + t(a[2], y + 13, a[1], { size: 8, fill: C.dim }); });
    b += box(40, 186, 560, 30, { r: 8, fill: C.good, stroke: C.goodS }) + t(320, 206, "return value   ·   no return → None   ·   scope: Local → Enclosing → Global → Built-in", { size: 9.5, fill: C.goodT });
    b += t(320, 238, "avoid mutable default args (def f(x, acc=[]) is shared across calls — use None)", { fill: C.warn, size: 9.5 });
    return svg(252, b, "Function anatomy");
  })();

  /* py-files-apis */
  D["py-file-io"] = (() => {
    let b = t(320, 20, "Streaming file I/O with `with`", { bold: true });
    b += box(34, 60, 180, 56, { r: 9, fill: C.acc, stroke: C.accS }) + t(124, 84, "with open(p,", { fill: C.accT, size: 11, mono: true }) + t(124, 100, "encoding='utf-8')", { fill: C.accT, size: 11, mono: true });
    b += box(254, 60, 150, 56, { r: 9 }) + t(329, 84, "for line in f:", { size: 11, mono: true }) + t(329, 102, "(lazy, one at a time)", { size: 8.5, fill: C.dim });
    b += box(444, 60, 160, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(524, 84, "process(line)", { fill: C.goodT, size: 11, mono: true }) + t(524, 102, "memory stays flat", { size: 8.5, fill: C.dim });
    b += arrowR(214, 88, 252);
    b += arrowR(404, 88, 442);
    b += t(320, 146, "the `with` block auto-closes the file even on error · never .read() a multi-GB file", { fill: C.dim, size: 10 });
    b += t(320, 168, "declare encoding='utf-8' so behavior is identical on every machine", { fill: C.warn, size: 9.5 });
    return svg(184, b, "File I/O streaming");
  })();

  /* py-comprehensions */
  D["py-comprehension"] = (() => {
    let b = t(320, 20, "Comprehension: list vs generator", { bold: true });
    b += box(40, 46, 560, 36, { r: 9, fill: C.acc, stroke: C.accS });
    b += t(320, 69, "[ x*x   for x in xs   if x > 0 ]", { bold: true, fill: C.accT, size: 14, mono: true });
    b += t(150, 100, "output expr", { size: 9, fill: C.goodT }) + t(320, 100, "iterate", { size: 9, fill: C.dim }) + t(470, 100, "filter (optional)", { size: 9, fill: C.warn });
    b += box(40, 116, 270, 64, { r: 9 }) + t(175, 138, "[..]  list", { bold: true, size: 11, mono: true }) + t(175, 158, "builds the whole list", { size: 9.5, fill: C.dim }) + t(175, 172, "in memory · indexable", { size: 9.5, fill: C.dim });
    b += box(330, 116, 270, 64, { r: 9, fill: C.good, stroke: C.goodS }) + t(465, 138, "(..)  generator", { bold: true, size: 11, mono: true, fill: C.goodT }) + t(465, 158, "lazy, one at a time", { size: 9.5, fill: C.dim }) + t(465, 172, "memory-flat · single pass", { size: 9.5, fill: C.dim });
    b += t(320, 202, "use a generator for large/streaming data; a list when you must index or reuse it", { fill: C.dim, size: 10 });
    return svg(216, b, "Comprehensions");
  })();

  /* py-strings-format */
  D["py-strings"] = (() => {
    let b = t(320, 20, "Strings are immutable", { bold: true });
    b += box(40, 50, 130, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(105, 75, "'hello'", { bold: true, fill: C.accT, size: 13, mono: true });
    b += box(360, 50, 150, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(435, 75, "'HELLO'  (new)", { fill: C.goodT, size: 12, mono: true });
    b += arrowR(170, 70, 358) + t(264, 62, ".upper()", { size: 10, mono: true, fill: C.dim });
    b += t(264, 108, "original 'hello' is unchanged — methods return NEW strings", { size: 9.5, fill: C.dim });
    b += box(40, 128, 270, 56, { r: 9, fill: C.bad, stroke: C.badS }) + t(175, 150, "s += piece  in a loop", { size: 10.5, mono: true, fill: C.badT }) + t(175, 170, "O(n²) — new string each time", { size: 9, fill: C.dim });
    b += box(330, 128, 270, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(465, 150, "''.join(parts)", { size: 10.5, mono: true, fill: C.goodT }) + t(465, 170, "O(n) — build once", { size: 9, fill: C.dim });
    b += t(320, 206, "format with f-strings: f'{name}: {value:.2f}'", { fill: C.dim, size: 10, mono: true });
    return svg(220, b, "Python strings");
  })();

  /* py-errors */
  D["py-try-except"] = (() => {
    let b = t(320, 20, "try / except / else / finally", { bold: true });
    b += box(250, 44, 140, 34, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 65, "try: risky code", { fill: C.accT, size: 10.5, mono: true });
    b += box(60, 104, 200, 34, { r: 8, fill: C.bad, stroke: C.badS }) + t(160, 125, "except: handle error", { fill: C.badT, size: 10, mono: true });
    b += box(390, 104, 190, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(485, 125, "else: ran cleanly", { fill: C.goodT, size: 10, mono: true });
    b += box(220, 162, 200, 34, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 183, "finally: always runs", { fill: C.warn, size: 10.5, mono: true });
    b += path("M280 78 C220 90, 180 92, 160 104", { stroke: C.line }) + triD(160, 104) + t(150, 96, "raised", { a: "end", size: 8.5, fill: C.badT });
    b += path("M360 78 C420 90, 460 92, 485 104", { stroke: C.line }) + triD(485, 104) + t(498, 96, "no error", { a: "start", size: 8.5, fill: C.goodT });
    b += path("M160 138 C160 152, 280 156, 300 162", { stroke: C.line }) + triD(303, 162);
    b += path("M485 138 C485 152, 360 156, 340 162", { stroke: C.line }) + triD(337, 162);
    b += t(320, 218, "catch SPECIFIC exceptions · finally (or a context manager) guarantees cleanup", { fill: C.dim, size: 10 });
    return svg(232, b, "Exception handling");
  })();

  /* py-json-csv */
  D["py-json-csv"] = (() => {
    let b = t(320, 20, "Parsing JSON & CSV", { bold: true });
    b += box(40, 52, 150, 60, { r: 9 }) + t(115, 76, "text / bytes", { bold: true, size: 11 }) + t(115, 96, '{"a":1}  a,b', { size: 10, mono: true, fill: C.dim });
    b += box(450, 52, 160, 60, { r: 9, fill: C.good, stroke: C.goodS }) + t(530, 76, "Python objects", { bold: true, size: 11, fill: C.goodT }) + t(530, 96, "dict / list / row", { size: 10, mono: true, fill: C.dim });
    b += arrowR(190, 72, 448) + t(320, 64, "json.loads · csv.DictReader", { size: 9.5, mono: true, fill: C.accT });
    b += ln(448, 96, 192, 96, { stroke: C.line }) + triL(192, 96) + t(320, 110, "json.dumps · csv.writer", { size: 9.5, mono: true, fill: C.dim });
    b += t(320, 144, "use csv.DictReader (handles quotes/commas) — never line.split(',')", { fill: C.warn, size: 10 });
    b += t(320, 166, "for huge files: stream JSONL / csv.reader row by row, or hand to DuckDB/Polars", { fill: C.dim, size: 9.5 });
    return svg(182, b, "JSON and CSV parsing");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
