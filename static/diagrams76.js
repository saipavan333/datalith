/* Datalith - diagram pack 76 (The DE craft & career). Clean geometry, ASCII labels. */
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
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triR(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  // 1) Design-doc anatomy + trade-off table
  D["craft-designdoc"] = (() => {
    let b = t(320,26,"Anatomy of a data-system design doc",{bold:true,size:13});
    const rows=[["1 · Context & problem",C.box,C.boxS],["2 · Goals & non-goals",C.box,C.boxS],
      ["3 · Options + trade-offs",C.acc,C.accS],["4 · Decision & rationale",C.good,C.goodS],
      ["5 · Risks & mitigations",C.box,C.boxS],["6 · Rollout & validation",C.box,C.boxS]];
    let y=48;
    rows.forEach((r,i)=>{ b+=box(36,y,250,30,{fill:r[1],stroke:r[2],r:6})+t(161,y+19,r[0],{size:11}); if(i<rows.length-1) b+=arrowD(161,y+30,y+38,{stroke:C.line}); y+=38; });
    b+=box(322,116,286,150,{fill:"#0f1830",stroke:C.boxS,r:8});
    b+=t(465,134,"Options — the trade-off table",{size:10,bold:true,fill:C.accT});
    b+=ln(330,142,600,142,{stroke:C.boxS});
    const cols=[["Option",372],["Cost",487],["Latency",537],["Risk",585]];
    cols.forEach(c=>b+=t(c[1],158,c[0],{size:9,fill:C.dim}));
    const cells=[["Batch ETL","L","H","L",172],["Streaming","H","L","M",196],["Lakehouse","M","M","L",220]];
    const col=(v)=>v==="L"?C.goodT:(v==="M"?C.warnT:C.badT);
    cells.forEach(r=>{ b+=t(372,r[4],r[0],{size:9}); b+=t(487,r[4],r[1],{size:9,fill:col(r[1]),bold:true}); b+=t(537,r[4],r[2],{size:9,fill:col(r[2]),bold:true}); b+=t(585,r[4],r[3],{size:9,fill:col(r[3]),bold:true}); });
    b+=t(465,246,"L=low  M=med  H=high",{size:8,fill:C.dim});
    b+=arrowR(286,131,322,{stroke:C.accS});
    b+=t(320,286,"Reviewers argue the table, not opinions - the decision cites a row.",{size:9.5,fill:C.dim});
    return svg(300,b,"Design doc sections with an options trade-off table"); })();

  // 2) Stakeholder map + translation
  D["craft-stakeholders"] = (() => {
    let b=t(320,24,"The DE sits between roles - translation is the job",{bold:true,size:12.5});
    b+=box(268,116,144,46,{fill:C.acc,stroke:C.accS,r:8})+t(340,144,"Data Engineer",{size:12,bold:true,fill:C.accT});
    const roles=[["Data / BI Analyst",40,58],["Data Scientist",450,58],["Product Manager",40,182],["Software Engineer",450,182]];
    roles.forEach(r=>b+=box(r[1],r[2],150,40,{r:7})+t(r[1]+75,r[2]+25,r[0],{size:10.5}));
    b+=ln(268,128,192,80,{stroke:C.line,dash:true});
    b+=ln(412,128,448,80,{stroke:C.line,dash:true});
    b+=ln(268,150,192,204,{stroke:C.line,dash:true});
    b+=ln(412,150,448,204,{stroke:C.line,dash:true});
    b+=t(320,236,"DE translates the ask into something buildable:",{size:9.5,fill:C.dim});
    const strip=[["Business ask",36,C.box,C.boxS],["Metric definition",184,C.box,C.boxS],["Schema",332,C.acc,C.accS],["Pipeline",456,C.good,C.goodS]];
    const w=[132,132,108,148];
    strip.forEach((s,i)=>{ b+=box(s[1],250,w[i],30,{fill:s[2],stroke:s[3],r:6})+t(s[1]+w[i]/2,269,s[0],{size:10}); if(i<strip.length-1) b+=arrowR(s[1]+w[i],265,s[1]+w[i]+16,{stroke:C.line}); });
    return svg(298,b,"Data engineer between analyst, scientist, PM and software roles"); })();

  // 3) Career ladder
  D["craft-career"] = (() => {
    let b=t(320,26,"The DE career ladder - scope grows with level",{bold:true,size:12.5});
    const steps=[["Junior",30,168,C.box,C.boxS,"owns a task"],["Mid",180,140,C.acc,C.accS,"owns a feature"],
      ["Senior",330,112,C.good,C.goodS,"owns a system"],["Staff / Principal",480,84,C.purp,C.purpS,"owns a domain / org"]];
    steps.forEach((s,i)=>{ const w=130; b+=box(s[1],s[2],w,40,{fill:s[3],stroke:s[4],r:7})+t(s[1]+w/2,s[2]+25,s[0],{size:11,bold:true}); b+=t(s[1]+w/2,s[2]+56,s[5],{size:9,fill:C.dim}); });
    b+=arrowU(610,215,70,{stroke:C.accS,sw:2});
    b+=t(600,150,"scope",{a:"end",size:9,fill:C.accT});
    b+=t(600,164,"autonomy",{a:"end",size:9,fill:C.accT});
    b+=t(600,178,"comp",{a:"end",size:9,fill:C.accT});
    b+=t(320,244,"Levels differ by scope of ownership & ambiguity handled - not years alone.",{size:9.5,fill:C.dim});
    return svg(262,b,"Career ladder from junior to staff by scope of ownership"); })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS||{}, D);
})();
