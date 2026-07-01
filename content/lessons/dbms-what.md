# What is a DBMS (and why not just files)? — deep dive

A **Database Management System (DBMS)** is software that stores, manages, and serves data to many users and applications
— safely and efficiently. To see *why* it exists, look at what raw **files** can't do.

@@diagram:dbms-vs-files

## The file-system problems a DBMS solves

- **Duplication & inconsistency** — each app keeps its own files, so the same customer lives in many places and drifts
  out of sync.
- **No integrity** — nothing stops a bad value, a wrong type, or an orphaned reference.
- **No concurrency** — two programs writing the same file corrupt it.
- **No querying** — every app re-implements search/scan/sort by hand.
- **No recovery / security** — a crash mid-write loses or corrupts data; no access control.

```
File system:  App A → customers_a.csv   App B → customers_b.csv   (two copies, drift)
DBMS:         App A, App B → one DBMS → customers table          (one copy + guarantees)
```

## What a DBMS adds

| Capability | What it gives you |
|---|---|
| One shared store | no duplication; a single source of truth |
| Integrity constraints | bad/orphaned data rejected automatically |
| Transactions + concurrency | many users work safely at once (ACID) |
| Query language (SQL) | ask for data declaratively, not by hand |
| Security | authentication, authorization, encryption |
| Backup & recovery | survive crashes; restore to a point in time |

In short, a DBMS turns a pile of files into a **reliable, queryable, multi-user system of record**. Every tool in this
course — relational warehouses, lakehouses, even NoSQL stores — is a kind of DBMS, which is why these foundations
underpin everything.

## Cheat sheet

| | Files | DBMS |
|---|---|---|
| Duplication | rampant | eliminated (shared store) |
| Integrity | none | enforced constraints |
| Concurrency | unsafe | transactions + locking/MVCC |
| Query | hand-coded | declarative (SQL) |
| Recovery | none | WAL + backups |

## Practice

1. List three problems with storing app data in plain files.
2. Name four services a DBMS adds over files.
3. Why is a data warehouse considered a kind of DBMS?
