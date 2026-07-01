/* Datalith - diagram pack 73 (Diagrams-for-DEs module). Clean geometry, ASCII labels. */
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
  const triR=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triR(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const cyl=(x,y,w,h,o={})=>{const ry=7;return `<path d="M${x} ${y+ry} A${w/2} ${ry} 0 0 1 ${x+w} ${y+ry} L${x+w} ${y+h-ry} A${w/2} ${ry} 0 0 1 ${x} ${y+h-ry} Z" style="fill:${o.fill||C.teal};stroke:${o.stroke||C.tealS};stroke-width:1.6"/><ellipse cx="${x+w/2}" cy="${y+ry}" rx="${w/2}" ry="${ry}" style="fill:${o.top||C.tealS};opacity:.5"/>`;};
  const crow=(x,y,o={})=>ln(x,y,x-12,y-7,o)+ln(x,y,x-12,y,o)+ln(x,y,x-12,y+7,o);
  const circ=(cx,cy,r,fill)=>`<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${fill}"/>`;
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  D["dv-architecture"] = (() => {
    let b = t(320, 24, "Architecture: source -> ingest -> store -> transform -> serve", { bold: true, size: 12 });
    const st = [[16,"Sources","APIs / DBs",C.box,C.boxS],[143,"Ingest","Kafka / Airflow",C.acc,C.accS],[270,"Store","lake / warehouse",C.teal,C.tealS],[397,"Transform","dbt / Spark",C.good,C.goodS],[524,"Serve","BI / API / ML",C.purp,C.purpS]];
    st.forEach(s => { b += box(s[0],70,104,64,{fill:s[3],stroke:s[4]}); b += t(s[0]+52,98,s[1],{bold:true,size:11}); b += t(s[0]+52,118,s[2],{size:8.5,fill:C.dim}); });
    [120,247,374,501].forEach(x => { b += arrowR(x,102,x+23,{stroke:C.accS}); });
    b += t(320, 168, "Boxes = services, arrows = data flow; mark data stores and label batch vs stream on the arrows.", { size: 9.2, fill: C.dim });
    return svg(188, b, "Data pipeline architecture from sources to serving"); })();

  D["dv-er"] = (() => {
    let b = t(320, 24, "ER diagram (crow's foot notation)", { bold: true, size: 12.5 });
    const ent = (x, name, f1, f2) => { let s = box(x,66,150,74,{r:6}); s += box(x,66,150,22,{r:6,fill:C.acc,stroke:C.accS}); s += t(x+75,81,name,{bold:true,size:10.5,fill:C.accT}); s += t(x+12,106,f1,{a:"start",size:9,fill:C.tx}); s += t(x+12,126,f2,{a:"start",size:9,fill:C.dim}); return s; };
    b += ent(24,"CUSTOMER","id  (PK)","email");
    b += ent(245,"ORDER","id  (PK)","cust_id (FK)");
    b += ent(466,"ORDER_ITEM","id  (PK)","order_id (FK)");
    b += ln(179,103,245,103,{stroke:C.line}) + ln(191,97,191,109,{stroke:C.line}) + crow(245,103,{stroke:C.line}) + t(212,95,"places",{size:8,fill:C.dim});
    b += ln(400,103,466,103,{stroke:C.line}) + ln(412,97,412,109,{stroke:C.line}) + crow(466,103,{stroke:C.line}) + t(433,95,"contains",{size:8,fill:C.dim});
    b += t(320,172,"|| one    -o{ zero-or-many (crow's foot).  A CUSTOMER places many ORDERs; each ORDER has many ORDER_ITEMs.",{size:8.8,fill:C.dim});
    return svg(192, b, "Entity relationship diagram with crow's foot notation"); })();

  D["dv-star"] = (() => {
    let b = t(320, 24, "Star schema: one fact, surrounding dimensions", { bold: true, size: 12 });
    b += box(258,96,124,58,{fill:C.acc,stroke:C.accS}) + t(320,120,"FACT_SALES",{bold:true,size:11,fill:C.accT}) + t(320,138,"measures + dim keys",{size:8,fill:C.accT});
    const dim = (x,y,name) => box(x,y,132,38,{fill:C.good,stroke:C.goodS}) + t(x+66,y+24,name,{size:9.5,fill:C.goodT});
    b += dim(30,46,"dim_date") + dim(478,46,"dim_customer") + dim(30,164,"dim_product") + dim(478,164,"dim_store");
    b += ln(150,72,258,104,{stroke:C.line}) + ln(490,72,382,104,{stroke:C.line}) + ln(150,178,258,146,{stroke:C.line}) + ln(490,178,382,146,{stroke:C.line});
    b += t(320,226,"Denormalized dimensions join to the central fact by key - few joins, fast analytics.",{size:9,fill:C.dim});
    return svg(238, b, "Star schema with a central fact and surrounding dimensions"); })();

  D["dv-dag"] = (() => {
    let b = t(320, 24, "Pipeline DAG: tasks + dependencies (acyclic)", { bold: true, size: 12 });
    const nd = [[16,"extract"],[140,"validate"],[264,"transform"],[388,"load"],[512,"publish"]];
    nd.forEach(n => { b += box(n[0],64,104,34,{fill:C.acc,stroke:C.accS,r:7}) + t(n[0]+52,85,n[1],{size:10,fill:C.accT}); });
    [120,244,368,492].forEach(x => { b += arrowR(x,81,x+20,{stroke:C.accS}); });
    b += box(110,138,120,34,{fill:C.bad,stroke:C.badS,r:7}) + t(170,159,"quarantine",{size:9.5,fill:C.badT});
    b += arrowD(192,98,138,{stroke:C.badS}) + t(232,124,"on fail",{a:"start",size:8.5,fill:C.badT});
    b += t(320,196,"Directed, acyclic: edges are dependencies; independent branches run in parallel (a cycle = deadlock).",{size:9,fill:C.dim});
    return svg(214, b, "Pipeline DAG of tasks and dependencies"); })();

  D["dv-sequence"] = (() => {
    let b = t(320, 22, "Sequence diagram: messages over time (downward)", { bold: true, size: 12 });
    const act = [[74,"Client"],[200,"API"],[330,"Kafka"],[460,"Worker"],[586,"DB"]];
    act.forEach(a => { b += box(a[0]-44,38,88,24,{r:6,fill:C.acc,stroke:C.accS}) + t(a[0],54,a[1],{size:9.5,fill:C.accT}); b += ln(a[0],62,a[0],206,{stroke:C.boxS,dash:true}); });
    const msg = (y,x1,x2,lbl,left,dash) => { let s = (left?arrowL(x1,y,x2,{stroke:dash?C.goodS:C.accS}):arrowR(x1,y,x2,{stroke:dash?C.goodS:C.accS})); s += t((x1+x2)/2, y-5, lbl, {size:8.2, fill:dash?C.goodT:C.tx}); return s; };
    b += msg(84,74,200,"request",false,false);
    b += msg(114,200,330,"produce",false,false);
    b += msg(144,330,460,"consume",false,false);
    b += msg(174,460,586,"upsert",false,false);
    b += msg(200,200,74,"202 (async)",true,true);
    b += t(320,224,"Vertical lifelines per actor; time flows down; solid = call, green dashed = response.",{size:9,fill:C.dim});
    return svg(238, b, "Sequence diagram of messages between actors over time"); })();

  D["dv-c4"] = (() => {
    let b = t(320, 24, "C4 model: zoom from context to container to component", { bold: true, size: 12 });
    b += box(24,60,180,120,{r:8}) + t(114,78,"1. Context",{bold:true,size:10,fill:C.accT});
    b += circ(114,104,10,C.purpS) + t(114,128,"users",{size:8,fill:C.dim});
    b += box(64,138,100,30,{fill:C.acc,stroke:C.accS,r:6}) + t(114,157,"System",{size:9.5,fill:C.accT});
    b += box(230,60,180,120,{r:8}) + t(320,78,"2. Container",{bold:true,size:10,fill:C.goodT});
    b += box(246,96,48,64,{fill:C.good,stroke:C.goodS,r:6}) + t(270,132,"Web",{size:8.5,fill:C.goodT});
    b += box(300,96,48,64,{fill:C.good,stroke:C.goodS,r:6}) + t(324,132,"API",{size:8.5,fill:C.goodT});
    b += cyl(356,96,40,64,{fill:C.teal,stroke:C.tealS}) + t(376,134,"DB",{size:8.5,fill:C.tealT});
    b += box(436,60,180,120,{r:8}) + t(526,78,"3. Component",{bold:true,size:10,fill:C.tealT});
    b += box(452,100,68,56,{fill:C.teal,stroke:C.tealS,r:6}) + t(486,132,"Controller",{size:8,fill:C.tealT});
    b += box(532,100,68,56,{fill:C.teal,stroke:C.tealS,r:6}) + t(566,132,"Service",{size:8,fill:C.tealT});
    b += arrowR(204,120,230,{stroke:C.accS}) + arrowR(410,120,436,{stroke:C.accS});
    b += t(320,196,"Each level zooms into the previous one - draw only the detail the audience needs.",{size:9,fill:C.dim});
    return svg(214, b, "C4 model context container component zoom levels"); })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
