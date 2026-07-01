# Server vs serverless — the complete decision guide

Almost every cloud design choice eventually reduces to one question: **do you run the compute (server), or does the
provider (serverless)?** This is one of the highest-leverage decisions a data engineer makes — it sets your cost shape,
your operational burden, and your latency profile. Let's settle it with the **why, where, who, and how**.

@@diagram:server-vs-serverless

## What each one is

- **Server (provisioned)** — *you* run the compute: VMs (EC2), clusters (Dataproc/EMR), or containers (EKS/Fargate).
  It runs until you stop it, you patch/scale/operate it, and you **pay whether it's busy or idle**.
- **Serverless** — the *provider* runs it: you hand over code or a query; it auto-provisions, scales (even to zero),
  and you **pay per use**. Lambda, Cloud Run, BigQuery, Athena, Glue.

## WHY it matters — the four trade-offs

1. **Cost shape.** Server cost is **fixed** — excellent when utilization is high, wasteful when idle. Serverless cost
   is **variable** — excellent when spiky, but it can get *expensive* at sustained high volume. A function running at
   50+ concurrent executions 24/7 can cost far more than a right-sized always-on container.
2. **Operations.** Serverless removes infra ops (no patching, scaling, or capacity planning). Server gives you control
   — at the cost of carrying that ops burden.
3. **Latency.** Serverless has **cold starts** (50ms–1s) when an idle environment must spin up, plus timeouts and size
   limits. Server has **no cold start** and predictable latency.
4. **Control.** Server lets you pick any runtime, run long jobs, and tune the machine. Serverless constrains runtime,
   duration, and memory.

## WHERE to use each (data engineering)

| Workload | Best fit | Why |
|---|---|---|
| File lands → process it | **serverless** function | spiky, short, event-driven |
| Ad-hoc / unpredictable SQL | **serverless** (BigQuery/Athena) | pay per scan, zero ops |
| Nightly 2-hour Spark batch | **server** (transient cluster) | sustained compute; tear down after |
| 24/7 streaming consumer | **server** | always-on, no cold starts |
| Low-latency always-on API | **server/container** | predictable latency |
| Glue between services | **serverless** | cheap, event-driven |

## HOW to decide (and who)

@@diagram:serverless-decision

- **Lean teams / startups** lean **serverless** — less to operate, ship faster.
- **Platform teams at scale** (e.g. a **bank** with steady, predictable, regulated workloads) often run
  **servers/clusters** for control, cost-at-scale, and compliance — while still using serverless for bursty glue.

**The gold-standard answer is hybrid.** Run the **steady core** on servers/containers (predictable, cheaper at scale)
and absorb **bursts and events** with serverless. Teams that match each workload to its load shape report cost savings
up to ~60% versus all-serverless. Don't pick a religion — pick per workload.

## Cheat sheet

| | Server | Serverless |
|---|---|---|
| Runs it | you | provider |
| Cost | fixed (pay idle) | per-use (scales to zero) |
| Cold start | none | yes (50ms–1s) |
| Control | full | constrained |
| Best for | sustained / low-latency / special runtime | bursty / event-driven / ad-hoc |

## Practice

1. A job runs at constant high concurrency 24/7 — server or serverless, and why?
2. What's the main latency drawback of serverless, and how is it mitigated?
3. Why might a big bank run its own clusters even though serverless is "easier"?
4. Describe the hybrid pattern and why it wins.
