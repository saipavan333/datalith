# System Design & Interview Mastery — interview prep & cheat sheet

Rapid-review for the System Design track — the round that ties everything together. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## The framework (use for any design)

1. **Clarify** requirements (sources, volume, latency/SLA, consumers, constraints).
2. **High-level design** (ingest → store → transform → serve).
3. **Deep dive** key components + justify choices.
4. **Scale & trade-offs** (bottlenecks, cost, failure).
5. **Wrap up** (risks, monitoring, improvements).

## High-frequency answers

- **Batch vs streaming** → latency decides; don't stream what daily batch can serve.
- **Capacity** → events × bytes → TB/yr; ÷ compression, × replication; QPS = events ÷ 86,400; state assumptions.
- **Trade-offs** → latency ↔ cost ↔ complexity; choose deliberately.
- **Storage** → match access pattern (OLTP/scan/KV/search/vector/stream); no "best" DB.
- **Scaling** → reads (replicas + cache), writes (partition + buffer); find the bottleneck.
- **Behavioral** → STAR (Situation, Task, Action, Result).

## Mock interview (answer out loud, 60–120s each)

1. Walk me through how you approach any pipeline design question.
2. How do you decide batch vs streaming for a use case?
3. Estimate storage and throughput for 50M events/day at 500 bytes each.
4. What are the core trade-offs in data system design?
5. Design an analytics pipeline for a retailer's sales data.
6. How do you choose the right storage/database for a use case?
7. Vertical vs horizontal scaling, and how do you scale reads vs writes?
8. Design a real-time analytics dashboard system.
9. How do you structure a system-design interview answer?
10. How do you answer behavioral questions (STAR)?

These are exactly the rounds that decide senior DE offers at Amazon, Google, Meta, and beyond.

## How to use

- **Day before:** the framework + master cheat sheet (📋 button).
- **Hour before:** the mock questions, out loud, using the 5-step framework.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
