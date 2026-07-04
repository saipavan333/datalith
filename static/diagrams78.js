/* Datalith - diagram pack 78 (Databricks architecture). Clean geometry, ASCII labels. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", warnT:"#ffd27a", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d",
    purp:"#2b2350", purpS:"#a78bfa", purpT:"#c9b6ff", teal:"#10303a", tealS:"#29b5e8", tealT:"#7fd6f2", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12}px;font-weight:${o.bold?700:400};${F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  D["dbx-arch"] = (() => {
    let b = t(320,26,"Databricks architecture - two planes",{bold:true,size:13});
    b += box(36,44,568,74,{fill:C.acc,stroke:C.accS,r:9});
    b += t(52,64,"Control plane — Databricks-managed",{a:"start",size:11,bold:true,fill:C.accT});
    b += t(52,80,"your code & data are NOT here",{a:"start",size:8.5,fill:C.accT});
    const chips=["Workspace UI","Notebooks","Jobs scheduler","Unity Catalog","Cluster manager"];
    let cx=46; chips.forEach(c=>{ const w=108; b+=box(cx,90,w,22,{fill:"#0f1830",stroke:C.accS,r:5})+t(cx+w/2,105,c,{size:8.5,fill:C.accT}); cx+=w+4; });
    b += arrowD(320,118,150,{stroke:C.line,dash:true});
    b += t(330,138,"provisions · schedules · governs",{a:"start",size:8.5,fill:C.dim});
    b += box(36,150,568,88,{fill:C.box,stroke:C.boxS,r:9});
    b += t(52,170,"Compute plane — your cloud account (classic) or Databricks serverless",{a:"start",size:10.5,bold:true});
    b += box(60,184,96,34,{fill:C.good,stroke:C.goodS,r:6})+t(108,205,"Driver",{size:9,fill:C.goodT});
    [176,288,400].forEach(x=>b+=box(x,184,96,34,{fill:C.teal,stroke:C.tealS,r:6})+t(x+48,205,"Worker",{size:9,fill:C.tealT}));
    b += box(512,184,80,34,{fill:C.purp,stroke:C.purpS,r:6})+t(552,201,"Photon",{size:8.5,fill:C.purpT})+t(552,213,"engine",{size:7,fill:C.dim});
    b += t(60,231,"a cluster = 1 driver + N workers · autoscaling",{a:"start",size:8,fill:C.dim});
    b += arrowD(320,238,262,{stroke:C.accS});
    b += t(330,256,"read / write your data",{a:"start",size:8.5,fill:C.dim});
    b += box(36,262,568,46,{fill:C.good,stroke:C.goodS,r:9});
    b += t(320,282,"Your cloud object storage",{size:11,bold:true,fill:C.goodT});
    b += t(320,298,"Delta / Parquet tables — S3 · ADLS · GCS (your account)",{size:8.5,fill:C.dim});
    b += t(320,326,"Databricks runs the platform; your data & compute stay in your cloud.",{size:9.5,fill:C.dim});
    return svg(338,b,"Databricks control plane vs compute plane architecture");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS||{}, D);
})();
