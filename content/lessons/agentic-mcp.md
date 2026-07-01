# MCP — Model Context Protocol — deep dive

Before MCP, every agent-to-tool integration was bespoke glue code: N agents × M tools = N×M custom connectors. **MCP
(Model Context Protocol)** replaces that with one open standard — write a server once, and any MCP-aware agent can use
it.

@@diagram:mcp-architecture

## What it is

A standard for connecting agents to **tools and data**. Created by **Anthropic**, donated to the **Linux Foundation**
(Dec 2025), and backed by OpenAI, Google, Microsoft and AWS. By 2026 it's the **dominant** agent-to-tool protocol
(~97M downloads) — the integration layer of the agentic stack.

## Architecture

Client-server over **JSON-RPC 2.0**. The **host** (your agent application) opens an **MCP client** session per **MCP
server**; each server exposes capabilities the agent can use. Sessions are isolated and stateful.

## The three primitives

- **Tools** — functions the model can invoke (run a query, call an API, execute code).
- **Resources** — data the model can read (file contents, table rows, a schema, docs).
- **Prompts** — reusable templates that guide a workflow.

```python
# an MCP server exposes Tools + Resources to ANY MCP-aware agent (sketch)
server = MCPServer("warehouse")

@server.tool
def run_sql(query: str) -> list[dict]:        # TOOL
    "Read-only query against the warehouse."
    return wh.execute(query)

@server.resource("schema://{table}")           # RESOURCE
def table_schema(table): return wh.schema(table)

@server.prompt("investigate_freshness")        # PROMPT (reusable template)
def freshness_prompt(table): return f"Investigate why {table} is stale; check logs and lineage."
```

The host opens an MCP client to this server over JSON-RPC; now the agent can query your warehouse, read schemas, and
run the freshness workflow — without any bespoke integration.

## Why it matters for data engineers

Wrap a data source **once** as an MCP server — e.g. a **Postgres/warehouse MCP server** exposing a read-only `run_sql`
tool plus schema resources — and *every* MCP-aware agent can use it, with the auth and scoping **you** control. Swap the
agent or model freely; the integration stays.

## Security (do this)

- **Least privilege** — read-only by default; gate writes; expose only needed tools.
- **Scope & auth** at the server (per-team credentials, row/column limits).
- **Validate inputs** and **audit** every call (who ran what).
- Treat an MCP server like any production data interface — it *is* one.

## Mental model

MCP is to agents-and-tools what a **standard port / driver** is to hardware: a common interface that ends N×M custom
integrations.

## Cheat sheet

| Aspect | Detail |
|---|---|
| What | open standard: agent ↔ tools/data |
| Origin | Anthropic → Linux Foundation; backed by OpenAI/Google/MS/AWS |
| Transport | client-server, JSON-RPC 2.0 |
| Primitives | **Tools** (invoke), **Resources** (read), **Prompts** (templates) |
| DE win | wrap a source once; reuse across all agents |
| Security | least privilege, scope, validate, audit |

## Practice

1. What problem does MCP solve, in one sentence?
2. Name the three MCP primitives with an example of each.
3. Who created MCP and where does it live now?
4. How would you expose your warehouse to agents with MCP, safely?
