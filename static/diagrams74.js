/* Datalith - diagram pack 74 (chart-type gallery: one labeled diagram per chart type). Clean geometry, ASCII labels. */
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
  const circ=(cx,cy,r,o={})=>`<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${o.fill||C.accS};${o.stroke?`stroke:${o.stroke};stroke-width:${o.sw||1};`:""}${o.op?`opacity:${o.op}`:""}"/>`;
  const poly=(pts,o={})=>`<polyline points="${pts}" style="fill:none;stroke:${o.stroke||C.accS};stroke-width:${o.sw||2.4}"/>`;
  const pg=(pts,o={})=>`<polygon points="${pts}" style="fill:${o.fill||C.acc};stroke:${o.stroke||"none"};stroke-width:${o.sw||0};${o.op?`opacity:${o.op}`:""}"/>`;
  const slice=(cx,cy,r,a0,a1,o={})=>{const x0=cx+r*Math.cos(a0),y0=cy+r*Math.sin(a0),x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1),lg=(a1-a0)>Math.PI?1:0;return `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${lg} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" style="fill:${o.fill};stroke:${C.card};stroke-width:2"/>`;};
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  D["dv-boxplot"] = (() => {
    let b = t(320, 24, "Box plot: median, quartiles (IQR), whiskers & outliers", { bold: true, size: 11.5 });
    b += ln(90,116,230,116,{stroke:C.dim}) + ln(430,116,560,116,{stroke:C.dim});
    b += ln(90,104,90,128,{stroke:C.dim}) + ln(560,104,560,128,{stroke:C.dim});
    b += box(230,92,200,48,{fill:C.good,stroke:C.goodS,r:3});
    b += ln(330,92,330,140,{stroke:C.goodT,sw:2.6});
    b += circ(598,116,4,{fill:C.badS});
    b += t(90,160,"min",{size:8.5,fill:C.dim}) + t(230,160,"Q1",{size:8.5,fill:C.goodT}) + t(330,160,"median",{size:8.5,fill:C.goodT}) + t(430,160,"Q3",{size:8.5,fill:C.goodT}) + t(560,160,"max",{size:8.5,fill:C.dim}) + t(598,100,"outlier",{size:8.5,fill:C.badT});
    b += t(330,82,"IQR = middle 50%",{size:8.5,fill:C.tx});
    b += t(320,192,"Box = Q1 to Q3 (middle 50%); line = median; whiskers ~1.5xIQR; dots beyond = outliers.",{size:9,fill:C.dim});
    return svg(208, b, "Anatomy of a box plot"); })();

  D["dv-violin"] = (() => {
    let b = t(320, 24, "Violin plot: full density (reveals bimodality)", { bold: true, size: 11.5 });
    const ys=[62,76,90,104,118,132,146,160,174];
    const build=(cx,hw)=>{let r="",l="";ys.forEach((y,i)=>{r+=`${(cx+hw[i]).toFixed(1)},${y} `;});for(let i=ys.length-1;i>=0;i--)l+=`${(cx-hw[i]).toFixed(1)},${ys[i]} `;return r+l;};
    b += pg(build(180,[3,9,17,25,29,25,17,9,3]),{fill:C.accS,op:0.8}) + ln(180,92,180,150,{stroke:C.card,sw:6}) + ln(180,96,180,146,{stroke:C.accT,sw:2});
    b += pg(build(460,[3,13,21,11,7,11,21,13,3]),{fill:C.goodS,op:0.8}) + ln(460,80,460,168,{stroke:C.card,sw:6}) + ln(460,84,460,164,{stroke:C.goodT,sw:2});
    b += t(180,192,"unimodal (one hump)",{size:9,fill:C.accT}) + t(460,192,"bimodal (two humps)",{size:9,fill:C.goodT});
    b += t(320,210,"A violin mirrors the density; the bimodal shape (two humps) is exactly what a box plot cannot show.",{size:9,fill:C.dim});
    return svg(224, b, "Violin plots showing unimodal and bimodal density"); })();

  D["dv-ecdf"] = (() => {
    let b = t(320, 24, "ECDF: cumulative curve - read percentiles directly", { bold: true, size: 11.5 });
    b += ln(64,44,64,170,{stroke:C.dim}) + ln(64,170,600,170,{stroke:C.dim});
    b += t(52,50,"1.0",{a:"end",size:8,fill:C.dim}) + t(52,170,"0",{a:"end",size:8,fill:C.dim});
    let pts=""; for(let i=0;i<=40;i++){const x=64+i*13; const f=1/(1+Math.exp(-(i-16)/4)); const y=170-f*120; pts+=`${x},${y.toFixed(1)} `;}
    b += poly(pts.trim(),{stroke:C.accS,sw:2.6});
    const yy=(f)=>170-f*120; const xx=(f)=>64+(16+4*Math.log(f/(1-f)))*13;
    b += ln(64,yy(.5),xx(.5),yy(.5),{stroke:C.goodT,dash:true,sw:1.3}) + ln(xx(.5),yy(.5),xx(.5),170,{stroke:C.goodT,dash:true,sw:1.3}) + t(xx(.5),yy(.5)-5,"p50",{size:8,fill:C.goodT});
    b += ln(64,yy(.95),xx(.95),yy(.95),{stroke:C.warnT,dash:true,sw:1.3}) + ln(xx(.95),yy(.95),xx(.95),170,{stroke:C.warnT,dash:true,sw:1.3}) + t(xx(.95)+2,yy(.95)-4,"p95",{a:"start",size:8,fill:C.warnT});
    b += t(600,186,"value ->",{a:"end",size:8.5,fill:C.dim});
    b += t(320,206,"The curve rises 0 to 1; read p50/p95/p99 off the y-axis across to the value - ideal for tails/SLAs.",{size:9,fill:C.dim});
    return svg(220, b, "ECDF cumulative distribution with percentiles"); })();

  D["dv-area"] = (() => {
    let b = t(320, 24, "Area chart: a line with filled area (emphasizes volume)", { bold: true, size: 11.5 });
    b += ln(60,44,60,170,{stroke:C.dim}) + ln(60,170,600,170,{stroke:C.dim});
    const ys=[150,138,144,120,126,102,96,84,70]; let line="",area="60,170 ";
    ys.forEach((y,i)=>{const x=80+i*62;line+=`${x},${y} `;area+=`${x},${y} `;});
    area+="576,170";
    b += pg(area,{fill:C.accS,op:0.28}) + poly(line.trim(),{stroke:C.accS,sw:2.6});
    b += t(600,186,"time ->",{a:"end",size:8.5,fill:C.dim});
    b += t(320,204,"Best for a single series where the magnitude (area) matters, e.g. cumulative volume over time.",{size:9,fill:C.dim});
    return svg(218, b, "Area chart"); })();

  D["dv-grouped-bar"] = (() => {
    let b = t(320, 24, "Grouped bar: compare a few series per category", { bold: true, size: 11.5 });
    b += ln(60,44,60,164,{stroke:C.dim}) + ln(60,164,600,164,{stroke:C.dim});
    const cats=[["Q1",70,96],["Q2",92,80],["Q3",110,120],["Q4",84,132]];
    cats.forEach((c,i)=>{const x=90+i*120;b+=box(x,164-c[1],40,c[1],{fill:C.acc,stroke:C.accS,r:2})+box(x+44,164-c[2],40,c[2],{fill:C.good,stroke:C.goodS,r:2})+t(x+42,180,c[0],{size:9,fill:C.dim});});
    b += box(430,30,12,12,{fill:C.acc,stroke:C.accS,r:2})+t(448,40,"2024",{a:"start",size:8.5,fill:C.accT})+box(500,30,12,12,{fill:C.good,stroke:C.goodS,r:2})+t(518,40,"2025",{a:"start",size:8.5,fill:C.goodT});
    b += t(320,200,"Two bars per category compare series; keep it to ~2-3 series or use small multiples.",{size:9,fill:C.dim});
    return svg(214, b, "Grouped bar chart"); })();

  D["dv-lollipop"] = (() => {
    let b = t(320, 24, "Lollipop: a cleaner ordered bar for many categories", { bold: true, size: 11.5 });
    const rows=[["A",520],["B",430],["C",360],["D",300],["E",250]];
    rows.forEach((r,i)=>{const y=56+i*26;b+=t(40,y+4,r[0],{size:9,fill:C.dim})+ln(60,y,r[1],y,{stroke:C.boxS,sw:2})+circ(r[1],y,5,{fill:C.accS});b+=t(r[1]+12,y+4,String((r[1]-60)),{a:"start",size:8,fill:C.accT});});
    b += t(320,206,"Sorted line-plus-dot: same ranking as a bar with far less ink for long lists.",{size:9,fill:C.dim});
    return svg(220, b, "Lollipop chart"); })();

  D["dv-heatmap"] = (() => {
    let b = t(320, 24, "Heatmap: a matrix of values (diverging color)", { bold: true, size: 11.5 });
    const M=[[1,.8,-.3,.1,-.6],[.8,1,-.1,.2,-.4],[-.3,-.1,1,.6,.2],[.1,.2,.6,1,-.2],[-.6,-.4,.2,-.2,1]];
    const col=v=>{if(v>=0){const a=v;return `rgb(${Math.round(40+a*200)},${Math.round(60+a*40)},${Math.round(70+a*30)})`;}else{const a=-v;return `rgb(${Math.round(40+a*20)},${Math.round(70+a*60)},${Math.round(90+a*150)})`;}};
    const x0=180,y0=44,cs=26; const labs=["f1","f2","f3","f4","f5"];
    for(let r=0;r<5;r++){for(let c=0;c<5;c++){b+=`<rect x="${x0+c*cs}" y="${y0+r*cs}" width="${cs-2}" height="${cs-2}" rx="2" style="fill:${col(M[r][c])}"/>`;}b+=t(x0-8,y0+r*cs+16,labs[r],{a:"end",size:8,fill:C.dim});b+=t(x0+r*cs+11,y0+5*cs+12,labs[r],{size:8,fill:C.dim});}
    b += t(430,60,"+1",{a:"start",size:8,fill:C.accT})+box(430,66,10,10,{fill:col(1),r:1})+t(430,92,"0",{a:"start",size:8,fill:C.dim})+box(430,84,10,10,{fill:col(0),r:1})+t(430,124,"-1",{a:"start",size:8,fill:C.tealT})+box(430,116,10,10,{fill:col(-1),r:1});
    b += t(320,208,"Each cell's color encodes a value; a diverging palette centers neutral at 0 (e.g. correlations).",{size:9,fill:C.dim});
    return svg(222, b, "Correlation heatmap"); })();

  D["dv-bubble"] = (() => {
    let b = t(320, 24, "Bubble chart: scatter + a third variable as size", { bold: true, size: 11.5 });
    b += ln(60,44,60,168,{stroke:C.dim}) + ln(60,168,600,168,{stroke:C.dim});
    const P=[[120,140,9],[190,120,16],[250,150,6],[320,104,22],[390,126,11],[460,88,18],[520,110,8],[560,70,13]];
    P.forEach(p=>{b+=circ(p[0],p[1],p[2],{fill:C.accS,op:0.55,stroke:C.accT,sw:1});});
    b += t(600,184,"x ->",{a:"end",size:8.5,fill:C.dim});
    b += t(320,204,"Position shows the x-y relationship; bubble area encodes a third numeric (read roughly).",{size:9,fill:C.dim});
    return svg(218, b, "Bubble chart"); })();

  D["dv-sankey"] = (() => {
    let b = t(320, 24, "Sankey: quantities flowing between stages (width = magnitude)", { bold: true, size: 11 });
    b += box(70,60,26,120,{fill:C.acc,stroke:C.accS,r:3}) + t(83,196,"raw 10M",{size:8.5,fill:C.accT});
    const segs=[[60,64,C.goodS,C.good],[36,72,C.warn,C.warnFill],[24,150,C.badS,C.bad]];
    let ly=60;
    segs.forEach(s=>{const ry=s[1];b+=pg(`96,${ly} 548,${ry} 548,${ry+s[0]} 96,${ly+s[0]}`,{fill:s[2],op:0.35});b+=box(548,ry,26,s[0],{fill:s[3],stroke:s[2],r:3});ly+=s[0];});
    b += t(500,72,"loaded",{a:"end",size:8,fill:C.goodT}) + t(500,116,"dup",{a:"end",size:8,fill:C.warnT}) + t(500,168,"rejected",{a:"end",size:8,fill:C.badT});
    b += t(320,208,"Ribbon width = volume; here 10M raw events split into loaded, duplicate and rejected records.",{size:9,fill:C.dim});
    return svg(222, b, "Sankey flow diagram"); })();

  D["dv-funnel"] = (() => {
    let b = t(320, 24, "Funnel: drop-off through sequential steps", { bold: true, size: 11.5 });
    const st=[["visited",400,"10,000"],["signed up",280,"6,000"],["verified",180,"4,200"],["purchased",96,"2,500"]];
    st.forEach((s,i)=>{const y=52+i*34,w=s[1],x=320-w/2;b+=box(x,y,w,28,{fill:C.acc,stroke:C.accS,r:4})+t(320,y+18,s[0]+"  ("+s[2]+")",{size:9,fill:C.accT});});
    b += t(320,208,"Each step shrinks; the biggest single drop (here verified -> purchased) is where to focus.",{size:9,fill:C.dim});
    return svg(222, b, "Funnel chart"); })();

  D["dv-waterfall"] = (() => {
    let b = t(320, 24, "Waterfall: how a total is built by + / - contributions", { bold: true, size: 11.5 });
    b += ln(48,44,48,176,{stroke:C.dim}) + ln(48,176,600,176,{stroke:C.dim});
    const sc=0.2, base=176; let run=0; const bars=[["start",500,0],["+new",120,1],["+exp",40,1],["-contr",-30,-1],["-churn",-70,-1],["end",560,0]];
    let x=64; bars.forEach(bar=>{let y0,h,fill,strk; if(bar[2]===0){h=bar[1]*sc;y0=base-h;fill=C.acc;strk=C.accS;run=bar[1];}else if(bar[2]===1){h=bar[1]*sc;y0=base-run*sc-h;fill=C.good;strk=C.goodS;run+=bar[1];}else{h=(-bar[1])*sc;y0=base-run*sc;fill=C.bad;strk=C.badS;run+=bar[1];} b+=box(x,y0,58,h,{fill:fill,stroke:strk,r:2})+t(x+29,y0-4,String(Math.abs(bar[1])),{size:7.5,fill:C.tx})+t(x+29,190,bar[0],{size:7.8,fill:C.dim}); x+=88;});
    b += t(320,208,"Start value, then floating up (green) and down (red) steps, landing on the end total.",{size:9,fill:C.dim});
    return svg(222, b, "Waterfall chart"); })();

  D["dv-pie"] = (() => {
    let b = t(320, 24, "Pie: only for 2-3 slices (angles read poorly)", { bold: true, size: 11.5 });
    const cx=200,cy=120,r=68; const data=[[0.45,C.accS,"A 45%"],[0.30,C.goodS,"B 30%"],[0.25,C.warn,"C 25%"]];
    let a=-Math.PI/2; data.forEach(d=>{const a1=a+d[0]*2*Math.PI;b+=slice(cx,cy,r,a,a1,{fill:d[1]});a=a1;});
    data.forEach((d,i)=>{const y=80+i*30;b+=box(360,y,14,14,{fill:d[1],r:2})+t(384,y+12,d[2],{a:"start",size:10,fill:C.tx});});
    b += t(320,206,"Fine for a couple of slices with one clear leader; beyond 3, use a sorted bar instead.",{size:9,fill:C.dim});
    return svg(220, b, "Pie chart"); })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
