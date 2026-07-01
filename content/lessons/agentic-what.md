# What is an agentic system? — deep dive

A plain LLM call is one-shot: prompt in, text out. An **agent** wraps that LLM in a **loop** so it can *act* in the
world and react to what it learns. That single change — a loop with tools — is what makes agentic AI useful for real
data work.

@@diagram:agent-loop

## The loop (ReAct)

```
Reason  → the LLM decides the next step
Act     → it calls a tool (run SQL, hit an API, run code)
Observe → it reads the result
repeat  → until the goal is met
```

This interleaving of **reasoning** and **acting** is the **ReAct** pattern. Each observation feeds the next reasoning
step, so the agent can investigate, course-correct, and chain many actions toward a goal it wasn't explicitly
programmed for.

## Agent vs workflow vs chatbot

| | Decides steps? | Acts via tools? | Best for |
|---|---|---|---|
| **Chatbot** | no | no | answering from the prompt |
| **Workflow** | no (you wrote them) | yes | deterministic, known pipelines |
| **Agent** | **yes, at runtime** | yes | open-ended tasks needing judgment |

A workflow is a fixed recipe you authored. An agent is given a **goal, tools, and guardrails** and figures out the
recipe itself — more flexible, but it needs bounds.

## Why data engineers care (2026)

Agents can now do work that used to require a human: investigate why a table is stale, write and validate SQL, enforce
a data contract, or repair a broken partition. The mental shift is **from "you write every step" to "you set the goal,
tools, and guardrails, and the agent chooses the steps."**

## The catch: autonomy needs bounds

The same autonomy that makes agents useful lets them take a **wrong action confidently**. In a pipeline, a confidently
wrong action corrupts everything downstream. So every serious agent is bounded by:

- the **tools** it's allowed to call (least privilege),
- **validation** before risky actions execute,
- **human-in-the-loop** for irreversible steps.

(We build these guardrails out in the governance lesson.)

```python
# the loop, concretely
state = {"goal": "find why orders_fact is stale"}
while not done(state):
    thought = llm.reason(state)        # plan next step
    action  = thought.tool_call        # e.g. query_logs("orders_fact")
    result  = tools.run(action)        # ACT
    state   = observe(state, result)   # OBSERVE → back to reason
return state["answer"]
```

## Cheat sheet

| Term | Meaning |
|---|---|
| agent | LLM + tools + memory in a reason→act→observe loop |
| ReAct | interleave reasoning and tool actions |
| tool | a function the LLM can call (typed) |
| vs workflow | agent picks steps at runtime; workflow is fixed |
| bound it | allowed tools + validation + HITL |

## Practice

1. What single capability turns an LLM into an agent?
2. Give the four words of the agent loop, in order.
3. Chatbot vs workflow vs agent — one line each.
4. Why does agent autonomy require guardrails?
