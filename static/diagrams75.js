/* Datalith - diagram pack 75 (Mermaid / diagrams-as-code module). Clean geometry, ASCII labels. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", warnT:"#ffd27a", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d",
    purp:"#2b2350", purpS:"#a78bfa", purpT:"#c9b6ff", teal:"#10303a", tealS:"#29b5e8", tealT:"#7fd6f2", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const triR=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triR(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const crow=(x,y,o={})=>ln(x,y,x-11,y-6,o)+ln(x,y,x-11,y,o)+ln(x,y,x-11,y+6,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  D["dv-mermaid-flow"] = (() => {
    let b = t(320, 24, "Mermaid: text (code) renders to a diagram", { bold: true, size: 12 });
    b += box(24,44,306,156,{fill:"#0f1830",stroke:C.boxS,r:8});
    b += t(38,72,"flowchart LR",{a:"start",mono:true,size:9.5,fill:C.accT});
    b += t(38,94,"  A[Extract] --> B{OK?}",{a:"start",mono:true,size:9.5,fill:C.tx});
    b += t(38,116,"  B -->|yes| C[Load]",{a:"start",mono:true,size:9.5,fill:C.tx});
    b += t(38,138,"  B -->|no| D[Quar]",{a:"start",mono:true,size:9.5,fill:C.tx});
    b += t(38,172,"(in a ```mermaid block)",{a:"start",mono:true,size:8.5,fill:C.dim});
    b += arrowR(336,116,392,{stroke:C.accS}) + t(364,108,"renders",{size:7.5,fill:C.dim});
    b += box(400,54,96,24,{fill:C.acc,stroke:C.accS,r:6}) + t(448,70,"Extract",{size:9,fill:C.accT});
    b += arrowD(448,78,96,{stroke:C.accS});
    b += box(400,96,96,24,{fill:C.acc,stroke:C.accS,r:6}) + t(448,112,"OK?",{size:9,fill:C.accT});
    b += arrowD(448,120,138,{stroke:C.accS}) + t(458,133,"yes",{a:"start",size:7,fill:C.goodT});
    b += box(400,138,96,24,{fill:C.good,stroke:C.goodS,r:6}) + t(448,154,"Load",{size:9,fill:C.goodT});
    b += arrowR(496,108,540,{stroke:C.badS}) + t(518,101,"no",{size:7,fill:C.badT});
    b += box(540,96,76,24,{fill:C.bad,stroke:C.badS,r:6}) + t(578,112,"Quar",{size:9,fill:C.badT});
    b += t(320,216,"Same flowchart, written as text - versionable, diffable, and rendered to SVG automatically.",{size:9,fill:C.dim});
    return svg(228, b, "Mermaid code rendering to a flowchart"); })();

  D["dv-mermaid-types"] = (() => {
    let b = t(320, 24, "Mermaid covers many diagram types", { bold: true, size: 12 });
    b += box(24,42,296,80,{r:8}) + t(36,58,"flowchart",{a:"start",size:9,fill:C.accT});
    b += box(44,78,54,20,{fill:C.acc,stroke:C.accS,r:4})+t(71,92,"A",{size:8.5,fill:C.accT})+arrowR(98,88,124,{stroke:C.accS})+box(124,78,54,20,{fill:C.acc,stroke:C.accS,r:4})+t(151,92,"B",{size:8.5,fill:C.accT})+arrowR(178,88,204,{stroke:C.accS})+box(204,78,54,20,{fill:C.acc,stroke:C.accS,r:4})+t(231,92,"C",{size:8.5,fill:C.accT});
    b += box(330,42,286,80,{r:8}) + t(342,58,"sequenceDiagram",{a:"start",size:9,fill:C.goodT});
    b += ln(380,70,380,116,{stroke:C.boxS,dash:true}) + ln(560,70,560,116,{stroke:C.boxS,dash:true}) + t(380,68,"API",{size:8,fill:C.goodT}) + t(560,68,"DB",{size:8,fill:C.goodT});
    b += arrowR(380,86,560,{stroke:C.goodS}) + t(470,81,"write",{size:7,fill:C.tx}) + arrowL(560,104,380,{stroke:C.goodS,dash:true}) + t(470,99,"ack",{size:7,fill:C.dim});
    b += box(24,130,296,80,{r:8}) + t(36,146,"erDiagram",{a:"start",size:9,fill:C.tealT});
    b += box(44,162,86,30,{fill:C.teal,stroke:C.tealS,r:4})+t(87,181,"USER",{size:8.5,fill:C.tealT})+box(214,162,86,30,{fill:C.teal,stroke:C.tealS,r:4})+t(257,181,"ORDER",{size:8.5,fill:C.tealT});
    b += ln(130,177,214,177,{stroke:C.line}) + ln(142,171,142,183,{stroke:C.line}) + crow(214,177,{stroke:C.line});
    b += box(330,130,286,80,{r:8}) + t(342,146,"gantt",{a:"start",size:9,fill:C.purpT});
    b += box(352,162,120,14,{fill:C.purp,stroke:C.purpS,r:3})+box(392,180,150,14,{fill:C.purp,stroke:C.purpS,r:3})+box(470,198,120,14,{fill:C.purp,stroke:C.purpS,r:3});
    b += t(320,226,"One text syntax, many diagram kinds - flowchart, sequence, ER, state, gantt, and more.",{size:9,fill:C.dim});
    return svg(236, b, "Mermaid diagram types gallery"); })();

  D["dv-mermaid-embed"] = (() => {
    let b = t(320, 24, "Write once in Markdown - renders everywhere", { bold: true, size: 12 });
    b += box(34,80,150,46,{fill:C.acc,stroke:C.accS,r:8}) + t(109,102,"```mermaid",{mono:true,size:9.5,fill:C.accT}) + t(109,118,"in a .md file",{size:8.5,fill:C.dim});
    const dst=[["GitHub / GitLab",48],["Notion / Obsidian",84],["Docs & wikis",120],["this app's lessons",156]];
    dst.forEach(d=>{const cy=d[1]+13;b+=ln(184,103,412,cy,{stroke:C.accS})+triR(412,cy,{stroke:C.accS})+box(420,d[1],196,26,{fill:C.good,stroke:C.goodS,r:6})+t(518,d[1]+17,d[0],{size:9,fill:C.goodT});});
    b += t(320,194,"A mermaid code block renders as a diagram in GitHub, GitLab, Notion, docs - and this app.",{size:9,fill:C.dim});
    return svg(208, b, "Mermaid renders across many platforms"); })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
