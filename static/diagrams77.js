/* Datalith - diagram pack 77 (RAG data pipelines + OpenLineage). Clean geometry, ASCII labels. */
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
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triR(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  D["rag-index"] = (() => {
    let b=t(320,24,"RAG indexing - documents become a searchable vector store",{bold:true,size:12});
    const xs=[20,144,268,392,516], labs=["Source docs","Load & parse","Chunk","Embed","Vector store"],
      subs=["PDF / HTML / DB","extract text","split + overlap","embedding model","+ metadata"],
      fl=[C.box,C.box,C.acc,C.acc,C.good], st=[C.boxS,C.boxS,C.accS,C.accS,C.goodS];
    xs.forEach((x,i)=>{ b+=box(x,56,100,44,{fill:fl[i],stroke:st[i],r:7})+t(x+50,82,labs[i],{size:10,bold:true}); b+=t(x+50,118,subs[i],{size:8.5,fill:C.dim}); if(i<4) b+=arrowR(x+100,78,xs[i+1],{stroke:C.line}); });
    b+=t(442,146,"[0.12, -0.41, 0.87, ...]",{size:9,mono:true,fill:C.accT});
    b+=t(320,176,"Chunking + the embedding model are the two biggest quality levers.",{size:9.5,fill:C.dim});
    return svg(194,b,"RAG indexing pipeline from documents to a vector store"); })();

  D["rag-query"] = (() => {
    let b=t(320,24,"RAG query time - retrieve, then generate",{bold:true,size:12});
    const xs=[20,144,268,392,516], labs=["User query","Embed","Search top-k","Augment","Generate"],
      subs=["question","query vector","vector store","prompt + context","LLM -> answer"],
      fl=[C.box,C.acc,C.acc,C.purp,C.good], st=[C.boxS,C.accS,C.accS,C.purpS,C.goodS];
    xs.forEach((x,i)=>{ b+=box(x,58,100,44,{fill:fl[i],stroke:st[i],r:7})+t(x+50,84,labs[i],{size:10,bold:true}); b+=t(x+50,120,subs[i],{size:8.5,fill:C.dim}); if(i<4) b+=arrowR(x+100,80,xs[i+1],{stroke:C.line}); });
    b+=box(258,150,120,30,{fill:C.teal,stroke:C.tealS,r:6})+t(318,170,"Vector store",{size:9,fill:C.tealT});
    b+=arrowU(318,150,104,{stroke:C.tealS});
    b+=t(320,198,"Answer is grounded in retrieved context; eval on groundedness & relevance.",{size:9.5,fill:C.dim});
    return svg(212,b,"RAG query-time retrieval and generation flow"); })();

  D["rag-chunking"] = (() => {
    let b=t(320,24,"Chunking strategies - the RAG quality lever",{bold:true,size:12});
    const panels=[[24,"Fixed-size + overlap","even windows + overlap"],[230,"Structural","respects doc structure"],[436,"Semantic","groups by meaning"]];
    panels.forEach(p=>{ b+=box(p[0],42,180,152,{fill:"#12182a",stroke:C.boxS,r:8})+t(p[0]+90,62,p[1],{size:10,bold:true,fill:C.accT})+t(p[0]+90,184,p[2],{size:8.5,fill:C.dim}); });
    const doc=(x,splits,col)=>{ let s=box(x,74,44,96,{fill:"#0f1830",stroke:C.boxS,r:4}); splits.forEach(sy=>s+=ln(x,74+sy,x+44,74+sy,{stroke:col,sw:1.6})); return s; };
    b+=doc(92,[24,48,72],C.accS);
    b+=doc(298,[34,64],C.goodS);
    b+=doc(504,[30,66],C.purpS);
    b+=t(320,208,"Small chunks = precise but lose context; large = more context but noisier retrieval.",{size:9.5,fill:C.dim});
    return svg(222,b,"Three chunking strategies compared"); })();

  D["openlineage"] = (() => {
    let b=t(320,24,"OpenLineage - one standard event for lineage",{bold:true,size:12});
    b+=box(24,56,150,46,{r:7})+t(99,78,"Input dataset(s)",{size:10})+t(99,94,"raw.orders",{size:8.5,mono:true,fill:C.dim});
    b+=box(246,50,148,58,{fill:C.acc,stroke:C.accS,r:8})+t(320,74,"Run of a Job",{size:10.5,bold:true,fill:C.accT})+t(320,92,"START -> COMPLETE",{size:8.5,mono:true,fill:C.accT});
    b+=box(466,56,150,46,{fill:C.good,stroke:C.goodS,r:7})+t(541,78,"Output dataset(s)",{size:10})+t(541,94,"clean.orders",{size:8.5,mono:true,fill:C.dim});
    b+=arrowR(174,79,246,{stroke:C.line})+t(210,70,"reads",{size:8,fill:C.dim});
    b+=arrowR(394,79,466,{stroke:C.line})+t(430,70,"writes",{size:8,fill:C.dim});
    b+=box(246,118,148,42,{fill:"#0f1830",stroke:C.boxS,r:6})+t(320,135,"Facets",{size:9,bold:true,fill:C.warnT})+t(320,151,"schema · stats · dataQuality",{size:8,fill:C.dim});
    b+=arrowD(320,108,118,{stroke:C.warn});
    b+=t(320,182,"Events assemble into a lineage graph, gathered by a backend:",{size:9.5,fill:C.dim});
    const g=[[90,"raw"],[250,"clean"],[410,"mart"],[560,"dashboard"]];
    g.forEach((n,i)=>{ b+=box(n[0]-46,196,92,28,{r:6})+t(n[0],214,n[1],{size:9}); if(i<3) b+=arrowR(n[0]+46,210,g[i+1][0]-46,{stroke:C.accS}); });
    b+=t(320,240,"Airflow, Spark & dbt emit OpenLineage -> one graph (e.g. Marquez).",{size:9,fill:C.dim});
    return svg(252,b,"OpenLineage event model feeding a lineage graph"); })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS||{}, D);
})();
