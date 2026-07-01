# MSK (managed Kafka) vs Kinesis — the complete guide

"Kinesis or Kafka?" is one of the most common AWS streaming design and interview questions. The honest answer: they're **functionally similar** durable, replayable logs, and the choice comes down to **Kafka compatibility/ecosystem (MSK)** versus **AWS-native simplicity/integration (Kinesis)**. This chapter gives you the framework to choose well.

@@diagram:aws-msk

## 1. The common ground

Both **Amazon MSK** and **Kinesis Data Streams** are **partitioned, durable, replayable streaming logs**: producers append, consumers read in order within a partition, data is retained for replay, throughput scales with partitions/shards. At the core they solve the **same problem**. The difference is **what surrounds them**.

## 2. Amazon MSK (Managed Streaming for Apache Kafka)

Managed **Apache Kafka** — AWS runs the Kafka brokers (and metadata via KRaft/ZooKeeper):

- **Open-source Kafka API** — standard **Kafka clients** work unchanged, so your apps are **portable** (on-prem, other clouds, AWS) and you avoid lock-in.
- **Rich ecosystem** — **Kafka Connect** (hundreds of source/sink connectors), **Kafka Streams**, **ksqlDB**, schema registry, compacted topics, exactly-once semantics, mature tooling.
- **Topics & partitions** (Kafka's analog of shards), **consumer groups** for scaling reads.
- **MSK Serverless** removes broker capacity management; **MSK Connect** runs managed connectors.
- **Trade-off:** you manage **more** (topics, partitions, sometimes broker tuning) than Kinesis — unless you use **Serverless**.

## 3. Kinesis Data Streams

AWS-native managed streaming:

- **Fully managed**, **shard**-based, simple to operate; **on-demand** mode auto-scales.
- **Tight AWS integration** — **Lambda**, **Firehose**, **Managed Flink**, **KCL** — minimal glue code.
- **Trade-off:** **AWS-specific** (not portable) and a **smaller ecosystem** than Kafka.

## 4. The decision framework

**Choose MSK when:**
- You have **existing Kafka apps / Connect connectors / Streams** you don't want to rewrite.
- You need **Kafka API compatibility** and **portability** (multi-cloud, avoid lock-in).
- You want the **Kafka ecosystem** (specific connectors, ksqlDB, Streams).
- You have established, very high-throughput Kafka workloads.

**Choose Kinesis when:**
- You're building a **new, AWS-only** pipeline and want **native simplicity**.
- You want **tight integration** with Lambda/Firehose/Flink and **minimal operations**.
- Your team lacks Kafka expertise and doesn't need the Kafka ecosystem.

Both integrate downstream with **Managed Flink**, **Glue streaming**, and **Spark**, so your processing options aren't limited by the choice.

## 5. How to answer in an interview

Lead with **"neither is universally better — they're both durable, replayable, partitioned logs; it depends on ecosystem fit and operational preference."** Then give the framework (MSK for Kafka compatibility/ecosystem/portability; Kinesis for AWS-native simplicity/integration). Mention nuances: **MSK Serverless** reduces Kafka ops, **on-demand Kinesis** auto-scales, and you should validate **cost/throughput** for the specific workload. Trade-off-based reasoning beats a dogmatic pick.

## 6. Gotchas

- **Picking dogmatically** ("Kafka is always better") → wrong; it's about fit.
- **Rewriting Kafka apps to Kinesis** unnecessarily → lose ecosystem, add work; MSK runs them as-is.
- **Choosing MSK then hand-managing brokers** when Serverless would do → extra ops.
- **Assuming Kinesis ↔ Kafka feature parity** → details differ (ordering scope, max message size, retention specifics, connector availability); check requirements.
- **Ignoring integration** → if you lean heavily on Lambda/Firehose/Flink, Kinesis is lower-glue.

## Scenario — two teams, two right answers

**Team A** is migrating an on-prem **Kafka** pipeline with several **Kafka Connect** connectors and **Kafka Streams** apps to AWS. They choose **MSK**: their Kafka client code and connectors run **unchanged** (portability, no rewrite), and **MSK Serverless** removes broker capacity management. **Team B** is building a **new, AWS-only** real-time pipeline and chooses **Kinesis Data Streams** for **tight Lambda/Firehose/Flink integration** and **on-demand** auto-scaling — less to operate, no Kafka expertise required. Same streaming-log concept; **different right answers** because the deciding factor was **existing Kafka investment/portability (MSK)** vs **AWS-native simplicity/integration (Kinesis)**. Both feed **Managed Flink** for downstream real-time analytics. That trade-off framing — not a dogmatic "X is better" — is the mature answer.

## Practice

1. What do MSK and Kinesis have in common at the core?
2. What does MSK give you that Kinesis doesn't (API, ecosystem, portability)?
3. What does Kinesis give you that MSK doesn't (native simplicity, integration, ops)?
4. State the decision framework: when to choose each.
5. How would you answer "Kinesis or Kafka — which is better?" in an interview?
6. A team is migrating an existing Kafka pipeline with Connect connectors — which do you pick and why?
7. What nuances (Serverless, on-demand, cost, parity) would you check before deciding?
