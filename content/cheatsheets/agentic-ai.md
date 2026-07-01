# Agentic AI for Data Engineers — quick reference

The 2026 agentic stack, distilled.

## Core

**Agent** = LLM + **tools** + **memory** + **planning**, run in a **reason → act → observe** loop (**ReAct**).
**Agent vs workflow vs chatbot:** agent decides steps at runtime & acts via tools; workflow is fixed; chatbot doesn't act.
**Tools** = function calling (typed name/description/args). **Memory** = short-term (context) + long-term (vector/RAG).

## Protocols (2026)

| | MCP | A2A |
|---|---|---|
| Direction | **vertical** (agent ↔ tool/data) | **horizontal** (agent ↔ agent) |
| Purpose | give an agent tools | delegate to specialist agents |
| Primitives / discovery | Tools · Resources · Prompts | Agent Cards |
| Origin | Anthropic → Linux Foundation | Google Cloud + partners |

**Use both:** orchestrator delegates via A2A; specialists act via MCP. *Write one MCP server → any agent uses it.*

## Frameworks (pick by constraint)

control → **LangGraph** · Anthropic-native → **Claude Agent SDK** · velocity → **CrewAI** · conversational →
**AutoGen/AG2** · RAG data → **LlamaIndex** · type-safe → **Pydantic AI** · .NET → **Semantic Kernel**.

## Patterns

- **Multi-agent:** orchestrator + specialists (ingest/transform/quality/repair).
- **Self-healing pipeline:** detect (nulls/drift/freshness/volume) → diagnose (logs+lineage) → fix safe / escalate (HITL).
- **Text-to-SQL:** plan → generate → **validate** (dry-run/cost/tests) → execute → return result + SQL.
- **Data-quality agents:** validate · enforce contracts · quarantine · route.

## Governance (the senior signal)

Agents can be **confidently wrong** → corruption propagates. Bound with **least privilege · validation · cost/rate
limits · HITL**, plus **evals** + **monitoring/tracing**. Pipelines feeding AI need a higher bar. Human role: **set
policy, design guardrails, own edge cases** — orchestrate the fleet, stay accountable.

## One-liners for interviews

- *MCP?* open agent↔tool standard; one server, any agent; Tools/Resources/Prompts.
- *MCP vs A2A?* vertical (tools) vs horizontal (agents); use together.
- *Safe text-to-SQL?* validate before execute, show the SQL, gate writes (HITL).
- *Safe agentic pipeline?* least privilege + validation + cost limits + HITL + evals + monitoring.
