# Amazon S3 for data engineers — hands-on

Buckets, partitioning, lifecycle, security, and S3 Tables — with real commands.

@@diagram:aws-s3-lake

## 1. Objects, keys, and the "there are no folders" truth

S3 stores **objects** under a **bucket** + **key**. The slashes in a key are just characters — engines (Athena, Spark, Spectrum) interpret `col=value/` prefixes as **partitions**.

```bash
aws s3 ls s3://acme-lake/curated/events/dt=2025-03-01/
aws s3 cp local.parquet s3://acme-lake/curated/events/dt=2025-03-01/region=US/part-0.parquet
```

## 2. Partitioning — the #1 cost lever

Partition by what you **filter on most** (usually date first, then a low-cardinality dimension):

```text
s3://acme-lake/curated/events/dt=2025-03-01/region=US/part-*.parquet
                                ^^ partition 1   ^^ partition 2
```

- A query with `WHERE dt='2025-03-01' AND region='US'` reads **only that prefix**.
- **Don't** partition on high-cardinality columns (e.g., `user_id`) — millions of tiny partitions are slower than none.
- Target **128–512 MB** Parquet files; many tiny files = the "small files problem" (per-file overhead dominates).

## 3. Formats: store columnar Parquet

Convert CSV/JSON to **Parquet** (or ORC) with compression (Snappy/ZSTD). Columnar means engines read only the **columns** in the `SELECT`, and column stats let them skip row groups. This stacks with partition pruning.

## 4. Storage classes & lifecycle (match price to access)

```json
// lifecycle.json — raw hot 30d, IA to 90d, Glacier after, expire at 2y
{ "Rules": [{
  "ID": "raw-tiering", "Status": "Enabled",
  "Filter": { "Prefix": "raw/" },
  "Transitions": [
    { "Days": 30, "StorageClass": "STANDARD_IA" },
    { "Days": 90, "StorageClass": "GLACIER" }
  ],
  "Expiration": { "Days": 730 }
}]}
```

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket acme-lake --lifecycle-configuration file://lifecycle.json
```

Unsure of access patterns? Use **S3 Intelligent-Tiering** — it auto-moves objects between tiers.

## 5. Security checklist (do these every time)

- **Block Public Access** = ON at the account and bucket level.
- Grant access with **IAM roles** + a least-privilege **bucket policy** (specific prefixes only).
- **Encrypt**: default **SSE-S3**, or **SSE-KMS** when you need key-level audit/rotation.
- Reach S3 from private subnets via a **VPC gateway endpoint** (no internet path).
- Turn on **CloudTrail data events** / server access logs for auditing.

```json
// bucket policy: deny any unencrypted upload
{ "Effect": "Deny", "Principal": "*", "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::acme-lake/*",
  "Condition": { "StringNotEquals": { "s3:x-amz-server-side-encryption": "aws:kms" } } }
```

## 6. S3 Tables — managed Iceberg

S3 **table buckets** give you **Apache Iceberg** with **automatic** compaction, snapshot expiry, and unreferenced-file cleanup — the maintenance you used to cron yourself.

```bash
aws s3tables create-table-bucket --name acme-analytics
# then query/maintain via the SageMaker Lakehouse / Glue Iceberg REST catalog
# engines (Athena, Spark, Redshift) read it as a normal Iceberg table
```

You get Iceberg's row-level updates, time travel, and schema evolution **without** running your own compaction jobs.

## Scenario — taming a slow, expensive lake

A table is 5 TB of gzipped **JSON**, unpartitioned; Athena queries scan all 5 TB. Fix: a one-time **CTAS** rewrites it to **Parquet partitioned by `dt`** under `curated/`; a **lifecycle** rule tiers `raw/` JSON to Glacier after 90 days; **Block Public Access** + a deny-unencrypted policy close the security gaps. Now `WHERE dt=…` scans a few GB of the right columns — queries drop from minutes to seconds and from dollars to cents, and old raw data costs a fraction to retain.

## Practice

1. Design the S3 key layout for an `orders` table filtered by order date and occasionally by country; pick the partition order and file format.
2. Write a lifecycle rule: hot 14 days, infrequent to 60 days, archive after, delete at 1 year.
3. List four S3 security controls you'd enable on a bucket holding PII and what each prevents.
4. Explain, with the "small files problem," why 10,000 × 1 MB Parquet files query worse than 40 × 256 MB files.
