# Compute — VMs, containers & serverless — deep dive

Once your data lives in the cloud, you need *compute* to process it — and the cloud offers a spectrum from raw virtual machines to fully serverless functions. The choice is a trade-off between **control and operational overhead**, and picking the wrong point wastes money or engineering time.

@@diagram:compute-spectrum

## The spectrum

- **Virtual machines (IaaS)** — EC2 / Compute Engine / Azure VMs. You get a full machine: install anything, full control. But you patch the OS, manage scaling, and handle reliability. Use for stateful or legacy workloads, or anything a managed service can't run.
- **Containers** — Docker images orchestrated by Kubernetes (EKS/GKE/AKS) or simpler services (ECS, Cloud Run). Portable, efficient packaging, faster startup than VMs, good resource utilization. The default for most modern services and many data workloads.
- **Serverless functions** — Lambda / Cloud Functions / Azure Functions. Event-driven, auto-scaling, pay-per-invocation, **no servers to manage**. Ideal for glue, short tasks, and spiky/event-driven work.

As you move VM → container → serverless, you trade **control for less operational overhead** and finer-grained scaling/billing.

## Choosing for data workloads

| Workload | Best fit | Why |
|---|---|---|
| Heavy batch / Spark | managed cluster or containers | sustained compute; transient job clusters |
| Event reaction (file lands → process) | **serverless** | spiky, short, zero ops |
| Long-running service / API | container | always-on, scalable, portable |
| Custom/legacy or special networking | VM (IaaS) | full control |

**When NOT to use serverless:** long-running or heavy compute (timeouts — Lambda caps at 15 min; cost at sustained load), low-latency needs (cold starts), or stateful work. Serverless shines for short, spiky, event-driven tasks; sustained heavy processing is cheaper on containers/VMs or managed clusters.

## The data-engineering pattern: transient compute on durable storage

The cloud-native move is **separation of storage and compute**: keep data on cheap object storage, and spin up **transient** compute (a job cluster, a container, a function) only for the duration of the work, then tear it down. You pay for the job's runtime, not idle capacity — far cheaper than always-on servers for scheduled batch.

## Cheat sheet

| | Control | Ops | Use for |
|---|---|---|---|
| **VM (IaaS)** | max | most | stateful, legacy, custom |
| **Container** | medium | medium | most modern workloads, services |
| **Serverless** | least | least | event-driven, glue, spiky, short |

**Rules:** prefer the least-ops option that meets latency/duration needs · serverless for spiky/short, not heavy/long · run transient compute over durable object storage.

## Practice

1. A pipeline processes files that arrive unpredictably, a few MB each. Which compute model, and why?
2. Why is serverless a poor fit for a 2-hour nightly Spark job, and what would you use instead?
3. What does "transient compute on durable storage" save you versus an always-on cluster?
