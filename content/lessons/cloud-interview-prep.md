# Cloud Data Engineering — interview prep & cheat sheet

Rapid-review for the Cloud track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **Object storage** → cheap, infinite, durable; decouples storage from compute; lakehouse substrate.
- **Separation of storage & compute** → elasticity, pay-per-use, workload isolation.
- **Compute spectrum** → VM (control) → container → serverless (least ops); serverless for spiky/event-driven.
- **Warehouses** → Snowflake (virtual warehouses) / BigQuery (serverless, per-byte-scanned) / Redshift; prune to save.
- **FinOps** → visibility → optimize → govern; biggest levers = right-size compute + cut egress.
- **Egress** → the hidden cost (data leaving region/cloud) → data locality + private endpoints.
- **IAM** → least privilege; roles (temporary) over access keys (static, leak-prone).
- **Three clouds** → same categories (object/warehouse/Spark/streaming/orchestrate/functions); know one deeply.

## Mock interview (answer out loud, 60–90s each)

1. Why is object storage the foundation of modern data platforms?
2. What does separation of storage and compute enable?
3. VMs vs containers vs serverless — when each, and when NOT serverless?
4. Snowflake vs BigQuery vs Redshift — and how does BigQuery's pricing shape behavior?
5. What are the biggest cloud cost levers, and what is FinOps?
6. Why is data egress a hidden cost, and how do you minimize it?
7. Explain IAM least privilege, and why roles beat access keys.
8. How do you protect data at rest and in transit?
9. Map the core data services across AWS, GCP, and Azure.
10. When is an event-driven serverless pipeline the right choice — and its gotchas?

These cover the bulk of cloud/platform rounds at Amazon, Google, and cloud-data teams.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
