/* ===================== Datalith — frontend ===================== */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const PROGRESS_KEY = "dfa-progress-v1";
const THEME_KEY = "dfa-theme";

let CURRICULUM = null;
let LESSONS = [];        // flat list in roadmap order
let LESSON_BY_ID = {};
let progress = loadProgress();

/* ---------------- storage ---------------- */
function loadProgress() {
  try { return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveProgress() { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...progress])); }

/* ---------------- tiny markdown renderer (safe-ish, our own content) ---------------- */
function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function mdInline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
function renderMarkdown(md) {
  if (!md) return "";
  const lines = md.replace(/\r/g, "").split("\n");
  let html = "", i = 0;
  while (i < lines.length) {
    let line = lines[i];
    if (line.startsWith("```")) {                       // code block
      let code = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(esc(lines[i])); i++; }
      i++; html += `<pre><code>${code.join("\n")}</code></pre>`; continue;
    }
    if (line.startsWith("@@diagram:")) {                 // embedded diagram
      const key = line.slice(10).trim();
      if (window.DIAGRAMS && DIAGRAMS[key]) html += `<figure class="diagram">${DIAGRAMS[key]}</figure>`;
      i++; continue;
    }
    if (/^#{1,4}\s/.test(line)) {
      const lvl = line.match(/^#+/)[0].length;
      html += `<h${lvl + 1}>${mdInline(line.replace(/^#+\s/, ""))}</h${lvl + 1}>`; i++; continue;
    }
    if (/^\s*\|.*\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|/.test(lines[i + 1]) && lines[i + 1].includes("-")) {  // table
      const cells = r => r.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const head = cells(line); i += 2;               // skip the |---|---| separator row
      let rows = [];
      while (i < lines.length && /^\s*\|.*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
      html += `<table class="md-table"><thead><tr>${head.map(c => `<th>${mdInline(c)}</th>`).join("")}</tr></thead>` +
        `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${mdInline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      continue;
    }
    if (/^\s*[-*]\s/.test(line)) {                      // list
      let items = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) { items.push(`<li>${mdInline(lines[i].replace(/^\s*[-*]\s/, ""))}</li>`); i++; }
      html += `<ul>${items.join("")}</ul>`; continue;
    }
    if (line.trim() === "") { i++; continue; }
    html += `<p>${mdInline(line)}</p>`; i++;
  }
  return html;
}

/* ---------------- boot ---------------- */
async function boot() {
  document.documentElement.setAttribute("data-theme", localStorage.getItem(THEME_KEY) || "dark");
  try {
    CURRICULUM = await (await fetch("content/curriculum.json")).json();
  } catch (e) {
    $("#content").innerHTML = `<div class="empty">Could not load the curriculum. If you opened the file directly, serve the folder over HTTP (see DEPLOY.md) instead of double-clicking index.html.</div>`;
    return;
  }
  // flatten
  CURRICULUM.tracks.forEach(t => t.modules.forEach(m => m.lessons.forEach(l => {
    l._track = t; l._module = m; LESSONS.push(l); LESSON_BY_ID[l.id] = l;
  })));
  buildSidebar();
  updateProgressUI();
  wireChrome();
  route();
}

/* ---------------- sidebar ---------------- */
function buildSidebar() {
  const sb = $("#sidebar");
  sb.innerHTML = "";
  CURRICULUM.tracks.forEach(track => {
    const count = track.modules.reduce((n, m) => n + m.lessons.length, 0);
    const done = track.modules.reduce((n, m) => n + m.lessons.filter(l => progress.has(l.id)).length, 0);
    const el = document.createElement("div"); el.className = "track"; el.dataset.track = track.id;
    el.innerHTML = `
      <button class="track-head">
        <span class="ticon">${track.icon}</span>
        <span class="ttitle">${track.title}</span>
        <span class="tcount">${done}/${count}</span>
        <span class="caret">▶</span>
      </button>
      <div class="track-body">
        ${track.modules.map(m => `
          <div class="module-title">${m.title}</div>
          ${m.lessons.map(l => `
            <button class="lesson-link ${progress.has(l.id) ? "done" : ""}" data-lesson="${l.id}">
              <span class="check">${progress.has(l.id) ? "✓" : ""}</span>
              <span class="ltitle">${l.title}</span>
            </button>`).join("")}
        `).join("")}
      </div>`;
    el.querySelector(".track-head").addEventListener("click", () => el.classList.toggle("open"));
    $$(".lesson-link", el).forEach(b => b.addEventListener("click", () => { location.hash = `#/lesson/${b.dataset.lesson}`; }));
    sb.appendChild(el);
  });
}
function syncSidebarActive(lessonId) {
  $$(".lesson-link").forEach(b => b.classList.toggle("active", b.dataset.lesson === lessonId));
  const link = $(`.lesson-link[data-lesson="${lessonId}"]`);
  if (link) { const tr = link.closest(".track"); if (tr) tr.classList.add("open"); }
}

/* ---------------- progress ---------------- */
function updateProgressUI() {
  const pct = LESSONS.length ? Math.round(progress.size / LESSONS.length * 100) : 0;
  $("#progress-pct").textContent = pct + "%";
  $(".progress-ring").style.setProperty("--p", pct + "%");
}
function markComplete(id, btn) {
  progress.add(id); saveProgress(); updateProgressUI();
  const link = $(`.lesson-link[data-lesson="${id}"]`);
  if (link) { link.classList.add("done"); link.querySelector(".check").textContent = "✓"; }
  // update track count
  const l = LESSON_BY_ID[id];
  const trackEl = $(`.track[data-track="${l._track.id}"] .tcount`);
  if (trackEl) {
    const count = l._track.modules.reduce((n, m) => n + m.lessons.length, 0);
    const done = l._track.modules.reduce((n, m) => n + m.lessons.filter(x => progress.has(x.id)).length, 0);
    trackEl.textContent = `${done}/${count}`;
  }
  if (btn) { btn.textContent = "✓ Completed"; btn.classList.add("good"); btn.disabled = true; }
}

/* ---------------- routing ---------------- */
function route() {
  const hash = location.hash || "#/home";
  if (hash.startsWith("#/lesson/")) return renderLesson(hash.replace("#/lesson/", ""));
  if (hash.startsWith("#/cheat/")) return renderCheatsheet(hash.replace("#/cheat/", ""));
  if (hash.startsWith("#/sql")) return renderPlayground();
  return renderHome();
}

/* ---------------- home ---------------- */
function renderHome() {
  syncSidebarActive(null);
  const totalLessons = LESSONS.length;
  const PHASES = ["Foundations", "Databases & SQL", "Programming & Tooling", "Modeling & Warehousing",
    "Big Data · Pipelines · Streaming · Lakehouse", "Cloud & Platforms (electives)", "Operations & Quality",
    "Specializations (electives)", "System Design & Interview", "Prove It", "Cross-cutting"];
  const card = t => {
    const count = t.modules.reduce((n, m) => n + m.lessons.length, 0);
    const done = t.modules.reduce((n, m) => n + m.lessons.filter(l => progress.has(l.id)).length, 0);
    const first = t.modules[0].lessons[0].id;
    return `<div class="track-card" data-go="${first}">
            <div class="tc-icon">${t.icon}</div>
            <h3>${t.title}</h3>
            <p>${t.blurb}</p>
            <div class="tc-meta">${done}/${count} lessons${done === count && count ? " · ✓ done" : ""}</div>
          </div>`;
  };
  const byPhase = {};
  CURRICULUM.tracks.forEach(t => { const p = (t.phase == null ? 99 : t.phase); (byPhase[p] = byPhase[p] || []).push(t); });
  let sections = "";
  PHASES.forEach((title, i) => {
    const ts = byPhase[i];
    if (!ts || !ts.length) return;
    const label = i === 10 ? "Cross-cutting" : `Phase ${i} · ${title}`;
    sections += `<h2 class="phase-h">${label}</h2><div class="track-grid">${ts.map(card).join("")}</div>`;
  });
  if (byPhase[99]) sections += `<div class="track-grid">${byPhase[99].map(card).join("")}</div>`;
  const html = `
    <div class="home">
      <h1>Become a world-class<br/>Data Engineer.</h1>
      <p class="lead">${CURRICULUM.tagline} A complete roadmap — ${CURRICULUM.tracks.length} tracks,
        ${totalLessons} lessons — grouped into ${PHASES.length - 1} phases from foundations to interview-ready.
        Every concept in plain English, with real examples and a quiz.</p>
      ${sections}
    </div>`;
  $("#content").innerHTML = html;
  $$(".track-card").forEach(c => c.addEventListener("click", () => location.hash = `#/lesson/${c.dataset.go}`));
  { const _c = document.getElementById("content"); if (_c) _c.scrollTop = 0; window.scrollTo(0, 0); }
}

/* ---------------- lesson ---------------- */
async function renderLesson(id) {
  const l = LESSON_BY_ID[id];
  if (!l) return renderHome();
  syncSidebarActive(id);
  const idx = LESSONS.findIndex(x => x.id === id);
  const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
  const isDone = progress.has(id);

  let html = `
    <article class="lesson">
      <div class="crumbs">${l._track.icon} <b>${l._track.title}</b> · ${l._module.title} · ${l.minutes || 8} min read</div>
      <h1>${l.title}</h1>
      <p class="lesson-summary">${l.summary || ""}</p>

      <div class="section-label">The idea, in plain English</div>
      <div class="prose">${renderMarkdown(l.concept || "")}</div>`;

  if (l.diagram && window.DIAGRAMS && DIAGRAMS[l.diagram]) html += `
      <figure class="diagram">${DIAGRAMS[l.diagram]}${l.diagram_caption ? `<figcaption>${mdInline(l.diagram_caption)}</figcaption>` : ""}</figure>`;

  if (l.example) html += `
      <div class="section-label">Real-world example</div>
      <div class="callout example prose">${renderMarkdown(l.example)}</div>`;

  if (l.tryit) html += `
      <div class="section-label">Try it yourself</div>
      <div class="tryit-box"><button class="btn primary" id="tryit">⌘ Open this query in the SQL Playground →</button></div>`;

  if (l.keypoints && l.keypoints.length) html += `
      <div class="section-label">Key takeaways</div>
      <ul class="keypoints">${l.keypoints.map(k => `<li>${mdInline(k)}</li>`).join("")}</ul>`;

  const exs = l.exercises || (l.exercise ? [l.exercise] : []);
  if (exs.length) html += `
      <div class="section-label">🎯 Practice${exs.length > 1 ? ` — ${exs.length} problems` : ""}</div>
      ${exs.map((ex, i) => `
      <div class="exercise">
        ${exs.length > 1 ? `<div class="ex-num">Problem ${i + 1}</div>` : ""}
        <div class="prose ex-prompt">${renderMarkdown(ex.prompt || "")}</div>
        ${ex.sql ? `<button class="btn primary ex-open" data-i="${i}">⌘ Open starter in the SQL Playground →</button>` : ""}
        <div class="ex-actions">
          ${ex.hint ? `<button class="btn ghost ex-hint-btn" data-i="${i}">💡 Show hint</button>` : ""}
          ${ex.solution ? `<button class="btn ghost ex-sol-btn" data-i="${i}">✓ Show solution</button>` : ""}
        </div>
        ${ex.hint ? `<div class="ex-reveal" id="ex-hint-${i}" hidden><div class="prose">${renderMarkdown(ex.hint)}</div></div>` : ""}
        ${ex.solution ? `<div class="ex-reveal" id="ex-sol-${i}" hidden><div class="prose">${renderMarkdown(ex.solution)}</div></div>` : ""}
      </div>`).join("")}`;

  html += `<div id="deep"></div>`;

  if (l.quiz && l.quiz.length) html += `
      <div class="section-label">Check yourself</div>
      <div id="quiz-area"></div>`;

  html += `<div id="interview"></div>`;

  html += `
      <div class="lesson-footer">
        <button class="btn ${isDone ? "good" : "primary"}" id="complete" ${isDone ? "disabled" : ""}>${isDone ? "✓ Completed" : "Mark as complete"}</button>
        <button class="btn ghost" id="cheat">📋 ${l._track.title} cheat sheet</button>
        <span class="spacer"></span>
        ${prev ? `<button class="btn ghost" id="prev">← ${prev.title.slice(0, 22)}</button>` : ""}
        ${next ? `<button class="btn ghost" id="nextl">${next.title.slice(0, 22)} →</button>` : ""}
      </div>
    </article>`;
  $("#content").innerHTML = html;
  { const _c = document.getElementById("content"); if (_c) _c.scrollTop = 0; window.scrollTo(0, 0); }

  if (l.tryit) $("#tryit").addEventListener("click", () => { location.hash = "#/sql"; sessionStorage.setItem("dfa-sql", l.tryit); });
  exs.forEach((ex, i) => {
    if (ex.sql) $(`.ex-open[data-i="${i}"]`)?.addEventListener("click", () => { location.hash = "#/sql"; sessionStorage.setItem("dfa-sql", ex.sql); });
    $(`.ex-hint-btn[data-i="${i}"]`)?.addEventListener("click", (e) => { const h = $(`#ex-hint-${i}`); h.hidden = !h.hidden; e.target.textContent = h.hidden ? "💡 Show hint" : "💡 Hide hint"; });
    $(`.ex-sol-btn[data-i="${i}"]`)?.addEventListener("click", (e) => { const s = $(`#ex-sol-${i}`); s.hidden = !s.hidden; e.target.textContent = s.hidden ? "✓ Show solution" : "✓ Hide solution"; });
  });
  $("#complete")?.addEventListener("click", (e) => markComplete(id, e.target));
  $("#prev")?.addEventListener("click", () => location.hash = `#/lesson/${prev.id}`);
  $("#nextl")?.addEventListener("click", () => location.hash = `#/lesson/${next.id}`);
  if (l.quiz) renderQuiz(l.quiz, $("#quiz-area"));

  // optional deep-dive markdown
  try {
    const _dr = await fetch(`content/lessons/${id}.md`);
    const deep = { markdown: _dr.ok ? await _dr.text() : "" };
    if (deep.markdown) $("#deep").innerHTML = `<div class="section-label">Go deeper</div><div class="prose">${renderMarkdown(deep.markdown)}</div>`;
  } catch {}

  $("#cheat")?.addEventListener("click", () => location.hash = `#/cheat/${l._track.id}`);

  // interview questions — asked at top companies (Google, Amazon, Goldman, …)
  try {
    const iv = { questions: (await loadInterview())[id] || [] };
    if (iv.questions && iv.questions.length) {
      const items = iv.questions.map((it, i) => `
        <div class="iv">
          <button class="iv-q" data-i="${i}" aria-expanded="false">
            <span class="iv-head">${it.company ? `<span class="iv-co">${it.company}</span>` : ""}${it.level ? `<span class="iv-lvl lvl-${String(it.level).toLowerCase()}">${it.level}</span>` : ""}</span>
            <span class="iv-qt">${mdInline(it.q)}</span>
            <span class="iv-caret">▸</span>
          </button>
          <div class="iv-a" id="iv-a-${i}" hidden><div class="prose">${renderMarkdown(it.a)}</div></div>
        </div>`).join("");
      $("#interview").innerHTML = `
        <div class="section-label">💼 Interview questions <span class="iv-sub">— asked at top companies</span></div>
        <div class="iv-list">${items}</div>`;
      $$("#interview .iv-q").forEach(btn => btn.addEventListener("click", () => {
        const a = $(`#iv-a-${btn.dataset.i}`);
        a.hidden = !a.hidden;
        btn.classList.toggle("open", !a.hidden);
        btn.setAttribute("aria-expanded", String(!a.hidden));
        $(".iv-caret", btn).textContent = a.hidden ? "▸" : "▾";
      }));
    }
  } catch {}
}

let _INTERVIEW = null;
async function loadInterview() {
  if (_INTERVIEW) return _INTERVIEW;
  try {
    const r = await fetch("content/interview.json");
    _INTERVIEW = r.ok ? await r.json() : {};
  } catch { _INTERVIEW = {}; }
  return _INTERVIEW;
}

function renderCheatsheet(trackId) {
  const track = CURRICULUM.tracks.find(t => t.id === trackId);
  syncSidebarActive(null);
  const firstLesson = track ? track.modules[0].lessons[0].id : null;
  $("#content").innerHTML = `
    <article class="lesson">
      <div class="crumbs">📋 <b>${track ? track.title : "Cheat sheet"}</b> · quick reference</div>
      <div id="cs-body" class="prose">Loading…</div>
      <div class="lesson-footer">${firstLesson ? `<button class="btn ghost" id="cs-back">← Back to ${track.title}</button>` : ""}</div>
    </article>`;
  { const _c = document.getElementById("content"); if (_c) _c.scrollTop = 0; window.scrollTo(0, 0); }
  $("#cs-back")?.addEventListener("click", () => location.hash = `#/lesson/${firstLesson}`);
  fetch(`content/cheatsheets/${trackId}.md`).then(r => r.ok ? r.text() : "").then(md => {
    $("#cs-body").innerHTML = md ? renderMarkdown(md) : "<p>Cheat sheet coming soon for this track.</p>";
  }).catch(() => { $("#cs-body").innerHTML = "<p>Cheat sheet unavailable.</p>"; });
}

function renderQuiz(quiz, mount) {
  mount.innerHTML = quiz.map((q, qi) => `
    <div class="quiz" data-qi="${qi}">
      <div class="quiz-q">${qi + 1}. ${mdInline(q.q)}</div>
      ${q.options.map((o, oi) => `<button class="quiz-opt" data-oi="${oi}">${mdInline(o)}</button>`).join("")}
      <div class="quiz-explain"></div>
    </div>`).join("");
  $$(".quiz", mount).forEach((qEl, qi) => {
    const q = quiz[qi];
    $$(".quiz-opt", qEl).forEach(opt => opt.addEventListener("click", () => {
      const oi = +opt.dataset.oi;
      $$(".quiz-opt", qEl).forEach(b => b.disabled = true);
      const expl = $(".quiz-explain", qEl);
      if (oi === q.answer) {
        opt.classList.add("correct");
        expl.className = "quiz-explain ok show"; expl.innerHTML = "✓ Correct. " + mdInline(q.explain || "");
      } else {
        opt.classList.add("wrong");
        $$(".quiz-opt", qEl)[q.answer].classList.add("correct");
        expl.className = "quiz-explain no show"; expl.innerHTML = "Not quite. " + mdInline(q.explain || "");
      }
    }));
  });
}

/* ---------------- SQL playground ---------------- */
async function renderPlayground() {
  syncSidebarActive(null);
  let schema = { tables: [], starter: "" };
  try { schema = window.DFA_SQL.schema(); } catch {}
  const initial = sessionStorage.getItem("dfa-sql") || schema.starter || "";
  sessionStorage.removeItem("dfa-sql");
  $("#content").innerHTML = `
    <div class="playground">
      <h1>⌘ SQL Playground</h1>
      <p class="lesson-summary">Write real SQL and run it instantly against a sample shop database. Nothing can break — each run uses a fresh copy.</p>
      <div class="pg-grid">
        <div class="pg-editor">
          <textarea id="sql" spellcheck="false">${esc(initial)}</textarea>
          <div class="pg-run">
            <button class="btn primary" id="run-sql">▶ Run query</button>
            <span class="result-meta" id="run-meta"></span>
          </div>
          <div class="pg-results" id="results"></div>
        </div>
        <div class="pg-schema">
          <h4>Sample tables</h4>
          ${schema.tables.map(t => `<div class="pg-table"><div class="tname">${t.table}</div><div class="tcols">${t.columns.join(", ")}</div></div>`).join("")}
          <h4 style="margin-top:14px">Ideas</h4>
          <div class="tcols" style="line-height:1.7">Top customers by spend · orders per month · products never ordered · revenue by category</div>
        </div>
      </div>
    </div>`;
  { const _c = document.getElementById("content"); if (_c) _c.scrollTop = 0; window.scrollTo(0, 0); }
  $("#run-sql").addEventListener("click", runSql);
  $("#sql").addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") runSql(); });
}
async function runSql() {
  const query = $("#sql").value;
  const meta = $("#run-meta"), out = $("#results");
  meta.textContent = "Running…";
  let res;
  try { res = await window.DFA_SQL.run(query); }
  catch (e) { meta.textContent = ""; out.innerHTML = `<div class="result-error">${esc(String(e.message || e))}</div>`; return; }
  if (!res.ok) { meta.textContent = ""; out.innerHTML = `<div class="result-error">${esc(res.error)}</div>`; return; }
  meta.textContent = `${res.rows.length} row${res.rows.length === 1 ? "" : "s"}${res.truncated ? " (showing first 200)" : ""}`;
  if (!res.rows.length) { out.innerHTML = `<div class="result-meta">Query ran — no rows returned.</div>`; return; }
  out.innerHTML = `<table class="result-table"><thead><tr>${res.columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${res.rows.map(r => `<tr>${r.map(v => `<td>${v === null ? "<span style='opacity:.5'>NULL</span>" : esc(String(v))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

/* ---------------- chrome: theme, search, AI drawer ---------------- */
function wireChrome() {
  $("#btn-theme").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    $("#btn-theme").textContent = next === "dark" ? "☾" : "☀";
  });
  $("#btn-theme").textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "☾" : "☀";
  $("#btn-sql").addEventListener("click", () => location.hash = "#/sql");

  // search
  const search = $("#search");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    if (!q) { buildSidebar(); return; }
    const matches = LESSONS.filter(l => (l.title + " " + (l.summary || "")).toLowerCase().includes(q));
    $("#content").innerHTML = `<div class="home"><h1 style="font-size:24px">Search: "${esc(q)}"</h1>
      <div class="track-grid">${matches.map(l => `<div class="track-card" data-go="${l.id}">
        <div class="tc-icon">${l._track.icon}</div><h3>${l.title}</h3><p>${l.summary || ""}</p>
        <div class="tc-meta">${l._track.title}</div></div>`).join("") || "<p class='empty'>No lessons matched.</p>"}</div></div>`;
    $$(".track-card").forEach(c => c.addEventListener("click", () => { search.value = ""; buildSidebar(); location.hash = `#/lesson/${c.dataset.go}`; }));
  });

  // AI drawer
  const drawer = $("#ai-drawer"), scrim = $("#ai-scrim");
  const open = () => { drawer.classList.add("show"); scrim.classList.add("show"); if (!$("#ai-messages").children.length) aiBot("Hi! I'm your AI mentor. Ask me anything about data engineering and I'll point you to the most relevant lesson and explain it in plain English with examples — all from the course content, right here in your browser."); };
  const close = () => { drawer.classList.remove("show"); scrim.classList.remove("show"); };
  $("#btn-ai").addEventListener("click", open);
  $("#ai-close").addEventListener("click", close);
  scrim.addEventListener("click", close);
  $("#ai-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inp = $("#ai-question"); const q = inp.value.trim(); if (!q) return;
    aiUser(q); inp.value = "";
    const m = location.hash.match(/#\/lesson\/(.+)$/); const lesson_id = m ? m[1] : "";
    const pending = aiBot("…", true);
    try {
      const reply = window.DFA_MENTOR.answer(q, lesson_id, CURRICULUM);
      pending.innerHTML = renderMarkdown(reply || "I'm not sure how to answer that.");
    } catch { pending.textContent = "Something went wrong answering that — try rephrasing."; }
    $("#ai-messages").scrollTop = 1e9;
  });
}
function aiUser(t) { const d = document.createElement("div"); d.className = "ai-msg user"; d.textContent = t; $("#ai-messages").appendChild(d); $("#ai-messages").scrollTop = 1e9; }
function aiBot(t, pending) { const d = document.createElement("div"); d.className = "ai-msg bot" + (pending ? " pending" : ""); if (pending) d.textContent = t; else d.innerHTML = renderMarkdown(t); $("#ai-messages").appendChild(d); $("#ai-messages").scrollTop = 1e9; return d; }

window.addEventListener("hashchange", route);
boot();
