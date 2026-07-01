# Self-healing & autonomous pipelines — deep dive

The biggest agentic-DE trend of 2026: instead of a human waking up to a 3 a.m. page, an **agent** detects the problem,
diagnoses it, and **fixes it or escalates** — a **self-healing pipeline**.

@@diagram:self-healing-pipeline

## The three phases

**1. Detect.** The agent (or a quality layer it watches) flags anomalies in real time:

- **null floods** (a column suddenly mostly null),
- **schema drift** (a column renamed/retyped upstream),
- **freshness misses** (data didn't arrive on time),
- **volume anomalies** (row counts swing far outside normal).

**2. Diagnose.** It reads **logs** and **lineage** to localize the root cause — e.g. "upstream changed `amount` from
numeric to string, so the cast now yields null." Lineage gives blast radius; logs give what changed.

**3. Act — fix or escalate.**

- **Auto-fix (safe, well-understood):** retry a transient failure, **backfill** the affected partition, re-cast a
  changed type, **quarantine** bad records, or open a fix PR.
- **Escalate (ambiguous/risky):** hand off to a **human (HITL)** with the full diagnosis attached, so the human decides
  fast instead of investigating from scratch.

```python
# self-healing loop (sketch)
issue = monitor.detect()                        # e.g. null flood in orders.amount
root  = agent.diagnose(issue, logs, lineage)    # upstream cast changed string→null
if root.fix_is_safe:                            # known, low-risk
    agent.apply(root.fix)                        # backfill / re-cast / quarantine
else:
    human.escalate(issue, diagnosis=root)        # HITL with full context
```

## The intent layer

Mature setups define an **intent layer** — the pipeline's **purpose, consumers, and expectations** (freshness,
accuracy, reliability). It tells the agent what "healthy" means and which trade-offs are acceptable, so it doesn't
"fix" something that wasn't broken or take an action the business wouldn't want.

## It's the multi-agent pattern, applied

Under the hood this is an **orchestrator** coordinating **detect / diagnose / repair** specialists, each using **MCP**
to read logs, query the warehouse, and apply fixes — all bounded by **guardrails**.

## The hard part is safe action, not detection

Detecting anomalies is relatively easy; **acting safely** is the challenge. An agent that confidently applies the wrong
fix can corrupt downstream data. So self-healing is paired tightly with **validation** and **HITL** (see the governance
lesson). Automate only the fixes you've proven safe; escalate the rest.

## Cheat sheet

| Phase | What | How |
|---|---|---|
| Detect | null floods, schema drift, freshness, volume | monitors / quality layer |
| Diagnose | root cause | logs + lineage |
| Act (safe) | retry, backfill, re-cast, quarantine | auto-remediate |
| Act (risky) | ambiguous/destructive | escalate to human (HITL) |
| Intent layer | what "healthy" means | purpose + freshness/accuracy/reliability |

## Practice

1. List four anomalies a self-healing agent watches for.
2. What does it use to find an issue's root cause?
3. Give two safe auto-fixes and one case to escalate.
4. What does the intent layer give the agent?
