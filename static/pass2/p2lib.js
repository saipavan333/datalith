/* ===================== Datalith — pass 2 "easier + visual" layer =====================
   Shared by every pass-2 track pack (static/pass2/<track>.js).

   A pack registers lessons like this:
     P2["sql-select"] = {
       simple:  "markdown: 3-6 short plain-English sentences",
       analogy: { text: "markdown", map: [["everyday part", "real part"], ...], breaks: "where it stops working" },
       svg:     P2L.svg(...)  // or a function returning an SVG string
       caption: "one line under the picture",
       ix:      function (el) { ... }   // optional interactive, drawn into el
       oneline: "the one-sentence recap a kid could repeat"
     };

   app.js calls P2R.top(...) right after the lesson summary, P2R.bottom(...) before the
   footer, and P2R.mount(...) after the page is in the DOM. Diagrams use the same fixed
   dark "figure card" palette as static/diagrams.js, so they read the same in light and
   dark themes. Text inside boxes carries data-max (the box's inner width) so a script
   can prove no label spills out of its box. */
window.P2 = window.P2 || {};

window.P2L = (function () {
  const C = {
    card: "#161b26", tx: "#e8edf5", dim: "#aab4c4", faint: "#7d8899",
    box: "#222a38", boxS: "#3b4760",
    acc: "#27406e", accS: "#5b9bff", accT: "#9cc0ff",
    good: "#173d31", goodS: "#36c98a", goodT: "#6fe0b0",
    bad: "#3d1d22", badS: "#ff6b6b", badT: "#ff9a9a",
    warn: "#3a3320", warnS: "#f5b850", warnT: "#ffd27f",
    vio: "#2e2552", vioS: "#9b7bff", vioT: "#c4b2ff",
    line: "#8a97aa",
  };
  const KIND = {
    acc: [C.acc, C.accS, C.accT], good: [C.good, C.goodS, C.goodT], bad: [C.bad, C.badS, C.badT],
    warn: [C.warn, C.warnS, C.warnT], vio: [C.vio, C.vioS, C.vioT], plain: [C.box, C.boxS, C.tx],
    ghost: ["none", C.boxS, C.dim],
  };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const M = "font-family:'JetBrains Mono',ui-monospace,Menlo,monospace";
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let uid = 0;

  /* text: o.a anchor, o.size, o.bold, o.fill, o.mono, o.max (max width in px for the checker) */
  const t = (x, y, s, o = {}) =>
    `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}"${o.max ? ` data-max="${o.max}"` : ""} style="fill:${o.fill || C.tx};font-size:${o.size || 15}px;font-weight:${o.bold ? 700 : 400};${o.mono ? M : F}">${esc(s)}</text>`;

  /* box with up to two centred lines of text. kind: acc|good|bad|warn|vio|plain|ghost */
  const box = (x, y, w, h, l1, l2, kind = "plain", o = {}) => {
    const [fill, stroke, tc] = KIND[kind] || KIND.plain;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 8}" style="fill:${fill};stroke:${stroke};stroke-width:${o.sw || 1.6}${o.dash ? ";stroke-dasharray:5 4" : ""}"/>`;
    const cx = x + w / 2, max = w - 10;
    if (l1 != null && l2 != null) {
      s += t(cx, y + h / 2 - 3, l1, { bold: true, fill: tc, size: o.size || 14.5, max, mono: o.mono });
      s += t(cx, y + h / 2 + 15, l2, { fill: C.dim, size: o.size2 || 12.5, max, mono: o.mono2 });
    } else if (l1 != null) {
      s += t(cx, y + h / 2 + 5, l1, { bold: o.bold !== false, fill: tc, size: o.size || 14.5, max, mono: o.mono });
    }
    return s;
  };

  /* arrow from (x1,y1) to (x2,y2), head at the end. o.label sits at the midpoint. */
  const arrow = (x1, y1, x2, y2, o = {}) => {
    const col = o.stroke || C.line, a = Math.atan2(y2 - y1, x2 - x1), hl = 9, hw = 5;
    const bx = x2 - hl * Math.cos(a), by = y2 - hl * Math.sin(a);
    const p1 = `${(bx + hw * Math.sin(a)).toFixed(1)},${(by - hw * Math.cos(a)).toFixed(1)}`;
    const p2 = `${(bx - hw * Math.sin(a)).toFixed(1)},${(by + hw * Math.cos(a)).toFixed(1)}`;
    let s = `<line x1="${x1}" y1="${y1}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" style="stroke:${col};stroke-width:${o.sw || 1.8}${o.dash ? ";stroke-dasharray:5 4" : ""}"/>`;
    s += `<polygon points="${x2},${y2} ${p1} ${p2}" style="fill:${col}"/>`;
    if (o.label) {
      const mx = (x1 + x2) / 2 + (o.dx || 0), my = (y1 + y2) / 2 + (o.dy ?? -7);
      s += t(mx, my, o.label, { size: o.size || 12.5, fill: o.lfill || C.dim, a: o.a });
    }
    return s;
  };
  const line = (x1, y1, x2, y2, o = {}) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke || C.line};stroke-width:${o.sw || 1.6}${o.dash ? ";stroke-dasharray:5 4" : ""}"/>`;

  /* little data table. cols: header strings; rows: arrays; o.cw: column widths; o.hl: {rowIndex: kind};
     o.title: caption above; o.strike: {rowIndex:true} draws a line through the row */
  const table = (x, y, cols, rows, o = {}) => {
    const rh = o.rh || 26, cw = o.cw || cols.map(() => 80), W = cw.reduce((a, b) => a + b, 0);
    let s = "";
    if (o.title) s += t(x + W / 2, y - 9, o.title, { bold: true, size: o.tsize || 14, fill: o.tfill || C.tx });
    s += `<rect x="${x}" y="${y}" width="${W}" height="${rh}" rx="4" style="fill:${o.hfill || "#2b3446"};stroke:${C.boxS};stroke-width:1.2"/>`;
    let cx = x;
    cols.forEach((c, i) => { s += t(cx + cw[i] / 2, y + rh / 2 + 5, c, { bold: true, size: o.size || 13, max: cw[i] - 6, mono: o.monoHead }); cx += cw[i]; });
    rows.forEach((r, ri) => {
      const ry = y + rh * (ri + 1), k = o.hl && o.hl[ri];
      const [fill, stroke, tc] = k ? KIND[k] : [ri % 2 ? "#1c2230" : "#1f2634", C.boxS, C.tx];
      s += `<rect x="${x}" y="${ry}" width="${W}" height="${rh}" style="fill:${fill};stroke:${stroke};stroke-width:${k ? 1.4 : 0.8}"/>`;
      let cx2 = x;
      r.forEach((v, i) => {
        const isNull = v === null;
        s += t(cx2 + cw[i] / 2, ry + rh / 2 + 5, isNull ? "NULL" : v, { size: o.size || 13.5, fill: isNull ? C.faint : (k ? tc : C.tx), max: cw[i] - 6, mono: o.mono !== false });
        cx2 += cw[i];
      });
      if (o.strike && o.strike[ri]) s += line(x + 4, ry + rh / 2, x + W - 4, ry + rh / 2, { stroke: C.badS, sw: 2 });
    });
    return s;
  };
  const tableW = (o) => (o.cw || []).reduce((a, b) => a + b, 0);

  /* numbered step badge */
  const badge = (x, y, n, kind = "acc") => {
    const [fill, stroke, tc] = KIND[kind];
    return `<circle cx="${x}" cy="${y}" r="12" style="fill:${fill};stroke:${stroke};stroke-width:1.6"/>` + t(x, y + 5, String(n), { bold: true, size: 13, fill: tc });
  };

  const svg = (w, h, body, label) =>
    `<svg viewBox="0 0 ${w} ${h}" class="dfa-diagram p2-svg" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${w}" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;

  /* ---------- interactive helpers ---------- */
  /* slider(el, {label, min, max, step, value, fmt}, draw)  — draw(value) returns {svg, note} or an svg string */
  function slider(el, cfg, draw) {
    const id = "p2s" + (++uid);
    el.innerHTML = `<div class="p2-ctl"><label for="${id}">${esc(cfg.label)}</label>
      <input type="range" id="${id}" min="${cfg.min}" max="${cfg.max}" step="${cfg.step || 1}" value="${cfg.value}">
      <output class="p2-val"></output></div><div class="p2-ixfig"></div><div class="p2-note"></div>`;
    const inp = el.querySelector("input"), out = el.querySelector("output"), fig = el.querySelector(".p2-ixfig"), note = el.querySelector(".p2-note");
    const upd = () => {
      const v = Number(inp.value); out.textContent = cfg.fmt ? cfg.fmt(v) : String(v);
      const r = draw(v); fig.innerHTML = typeof r === "string" ? r : r.svg; note.innerHTML = (r && r.note) ? r.note : "";
    };
    inp.addEventListener("input", upd); upd();
  }
  /* choice(el, {label, options:[...], value}, draw) — a row of toggle buttons */
  function choice(el, cfg, draw) {
    el.innerHTML = `<div class="p2-ctl"><span class="p2-lbl">${esc(cfg.label)}</span><span class="p2-btns">${cfg.options.map((o, i) => `<button type="button" class="p2-btn" data-i="${i}">${esc(o)}</button>`).join("")}</span></div><div class="p2-ixfig"></div><div class="p2-note"></div>`;
    const fig = el.querySelector(".p2-ixfig"), note = el.querySelector(".p2-note"), btns = [...el.querySelectorAll(".p2-btn")];
    const pick = i => {
      btns.forEach((b, j) => { b.classList.toggle("on", i === j); b.setAttribute("aria-pressed", String(i === j)); });
      const r = draw(i, cfg.options[i]); fig.innerHTML = typeof r === "string" ? r : r.svg; note.innerHTML = (r && r.note) ? r.note : "";
    };
    btns.forEach((b, i) => b.addEventListener("click", () => pick(i)));
    pick(cfg.value || 0);
  }

  return { C, KIND, esc, t, box, arrow, line, table, tableW, badge, svg, slider, choice };
})();

/* ---------- renderer used by app.js ---------- */
window.P2R = {
  get(id) { return (window.P2 || {})[id] || null; },
  top(P, md, inl) {
    const a = P.analogy || {};
    const svg = typeof P.svg === "function" ? P.svg() : P.svg;
    const simple = Array.isArray(P.simple) ? P.simple.join("\n\n") : (P.simple || "");
    let h = `<div class="p2-start">
      <div class="section-label">Start here</div>
      <div class="prose p2-simple">${md(simple)}</div>`;
    if (a.text) h += `
      <div class="p2-analogy">
        <div class="p2-analogy-h">Picture it like this</div>
        <div class="prose">${md(a.text)}</div>
        ${a.map && a.map.length ? `<table class="p2-map"><thead><tr><th>${inl(a.left || "In the picture")}</th><th>${inl(a.right || "In the real thing")}</th></tr></thead><tbody>${a.map.map(r => `<tr><td>${inl(r[0])}</td><td>${inl(r[1])}</td></tr>`).join("")}</tbody></table>` : ""}
        ${a.breaks ? `<p class="p2-breaks"><b>Where the picture breaks:</b> ${inl(a.breaks)}</p>` : ""}
      </div>`;
    if (svg) h += `
      <div class="section-label">See how it works</div>
      <figure class="diagram p2-fig">${svg}${P.caption ? `<figcaption>${inl(P.caption)}</figcaption>` : ""}</figure>`;
    if (P.ix) h += `
      <div class="section-label">Play with it</div>
      <div class="p2-ix" id="p2-ix" data-lesson="1"></div>`;
    return h + `</div>`;
  },
  bottom(P, inl) {
    return P.oneline ? `<div class="p2-oneline"><span class="p2-oneline-h">In one line</span> ${inl(P.oneline)}</div>` : "";
  },
  mount(P, root) {
    if (!P) return;
    const el = P.ix ? root.querySelector("#p2-ix") : null;
    if (el) P.ix(el);
    const start = root.querySelector(".p2-start");
    if (!start) return;
    P2LEG.all(start);
    // an interactive redraws its picture on every control change: re-check its labels
    if (el && window.MutationObserver) {
      let queued = false;
      new MutationObserver(() => {
        if (queued) return;
        queued = true;
        // next frame, or 100 ms if frames are throttled (a hidden tab or pane)
        let done = false;
        const go = () => { if (done) return; done = true; queued = false; P2LEG.all(el); };
        requestAnimationFrame(go); setTimeout(go, 100);
      }).observe(el, { childList: true, subtree: true, characterData: true });
    }
  },
};

/* ---------- phone legibility (pass-2 review follow-up) ----------
   A diagram drawn 480-640 units wide shrinks on a 390 px phone and its labels can fall
   under 9 px. For each pass-2 SVG: if a label would render under FLOOR px, raise the small
   labels to FLOOR in place, but only when that moves no label out of its box, past its
   data-max width, onto another label or out of the picture. If it would, keep the drawing
   as drawn and let it scroll sideways at the width where its smallest label is FLOOR px,
   with a "swipe sideways" cue. Re-runs when an interactive redraws and on resize.
   Same approach as the Gradient Descent course (gd-legible.js) and SparkQuest (widgets.js). */
window.P2LEG = (function () {
  const FLOOR = 9;
  const restore = t => {
    if (t.dataset.fs0 == null) return;
    t.style.fontSize = t.dataset.fs0;
    delete t.dataset.fs0;
  };
  const bb = e => { try { return e.getBBox(); } catch (x) { return { x: 0, y: 0, width: 0, height: 0 }; } };
  const len = t => { try { return t.getComputedTextLength(); } catch (x) { return 0; } };
  function legible(svg) {
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (!vb || !vb.width) return;
    const texts = [...svg.querySelectorAll("text")].filter(t => t.textContent.trim());
    texts.forEach(restore);
    const p = svg.parentNode;
    const wrap = p && p.classList && p.classList.contains("p2-scroll") ? p : null;
    if (wrap) { svg.style.minWidth = ""; wrap.classList.remove("p2-scrolling"); wrap.removeAttribute("tabindex"); wrap.removeAttribute("role"); wrap.removeAttribute("aria-label"); }
    const w = svg.getBoundingClientRect().width;
    if (!w || !texts.length) return;
    const need = FLOOR / (w / vb.width);
    const fs = t => parseFloat(getComputedStyle(t).fontSize);
    const small = texts.filter(t => fs(t) < need - 0.01);
    if (!small.length) return;
    const rects = [...svg.querySelectorAll("rect")].map(bb).filter(b => b.width > 4 && b.height > 4 && !(b.width >= vb.width - 1 && b.height >= vb.height - 1));
    // "inside" keeps a 1.5-unit gap to the box edge, so a grown label never touches its border
    const inside = (a, r) => a.x >= r.x + 1.5 && a.y >= r.y - 0.5 && a.x + a.width <= r.x + r.width - 1.5 && a.y + a.height <= r.y + r.height + 0.5;
    const hit = (a, b) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;
    // how far a label pokes out of the picture (0 when inside)
    const over = b => Math.max(0, vb.x - b.x, b.x + b.width - vb.x - vb.width, vb.y - b.y, b.y + b.height - vb.y - vb.height);
    const spills = (t, l) => t.dataset.max && l > Number(t.dataset.max) + 0.5;
    const b0 = texts.map(bb), l0 = texts.map(len);
    small.forEach(t => { t.dataset.fs0 = t.style.fontSize || ""; t.style.fontSize = need.toFixed(2) + "px"; });
    const b1 = texts.map(bb), l1 = texts.map(len);
    let bad = false;
    for (let i = 0; i < texts.length && !bad; i++) {
      if (over(b1[i]) > Math.max(over(b0[i]), 0.25) + 0.05) bad = true;
      if (spills(texts[i], l1[i]) && !spills(texts[i], l0[i])) bad = true;
      for (let k = 0; k < rects.length && !bad; k++) if (inside(b0[i], rects[k]) && !inside(b1[i], rects[k])) bad = true;
      for (let j = i + 1; j < texts.length && !bad; j++) if (hit(b1[i], b1[j]) && !hit(b0[i], b0[j])) bad = true;
    }
    if (!bad) return;
    // bigger labels would collide or spill: undo, and let the drawing scroll sideways instead
    small.forEach(restore);
    const minFs = Math.min(...texts.map(fs));
    let box = wrap;
    if (!box) {
      box = document.createElement("div");
      box.className = "p2-scroll";
      p.insertBefore(box, svg);
      box.appendChild(svg);
    }
    box.classList.add("p2-scrolling");
    box.setAttribute("tabindex", "0");
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Diagram, scrolls sideways");
    svg.style.minWidth = Math.ceil((vb.width * FLOOR) / minFs) + "px";
  }
  const all = scope => { if (scope) scope.querySelectorAll("svg.p2-svg[viewBox]").forEach(legible); };
  let timer = 0;
  const later = ms => { clearTimeout(timer); timer = setTimeout(() => all(document.querySelector(".p2-start")), ms); };
  window.addEventListener("resize", () => later(150));
  // label widths change when the web fonts (Inter, JetBrains Mono) arrive: re-check then,
  // or a label grown against the fallback font's width can spill its box
  if (document.fonts) {
    document.fonts.addEventListener("loadingdone", () => later(30));
    document.fonts.ready.then(() => later(30));
  }
  return { FLOOR, legible, all };
})();
