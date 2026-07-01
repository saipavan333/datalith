# Governance, Quality & Security — interview prep & cheat sheet

Rapid-review for the Governance track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **Data quality** → six dimensions → checks at boundaries → quarantine or circuit-break; failures are silent.
- **PII security** → defense in depth: access (RBAC/ABAC) + encryption + masking + audit + classification.
- **Masking vs tokenization vs encryption** → display / reversible-use / key-protected.
- **Dynamic masking** → masked at query time by role; one copy of data.
- **Lineage + catalog** → provenance, impact analysis, discovery, trust.
- **GDPR** → access/erasure(RTBF)/portability/consent; minimize; 72h breach notice.
- **RTBF on a lake** → MERGE/delete + lineage to find copies + crypto-shred.
- **Keys > algorithm** → KMS, rotation, least privilege; envelope encryption.
- **MDM** → golden record via entity resolution + survivorship.
- **Data mesh** → domain ownership, data-as-product, self-serve, federated governance.

## Mock interview (answer out loud, 60–90s each)

1. How do you implement data quality validation, and quarantine vs circuit-break?
2. What are the layers of data security (defense in depth)?
3. RBAC vs ABAC, and column/row-level security?
4. Masking vs tokenization vs encryption — and what is dynamic masking?
5. What is lineage, and why does a catalog matter?
6. What rights does GDPR grant, and how do you implement right-to-be-forgotten on a lake?
7. Encryption at rest vs in transit, and why are keys more important than the algorithm?
8. What is MDM and the golden record?
9. What is data mesh and its four principles?
10. Why classify data, and how does minimizing retention reduce risk?

These cover the bulk of governance/security rounds at finance, healthcare, and large-platform teams (Goldman Sachs, Amazon, Google).

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
