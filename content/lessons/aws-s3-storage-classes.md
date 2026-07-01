# Storage classes & lifecycle policies — the complete guide

Storage is a real line item at lake scale, and most data **cools** over time — recent partitions are hot, last year's are rarely touched. S3 lets you pay accordingly through **storage classes** and **lifecycle policies** (or hand it to **Intelligent-Tiering**). This chapter covers the classes, the trade-offs, and how to automate cost control without hurting access.

@@diagram:aws-s3-storage-classes

## 1. The cost lever

Every object sits in a **storage class** that trades **storage price** against **retrieval cost/latency** and **minimum durations**. Match the class to **how often the data is accessed** and you cut cost dramatically while keeping hot data instant.

## 2. The storage classes (hot → cold)

| Class | Latency | Retrieval cost | Min duration | Use |
|---|---|---|---|---|
| **S3 Standard** | ms | none | none | Hot / frequently accessed |
| **Standard-IA** | ms | per-GB fee | 30 days | Warm, accessed ~monthly |
| **One Zone-IA** | ms | per-GB fee | 30 days | Reproducible warm data (single AZ, cheaper, less durable) |
| **Glacier Instant Retrieval** | ms | higher | 90 days | Cold but needs instant access |
| **Glacier Flexible Retrieval** | minutes–hours | restore job | 90 days | Archives, occasional restore |
| **Glacier Deep Archive** | hours | restore job | 180 days | Compliance/long-term, cheapest |

Colder classes have **lower storage cost** but **retrieval fees**, **higher latency**, and **minimum storage durations** (delete early and you still pay the minimum). So colder isn't always cheaper for data you actually read.

## 3. S3 Intelligent-Tiering

**Intelligent-Tiering** automatically moves each object between access tiers (frequent → infrequent → archive) based on its **observed access pattern**, for a small **per-object monitoring fee** and **no retrieval fees** on the standard tiers. It's the **safe default** when access patterns are **unknown or variable** — you don't guess or write rules, and you never pay a retrieval penalty for guessing wrong. Great for large, mixed datasets.

## 4. Lifecycle policies

A **lifecycle configuration** is a set of rules on a bucket/prefix that **transition** and **expire** objects automatically:

```json
{
  "Rules": [{
    "ID": "age-raw",
    "Filter": { "Prefix": "raw/" },
    "Transitions": [
      { "Days": 30,  "StorageClass": "STANDARD_IA" },
      { "Days": 90,  "StorageClass": "GLACIER" }
    ],
    "Expiration": { "Days": 365 },
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
  }]
}
```

Also manage, in **versioned** buckets:
- **NoncurrentVersionTransition / NoncurrentVersionExpiration** — age/delete old versions (silent cost).
- **AbortIncompleteMultipartUpload** — clean up failed large uploads that bill forever.

## 5. Lifecycle vs Intelligent-Tiering

- **Lifecycle** — you **know** the access curve (e.g. raw is cold after 30 days, expire at 365). Deterministic, no monitoring fee, can **expire** data.
- **Intelligent-Tiering** — access is **unpredictable**; let S3 decide per object. No retrieval fees, small monitoring fee, but it **doesn't expire** data (pair with a lifecycle expiration rule if needed).

Often you combine: Intelligent-Tiering for unpredictable zones, explicit lifecycle for raw (transition + expire).

## 6. Visibility

**S3 Storage Lens** and **S3 Inventory** show what you actually have by **class, age, version, and size** — essential to find mis-tiered data, old versions, and incomplete uploads.

## 7. Gotchas

- **Retrieval cost/latency** — colder tiers charge to read and (Glacier Flexible/Deep) take minutes–hours; don't archive data you query.
- **Minimum durations** — deleting IA/Glacier objects early still incurs the minimum charge.
- **Incomplete multipart uploads** accumulate silently — always add an abort rule.
- **Noncurrent versions** in versioned buckets pile up — lifecycle them.
- **Intelligent-Tiering doesn't delete** — add expiration separately if required.
- **Glacier needs a restore step** (Flexible/Deep) before reading — design for it.

## Scenario — cutting storage cost without anyone noticing

A lake kept **everything in Standard forever**; storage was the biggest bill. The team tailors by zone: **raw** (reproducible from source) transitions to **Standard-IA at 30 days**, **Glacier Flexible at 90**, and **expires at 365**; **clean** uses **Intelligent-Tiering** (uneven access); **curated marts** stay **Standard** (queried constantly). They add account-wide rules to **abort incomplete multipart uploads after 7 days** and **expire noncurrent versions**. **S3 Storage Lens** had revealed gigabytes of orphaned multipart parts and old versions — now cleaned. Recent/serving data is still **instant**; cold/raw data costs a fraction; and nobody's queries slowed down because hot data never left Standard/Intelligent-Tiering. Storage spend dropped substantially with a few rules and zero application changes.

## Practice

1. Explain the trade-off every storage class makes and why colder isn't always cheaper.
2. When is Intelligent-Tiering the right default, and what's its one limitation?
3. Write a lifecycle policy that ages raw data IA→Glacier and expires it, plus cleans incomplete uploads.
4. Why must you manage noncurrent versions and incomplete multipart uploads?
5. Design per-zone storage strategy for raw (reproducible), clean (hot 90 days), curated (constant).
6. A bucket's cost rises though no new data is added — what hidden costs do you check?
7. What do Storage Lens / Inventory give you, and how would you use them?
