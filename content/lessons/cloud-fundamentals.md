# Why cloud? Cloud fundamentals — deep dive

Before any specific service, a data engineer needs the *why*: why nearly all modern data platforms run on the cloud, what you're actually buying, and the deployment choices. Get this foundation and every later topic (object storage, warehouses, serverless) clicks into place.

@@diagram:cloud-value

## What "the cloud" actually is

The cloud is **renting computing resources** (servers, storage, databases, networking) over the internet, on demand, from a provider (AWS, Google Cloud, Azure) — instead of buying and running your own hardware. You provision what you need in minutes via an API/console, and pay only for what you use.

## On-premises vs cloud

| | On-premises | Cloud |
|---|---|---|
| Money | **CapEx** — buy hardware up front | **OpEx** — pay-as-you-go |
| Capacity | fixed (you size for peak) | **elastic** — scale up/down on demand |
| Management | you rack, patch, maintain everything | **managed services** offload the toil |
| Speed | weeks to procure/provision | **minutes** via API |
| Reach | your data center(s) | **global** — deploy near users worldwide |

The shift that matters most for data: **elasticity + managed services**. You can spin up a 100-node Spark cluster for an hour and pay for an hour, and you can use a managed warehouse without operating a single server.

## The value proposition (why data teams went all-in)

- **Elasticity** — data workloads are spiky (a nightly batch, a quarter-end report). The cloud lets you scale to the spike and back down, paying only for the burst — impossible with fixed on-prem hardware.
- **Pay-per-use** — no idle capacity sitting depreciating; cost tracks usage.
- **Managed services** — the provider runs the database/warehouse/queue/Spark so your team builds pipelines instead of babysitting infrastructure.
- **Separation of storage and compute** (the cloud-native superpower) — store data cheaply once on object storage, and spin compute up only when querying. This underpins the modern lakehouse.
- **Global reach & durability** — multi-region storage with extreme durability, and low latency to users anywhere.
- **Speed/agility** — go from idea to running pipeline in hours, not procurement cycles.

## Deployment models

- **Public cloud** — shared provider infrastructure (AWS/GCP/Azure). The default; max elasticity and managed services.
- **Private cloud** — cloud tech on dedicated infrastructure (on-prem or hosted) for control/compliance.
- **Hybrid** — mix of public + private/on-prem, connected (common during migration or for data-residency reasons).
- **Multi-cloud** — using more than one public provider (resilience, avoiding lock-in, best-of-breed) — powerful but adds complexity and **egress** cost.

## Why a data engineer must know this

Almost every modern data platform is cloud-native. The cloud's economics (pay-per-use, elastic, storage/compute separation) directly shape how you design pipelines: lean on managed services, store cheaply on object storage, scale compute elastically, and watch the costs that come with on-demand resources (especially **egress**). This is the ground every later cloud topic stands on.

## Cheat sheet

| Concept | Key point |
|---|---|
| Cloud = | rent compute/storage on demand, pay-per-use |
| On-prem → cloud | CapEx→OpEx, fixed→elastic, self-managed→managed, weeks→minutes |
| Top value | elasticity · pay-per-use · managed services · storage/compute separation · global |
| Public | shared provider infra (default) |
| Private | dedicated infra, more control |
| Hybrid | public + private connected |
| Multi-cloud | multiple providers (resilience/lock-in; egress cost) |

## Practice

1. Explain to a CFO why a spiky nightly batch job is far cheaper in the cloud than on fixed on-prem servers.
2. What is "separation of storage and compute," and why is it the cloud-native superpower for data?
3. Give one reason a company might choose hybrid or multi-cloud despite the added complexity.
