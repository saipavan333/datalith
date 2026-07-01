# Multi-agent orchestration — deep dive

For non-trivial work, one giant agent struggles — its context balloons and it makes more mistakes. The production
pattern is a **fleet**: an **orchestrator** plus focused **specialist** agents.

@@diagram:multi-agent-orchestration

## The roles

**Orchestrator (planner).** Receives the goal, **decomposes** it, **delegates** subtasks (via **A2A**), and assembles
the results. It owns the plan and the control flow.

**Specialists.** Narrow agents, each great at one job and equipped with the right **MCP tools**:

- *Ingestion agent* — pull/land data.
- *Transform agent* — clean and model.
- *Data-quality agent* — validate, enforce contracts, quarantine.
- *Repair agent* — apply safe fixes / backfills.

Narrow scope means **focused context, better prompts, fewer mistakes, and easier evaluation** per agent.

## Coordination patterns

| Pattern | How | Use for |
|---|---|---|
| **Supervisor / orchestrator-worker** | central planner delegates & aggregates | data pipelines (most common) |
| **Group chat** (AutoGen/AG2) | agents converse; a selector picks who speaks | research / debate |
| **Sequential / handoff** | agents pass work down a chain | linear processes |

LangGraph models the supervisor pattern as a state graph; CrewAI as roles + tasks.

```python
# supervisor pattern (sketch)
plan = orchestrator.plan(goal="refresh + validate sales_mart")
for task in plan:                       # ingest → transform → quality → repair
    agent  = route(task)                # pick the specialist
    result = agent.run(task)            # specialist uses its MCP tools
    orchestrator.observe(result)        # aggregate; decide next / retry / escalate
```

## Why multi-agent beats one mega-agent

- **Separation of concerns** — each agent's context stays tight and on-task.
- **Reusability** — specialists are composable across pipelines.
- **Per-agent evals & guardrails** — you can test and bound each one independently.
- **Parallelism** — independent subtasks run concurrently.

**The cost:** more moving parts. Invest in **observability and tracing** so you can see who did what, debug failures,
and attribute cost.

## DE mapping

Orchestrator → {ingestion, transform, quality, repair} specialists, each using **MCP** over your DB / lake / APIs. This
*is* the agentic pipeline of the next lesson.

## Cheat sheet

| Concept | Key point |
|---|---|
| structure | orchestrator (plan/delegate) + narrow specialists |
| protocols | delegate via A2A; act via MCP tools |
| patterns | supervisor (pipelines), group chat (research), handoff |
| benefits | focus, reuse, per-agent evals, parallelism |
| cost | complexity → invest in tracing/observability |

## Practice

1. Name the four specialist agents in an agentic pipeline.
2. Which protocol delegates, and which does the actual tool work?
3. Two coordination patterns and when to use each?
4. What's the main cost of multi-agent systems, and the mitigation?
