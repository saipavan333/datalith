# The CAP theorem — the most-asked distributed-systems question

CAP comes up in almost every senior data interview, and most people garble it. Get
the precise statement right and you'll stand out.

## The statement

When a distributed system is **partitioned** (the network drops messages between
nodes — which *will* happen), it can guarantee at most **one** of:

- **Consistency (C)** — every read sees the most recent write (all nodes agree).
- **Availability (A)** — every request gets a (non-error) response.

You cannot have both *during a partition*. The "P" (partition tolerance) isn't really
optional — networks fail — so the real choice in practice is **CP vs AP**.

## The precise version (say this in interviews)

"CAP says that **in the presence of a network partition**, you must choose between
consistency and availability. When the network is healthy, you can have both. So
systems are really characterised by what they sacrifice **when a partition occurs**."

That "during a partition" qualifier is what most people miss — and what interviewers
listen for.

## CP vs AP, with examples

```
              Partition happens...
CP system  →  refuse some requests to stay correct   (banking, inventory counts)
AP system  →  answer anyway, reconcile later          (shopping cart, social feed)
```

- **CP** (choose consistency): if nodes can't agree, the system returns errors or
  blocks rather than serve possibly-stale data. Example: a system requiring a quorum
  for writes. Right when correctness beats uptime — money, stock levels.
- **AP** (choose availability): nodes keep answering with their local view and
  reconcile when the partition heals (**eventual consistency**). Right when uptime
  beats perfect freshness — a like count, a product page.

## Eventual consistency (the AP trade-off)

AP systems converge to a consistent state *eventually*, once nodes can talk again.
For a social feed or cart, a few seconds of staleness is fine. Techniques like
**conflict resolution** (last-write-wins, version vectors, CRDTs) decide how
divergent copies merge. The mental model: "you'll see the right answer soon, just
maybe not this millisecond."

## PACELC — the grown-up extension

CAP only describes behaviour *during* a partition. **PACELC** adds the normal case:
"if Partition, choose A or C; **Else** (normal operation), choose **L**atency or
**C**onsistency." Even with no partition, keeping all replicas perfectly in sync
costs latency, so systems also trade consistency for speed in everyday operation.
Mentioning PACELC signals you understand CAP's limits.

## Where real databases sit

- **CP-leaning:** HBase, MongoDB (default), traditional RDBMS clusters, ZooKeeper.
- **AP-leaning:** Cassandra, DynamoDB, Riak (tunable consistency).
- Many modern stores are **tunable** — you set the consistency level per request
  (e.g. Cassandra's `QUORUM` vs `ONE`), choosing CP or AP behaviour query by query.

## Interview check

> *"Explain CAP and which you'd pick for a shopping cart vs a bank ledger."*

State CAP precisely (the choice is *during a partition*). Cart → **AP** (stay
available, reconcile; a brief stale view is fine). Bank ledger → **CP** (never serve
wrong balances, even if that means refusing requests). Bonus: mention eventual
consistency and tunable consistency levels.
