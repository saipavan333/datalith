# Privacy & compliance in practice — PII, GDPR, and designing for deletion

Handling personal data is a legal responsibility with real fines, and increasingly an
engineering design constraint baked in from day one. Here's what a data engineer
actually needs to do.

## What counts as PII

**PII** (Personally Identifiable Information) is anything that identifies a person —
directly (name, email, phone, national id) or **indirectly** in combination (a
birth date + postcode + gender can uniquely identify someone). The indirect case
matters: data you think is anonymous can re-identify people when joined with other
data. Treat quasi-identifiers with care, not just obvious fields.

## The rights you must engineer for

Laws like the EU's **GDPR** and California's **CCPA** grant individuals rights that
become concrete engineering requirements:

- **Right to access** — produce everything you hold about a person. Needs you to *find*
  all their data → that's why **lineage** and **PII tagging** matter.
- **Right to erasure** ("right to be forgotten") — actually delete their data on
  request. This is the hard one technically (below).
- **Consent & purpose limitation** — use data only for what the person agreed to, and
  be able to show it.
- **Data minimisation** — collect and keep only what you need; less PII = less risk.

## Why "right to erasure" reshapes architecture

A classic data lake is **append-only** files — you can't easily delete one person's
rows from immutable Parquet. GDPR erasure makes that a liability. The fix is **open
table formats** (Delta, Iceberg, Hudi) that support row-level `DELETE`/`MERGE`, so you
can locate and remove an individual's records across raw and processed tables. "How do
you delete one user from a data lake?" is now a real interview question — and the
answer is table formats + good lineage to find every copy.

## Practical controls engineers implement

- **Tag PII columns** in the catalog so tools and people know what's sensitive.
- **Encrypt** at rest and in transit (mostly provided by the cloud — enable it).
- **Restrict access** with least-privilege RBAC; **mask/tokenize** sensitive fields so
  even authorised users see `****1234` unless they truly need the raw value.
- **Pseudonymize** in analytics: replace direct identifiers with tokens so analysts
  work on behaviour without exposing identities; keep the mapping locked away.
- **Track lineage** so you can answer "where did this person's data flow?" and delete
  every copy.
- **Audit logs** — who accessed which sensitive data, for compliance evidence.

## Data residency

Some laws require data about a country's citizens to **stay in that region**. That
becomes a storage/processing-location constraint (which region your buckets and
clusters live in) and another reason egress and region choices aren't just about cost.

## Privacy by design

The throughline: privacy isn't a feature you bolt on later. You design for it —
minimise what you collect, tag and isolate PII, and build the *ability to find and
delete* a person's data into the architecture from the start. Retrofitting deletion
into an append-only lake is painful; designing for it is cheap.

## Interview check

> *"A user invokes their right to be forgotten. Walk me through deleting them."*

Use lineage/PII tags to find every table holding their data (raw + processed), then
row-level `DELETE`/`MERGE` via a lakehouse table format across all of them, and log
the action. Note that a plain append-only lake can't do this — which is a core reason
table formats exist.
