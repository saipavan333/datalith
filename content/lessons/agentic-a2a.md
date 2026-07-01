# A2A & multi-agent protocols — deep dive

MCP connects an agent **down** to tools and data. **A2A (Agent2Agent)** connects agents **across** to each other. They
solve different problems and are designed to work together.

@@diagram:mcp-vs-a2a

## A2A in one paragraph

Launched by **Google Cloud** with 50+ partners (now also under the Linux Foundation umbrella), A2A lets a
**planner/orchestrator** agent **delegate subtasks** to **specialist** agents. Agents advertise their capabilities via
**Agent Cards** and talk over **HTTP/JSON**, so heterogeneous agents — even from different vendors or frameworks — can
collaborate.

## The two layers

| | MCP | A2A |
|---|---|---|
| Direction | **vertical** (agent ↔ tool/data) | **horizontal** (agent ↔ agent) |
| Purpose | give one agent tools | let agents form a team & delegate |
| Discovery | server capabilities | **Agent Cards** |
| Use it to | query a DB, call an API | hand a subtask to a specialist |

They're complementary: **MCP gives an agent hands; A2A lets agents form a crew.**

## Worked example — a data platform

```python
# orchestrator receives: "refresh and validate the sales mart"
orchestrator.delegate("ingest",    to=ingestion_agent)   # A2A (agent → agent)
orchestrator.delegate("transform", to=transform_agent)
orchestrator.delegate("validate",  to=quality_agent)

# inside quality_agent — it does real work via MCP (agent → tool/data)
quality_agent.use(mcp.run_sql,
    "SELECT count(*) FROM sales_mart WHERE amount IS NULL")
```

A2A coordinates the **team**; MCP does the **work**.

## When do you actually need A2A?

- **Reach for A2A** when the task benefits from **specialized agents** collaborating (ingestion / transform / quality /
  repair), possibly across teams or vendors.
- **You may not need it** for simpler tasks — a single agent with a good set of MCP tools is often enough. Don't add
  multi-agent complexity before you need it.

## 2026 status

MCP, A2A, and **ACP** now sit under **Linux Foundation** governance, creating real convergence and institutional
alignment. Native framework support still varies (e.g. CrewAI added A2A; some others lag), so check your stack before
committing.

## Cheat sheet

| Concept | Key point |
|---|---|
| A2A | agent ↔ agent delegation (Google Cloud + partners) |
| Agent Card | how an agent advertises its capabilities |
| MCP vs A2A | vertical (tools) vs horizontal (agents) — use together |
| Pattern | orchestrator delegates via A2A; specialists act via MCP |
| When | A2A for teams of specialists; single agent for simple tasks |

## Practice

1. MCP vs A2A in one line.
2. How does an agent advertise its capabilities in A2A?
3. Sketch how an orchestrator validates a mart using *both* protocols.
4. When is a single tool-rich agent better than going multi-agent?
