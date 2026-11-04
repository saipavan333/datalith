/* Datalith pass 2 — Track 27: DSA for data engineering (part 2 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const cell = P2L.dsaCell;

  /* ---------------------------------------------------------------- dsa-hll */
  const HI = [["u17", "01", "0001..."], ["u42", "11", "1..."], ["u88", "01", "01..."], ["u03", "00", "001..."], ["u61", "10", "00001..."], ["u29", "11", "001..."]];
  P["dsa-hll"] = {
    simple: [
      "Counting distinct users exactly means remembering every user id you've seen. With billions of ids that set takes gigabytes. **HyperLogLog** (HLL) estimates the distinct count in a few kilobytes instead.",
      "The trick: hash each id into random-looking bits. A run of many leading zeros is rare, so if the longest run you've seen is k zeros, you've probably seen around 2^k distinct values. Repeating an id gives the same hash, so duplicates change nothing.",
      "To cut the error, HLL splits hashes into many **registers** by their first bits, keeps the longest run in each, and averages. With 16,384 registers the typical error is about 0.8% (1.04 divided by the square root of the register count). Sketches from different partitions **merge** by taking the max per register, which is how `APPROX_COUNT_DISTINCT` works in BigQuery and Spark.",
    ],
    analogy: {
      text: "Think of guessing how many times friends flipped coins from their longest streak of heads.",
      left: "Coin flips", right: "HyperLogLog",
      map: [
        ["Someone flipped 10 heads in a row", "A hash with many leading zeros"],
        ["That takes about 1,000 tries", "Seen roughly 2^k distinct values"],
        ["Asking many friends and averaging", "Many registers, averaged"],
        ["The same friend repeating a flip record", "A duplicate id changes nothing"],
      ],
      breaks: "coin streaks are luck, and so is one register. HLL is only accurate because thousands of registers are combined; with a handful of registers, as in the picture, the estimate is rough.",
    },
    svg: () => {
      let b = t(240, 18, "Toy HLL: 4 registers chosen by the first 2 hash bits", { bold: true, size: 13 });
      b += table(16, 34, ["id", "reg bits", "rest of hash", "zeros+1"], HI.map(([i, r, h]) => [i, r, h, String(h.indexOf("1") + 1)]), { cw: [50, 70, 100, 70], rh: 23, size: 11 });
      const reg = { "00": 0, "01": 0, "10": 0, "11": 0 }; HI.forEach(([, r, h]) => { reg[r] = Math.max(reg[r], h.indexOf("1") + 1); });
      b += t(390, 44, "registers keep the max", { size: 11, fill: C.dim });
      ["00", "01", "10", "11"].map(r => [r, reg[r]]).forEach(([r, v], j) => { b += cell(330 + (j % 2) * 64, 54 + Math.floor(j / 2) * 52, 56, 44, v, "acc", { sub: "reg " + r, size: 14 }); });
      b += t(240, 222, "estimate from the harmonic mean of 2^register, times a correction", { size: 11, fill: C.dim, max: 456 });
      b += t(240, 242, "merge two sketches: max of each register. Memory never grows.", { size: 11, fill: C.goodT });
      return svg(480, 254, b, "HyperLogLog registers storing the longest run of leading zeros");
    },
    caption: "Each register remembers only one small number, the longest zero run it has seen, whatever the number of ids.",
    oneline: "HyperLogLog guesses how many different things it has seen from rare hash patterns, in a tiny fixed memory.",
  };

  /* ---------------------------------------------------------------- dsa-cms */
  const CMSK = { US: [2, 5, 1], IN: [6, 0, 4], UK: [2, 3, 4] }, CMSN = { US: 5, IN: 3, UK: 1 };
  P["dsa-cms"] = {
    simple: [
      "HyperLogLog counts how many different keys there are. A **Count-Min Sketch** answers a different question: roughly how often has each key appeared? It uses fixed memory, without a counter for every key.",
      "It is a small grid: d rows of w counters, with one hash function per row. To add a key, hash it once per row and add 1 to that counter in each row. To estimate a key's count, read its counter in each row and take the **minimum**.",
      "Other keys can land in the same counter and inflate it, but never deflate it, so the estimate is never too low, and the minimum is usually close. That makes it good for finding **heavy hitters**, such as hot keys that will skew a Spark job.",
    ],
    analogy: {
      text: "Think of three tally boards where each word gets a box on each board, and some words share boxes.",
      left: "Tally boards", right: "Count-Min Sketch",
      map: [
        ["Three boards with different box rules", "d rows, each with its own hash"],
        ["Each mention adds a tick on every board", "Increment d counters"],
        ["Shared boxes collect other words' ticks too", "Collisions inflate counts"],
        ["Trust the smallest of the three tallies", "Estimate = minimum"],
      ],
      breaks: "tally boards can be checked by hand. A sketch can't list its keys or give exact counts; pair it with a small heap if you need the actual top keys.",
    },
    svg: () => {
      let b = t(240, 18, "3 x 8 sketch after US x5, IN x3, UK x1", { bold: true, size: 13.5 });
      const g = [0, 1, 2].map(() => Array(8).fill(0)); Object.entries(CMSK).forEach(([k, cs]) => cs.forEach((c, r) => { g[r][c] += CMSN[k]; }));
      g.forEach((rw, r) => { b += t(16, 56 + r * 40, "h" + (r + 1), { a: "start", size: 12, bold: true, mono: true }); rw.forEach((v, c) => { b += cell(48 + c * 52, 36 + r * 40, 46, 32, v, CMSK.UK[r] === c ? "warn" : v ? "acc" : "ghost", { size: 13 }); }); });
      b += t(16, 182, "estimate UK = min(" + CMSK.UK.map((c, r) => g[r][c]).join(", ") + ") = " + Math.min(...CMSK.UK.map((c, r) => g[r][c])), { a: "start", size: 12.5, bold: true, mono: true, fill: C.warnT });
      b += t(16, 204, "row 1: UK shares a counter with US (5+1); row 3 with IN (3+1)", { a: "start", size: 11, fill: C.dim, max: 450 });
      b += t(16, 224, "true count 1: the minimum filters out the collisions", { a: "start", size: 11, fill: C.goodT });
      return svg(480, 238, b, "Count-Min Sketch grid with an estimate for one key");
    },
    caption: "Amber cells are UK's three counters; two are inflated by collisions, the minimum is not.",
    oneline: "A Count-Min Sketch keeps a small grid of counters and takes the smallest, so estimates are never too low.",
  };

  /* ---------------------------------------------------------------- dsa-consistent-hash */
  P["dsa-consistent-hash"] = {
    simple: [
      "Splitting keys across N machines with `hash(key) % N` works until N changes. Add one machine and almost every key now maps somewhere else, so nearly all the data has to move.",
      "**Consistent hashing** puts both machines and keys on a circle of hash values (a **ring**). Each key belongs to the first machine clockwise from it.",
      "Adding a machine only takes over the keys between it and the machine before it, about 1/N of the data. Real systems give each machine many points on the ring (**virtual nodes**) so the load stays even. Cassandra and DynamoDB-style stores and distributed caches work this way.",
    ],
    analogy: {
      text: "Think of houses around a circular road and the post offices on it.",
      left: "Circular road", right: "Consistent hashing",
      map: [
        ["Each house uses the next post office clockwise", "Key -> first node clockwise"],
        ["A new post office opens", "A node is added to the ring"],
        ["Only houses just before it switch office", "Only ~1/N of keys move"],
        ["One company runs several small offices around the road", "Virtual nodes for balance"],
      ],
      breaks: "houses are spread evenly along a road. Hash positions are random, so without virtual nodes one machine can own a much bigger arc than another.",
    },
    svg: () => {
      let b = t(240, 18, "Ring before and after adding node D", { bold: true, size: 13.5 });
      const ring = (cx, add) => {
        let s = `<circle cx="${cx}" cy="128" r="80" style="fill:none;stroke:${C.boxS};stroke-width:2"/>`;
        const nodes = [["A", 20], ["B", 140], ["C", 250]].concat(add ? [["D", 200]] : []);
        const keys = [["k1", 60], ["k2", 110], ["k3", 175], ["k4", 215], ["k5", 300], ["k6", 340]];
        const owner = d => { const sorted = nodes.slice().sort((a, z) => a[1] - z[1]); const n = sorted.find(([, a]) => a >= d) || sorted[0]; return n[0]; };
        const P2 = (d, r) => [cx + r * Math.sin(d * Math.PI / 180), 128 - r * Math.cos(d * Math.PI / 180)];
        keys.forEach(([k, d]) => { const [x, y] = P2(d, 80), [lx, ly] = P2(d, 60), o = owner(d), moved = add && o === "D"; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" style="fill:${moved ? C.warnS : C.dim}"/>`; s += t(lx, ly + 4, k + ">" + o, { size: 9.5, fill: moved ? C.warnT : C.dim }); });
        nodes.forEach(([n, d]) => { const [x, y] = P2(d, 80); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" style="fill:${n === "D" ? C.good : C.acc};stroke:${n === "D" ? C.goodS : C.accS};stroke-width:2"/>` + t(x, y + 4.5, n, { bold: true, size: 12, fill: n === "D" ? C.goodT : C.accT }); });
        return s;
      };
      b += ring(120, false) + ring(360, true);
      b += t(120, 232, "3 nodes", { size: 11.5, fill: C.dim }); b += t(360, 232, "add D: only k3 moves (C -> D)", { size: 11.5, fill: C.warnT });
      return svg(480, 246, b, "Consistent hashing ring before and after adding a node");
    },
    caption: "Each key goes to the next node clockwise. D only takes keys between B and D; with % N, most keys would move.",
    oneline: "Put keys and machines on a ring, so adding a machine moves only the keys next to it.",
  };

  /* ---------------------------------------------------------------- dsa-btree-lsm */
  P["dsa-btree-lsm"] = {
    simple: [
      "Every database stores its data with a **storage engine**, and two designs dominate. They make opposite trade-offs between fast reads and fast writes.",
      "A **B-tree** keeps keys sorted in a shallow tree of fixed-size disk pages and **updates in place**: changing a row rewrites the page it lives on. Reads and range scans are fast; random writes are slower. Postgres, MySQL and most SQL indexes use B-trees.",
      "An **LSM-tree** (log-structured merge tree) **buffers** writes in memory, then flushes them as sorted, immutable files, and merges files in the background (**compaction**). Writes are fast and sequential; a read may check several files, helped by Bloom filters. Cassandra, RocksDB and HBase use LSM-trees.",
    ],
    analogy: {
      text: "Think of two ways to keep a diary.",
      left: "Diary keeping", right: "Storage engines",
      map: [
        ["Rubbing out and rewriting the right page", "B-tree: update in place"],
        ["Finding any day is quick with the tabs", "Fast reads and range scans"],
        ["Jotting notes on sticky pads, filing them later", "LSM: memtable, then flush"],
        ["Weekly tidy-up merging the pads", "Compaction"],
        ["Looking through several pads to find a note", "Read amplification"],
      ],
      breaks: "a diary has one writer. Under heavy concurrent writes, the B-tree's page rewrites become random I/O while the LSM only appends, which is why write-heavy stores pick LSM.",
    },
    svg: () => {
      let b = t(240, 18, "B-tree updates in place; LSM appends and merges", { bold: true, size: 13 });
      b += t(120, 42, "B-tree", { bold: true, size: 12.5, fill: C.accT });
      b += box(80, 52, 80, 26, "root", null, "acc", { size: 11 });
      [0, 1, 2].forEach(i => { b += box(20 + i * 70, 104, 62, 26, ["1-30", "31-60", "61-90"][i], null, i === 1 ? "warn" : "plain", { size: 10.5, mono: true }); b += line(120, 78, 51 + i * 70, 104); });
      b += t(120, 152, "write 45: rewrite that page", { size: 10.5, fill: C.warnT });
      b += t(120, 172, "read: 2-4 page hops", { size: 10.5, fill: C.dim });
      b += line(240, 34, 240, 230, { dash: true });
      b += t(360, 42, "LSM-tree", { bold: true, size: 12.5, fill: C.vioT });
      b += box(270, 52, 90, 40, "memtable", "RAM, sorted", "vio", { size: 11, size2: 9 });
      b += arrow(362, 72, 384, 72); b += t(373, 108, "flush", { size: 9.5, fill: C.dim });
      b += box(386, 52, 82, 40, "L0 file", "immutable", "plain", { size: 11, size2: 9 });
      [["L1 file", 270], ["L1 file", 330], ["L1 file", 390]].forEach(([n, x]) => { b += box(x, 118, 56, 26, n, null, "plain", { size: 10 }); });
      b += arrow(426, 94, 412, 116); b += t(470, 108, "compact", { a: "end", size: 9.5, fill: C.dim });
      b += t(360, 166, "writes: sequential appends", { size: 10.5, fill: C.goodT });
      b += t(360, 184, "reads: check memtable + files", { size: 10.5, fill: C.dim });
      b += t(360, 202, "(Bloom filters skip most files)", { size: 10.5, fill: C.dim });
      b += t(120, 214, "Postgres, MySQL indexes", { size: 10.5, fill: C.dim }); b += t(360, 224, "Cassandra, RocksDB, HBase", { size: 10.5, fill: C.dim });
      return svg(480, 236, b, "B-tree versus LSM-tree write and read paths");
    },
    caption: "The B-tree pays at write time to keep reads cheap; the LSM pays at read and compaction time to keep writes cheap.",
    oneline: "B-trees are tuned for reading and LSM-trees for writing; every index picks one trade-off.",
  };

  /* ---------------------------------------------------------------- dsa-trie */
  const TW = ["data", "date", "dag", "dbt", "deep", "delta"];
  const TN = { "": [240, 40], d: [240, 84], da: [140, 128], db: [240, 128], de: [340, 128], dat: [100, 172], dag: [180, 172], dbt: [240, 172], dee: [310, 172], del: [380, 172], data: [70, 216], date: [130, 216], deep: [310, 216], delt: [380, 216], delta: [380, 252] };
  const TP = ["d", "da", "dat", "de", "x"];
  P["dsa-trie"] = {
    simple: [
      "A **trie** (prefix tree) stores words letter by letter along paths from a root. Words that start the same way share the same path until they differ.",
      "Finding a word of length L takes L steps, however many words are stored. More useful: walking to the node for a **prefix** such as \"da\" leads straight to every word that starts with it.",
      "That makes tries the structure behind autocomplete, longest-prefix matching for IP routing, dictionary matching in tokenizers, and fast prefix filters.",
    ],
    analogy: {
      text: "Think of a tree of choices in a phone menu.",
      left: "Phone menu", right: "Trie",
      map: [
        ["Press 1 for sales, 2 for support", "Each edge is one letter"],
        ["Everyone wanting support shares the first press", "Shared prefixes stored once"],
        ["Reaching \"support > billing\" shows all billing options", "Prefix search finds all completions"],
        ["A menu item that is a final destination", "A node marked as end of word"],
      ],
      breaks: "a phone menu has a few options per level. A trie over many characters can have huge fan-out and many nearly empty nodes, so real systems compress chains (radix trees) or use arrays.",
    },
    svg: () => P["dsa-trie"]._fig(-1),
    _fig: pi => {
      const p = pi >= 0 ? TP[pi] : null;
      let b = t(240, 18, p ? "Prefix \"" + p + "\"" : "Trie of " + TW.join(", "), { bold: true, size: 13 });
      Object.keys(TN).forEach(k => { if (!k) return; const par = k.slice(0, -1); const [x1, y1] = TN[par], [x2, y2] = TN[k]; const on = p && (p.startsWith(k) || k.startsWith(p)); b += line(x1, y1 + 12, x2, y2 - 12, { stroke: on ? C.warnS : C.line, sw: on ? 2.4 : 1.4 }); b += t((x1 + x2) / 2 + (x2 > x1 ? 7 : x2 < x1 ? -7 : 8), (y1 + y2) / 2 + 4, k.slice(-1), { size: 11, bold: true, fill: on ? C.warnT : C.dim, mono: true }); });
      Object.entries(TN).forEach(([k, [x, y]]) => { const end = TW.includes(k), hit = p && k.startsWith(p) && end, onPath = p && p.startsWith(k); b += `<circle cx="${x}" cy="${y}" r="12" style="fill:${hit ? C.good : onPath ? C.warn : end ? C.acc : C.box};stroke:${hit ? C.goodS : onPath ? C.warnS : end ? C.accS : C.boxS};stroke-width:1.6"/>`; if (end) b += t(x + (x < 240 ? -16 : 16), y + 4, k, { a: x < 240 ? "end" : "start", size: 10.5, mono: true, fill: hit ? C.goodT : C.accT }); });
      if (p) { const res = TW.filter(w => w.startsWith(p)); b += t(470, 46, res.length ? res.length + " match" + (res.length > 1 ? "es" : "") : "no node: 0 matches", { a: "end", size: 11.5, bold: true, fill: res.length ? C.goodT : C.badT }); }
      return svg(480, 270, b, "Trie with prefix search");
    },
    caption: "Blue circles end a word. Words sharing a prefix share its path from the root.",
    ix: el => choice(el, { label: "Prefix", options: TP, value: 1 }, i => { const p = TP[i], res = TW.filter(w => w.startsWith(p)); return { svg: P["dsa-trie"]._fig(i), note: res.length ? "Walk " + p.length + " edge" + (p.length > 1 ? "s" : "") + ", then collect the subtree: " + res.join(", ") + "." : "No edge for \"x\" at the root, so the search stops after one step." }; }),
    oneline: "A trie stores words along shared letter paths, so finding every word with a prefix is a short walk.",
  };

  /* ---------------------------------------------------------------- dsa-topo-sort */
  const TG = { ext_orders: [], ext_cust: [], stg_orders: ["ext_orders"], stg_cust: ["ext_cust"], fct_orders: ["stg_orders", "stg_cust"], dim_cust: ["stg_cust"], dashboard: ["fct_orders", "dim_cust"] };
  const TPOS = { ext_orders: [10, 40], ext_cust: [10, 110], stg_orders: [128, 40], stg_cust: [128, 110], fct_orders: [246, 40], dim_cust: [246, 110], dashboard: [364, 75] };
  const KAHN = (() => {
    const indeg = {}, kids = {}; Object.keys(TG).forEach(n => { indeg[n] = TG[n].length; kids[n] = []; }); Object.entries(TG).forEach(([n, ps]) => ps.forEach(p => kids[p].push(n)));
    const q = Object.keys(TG).filter(n => !indeg[n]), done = [], st = [{ indeg: { ...indeg }, q: q.slice(), done: [], msg: "queue = nodes with in-degree 0" }];
    while (q.length) { const n = q.shift(); done.push(n); const freed = []; kids[n].forEach(c => { indeg[c]--; if (!indeg[c]) { q.push(c); freed.push(c); } }); st.push({ indeg: { ...indeg }, q: q.slice(), done: done.slice(), msg: "run " + n + (freed.length ? "; now ready: " + freed.join(", ") : "") }); }
    return st;
  })();
  P["dsa-topo-sort"] = {
    simple: [
      "A pipeline is a **DAG** (directed acyclic graph): tasks are nodes, and an arrow A to B means B needs A to finish first. \"Acyclic\" means no loops.",
      "To run it you need an order where every task comes after the tasks it depends on. That is a **topological sort**. Airflow, dbt, Dataform and Spark all compute one.",
      "**Kahn's algorithm** is the simple way. Count each node's unmet dependencies (its **in-degree**). Put every node with zero in a queue. Take one out, run it, and lower the count of everything that depends on it; anything that reaches zero joins the queue. If nodes are left over at the end, there's a cycle.",
    ],
    analogy: {
      text: "Think of getting dressed.",
      left: "Getting dressed", right: "Topological sort",
      map: [
        ["Socks before shoes, shirt before tie", "Edges: dependencies"],
        ["Clothes you can put on now", "Nodes with in-degree 0"],
        ["After socks, shoes become possible", "Lower the in-degree of dependants"],
        ["Shirt and socks in either order", "Several valid orders; parallel tasks"],
        ["\"Shoes before socks, socks before shoes\"", "A cycle: no valid order"],
      ],
      breaks: "you dress one item at a time. An orchestrator runs every ready task at once, so the queue is really a set of tasks running in parallel.",
    },
    svg: () => P["dsa-topo-sort"]._fig(KAHN.length - 1),
    _fig: k => {
      const s = KAHN[k];
      let b = t(240, 18, "Kahn's algorithm, step " + k + " of " + (KAHN.length - 1), { bold: true, size: 13.5 });
      Object.entries(TG).forEach(([n, ps]) => ps.forEach(p => { const [x1, y1] = TPOS[p], [x2, y2] = TPOS[n]; b += arrow(x1 + 101, y1 + 20, x2 - 1, y2 + 20, { sw: 1.2, stroke: s.done.includes(p) ? C.goodS : C.line }); }));
      Object.entries(TPOS).forEach(([n, [x, y]]) => {
        const d = s.done.includes(n), q = s.q.includes(n);
        b += box(x, y, 100, 40, n, d ? "done #" + (s.done.indexOf(n) + 1) : "in-degree " + s.indeg[n], d ? "good" : q ? "warn" : "plain", { size: 10.5, size2: 9, mono: true });
      });
      b += t(16, 176, "queue: " + (s.q.length ? s.q.join(", ") : "(empty)"), { a: "start", size: 11.5, mono: true, fill: C.warnT, max: 450 });
      b += t(16, 198, "order: " + (s.done.length ? s.done.slice(0, 4).join(" > ") : "-"), { a: "start", size: 10.5, mono: true, fill: C.goodT, max: 456 });
      if (s.done.length > 4) b += t(16, 214, "       > " + s.done.slice(4).join(" > "), { a: "start", size: 10.5, mono: true, fill: C.goodT, max: 456 });
      b += t(16, 236, s.msg, { a: "start", size: 11, fill: C.tx, max: 456 });
      return svg(480, 248, b, "Kahn's topological sort step");
    },
    caption: "Green tasks are done in order; amber tasks are ready because all their inputs are done.",
    ix: el => slider(el, { label: "Step", min: 0, max: KAHN.length - 1, value: 0 }, v => ({ svg: P["dsa-topo-sort"]._fig(v), note: v === KAHN.length - 1 ? "All 7 tasks ran, each after its inputs. O(V + E)." : "Both extract tasks start ready; an orchestrator would run them in parallel." })),
    oneline: "Run a task only when all its inputs are done, and you get a valid order for any pipeline DAG.",
  };

  /* ---------------------------------------------------------------- dsa-graph-traversal */
  const GE = { raw_orders: ["stg_orders"], stg_orders: ["fct_orders", "int_returns"], fct_orders: ["dash_rev", "ml_feat"], int_returns: ["dash_ret"], dash_rev: [], ml_feat: [], dash_ret: [] };
  const GP = { raw_orders: [10, 92], stg_orders: [128, 92], fct_orders: [246, 52], int_returns: [246, 132], dash_rev: [364, 30], ml_feat: [364, 82], dash_ret: [364, 140] };
  const trav = bfs => { const order = [], seen = new Set(["raw_orders"]), dq = ["raw_orders"]; while (dq.length) { const n = bfs ? dq.shift() : dq.pop(); order.push(n); const ks = bfs ? GE[n] : GE[n].slice().reverse(); ks.forEach(c => { if (!seen.has(c)) { seen.add(c); dq.push(c); } }); } return order; };
  P["dsa-graph-traversal"] = {
    simple: [
      "Many data questions are about a **lineage graph**: tables and jobs are nodes, and data flows along the edges. \"What breaks if I change this table?\" means: find everything downstream of it.",
      "**BFS** (breadth-first search) explores level by level with a queue: all direct dependants, then theirs. It finds the fewest-hops path and answers \"everything within 2 hops\". **DFS** (depth-first search) follows one path to the end before backing up, using a stack; it is the basis of cycle detection and topological sort.",
      "Both visit every node and edge once: O(V + E).",
    ],
    analogy: {
      text: "Think of passing news through a school.",
      left: "Passing news", right: "Graph traversal",
      map: [
        ["Tell all your friends, then they tell theirs", "BFS, level by level"],
        ["Follow one chain of gossip to its end first", "DFS, deep first"],
        ["Ticking off who already heard", "The visited set"],
        ["Everyone who heard in the end", "Downstream impact set"],
      ],
      breaks: "news can travel in circles between friends. Lineage graphs usually can't, but you still keep a visited set, because two paths can reach the same table.",
    },
    svg: () => {
      const o = trav(true), lvl = { raw_orders: 0 }; o.forEach(n => GE[n].forEach(c => { if (lvl[c] == null) lvl[c] = lvl[n] + 1; }));
      let b = t(240, 18, "What is downstream of raw_orders? BFS levels", { bold: true, size: 13 });
      Object.entries(GE).forEach(([n, ks]) => ks.forEach(c => { const [x1, y1] = GP[n], [x2, y2] = GP[c]; b += arrow(x1 + 101, y1 + 15, x2 - 1, y2 + 15, { sw: 1.2 }); }));
      Object.entries(GP).forEach(([n, [x, y]]) => { b += box(x, y, 100, 30, n, null, ["bad", "warn", "acc", "vio"][lvl[n]], { size: 10.5, mono: true }); });
      [0, 1, 2, 3].forEach(l => { b += t([60, 178, 296, 414][l], 196, "level " + l, { size: 11, fill: C.dim }); });
      b += t(240, 222, "changing raw_orders can affect all 6 tables downstream", { size: 11.5, fill: C.tx });
      return svg(480, 236, b, "Lineage graph with BFS levels");
    },
    caption: "Colour = hops from the changed table. Everything coloured is in the blast radius.",
    _fig: i => {
      const o = trav(i === 0);
      let b = t(240, 18, (i ? "DFS (stack)" : "BFS (queue)") + " visit order from raw_orders", { bold: true, size: 13 });
      Object.entries(GE).forEach(([n, ks]) => ks.forEach(c => { const [x1, y1] = GP[n], [x2, y2] = GP[c]; b += arrow(x1 + 101, y1 + 15, x2 - 1, y2 + 15, { sw: 1.2 }); }));
      Object.entries(GP).forEach(([n, [x, y]]) => { b += box(x, y, 100, 30, n, null, "plain", { size: 10.5, mono: true }); b += badge(x + 96, y + 2, o.indexOf(n) + 1, i ? "vio" : "acc"); });
      b += t(240, 200, o.join(" > "), { size: 9, mono: true, fill: C.accT, max: 464 });
      return svg(480, 214, b, "Graph traversal visit order");
    },
    ix: el => choice(el, { label: "Traversal", options: ["BFS", "DFS"], value: 0 }, i => ({ svg: P["dsa-graph-traversal"]._fig(i), note: i ? "DFS dives down fct_orders to its leaves before coming back for int_returns." : "BFS finishes each level before the next: both level-2 tables come before any dashboard." })),
    oneline: "Walk the lineage graph breadth-first or depth-first to find everything a change can affect.",
  };

  /* ---------------------------------------------------------------- dsa-sql-patterns */
  P["dsa-sql-patterns"] = {
    simple: [
      "Data engineers write most of their algorithms in SQL, and each pattern in this track has a SQL form.",
      "Hashing becomes `GROUP BY` and `DISTINCT`. Top-K per group becomes `ROW_NUMBER()` filtered to N. A sliding window becomes a window frame such as `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`. A running total (prefix sum) is `SUM() OVER (ORDER BY ...)`. Sessionization (gaps and islands) is `LAG` plus a running sum of flags. Graph walks are recursive CTEs.",
      "Spotting \"this is pattern X\" is most of the work; the SQL then follows.",
    ],
    analogy: {
      text: "Think of a recipe written in two languages.",
      left: "Two-language recipe", right: "DSA and SQL",
      map: [
        ["The same dish", "The same algorithm"],
        ["Steps in English", "The Python version with loops"],
        ["Steps in Hindi", "The SQL version with window functions"],
        ["The kitchen does the stirring", "The database engine runs the loop for you"],
      ],
      breaks: "translations of a recipe cook the same way. SQL engines pick their own algorithm (hash or sort aggregation, for example), so the SQL says what, and the plan says how.",
    },
    svg: () => {
      let b = t(240, 18, "Pattern to SQL construct", { bold: true, size: 13.5 });
      b += table(12, 32, ["pattern", "SQL"], [["hashing: dedup, group", "GROUP BY, DISTINCT"], ["top-K per group", "ROW_NUMBER() ... <= N"], ["sliding window", "ROWS BETWEEN k PRECEDING"], ["prefix sum", "SUM(x) OVER (ORDER BY t)"], ["gaps and islands", "LAG + running SUM of flags"], ["graph / DAG walk", "WITH RECURSIVE"], ["hash join", "JOIN (planner picks hash)"]], { cw: [170, 286], rh: 26, size: 11.5, mono: false });
      return svg(480, 248, b, "Mapping from algorithm patterns to SQL constructs");
    },
    caption: "The left column is what to recognise in the question; the right column is what to type.",
    oneline: "Every algorithm pattern has a SQL form, mostly window functions, so learn to spot the pattern first.",
  };

  /* ---------------------------------------------------------------- dsa-interview-patterns */
  P["dsa-interview-patterns"] = {
    simple: [
      "Data engineering coding interviews use a small set of patterns, not exotic algorithms. Learn the cue words and the matching tool.",
      "\"Seen it before?\" or \"count by key\" means a hash map or set. \"Rolling\" or \"consecutive\" means two pointers or a sliding window. \"Top K\" means a heap. \"Sorted\" or \"merge\" means sort or k-way merge. \"Depends on\" means a graph. \"Too big to count exactly\" means a sketch.",
      "Then follow a fixed method: clarify, work an example, give a brute force, improve it, state time and memory cost, and test edge cases out loud.",
    ],
    analogy: {
      text: "Think of a doctor matching symptoms to tests.",
      left: "Doctor", right: "Interview patterns",
      map: [
        ["Hearing \"chest pain\" and ordering an ECG", "Hearing \"top K\" and reaching for a heap"],
        ["Asking follow-up questions first", "Clarify inputs, size and edge cases"],
        ["Starting with the safe treatment", "Brute force first"],
        ["Checking the treatment worked", "Testing edge cases"],
      ],
      breaks: "symptoms can be misleading, and so can cue words. \"Top K per group in SQL\" wants a window function, not a Python heap, so match the tool to the language as well.",
    },
    svg: () => {
      let b = t(240, 18, "Cue in the question -> tool", { bold: true, size: 13.5 });
      const R = [["seen it? count by key", "hash map / set", "acc"], ["rolling, consecutive", "two pointers, window", "vio"], ["top / largest K", "heap of size K", "good"], ["sorted, merge, k-th", "sort, k-way merge", "warn"], ["depends on, order", "graph, topo sort", "plain"], ["too big to be exact", "HLL, CMS, Bloom", "bad"]];
      R.forEach(([c, tl, k], i) => { const y = 30 + i * 30; b += t(16, y + 17, c, { a: "start", size: 11.5, max: 190 }); b += arrow(210, y + 13, 240, y + 13, { sw: 1.2 }); b += box(244, y, 224, 26, tl, null, k, { size: 11.5 }); });
      ["clarify", "example", "brute force", "optimise", "Big-O", "edge cases"].forEach((s, i) => { b += box(12 + i * 76, 238, 70, 28, s, null, "plain", { size: 10.5 }); });
      b += t(240, 228, "the method, every time", { size: 10.5, fill: C.dim });
      return svg(480, 276, b, "Interview cue-to-tool map and problem-solving method");
    },
    caption: "Six cues cover most DE coding questions; the six-step method keeps your answer structured.",
    oneline: "Spot the cue, pick the matching structure, and always state the cost and test the edge cases.",
  };
})();
