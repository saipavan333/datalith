/* Datalith pass 2 — Track 27: DSA for data engineering (part 1 of 2). Most diagrams step through the algorithm. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const cell = (x, y, w, h, v, kind, o = {}) => box(x, y, w, h, String(v), o.sub != null ? String(o.sub) : null, kind, { size: o.size || 13, size2: 9.5, mono: true, r: 5 });
  P2L.dsaCell = cell;

  /* ---------------------------------------------------------------- dsa-bigo */
  const NS = [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9];
  const human = s => s < 1e-3 ? "< 1 ms" : s < 1 ? (s * 1000).toFixed(0) + " ms" : s < 120 ? s.toFixed(s < 10 ? 1 : 0) + " s" : s < 7200 ? (s / 60).toFixed(0) + " min" : s < 172800 ? (s / 3600).toFixed(0) + " h" : s < 3.15e7 * 2 ? (s / 86400).toFixed(0) + " days" : (s / 3.15e7).toExponential(1).replace("e+", "e") + " years";
  P["dsa-bigo"] = {
    simple: [
      "**Big-O** says how the work grows when the data grows. O(n) means twice the rows, twice the work. O(n²) means twice the rows, four times the work.",
      "With ten rows, nobody cares. With a billion rows, the difference between O(n log n) and O(n²) is the difference between a few seconds and centuries.",
      "In data engineering this decides real choices: a **hash join** is O(n + m), a **nested-loop join** is O(n x m). Memory (does it spill to disk?) and network (does it shuffle?) matter as much as the count of steps.",
    ],
    analogy: {
      text: "Think of looking for a friend's name.",
      left: "Finding a name", right: "Complexity",
      map: [
        ["Calling out once in a room with a shout", "O(1): one step whatever the size"],
        ["Opening a phone book in the middle and halving", "O(log n): binary search, B-tree"],
        ["Reading every name in the book", "O(n): full scan"],
        ["Comparing every name with every other name", "O(n²): nested loops"],
      ],
      breaks: "Big-O ignores constants. An O(n) job that reads from a slow network can lose to an O(n log n) one in memory, so measure too.",
    },
    svg: () => {
      let b = t(240, 18, "Work to process n rows (log scale)", { bold: true, size: 13.5 });
      const X = e => 50 + (e - 3) * 58, Y = v => 196 - Math.log10(Math.max(v, 1)) * 8.4;
      [3, 4, 5, 6, 7, 8, 9].forEach(e => { b += line(X(e), 36, X(e), 196, { stroke: "#2b3446", sw: 1 }); b += t(X(e), 212, "1e" + e, { size: 10, fill: C.dim }); });
      b += line(50, 196, 400, 196);
      const F = [["O(n²)", n => n * n, C.badS], ["O(n log n)", n => n * Math.log2(n), C.warnS], ["O(n)", n => n, C.accS], ["O(log n)", n => Math.log2(n), C.goodS]];
      F.forEach(([n, f, c]) => {
        const pts = []; for (let e = 3; e <= 9; e += 0.25) pts.push(X(e).toFixed(1) + "," + Math.max(30, Y(f(10 ** e))).toFixed(1));
        b += `<polyline points="${pts.join(" ")}" style="fill:none;stroke:${c};stroke-width:2.4"/>`;
      });
      b += t(406, 49, "O(n²)", { a: "start", size: 11, bold: true, fill: C.badT }); b += t(406, 106, "O(n log n)", { a: "start", size: 10.5, bold: true, fill: C.warnT }); b += t(406, 124, "O(n)", { a: "start", size: 10.5, bold: true, fill: C.accT }); b += t(406, 187, "O(log n)", { a: "start", size: 10.5, bold: true, fill: C.goodT });
      b += t(14, 120, "ops", { size: 10, fill: C.dim, a: "start" });
      b += t(225, 230, "rows (n)", { size: 10.5, fill: C.dim });
      return svg(480, 240, b, "Growth curves for common complexities");
    },
    caption: "On a log scale the gap is obvious: the exponent, not the constant, decides what finishes at scale.",
    _fig: i => {
      const n = NS[i], R = [["O(log n)", Math.log2(n), "B-tree lookup"], ["O(n)", n, "full scan"], ["O(n log n)", n * Math.log2(n), "sort, sort-merge join"], ["O(n²)", n * n, "nested-loop join"]];
      let b = t(240, 18, "n = " + n.toLocaleString("en-US") + " rows, at ~100M simple ops per second", { bold: true, size: 12.5 });
      R.forEach(([c, ops, ex], j) => {
        const y = 34 + j * 40, s = ops / 1e8, frac = Math.min(1, Math.log10(Math.max(ops, 1)) / 18), k = s > 3600 ? "bad" : s > 10 ? "warn" : "good";
        b += t(16, y + 20, c, { a: "start", size: 12, bold: true, mono: true });
        b += `<rect x="108" y="${y + 6}" width="230" height="18" rx="3" style="fill:#1f2634;stroke:${C.boxS}"/><rect x="108" y="${y + 6}" width="${(230 * frac).toFixed(1)}" height="18" rx="3" style="fill:${P2L.KIND[k][1]}"/>`;
        b += t(346, y + 15, human(s), { a: "start", size: 12, bold: true, fill: P2L.KIND[k][2] });
        b += t(346, y + 29, ex, { a: "start", size: 9.5, fill: C.dim });
      });
      return svg(480, 200, b, "Estimated run time per complexity at n rows");
    },
    ix: el => slider(el, { label: "Rows n", min: 0, max: 6, value: 3, fmt: v => "1e" + (v + 3) }, v => ({ svg: P["dsa-bigo"]._fig(v), note: v >= 5 ? "At 100M+ rows only the linear and n log n rows are usable: this is why databases never nested-loop join big tables." : "Small n: everything is fast. Push the slider up and watch the quadratic row explode." })),
    oneline: "Big-O tells you how work grows with rows, and at billions of rows the exponent decides everything.",
  };

  /* ---------------------------------------------------------------- dsa-hashing */
  const CUST = [[1, "Asha"], [2, "Ben"], [3, "Chen"], [5, "Dev"]], ORD = [["o1", 2], ["o2", 5], ["o3", 4], ["o4", 1]];
  P["dsa-hashing"] = {
    simple: [
      "A **hash map** stores key-value pairs and finds any key in about one step, no matter how many keys it holds. A **hash set** is the same without values: it only answers \"have I seen this?\".",
      "It works by turning the key into a number with a **hash function** and using that number to pick a **bucket**. To look up the key later, hash it again and go straight to the bucket.",
      "Most data work is hashing underneath: `GROUP BY` and `DISTINCT` hash each key to collect equal ones, and a **hash join** builds a map from the smaller table, then probes it once for each row of the bigger table.",
    ],
    analogy: {
      text: "Think of a cloakroom with numbered hooks.",
      left: "Cloakroom", right: "Hash join",
      map: [
        ["Coat number decides the hook", "hash(key) picks the bucket"],
        ["Hanging every coat first", "Build phase on the small table"],
        ["Each guest hands in a ticket and gets their coat", "Probe phase with the big table"],
        ["Two coats on one hook", "A collision, handled by keeping a short list"],
      ],
      breaks: "a cloakroom has enough hooks. If the build table doesn't fit in memory, the join has to split both sides into partitions on disk first (a grace hash join), which is what Spark's shuffle does across machines.",
    },
    svg: () => P["dsa-hashing"]._fig(5),
    _fig: k => {
      let b = t(240, 18, k === 0 ? "Hash join: start" : k === 1 ? "Build: customers into buckets by id % 4" : "Probe " + ORD[k - 2][0] + " (cust " + ORD[k - 2][1] + ")", { bold: true, size: 13 });
      b += t(16, 44, "build side: customers", { a: "start", size: 11, fill: C.dim });
      CUST.forEach(([id, n], i) => { b += box(16, 52 + i * 30, 90, 26, id + " " + n, null, k >= 1 ? "plain" : "acc", { size: 11, mono: true }); });
      const probing = k >= 2 ? ORD[k - 2][1] : null, pb = probing != null ? probing % 4 : -1;
      [0, 1, 2, 3].forEach(bk => {
        const x = 124 + bk * 58;
        b += box(x, 44, 54, 22, "b" + bk, null, bk === pb ? "warn" : "plain", { size: 11 });
        if (k >= 1) CUST.filter(c => c[0] % 4 === bk).forEach(([id], j) => { b += box(x + 4, 72 + j * 28, 46, 24, String(id), null, probing === id ? "good" : "acc", { size: 11.5, mono: true }); });
      });
      if (k >= 1 && k < 2) CUST.forEach(([id], i) => { b += arrow(108, 65 + i * 30, 124 + (id % 4) * 58 + 4, 84 + (id === 5 ? 28 : 0), { sw: 0.8, dash: true }); });
      b += t(366, 44, "probe side: orders", { a: "start", size: 11, fill: C.dim });
      ORD.forEach(([o, c], i) => { b += box(370, 52 + i * 30, 94, 26, o + " -> " + c, null, k - 2 === i ? "warn" : k - 2 > i ? "ghost" : "plain", { size: 11, mono: true }); });
      const out = []; for (let j = 0; j <= k - 2 && j < ORD.length; j++) { const m = CUST.find(c => c[0] === ORD[j][1]); if (m) out.push([ORD[j][0], m[1]]); }
      b += t(16, 196, "output:", { a: "start", size: 11, fill: C.dim });
      b += t(70, 196, out.length ? out.map(r => r.join("+")).join("   ") : "(none yet)", { a: "start", size: 11.5, mono: true, fill: C.goodT, max: 390 });
      if (probing != null) b += t(240, 222, "hash(" + probing + ") % 4 = " + pb + ": look in b" + pb + " only -> " + (CUST.some(c => c[0] === probing) ? "match" : "no match, row dropped"), { size: 11.5, fill: C.tx, max: 456 });
      return svg(480, 236, b, "Hash join build and probe step");
    },
    caption: "Build once over the small table, then each probe looks in one bucket only: O(n + m) instead of O(n x m).",
    ix: el => slider(el, { label: "Step", min: 0, max: 5, value: 0 }, v => ({ svg: P["dsa-hashing"]._fig(v), note: v === 0 ? "Two inputs: 4 customers (small, so it is the build side) and 4 orders." : v === 1 ? "Build: each customer is placed by id % 4. 1 and 5 share bucket 1, a collision kept as a short list." : v === 4 ? "Customer 4 isn't in bucket 0, so an inner join drops order o3." : "Probe: hash the order's customer id, check just that bucket." })),
    oneline: "Hashing finds a key in one step, which is how GROUP BY, DISTINCT and hash joins stay fast.",
  };

  /* ---------------------------------------------------------------- dsa-two-pointer-window */
  const DV = [5, 3, 8, 6, 2, 7, 4], WK = 3;
  P["dsa-two-pointer-window"] = {
    simple: [
      "Some problems look like they need a loop inside a loop. **Two pointers** and **sliding windows** do them in one pass instead.",
      "A **sliding window** keeps a range from L to R over ordered data. When R moves right, add the new value to a running total. When L moves right, subtract the value that left. Each step is constant work, so the whole pass is O(n) instead of O(n x k).",
      "That is exactly how rolling 7-day averages, sessionization and \"longest streak\" problems work, in Python and inside SQL window frames.",
    ],
    analogy: {
      text: "Think of a train passing a short platform.",
      left: "Train at a platform", right: "Sliding window",
      map: [
        ["The carriages beside the platform right now", "The window [L..R]"],
        ["A new carriage arrives at the front", "R++: add the new value"],
        ["One carriage leaves at the back", "L++: subtract the old value"],
        ["Counting passengers by adding and subtracting", "Incremental update, O(1) per step"],
      ],
      breaks: "a train moves at a steady pace. Some windows grow and shrink with a condition (\"longest run without repeats\"), so L jumps forward by different amounts; each element still enters and leaves once, so it stays O(n).",
    },
    svg: () => P["dsa-two-pointer-window"]._fig(DV.length - 1),
    _fig: r => {
      const l = r - WK + 1; let sum = 0; for (let i = l; i <= r; i++) sum += DV[i];
      let b = t(240, 18, "Rolling 3-day sum, window [" + l + ".." + r + "]", { bold: true, size: 13.5 });
      DV.forEach((v, i) => { b += cell(30 + i * 62, 40, 54, 44, v, i >= l && i <= r ? "acc" : i === l - 1 ? "bad" : "ghost", { sub: "day " + (i + 1) }); });
      b += `<rect x="${26 + l * 62}" y="34" width="${WK * 62}" height="56" rx="8" style="fill:none;stroke:${C.warnS};stroke-width:2"/>`;
      b += t(30 + l * 62 + 27, 108, "L", { bold: true, size: 13, fill: C.warnT }); b += t(30 + r * 62 + 27, 108, "R", { bold: true, size: 13, fill: C.warnT });
      const step = r === WK - 1 ? "first window: " + DV.slice(0, WK).join(" + ") + " = " + sum : "sum = prev + " + DV[r] + " (in) - " + DV[l - 1] + " (out) = " + sum;
      b += t(240, 136, step, { size: 13, mono: true, bold: true, fill: C.accT });
      b += t(240, 160, "2 operations per step, whatever the window size", { size: 11.5, fill: C.dim });
      return svg(480, 174, b, "Sliding window sum step");
    },
    caption: "Red is the value that just left, blue is the window. Each step adds one value and subtracts one.",
    ix: el => slider(el, { label: "Right edge R", min: WK - 1, max: DV.length - 1, value: WK - 1, fmt: v => "day " + (v + 1) }, v => ({ svg: P["dsa-two-pointer-window"]._fig(v), note: "In SQL the same thing is SUM(x) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)." })),
    oneline: "Slide a range along the data, adding what enters and subtracting what leaves, in one pass.",
  };

  /* ---------------------------------------------------------------- dsa-sorting */
  const IN = [27, 3, 14, 9, 31, 6, 18, 1, 22, 11, 5, 40], MEM = 4;
  P["dsa-sorting"] = {
    simple: [
      "Sorting puts rows in order by a key. Good comparison sorts take O(n log n) time. Data engineering sorts constantly: `ORDER BY`, sort-merge joins, de-duplication, range partitioning, and Spark's shuffle.",
      "The interesting case is data **bigger than memory**. **External merge sort** handles it in two phases. First, read a memory-sized chunk, sort it, and write it back as a sorted **run**; repeat until all data is in runs. Second, **merge** the runs by repeatedly taking the smallest head among them.",
      "Each phase reads and writes the data once, so the cost is mostly disk or network I/O, not comparisons.",
    ],
    analogy: {
      text: "Think of sorting a huge stack of exam papers on a small desk.",
      left: "Exam papers", right: "External merge sort",
      map: [
        ["The desk holds only 4 papers at a time", "Memory limit"],
        ["Sort 4, put the sorted pile on the floor", "Create a sorted run"],
        ["Several sorted piles on the floor", "Runs on disk"],
        ["Take the lowest top paper from any pile, again and again", "k-way merge"],
      ],
      breaks: "the desk here holds 4 papers. Real memory holds gigabytes, so a few runs cover terabytes, and a merge can take hundreds of runs at once with a heap.",
    },
    svg: () => P["dsa-sorting"]._fig(4),
    _fig: k => {
      const runs = [0, 1, 2].map(i => IN.slice(i * MEM, i * MEM + MEM).slice().sort((a, z) => a - z));
      let b = t(240, 18, ["Input on disk (memory holds 4)", "Phase 1: run 1 sorted in memory", "Phase 1: run 2", "Phase 1: run 3", "Phase 2: merge the 3 runs"][k], { bold: true, size: 13.5 });
      b += t(16, 44, "disk", { a: "start", size: 11, fill: C.dim });
      IN.forEach((v, i) => { b += cell(16 + i * 38, 50, 34, 30, v, Math.floor(i / MEM) < k ? "ghost" : Math.floor(i / MEM) === k && k < 3 ? "warn" : "plain", { size: 11.5 }); });
      [0, 1, 2].forEach(r => {
        const y = 98 + r * 34; b += t(16, y + 19, "run " + (r + 1), { a: "start", size: 11, fill: C.dim });
        if (r < k) runs[r].forEach((v, j) => { b += cell(70 + j * 40, y, 36, 28, v, "acc", { size: 11.5 }); });
      });
      if (k === 4) {
        const all = IN.slice().sort((a, z) => a - z);
        b += t(16, 218, "out", { a: "start", size: 11, fill: C.dim });
        all.forEach((v, i) => { b += cell(16 + i * 38, 226, 34, 28, v, "good", { size: 11.5 }); });
        b += t(340, 152, "merge: take the smallest", { size: 11, fill: C.goodT });
        b += t(340, 168, "head of run 1, 2 or 3", { size: 11, fill: C.goodT });
      }
      return svg(480, k === 4 ? 266 : 206, b, "External merge sort phase");
    },
    caption: "Phase 1 makes sorted runs that fit in memory; phase 2 merges them in one pass.",
    ix: el => slider(el, { label: "Step", min: 0, max: 4, value: 0 }, v => ({ svg: P["dsa-sorting"]._fig(v), note: ["12 values, but only 4 fit in memory.", "Read 4, sort them in memory, write run 1.", "Same for the next 4.", "Last chunk: all data is now in sorted runs.", "One merge pass reads each run front to back: 1, 3, 5, 6, ..."][v] })),
    oneline: "To sort data bigger than memory, sort memory-sized chunks into runs, then merge the runs.",
  };

  /* ---------------------------------------------------------------- dsa-merge-k */
  const KL = [[1, 4, 9], [2, 3, 10], [5, 6, 7]];
  const MK = (() => {
    const pos = [0, 0, 0], out = [], st = [];
    const heads = () => KL.map((l, i) => pos[i] < l.length ? [l[pos[i]], i] : null).filter(Boolean).sort((a, z) => a[0] - z[0]);
    st.push({ heap: heads(), out: [], pos: pos.slice(), msg: "heap starts with each list's first value" });
    while (heads().length) { const [v, i] = heads()[0]; out.push(v); pos[i]++; st.push({ heap: heads(), out: out.slice(), pos: pos.slice(), msg: "pop " + v + " (list " + "ABC"[i] + "), push " + (pos[i] < KL[i].length ? KL[i][pos[i]] : "nothing, list " + "ABC"[i] + " is empty") }); }
    return st;
  })();
  P["dsa-merge-k"] = {
    simple: [
      "You often have **k lists that are each already sorted**: runs from an external sort, sorted files from each partition, ordered streams. You want one sorted output.",
      "Keep a **min-heap** (a structure that always gives you the smallest item fast) holding the current first item of each list. Pop the smallest: that's the next output. Then push the next item from the same list.",
      "Each of the n items goes in and out of the heap once, at O(log k) each, so the total is **O(n log k)** with only k items in memory. Python has it built in as `heapq.merge`.",
    ],
    analogy: {
      text: "Think of three queues of children lined up by height, merging into one line.",
      left: "Queues by height", right: "k-way merge",
      map: [
        ["The child at the front of each queue", "The heads in the heap"],
        ["A teacher picks the shortest front child", "Pop the minimum"],
        ["The next child in that queue steps forward", "Push the next item from the same list"],
        ["The teacher only watches 3 children", "O(k) memory"],
      ],
      breaks: "a teacher can compare 3 children at a glance. With k = 1,000 runs you need the heap to find the smallest head in about 10 comparisons instead of 1,000.",
    },
    svg: () => {
      let b = t(240, 18, "Merge 3 sorted lists with a min-heap of their heads", { bold: true, size: 13 });
      KL.forEach((l, i) => { b += t(20, 54 + i * 34, "ABC"[i], { a: "start", bold: true, size: 13 }); l.forEach((v, j) => { b += cell(40 + j * 38, 36 + i * 34, 34, 28, v, j === 0 ? "warn" : "plain", { size: 12 }); }); });
      b += arrow(158, 84, 200, 84);
      b += `<circle cx="252" cy="62" r="17" style="fill:${C.good};stroke:${C.goodS};stroke-width:2"/>` + t(252, 67, "1", { bold: true, size: 13, fill: C.goodT });
      b += line(240, 76, 224, 98); b += line(264, 76, 280, 98);
      b += `<circle cx="218" cy="110" r="15" style="fill:${C.warn};stroke:${C.warnS}"/>` + t(218, 115, "2", { bold: true, size: 12, fill: C.warnT });
      b += `<circle cx="286" cy="110" r="15" style="fill:${C.warn};stroke:${C.warnS}"/>` + t(286, 115, "5", { bold: true, size: 12, fill: C.warnT });
      b += t(252, 148, "min-heap: smallest on top", { size: 11, fill: C.dim });
      b += arrow(304, 62, 340, 62, { label: "pop" });
      b += box(344, 46, 120, 32, "output: 1, ...", null, "good", { size: 12 });
      b += t(240, 182, "n items x O(log k) per pop/push = O(n log k), memory O(k)", { size: 11.5, fill: C.dim });
      return svg(480, 196, b, "Three sorted lists feeding a min-heap");
    },
    caption: "Only one item per list sits in the heap; the root is always the next value of the merged output.",
    _fig: k => {
      const s = MK[k];
      let b = t(240, 18, "Step " + k + " of " + (MK.length - 1), { bold: true, size: 13.5 });
      KL.forEach((l, i) => { b += t(20, 50 + i * 32, "ABC"[i], { a: "start", bold: true, size: 13 }); l.forEach((v, j) => { b += cell(40 + j * 36, 32 + i * 32, 32, 26, v, j < s.pos[i] ? "ghost" : j === s.pos[i] ? "warn" : "plain", { size: 11.5 }); }); });
      b += t(310, 44, "heap (min first)", { size: 11, fill: C.dim });
      s.heap.forEach(([v, i], j) => { b += cell(250 + j * 42, 52, 38, 34, v, j === 0 ? "good" : "warn", { sub: "ABC"[i], size: 12 }); });
      if (!s.heap.length) b += t(310, 74, "empty: done", { size: 12, fill: C.goodT });
      b += t(20, 152, "out:", { a: "start", size: 11, fill: C.dim });
      s.out.forEach((v, j) => { b += cell(56 + j * 46, 134, 40, 28, v, "good", { size: 12 }); });
      b += t(240, 190, s.msg, { size: 11.5, fill: C.tx });
      return svg(480, 204, b, "k-way merge step");
    },
    ix: el => slider(el, { label: "Step", min: 0, max: MK.length - 1, value: 0 }, v => ({ svg: P["dsa-merge-k"]._fig(v), note: v === MK.length - 1 ? "All 9 values out, in order, with never more than 3 in memory." : "Amber = the head waiting in each list. The green heap root is always the next output." })),
    oneline: "To merge many sorted lists, keep just their front items in a heap and always take the smallest.",
  };

  /* ---------------------------------------------------------------- dsa-heap-topk */
  const STREAM = [12, 5, 30, 8, 41, 3, 27, 19, 50, 7], K = 3;
  const TK = (() => {
    const h = [], st = [{ h: [], msg: "empty heap; K = 3", i: -1 }];
    STREAM.forEach((v, i) => {
      let msg;
      if (h.length < K) { h.push(v); h.sort((a, z) => a - z); msg = "heap not full: push " + v; }
      else if (v > h[0]) { const old = h[0]; h[0] = v; h.sort((a, z) => a - z); msg = v + " > min " + old + ": pop " + old + ", push " + v; }
      else msg = v + " <= min " + h[0] + ": skip";
      st.push({ h: h.slice(), msg, i });
    });
    return st;
  })();
  P["dsa-heap-topk"] = {
    simple: [
      "A **heap** is a tree-shaped structure that always keeps its smallest (min-heap) or largest (max-heap) item on top. Looking at the top is instant; adding or removing an item costs O(log n).",
      "Its star use in data engineering is **top-K**: the 10 biggest customers out of a billion orders, without sorting a billion rows.",
      "Keep a **min-heap of size K**. For each new item, if the heap isn't full, add it. If the item is bigger than the heap's smallest, swap them. At the end the heap holds the top K. That is O(n log K) time and only K items of memory, and it works on a stream.",
    ],
    analogy: {
      text: "Think of picking the 3 tallest children for a photo, as children walk past one by one.",
      left: "Photo line-up", right: "Top-K with a min-heap",
      map: [
        ["Three spots in the photo", "Heap of size K = 3"],
        ["Watching the shortest of the three", "Heap minimum on top"],
        ["A taller child arrives: the shortest steps out", "Pop min, push new"],
        ["A shorter child walks straight past", "Skip, O(1)"],
      ],
      breaks: "the children all pass in one go. In a distributed job, each partition keeps its own top-K heap and a final step merges them, which is why top-K is cheap in Spark too.",
    },
    svg: () => P["dsa-heap-topk"]._fig(STREAM.length),
    _fig: k => {
      const s = TK[k];
      let b = t(240, 18, "Top 3 of a stream with a size-3 min-heap", { bold: true, size: 13.5 });
      STREAM.forEach((v, i) => { b += cell(16 + i * 46, 32, 40, 30, v, i === s.i ? "warn" : i < s.i ? "ghost" : "plain", { size: 12 }); });
      const pos = [[240, 104], [196, 156], [284, 156]];
      if (s.h.length > 1) b += line(228, 116, 206, 144); if (s.h.length > 2) b += line(252, 116, 274, 144);
      s.h.forEach((v, j) => { const [x, y] = pos[j]; b += `<circle cx="${x}" cy="${y}" r="20" style="fill:${j === 0 ? C.good : C.acc};stroke:${j === 0 ? C.goodS : C.accS};stroke-width:2"/>` + t(x, y + 5, String(v), { bold: true, size: 13, fill: j === 0 ? C.goodT : C.accT }); });
      b += t(330, 108, "root = smallest of the top 3", { a: "start", size: 10.5, fill: C.goodT });
      b += t(240, 204, s.msg, { size: 12, fill: C.tx, mono: true });
      if (k === STREAM.length) b += t(240, 226, "answer: " + s.h.slice().sort((a, z) => z - a).join(", "), { size: 12.5, bold: true, fill: C.goodT });
      return svg(480, 240, b, "Top-K min-heap step");
    },
    caption: "The heap's root is the bar to beat; only items bigger than it get in.",
    ix: el => slider(el, { label: "Items read", min: 0, max: STREAM.length, value: 0 }, v => ({ svg: P["dsa-heap-topk"]._fig(v), note: v === STREAM.length ? "Top 3 = 50, 41, 30, after one pass with 3 items of memory." : "Each item costs at most one O(log K) swap; most are skipped after one comparison." })),
    oneline: "To find the K biggest, keep a small min-heap of K and only let in items bigger than its smallest.",
  };

  /* ---------------------------------------------------------------- dsa-bloom */
  const h1 = s => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 16;
  const h2 = s => [...s].reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0) % 16;
  const BSET = ["alice", "bob", "carol"], BITS = new Set(BSET.flatMap(w => [h1(w), h2(w)]));
  const BQ = ["bob", "dave", "zara", "mia"];
  P["dsa-bloom"] = {
    simple: [
      "A **Bloom filter** answers \"have I seen this key before?\" using a small array of bits instead of storing the keys themselves.",
      "To add a key, run it through a few **hash functions** and set those bit positions to 1. To check a key, look at the same positions. If any bit is 0, the key was **definitely never added**. If all are 1, it was **probably** added, but other keys might have set those bits.",
      "So there are no false negatives and a small, tunable rate of false positives. Databases such as LSM-tree stores use them to skip reading files that can't contain a key.",
    ],
    analogy: {
      text: "Think of a nightclub stamp on your hand.",
      left: "Hand stamps", right: "Bloom filter",
      map: [
        ["Two stamps in set places for each guest", "k hash functions set k bits"],
        ["No stamp: you were never inside", "Any 0 bit: definitely not present"],
        ["Stamps present: you were probably inside", "All 1s: maybe present"],
        ["Smudged ink from someone else matches by chance", "False positive"],
      ],
      breaks: "you can wash a stamp off. You can't remove a key from a plain Bloom filter, because clearing its bits might clear another key's bits too.",
    },
    svg: () => P["dsa-bloom"]._fig(-1),
    _fig: qi => {
      const q = qi >= 0 ? BQ[qi] : null, qb = q ? [h1(q), h2(q)] : [];
      let b = t(240, 18, q ? "Query \"" + q + "\": check bits " + qb.join(" and ") : "Added alice, bob, carol: 16 bits, 2 hashes each", { bold: true, size: 12.5 });
      for (let i = 0; i < 16; i++) { const on = BITS.has(i), x = 16 + i * 28; b += cell(x, 40, 26, 30, on ? 1 : 0, qb.includes(i) ? (on ? "warn" : "bad") : on ? "acc" : "ghost", { size: 12 }); b += t(x + 13, 84, String(i), { size: 9.5, fill: C.dim }); }
      if (!q) {
        BSET.forEach((w, j) => { const y = 108 + j * 24; b += t(16, y, w + " -> bits " + h1(w) + ", " + h2(w), { a: "start", size: 11.5, mono: true }); });
        b += t(240, 186, "Stored: 5 bits set, no names kept.", { size: 11.5, fill: C.dim });
        return svg(480, 200, b, "Bloom filter bit array after three inserts");
      }
      const all = qb.every(i => BITS.has(i)), truly = BSET.includes(q);
      const verdict = !all ? ["definitely not present (a bit is 0)", "good"] : truly ? ["maybe present: and it really is", "acc"] : ["maybe present: a FALSE POSITIVE", "warn"];
      b += box(60, 104, 360, 34, verdict[0], null, verdict[1], { size: 12.5 });
      b += t(240, 160, all && !truly ? "alice set bit 14 and bob set bit 6, the same bits zara hashes to" : "", { size: 11, fill: C.dim, max: 456 });
      return svg(480, 172, b, "Bloom filter query result");
    },
    caption: "Blue bits are set. A query looks only at its own positions: any 0 means a certain no.",
    ix: el => choice(el, { label: "Query", options: BQ, value: 0 }, i => ({ svg: P["dsa-bloom"]._fig(i), note: ["bob was added, so both of its bits are 1.", "Bit 0 is 0, so dave was never added. No disk read needed.", "Both bits are 1 but zara was never added: a false positive. The real system would read the file and find nothing.", "Bit 7 is 0, so mia is definitely absent."][i] + " (Toy hash functions over 16 bits; real filters use millions of bits.)" })),
    oneline: "A Bloom filter is a bit array that can say \"definitely not here\" for sure, and \"probably here\" with small error.",
  };
})();
