# Data Quality, Governance & Security — quick reference

Make data **trustworthy, secure, compliant, and discoverable**.

## Data quality

- **Six dimensions** → accuracy · completeness · consistency · timeliness · validity · uniqueness.
- Checks at **boundaries** (after ingest, before serving) via dbt tests / Great Expectations / Soda.
- On failure → **quarantine** (side table, good data flows) or **circuit-break** (critical tables, publish nothing).
- Failures are often **silent** (job succeeds, data wrong) → need checks + observability.

## PII & security (defense in depth)

| Layer | Control |
|---|---|
| Access | IAM, least privilege, RBAC/ABAC |
| Encryption | at rest (KMS) + in transit (TLS) |
| Obscure | masking / tokenization |
| Network | private subnets / endpoints |
| Audit | log who accessed what |
| Govern | classification, retention, lineage |

## Access control & masking

- **RBAC** (by role) vs **ABAC** (by attributes — finer/dynamic).
- **Column-level** (hide SSN) + **row-level** (region filter) security → one table, many users.
- **Masking** (hide for display) · **tokenization** (reversible token, use without exposing) · **encryption** (key-protected).
- **Dynamic masking** — masked at query time by role; one copy of data.

## Lineage & catalog

- **Lineage** — where data came from, transforms, dependencies → impact analysis, debugging, audit, trust.
- **Catalog** — searchable inventory (tables, owners, descriptions, lineage, classification, freshness) → discover + trust (DataHub, Amundsen, Unity Catalog).
- Capture lineage **automatically** (parse dbt/SQL, orchestrator metadata).

## Privacy & compliance

- **GDPR** rights: access · **erasure (RTBF)** · portability · rectification · consent. Obligations: lawful basis, minimization, **72h breach notice**.
- **RTBF on a lake** → table format MERGE/DELETE + lineage to find every copy + crypto-shred.
- **Data minimization** — keep only what you need → less to breach.
- **Frameworks**: GDPR (EU privacy) · HIPAA (US health/PHI) · SOC 2 (security audit) · PCI-DSS (cards) · CCPA · ISO 27001.
- **Data residency** — store data within required geographies.

## Encryption & keys

- At rest (KMS) + in transit (TLS). **Envelope encryption** (data key encrypted by master key) → rotate without re-encrypting.
- **Crypto-shredding** → destroy the key to "delete" data on immutable storage.
- **Keys > algorithm**: AES is unbreakable; leaked/unrotated keys aren't. Protect/rotate/audit keys in a KMS.

## MDM (master data management)

Reconcile conflicting records across systems (CRM/billing/support) → **golden record** (one canonical entity) via entity resolution (deterministic + fuzzy matching) + survivorship rules. Prevents double-counting; foundation for trustworthy entity metrics.

## Data mesh

Decentralized: (1) **domain ownership** · (2) **data as a product** · (3) **self-serve platform** · (4) **federated governance**. Scales data by distributing ownership; needs contracts + standards to avoid silos.

## Classification & retention

- **Classify** (public → internal → confidential → restricted) → proportional controls.
- **Retention** — keep per policy (logs 90d, financials 7y) then delete; legal hold pauses deletion.
- **Minimize**: less data = less risk + cost. The safest data is the data you don't keep.

## Interview triggers

- *quarantine vs circuit-break* → side-table vs block-publish.
- *PII layers* → access + encryption + masking + audit.
- *RBAC vs ABAC* + column/row-level security.
- *masking vs tokenization vs encryption*.
- *RTBF on a lake* → MERGE/delete + lineage + crypto-shred.
- *keys > algorithm* → KMS, rotation, least privilege.
- *MDM golden record* → entity resolution + survivorship.
- *data mesh* → 4 principles, domain ownership.
- *classification drives controls*; *minimize retention*.
