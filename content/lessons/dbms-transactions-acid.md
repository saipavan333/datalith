# Transactions & ACID — deep dive

A **transaction** is a unit of work that must happen **completely or not at all**. **ACID** is the set of guarantees
that makes transactions safe — and it's why a bank or order system can be trusted.

@@diagram:acid-properties

## The canonical example

```sql
BEGIN;
  UPDATE accounts SET bal = bal - 100 WHERE id = 1;   -- debit
  UPDATE accounts SET bal = bal + 100 WHERE id = 2;   -- credit
COMMIT;   -- both happen, or neither
```

If only the debit ran, $100 would vanish. The transaction makes the pair atomic and durable.

## ACID, one by one

- **Atomicity** — all steps commit, or all roll back. No partial transactions. *(Implemented via the log + rollback.)*
- **Consistency** — a transaction moves the DB from one **valid** state to another, respecting all constraints.
  *(Constraint-violating transactions are rejected/rolled back.)*
- **Isolation** — concurrent transactions don't corrupt each other; the result is as if they ran in some serial order.
  *(Implemented via locks or MVCC; tunable via isolation levels.)*
- **Durability** — once **committed**, the change survives crashes and power loss. *(Implemented via the write-ahead log
  on durable storage.)*

## ACID vs BASE

Many NoSQL stores relax these to **BASE** (Basically Available, Soft state, **Eventual** consistency) to scale out — a
deliberate trade of strict consistency/isolation for availability and horizontal scale. ACID isn't "better"
universally; it's the right choice for **systems of record** where correctness is non-negotiable.

## Cheat sheet

| Letter | Guarantee | Implemented by |
|---|---|---|
| Atomicity | all-or-nothing | log + rollback |
| Consistency | only valid states | constraints + rollback |
| Isolation | concurrent safety | locks / MVCC + isolation levels |
| Durability | survives crashes | write-ahead log |

## Practice

1. A transfer debits one account but not the other — which property is violated?
2. Which property ensures committed data survives a crash, and how?
3. What does BASE trade away, and why would a system choose it?
