# Streaming & Real-Time — interview prep & cheat sheet

Rapid-review for the Streaming track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **Kafka** → durable, replayable, partitioned **log**; offsets; decouples producers/consumers.
- **Partitions** → unit of parallelism; ordering only within a partition; consumer parallelism ≤ partition count.
- **Event vs processing time** → use **event time** for correct analytics.
- **Windows** → tumbling / sliding / session.
- **Watermark** → estimate of event-time progress → when a window is done + bound late data.
- **Delivery** → at-most / at-least (default) / exactly-once; often at-least-once + idempotent ("effectively-once").
- **State** → checkpointed for fault tolerance; bounded by windows/TTL.
- **Lambda vs Kappa** → two codebases vs replay-the-log (one streaming path).
- **Backpressure** → consumer lag is the SLO; scale consumers ≤ partitions.

## Mock interview (answer out loud, 60–90s each)

1. Batch vs streaming — when each, and what makes streaming harder?
2. Why is Kafka a "log", and how does it achieve durability and scale?
3. Explain partitions, consumer groups, and offsets — and the ordering guarantee.
4. Event time vs processing time — why does it matter?
5. What is a watermark, and what problem does it solve?
6. At-most / at-least / exactly-once — and how is exactly-once actually achieved?
7. What is stateful processing, and how is streaming state made fault-tolerant?
8. Stream-stream vs stream-table joins — why does stream-stream need a window?
9. Lambda vs Kappa architecture — and Kappa's main advantage?
10. What is backpressure, and how do you scale a consumer (and its limit)?

These cover the bulk of streaming/distributed-systems rounds at Amazon, Google, Meta, and real-time-data companies.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
