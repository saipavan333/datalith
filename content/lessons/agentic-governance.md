# Guardrails, evaluation & governance — deep dive

Autonomy without bounds is a liability. The discipline that makes agentic systems shippable is **guardrails +
evaluation + governance** — and it's where the data engineer's judgment now lives.

@@diagram:agent-guardrails

## The core risk

An agent can produce **high-confidence wrong output** — SQL that passes a glance but is business-wrong, a "fix" that
deletes good data. In a pipeline, that error **propagates and corrupts every downstream system**. Pipelines feeding
**AI** are even less forgiving than ones feeding human dashboards. So you never let an agent act unbounded.

## Guardrails — bound what the agent can do

- **Permissions / least privilege.** Only the tools and data it needs. Read-only by default; **writes are gated**.
- **Validation.** Check actions *before* they execute: dry-run SQL, schema/contract checks, cost/bytes limits, sanity
  checks on outputs.
- **Cost & rate limits.** Budget guards so a runaway loop can't run up a huge bill or hammer an API.
- **Human-in-the-loop (HITL).** Require approval for **risky or irreversible** actions. The agent **proposes**, a human
  **disposes**.

```python
# every agent action passes a guardrail gate (sketch)
action = agent.propose()
if not permitted(action):  block(action)            # least privilege
if not validate(action):   block(action)            # dry-run, schema, cost limits
if action.risky or action.low_confidence:
    human.approve_or_reject(action)                 # HITL for irreversible/risky
else:
    execute(action); log_and_monitor(action)        # audit trail + eval signals
```

## Evaluation — treat agents like software

"It worked in the demo" is not evidence. Agents are non-deterministic, so:

- Build **eval suites** — sets of tasks with **known-good outcomes** — and measure **success / accuracy**.
- **Monitor in production** — log every action, **trace** multi-agent runs, alert on anomalies and drift.
- Re-run evals when you change models, prompts, or tools (regression testing for agents).

## Governance & the new human role

Humans shift from doing every step to **defining policies, setting guardrails, designing agent collaboration patterns,
and owning the edge cases** where judgment matters — becoming **orchestrators of agent fleets**. Crucially, **you remain
accountable** for what the fleet does: who can approve writes, what's logged, how incidents are handled.

## Cheat sheet

| Layer | What |
|---|---|
| Permissions | least privilege; gate writes |
| Validation | dry-run, schema/contract, cost limits before executing |
| Cost/rate | budget guards on loops & APIs |
| HITL | human approval for risky/irreversible actions |
| Evals | task suites with known-good outcomes; measure accuracy |
| Monitoring | log + trace every action; alert on anomalies |
| Human role | set policy, guardrails; own edge cases & accountability |

## Practice

1. Why exactly do agents need guardrails (what's the failure mode)?
2. Which guardrail covers risky/irreversible actions?
3. How do you decide an agent is trustworthy enough to ship?
4. How does the DE's role change in an agentic world?
