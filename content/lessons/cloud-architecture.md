# Cloud architecture — regions, AZs & shared responsibility — deep dive

To design reliable, compliant, cost-aware data platforms you need the cloud's physical and responsibility map: how the provider's infrastructure is laid out (regions and availability zones), who is responsible for what (the shared responsibility model), and the principles that make a design "good" (the well-architected pillars).

@@diagram:cloud-architecture

## Regions and availability zones

- **Region** — a geographic area (e.g., `us-east-1`, `europe-west1`). You choose regions for **latency** (close to users), **data residency** (compliance — keep EU data in the EU), and **cost** (prices vary by region).
- **Availability Zone (AZ)** — one or more **isolated data centers** within a region, with independent power, cooling, and networking. A region has multiple AZs.
- **Edge locations / CDN** — points of presence near users for caching and low-latency content delivery.

**The key design rule: deploy across multiple AZs for high availability.** If one data center (AZ) fails, your system keeps running in the others. Single-AZ = a single point of failure. For data: replicate storage across AZs, run clusters spanning AZs, and use multi-AZ managed databases.

For disaster recovery and global scale, you go further — **multi-region** (replicate across regions) — at higher cost and complexity (and cross-region **egress** charges).

## The shared responsibility model

A constant source of security incidents is misunderstanding this. Security is **split**:

- **Provider — security OF the cloud**: the physical hardware, the network backbone, the hypervisor, and the managed-service internals. You can't touch these; the provider secures them.
- **You — security IN the cloud**: your **data**, **access control (IAM)**, **configuration** (e.g., not making an S3 bucket public!), encryption settings, network rules, and application code.

The line shifts with the service model: with IaaS you also secure the OS; with SaaS the provider handles almost everything and you mainly manage data and access. **Most breaches are customer-side misconfigurations** (public buckets, over-broad IAM) — your half of the model.

## The well-architected pillars

Cloud providers codify "good design" into pillars you should weigh in every decision:

1. **Reliability** — survive failures (multi-AZ, retries, backups, recovery).
2. **Security** — least privilege, encryption, the shared responsibility model.
3. **Cost optimization** — right-size, pay-per-use, minimize egress (FinOps).
4. **Performance efficiency** — match resources to the workload; scale elastically.
5. **Operational excellence** — automate, monitor, infrastructure-as-code.
6. *(and Sustainability)* — minimize resource/energy footprint.

These are the trade-offs an interviewer expects you to reason about when designing a cloud data platform.

## Why a data engineer must know this

You decide which region data lives in (residency + latency + cost), whether storage/compute spans AZs (availability), and you own the *customer half* of security (IAM, encryption, not exposing data). And the well-architected pillars are exactly the axes — reliability, security, cost, performance, operations — you balance when designing any pipeline on the cloud.

## Cheat sheet

| Concept | Key point |
|---|---|
| Region | geographic area → latency, residency, cost |
| Availability Zone | isolated data center; **deploy multi-AZ for HA** |
| Multi-region | DR / global scale (more cost + egress) |
| Shared responsibility | provider secures OF the cloud; **you secure IN it** (data, IAM, config) |
| Most breaches | customer misconfig (public buckets, broad IAM) |
| Well-architected | reliability · security · cost · performance · operations (+ sustainability) |

## Practice

1. Why deploy a critical pipeline across multiple AZs instead of one, and what does single-AZ risk?
2. In the shared responsibility model, who is responsible for an S3 bucket accidentally made public — and why?
3. Name the well-architected pillars and which one "minimize egress and right-size compute" falls under.
