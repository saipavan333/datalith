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
