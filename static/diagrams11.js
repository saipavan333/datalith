/* Datalith — diagram add-on pack 11 (ML for DE). Self-contained. */
(function () {
const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
  acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
  warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
const F="font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
const circ=(cx,cy,r,o={})=>`<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw??1.6}"/>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${F}">${esc(s)}</text>`;
const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
const path=(dd,o={})=>`<path d="${dd}" style="fill:none;stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x},${y} ${x+4},${y+7}" style="fill:${o.fill||C.line}"/>`;const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x},${y} ${x+4},${y-7}" style="fill:${o.fill||C.line}"/>`;const arrowR=(x1,y,x2)=>ln(x1,y,x2,y)+tri(x2,y);
const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
const D={};

D["ml-lifecycle"]=(()=>{let b=t(320,20,"The ML lifecycle (the DE owns the data path)",{bold:true});
const st=[["collect","DE"],["features","DE"],["train","DS"],["evaluate","DS"],["deploy","DE"],["monitor","DE"],["retrain","DE"]];
st.forEach((x,i)=>{const px=14+i*89;const de=x[1]==='DE';b+=box(px,60,80,42,{r:8,fill:de?C.acc:C.box,stroke:de?C.accS:C.boxS})+t(px+40,82,x[0],{size:9.5,bold:true,fill:de?C.accT:C.dim})+t(px+40,95,x[1],{size:8,fill:de?C.accT:C.warn});if(i<6)b+=arrowR(px+80,81,px+89);});
b+=path("M583 104 C 583 152, 54 152, 54 104",{stroke:C.warn})+triU(54,104,{fill:C.warn})+t(320,126,"retrain closes the loop when the model decays",{fill:C.warn,size:9});
b+=t(320,174,"blue = data-engineer owned (most of the work) · the model is one small box",{fill:C.dim,size:10.5});
return svg(186,b,"ml lifecycle");})();

D["ml-data-splits"]=(()=>{let b=t(320,20,"Split first, fit on TRAIN only — or you leak",{bold:true});
b+=box(40,52,180,34,{r:8})+t(130,73,"full dataset",{size:11,bold:true});
b+=arrowR(220,69,250);
b+=box(256,46,120,22,{r:5,fill:C.good,stroke:C.goodS})+t(316,61,"train (fit model)",{size:9.5,fill:C.goodT});
b+=box(256,72,120,22,{r:5,fill:C.acc,stroke:C.accS})+t(316,87,"val (tune)",{size:9.5,fill:C.accT});
b+=box(256,98,120,22,{r:5,fill:C.box,stroke:C.boxS})+t(316,113,"test (touch once)",{size:9.5});
b+=box(400,56,220,28,{r:7,fill:C.bad,stroke:C.badS})+t(510,74,"fit scaler/impute on TRAIN only",{size:9.5,fill:C.badT});
b+=path("M376 57 H 400",{stroke:C.line})+tri(400,57);
b+=t(510,104,"temporal data → split by TIME (past→future)",{fill:C.dim,size:9.5});
b+=t(320,150,"leakage = info unavailable at predict time entering training → inflated metrics, prod failure",{fill:C.dim,size:10.5});
return svg(166,b,"ml data splits");})();

D["feature-store"]=(()=>{let b=t(320,20,"Feature store: define once, no train/serve skew",{bold:true});
b+=box(244,44,152,32,{r:8,fill:C.acc,stroke:C.accS})+t(320,64,"feature definition",{bold:true,fill:C.accT,size:11});
b+=t(320,90,"materialize to both ▼",{fill:C.dim,size:9.5});
b+=box(70,108,210,44,{r:9,fill:C.good,stroke:C.goodS})+t(175,128,"OFFLINE store",{bold:true,fill:C.goodT,size:11})+t(175,144,"training · point-in-time correct",{fill:C.dim,size:9});
b+=box(360,108,210,44,{r:9,fill:C.good,stroke:C.goodS})+t(465,128,"ONLINE store",{bold:true,fill:C.goodT,size:11})+t(465,144,"serving · low-latency KV",{fill:C.dim,size:9});
b+=path("M300 76 C 200 90, 180 100, 175 108",{stroke:C.boxS})+triD(175,108);
b+=path("M340 76 C 440 90, 460 100, 465 108",{stroke:C.boxS})+triD(465,108);
b+=t(320,176,"same definition for training & inference → identical features → no skew",{fill:C.dim,size:10.5});
return svg(192,b,"feature store");})();

D["training-pipeline"]=(()=>{let b=t(320,20,"Training pipeline (tracked & reproducible)",{bold:true});
const st=[["features","from store",C.box],["split","train/val/test",C.box],["train","fit model",C.acc],["evaluate","metrics",C.acc],["register","if best",C.good]];
st.forEach((x,i)=>{const px=12+i*125;b+=box(px,58,112,46,{r:9,fill:x[2],stroke:x[2]===C.good?C.goodS:x[2]===C.acc?C.accS:C.boxS})+t(px+56,80,x[0],{bold:true,size:11,fill:x[2]===C.good?C.goodT:x[2]===C.acc?C.accT:C.tx})+t(px+56,96,x[1],{fill:C.dim,size:9});if(i<4)b+=arrowR(px+112,81,px+125);});
b+=box(150,124,340,28,{r:7,fill:"#10243f",stroke:C.accS})+t(320,143,"MLflow: log params · metrics · artifacts · code version",{fill:C.accT,size:9.5});
b+=t(320,172,"version data + code + config + env + seeds → the same model every run",{fill:C.dim,size:10.5});
return svg(188,b,"training pipeline");})();

D["model-serving"]=(()=>{let b=t(320,20,"Two ways to serve predictions",{bold:true});
b+=box(20,52,110,34,{r:8,fill:C.good,stroke:C.goodS})+t(75,73,"registry",{bold:true,fill:C.goodT,size:10.5});
b+=t(75,98,"Production model",{fill:C.dim,size:8.5});
// batch
b+=box(200,44,150,30,{r:7,fill:C.acc,stroke:C.accS})+t(275,63,"BATCH (scheduled)",{fill:C.accT,size:10,bold:true});
b+=box(390,44,210,30,{r:7})+t(495,63,"score dataset → predictions table",{size:9.5});
b+=arrowR(350,59,390);
// online
b+=box(200,92,150,30,{r:7,fill:C.acc,stroke:C.accS})+t(275,111,"ONLINE (API)",{fill:C.accT,size:10,bold:true});
b+=box(390,92,210,30,{r:7})+t(495,107,"feature lookup → score 1 req",{size:9.5})+t(495,118,"~50ms",{fill:C.dim,size:8});
b+=arrowR(350,107,390);
b+=path("M130 69 C 165 60, 180 56, 200 59",{stroke:C.goodS})+tri(200,59,{fill:C.goodS});
b+=path("M130 75 C 165 95, 180 104, 200 107",{stroke:C.goodS})+tri(200,107,{fill:C.goodS});
b+=t(320,150,"batch when precomputable; online when it depends on the live request — both load the Production model",{fill:C.dim,size:10});
return svg(166,b,"model serving");})();

D["mlops-loop"]=(()=>{let b=t(320,20,"MLOps: the keep-it-healthy loop",{bold:true});
const st=[["monitor","drift + perf",70],["detect decay","threshold",210],["retrain (CT)","new data",350],["validate","metrics",490]];
st.forEach((x,i)=>{b+=box(x[2]-62,56,124,44,{r:9,fill:i===0?C.acc:C.box,stroke:i===0?C.accS:C.boxS})+t(x[2],78,x[0],{bold:true,size:10.5,fill:i===0?C.accT:C.tx})+t(x[2],94,x[1],{fill:C.dim,size:9});if(i<3)b+=arrowR(x[2]+62,78,st[i+1][2]-62);});
b+=box(490-62,124,124,30,{r:8,fill:C.good,stroke:C.goodS})+t(490,143,"promote → serve",{fill:C.goodT,size:10});
b+=path("M490 100 V 124",{stroke:C.goodS})+triD(490,124,{fill:C.goodS});
b+=path("M428 139 C 70 165, 70 140, 70 100",{stroke:C.warn})+triU(70,100,{fill:C.warn})+t(250,162,"back to monitor — models decay, so the loop never stops",{fill:C.warn,size:9.5});
return svg(178,b,"mlops loop");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
