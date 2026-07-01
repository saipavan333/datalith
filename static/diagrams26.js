/* Datalith — diagram pack 26 (Agentic AI for Data Engineers). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* agent-loop */
  D["agent-loop"] = (() => {
    let b = t(320, 20, "What an agent is — the reason → act → observe loop", { bold: true });
    b += box(16, 92, 84, 44, { r: 9, fill: C.box, stroke: C.boxS }) + t(58, 112, "Goal", { bold: true, size: 10 }) + t(58, 127, "task", { size: 8, fill: C.dim });
    b += arrowR(100, 114, 126);
    // three loop nodes
    b += box(128, 92, 130, 44, { r: 9, fill: C.acc, stroke: C.accS }) + t(193, 110, "1 · Reason", { bold: true, size: 10.5, fill: C.accT }) + t(193, 126, "(LLM plans next step)", { size: 7.6, fill: C.dim });
    b += arrowR(258, 114, 290);
    b += box(292, 92, 130, 44, { r: 9, fill: C.acc, stroke: C.accS }) + t(357, 110, "2 · Act", { bold: true, size: 10.5, fill: C.accT }) + t(357, 126, "(call a tool)", { size: 7.6, fill: C.dim });
    b += arrowR(422, 114, 454);
    b += box(456, 92, 130, 44, { r: 9, fill: C.acc, stroke: C.accS }) + t(521, 110, "3 · Observe", { bold: true, size: 10.5, fill: C.accT }) + t(521, 126, "(read result)", { size: 7.6, fill: C.dim });
    // loop back Observe -> Reason
    b += ln(521, 136, 521, 162, { stroke: C.warn }) + ln(521, 162, 193, 162, { stroke: C.warn }) + arrowU(193, 162, 138, { stroke: C.warn });
    b += t(357, 176, "repeat until the goal is met", { size: 8.5, fill: C.warn });
    // tools + memory
    b += box(292, 196, 130, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(357, 217, "Tools: DB·API·code", { size: 8.6, fill: C.goodT, bold: true }) + arrowU(357, 196, 138, { stroke: C.goodS });
    b += box(128, 196, 130, 34, { r: 8, fill: C.box, stroke: C.boxS }) + t(193, 217, "Memory (ctx+vector)", { size: 8.3, fill: C.tx }) + arrowU(193, 196, 138);
    b += arrowR(586, 114, 612) + t(599, 104, "done", { size: 7.5, fill: C.dim });
    return svg(244, b, "Agent reason-act-observe loop");
  })();

  /* agent-anatomy */
  D["agent-anatomy"] = (() => {
    let b = t(320, 20, "Anatomy of an agent — the four parts", { bold: true });
    b += box(220, 46, 200, 56, { r: 12, fill: C.acc, stroke: C.accS }) + t(320, 70, "LLM", { bold: true, size: 13, fill: C.accT }) + t(320, 88, "reasoning core", { size: 9, fill: C.dim });
    const parts = [
      ["Tools", "act on the world: query DB, call API, run code", C.good, C.goodS, C.goodT, 24, 150],
      ["Memory", "short-term context + long-term vector recall", C.box, C.boxS, C.tx, 340, 150],
      ["Planning", "decompose the goal into ordered steps", C.warnFill, C.warn, C.warn, 24, 214],
      ["Loop", "reason → act → observe until done", C.box, C.boxS, C.tx, 340, 214]
    ];
    parts.forEach(p => {
      b += box(p[5], p[6], 276, 50, { r: 9, fill: p[2], stroke: p[3] });
      b += t(p[5] + 138, p[6] + 20, p[0], { bold: true, size: 11, fill: p[4] });
      b += t(p[5] + 138, p[6] + 38, p[1], { size: 8.4, fill: C.dim });
    });
    b += arrowD(150, 102, 148) + arrowD(478, 102, 148);
    b += t(320, 286, "agent = LLM + tools + memory + planning, run in a loop", { size: 9.5, fill: C.dim });
    return svg(300, b, "Anatomy of an agent");
  })();

  /* mcp-architecture */
  D["mcp-architecture"] = (() => {
    let b = t(320, 20, "MCP — one protocol, agent ↔ tools", { bold: true });
    b += box(40, 48, 180, 70, { r: 10, fill: C.acc, stroke: C.accS }) + t(130, 70, "Host (the agent)", { bold: true, size: 11, fill: C.accT }) + t(130, 90, "opens an MCP client", { size: 8.5, fill: C.dim }) + t(130, 105, "per server (JSON-RPC)", { size: 8.5, fill: C.dim });
    b += arrowR(220, 83, 256, { stroke: C.accS }) + t(238, 74, "MCP", { size: 8, fill: C.accT });
    b += box(258, 40, 150, 86, { r: 10, fill: C.warnFill, stroke: C.warn }) + t(333, 60, "MCP server", { bold: true, size: 11, fill: C.warn });
    ["Tools — functions", "Resources — data", "Prompts — templates"].forEach((s, i) => b += t(333, 80 + i * 15, "• " + s, { size: 8.4, fill: C.dim }));
    b += arrowR(408, 83, 444);
    b += box(446, 44, 168, 82, { r: 10, fill: C.good, stroke: C.goodS }) + t(530, 62, "Your data & tools", { bold: true, size: 10, fill: C.goodT });
    ["Postgres · warehouse", "REST APIs · SaaS", "files · object storage"].forEach((s, i) => b += t(530, 82 + i * 15, s, { size: 8.2, fill: C.dim }));
    b += t(320, 150, "created by Anthropic · now Linux Foundation · backed by OpenAI, Google, Microsoft, AWS", { size: 9, fill: C.dim });
    b += t(320, 168, "build one MCP server for a data source → every MCP-aware agent can use it", { size: 9, fill: C.warn });
    return svg(186, b, "MCP architecture");
  })();

  /* mcp-vs-a2a */
  D["mcp-vs-a2a"] = (() => {
    let b = t(320, 20, "MCP vs A2A — two complementary layers", { bold: true });
    // MCP vertical
    b += box(30, 48, 270, 150, { r: 12, fill: C.card, stroke: C.accS, sw: 2 });
    b += t(165, 68, "MCP — vertical (agent ↔ tool)", { bold: true, size: 10.5, fill: C.accT });
    b += box(95, 80, 140, 30, { r: 8, fill: C.acc, stroke: C.accS }) + t(165, 99, "Agent", { bold: true, size: 10, fill: C.accT });
    b += arrowD(165, 110, 134, { stroke: C.accS });
    b += box(95, 136, 140, 30, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(165, 155, "MCP server", { size: 9.5, fill: C.warn });
    b += box(95, 172, 140, 22, { r: 6, fill: C.good, stroke: C.goodS }) + t(165, 187, "DB · API · files", { size: 8.2, fill: C.goodT }) + arrowD(165, 166, 170, { stroke: C.goodS });
    // A2A horizontal
    b += box(340, 48, 270, 150, { r: 12, fill: C.card, stroke: C.goodS, sw: 2 });
    b += t(475, 68, "A2A — horizontal (agent ↔ agent)", { bold: true, size: 10.5, fill: C.goodT });
    b += box(360, 110, 100, 34, { r: 8, fill: C.acc, stroke: C.accS }) + t(410, 131, "Planner", { bold: true, size: 9.5, fill: C.accT });
    b += box(490, 95, 100, 30, { r: 8, fill: C.box, stroke: C.boxS }) + t(540, 114, "Specialist A", { size: 8.6 });
    b += box(490, 135, 100, 30, { r: 8, fill: C.box, stroke: C.boxS }) + t(540, 154, "Specialist B", { size: 8.6 });
    b += arrowR(460, 110, 488, { stroke: C.goodS }) + arrowR(460, 150, 488, { stroke: C.goodS });
    b += t(475, 184, "Agent Cards · delegate subtasks", { size: 8, fill: C.dim });
    b += t(320, 218, "MCP gives an agent tools; A2A lets agents delegate to each other — use both together", { size: 9.2, fill: C.dim });
    return svg(232, b, "MCP vs A2A");
  })();

  /* agent-frameworks-map */
  D["agent-frameworks-map"] = (() => {
    let b = t(320, 20, "Agent frameworks (2026) — pick by your constraint", { bold: true });
    const fw = [
      ["LangGraph", "control · stateful graphs, retries, HITL"],
      ["Claude Agent SDK", "Anthropic-native production: tools, MCP, skills"],
      ["CrewAI", "team velocity · role-based multi-agent, fast"],
      ["AutoGen / AG2", "conversational agent teams (GroupChat)"],
      ["LlamaIndex agents", "RAG-grounded retrieval over your data"],
      ["Pydantic AI", "type-safe Python agents"]
    ];
    fw.forEach((f, i) => {
      const x = 24 + (i % 2) * 304, y = 46 + Math.floor(i / 2) * 56;
      b += box(x, y, 288, 46, { r: 9, fill: i % 2 ? C.box : C.acc, stroke: i % 2 ? C.boxS : C.accS });
      b += t(x + 14, y + 20, f[0], { bold: true, size: 10.5, a: "start", fill: i % 2 ? C.tx : C.accT });
      b += t(x + 14, y + 36, f[1], { size: 8.2, a: "start", fill: C.dim });
    });
    b += t(320, 232, "start from the dominant constraint: control · Anthropic-native · velocity · conversation · data · type-safety", { size: 9, fill: C.dim });
    return svg(248, b, "Agent frameworks map");
  })();

  /* multi-agent-orchestration */
  D["multi-agent-orchestration"] = (() => {
    let b = t(320, 20, "Multi-agent orchestration — a fleet for the pipeline", { bold: true });
    b += box(230, 44, 180, 44, { r: 10, fill: C.warnFill, stroke: C.warn }) + t(320, 64, "Orchestrator", { bold: true, size: 11, fill: C.warn }) + t(320, 80, "plans & coordinates", { size: 8.2, fill: C.dim });
    const sp = [["Ingestion", 24], ["Transform", 188], ["Data quality", 352], ["Repair", 516]];
    sp.forEach(s => {
      b += box(s[1], 132, 124, 44, { r: 9, fill: C.acc, stroke: C.accS });
      b += t(s[1] + 62, 152, s[0] + " agent", { bold: true, size: 9.5, fill: C.accT });
      b += t(s[1] + 62, 168, "specialist", { size: 7.8, fill: C.dim });
      b += arrowD(s[1] + 62, 88, 130);
    });
    b += t(320, 104, "delegates subtasks (A2A) ↓", { size: 8.2, fill: C.dim });
    b += box(24, 196, 616, 30, { r: 8, fill: C.good, stroke: C.goodS }) + t(320, 215, "each specialist uses MCP tools over your data (DB · lake · APIs)", { size: 9, fill: C.goodT, bold: true });
    [86, 250, 414, 578].forEach(x => b += arrowD(x, 176, 194, { stroke: C.goodS }));
    return svg(240, b, "Multi-agent orchestration");
  })();

  /* self-healing-pipeline */
  D["self-healing-pipeline"] = (() => {
    let b = t(320, 20, "Self-healing pipeline — detect → diagnose → fix", { bold: true });
    const p = [["Ingest", 40], ["Transform", 250], ["Serve", 460]];
    p.forEach((s, i) => {
      b += box(s[1], 48, 140, 34, { r: 8, fill: C.acc, stroke: C.accS }) + t(s[1] + 70, 69, s[0], { bold: true, size: 10.5, fill: C.accT });
      if (i < 2) b += arrowR(s[1] + 140, 65, p[i + 1][1]);
    });
    [110, 320, 530].forEach(x => b += arrowU(x, 98, 84));
    b += box(28, 100, 584, 46, { r: 10, fill: C.warnFill, stroke: C.warn });
    b += t(320, 119, "Agent watches: null floods · schema drift · freshness · volume", { size: 9.3, fill: C.warn, bold: true });
    b += t(320, 136, "diagnoses root cause from logs + lineage", { size: 8.4, fill: C.dim });
    b += arrowD(200, 146, 168) + arrowD(440, 146, 168);
    b += box(60, 172, 250, 40, { r: 9, fill: C.good, stroke: C.goodS }) + t(185, 190, "Auto-fix (safe)", { bold: true, size: 10, fill: C.goodT }) + t(185, 205, "retry · backfill · cast · quarantine", { size: 8, fill: C.dim });
    b += box(340, 172, 250, 40, { r: 9, fill: C.bad, stroke: C.badS }) + t(465, 190, "Escalate to human (HITL)", { bold: true, size: 9.5, fill: C.badT }) + t(465, 205, "ambiguous / risky changes", { size: 8, fill: C.dim });
    return svg(226, b, "Self-healing pipeline");
  })();

  /* text-to-sql-agent */
  D["text-to-sql-agent"] = (() => {
    let b = t(320, 20, "Text-to-SQL agent — NL question → trusted answer", { bold: true });
    const steps = [
      ["Question", "\"top regions by Q2 revenue?\""],
      ["Plan + schema", "read catalog / table metadata"],
      ["Generate SQL", "LLM writes the query"],
      ["Validate", "dry-run · check cost · tests"],
      ["Execute + answer", "run, return result + the SQL"]
    ];
    steps.forEach((s, i) => {
      const y = 46 + i * 36;
      b += box(60, y, 520, 28, { r: 7, fill: i % 2 ? C.box : C.acc, stroke: i % 2 ? C.boxS : C.accS });
      b += t(180, y + 18, s[0], { bold: true, size: 9.8, fill: i % 2 ? C.tx : C.accT });
      b += t(420, y + 18, s[1], { size: 8.6, fill: C.dim });
      if (i < 4) b += arrowD(320, y + 28, y + 36);
    });
    b += t(320, 244, "guardrail: validate before execute — confidently-wrong SQL corrupts every downstream system", { size: 8.8, fill: C.warn });
    return svg(258, b, "Text to SQL agent");
  })();

  /* agent-guardrails */
  D["agent-guardrails"] = (() => {
    let b = t(320, 20, "Guardrails, evaluation & governance", { bold: true });
    b += box(250, 44, 140, 42, { r: 10, fill: C.acc, stroke: C.accS }) + t(320, 64, "Agent", { bold: true, size: 11, fill: C.accT }) + t(320, 80, "proposes an action", { size: 8, fill: C.dim });
    b += arrowD(320, 86, 104);
    b += box(120, 106, 400, 40, { r: 10, fill: C.warnFill, stroke: C.warn }) + t(320, 124, "Guardrails", { bold: true, size: 10.5, fill: C.warn }) + t(320, 140, "permissions · validation · cost limits · evals (is it correct?)", { size: 8.4, fill: C.dim });
    // pass / hold
    b += ln(220, 146, 220, 168, { stroke: C.goodS }) + arrowD(220, 168, 172, { stroke: C.goodS });
    b += box(60, 174, 300, 38, { r: 9, fill: C.good, stroke: C.goodS }) + t(210, 192, "Safe + confident → execute", { bold: true, size: 9.6, fill: C.goodT }) + t(210, 206, "log · monitor · audit", { size: 8, fill: C.dim });
    b += ln(420, 146, 420, 168, { stroke: C.badS }) + arrowD(420, 168, 172, { stroke: C.badS });
    b += box(372, 174, 250, 38, { r: 9, fill: C.bad, stroke: C.badS }) + t(497, 192, "Risky / low-confidence", { bold: true, size: 9.5, fill: C.badT }) + t(497, 206, "→ human-in-the-loop", { size: 8, fill: C.dim });
    b += t(320, 232, "agents can be confidently wrong · pipelines feeding AI need a higher quality bar · you set the policy", { size: 8.8, fill: C.dim });
    return svg(246, b, "Agent guardrails and governance");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
