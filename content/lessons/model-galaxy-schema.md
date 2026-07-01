# Galaxy schema (fact constellation) — deep dive

A **galaxy schema** (a.k.a. **fact constellation**) is what a real enterprise warehouse looks like: **several fact
tables** that **share the same conformed dimensions**. It's simply *multiple stars joined by shared dimensions*.

@@diagram:galaxy-schema

## Why it exists

A business has many processes — **sales, returns, shipments, inventory**. Each becomes its **own fact table** at its own
grain (one row per sale line, one per return, etc.). But they all describe the **same** customers, products, and dates.
Rather than duplicate a `dim_product` inside every star, all facts **reuse one conformed set** of dimensions. The
picture is several stars sharing dimensions — a "constellation."

```
            dim_date        dim_product (shared)        dim_customer
               \             /          \               /
            FACT_SALES                      FACT_RETURNS
```

## Conformed dimensions are the whole point

Because `FACT_SALES` and `FACT_RETURNS` reference the **identical** `dim_product` and `dim_date`, you can ask
cross-process questions with confidence:

```sql
-- returns as a % of sales, by product — only valid because the dims are conformed
select p.category,
       sum(s.revenue)              as sales,
       sum(r.refund)               as returns,
       round(sum(r.refund)/nullif(sum(s.revenue),0), 3) as return_rate
from fact_sales s join dim_product p on s.product_key = p.product_key
full join fact_returns r on r.product_key = s.product_key
group by p.category;
```

A **conformed dimension** means the same dimension (same keys, same attributes, same meaning) is reused everywhere. This
is the heart of Kimball's **bus architecture**.

## When to use it (almost always)

You rarely have just one fact. The practical recipe:

1. Model each business process as its **own star** at the right grain.
2. **Conform** the shared dimensions (one `dim_customer`, one `dim_date`, one `dim_product`) reused across stars.
3. The stars now connect into a **galaxy** — integrated, no duplication, cross-process analysis works.

**The risk:** letting dimensions drift — a slightly different `dim_product` per star. Then cross-process joins are wrong
or impossible. Discipline around conformed dimensions is what keeps a galaxy trustworthy.

## Cheat sheet

| Concept | Key point |
|---|---|
| galaxy / fact constellation | multiple fact tables sharing conformed dimensions |
| each fact | one business process, at its own grain |
| conformed dimension | same dim (keys/attrs/meaning) reused across facts |
| enables | reliable cross-process analysis (sales vs returns) |
| risk | non-conformed dims drifting apart → broken comparisons |

## Practice

1. What makes a schema a galaxy / fact constellation?
2. Why must the shared dimensions be *conformed*?
3. Why model sales and returns as separate facts instead of one big fact?
