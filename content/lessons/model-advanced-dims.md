# Advanced dimension techniques — deep dive

Once you know facts and dimensions, these patterns handle the messy real-world cases. Each solves one specific problem —
recognizing which to reach for is what separates a senior modeler.

@@diagram:advanced-dims

## Role-playing dimensions

One physical dimension used in **multiple roles** in the same fact. An order has `order_date`, `ship_date`,
`delivery_date` — all of which are `dim_date`. Instead of three date tables, you reuse the **single** `dim_date` via
**views or aliases** (one per role).

```sql
fact_orders JOIN dim_date order_d  ON fact.order_date_key  = order_d.date_key
            JOIN dim_date ship_d   ON fact.ship_date_key   = ship_d.date_key
```
*One conformed dimension, several roles.*

## Junk dimensions

A fact often carries several **low-cardinality flags** (`is_gift`, `payment_type`, `order_channel`). Rather than many
tiny dimensions or flags cluttering the fact, combine them into **one "junk" dimension** holding the distinct
combinations.

*Tidies the fact; one small dimension instead of many flags.*

## Degenerate dimensions

A dimension attribute with **no other attributes** — typically a transaction identifier like `order_number` — that you
keep **on the fact itself** rather than in a separate table (there'd be nothing else to put there). It's still a
dimension (you group/filter by it), just "degenerate."

## Bridge tables

For **many-to-many** relationships — e.g. a bank account with **multiple owners**, or a product in multiple categories.
A **bridge table** sits between fact and dimension to resolve the M:N, often with an allocation/weight factor to avoid
double-counting.

```
fact_account ── bridge_account_owner ── dim_customer   (one account, many owners)
```

## Mini-dimensions

When a dimension has a **few rapidly-changing attributes** (e.g. a customer's credit-score band, age band), splitting
those volatile attributes into a **mini-dimension** avoids exploding the main dimension's SCD2 history. The fact
references both the main dim and the mini-dim.

## Cheat sheet

| Technique | Solves |
|---|---|
| Role-playing | same dim used in multiple roles (dates) |
| Junk | many low-cardinality flags → one small dim |
| Degenerate | a lone ID kept on the fact (order_number) |
| Bridge | many-to-many (account ↔ owners) |
| Mini-dimension | rapidly-changing attributes without bloating SCD2 |

## Practice

1. An order has order/ship/delivery dates — which technique, and how is it implemented?
2. You have 5 boolean flags on a fact — what do you do?
3. An account can have several owners — how do you model the M:N without double-counting?
4. Why use a mini-dimension for fast-changing attributes?
