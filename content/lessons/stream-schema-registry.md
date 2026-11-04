# Schema registry, schema evolution and data contracts

Most pipeline outages that aren't infrastructure are a **schema change nobody agreed on**: a producer renames a field, a type flips from number to string, a column quietly starts arriving null. A schema registry stops the mechanical half of that problem at write time. A data contract handles the human half: who owns the data, what it means, and what consumers may rely on.

## The picture to keep in your head

A schema is the **shape of the lunchbox**. Producers pack it, consumers open it. Adding a new compartment that's empty unless filled (a field **with a default**) is fine: old lunchboxes still fit the new opener. Renaming the sandwich compartment "bread slot" means every opener in the school breaks. The registry is the **school rule**: you can't bring a new lunchbox design to class unless the current openers still work with it.

@@diagram:schema-compat

## 1. How a schema registry works

1. A producer serializes a record (Avro, Protobuf or JSON Schema) and asks the registry for the schema's **ID**, registering it under a **subject** (usually `<topic>-value`) if it's new.
2. The registry checks the new schema against earlier versions using the subject's **compatibility rule**. Incompatible → the registration is refused and the producer can't publish.
3. The message carries only the small schema ID, not the whole schema. Consumers fetch the schema by ID (and cache it) to decode.

So a bad change fails **in the producer's CI or at its first publish**, not at 3am in twenty consumers.

## 2. Compatibility modes

| Mode | Guarantee | Safe changes | Upgrade first |
|---|---|---|---|
| **BACKWARD** (Confluent's default) | new schema can read data written with the previous one | delete fields; add fields **with defaults** | consumers |
| **FORWARD** | previous schema can read data written with the new one | add fields; delete fields **with defaults** | producers |
| **FULL** | both | add or delete only fields with defaults | either |
| `*_TRANSITIVE` | as above, against **all** earlier versions, not just the last | | |
| **NONE** | no checks | anything | good luck |

BACKWARD is the default for a reason: Kafka consumers often **rewind** and re-read old data, so the newest reader must handle every older message. For long-retention topics use **BACKWARD_TRANSITIVE**, since data from version 1 may still be in the topic when version 7 ships.

Changes that are never safe without a migration: **renaming** a field (Avro aliases help in some readers, but treat it as add-new + deprecate-old), and **changing a type** (except Avro's allowed promotions like `int` → `long`).

## 3. Schema evolution in the lakehouse

Table formats evolve too. Iceberg tracks columns by **ID**, so add, drop, rename and reorder are metadata-only, and safe type widening (`int` → `long`, `float` → `double`) is allowed. Delta supports adding columns on write (`mergeSchema`) and column mapping for renames and drops. The lake lesson's lab shows an Iceberg `ADD COLUMN` rewriting zero files. The rule for consumers is the same as on Kafka: **additive changes with defaults are cheap; renames and type changes are migrations**.

## 4. Data contracts: the human half

A registry knows the shape. It doesn't know that `amount` is in paise not rupees, that `status='void'` is new, or that the table must be fresh by 07:00. A **data contract** is an agreement, kept in version control next to the producer's code, that covers:

- **Schema**: fields, types, nullability, keys (and the compatibility rule).
- **Semantics**: units, allowed values, what a row means ("one row per payment attempt, not per payment").
- **Quality rules**: `amount >= 0`, `order_id` unique, null rate under 0.1%.
- **Service levels**: freshness (by 07:00 IST), completeness, support hours.
- **Ownership**: the producing team, an on-call contact, and the change process (deprecation notice, version bump).

Enforcement is what makes it a contract instead of a wiki page:

- **Producer CI** runs the registry compatibility check and the contract's schema diff on every pull request.
- **At ingestion**, records that break rules go to a **dead-letter / quarantine** table instead of the main table, with an alert to the producer.
- **In the warehouse**, dbt model contracts (`contract: {enforced: true}`) and data tests make the build fail if the shape drifts.

An example, in the style of the Open Data Contract Standard (field names simplified for teaching):

```yaml
dataset: payments.payment_attempts
version: 2.1.0
owner: payments-platform@company.example
schema:
  - {name: attempt_id, type: string, required: true, unique: true}
  - {name: amount_minor, type: long, required: true, description: "amount in paise (1 INR = 100)"}
  - {name: currency, type: string, required: true, allowed: [INR, USD, AED]}
  - {name: status, type: string, allowed: [initiated, succeeded, failed]}
quality:
  - "amount_minor >= 0"
  - "null_rate(status) < 0.001"
sla: {freshness: "by 07:00 Asia/Kolkata daily", support: "business hours"}
compatibility: BACKWARD_TRANSITIVE
```

## 5. Worked example: 120 topics, 40 producer teams

A bank streams **120 Kafka topics** from 40 teams into a lakehouse; 300 downstream jobs read them. Last quarter, 7 incidents traced to schema changes (two type flips, four renames, one new non-null field).

1. **Registry on every topic** with `BACKWARD_TRANSITIVE` (topics keep 30 days; consumers replay). Serialization in Avro or Protobuf, never schemaless JSON.
2. **Shift the check left**: a CI step in each producer repo calls the registry's compatibility endpoint for the changed schema. A rename now fails the producer's pull request, not 40 consumer jobs.
3. **Contracts for the 25 tier-1 datasets** (payments, ledger, KYC) with owners and freshness SLAs; quality rules enforced at ingestion with a quarantine table and an alert to the owning team.
4. **Breaking changes follow a process**: new field or new topic version (`payments.v3`), dual-write for a migration window, consumers move, old version retired with a date.
5. Outcome to aim for: schema incidents move from "found by a broken dashboard" to "found by a failing pull request".

## 6. Hands-on lab: real Avro resolution and a compatibility gate

Needs `pip install fastavro` (about 1 MB). The lab writes a record with one schema version and reads it with another using Avro's own resolution rules, then runs a tiny BACKWARD gate like a registry would. Run `python labs/stream-schema-registry.py`.

```python
"""Lab: schema evolution with REAL Avro schema resolution, plus a tiny compatibility gate.
Needs:  pip install fastavro
A schema registry's compatibility check boils down to: can a reader with schema X decode data
written with schema Y? fastavro does the same resolution Avro readers do, so we can just try it.
"""
import io
from fastavro import parse_schema, schemaless_reader, schemaless_writer

def rec(*fields): return {"type": "record", "name": "Order", "fields": list(fields)}
F = lambda name, typ, **kw: {"name": name, "type": typ, **kw}

V1 = rec(F("order_id", "long"), F("amount", "double"))
V2 = rec(F("order_id", "long"), F("amount", "double"), F("currency", "string", default="INR"))
V3 = rec(F("order_id", "long"), F("amount", "double"), F("coupon", "string"))             # no default
V4 = rec(F("order_id", "long"), F("total", "double"))                                      # renamed
V5 = rec(F("order_id", "long"), F("amount", "string"))                                     # type change
SAMPLE = {"order_id": 1001, "amount": 499.0, "currency": "USD", "coupon": "DIWALI", "total": 499.0}

def can_read(reader, writer):
    """Write a record with `writer`, read it back with `reader`. True if Avro can resolve them."""
    w = parse_schema(writer)
    buf = io.BytesIO()
    row = {f["name"]: SAMPLE[f["name"]] for f in writer["fields"]}
    if writer is V5: row["amount"] = "499.00"                      # v5 stores amount as text
    schemaless_writer(buf, w, row)
    buf.seek(0)
    try:
        return True, schemaless_reader(buf, w, parse_schema(reader))
    except Exception as e:
        return False, type(e).__name__

print(f"{'change from v1':30s} | {'new reader, old data (BACKWARD)':32s} | old reader, new data (FORWARD)")
for label, new in [("v2: add currency WITH default", V2), ("v3: add coupon, NO default", V3),
                   ("v4: rename amount -> total", V4), ("v5: amount double -> string", V5)]:
    b_ok, b_val = can_read(new, V1)
    f_ok, f_val = can_read(V1, new)
    show = lambda ok, v: (f"OK   reads {sorted(v)}" if ok else f"FAIL {v}")
    print(f"{label:30s} | {show(b_ok, b_val):32s} | {show(f_ok, f_val)}")
    if label.startswith("v2"): print(f"{'':30s} |   old row read with v2 gets currency={b_val['currency']!r} (the default)")

def register(history, candidate, mode="BACKWARD"):
    """What a registry does on POST /subjects/<s>/versions with a compatibility rule."""
    last = history[-1]
    checks = {"BACKWARD": [can_read(candidate, last)[0]],
              "FORWARD": [can_read(last, candidate)[0]],
              "FULL": [can_read(candidate, last)[0], can_read(last, candidate)[0]]}[mode]
    if all(checks): history.append(candidate); return f"registered as version {len(history)}"
    return "REJECTED (409 incompatible)"

print("\nRegistry gate with compatibility = BACKWARD (Confluent's default):")
subject = [V1]
for label, cand in [("v2 add field with default", V2), ("v3 add field without default", V3), ("v5 change type", V5)]:
    print(f"   {label:30s} -> {register(subject, cand)}")
```

Output from a real run on 2026-11-03 (fastavro 1.13.1):

```text
change from v1                 | new reader, old data (BACKWARD)  | old reader, new data (FORWARD)
v2: add currency WITH default  | OK   reads ['amount', 'currency', 'order_id'] | OK   reads ['amount', 'order_id']
                               |   old row read with v2 gets currency='INR' (the default)
v3: add coupon, NO default     | FAIL SchemaResolutionError       | OK   reads ['amount', 'order_id']
v4: rename amount -> total     | FAIL SchemaResolutionError       | FAIL SchemaResolutionError
v5: amount double -> string    | FAIL SchemaResolutionError       | FAIL SchemaResolutionError

Registry gate with compatibility = BACKWARD (Confluent's default):
   v2 add field with default      -> registered as version 2
   v3 add field without default   -> REJECTED (409 incompatible)
   v5 change type                 -> REJECTED (409 incompatible)
```

What to look for:

- **v2** (field with default) passes both directions, and an old row read with v2 gets `currency='INR'`: the default fills the gap.
- **v3** (field without default) passes FORWARD but fails BACKWARD: a new reader can't invent a value for old rows. Under the default rule it's rejected.
- **Rename (v4) and type change (v5) fail both ways.** These need a migration, not a schema bump.

To try a real registry (needs Docker): run Confluent's or Apicurio's registry image, then `POST /compatibility/subjects/<subject>/versions/latest` with a candidate schema to get `{"is_compatible": false}` back. Follow the vendor's current quickstart for the image and port.

## 7. Gotchas

- **JSON without a schema** gives you no gate at all. If you must use JSON, register JSON Schema and validate at ingestion.
- **Defaults are part of the contract.** Changing a default silently changes what old rows read as.
- **Enums are sneaky.** Adding an enum symbol breaks old readers in Avro unless they declare a default symbol.
- **Transitive matters with replay.** Plain BACKWARD only checks against the last version; a consumer replaying 30 days may meet version 1.

## Sources

- Confluent Schema Registry, schema evolution and compatibility (types, default BACKWARD, upgrade order): https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html
- Apache Avro specification, schema resolution: https://avro.apache.org/docs/current/specification/
- Apache Iceberg spec, schema evolution and column IDs: https://iceberg.apache.org/spec/
- dbt model contracts: https://docs.getdbt.com/docs/mesh/govern/model-contracts
- Open Data Contract Standard (Bitol): https://bitol-io.github.io/open-data-contract-standard/
- fastavro docs: https://fastavro.readthedocs.io/
