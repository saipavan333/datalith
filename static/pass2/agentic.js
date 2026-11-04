/* Datalith pass 2 — Track 23: Agentic AI for data engineering. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- agentic-what */
  const LOOP = [["think", "\"orders table is late; check the load job\"", "vio"], ["act", "call tool: get_job_status('load_orders')", "acc"], ["observe", "status=FAILED, error: quota exceeded", "warn"], ["think", "\"retry in the off-peak slot, then tell the owner\"", "vio"], ["act", "call tools: reschedule(), post_message()", "acc"], ["done", "goal met: loaded at 06:40, owner told", "good"]];
  P["agentic-what"] = {
    simple: [
      "A chatbot answers once. An **agent** works towards a goal: a large language model (LLM) decides what to do next, calls a **tool** (run a query, read a log, open a ticket), looks at the result, and repeats until the goal is met or it gives up.",
      "That loop is often called **reason, act, observe**. The tools are what make it useful: an LLM alone can only produce text.",
      "Agents suit tasks with many uncertain steps, like investigating why a table is late. For fixed, predictable steps, a normal pipeline is cheaper and safer.",
    ],
    analogy: {
      text: "Think of a new engineer on call, following a runbook with a laptop.",
      left: "On-call engineer", right: "Agent",
      map: [
        ["Reading the alert and deciding where to look", "LLM reasoning"],
        ["Running a command or opening a dashboard", "Tool call"],
        ["Reading the output", "Observation"],
        ["Repeating until fixed or escalated", "The loop and its stop condition"],
        ["What their access allows", "Tool permissions"],
      ],
      breaks: "an engineer stops when something feels wrong. An agent only stops on the limits you set (max steps, budget, required approvals), so those limits are part of the design.",
    },
    svg: () => P["agentic-what"]._fig(5),
    _fig: k => {
      let b = t(240, 20, "Goal: \"the orders dashboard is stale, fix it\"", { bold: true, size: 13 });
      LOOP.slice(0, k + 1).forEach(([s, d, kind], i) => {
        const y = 34 + i * 38;
        b += box(16, y, 80, 30, s, null, kind, { size: 12 });
        b += t(106, y + 20, d, { a: "start", size: 11, fill: C.tx, max: 360 });
        if (i < k) b += arrow(56, y + 30, 56, y + 38, { sw: 1.2 });
      });
      return svg(480, 34 + 6 * 38 + 6, b, "Steps of an agent's reason-act-observe loop");
    },
    caption: "The agent alternates thinking and tool calls, using each result to choose the next step.",
    ix: el => slider(el, { label: "Step", min: 1, max: 6, value: 2 }, v => ({ svg: P["agentic-what"]._fig(v - 1), note: ["The LLM picks a first move from the goal.", "It can only act through tools it was given.", "The result feeds the next decision.", "A new plan based on what it learned.", "Several tool calls in one step are common.", "Stopped because the goal was met; a step or cost limit would also stop it."][v - 1] })),
    oneline: "An agent is an LLM that repeatedly decides, uses a tool, checks the result, and stops at the goal.",
  };

  /* ---------------------------------------------------------------- agentic-anatomy */
  P["agentic-anatomy"] = {
    simple: [
      "Every agent has four parts. The **LLM** reasons and decides. **Tools** let it act: each tool is described by a name, a description and an input schema, and the LLM asks to call it (function calling). **Memory** keeps what matters: the current conversation (short-term) and stored facts or past runs (long-term, often in a database or vector store). **Planning** breaks a goal into steps.",
      "The code around the LLM, often called the **harness**, actually runs the tools, enforces permissions and limits, and feeds results back.",
      "Most agent failures come from vague tool descriptions or tools that return too much text, not from the LLM itself.",
    ],
    analogy: {
      text: "Think of a chef in a kitchen.",
      left: "Kitchen", right: "Agent part",
      map: [
        ["The chef's judgement", "LLM reasoning"],
        ["Knives, oven, phone to suppliers", "Tools"],
        ["Today's order tickets", "Short-term memory (context)"],
        ["The recipe book and notes from last week", "Long-term memory"],
        ["Planning the order of dishes", "Planning"],
      ],
      breaks: "a chef can pick up any knife. An agent only knows a tool by its written description, so a badly described tool is used wrongly or never.",
    },
    svg: () => {
      let b = t(240, 22, "Agent = LLM + tools + memory + planning, inside a harness", { bold: true, size: 12.5 });
      b += `<rect x="16" y="36" width="448" height="200" rx="12" style="fill:none;stroke:${C.boxS};stroke-dasharray:5 4"/>`;
      b += t(30, 54, "harness: runs tools, enforces limits", { a: "start", size: 11.5, fill: C.dim });
      b += box(170, 100, 140, 60, "LLM", "decides next step", "vio");
      b += box(30, 70, 120, 50, "tools", "SQL, logs, tickets", "acc", { size2: 11 });
      b += box(30, 160, 120, 50, "memory", "context + store", "warn", { size2: 11 });
      b += box(330, 70, 120, 50, "planning", "goal -> steps", "good", { size2: 11 });
      b += box(330, 160, 120, 50, "limits", "steps, cost, approvals", "bad", { size2: 10 });
      b += arrow(168, 118, 152, 100);
      b += arrow(168, 145, 152, 178); b += arrow(312, 118, 328, 100); b += arrow(312, 145, 328, 178);
      return svg(480, 250, b, "Parts of an agent inside its harness");
    },
    caption: "The LLM decides; the harness around it runs tools, stores memory and enforces limits.",
    oneline: "An agent is an LLM plus tools to act, memory to remember, and planning to break down goals.",
  };

  /* ---------------------------------------------------------------- agentic-mcp */
  P["agentic-mcp"] = {
    simple: [
      "Every agent app used to write its own connector for every tool. **MCP** (Model Context Protocol) is an open standard for connecting AI apps to tools and data, so one connector works with many apps.",
      "An **MCP server** wraps a system (a database, GitHub, a file store) and exposes its **tools** (actions), **resources** (readable data) and **prompts**. An **MCP client** inside the AI app discovers them and calls them for the model.",
      "Anthropic introduced MCP in 2024 and it is now an open standard governed under the Linux Foundation. Treat MCP servers like any code with access to your data: review them and give them least privilege.",
    ],
    analogy: {
      text: "Think of USB ports.",
      left: "USB", right: "MCP",
      map: [
        ["One port shape for keyboards, drives, cameras", "One protocol for many tools"],
        ["The device plugged in", "An MCP server"],
        ["The laptop's port and driver", "The MCP client in the AI app"],
        ["The device saying what it can do", "Tool discovery"],
      ],
      breaks: "a USB keyboard can't read your files. An MCP server can do whatever its code and credentials allow, so a malicious or over-privileged server is a real security risk.",
    },
    svg: () => {
      let b = t(240, 22, "One protocol between AI apps and tools", { bold: true, size: 14 });
      [["Claude app", 40], ["IDE agent", 100], ["your agent", 160]].forEach(([n, y]) => { b += box(16, y, 120, 40, n, "MCP client", "vio", { size: 12, size2: 10 }); });
      [["BigQuery server", 40], ["GitHub server", 100], ["files server", 160]].forEach(([n, y]) => { b += box(344, y, 120, 40, n, "tools, resources", "acc", { size: 11.5, size2: 10 }); });
      [60, 120, 180].forEach(a => [60, 120, 180].forEach(z => { b += line(138, a, 342, z, { stroke: C.line, sw: 0.8 }); }));
      b += box(190, 104, 100, 32, "MCP", null, "good", { size: 13 });
      b += t(240, 226, "N apps x M tools, but each side is written once.", { size: 12, fill: C.dim });
      return svg(480, 242, b, "MCP clients in AI apps connecting to MCP servers for tools");
    },
    caption: "Any MCP client can use any MCP server, so connectors are written once instead of per app.",
    oneline: "MCP is a shared plug standard that lets any AI app use any tool server.",
  };

  /* ---------------------------------------------------------------- agentic-a2a */
  P["agentic-a2a"] = {
    simple: [
      "MCP connects one agent **down** to its tools. **A2A** (Agent2Agent, an open protocol started by Google in 2025) connects agents **sideways**, so one agent can hand a task to another agent, possibly built by a different team or vendor.",
      "Each A2A agent publishes an **agent card** describing its skills. A client agent sends it a task, and the remote agent works on it and returns results, with status updates for long jobs.",
      "In practice: MCP for tools and data, A2A for delegating to other agents.",
    ],
    analogy: {
      text: "Think of a manager, their tools, and other departments.",
      left: "Office", right: "Protocols",
      map: [
        ["Your laptop, phone and files", "Tools via MCP"],
        ["Asking the legal team to review a contract", "Delegating via A2A"],
        ["The legal team's page on the intranet", "Agent card"],
        ["\"Still reviewing, done by Friday\"", "Task status updates"],
      ],
      breaks: "departments share one company's rules. Agents from different vendors may not, so authentication, data sharing limits and trust must be set up explicitly.",
    },
    svg: () => {
      let b = t(240, 22, "Vertical (MCP) vs horizontal (A2A)", { bold: true, size: 14 });
      b += box(170, 46, 140, 44, "orchestrator agent", null, "vio", { size: 12.5 });
      b += box(16, 50, 120, 36, "quality agent", null, "acc", { size: 12 }); b += box(344, 50, 120, 36, "cost agent", null, "acc", { size: 12 });
      b += arrow(168, 68, 138, 68, { label: "A2A" }); b += arrow(312, 68, 342, 68, { label: "A2A" });
      [["warehouse", 110], ["tickets", 240]].forEach(([n, x]) => { b += box(x, 150, 120, 36, n, "MCP server", "plain", { size: 12, size2: 10 }); });
      b += arrow(220, 92, 170, 148, { label: "MCP", dx: -20 }); b += arrow(260, 92, 300, 148, { label: "MCP", dx: 20 });
      b += t(240, 218, "Agents delegate to agents; each agent reaches tools through MCP.", { size: 12, fill: C.dim });
      return svg(480, 234, b, "A2A between agents and MCP from an agent to tools");
    },
    caption: "A2A runs between peer agents; MCP runs from an agent down to its tools.",
    oneline: "A2A lets agents hand work to other agents, while MCP connects each agent to its tools.",
  };

  /* ---------------------------------------------------------------- agentic-frameworks */
  P["agentic-frameworks"] = {
    simple: [
      "Agent frameworks handle the loop, tool calling, memory and multi-step control for you.",
      "Roughly: **LangGraph** models agents as explicit graphs of steps with saved state, good for controlled workflows. The **Claude Agent SDK** gives the same harness as Claude Code (tools, file access, subagents). **CrewAI** organises role-based crews. **AutoGen / AG2** focus on multi-agent conversations. **LlamaIndex** is strongest at data and retrieval. **Pydantic AI** brings typed, validated outputs.",
      "Pick by how much control you need, which models you use, and how the framework handles state, tracing and human approval. Many production teams start with a plain loop and add a framework when it earns its place.",
    ],
    analogy: {
      text: "Think of kits for building a robot.",
      left: "Robot kits", right: "Frameworks",
      map: [
        ["A kit with a fixed track the robot follows", "Graph-based (LangGraph)"],
        ["A kit that comes with a full toolbox", "Batteries-included harness (Agent SDK)"],
        ["A kit for robot teams with roles", "Crews (CrewAI)"],
        ["A kit specialised for reading and fetching", "Retrieval focus (LlamaIndex)"],
        ["Building from loose parts", "A hand-written loop"],
      ],
      breaks: "robot kits stay the same once bought. Agent frameworks change fast, with breaking releases; pin versions and keep your business logic outside framework-specific code.",
    },
    svg: () => {
      let b = t(240, 22, "Choosing by control vs convenience", { bold: true, size: 14 });
      b += line(30, 200, 450, 200); b += t(240, 222, "more built in ->", { size: 11.5, fill: C.dim });
      b += line(30, 200, 30, 40); b += t(36, 50, "more explicit control", { a: "start", size: 11.5, fill: C.dim });
      [["plain loop", 70, 70, "plain"], ["LangGraph", 160, 90, "acc"], ["Pydantic AI", 210, 130, "vio"], ["Agent SDK", 320, 120, "good"], ["CrewAI", 380, 170, "warn"], ["LlamaIndex", 270, 165, "acc"]].forEach(([n, x, y, k]) => { b += box(x - 48, y - 14, 96, 28, n, null, k, { size: 11.5 }); });
      return svg(480, 236, b, "Agent frameworks placed by control versus built-in features");
    },
    caption: "A rough map only: frameworks overlap and change quickly, so test them on your own use case.",
    oneline: "Agent frameworks package the loop, tools and state; choose by how much control you need.",
  };

  /* ---------------------------------------------------------------- agentic-multi-agent */
  P["agentic-multi-agent"] = {
    simple: [
      "One agent with fifty tools gets confused. **Multi-agent** systems split the work: an **orchestrator** agent breaks the goal down and hands parts to **specialist** agents, each with a few focused tools and instructions.",
      "For a data platform, specialists might handle ingestion, transformation, quality checks and reporting. The orchestrator collects their results and decides what's next.",
      "More agents mean more cost, latency and ways to fail. Use them when tasks are truly separable, and keep clear hand-offs and shared state.",
    ],
    analogy: {
      text: "Think of a film crew.",
      left: "Film crew", right: "Multi-agent system",
      map: [
        ["The director", "Orchestrator agent"],
        ["Camera, sound, lighting teams", "Specialist agents"],
        ["Each team's own equipment", "Each agent's own tools"],
        ["The shooting script everyone follows", "Shared state and hand-off format"],
      ],
      breaks: "film crews talk constantly. Agents only share what is passed explicitly; if the orchestrator's summary drops a detail, the specialist never knows it existed.",
    },
    svg: () => {
      let b = t(240, 22, "Orchestrator with specialist agents", { bold: true, size: 14 });
      b += box(160, 40, 160, 44, "orchestrator", "plans, delegates, checks", "vio", { size2: 10.5 });
      [["ingestion", "connectors"], ["transform", "dbt, SQL"], ["quality", "tests, contracts"], ["reporting", "BI, alerts"]].forEach(([n, s], i) => { const x = 12 + i * 118; b += arrow(240, 86, x + 53, 128, { sw: 1.2 }); b += box(x, 130, 106, 50, n, s, "acc", { size: 12, size2: 10 }); });
      b += t(240, 210, "Each specialist has a few tools; results flow back up.", { size: 12, fill: C.dim });
      return svg(480, 226, b, "Orchestrator agent delegating to four specialist agents");
    },
    caption: "The orchestrator splits the goal; specialists do focused work with their own small toolsets.",
    oneline: "Multi-agent systems split a big job among focused specialist agents led by an orchestrator.",
  };

  /* ---------------------------------------------------------------- agentic-pipelines */
  P["agentic-pipelines"] = {
    simple: [
      "A **self-healing pipeline** uses an agent to respond to failures: detect the problem, diagnose the likely cause from logs and lineage, propose or apply a fix, and verify the result.",
      "Safe fixes (retrying a flaky task, rerunning a partition) can be automatic. Risky ones (changing code, deleting data, altering schemas) should produce a proposed change for a human to approve.",
      "Every action is logged, so the on-call engineer can see exactly what the agent did and why.",
    ],
    analogy: {
      text: "Think of a car that detects a flat tyre.",
      left: "Smart car", right: "Self-healing pipeline",
      map: [
        ["Tyre pressure warning", "Detect: test or freshness failure"],
        ["Checking which tyre and why", "Diagnose from logs and lineage"],
        ["Auto-inflating a slow leak", "Automatic safe fix (retry, rerun)"],
        ["Asking you before calling a tow truck", "Human approval for risky fixes"],
        ["The trip log of what happened", "Audit trail"],
      ],
      breaks: "a car's sensors measure physics directly. An agent's diagnosis is a guess from text; it can be confidently wrong, which is why it must verify a fix worked rather than assume it.",
    },
    svg: () => {
      let b = t(240, 22, "Detect -> diagnose -> fix -> verify", { bold: true, size: 14 });
      [["detect", "freshness alert", "warn"], ["diagnose", "logs + lineage", "vio"], ["fix", "retry partition", "acc"], ["verify", "tests pass", "good"]].forEach(([a, z, k], i) => { const x = 12 + i * 118; b += box(x, 44, 106, 52, a, z, k, { size2: 10.5 }); if (i < 3) b += arrow(x + 108, 70, x + 116, 70, { sw: 1.4 }); });
      b += box(130, 124, 220, 44, "risky fix? open a PR for a human", null, "bad", { size: 12 });
      b += arrow(300, 98, 260, 122, { dash: true });
      b += t(240, 196, "Every step written to an audit log.", { size: 12, fill: C.dim });
      return svg(480, 212, b, "Self-healing loop with a human approval branch");
    },
    caption: "Safe fixes run automatically and are verified; risky ones become a proposal for a person.",
    oneline: "A self-healing pipeline lets an agent find and fix routine failures, asking a human before risky changes.",
  };

  /* ---------------------------------------------------------------- agentic-text-to-sql */
  const T2S = [["schema-aware prompt", "uses real table and column names", "acc"], ["syntax + dry run", "parses; dry run estimates bytes", "vio"], ["policy checks", "read-only, row limits, allowed tables", "warn"], ["result checks", "row count sane, answer cited", "good"]];
  P["agentic-text-to-sql"] = {
    simple: [
      "**Text-to-SQL** agents turn a question like \"revenue by city last quarter\" into SQL, run it, and explain the answer. Warehouse vendors now ship these (for example Databricks Genie and Snowflake Cortex Analyst).",
      "Accuracy depends mostly on context: table and column descriptions, a semantic layer with agreed metric definitions, and example queries. Without them the model guesses joins and meanings.",
      "Wrap the agent in checks: generate against the real schema, validate the SQL with a dry run, enforce read-only access and cost limits, and show the SQL so a person can verify it.",
    ],
    analogy: {
      text: "Think of a translator at a business meeting.",
      left: "Translator", right: "Text-to-SQL",
      map: [
        ["Knowing the company's own vocabulary", "Schema and semantic layer"],
        ["Checking grammar before speaking", "Parse and dry run"],
        ["Not repeating confidential remarks", "Access and policy checks"],
        ["Showing the written translation", "Showing the SQL"],
      ],
      breaks: "a translator who misunderstands usually sounds unsure. A wrong SQL query returns a confident, well-formatted wrong number, so validation and showing the SQL matter more than fluency.",
    },
    svg: () => P["agentic-text-to-sql"]._fig(3),
    _fig: k => {
      let b = t(240, 20, "\"Revenue by city last quarter\" -> checked SQL", { bold: true, size: 13 });
      T2S.forEach(([a, z, kind], i) => { const y = 34 + i * 48, on = i <= k; b += badge(30, y + 21, i + 1, on ? kind : "acc"); b += box(52, y, 412, 42, a, z, on ? kind : "ghost", { size: 12, size2: 10.5 }); });
      b += box(52, 230, 412, 30, k === 3 ? "answer shown with its SQL" : "later checks off: the errors they catch get through", null, k === 3 ? "good" : "warn", { size: 11.5 });
      return svg(480, 272, b, "Validation layers around a text-to-SQL agent");
    },
    caption: "Each layer catches a different kind of mistake before an answer reaches the user.",
    ix: el => choice(el, { label: "Checks enabled up to", options: T2S.map(x => x[0]), value: 0 }, i => ({ svg: P["agentic-text-to-sql"]._fig(i), note: ["Catches invented table names, but not logic errors.", "Catches broken SQL and runaway scans before they cost money.", "Stops writes, PII leaks and queries on tables the user can't see.", "Catches obviously wrong answers, and lets the user check the logic."][i] })),
    oneline: "Text-to-SQL agents write queries from questions, and need schema context and checks to be trustworthy.",
  };

  /* ---------------------------------------------------------------- agentic-data-quality */
  P["agentic-data-quality"] = {
    simple: [
      "Data quality agents watch tables continuously. They run checks and contracts, notice anomalies (a sudden drop in rows, a new null pattern), and quarantine bad records.",
      "Their edge over fixed rules is triage: reading the failing rows, the recent code changes and the lineage, then writing a short explanation of the likely cause and who should fix it.",
      "Keep the hard rules deterministic (contracts, tests); use the agent to explain, prioritise and suggest, not to decide on its own what counts as valid.",
    ],
    analogy: {
      text: "Think of a quality inspector with a clipboard and good instincts.",
      left: "Factory inspector", right: "Quality agent",
      map: [
        ["The written spec sheet", "Contracts and tests (deterministic)"],
        ["Pulling faulty items off the line", "Quarantine"],
        ["\"These all came from machine 3 since Tuesday\"", "Root-cause explanation"],
        ["Telling the right supervisor", "Routing to the owner"],
      ],
      breaks: "an inspector learns over years. An agent may explain the same failure differently each time, so its explanations are hints for humans, not facts to act on blindly.",
    },
    svg: () => {
      let b = t(240, 22, "Rules decide; the agent explains", { bold: true, size: 14 });
      b += box(16, 44, 130, 50, "contract + tests", "pass / fail", "acc", { size2: 11 });
      b += arrow(148, 69, 176, 69, { label: "fail" });
      b += box(180, 44, 130, 50, "quarantine", "1,240 rows", "bad", { size2: 11 });
      b += arrow(312, 69, 340, 69);
      b += box(344, 44, 120, 50, "agent triage", "reads rows, lineage", "vio", { size2: 10 });
      b += box(16, 120, 448, 60, "\"Nulls in city since 02:10, all from the app v5.2 events.", "Likely cause: new client release. Owner: mobile-team.\"", "plain", { size: 11.5, size2: 11.5 });
      b += arrow(404, 96, 404, 118);
      return svg(480, 194, b, "Deterministic checks with an agent explaining failures");
    },
    caption: "Deterministic checks catch the bad rows; the agent writes the likely cause and routes it.",
    oneline: "Quality agents watch data with fixed rules and explain failures so the right people can fix them.",
  };

  /* ---------------------------------------------------------------- agentic-governance */
  const PERM = [["read-only", ["query data", "read logs"], ["rerun job", "change code", "delete data"]], ["operator", ["query data", "read logs", "rerun job"], ["change code", "delete data"]], ["contributor", ["query data", "read logs", "rerun job", "open PR"], ["delete data"]]];
  P["agentic-governance"] = {
    simple: [
      "Agents act, so they need the same controls as people, and more. Give each agent its own identity with **least-privilege** permissions: only the tools and data its job needs.",
      "Add **guardrails**: validate tool inputs and outputs, cap steps and spend, block dangerous actions, and require **human approval** for anything irreversible.",
      "Test agents with **evals**: a fixed set of tasks with known good outcomes, run on every change to prompts, tools or models. Log every action for audit.",
    ],
    analogy: {
      text: "Think of a new intern's access badge.",
      left: "Intern", right: "Agent governance",
      map: [
        ["Badge opens only some doors", "Least-privilege tools and data"],
        ["A spending limit on the company card", "Step and cost caps"],
        ["\"Ask before you send anything to a client\"", "Human approval for risky actions"],
        ["A practice task with a known answer", "Evals"],
        ["Signing in and out", "Audit log"],
      ],
      breaks: "an intern can't be tricked by a sticky note on a document. An agent can: text inside data or web pages can contain instructions (prompt injection), so treat everything the agent reads as untrusted.",
    },
    svg: () => P["agentic-governance"]._fig(0),
    _fig: i => {
      const [role, ok, no] = PERM[i];
      let b = t(240, 20, "Agent role: " + role, { bold: true, size: 14 });
      const all = ["query data", "read logs", "rerun job", "open PR", "change code", "delete data"];
      all.forEach((a, j) => {
        const x = 16 + (j % 3) * 152, y = 40 + Math.floor(j / 3) * 52, allowed = ok.includes(a);
        b += box(x, y, 140, 42, a, allowed ? "allowed" : (a === "delete data" || a === "change code") ? "needs human approval" : "blocked", allowed ? "good" : "bad", { size: 12.5, size2: 10 });
      });
      b += box(16, 156, 448, 34, "Always: step cap, cost cap, audit log, untrusted-input handling", null, "plain", { size: 11.5 });
      return svg(480, 204, b, "Actions an agent may take under a permission level");
    },
    caption: "Permissions decide which tools an agent may call; irreversible actions always go to a human.",
    ix: el => choice(el, { label: "Role", options: PERM.map(p => p[0]), value: 1 }, i => ({ svg: P["agentic-governance"]._fig(i), note: ["Safe for investigation and answering questions.", "Can fix routine failures by rerunning jobs.", "Can propose code changes as pull requests; a human still merges."][i] })),
    oneline: "Give agents the smallest permissions that work, cap what they can spend, and keep a human on risky actions.",
  };

  /* ---------------------------------------------------------------- agentic-interview-prep */
  P["agentic-interview-prep"] = {
    simple: [
      "This page collects the agentic AI track for revision.",
      "Expect: what makes something an agent, the reason-act-observe loop, tools and function calling, memory, MCP vs A2A, multi-agent trade-offs, self-healing pipelines, text-to-SQL accuracy, and guardrails and evals.",
      "Interviewers value judgement: when not to use an agent, and how you would make one safe and measurable.",
    ],
    analogy: {
      text: "Think of hiring a contractor for your house.",
      left: "Contractor", right: "Agent design",
      map: [
        ["What job, and is a contractor needed at all?", "Agent or plain pipeline?"],
        ["Which tools they bring", "Tool design"],
        ["Which rooms they may enter", "Permissions"],
        ["Checking the work before paying", "Evals and verification"],
      ],
      breaks: "a contractor has a licence and reviews. Agents have no track record until you build one with evals and logs, which is why measurement comes up in every good answer.",
    },
    svg: () => {
      let b = t(240, 22, "Agent design answer, in order", { bold: true, size: 14 });
      [["1", "is an agent needed? or a pipeline", "acc"], ["2", "tools: few, well described", "vio"], ["3", "memory and state", "warn"], ["4", "guardrails, permissions, approvals", "bad"], ["5", "evals, logs, cost tracking", "good"]].forEach(([n, s, k], i) => { const y = 38 + i * 42; b += badge(36, y + 17, n, k); b += box(58, y, 406, 34, s, null, k, { size: 12.5 }); });
      return svg(480, 258, b, "Five-step agent design answer");
    },
    caption: "Justify the agent first, then its tools, state, safety and how you'll measure it.",
    oneline: "Know how agents loop, use tools, stay safe and get measured, and when a plain pipeline is better.",
  };
})();
