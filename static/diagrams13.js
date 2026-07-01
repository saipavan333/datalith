/* Datalith — diagram add-on pack 13 (shell loops). Self-contained. */
(function () {
const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
  acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
  warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
const F="font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${F}">${esc(s)}</text>`;
const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
const path=(dd,o={})=>`<path d="${dd}" style="fill:none;stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;
const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x},${y} ${x+4},${y+7}" style="fill:${o.fill||C.line}"/>`;
const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x},${y} ${x+4},${y-7}" style="fill:${o.fill||C.line}"/>`;
const arrowR=(x1,y,x2)=>ln(x1,y,x2,y)+tri(x2,y);
const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
const D={};

D["shell-loops"]=(()=>{let b=t(320,20,"Shell loops — repeat a body until done",{bold:true});
// three loop types (left column)
const lt=[["for x in LIST","each item in turn",C.acc,C.accS,C.accT],["while COND","run while TRUE",C.acc,C.accS,C.accT],["until COND","run until TRUE",C.good,C.goodS,C.goodT]];
lt.forEach((x,i)=>{const y=50+i*42;b+=box(20,y,206,34,{r:8,fill:x[3]===C.goodS?"#102a22":"#10243f",stroke:x[3]})+t(34,y+15,x[0],{a:"start",bold:true,size:11,fill:x[4]})+t(34,y+28,x[1],{a:"start",size:9.5,fill:C.dim});});
// flowchart (right) ── enter → cond? → yes → body → (repeat over top) ; cond → no → exit
b+=box(282,76,54,28,{r:7})+t(309,94,"enter",{size:10});
b+=`<polygon points="400,58 446,90 400,122 354,90" style="fill:#10243f;stroke:${C.accS};stroke-width:1.6"/>`;
b+=t(400,87,"next item /",{size:9,fill:C.accT})+t(400,99,"cond?",{size:9.5,fill:C.accT,bold:true});
b+=arrowR(336,90,354);                                              // enter → cond
b+=arrowR(446,90,500)+t(473,82,"yes",{size:9,fill:C.goodT});        // cond → body
b+=box(500,73,120,34,{r:8,fill:C.acc,stroke:C.accS})+t(560,94,"loop body",{bold:true,size:11,fill:C.accT});
// repeat: body arcs OVER the top back into cond (points DOWN into the diamond top)
b+=path("M540 73 C 540 36, 400 30, 400 58",{stroke:C.line})+triD(400,58)+t(470,34,"repeat",{size:9,fill:C.dim});
// no → exit (down out of the diamond bottom)
b+=path("M400 122 V 150",{stroke:C.line})+triD(400,150)+t(380,140,"no",{size:9,fill:C.dim});
b+=box(356,150,88,26,{r:7,fill:C.bad,stroke:C.badS})+t(400,167,"exit loop",{size:10,fill:C.badT});
// break (dashed) : body → exit, head points LEFT into the exit box
b+=path("M560 107 C 560 164, 470 164, 446 164",{stroke:C.badS,dash:true})+triL(444,164,{fill:C.badS})+t(545,120,"break",{size:8.5,fill:C.badT});
b+=t(320,196,"continue → skip to the next test · break → leave the loop now",{fill:C.dim,size:10.5});
return svg(212,b,"shell loops");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
