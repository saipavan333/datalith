# Object storage (S3 & friends) — the complete guide

If the cloud data platform were a building, **object storage** would be the foundation. The data lake,
the lakehouse, your raw landing zones, your backups — they all sit on object storage (Amazon **S3**,
Google **GCS**, Azure **ADLS/Blob**). It's worth understanding deeply, because its quirks shape how
everything above it is designed.

## 1. Objects, not files

@@diagram:object-storage

You store **objects**: a **key** (the name), the **data** (the bytes), and some **metadata**. Objects live
in **buckets**. The important mental shift: **this is not a filesystem.**

- There are **no real folders** — just a **flat namespace** of keys. `data/2025/05/file.parquet` is one
  key whose slashes are pure convention; tools *display* shared prefixes as if they were folders.
- You **can't edit or append to** an object in place. You **replace the whole object**.

That last point is why lakehouse table formats (Delta, Iceberg) work the way they do — to "update" data
they write **new** files and atomically record the new file set, rather than editing existing files.

## 2. Why it's the foundation

- **Scalable** — effectively **unlimited** capacity. You never provision disks.
- **Durable** — designed for about **11 nines** (99.999999999%) of durability; data is replicated across
  facilities, so you essentially never lose it.
- **Cheap** — far less per GB than block storage or databases.
- **Decoupled from compute** — the data sits in storage **independently of any compute cluster**. Many
  engines (Spark, Trino, Snowflake) read the **same objects**, and storage and compute **scale and bill
  separately**. This decoupling is the defining shift away from Hadoop's coupled storage+compute.

## 3. Storage tiers and lifecycle

Not all data is equally hot, so you trade access speed for cost:

- **Standard** — frequent access, fastest.
- **Infrequent Access** — cheaper storage, pricier/slightly slower reads.
- **Archive / Glacier** — very cheap, retrieval takes minutes to hours.

**Lifecycle rules** automatically move data to colder tiers as it ages, or delete it past a retention
period — one of the biggest, easiest cost levers you have.

## 4. Access and consistency

You access objects via an **API/SDK** (not a mounted drive), with **IAM** controlling permissions. Modern
object stores now offer **strong read-after-write consistency** (S3 since 2020), so an object you just
wrote is immediately readable — which removed a whole class of "the file isn't there yet" pipeline bugs.

## Practice

1. Why do Delta/Iceberg write new files instead of editing existing ones?
2. You have 5 years of logs but only query the last 90 days — how do you cut storage cost?
3. Why are durability and decoupling from compute so important for a data lake?
4. A teammate says "create the folder data/2025/ first" — what's the misconception?

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"How does cloud object storage differ from a filesystem, and why is it the foundation of the data
> lake?"*

It stores **objects** (key + data + metadata) in buckets with a **flat namespace** — no real folders
(slashes are convention), and you **replace** whole objects rather than editing them in place. It's the
data-lake foundation because it's **effectively unlimited, ~11-nines durable, cheap, and decoupled from
compute** — many engines read the same objects, and storage scales and bills independently of any
cluster. Its replace-only nature is why lakehouse table formats write new files plus transactional
metadata, and **storage tiers + lifecycle rules** are a key cost lever for aging data.
