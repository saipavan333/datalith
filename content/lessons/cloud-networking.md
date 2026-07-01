# Cloud networking & data movement — deep dive

Networking is the quietly expensive, security-critical layer of a cloud data platform. Two ideas pay for themselves immediately: keep data traffic **private**, and remember that **egress (data leaving) is the hidden cost** that wrecks cloud bills.

@@diagram:cloud-networking

## The VPC — your private network

A **Virtual Private Cloud (VPC)** is your isolated private network in the cloud, with **subnets** (public and private), route tables, and **security groups** controlling traffic. The core practice: run data services (databases, clusters, warehouses) in **private subnets**, not exposed to the public internet, and reach them through controlled paths. You design network boundaries so only authorized traffic touches your data systems.

## Keep traffic private (and cheaper)

- **VPC endpoints / PrivateLink** — reach cloud services (like S3) over the cloud's **private backbone** instead of the public internet. More secure (never traverses the internet) and avoids internet **egress** charges.
- **Private subnets + NAT** for outbound-only access; **peering / Transit Gateway** to connect VPCs privately.
- The principle: data should travel privately, in-network, by default.

## Egress — the hidden cost

Cloud providers charge for data **leaving** a region or going to the internet (**egress**), while **ingress is usually free**. This quietly accumulates:

- Cross-region replication and cross-cloud traffic.
- Pulling large datasets out to on-prem or another provider.
- Chatty services in different regions.

**Minimize egress by colocating compute and storage in the same region (data locality)**, using private endpoints (no internet egress), caching, and avoiding unnecessary cross-region replication. Design *where data lives* relative to *where it's processed*.

## Regions, AZs & latency

Place compute near the data and the users: same-region for low latency and no cross-region egress; **multi-AZ** within a region for high availability; multi-region only when you genuinely need DR or global presence (accepting the cost). Network design and the regions/AZs topic go hand in hand.

## Cheat sheet

| Concept | Key point |
|---|---|
| VPC | your private network; data services in **private subnets** |
| VPC endpoint / PrivateLink | reach services privately (secure, no internet egress) |
| Egress | data leaving region/internet is **charged**; ingress usually free |
| Minimize egress | colocate compute + storage (same region), private endpoints, caching |
| Latency/HA | same-region + multi-AZ; multi-region only for DR/global |

## Practice

1. Why run a database in a private subnet with a VPC endpoint instead of giving it a public IP?
2. Your cloud bill has a large, surprising "data transfer" line — what is it likely, and how do you reduce it?
3. You process data in `us-east-1` but stored it in `eu-west-1` — name two problems this causes.
