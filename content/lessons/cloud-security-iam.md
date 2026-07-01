# Security & IAM basics — deep dive

Security is the customer's half of the shared responsibility model — and where most cloud breaches actually happen (public buckets, over-broad permissions). For a data engineer guarding sensitive data, **Identity and Access Management (IAM)** and a few encryption fundamentals are non-negotiable.

@@diagram:iam-model

## IAM — who can do what, to which resources

IAM controls **identities** (users, groups, roles, service accounts) and what **actions** they may perform on which **resources**, via **policies**. The governing principle is **least privilege**: grant only the permissions a task needs — nothing more — so a leaked credential or a bug has minimal blast radius.

```jsonc
// Least-privilege policy: this role can only READ one bucket's data
{ "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::analytics-prod/*" }
```

Scope policies to specific actions and resources (not `*`), prefer groups/roles over per-user grants, and audit access regularly.

## Roles, not access keys

The single most important practical rule:

- **IAM roles** provide **temporary, automatically-rotated** credentials that a compute resource (EC2/Lambda/a job) *assumes*. No long-lived secrets to leak, commit, or rotate by hand.
- **Access keys** are static, long-lived secrets — easily leaked (hard-coded, committed to git) and a top breach vector.

**Best practice: assign roles to compute, never hard-code keys.** For humans, use SSO + short-lived credentials. (This is the same lesson as the secrets-management topic: keep static secrets out of code entirely.)

## Encryption: at rest and in transit

- **At rest** — data encrypted on disk/storage using keys managed by a **KMS** (key management service); enable bucket/database encryption by default. Stolen storage is then useless.
- **In transit** — TLS/HTTPS for every connection so traffic can't be intercepted; private networking (VPC endpoints) keeps it off the public internet.
- **Keys matter more than the algorithm** — AES is unbreakable; leaked or unrotated keys aren't. Protect, rotate, and least-privilege keys in the KMS, separate from the data.

## Defense in depth (layer it)

No single control is enough. Layer: **access control** (IAM, least privilege, RBAC) + **encryption** (KMS at rest, TLS in transit) + **network isolation** (private subnets/VPC endpoints) + **audit logging** (who accessed what) + **governance** (classification, retention). And remember the shared responsibility model: the provider secures the infrastructure; **you** secure data, access, and configuration.

## Cheat sheet

| Control | Rule |
|---|---|
| IAM | least privilege; scope to specific actions/resources |
| Roles vs keys | **roles (temporary)** for compute; never hard-code access keys |
| Humans | SSO + short-lived credentials |
| Encryption | at rest (KMS) + in transit (TLS); protect/rotate keys |
| Network | private subnets / VPC endpoints (no public exposure) |
| Audit | log who accessed what |
| Most breaches | customer misconfig (public buckets, broad IAM) |

## Practice

1. Why are IAM roles preferred over access keys for an application running on EC2?
2. Write the principle (and a rough policy shape) for a job that should only read one S3 bucket.
3. The encryption algorithm is unbreakable but a breach still happened — what was most likely the failure?
