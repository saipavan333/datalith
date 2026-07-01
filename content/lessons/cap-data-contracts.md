# Capstone: data contracts & shift-left quality

The 2026 industry standard is **shift-left**: catch data problems at the commit/ingestion point, not after dashboards
break. The mechanism is a **data contract** — a machine-readable agreement between a producer and its consumers,
**enforced in CI**. This capstone builds one and wires the enforcement that actually blocks bad changes.

@@diagram:data-contracts

## The shape

```
Producer → contract (schema · SLA · owner) validated in CI →  ✓ pass → consumers (warehouse/BI/ML)
                                                            →  ✗ breaking change → BLOCKED before it ships
```

## 1. What a contract specifies

Schema + types, **semantics** (what each field means), **SLAs** (freshness, volume, allowed null rates), and the
**owner**. The settled 2026 format is **ODCS** (Open Data Contract Standard) as YAML, kept **in the repo** next to the
code so it's versioned and reviewed in PRs.

```yaml
# orders.contract.yaml  (ODCS)
schema:
  - field: order_id    type: string     required: true   unique: true
  - field: amount      type: decimal    required: true   min: 0
  - field: created_at  type: timestamp  required: true
sla:
  freshness: 1h                 # data no older than 1 hour
  max_null_rate: { amount: 0.0 }
owner: orders-team
```

## 2. Enforcement is the point (not documentation)

Most "contract tools" only document. Value comes from **automated enforcement in CI**: when a producer opens a change,
`datacontract-cli` (ODCS) or `buf` (Protobuf) validates the proposed schema/data against the contract and **fails the
build** if it breaks consumers. The cost of a violation drops from a production incident to a red CI check.

```bash
# CI step — runs on every PR, blocks the merge on violation
datacontract test orders.contract.yaml --server prod
# FAIL: column 'amount' became nullable -> breaks consumers   ✗  (build red, merge blocked)
```

## 3. The three building blocks of shift-left

1. **Contracts** — define what "good" means and who owns it (ODCS YAML in repo).
2. **Quality gates** — enforce expectations where data is created/transformed: **dbt tests**, **Great Expectations**,
   **Soda** at runtime; `datacontract-cli` / `buf` at registration time in CI (the cheapest, most mature layer).
3. **Feedback loops** — detect, triage, trace impact (lineage), and continuously improve.

```yaml
# runtime gate (dbt test intent) — complements the CI contract check
models:
  - name: orders
    columns:
      - name: amount
        tests: [not_null, {dbt_utils.accepted_range: {min_value: 0}}]
```

## 4. Start cheap, grow later

Begin with **YAML contracts in the repo + CI validation functions**. You can migrate to a heavier platform later — the
ODCS definitions transfer. Pair this with the governance track: contracts are how "shift-left" becomes real instead of
a slogan.

## Cheat sheet

| Piece | Tool / form | Where it runs |
|---|---|---|
| Contract | ODCS YAML in repo | version-controlled, PR-reviewed |
| Registration gate | datacontract-cli / buf | CI (blocks merge) |
| Runtime gate | dbt tests / Great Expectations / Soda | pipeline run |
| Feedback | lineage + alerts | continuous |

**Rule:** enforce at the source (shift-left); a contract that isn't blocked-on in CI is just documentation.

## Practice

1. What turns a contract from decorative into useful?
2. A producer makes `amount` nullable — with CI enforcement, what happens?
3. Name the three building blocks of shift-left.
4. How do you adopt contracts without buying a platform?
