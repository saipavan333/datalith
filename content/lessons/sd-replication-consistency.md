# Replication, consistency & CAP — the complete guide

The moment you keep **copies** of data, you face **consistency** trade-offs — the most theory-probed system-design topic. **CAP** says that during a network partition you must trade Consistency vs Availability; **PACELC** adds the everyday latency-vs-consistency trade. The DE-savvy answer ties the choice to the use case: analytics tolerate eventual consistency; money needs strong consistency. This chapter covers it all.

@@diagram:sd-replication-consistency

## 1. Why replicate

**Replication** keeps copies of data on multiple nodes for:
- **Availability** — a replica serves if one node fails.
- **Durability** — data survives node loss.
- **Read scale** — spread reads across replicas.
- **Locality** — a nearby replica reduces latency.

## 2. The consistency problem

With copies, a write must **propagate**. **Synchronous** replication (wait for replicas to ack) gives **consistency** but **higher latency / lower availability**; **asynchronous** replication is **fast/available** but replicas can be **stale** (eventual consistency). This is a fundamental tension.

## 3. CAP theorem

During a **network partition** (nodes can't communicate), a distributed system must choose:
- **C (Consistency)** — every read sees the latest write (or errors). A **CP** system may **reject/timeout** requests to stay correct.
- **A (Availability)** — every request gets a (possibly **stale**) response. An **AP** system stays up but may serve **old data**.

You **can't have both** during a partition (P is unavoidable in distributed systems), so it's really **CP vs AP under partition**.

## 4. PACELC (the fuller picture)

**PACELC:** **if Partition → trade A vs C; Else (normal operation) → trade Latency vs Consistency.** Even without a failure, **stronger consistency costs latency** (you wait for replicas/quorum). So the trade-off is **constant**, not just during partitions.

## 5. Consistency models (a spectrum)

- **Strong / linearizable** — reads always see the latest write (single-leader + sync replication, or quorum) — correct but slower/less available.
- **Causal / read-your-writes / monotonic / bounded-staleness** — useful middle grounds.
- **Quorum** — read+write quorums with **R + W > N** give tunable consistency.
- **Eventual** — replicas converge eventually; reads may be **stale** — fast and available (Cassandra/DynamoDB AP modes, async replicas).

## 6. Choosing for data engineering

- **Analytics / dashboards / lake** — usually **tolerate eventual consistency** (seconds/minutes stale is fine) → favor **availability/latency**.
- **Financial ledgers / exactly-once / correctness-critical** — need **strong** guarantees (transactions, linearizability) → accept latency cost.

State the requirement and pick deliberately — don't default to "strong everywhere" (needlessly slow) or "eventual everywhere" (wrong for money).

## 7. Gotchas

- **Assuming you can have C, A, and P** — under a partition you trade C vs A.
- **"Strong consistency everywhere"** — needlessly slow/less available for analytics.
- **"Eventual everywhere"** — wrong for money/correctness-critical data.
- **Ignoring PACELC** — consistency costs latency even normally.
- **Quorum math** — R+W>N for strong reads; understand the trade.
- **Replication lag** — async replicas are stale; design reads accordingly (read-your-writes where needed).

## Scenario — opposite CAP choices in one company

A company replicates data globally and makes **opposite** consistency choices by use case. The **analytics serving layer** (dashboards) uses **AP / eventual consistency**: replicas near users serve fast reads that may be **seconds stale** — fine for dashboards, maximizing **availability and latency** (PACELC: prefer latency; under a partition, stay available with slightly stale numbers). The **financial ledger** uses **CP / strong consistency**: a single-leader/quorum design that **rejects** a write it can't safely commit during a **partition** rather than risk a double-spend — accepting **higher latency and reduced availability** for **correctness**. Same company, **opposite** CAP choices, each **driven by the requirement**. That deliberate, use-case-matched reasoning — CP vs AP, latency-vs-consistency, not "strong everywhere" — is exactly what system-design interviews assess, and it shows you understand that consistency is a **trade-off to choose**, not a default to assume.

## Practice

1. Why replicate, and what consistency tension does it introduce?
2. State the CAP theorem and what CP vs AP mean under a partition.
3. What does PACELC add to CAP?
4. Describe the consistency spectrum (strong → eventual) and quorum (R+W>N).
5. How should consistency choice differ for analytics vs financial data?
6. Why is "strong everywhere" or "eventual everywhere" usually the wrong default?
7. Explain CAP/PACELC and choose consistency for a dashboard layer vs a ledger.
