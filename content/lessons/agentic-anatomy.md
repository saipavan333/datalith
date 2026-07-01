# Anatomy: tools, memory & planning — deep dive

Every agent, in every framework, is built from the same four parts. Learn them once and you can reason about any
agentic system.

@@diagram:agent-anatomy

## 1. LLM — the reasoning core

The model that decides what to do next. Model quality and prompting drive everything else; the other three parts exist
to give it hands, recall, and structure.

## 2. Tools — how the agent acts

A **tool** is a function the LLM can invoke via **function calling**. Each tool has a **name**, a **description**, and a
**typed (JSON-schema) signature**. The model emits a structured call; your runtime executes it and returns the result.

```python
@tool
def run_sql(query: str) -> list[dict]:
    """Run a READ-ONLY SQL query against the warehouse and return rows."""
    return warehouse.execute(query)
# LLM emits {"tool":"run_sql","query":"SELECT ..."} → runtime runs it → result returns to the agent
```

**Good tool design is the biggest lever on agent quality.** Clear names and descriptions (the model picks tools by
their description), **narrow scope**, and **validated inputs**. Typical DE tools: `run_sql`, `read_table_schema`,
`call_api`, `run_python`, `check_freshness`, `quarantine_rows`.

## 3. Memory

- **Short-term** — the **context window**: the recent steps, observations, and conversation. Limited; it's the agent's
  working memory for the current task.
- **Long-term** — a **vector store** the agent can search to recall facts, past runs, schemas, or documentation (the
  RAG pattern). This is what keeps an agent coherent beyond a single context window.

```python
memory.add(run_summary)                       # long-term: persist
context = memory.search("orders_fact schema") # recall relevant facts on demand
```

## 4. Planning

Turning a goal into ordered steps. Two flavors:

- **Implicit (ReAct)** — the agent plans one step at a time inside the loop. Simple and robust.
- **Explicit plan + reflect** — the agent writes a plan, executes it, and **reflects** (self-critiques) to catch and
  recover from mistakes. Better for complex, multi-step tasks.

## Putting it together

> **agent = LLM + tools + memory + planning, run in a loop.**

Frameworks differ mainly in *how they structure these four* (a state graph, roles, a conversation) — but the parts are
always the same.

## Cheat sheet

| Part | Role | DE example |
|---|---|---|
| LLM | reason / decide | choose the next step |
| Tools | act (function calling) | `run_sql`, `call_api` |
| Memory | recall (short + long/vector) | remember a table's schema |
| Planning | decompose + reflect | plan ingest→validate→repair |

## Practice

1. How does an agent "use a tool" mechanically?
2. What three things define a callable tool?
3. Short-term vs long-term memory — what backs each?
4. Implicit (ReAct) vs explicit planning — when use each?
