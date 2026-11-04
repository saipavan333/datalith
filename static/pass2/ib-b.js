/* Datalith pass 2 — Track 25: Interview bank (part 2 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const loop = P2L.ibLoop, row = P2L.ibRow;

  /* ---------------------------------------------------------------- ib-co-databricks */
  P["ib-co-databricks"] = {
    simple: [
      "Databricks builds Spark and Delta Lake, so its loop asks the deepest Spark questions of any company. After a technical screen (SQL plus PySpark), the onsite covers Spark internals and tuning, Delta Lake, lakehouse and medallion design, SQL, and behavioural.",
      "Expect \"why is this job slow?\" questions. The usual culprits are big shuffles, too many small files, and **skew**: one key holding far more rows than the rest, so one task runs for an hour while the others finish in a minute.",
      "A signature fix is **salting**: add a random number (the salt) to the hot key so its rows spread over several tasks, and copy the matching rows of the other table once per salt value.",
    ],
    analogy: {
      text: "Think of supermarket checkouts on a festival evening.",
      left: "Checkouts", right: "Skew and salting",
      map: [
        ["Every family with a festival hamper sent to till 1", "All rows of the hot key go to one task"],
        ["Till 1's queue is out the door", "One straggler task holds up the stage"],
        ["Hamper families told: pick till 1, 2, 3 or 4 at random", "Salting the hot key 0-3"],
        ["Each till gets the price list too", "Replicating the other side per salt"],
      ],
      breaks: "extra tills are free to open. Salting multiplies the small side by the number of salts, so you salt only the hot keys, or let AQE's skew-join handling split them for you.",
    },
    svg: () => {
      let b = loop("Databricks: Spark and Delta, deepest of any loop", [["screen", "PySpark", "warn"], ["Spark", "internals", "bad"], ["Delta Lake", null, "acc"], ["lakehouse", "design", "acc"], ["SQL", null, "acc"], ["behaviour", null, "good"]]);
      b += t(120, 96, "before: key = country", { bold: true, size: 12, fill: C.badT });
      b += t(360, 96, "after: key = country + salt", { bold: true, size: 12, fill: C.goodT });
      b += line(240, 84, 240, 240, { dash: true });
      [["task 1: US", 70], ["task 2: IN", 12], ["task 3: UK", 10], ["task 4: DE", 8]].forEach(([s, v], i) => { const y = 108 + i * 30; b += t(20, y + 15, s, { a: "start", size: 11 }); b += `<rect x="100" y="${y + 3}" width="${v * 1.5}" height="16" rx="3" style="fill:${v > 30 ? C.badS : C.accS}"/>`; b += t(106 + v * 1.5, y + 15, v + "%", { a: "start", size: 10.5 }); });
      [["US_0 + IN", 29.5], ["US_1 + UK", 27.5], ["US_2 + DE", 25.5], ["US_3", 17.5]].forEach(([s, v], i) => { const y = 108 + i * 30; b += t(256, y + 15, s, { a: "start", size: 11, mono: true }); b += `<rect x="350" y="${y + 3}" width="${v * 1.8}" height="16" rx="3" style="fill:${C.goodS}"/>`; b += t(356 + v * 1.8, y + 15, v + "%", { a: "start", size: 10.5 }); });
      b += t(360, 236, "US split 4 ways; other side copied 4x", { size: 10, fill: C.dim, max: 230 });
      b += t(120, 236, "the US task runs ~6x longer", { size: 10.5, fill: C.dim });
      return svg(480, 250, b, "Databricks loop and salting a skewed key");
    },
    caption: "Salting turns one huge task into several normal ones. In Spark 3, AQE can split skewed join partitions automatically.",
    oneline: "Databricks digs deepest into Spark; know why jobs are slow and how salting fixes a hot key.",
  };

  /* ---------------------------------------------------------------- ib-co-uber */
  const PINGS = [0, 4, 9, 30, 33, 52, 56, 90, 95, 99];
  P["ib-co-uber"] = {
    simple: [
      "Uber's loop is a technical screen (SQL plus Python), then advanced SQL, marketplace data modelling (riders, drivers, trips, cities), real-time pipeline design, coding and behavioural. The stack leans on streaming: Kafka, Flink, Hive and Presto.",
      "A signature SQL question is **sessionization**: split a driver's pings into online sessions, where a gap longer than 15 minutes starts a new session.",
      "The recipe: `LAG` gets the previous ping's time, a `CASE` sets a flag of 1 when the gap is too long, and a running `SUM` of the flags numbers the sessions. This \"gaps and islands\" pattern is one of the most asked SQL tricks.",
    ],
    analogy: {
      text: "Think of a bus timetable written as a list of times a bus passed your stop.",
      left: "Bus stop", right: "Sessionization",
      map: [
        ["Time since the last bus", "ts - LAG(ts)"],
        ["\"A long wait means a new service started\"", "Flag = 1 when the gap is above the threshold"],
        ["Counting how many services so far", "Running SUM of flags = session id"],
        ["What counts as a long wait", "The threshold (15 min here)"],
      ],
      breaks: "the timetable has one bus. In SQL you must `PARTITION BY driver_id`, or one driver's gap would start another driver's session.",
    },
    svg: () => P["ib-co-uber"]._fig(20, true),
    _fig: (th, withLoop) => {
      let b = withLoop ? loop("Uber: streaming-heavy marketplace loop", [["screen", "SQL + Python", "warn"], ["adv. SQL", null, "acc"], ["modelling", "marketplace", "acc"], ["real-time", "design", "bad"], ["coding", null, "acc"], ["behaviour", null, "good"]]) : t(240, 18, "Driver pings (minutes), new session when gap > " + th, { bold: true, size: 13 });
      const y0 = withLoop ? 92 : 30, X = m => 30 + m * 4.2;
      let sess = 1; const sid = PINGS.map((p, i) => { if (i && p - PINGS[i - 1] > th) sess++; return sess; });
      const kinds = ["acc", "good", "warn", "vio", "bad", "plain"];
      if (withLoop) b += t(240, y0, "Signature: sessions from a driver's pings, gap > " + th + " min", { bold: true, size: 12, fill: C.accT });
      b += line(30, y0 + 46, 450, y0 + 46);
      PINGS.forEach((p, i) => {
        const k = P2L.KIND[kinds[(sid[i] - 1) % kinds.length]];
        b += `<circle cx="${X(p)}" cy="${y0 + 46}" r="7" style="fill:${k[1]}"/>`;
        b += t(X(p), y0 + 70 + (i % 2) * 12, String(p), { size: 10, fill: C.dim });
        if (i) { const g = p - PINGS[i - 1]; b += t((X(p) + X(PINGS[i - 1])) / 2, y0 + 32, String(g), { size: 10, fill: g > th ? C.badT : C.faint, bold: g > th }); }
      });
      b += t(240, y0 + 100, "gap shown above the line; red gaps start a new session", { size: 11, fill: C.dim });
      b += t(240, y0 + 120, sess + " sessions", { size: 13, bold: true, fill: C.goodT });
      b += t(240, y0 + 142, "SUM(CASE WHEN ts - LAG(ts) > " + th + " THEN 1 ELSE 0 END) OVER (ORDER BY ts)", { size: 10, mono: true, fill: C.accT, max: 456 });
      return svg(480, y0 + 154, b, "Sessionization of driver pings by gap threshold");
    },
    caption: "Here the threshold is 20 minutes, so 3 sessions. Each long gap starts a new colour; the running count of breaks is the session id.",
    ix: el => slider(el, { label: "New session after a gap of (min)", min: 3, max: 40, value: 15 }, v => ({ svg: P["ib-co-uber"]._fig(v, false), note: "Gaps here are 4, 5, 21, 3, 19, 4, 34, 5, 4. The threshold is a business choice, so ask the interviewer for it rather than guessing." })),
    oneline: "Uber loves gaps-and-islands: LAG for the gap, a flag for long gaps, a running sum for the session id.",
  };

  /* ---------------------------------------------------------------- ib-co-airbnb */
  P["ib-co-airbnb"] = {
    simple: [
      "Airbnb created Apache Airflow and an internal metrics layer called Minerva, and its loop reflects that: advanced SQL, dimensional modelling, data quality and consistent metrics, Airflow pipeline design, and behavioural.",
      "A signature SQL question: nightly occupancy per listing, including nights with no booking. If you only `GROUP BY` the bookings table, empty nights simply don't exist in the result.",
      "The fix is a **date spine**: a table with one row per calendar day. `LEFT JOIN` the bookings onto it and `COALESCE` the missing values to 0, so empty nights count.",
    ],
    analogy: {
      text: "Think of a school register.",
      left: "Register", right: "Date spine",
      map: [
        ["The printed list of every school day", "Date spine, one row per day"],
        ["Ticks only on days a pupil came", "Booking rows only on booked nights"],
        ["Blank boxes still count as absent", "LEFT JOIN keeps unbooked nights, COALESCE to 0"],
        ["Attendance % uses all school days", "Occupancy uses all nights, not just booked ones"],
      ],
      breaks: "the register is printed once a year. A spine must cover exactly the range asked about, or occupancy is computed over the wrong number of nights.",
    },
    svg: () => {
      let b = loop("Airbnb: metrics, quality and Airflow", [["screen", "SQL-heavy", "warn"], ["adv. SQL", null, "acc"], ["modelling", null, "acc"], ["metrics", "DQ", "bad"], ["Airflow", "design", "acc"], ["behaviour", null, "good"]]);
      b += t(240, 94, "Signature: occupancy for one listing, 1-7 Nov", { bold: true, size: 12.5, fill: C.accT });
      const booked = [0, 1, 1, 0, 0, 1, 0];
      b += t(20, 124, "bookings only", { a: "start", size: 11.5, fill: C.dim });
      booked.forEach((v, i) => { if (v) b += box(130 + i * 46, 108, 40, 26, String(i + 1), null, "acc", { size: 11 }); });
      b += t(20, 170, "spine LEFT JOIN", { a: "start", size: 11.5, fill: C.dim });
      booked.forEach((v, i) => { b += box(130 + i * 46, 154, 40, 26, String(i + 1) + ":" + v, null, v ? "acc" : "ghost", { size: 11 }); });
      b += t(130, 212, "AVG over booking rows only = 100% (wrong)", { a: "start", size: 11.5, fill: C.badT });
      b += t(130, 232, "AVG over the spine = 3 / 7 = 43%", { a: "start", size: 11.5, fill: C.goodT });
      return svg(480, 246, b, "Airbnb loop and a date spine filling unbooked nights");
    },
    caption: "Without the spine, empty nights vanish and occupancy looks perfect; the spine brings them back as zeros.",
    oneline: "Airbnb tests metric correctness; a date spine makes missing days count as zero instead of vanishing.",
  };

  /* ---------------------------------------------------------------- ib-co-linkedin */
  P["ib-co-linkedin"] = {
    simple: [
      "LinkedIn created Apache Kafka, and its loop is CS-heavy: SQL, coding and algorithms, data modelling, streaming and pipeline system design, and a values-based behavioural round.",
      "A signature SQL question is **second-degree connections**, the \"People You May Know\" idea: friends of your friends who are not already your friends, ranked by how many friends you share.",
      "In SQL you self-join the connections table twice (me to friend, friend to their friend), remove yourself and your existing friends, then `GROUP BY` the candidate and `COUNT` the mutual friends.",
    ],
    analogy: {
      text: "Think of being new at school.",
      left: "New at school", right: "2nd-degree connections",
      map: [
        ["Your two friends from your old school", "1st-degree connections"],
        ["Their friends you haven't met", "2nd-degree candidates"],
        ["\"Both my friends know Chen\"", "Mutual count = 2"],
        ["Meeting the most-shared friend first", "Rank by mutual count"],
      ],
      breaks: "at school you meet a few friends of friends. At LinkedIn scale, a member with thousands of connections makes the self-join explode, so real systems precompute candidates in batch or use a graph engine.",
    },
    svg: () => {
      let b = loop("LinkedIn: CS-heavy, Kafka's birthplace", [["screen", "SQL + code", "warn"], ["SQL", null, "acc"], ["DSA", "CS-heavy", "bad"], ["modelling", null, "acc"], ["streaming", "design", "acc"], ["values", null, "good"]]);
      const N = { me: [60, 160], A: [170, 115], B: [170, 205], C: [300, 115], D: [300, 205], E: [300, 160] };
      [["me", "A"], ["me", "B"], ["A", "C"], ["B", "C"], ["A", "E"], ["B", "D"], ["A", "B"]].forEach(([x, y]) => { b += line(N[x][0], N[x][1], N[y][0], N[y][1], { stroke: C.line }); });
      Object.entries(N).forEach(([n, [x, y]]) => { const k = n === "me" ? "vio" : (n === "A" || n === "B") ? "acc" : "good"; b += `<circle cx="${x}" cy="${y}" r="17" style="fill:${P2L.KIND[k][0]};stroke:${P2L.KIND[k][1]};stroke-width:1.6"/>`; b += t(x, y + 5, n, { bold: true, size: 12, fill: P2L.KIND[k][2] }); });
      b += t(240, 94, "Signature: 2nd-degree connections and mutual counts", { bold: true, size: 12.5, fill: C.accT });
      b += table(352, 118, ["who", "mutual"], [["C", "2"], ["E", "1"], ["D", "1"]], { cw: [56, 60], rh: 24, size: 12, hl: { 0: "good" } });
      b += t(410, 226, "B is A's friend too,", { size: 10.5, fill: C.dim });
      b += t(410, 240, "but already mine: out", { size: 10.5, fill: C.dim });
      return svg(480, 252, b, "LinkedIn loop and second-degree connections graph");
    },
    caption: "Walk two hops from \"me\", drop me and my direct connections, then count how many paths reach each person.",
    oneline: "LinkedIn tests graph thinking in SQL: friends of friends you don't know yet, ranked by mutual friends.",
  };

  /* ---------------------------------------------------------------- ib-co-apple */
  P["ib-co-apple"] = {
    simple: [
      "Apple's loop depends heavily on the team. After a technical screen (SQL plus coding), the onsite has four to six rounds: SQL, Spark or Python coding, data modelling, practical system design, and behavioural.",
      "The flavour is privacy and quality. Expect questions such as \"design device telemetry analytics without keeping personal data\".",
      "The mechanism to know is **data minimisation**: remove or hash identifiers as early as possible, coarsen details that could identify someone (exact location, exact time), aggregate to groups, and make raw data expire automatically.",
    ],
    analogy: {
      text: "Think of a doctor sharing statistics with researchers.",
      left: "Medical statistics", right: "Data minimisation",
      map: [
        ["Names crossed out", "Drop or hash direct identifiers"],
        ["Exact birthday becomes birth year", "Coarsen quasi-identifiers"],
        ["\"312 patients in this region\"", "Aggregate to cohorts"],
        ["Original files shredded after a set time", "Raw data auto-expires"],
      ],
      breaks: "crossed-out names feel safe, but a plain hash of an email can be reversed by hashing guesses. Use a keyed hash or random tokens, and remember combinations of coarse fields can still identify people.",
    },
    svg: () => {
      let b = loop("Apple: team-dependent loop, privacy bent", [["screen", "SQL + code", "warn"], ["SQL", null, "acc"], ["Spark", "or Python", "acc"], ["modelling", null, "acc"], ["design", "pragmatic", "bad"], ["behaviour", null, "good"]]);
      b += t(240, 94, "Signature: telemetry pipeline that keeps as little as possible", { bold: true, size: 12, fill: C.accT });
      b += row([["raw events", "device id, GPS", "bad"], ["strip / hash", "keyed hash", "warn"], ["coarsen", "city, hour", "warn"], ["aggregate", "cohorts", "good"], ["serve", "no raw ids", "good"]], 12, 106, 84, 46, 9, { size: 11, size2: 9.5 });
      b += arrow(54, 154, 54, 186, { sw: 1.1, dash: true });
      b += box(12, 188, 140, 30, "raw expires in N days", null, "bad", { size: 10.5 });
      b += t(320, 206, "less kept = less to leak, delete or explain", { size: 11, fill: C.dim });
      b += t(240, 238, "Also: idempotent loads, DQ checks, skew fixes on hot device types", { size: 10.5, fill: C.dim, max: 456 });
      return svg(480, 250, b, "Apple loop and a data-minimising telemetry pipeline");
    },
    caption: "Personal detail shrinks at each step, and the only copy of the raw data has an expiry date.",
    oneline: "Apple wants practical designs that keep as little personal data as possible, as early as possible.",
  };

  /* ---------------------------------------------------------------- ib-co-stripe */
  const ST = [["retry, no key", 2, "bad", "The first request reached Stripe and charged the card; only the response was lost. The retry is a brand-new request, so the customer pays twice."], ["retry with Idempotency-Key", 1, "good", "The retry carries the same key, so the server returns the saved result of the first request instead of charging again."]];
  P["ib-co-stripe"] = {
    simple: [
      "Stripe moves money, so its loop is about correctness. After a practical screen (SQL plus real-world coding), the onsite covers SQL, coding, financial data modelling, correctness-first system design, and behavioural on its operating principles.",
      "Three ideas run through every answer: **idempotency** (a repeated request has no extra effect), **exactly-once** processing, and **reconciliation** (proving your ledger matches the bank's and the processor's).",
      "Stripe's own API shows the mechanism: a client sends an `Idempotency-Key` header with a payment request, and a retry with the same key returns the first result instead of charging again.",
    ],
    analogy: {
      text: "Think of a cinema ticket with a seat number.",
      left: "Cinema", right: "Idempotency key",
      map: [
        ["Your seat number on the ticket", "The idempotency key"],
        ["Showing the ticket twice at the door", "Retrying the same request"],
        ["Still one seat, no second charge", "Server returns the stored result"],
        ["The box office's list of sold seats", "Server-side store of keys and responses"],
      ],
      breaks: "a ticket is valid for one film forever. Keys are remembered only for a limited time: Stripe may delete a key once it is at least 24 hours old, and a retry after that is treated as a new request.",
    },
    svg: () => {
      let b = loop("Stripe: correctness is the whole game", [["screen", "SQL + coding", "warn"], ["SQL", "ledgers", "acc"], ["coding", "real world", "acc"], ["finance", "modelling", "acc"], ["design", "correctness", "bad"], ["principles", null, "good"]]);
      b += t(240, 94, "Signature: net revenue per day and currency, signed amounts", { bold: true, size: 12, fill: C.accT });
      b += table(30, 106, ["type", "amount", "signed"], [["charge", "100", "+100"], ["refund", "30", "-30"], ["dispute", "20", "-20"], ["charge", "50", "+50"]], { cw: [90, 80, 80], rh: 24, size: 12, hl: { 1: "bad", 2: "bad" } });
      b += box(300, 130, 160, 50, "net = 100 USD", "never add across currencies", "good", { size: 13, size2: 10 });
      b += arrow(282, 155, 298, 155);
      return svg(480, 236, b, "Stripe loop and signed amounts for net revenue");
    },
    caption: "Refunds and disputes become negative amounts, so a single SUM gives net revenue per currency.",
    _fig: i => {
      const [n, charges, k] = ST[i];
      let b = t(240, 18, n, { bold: true, size: 13 });
      [["client", 70], ["Stripe API", 240], ["card", 410]].forEach(([s, x]) => { b += box(x - 50, 30, 100, 26, s, null, "acc", { size: 11.5 }); b += line(x, 58, x, 196, { dash: true }); });
      b += arrow(70, 74, 238, 74, { label: i ? "charge, key=ord_81" : "charge" });
      b += arrow(242, 92, 408, 92, { label: "charge 100" });
      b += arrow(238, 112, 150, 112, { stroke: C.badS, label: "response lost", lfill: C.badT });
      b += arrow(70, 138, 238, 138, { stroke: C.warnS, label: i ? "retry, key=ord_81" : "retry", lfill: C.warnT });
      if (i) b += arrow(238, 160, 72, 160, { stroke: C.goodS, label: "same saved result", lfill: C.goodT });
      else b += arrow(242, 160, 408, 160, { stroke: C.badS, label: "charge 100 again", lfill: C.badT });
      b += box(140, 200, 200, 28, "card charged " + charges + "x", null, k, { size: 12.5 });
      return svg(480, 240, b, "Payment retry with and without an idempotency key");
    },
    ix: el => choice(el, { label: "Retry", options: ST.map(s => s[0]), value: 0 }, i => ({ svg: P["ib-co-stripe"]._fig(i), note: ST[i][3] })),
    oneline: "At Stripe every answer must be safe to retry: idempotency keys, exactly-once and reconciliation.",
  };

  /* ---------------------------------------------------------------- ib-co-goldman */
  const H = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
  const TRAP = (() => {
    const st = [{ l: 0, r: H.length - 1, lm: 0, rm: 0, w: 0, fill: H.map(() => 0), msg: "start: l at the left end, r at the right end" }];
    let l = 0, r = H.length - 1, lm = 0, rm = 0, w = 0; const fill = H.map(() => 0);
    while (l < r) {
      let msg;
      if (H[l] < H[r]) { lm = Math.max(lm, H[l]); const add = lm - H[l]; fill[l] = add; w += add; msg = "h[l] < h[r]: left side is the limit; water at " + l + " = " + lm + " - " + H[l] + " = " + add; l++; }
      else { rm = Math.max(rm, H[r]); const add = rm - H[r]; fill[r] = add; w += add; msg = "h[l] >= h[r]: right side is the limit; water at " + r + " = " + rm + " - " + H[r] + " = " + add; r--; }
      st.push({ l, r, lm, rm, w, fill: fill.slice(), msg });
    }
    return st;
  })();
  P["ib-co-goldman"] = {
    simple: [
      "Goldman Sachs starts with a HackerRank online assessment, then a phone screen on data structures (arrays, trees, recursion, graphs), then three to five onsite rounds of about 45 minutes: SQL, Python coding, Spark and big-data internals, data modelling and architecture, and a values-based behavioural.",
      "A signature coding problem is **Trapping Rain Water** (asked as \"Snowpack\"): given bar heights, how much water is trapped between them?",
      "The fast answer uses **two pointers**, one at each end. Water above a bar is limited by the lower of the tallest bars on its left and right, so always move the pointer on the lower side. That gives O(n) time and O(1) extra memory.",
    ],
    analogy: {
      text: "Think of two people walking towards each other along a row of walls, each holding a measuring stick.",
      left: "Two walkers", right: "Two pointers",
      map: [
        ["Each walker remembers the tallest wall they've passed", "lm and rm, running maxima"],
        ["Whoever stands at the lower wall steps forward", "Move the pointer with the smaller height"],
        ["Water at your spot = your tallest wall - this wall", "w += lm - h[l]"],
        ["They meet in the middle", "Loop ends when l = r"],
      ],
      breaks: "real walkers could look over the whole row. The algorithm never needs to: the lower side's maximum is already the true limit, because the other side is known to have something at least as tall.",
    },
    svg: () => P["ib-co-goldman"]._fig(TRAP.length - 1, true),
    _fig: (k, withLoop) => {
      const s = TRAP[k];
      let b = withLoop ? loop("Goldman Sachs: OA, DSA screen, onsite", [["OA", "HackerRank", "warn"], ["DSA phone", null, "warn"], ["SQL", null, "acc"], ["Python", null, "acc"], ["Spark", "internals", "bad"], ["values", null, "good"]]) : t(240, 18, "Trapping rain water, step " + k + " of " + (TRAP.length - 1), { bold: true, size: 13 });
      const y0 = withLoop ? 84 : 26, base = y0 + 116, X = i => 48 + i * 32, U = 30;
      H.forEach((h, i) => {
        if (s.fill[i]) b += `<rect x="${X(i) + 2}" y="${base - (h + s.fill[i]) * U}" width="28" height="${s.fill[i] * U}" style="fill:${C.accS};opacity:.75"/>`;
        if (h) b += `<rect x="${X(i) + 2}" y="${base - h * U}" width="28" height="${h * U}" style="fill:#5d6a80;stroke:${C.boxS}"/>`;
        b += t(X(i) + 16, base + 14, String(h), { size: 10, fill: C.dim });
      });
      b += line(44, base, 436, base);
      if (k < TRAP.length - 1 || !withLoop) {
        b += t(X(s.l) + 16, base + 30, "l", { bold: true, size: 13, fill: C.goodT });
        b += t(X(s.r) + 16, base + 30, s.l === s.r ? "l=r" : "r", { bold: true, size: 13, fill: C.warnT });
      }
      b += t(240, base + 50, s.msg, { size: 11, fill: C.dim, max: 456 });
      b += t(240, base + 70, "lm = " + s.lm + "   rm = " + s.rm + "   water so far = " + s.w, { size: 12, bold: true, mono: true, fill: C.accT });
      return svg(480, base + 82, b, "Trapping rain water two-pointer step");
    },
    caption: "Blue is trapped water: 6 units for heights 0,1,0,2,1,0,1,3,2,1,2,1. Move the slider below to step the two pointers.",
    ix: el => slider(el, { label: "Step", min: 0, max: TRAP.length - 1, value: 0 }, v => ({ svg: P["ib-co-goldman"]._fig(v, false), note: v === TRAP.length - 1 ? "Pointers met: total 6. Each bar was visited once, so O(n) time, O(1) extra memory." : "The pointer on the lower side moves, because that side's maximum is the limit for its water." })),
    oneline: "Goldman tests real algorithms and Spark depth; Trapping Rain Water is two pointers moving from the lower side.",
  };

  /* ---------------------------------------------------------------- ib-co-jpmorgan */
  P["ib-co-jpmorgan"] = {
    simple: [
      "JPMorgan Chase runs a broad, practical loop: a recruiter call, then a long technical interview (about an hour and 45 minutes) covering Java or Python fundamentals, big data, hands-on PySpark and SQL, then a manager round on fit and \"why JPMorgan\".",
      "A signature task: write a PySpark job that filters orders, joins a small customer table, sums revenue per day, and writes partitioned Parquet.",
      "The mechanism they probe: Spark is **lazy**. Each line only adds to a plan; nothing runs until an **action** such as `write`. Then Spark splits the plan into **stages** at each shuffle. Broadcasting the small table keeps the big one from shuffling.",
    ],
    analogy: {
      text: "Think of writing a shopping list before going to the shop.",
      left: "Shopping", right: "Lazy Spark plan",
      map: [
        ["Writing items on the list", "Transformations: filter, join, groupBy"],
        ["Nothing is bought yet", "No data is read yet"],
        ["Walking to the shop", "The action (write) triggers the job"],
        ["Planning the route through aisles", "Catalyst optimiser plans stages"],
      ],
      breaks: "a list never changes when you look at it. Calling an action such as `count()` while debugging re-runs the whole plan each time unless you cache.",
    },
    svg: () => {
      let b = loop("JPMorgan: broad and practical", [["recruiter", null, "plain"], ["technical", "~1h45, PySpark", "bad"], ["exec / manager", "why JPM", "good"]]);
      b += t(240, 94, "Signature PySpark job: lazy until write, 2 stages", { bold: true, size: 12.5, fill: C.accT });
      b += `<rect x="12" y="104" width="300" height="70" rx="10" style="fill:none;stroke:${C.accS};stroke-dasharray:5 4"/>`;
      b += t(20, 118, "stage 1", { a: "start", size: 10.5, fill: C.accT });
      b += row([["scan", "orders", "plain"], ["filter", "US, >100", "acc"], ["join", "broadcast cust", "good"]], 20, 124, 88, 42, 10, { size: 11, size2: 9 });
      b += arrow(314, 145, 338, 145); b += t(326, 188, "shuffle", { size: 10, fill: C.warnT });
      b += `<rect x="340" y="104" width="128" height="70" rx="10" style="fill:none;stroke:${C.vioS};stroke-dasharray:5 4"/>`;
      b += t(348, 118, "stage 2", { a: "start", size: 10.5, fill: C.vioT });
      b += box(348, 124, 112, 42, "sum by day", "write by date", "vio", { size: 11, size2: 9 });
      b += t(240, 208, "nothing runs until .write(); the small cust table goes to every executor", { size: 11, fill: C.dim, max: 456 });
      b += t(240, 228, "partial sums happen before the shuffle, so little data moves", { size: 11, fill: C.dim });
      return svg(480, 242, b, "JPMorgan loop and a PySpark job split into stages");
    },
    caption: "Transformations build a plan; the write action runs it as two stages split at the groupBy shuffle.",
    oneline: "JPMorgan checks breadth and hands-on PySpark; know that Spark is lazy and splits work at shuffles.",
  };

  /* ---------------------------------------------------------------- ib-co-morganstanley */
  const PNL = [120, -40, 60, -90, 30];
  P["ib-co-morganstanley"] = {
    simple: [
      "Morgan Stanley's loop is a recruiter call, a technical phone screen on data engineering basics, then three to five back-to-back final rounds: SQL, Python coding, ETL and system design, data modelling, and behavioural with the hiring manager.",
      "Questions have a finance flavour: trades, positions, profit and loss (**P&L**).",
      "A signature SQL question: running P&L per account. `SUM(pnl) OVER (PARTITION BY account ORDER BY trade_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` adds every earlier day to the current one, separately for each account.",
    ],
    analogy: {
      text: "Think of your pocket money diary.",
      left: "Pocket money", right: "Running total",
      map: [
        ["Each day's gain or spend", "Daily pnl"],
        ["The balance written at the bottom of each line", "Running SUM over earlier rows"],
        ["Separate diaries for you and your sister", "PARTITION BY account"],
        ["Lines in date order", "ORDER BY trade_date"],
      ],
      breaks: "a diary has one line per day. With several trades on one day, the default frame `RANGE` treats them as one group, so write `ROWS` explicitly and add a tie-breaker if you need one line at a time.",
    },
    svg: () => {
      let b = loop("Morgan Stanley: phone, then back-to-back finals", [["recruiter", null, "plain"], ["phone", "DE basics", "warn"], ["SQL", null, "acc"], ["Python", null, "acc"], ["ETL design", null, "acc"], ["manager", "behaviour", "good"]]);
      b += t(240, 94, "Signature: running P&L for one account", { bold: true, size: 12.5, fill: C.accT });
      let run = 0; const R = PNL.map((p, i) => { run += p; return ["d" + (i + 1), (p > 0 ? "+" : "") + p, String(run)]; });
      b += table(16, 106, ["day", "pnl", "running"], R, { cw: [50, 60, 70], rh: 24, size: 12 });
      const X = i => 240 + i * 50, Y = v => 220 - v * 0.6;
      b += line(226, Y(0), 470, Y(0), { dash: true });
      b += t(470, Y(0) - 4, "0", { a: "end", size: 10, fill: C.dim });
      run = 0; let pts = []; PNL.forEach((p, i) => { run += p; pts.push(X(i) + "," + Y(run)); b += `<circle cx="${X(i)}" cy="${Y(run)}" r="4" style="fill:${C.goodS}"/>`; b += t(X(i), Y(run) - 9, String(run), { size: 10.5, fill: C.goodT }); });
      b += `<polyline points="${pts.join(" ")}" style="fill:none;stroke:${C.goodS};stroke-width:2"/>`;
      return svg(480, 262, b, "Morgan Stanley loop and running P&L");
    },
    caption: "Each running value is the sum of that day and all earlier days for the account.",
    oneline: "Morgan Stanley asks finance-flavoured SQL; a running total is SUM over all earlier rows per account.",
  };

  /* ---------------------------------------------------------------- ib-co-capitalone */
  P["ib-co-capitalone"] = {
    simple: [
      "Capital One starts with a CodeSignal online assessment that acts as a gateway, then a recruiter call, then a \"Power Day\" of three or four back-to-back interviews: technical coding (SQL plus Python ETL), a **business case study**, and behavioural and job fit. The stack is AWS-heavy.",
      "A signature SQL question: top 3 transactions per customer last month. The window part is standard; the trap is the date filter.",
      "Use a **half-open range**: `txn_date >= first day of last month AND txn_date < first day of this month`. It catches every moment of the last day, works for months of any length, and never double counts midnight.",
    ],
    analogy: {
      text: "Think of a shop that is open from 9 until 5.",
      left: "Opening hours", right: "Half-open date range",
      map: [
        ["Customers who arrive at 9:00 are served", ">= start (inclusive)"],
        ["The door shuts at 5:00; at 5:00 you're too late", "< end (exclusive)"],
        ["\"Open 9 to 4:59\" would turn away someone at 4:59:30", "BETWEEN with the last date misses its afternoon"],
      ],
      breaks: "a shop shuts once. With timestamps in different time zones, the boundary has to be computed in the right zone first, or the month starts at the wrong hour.",
    },
    svg: () => {
      let b = loop("Capital One: OA gate, then a Power Day", [["CodeSignal", "gateway OA", "warn"], ["recruiter", null, "plain"], ["coding", "SQL + Python", "acc"], ["case study", "business", "bad"], ["behaviour", "job fit", "good"]]);
      b += t(240, 94, "Signature: \"last month\" as a half-open range (October 2026)", { bold: true, size: 12, fill: C.accT });
      b += line(30, 150, 450, 150, { sw: 2 });
      b += `<circle cx="60" cy="150" r="7" style="fill:${C.goodS}"/>`; b += t(60, 134, "Oct 1 00:00", { size: 11, fill: C.goodT }); b += t(60, 174, ">= (included)", { size: 10.5, fill: C.goodT });
      b += `<circle cx="420" cy="150" r="7" style="fill:${C.card};stroke:${C.badS};stroke-width:2"/>`; b += t(420, 134, "Nov 1 00:00", { size: 11, fill: C.badT }); b += t(420, 174, "< (excluded)", { size: 10.5, fill: C.badT });
      b += `<rect x="60" y="146" width="360" height="8" style="fill:${C.goodS};opacity:.45"/>`;
      [["Oct 31 18:30", 392]].forEach(([s, x]) => { b += line(x, 140, x, 160, { stroke: C.warnS, sw: 2 }); b += t(x - 4, 196, s + ": kept by >= / <", { a: "end", size: 10.5, fill: C.warnT }); });
      b += t(240, 222, "BETWEEN '2026-10-01' AND '2026-10-31' on a timestamp stops at Oct 31 00:00", { size: 10.5, fill: C.badT, max: 456 });
      return svg(480, 236, b, "Capital One loop and a half-open date range for last month");
    },
    caption: "Filled dot = included, hollow dot = excluded. The half-open range keeps all of 31 October.",
    oneline: "Capital One adds a business case round; in SQL, write last month as >= start and < next start.",
  };

  /* ---------------------------------------------------------------- ib-co-bloomberg */
  P["ib-co-bloomberg"] = {
    simple: [
      "Bloomberg's loop is a CoderPad technical phone (one strong problem plus follow-ups), sometimes an online assessment, then three to five onsite rounds: practical data engineering and coding, Python and Pandas data handling, system design depending on the team, and behavioural with a senior manager.",
      "The bar is production code: correct, readable, and careful with messy input.",
      "A signature warm-up: count distinct tickers in a string like `'AAPL; msft ; AAPL; ; MSFT'`. The interviewer watches whether you handle spaces, empty pieces and letter case, not just whether you call `set()`.",
    ],
    analogy: {
      text: "Think of a teacher counting how many different names are on a messy sign-up sheet.",
      left: "Sign-up sheet", right: "Cleaning before counting",
      map: [
        ["Splitting the list at each semicolon", "s.split(';')"],
        ["Ignoring extra spaces around names", ".strip()"],
        ["Skipping blank lines", "if p.strip()"],
        ["\"Priya\" and \"PRIYA\" are the same person", ".lower() (or .upper())"],
        ["Counting each name once", "set, then len"],
      ],
      breaks: "a teacher knows that \"Sam\" and \"Samuel\" might be one child. Code can't, so real ticker cleaning also needs a reference list of valid symbols.",
    },
    svg: () => {
      let b = loop("Bloomberg: production-code bar", [["CoderPad", "phone", "warn"], ["OA", "optional", "plain"], ["DE + code", "practical", "bad"], ["Pandas", null, "acc"], ["design", "team-dep.", "acc"], ["manager", null, "good"]]);
      b += t(240, 94, "Signature: distinct tickers from a messy string", { bold: true, size: 12.5, fill: C.accT });
      const S = [["split(';')", "'AAPL',' msft ',' AAPL',' ',' MSFT'"], ["strip()", "'AAPL','msft','AAPL','','MSFT'"], ["drop empty", "'AAPL','msft','AAPL','MSFT'"], ["lower()", "'aapl','msft','aapl','msft'"], ["set + len", "{'aapl','msft'} -> 2"]];
      S.forEach(([a, z], i) => { const y = 104 + i * 26; b += box(12, y, 96, 22, a, null, i === 4 ? "good" : "acc", { size: 10.5, mono: true }); b += t(118, y + 15, z, { a: "start", size: 10.5, mono: true, max: 350 }); });
      b += t(240, 244, "input: 'AAPL; msft ; AAPL; ; MSFT'", { size: 11, mono: true, fill: C.dim });
      return svg(480, 256, b, "Bloomberg loop and a string normalisation pipeline");
    },
    caption: "Each step fixes one kind of mess; skipping any one of them gives the wrong count.",
    oneline: "Bloomberg wants production-quality code, so clean messy input on purpose before you count it.",
  };

  /* ---------------------------------------------------------------- ib-interview-prep */
  P["ib-interview-prep"] = {
    simple: [
      "This is the final review for the whole bank: a four-week plan and a one-page cheat sheet.",
      "Week 1 is SQL (window functions, CTEs, top-N, de-duplication, gaps and islands). Week 2 is Python data structures and DE-style problems. Week 3 is data modelling and Spark internals. Week 4 is system design and 12 to 15 STAR stories. Do two or three mock interviews along the way.",
      "Compress the plan if your interview is sooner, but keep the order: SQL first, because the screen filters most people.",
    ],
    analogy: {
      text: "Think of training for a 10 km race.",
      left: "Race training", right: "Interview prep",
      map: [
        ["Build a base with easy runs", "SQL patterns every day"],
        ["Add speed sessions", "Timed coding problems"],
        ["Long runs at race pace", "Full mock interviews"],
        ["Taper before race day", "Light review, rest, prepared stories"],
      ],
      breaks: "runners know the distance. Interview loops vary, so check the company's playbook and move its heaviest round earlier in the plan.",
    },
    svg: () => {
      let b = t(240, 18, "Four weeks, heaviest gate first", { bold: true, size: 13.5 });
      const W = [["week 1", "SQL", "windows, top-N, dedup, islands", "acc"], ["week 2", "coding", "hash, two pointers, heap, files", "acc"], ["week 3", "modelling + Spark", "grain, SCD2, shuffles, skew", "vio"], ["week 4", "design + stories", "6 steps, 12-15 STAR", "good"]];
      W.forEach(([w, a, z, k], i) => { const y = 32 + i * 44; b += t(20, y + 24, w, { a: "start", size: 11.5, bold: true, fill: C.dim }); b += box(80 + i * 30, y, 260, 38, a, z, k, { size: 12, size2: 10 }); });
      [0, 1, 2].forEach(i => { b += box(420, 40 + i * 52, 48, 30, "mock", null, "warn", { size: 10.5 }); });
      b += t(444, 210, "2-3 mocks", { size: 10.5, fill: C.warnT });
      b += t(240, 230, "Start the real screen only after week 1 feels easy.", { size: 11.5, fill: C.dim });
      return svg(480, 242, b, "Four-week interview preparation plan");
    },
    caption: "One theme a week, with mock interviews spread across the month.",
    oneline: "Prepare round by round over four weeks, SQL first, and finish with mock interviews and STAR stories.",
  };
})();
