"""Pub/Sub delivery stand-in lab: at-least-once redelivery, ack deadlines, and idempotent sinks.

Pub/Sub keeps a message until a subscriber acks it. If the ack does not arrive before the
subscription's ack deadline (10 s default, configurable 10-600 s), the message is redelivered,
so a normal subscription is at-least-once and your sink must tolerate duplicates.
Subscriptions with exactly-once delivery enabled stop redelivery of successfully acked messages
in a region, but your writes to the destination still need an idempotency key.

Sources: https://cloud.google.com/pubsub/docs/subscription-properties
         https://cloud.google.com/pubsub/docs/exactly-once-delivery   (checked 2026-11-03)
The real emulator (gcloud beta emulators pubsub) needs a JDK + gcloud; this simulation runs anywhere.

Run:  python labs/platforms/pubsub_delivery_sim.py
"""
import random

import duckdb

random.seed(7)
ACK_DEADLINE = 10
backlog = [{"message_id": f"m{i:03}", "order_id": 5000 + i, "amount": 100 + i} for i in range(200)]


def deliver(sink_sql, label):
    con = duckdb.connect()
    key = " PRIMARY KEY" if "ON CONFLICT" in sink_sql else ""
    con.execute(f"CREATE TABLE payments (order_id INT, amount INT, message_id VARCHAR{key})")
    queue, deliveries, t = list(backlog), 0, 0
    while queue:
        msg = queue.pop(0)
        deliveries += 1
        processing = random.choice([2, 3, 4, 12])         # 1 in 4 is slow (GC pause, cold cache)
        con.execute(sink_sql, [msg["order_id"], msg["amount"], msg["message_id"]])
        if processing > ACK_DEADLINE:
            queue.append(msg)                              # ack too late -> Pub/Sub redelivers
    rows, total = con.execute("SELECT count(*), sum(amount) FROM payments").fetchone()
    print(f"{label:42} deliveries={deliveries}  rows={rows}  revenue={total}")


expected = sum(m["amount"] for m in backlog)
print(f"200 messages, true revenue = {expected}\n")
deliver("INSERT INTO payments VALUES (?, ?, ?)", "naive INSERT (not idempotent)")
deliver("INSERT INTO payments VALUES (?, ?, ?) ON CONFLICT DO NOTHING", "INSERT ... ON CONFLICT (message_id) DO NOTHING")
print("\nWhat to look for: a slow ack makes Pub/Sub redeliver; the naive sink double-counts revenue,")
print("the idempotent sink keyed on message_id (or a business key) lands exactly the right total.")
print("Note: here a slow message is simply retried until one attempt acks in time. In production you")
print("extend the deadline (modifyAckDeadline / client lease management) or set a dead-letter topic.")
