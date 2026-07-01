/* Datalith — in-browser AI mentor.
   A faithful port of the offline tutor (app/assistant.py): it finds the most
   relevant lessons by IDF-weighted keyword overlap and explains them. Runs fully
   client-side, so it needs no server. */
(function () {
  const STOP = new Set(("a an the of to is are was were be been being and or but if then so " +
    "for with on in at by from as into about over under it its this that " +
    "these those i you we they he she do does what which how when why who " +
    "whom your my our their can could should would will shall may might " +
    "vs versus difference between explain tell me give example examples " +
    "work works working use used using mean means").split(/\s+/));

  function stem(w) {
    const sufs = ["ization", "isation", "ingly", "ing", "edly", "ies", "es", "ed", "ly", "s"];
    for (const suf of sufs) {
      if (w.endsWith(suf) && w.length - suf.length >= 3) {
        const base = w.slice(0, -suf.length);
        return suf === "ies" ? base + "y" : base;
      }
    }
    return w;
  }

  function tokenize(text) {
    return (String(text).toLowerCase().match(/[a-z0-9]+/g) || [])
      .filter(w => !STOP.has(w) && w.length > 1).map(stem);
  }

  let LESSONS = null, IDF = null;

  function build(curr) {
    LESSONS = [];
    (curr.tracks || []).forEach(t => (t.modules || []).forEach(m => (m.lessons || []).forEach(l => {
      const blob = [l.title, l.summary, l.concept, (l.keypoints || []).join(" "), l.example].join(" ");
      LESSONS.push({
        id: l.id || "", title: l.title || "", track: t.title || "",
        concept: l.concept || "", example: l.example || "", keypoints: l.keypoints || [],
        summary: l.summary || "", words: new Set(tokenize(blob)), titleWords: new Set(tokenize(l.title || "")),
      });
    })));
    const df = {};
    LESSONS.forEach(les => les.words.forEach(w => { df[w] = (df[w] || 0) + 1; }));
    const n = Math.max(1, LESSONS.length);
    IDF = {};
    for (const w in df) IDF[w] = Math.log(1 + n / df[w]);
  }

  function idf(w) { return (IDF && IDF[w]) || 1.0; }

  function retrieve(question, lessonId, k) {
    const qw = tokenize(question);
    if (!qw.length && !lessonId) return [];
    const scored = [];
    for (const les of LESSONS) {
      let score = 0;
      for (const w of qw) {
        if (les.titleWords.has(w)) score += 3.0 * idf(w);
        else if (les.words.has(w)) score += 1.0 * idf(w);
      }
      if (lessonId && les.id === lessonId) score += 1.5;
      if (score > 0) scored.push([score, les]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    return scored.slice(0, k).map(s => s[1]);
  }

  function answer(question, lessonId, curriculum) {
    if (!LESSONS && curriculum) build(curriculum);
    if (!LESSONS) return "Still loading the course — try again in a second.";
    const hits = retrieve(question, lessonId || "", 3);
    if (!hits.length) {
      return "I couldn't find a lesson that directly covers that yet. Try rephrasing, or browse " +
        "the tracks in the sidebar — there are tracks from SQL and Python through Spark, streaming, " +
        "the lakehouse, AI agents, and system design.";
    }
    const best = hits[0];
    const parts = [`**${best.title}** — ${best.track}`, "", best.concept];
    if (best.example) parts.push("", "**Example.** " + best.example);
    if (best.keypoints && best.keypoints.length) {
      parts.push("", "**Key points:**");
      best.keypoints.forEach(kp => parts.push("- " + kp));
    }
    const related = hits.slice(1).map(h => h.title);
    if (related.length) parts.push("", "_Related lessons:_ " + related.join(", ") + ".");
    parts.push("", "_(Answered from the course content.)_");
    return parts.join("\n");
  }

  window.DFA_MENTOR = { answer };
})();
