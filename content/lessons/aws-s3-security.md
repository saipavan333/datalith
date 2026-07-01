# S3 security: policies, encryption & access — the complete guide

S3 holds the entire data lake, so getting its security right is the most consequential thing you do on AWS. Access is governed by **multiple layers that must all agree**, plus **encryption at rest and in transit**, with **access points** and **VPC endpoints** for scale and privacy. This chapter is the full baseline an experienced engineer applies by default.

@@diagram:aws-s3-security

## 1. The access-evaluation model

An S3 request is allowed only if the combined policies say so, with **explicit deny always winning**. The layers:

- **IAM policies** (identity-based) — attached to a user/role: what that principal may do (`s3:GetObject` on which ARNs).
- **Bucket policies** (resource-based) — attached to the bucket: who/what may act on it (allow an account/role, enforce TLS, deny unencrypted PUTs, restrict to a VPC).
- **Block Public Access (BPA)** — an account/bucket **guardrail** that **overrides** any policy that would make data public.
- **Service Control Policies (SCPs)** — org-level guardrails that can deny across accounts.
- **ACLs** — **legacy**; AWS recommends **disabling** them (bucket-owner-enforced) and using policies.

**Effective permission = (IAM allows) AND (bucket policy allows, if present) AND (no explicit deny anywhere) AND (BPA/SCP not blocking).**

## 2. Block Public Access — keep it on

Misconfigured **public buckets** are the classic headline breach. **BPA** blocks public ACLs/policies at the bucket and account level. **Leave it ON** unless you have a deliberate public-hosting use case (and even then, scope it tightly). This one setting prevents most accidental exposure.

## 3. Access points & Access Grants

A single sprawling **bucket policy** for many apps is hard to audit and easy to over-grant. **S3 Access Points** give each application its **own named endpoint with its own policy** (and optional **VPC-only** restriction), scoped to the prefixes it needs. **S3 Access Grants** map IAM principals / directory identities to **prefix-level** access at scale. Together they decompose access into small, auditable, per-app units.

## 4. Encryption at rest

Server-side encryption is **on by default**. Choose:

| Option | Keys | When |
|---|---|---|
| **SSE-S3** | AWS-managed | Simplest; general data |
| **SSE-KMS** | Your **KMS** key | Sensitive/regulated — key-level access control, **rotation**, **CloudTrail audit** of every decrypt |
| **SSE-C** | You supply the key | Rare; you manage keys yourself |
| **DSSE-KMS** | Double KMS | Mandated double encryption |

**Use SSE-KMS for sensitive data**: access then requires permission on **both** the bucket **and** the KMS key, and every decrypt is logged — a strong second gate.

## 5. Encryption in transit

Enforce **TLS/HTTPS**. A bucket policy can **deny** any request where `aws:SecureTransport` is `false`, so plaintext access is impossible.

## 6. Private networking

**VPC gateway/interface endpoints** let EC2/EMR/Lambda reach S3 **without traversing the public internet**. Bucket policies can **require** access via a specific VPC/endpoint (`aws:SourceVpce`), so data is unreachable from outside your network even with valid credentials.

## 7. Auditing & detection

- **CloudTrail** — management and **data events** (object-level GET/PUT) — who did what.
- **S3 server access logs** — request-level logging.
- **S3 Storage Lens** — posture/usage analytics.
- **Amazon Macie** — discovers and classifies **PII/sensitive** data automatically.
- **IAM Access Analyzer** — flags buckets exposed outside the account.

## 8. The baseline (apply by default)

Least-privilege **IAM** + scoped **bucket policy**; **BPA ON**; **default encryption** (KMS for sensitive); **TLS enforced**; access via **access points**; private via **VPC endpoints**; **ACLs disabled**; **CloudTrail data events + Macie** for audit.

## 9. Gotchas

- **A public bucket** from a stray ACL/policy — keep **BPA on**; disable ACLs.
- **Over-broad IAM** (`s3:*` on `*`) — scope actions and resource ARNs.
- **Forgetting KMS key permissions** — a principal with bucket access but no key grant can't read SSE-KMS data (by design; don't "fix" by over-granting the key).
- **Plaintext access** — enforce TLS via policy.
- **One giant bucket policy** — decompose with access points.
- **No audit** — enable CloudTrail data events; you can't investigate what you didn't log.

## Scenario — a PII bucket a leaked key can't drain

A bucket of regulated PII gets defense-in-depth: **Block Public Access ON**; **default SSE-KMS** with a **dedicated CMK** (rotation on) so reads require a **KMS grant** and every decrypt is in **CloudTrail**; a **bucket policy** that **denies non-TLS** requests and restricts access to the corporate **VPC endpoint**; per-team **access points** exposing only each app's prefixes; **least-privilege IAM** roles; **ACLs disabled**; **Macie** scanning for sensitive data and **Access Analyzer** watching for external exposure. Now a single **leaked credential** is nearly useless: it can't read objects without the **KMS key grant**, can't reach the bucket from **outside the VPC**, can't make anything **public**, and every attempt is **logged**. Security is layered so no single failure exposes the lake.

## Practice

1. Describe the access-evaluation model — which layers must agree, and what overrides?
2. Why keep Block Public Access on and disable ACLs?
3. What problem do access points solve, and how?
4. Compare SSE-S3, SSE-KMS, and SSE-C; when is KMS worth it?
5. How do you enforce TLS and VPC-only access via bucket policy?
6. List the controls you'd apply to a regulated PII bucket and the threat each mitigates.
7. What auditing/detection tools would you enable, and what does each catch?
