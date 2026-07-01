# Inmon vs Kimball — two warehouse philosophies — deep dive

There are two foundational philosophies for *how to build* a data warehouse. Knowing both — and that modern stacks
blend them — is a frequent interview question and shapes real platform decisions.

@@diagram:kimball-inmon

## Inmon — top-down (the enterprise data warehouse)

Bill Inmon's approach builds a **normalized (3NF) enterprise data warehouse (EDW)** first — a single, integrated,
non-redundant "source of truth" for the whole organization — and **then** derives subject-specific **dimensional data
marts** (star schemas) from it for analysis.

- **Pros:** highly integrated and consistent; minimal redundancy; a true enterprise-wide model; great governance.
- **Cons:** large upfront effort; slower to deliver first value; needs strong central data management.

```
sources → (ETL) → normalized EDW (3NF, integrated) → dimensional data marts → BI
```

## Kimball — bottom-up (dimensional marts first)

Ralph Kimball's approach builds **dimensional data marts** (star schemas) directly for each business process, unified by
**conformed dimensions** — shared, standardized dimensions (one `dim_customer`, one `dim_date`) reused across marts so
they integrate naturally (the "bus architecture").

- **Pros:** faster to deliver value; business-friendly; incremental; easy for BI.
- **Cons:** without discipline, marts can drift; integration relies on truly conformed dimensions.

```
sources → (ETL) → dimensional marts (stars) sharing CONFORMED dimensions → BI
```

## The core contrast

| | Inmon (top-down) | Kimball (bottom-up) |
|---|---|---|
| Build first | normalized EDW | dimensional marts |
| Integration via | the central 3NF model | conformed dimensions |
| Time to value | slower | faster |
| Redundancy | minimal | some (denormalized dims) |
| Best when | large, governance-heavy enterprise | fast, iterative analytics |

## What modern stacks actually do

The lakehouse/medallion era **blends both**: a raw immutable layer + a cleaned/conformed **silver** layer (Inmon-ish
integrated source of truth) feeding **gold** dimensional marts (Kimball stars) — with **conformed dimensions** reused
across marts. dbt makes this practical: staging (conform) → marts (dimensional), versioned and tested. So the interview
answer is rarely "pick one" — it's "I use a conformed, integrated silver and Kimball-style gold, which is the modern
blend."

## Cheat sheet

| Term | Meaning |
|---|---|
| Inmon | top-down: normalized EDW → marts |
| Kimball | bottom-up: dimensional marts + conformed dims |
| conformed dimension | shared, standardized dim reused across marts |
| modern blend | integrated silver (Inmon-ish) → gold stars (Kimball) |

## Practice

1. One line each: Inmon vs Kimball.
2. What are conformed dimensions and why are they the key to Kimball integration?
3. How does the medallion/lakehouse approach blend the two philosophies?
