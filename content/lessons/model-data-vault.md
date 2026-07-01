# Data Vault in depth

Data Vault is a modeling method built for **agility, scale, and auditability** when
you integrate many source systems that change often. It separates *structure* from
*detail* so you can add sources without reworking what exists. Here's the full method.

## 1. The three building blocks

Everything is one of three table types:

```
        ┌──────────┐         ┌──────────┐
        │   HUB    │◄───────►│   HUB    │     Hubs  = business keys
        │ customer │  LINK   │  order   │     Links = relationships
        └────┬─────┘         └────┬─────┘     Sats  = attributes + history
             │                    │
        ┌────▼─────┐         ┌────▼─────┐
        │   SAT    │         │   SAT    │
        │ cust det │         │ ord det  │
        └──────────┘         └──────────┘
```

- **Hub** — the unique list of a **business key** (e.g. `customer_id`, an order
  number). Just the key, a hash of it, a load timestamp, and the source. Stable
  forever.
- **Link** — a **relationship** between hubs (customer ↔ order). Holds the hash keys
  of the hubs it connects, plus load metadata.
- **Satellite** — the **descriptive attributes** and **all their history**
  (timestamped). Hangs off a hub or link. This is where change is tracked.

The point: **keys/relationships (hubs/links) are separated from descriptive detail
(satellites)**, so each can change independently.

## 2. Why this design? Agility

When a new source or attribute appears, you don't alter existing tables — you just
**add a new satellite** (or hub/link). Existing structures are untouched, so the model
grows without expensive refactors. That's the core promise: integrate fast, change
safely.

## 3. Business keys & hash keys

Hubs are built on **business keys** (the natural identifiers the business uses). To
join efficiently and load in parallel, Data Vault hashes the business key into a
**hash key** (e.g. MD5/SHA of `customer_id`), used as the surrogate across hubs,
links, and satellites. Hashing lets you compute keys independently in each loader
without lookups — enabling massively parallel loads.

## 4. Insert-only & auditability

Data Vault is **insert-only**: you never update or delete; new versions are appended
with load timestamps and a record source. This gives a complete **audit trail** —
you can always see what was known, when, and from where — which is exactly what
regulated industries (banking, healthcare) need.

## 5. Raw Vault vs Business Vault

- **Raw Vault** — data loaded **as-is** from sources into hubs/links/sats, with no
  business logic. The auditable source of truth.
- **Business Vault** — derived structures (computed satellites, applied rules) built
  *on top of* the raw vault for convenience, without losing the raw record.

## 6. Query helpers: PIT and Bridge tables

Querying raw hubs/links/sats requires many joins, so Data Vault adds helper tables:

- **PIT (Point-In-Time)** tables pre-join a hub with its satellites' versions at given
  times, so "what did this customer look like on date X" is fast.
- **Bridge** tables pre-join across multiple links/hubs to simplify navigating
  relationships.

These make the otherwise join-heavy vault practical to query.

## 7. The full architecture

Data Vault is usually a **middle integration layer**, not the consumption layer:

```
sources → STAGING → RAW VAULT (hubs/links/sats) → BUSINESS VAULT
        → information marts (Kimball star schemas) → BI
```

You integrate and audit in the vault, then build **dimensional marts** (star schemas)
on top for analysts — Data Vault for integration, Kimball for consumption.

## 8. When to use it (and when not)

**Use it** for large enterprises integrating many changing sources where
auditability and agility matter (finance, healthcare, insurance). **Avoid it** for
small/simple warehouses — the many tables and complex queries are overkill; a plain
Kimball star schema is simpler and faster to deliver. Knowing *when not to* use Data
Vault is as important as knowing the method.

## 9. Data Vault vs Inmon vs Kimball

- **Kimball** — dimensional marts, fast to deliver, business-friendly (consumption).
- **Inmon** — normalized enterprise warehouse, integrated source of truth.
- **Data Vault** — agile, auditable integration layer for many changing sources,
  feeding Kimball marts.

They're complementary layers, not strictly rivals — many modern stacks use a vault to
integrate and Kimball to serve.

## Interview check

> *"What are hubs, links, and satellites, and why split data this way?"*

Hubs hold business keys, links hold relationships, satellites hold descriptive
attributes + history. Separating structure (hubs/links) from detail (satellites), with
insert-only loads and hash keys, lets you add new sources/attributes without reworking
existing tables and gives a full audit trail — ideal for large, regulated, fast-
changing environments, usually feeding Kimball marts for consumption.
