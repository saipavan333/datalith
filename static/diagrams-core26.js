/* Datalith - diagram pack core26 (Nov 2026 core-track upgrade: CDC, Kafka log, table-format commits,
   schema compatibility, Dagster assets, Spark shuffle, platform design). Same palette + helpers as packs 1-78. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", warnT:"#ffd27a", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d",
    purp:"#2b2350", purpS:"#a78bfa", purpT:"#c9b6ff", teal:"#10303a", tealS:"#29b5e8", tealT:"#7fd6f2", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12}px;font-weight:${o.bold?700:400};${F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const triR=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.stroke||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.stroke||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2-1,y,o)+triR(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2+1,y,o)+triL(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2-1,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2+1,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* ---------- 1. CDC: query-based polling vs log-based ---------- */
  D["cdc-log-vs-query"] = (() => {
    let b = t(320,24,"Two ways to copy changes out of an app database",{bold:true,size:13});
    b += box(20,44,150,196,{fill:C.box,stroke:C.boxS,r:10});
    b += t(95,64,"App database",{bold:true,size:11.5});
    b += box(34,82,122,44,{fill:C.acc,stroke:C.accS,r:6})+t(95,101,"orders table",{size:10.5,fill:C.accT})+t(95,116,"current state only",{size:8.5,fill:C.dim});
    b += box(34,164,122,52,{fill:C.purp,stroke:C.purpS,r:6})+t(95,184,"WAL / binlog",{size:10.5,fill:C.purpT})+t(95,200,"every change,",{size:8.5,fill:C.dim})+t(95,211,"in commit order",{size:8.5,fill:C.dim});
    // row A: query-based
    b += arrowR(156,104,226,{stroke:C.warn});
    b += box(226,82,186,44,{fill:C.warnFill,stroke:C.warn,r:6})+t(319,100,"Poller (every 15 min)",{size:10.5,fill:C.warnT})+t(319,116,"WHERE updated_at > :watermark",{size:8.5,fill:C.dim});
    b += arrowR(412,104,470,{stroke:C.warn});
    b += t(319,146,"misses hard deletes + updates between polls",{size:8.5,fill:C.badT});
    // row B: log-based
    b += arrowR(156,190,190,{stroke:C.purpS});
    b += box(190,168,108,44,{fill:C.purp,stroke:C.purpS,r:6})+t(244,186,"Debezium",{size:10.5,fill:C.purpT})+t(244,202,"Kafka Connect",{size:8.5,fill:C.dim});
    b += arrowR(298,190,320,{stroke:C.purpS});
    b += box(320,168,104,44,{fill:C.teal,stroke:C.tealS,r:6})+t(372,186,"Kafka topic",{size:10.5,fill:C.tealT})+t(372,202,"op c / u / d",{size:8.5,fill:C.dim});
    b += arrowR(424,190,470,{stroke:C.goodS});
    b += t(447,182,"MERGE",{size:7.5,fill:C.goodT});
    b += t(307,232,"sees every insert / update / delete; light load on the source",{size:8.5,fill:C.goodT});
    // target
    b += box(470,44,150,196,{fill:C.good,stroke:C.goodS,r:10});
    b += t(545,64,"Warehouse / lake",{bold:true,size:11.5,fill:C.goodT});
    b += box(484,82,122,44,{fill:C.bad,stroke:C.badS,r:6})+t(545,101,"query copy",{size:10,fill:C.badT})+t(545,116,"deleted row still here",{size:8.5,fill:C.dim});
    b += box(484,168,122,44,{fill:C.good,stroke:C.goodS,r:6})+t(545,187,"log copy",{size:10,fill:C.goodT})+t(545,202,"matches the source",{size:8.5,fill:C.dim});
    b += t(320,268,"Query-based CDC reads tables. Log-based CDC reads the database's own change log.",{size:9.5,fill:C.dim});
    return svg(282,b,"Query-based CDC polling versus log-based CDC with Debezium and Kafka");
  })();

  /* ---------- 2. One Kafka partition: segments, offsets, high watermark, ISR ---------- */
  D["kafka-partition-log"] = (() => {
    const x0=40, w=44, y=74, h=34;
    let b = t(320,22,"One partition of topic 'orders' = an append-only log",{bold:true,size:13});
    // segment brackets
    [[0,4,"segment 0 (closed)"],[4,8,"segment 1 (closed)"],[8,12,"active segment"]].forEach(([a,z,l])=>{
      const xa=x0+a*w+2, xz=x0+z*w-2;
      b += ln(xa,56,xz,56,{stroke:C.dim,sw:1.2})+ln(xa,56,xa,62,{stroke:C.dim,sw:1.2})+ln(xz,56,xz,62,{stroke:C.dim,sw:1.2});
      b += t((xa+xz)/2,50,l,{size:8.5,fill:C.dim});
    });
    for (let i=0;i<12;i++){
      const pending=i>=10;
      b += box(x0+i*w,y,w,h,{r:3,fill:pending?C.warnFill:C.acc,stroke:pending?C.warn:C.accS,sw:1.3});
      b += t(x0+i*w+w/2,y+21,String(i),{size:11,fill:pending?C.warnT:C.accT,bold:true});
    }
    // producer
    b += arrowL(626,91,x0+12*w+4,{stroke:C.goodS});
    b += t(606,70,"producer",{size:8.5,fill:C.goodT});
    // markers under the log
    const hw=x0+10*w;
    b += ln(hw,64,hw,232,{stroke:C.warn,dash:true,sw:1.4});
    b += arrowU(x0+5*w+w/2,146,y+h+3,{stroke:C.tealS});
    b += t(x0+5*w+w/2,160,"group 'billing'",{size:8.5,fill:C.tealT})+t(x0+5*w+w/2,172,"committed offset 5",{size:8.5,fill:C.tealT});
    b += t(hw-6,130,"high watermark = 10",{a:"end",size:9,fill:C.warnT,bold:true});
    b += t(hw-6,142,"consumers can read 0-9",{a:"end",size:8.5,fill:C.dim});
    b += t(x0+12*w,124,"log end",{size:8.5,fill:C.dim})+t(x0+12*w,136,"offset 12",{size:8.5,fill:C.dim});
    // replicas
    b += box(x0,184,12*w,15,{r:3,fill:C.acc,stroke:C.accS,sw:1})+t(x0+8,195,"leader (broker 1): offsets 0-11",{a:"start",size:8.5,fill:C.accT});
    b += box(x0,203,11*w,15,{r:3,fill:C.teal,stroke:C.tealS,sw:1})+t(x0+8,214,"follower (broker 2): 0-10",{a:"start",size:8.5,fill:C.tealT});
    b += box(x0,222,10*w,15,{r:3,fill:C.teal,stroke:C.tealS,sw:1})+t(x0+8,233,"follower (broker 3): 0-9  <- slowest in-sync replica sets the high watermark",{a:"start",size:8.5,fill:C.tealT});
    b += t(320,260,"High watermark = the offset every in-sync replica has. Only records below it are visible to consumers.",{size:9,fill:C.dim});
    b += t(320,276,"Offsets 10-11 (amber) are written on the leader but not yet safe, so consumers can't see them yet.",{size:9,fill:C.dim});
    return svg(290,b,"Kafka partition log with segments, consumer offset, high watermark and in-sync replicas");
  })();

  /* ---------- 3. Table-format commit: catalog pointer -> metadata -> manifests -> files ---------- */
  D["lake-commit-tree"] = (() => {
    let b = t(320,22,"How an Iceberg table commits (Delta and Hudi follow the same idea)",{bold:true,size:13});
    b += box(300,36,250,40,{fill:C.purp,stroke:C.purpS,r:8})+t(425,53,"Catalog: db.orders",{size:11,fill:C.purpT,bold:true})+t(425,68,"current pointer -> v3.metadata.json",{size:8.5,fill:C.dim});
    b += box(330,104,190,42,{fill:C.acc,stroke:C.accS,r:6})+t(425,122,"v3.metadata.json",{size:10.5,fill:C.accT})+t(425,137,"schema, partition spec, snapshots",{size:8,fill:C.dim});
    b += arrowD(425,76,104,{stroke:C.purpS});
    b += box(60,104,190,42,{fill:C.box,stroke:C.boxS,r:6,dash:true})+t(155,122,"v2.metadata.json",{size:10.5,fill:C.dim})+t(155,137,"older snapshot (time travel)",{size:8,fill:C.dim});
    b += ln(300,56,155,56,{stroke:C.dim,dash:true,sw:1.3})+arrowD(155,56,104,{stroke:C.dim,dash:true,sw:1.3});
    b += t(228,50,"old pointer",{size:8,fill:C.dim});
    b += box(330,172,190,36,{fill:C.teal,stroke:C.tealS,r:6})+t(425,188,"snapshot 3 -> manifest list",{size:10,fill:C.tealT})+t(425,201,"which manifests make up S3",{size:7.5,fill:C.dim});
    b += arrowD(425,146,172,{stroke:C.tealS});
    // manifests
    b += ln(425,208,425,220)+ln(360,220,490,220)+arrowD(360,220,232)+arrowD(490,220,232);
    b += box(300,232,120,36,{fill:C.teal,stroke:C.tealS,r:6})+t(360,248,"manifest A",{size:10,fill:C.tealT})+t(360,261,"files + column stats",{size:7.5,fill:C.dim});
    b += box(430,232,120,36,{fill:C.teal,stroke:C.tealS,r:6})+t(490,248,"manifest B",{size:10,fill:C.tealT})+t(490,261,"files + column stats",{size:7.5,fill:C.dim});
    // data files
    b += ln(360,268,360,280)+ln(330,280,390,280)+arrowD(330,280,292)+arrowD(390,280,292);
    b += ln(490,268,490,280)+ln(460,280,520,280)+arrowD(460,280,292)+arrowD(520,280,292);
    [[300,"part-001",C.good,C.goodS,C.goodT],[360,"part-002",C.good,C.goodS,C.goodT],[430,"part-003",C.good,C.goodS,C.goodT],[490,"deletes",C.bad,C.badS,C.badT]].forEach(([x,l,f,s,tc])=>{
      b += box(x,292,60,28,{fill:f,stroke:s,r:5})+t(x+30,310,l,{size:8.5,fill:tc});
    });
    b += t(425,336,"Parquet data files + a delete file / deletion vector",{size:8.5,fill:C.dim});
    // left notes
    const notes=["A commit is two steps:","1. write new data + metadata files","   (nobody can see them yet)","2. swap the catalog pointer v2 -> v3","   in one atomic compare-and-swap.","If another writer swapped first,","re-read, check for conflicts, retry.","Old snapshots keep pointing at","the same files: no copies made."];
    notes.forEach((s,i)=>{ b += t(36,182+i*16,s,{a:"start",size:9,fill:i===0?C.tx:C.dim,bold:i===0}); });
    return svg(350,b,"Iceberg commit tree: catalog pointer, metadata file, manifest list, manifests and data files");
  })();

  /* ---------- 4. Schema compatibility modes ---------- */
  D["schema-compat"] = (() => {
    let b = t(320,22,"Schema compatibility: who can read whom?",{bold:true,size:13});
    const rows=[
      ["BACKWARD","new reader (v2) reads old data (v1)","upgrade CONSUMERS first","add field WITH default; delete field",C.acc,C.accS,C.accT],
      ["FORWARD","old reader (v1) reads new data (v2)","upgrade PRODUCERS first","add field; delete field WITH default",C.teal,C.tealS,C.tealT],
      ["FULL","both directions work","upgrade in any order","add / delete only fields WITH defaults",C.good,C.goodS,C.goodT],
    ];
    rows.forEach((r,i)=>{
      const y=40+i*70;
      b += box(20,y,112,56,{fill:r[4],stroke:r[5],r:8})+t(76,y+33,r[0],{size:11.5,bold:true,fill:r[6]});
      b += box(144,y,476,56,{fill:C.box,stroke:C.boxS,r:8});
      b += t(158,y+18,r[1],{a:"start",size:10,fill:C.tx});
      b += t(158,y+34,r[2],{a:"start",size:9,fill:r[6],bold:true});
      b += t(158,y+49,"safe changes: "+r[3],{a:"start",size:8.5,fill:C.dim});
    });
    b += box(20,254,600,34,{fill:C.bad,stroke:C.badS,r:8})+t(320,275,"Never safe without a migration: renaming a field, or changing its type (string -> int)",{size:9.5,fill:C.badT});
    b += t(320,306,"_TRANSITIVE variants check against ALL earlier versions, not just the previous one.",{size:9,fill:C.dim});
    return svg(318,b,"Schema compatibility modes backward, forward and full with safe changes");
  })();

  /* ---------- 5. Airflow tasks vs Dagster assets ---------- */
  D["dagster-assets"] = (() => {
    let b = t(320,22,"Same pipeline, two mental models",{bold:true,size:13});
    b += t(30,48,"Task-centric (Airflow DAG): \"run these steps in this order\"",{a:"start",size:10,bold:true,fill:C.warnT});
    [["extract_orders",30],["transform",230],["load_revenue",430]].forEach(([l,x],i)=>{
      b += box(x,58,170,36,{fill:C.warnFill,stroke:C.warn,r:6})+t(x+85,81,l+"()",{size:10,fill:C.warnT});
      if(i<2) b += arrowR(x+170,76,x+200,{stroke:C.warn});
    });
    b += t(320,112,"The scheduler knows tasks ran. It does not know which tables they made.",{size:8.5,fill:C.dim});
    b += t(30,140,"Asset-centric (Dagster): \"these tables should exist, built from those\"",{a:"start",size:10,bold:true,fill:C.goodT});
    [["raw_orders",30],["stg_orders",230],["daily_revenue",430]].forEach(([l,x],i)=>{
      b += box(x,150,170,62,{fill:C.good,stroke:C.goodS,r:6})+t(x+85,170,l,{size:10.5,fill:C.goodT,bold:true});
      for(let k=0;k<7;k++){ const ok=!(i===2&&k===6); b += box(x+14+k*20,180,16,12,{r:2,fill:ok?C.goodS:C.box,stroke:ok?C.goodS:C.warn,sw:1}); }
      b += t(x+85,206,"daily partitions",{size:7.5,fill:C.dim});
      if(i<2) b += arrowR(x+170,181,x+200,{stroke:C.goodS});
    });
    b += box(430,222,170,26,{fill:C.purp,stroke:C.purpS,r:6})+t(515,239,"asset check: revenue >= 0",{size:8.5,fill:C.purpT});
    b += arrowU(515,222,212,{stroke:C.purpS});
    b += t(320,270,"Each asset knows its upstreams, its partitions and when each was last built.",{size:9,fill:C.dim});
    b += t(320,285,"The hollow square = one partition still missing, so a backfill knows exactly what to run.",{size:9,fill:C.dim});
    return svg(298,b,"Airflow task graph versus Dagster software-defined asset graph with partitions and an asset check");
  })();

  /* ---------- 6. Spark shuffle: map tasks -> shuffle files -> reduce tasks ---------- */
  D["spark-shuffle-exchange"] = (() => {
    let b = t(320,22,"groupBy(country): a shuffle moves every row to the task that owns its key",{bold:true,size:12.5});
    const keyC={IN:[C.acc,C.accS,C.accT],US:[C.good,C.goodS,C.goodT],DE:[C.purp,C.purpS,C.purpT]};
    const maps=[["IN","US","DE","IN"],["US","US","IN","DE"],["DE","IN","US","DE"]];
    b += t(90,48,"Stage 1: map tasks",{size:10,bold:true});
    b += t(550,48,"Stage 2: reduce tasks",{size:10,bold:true});
    maps.forEach((rows,i)=>{
      const y=60+i*78;
      b += box(20,y,140,64,{fill:C.box,stroke:C.boxS,r:6})+t(90,y+14,"input partition "+i,{size:8.5,fill:C.dim});
      rows.forEach((k,j)=>{ const c=keyC[k]; b += box(30+j*32,y+24,28,28,{r:4,fill:c[0],stroke:c[1],sw:1.2})+t(44+j*32,y+42,k,{size:9,fill:c[2],bold:true}); });
    });
    // shuffle files column
    b += box(208,60,120,220,{fill:C.warnFill,stroke:C.warn,r:8,dash:true});
    b += t(268,78,"shuffle files",{size:9.5,fill:C.warnT,bold:true})+t(268,92,"on local disk",{size:8,fill:C.dim});
    b += t(268,262,"hash(key) % 3",{size:9,fill:C.warnT});
    b += t(268,274,"picks the target",{size:7.5,fill:C.dim});
    maps.forEach((_,i)=>{ b += arrowR(160,92+i*78,208,{stroke:C.line}); });
    const red=[["DE",0],["IN",1],["US",2]];
    red.forEach(([k,i])=>{
      const y=60+i*78, c=keyC[k];
      b += box(480,y,140,64,{fill:c[0],stroke:c[1],r:6})+t(550,y+26,"reduce task "+i,{size:9.5,fill:c[2],bold:true})+t(550,y+44,"all "+k+" rows",{size:9,fill:C.dim});
    });
    // all-to-all fetch lines
    [0,1,2].forEach(src=>[0,1,2].forEach(dst=>{
      b += ln(328,110+src*60,476,92+dst*78,{stroke:C.dim,sw:1});
    }));
    [0,1,2].forEach(dst=>{ b += triR(480,92+dst*78); });
    b += t(404,272,"every reducer pulls",{size:8.5,fill:C.dim})+t(404,284,"from every map task",{size:8.5,fill:C.dim});
    b += t(320,310,"3 map x 3 reduce = 9 transfers. At 2,000 x 2,000 tasks it is 4 million. That is why shuffles are slow.",{size:9,fill:C.dim});
    return svg(324,b,"Spark shuffle: map tasks write hash-partitioned shuffle files that every reduce task fetches");
  })();

  /* ---------- 7. Data platform at real scale ---------- */
  D["platform-at-scale"] = (() => {
    let b = t(320,22,"A batch + streaming data platform for a 30M-user marketplace",{bold:true,size:13});
    const src=[["40 Postgres DBs","CDC, ~240 GB/day"],["Clickstream","~840 GB/day, 280k ev/s pk"],["SaaS APIs","Stripe, Salesforce, hourly"]];
    src.forEach((s,i)=>{ const y=42+i*58; b += box(14,y,128,46,{fill:C.box,stroke:C.boxS,r:6})+t(78,y+19,s[0],{size:9.5,bold:true})+t(78,y+35,s[1],{size:7.5,fill:C.dim}); });
    b += box(168,42,104,104,{fill:C.teal,stroke:C.tealS,r:8})+t(220,74,"Kafka",{size:11,fill:C.tealT,bold:true})+t(220,92,"Debezium +",{size:8,fill:C.dim})+t(220,104,"event collectors",{size:8,fill:C.dim})+t(220,122,"7-day retention",{size:8,fill:C.dim});
    b += box(168,158,104,46,{fill:C.box,stroke:C.boxS,r:8})+t(220,178,"EL tool",{size:10,bold:true})+t(220,193,"batch pulls",{size:8,fill:C.dim});
    b += arrowR(142,65,168)+arrowR(142,123,168)+arrowR(142,181,168);
    // lake
    b += box(296,42,190,162,{fill:C.good,stroke:C.goodS,r:10})+t(391,60,"Lakehouse (Iceberg on GCS/S3)",{size:9.5,fill:C.goodT,bold:true});
    [["bronze","raw, append-only, 90 d"],["silver","deduped, typed, merged CDC"],["gold","facts, dims, metrics"]].forEach((r,i)=>{
      const y=72+i*42; b += box(308,y,166,34,{fill:"#0f2a22",stroke:C.goodS,r:5})+t(391,y+15,r[0],{size:9.5,fill:C.goodT,bold:true})+t(391,y+28,r[1],{size:7.5,fill:C.dim});
    });
    b += arrowR(272,94,296)+arrowR(272,181,296);
    // compute
    b += box(296,220,190,40,{fill:C.acc,stroke:C.accS,r:8})+t(391,237,"Spark + dbt, orchestrated",{size:9.5,fill:C.accT,bold:true})+t(391,251,"streaming job for bronze, hourly for gold",{size:7.5,fill:C.dim});
    b += arrowU(391,220,204,{stroke:C.accS});
    // serve
    const sv=[["Warehouse / BI","dashboards, 2k analysts"],["Feature store","ML, online + offline"],["Reverse ETL","CRM, ads tools"]];
    sv.forEach((s,i)=>{ const y=42+i*58; b += box(510,y,118,46,{fill:C.purp,stroke:C.purpS,r:6})+t(569,y+19,s[0],{size:9.5,fill:C.purpT,bold:true})+t(569,y+35,s[1],{size:7.5,fill:C.dim}); });
    b += arrowR(486,65,510)+arrowR(486,123,510)+arrowR(486,181,510);
    b += box(14,276,614,30,{fill:C.warnFill,stroke:C.warn,r:8})+t(320,295,"Across everything: catalog + lineage, data contracts, quality checks, cost tags, on-call SLOs",{size:9.5,fill:C.warnT});
    b += t(320,326,"Numbers are a design brief, not one company's real figures. Size your own with the capacity math in the lesson.",{size:8.5,fill:C.dim});
    return svg(338,b,"Reference architecture for a data platform at real scale: CDC and clickstream into Kafka, Iceberg lakehouse, serving layers");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS||{}, D);
})();
