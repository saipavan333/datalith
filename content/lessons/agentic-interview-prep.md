# Agentic AI interview prep & cheat sheet

Agentic AI is now fair game in senior data-engineering interviews — especially design rounds ("design an LLM/agentic
pipeline"). This is your one-page review.

## Must-know definitions

- **Agent** = LLM + tools + memory + planning, run in a **reason → act → observe** loop (**ReAct**).
- **Agent vs workflow vs chatbot** — agent *decides* steps at runtime and acts via tools; workflow is fixed; chatbot
  doesn't act.
- **Tools** = **function calling** (typed name/description/args). **Memory** = short-term (context) + long-term
  (**vector** store).

## Protocols (2026)

- **MCP** — agent ↔ tool/data standard. Created by **Anthropic → Linux Foundation**; backed by OpenAI/Google/MS/AWS.
  Primitives: **Tools / Resources / Prompts**; client-server over JSON-RPC. *Write one server, any MCP agent uses it.*
- **A2A** — agent ↔ agent delegation via **Agent Cards** (Google Cloud + partners).
- **MCP vertical, A2A horizontal — use together.**

## Frameworks (choose by constraint)

LangGraph (control/stateful) · Claude Agent SDK (Anthropic-native production) · CrewAI (fast multi-agent) · AutoGen/AG2
(conversational) · LlamaIndex (RAG data) · Pydantic AI (type-safe) · Semantic Kernel (.NET).

## Patterns

- **Multi-agent** = orchestrator + specialists (ingest/transform/quality/repair); delegate via A2A, act via MCP.
- **Self-healing pipeline** = detect → diagnose (logs+lineage) → fix (safe) / escalate (HITL).
- **Text-to-SQL** = plan → generate → **validate** (dry-run/cost/tests) → execute → return result + SQL.
- **Data-quality agents** = validate / enforce contracts / quarantine / route.

## Governance (the senior signal)

Agents can be **confidently wrong** → corruption propagates downstream. Bound with **least-privilege permissions,
validation, cost limits, HITL**, plus **evals** and production **monitoring**. Pipelines feeding AI need a higher bar.
The human role: **set policy, design guardrails, own edge cases.**

## Likely questions (and where to find answers)

| Question | Key answer |
|---|---|
| What is MCP and why does it matter? | open agent↔tool standard; one server, any agent; Tools/Resources/Prompts |
| MCP vs A2A? | vertical (tools) vs horizontal (agents); use together |
| Design a self-healing pipeline | detect→diagnose(logs+lineage)→fix safe / escalate; intent layer; guardrails |
| Stop a text-to-SQL agent corrupting data? | validate before execute; show SQL; gate writes with HITL |
| Multi-agent vs single agent? | specialists for focus/evals; single tool-rich agent for simple tasks |
| Make an agentic pipeline safe? | least privilege, validation, cost limits, HITL, evals, monitoring |

## 60-second reset

```
Agent?      → LLM + tools + memory + planning; reason→act→observe (ReAct)
MCP vs A2A? → MCP = agent↔tool (vertical); A2A = agent↔agent (horizontal)
Frameworks? → control=LangGraph, Anthropic=Claude SDK, velocity=CrewAI
DE uses?    → self-healing pipelines, text-to-SQL, quality agents
Safety?     → guardrails + validation + cost limits + HITL + evals
```

You can define agents, the 2026 protocols, the frameworks, the DE patterns, and — most importantly — how to make them
**safe**. That last part is what senior interviewers are really probing.
