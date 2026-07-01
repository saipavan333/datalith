# Agent frameworks compared (2026) — deep dive

You rarely build the agent loop from scratch — you pick a **framework** that structures the four parts (LLM, tools,
memory, planning) for you. Here's the 2026 production-ready set, chosen by your **dominant constraint**.

@@diagram:agent-frameworks-map

## The contenders

**LangGraph — control.** Models the agent as a **state machine**: nodes, edges, and a shared state schema, with
retries, **human-in-the-loop**, and time-travel debugging. Best for complex, stateful, auditable workflows where you
need to know and control exactly what happens.

**Claude Agent SDK — Anthropic-native production.** First-class **tool use, hooks, MCP, skills, and subagents**. The
smoothest path to production-grade Claude agents; great when you're all-in on Anthropic and MCP.

**CrewAI — team velocity.** Define **roles** and **tasks**, assign them, and ship a multi-agent prototype fast.
Intuitive abstractions; added **A2A** support. Best when speed to a working multi-agent system matters most.

**AutoGen / AG2 — conversation.** **Conversational** agent teams; AG2's **GroupChat** uses a selector to decide who
speaks next. Strong for research, brainstorming, and debate-style multi-agent.

**LlamaIndex agents — data.** RAG-grounded retrieval agents over **your** documents and data. Best when the core job is
retrieval-grounded answering over a corpus.

**Pydantic AI — type safety.** Type-safe, Pythonic agents with validation built in — good for teams that want strict
typing and predictable I/O.

**Semantic Kernel — enterprise/.NET.** Best fit for Microsoft / .NET stacks.

## How to choose

Start from your **dominant constraint**, not the hype cycle:

| Constraint | Pick |
|---|---|
| fine control + auditability | **LangGraph** |
| Anthropic-native production | **Claude Agent SDK** |
| fast multi-agent prototype | **CrewAI** |
| conversational / research | **AutoGen / AG2** |
| retrieval over your data | **LlamaIndex** |
| strict typing | **Pydantic AI** |
| .NET / Microsoft shop | **Semantic Kernel** |

```python
# same idea, different ergonomics
# LangGraph — explicit state graph → control, retries, HITL
graph.add_node("plan", plan); graph.add_node("act", act); graph.add_edge("plan", "act")
# CrewAI — roles + tasks → fast multi-agent
Crew(agents=[ingestor, transformer, qa], tasks=[...]).kickoff()
# Claude Agent SDK — tools + MCP + subagents → Anthropic-native production
```

**Real systems often combine them** — e.g. CrewAI roles for fast orchestration plus LangGraph for the critical stateful
path that needs control and HITL.

## Practice

1. Which framework for fine control, retries, and HITL over a stateful workflow?
2. Which for the fastest role-based multi-agent prototype?
3. Which for a RAG-grounded agent over internal docs?
4. Why might a production system combine two frameworks?
