# Surrogate vs natural keys — deep dive

Every dimension needs a **primary key** that facts reference. In analytics you almost always use a **surrogate key**,
not the business's natural key — and knowing *why* is a classic interview question and a real correctness issue.

@@diagram:surrogate-key

## The two kinds of key

- **Natural (business) key** — real-world data from the source: a `customer_id` from the app, an email, an SKU.
- **Surrogate key** — a **meaningless, warehouse-generated integer** (`customer_key = 1, 2, 3…`) with no business
  meaning, assigned when the row enters the dimension.

## Why warehouses use surrogate keys

**1. SCD2 history requires them.** With Type-2 history, one business customer becomes **multiple rows** (one per version
of their attributes). The natural key `customer_id` is no longer unique — you need a surrogate key to identify each
*version*, and the fact points to the *version that was current at the time of the event*.

```
dim_customer(customer_key PK, customer_id, tier, valid_from, valid_to, is_current)
   1, C100, silver, 2024-01-01, 2025-06-01, false
   2, C100, gold,   2025-06-01, null,       true     <- same customer, new version
fact_orders(customer_key FK, ...)   -- points to the right version → correct point-in-time reporting
```

**2. Stability & integration.** Source systems change, merge, or reuse IDs; you might integrate customers from two apps
with clashing `customer_id`s. A surrogate key insulates the warehouse from all that — the fact's key never changes even
if the business key does.

**3. Performance.** A single narrow **integer** join key is smaller and faster to join/index than a wide composite or
string natural key — and fact tables join on it billions of times.

**4. Late-arriving / unknown members.** A surrogate lets you assign a placeholder (`-1 = unknown`) so facts are never
orphaned when the dimension row hasn't arrived yet.

## They coexist

You keep **both**: the surrogate key is the PK that facts join on; the natural key stays as an attribute for lookups,
dedup, and matching to source on each load.

```sql
-- load: look up the current surrogate for this business key, else insert a new one
-- fact gets the surrogate; the natural key remains queryable in the dimension
```

## Cheat sheet

| | Natural key | Surrogate key |
|---|---|---|
| Source | business data (id/email/SKU) | warehouse-generated integer |
| Meaning | real-world | none |
| Fact joins on | ✗ (usually) | ✓ |
| Enables SCD2 | ✗ (not unique per version) | ✓ |
| Performance | wider/string | narrow integer (fast) |

**Rule:** facts reference **surrogate** keys; keep the natural key as a dimension attribute.

## Practice

1. Why can't a natural key be the dimension PK once you add SCD2 history?
2. Give two reasons beyond SCD2 to prefer surrogate keys.
3. How do surrogate keys handle a late-arriving / unknown dimension member?
