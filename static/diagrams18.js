/* DataForge Academy — diagram pack 18 (Unix & Shell). */
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

  /* unix-text */
  D["text-tools"] = (() => {
    let b = t(320, 20, "grep · sed · awk — the text-processing trio", { bold: true });
    const tools = [
      ["grep 'ERROR'", "FILTER lines that match", C.acc, C.accS, C.accT],
      ["sed 's/old/new/'", "EDIT / substitute text", C.good, C.goodS, C.goodT],
      ["awk '{print $1,$3}'", "COLUMNS — fields & math", C.warnFill, C.warn, C.warn]];
    tools.forEach((tl, i) => {
      const y = 48 + i * 52;
      b += box(40, y, 250, 42, { r: 9, fill: tl[2], stroke: tl[3] }) + t(165, y + 20, tl[0], { bold: true, fill: tl[4], size: 12, mono: true }) + t(165, y + 35, tl[1], { size: 9, fill: C.dim });
      b += arrowR(290, y + 21, 330);
      b += box(346, y, 254, 42, { r: 9 }) + t(473, y + 26, ["only ERROR lines", "old → new in the stream", "selected/derived columns"][i], { size: 10, fill: C.tx });
    });
    b += t(320, 224, "compose them in a pipe: grep ERROR log | awk '{print $4}' | sort | uniq -c", { fill: C.dim, size: 9.5, mono: true });
    return svg(238, b, "grep, sed, awk");
  })();

  /* unix-permissions */
  D["unix-permissions"] = (() => {
    let b = t(320, 20, "File permissions: rwx for user / group / other", { bold: true });
    const groups = [["user", "rwx", "7", C.acc, C.accS, C.accT], ["group", "r-x", "5", C.good, C.goodS, C.goodT], ["other", "r--", "4", C.warnFill, C.warn, C.warn]];
    b += t(60, 70, "-", { size: 20, mono: true, fill: C.dim });
    groups.forEach((g, i) => {
      const x = 92 + i * 168;
      b += box(x, 50, 150, 56, { r: 9, fill: g[3], stroke: g[4] });
      b += t(x + 75, 74, g[1], { bold: true, fill: g[5], size: 18, mono: true });
      b += t(x + 75, 96, g[0] + "  →  " + g[2], { size: 10, fill: C.dim });
    });
    b += t(320, 134, "chmod 754 file   ·   r=4  w=2  x=1   (add them per group)", { size: 10.5, mono: true, fill: C.accT });
    b += box(40, 150, 270, 44, { r: 8 }) + t(175, 170, "chmod / chown / chgrp", { size: 10, mono: true, fill: C.tx }) + t(175, 186, "change perms & ownership", { size: 8.5, fill: C.dim });
    b += box(330, 150, 270, 44, { r: 8 }) + t(465, 170, "ps · top · kill · &  · jobs", { size: 10, mono: true, fill: C.tx }) + t(465, 186, "processes: list, run bg, stop", { size: 8.5, fill: C.dim });
    b += t(320, 214, "x on a directory = permission to enter it · sudo runs as superuser (careful)", { fill: C.dim, size: 9.5 });
    return svg(228, b, "Unix permissions");
  })();

  /* unix-de */
  D["cli-data"] = (() => {
    let b = t(320, 20, "The command line for data engineering", { bold: true });
    const stages = ["cat data.csv", "grep paid", "cut -d, -f1,3", "sort", "uniq -c"];
    stages.forEach((s, i) => {
      const x = 18 + i * 124;
      b += box(x, 50, 110, 36, { r: 7, fill: i === 0 ? C.acc : C.box, stroke: i === 0 ? C.accS : C.boxS }) + t(x + 55, 72, s, { size: 8.8, mono: true, fill: i === 0 ? C.accT : C.tx });
      if (i < 4) b += arrowR(x + 110, 68, x + 142, { sw: 1.3 }) + t(x + 126, 60, "|", { size: 12, bold: true, fill: C.goodT });
    });
    b += t(320, 110, "each tool does one thing; the pipe | streams between them — no temp files, no RAM blowup", { fill: C.dim, size: 9.5 });
    b += box(40, 128, 270, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(175, 150, "peek without loading", { bold: true, fill: C.goodT, size: 11 }) + t(175, 170, "head -100 · tail -f · wc -l · less", { size: 9, mono: true, fill: C.dim });
    b += box(330, 128, 270, 56, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(465, 150, "transform at scale", { bold: true, fill: C.warn, size: 11 }) + t(465, 170, "awk · sort -u · split · gzip · xargs -P", { size: 9, mono: true, fill: C.dim });
    b += t(320, 206, "the CLI inspects, counts & reshapes huge files in seconds — before any Python loads them", { fill: C.dim, size: 9.5 });
    return svg(220, b, "Command line for data engineering");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
