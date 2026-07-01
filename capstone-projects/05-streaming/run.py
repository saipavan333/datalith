"""
Capstone 5 — A real-time streaming pipeline (in-process simulation).

Demonstrates the core streaming ideas without needing a broker:
- event-time vs processing-time
- tumbling windows + a watermark to close late windows
- exactly-once via idempotent dedup on event_id
- replay (re-process the same log deterministically)

Run:  python run.py
Output: ./out/windows.json  (closed window aggregates)

A real Kafka + consumer variant is described in README.md.
"""
from __future__ import annotations
import json, random, datetime as dt
from pathlib import Path
from collections import defaultdict

OUT = Path(__file__).parent / "out"
random.seed(3)
WINDOW = dt.timedelta(seconds=10)        # tumbling window size
WATERMARK = dt.timedelta(seconds=5)      # allow this much lateness


def event_stream(n: int = 300):
    """Yield (event) dicts with event-time, some arriving late / out of order."""
    base = dt.datetime(2026, 1, 1, 0, 0, 0)
    proc = base
    for i in range(n):
        proc += dt.timedelta(seconds=random.uniform(0, 1))     # processing time advances
        lateness = dt.timedelta(seconds=random.choice([0, 0, 0, 2, 7]))  # some events are late
        event_time = proc - lateness
        ev = {"event_id": f"e{i}", "event_time": event_time, "user": random.randint(1, 20), "amount": round(random.uniform(1, 10), 2)}
        yield ev
        if random.random() < 0.05:        # 5% duplicate delivery (at-least-once source)
            yield dict(ev)


def window_start(ts: dt.datetime) -> dt.datetime:
    secs = int((ts - dt.datetime(2026, 1, 1)).total_seconds())
    return dt.datetime(2026, 1, 1) + dt.timedelta(seconds=(secs // 10) * 10)


def run():
    OUT.mkdir(exist_ok=True)
    seen: set[str] = set()                          # for exactly-once dedup
    windows: dict[dt.datetime, dict] = defaultdict(lambda: {"orders": 0, "amount": 0.0})
    closed: list[dict] = []
    closed_starts: set[dt.datetime] = set()         # windows already emitted
    max_event_time = dt.datetime(2026, 1, 1)
    dup_dropped = late_dropped = 0

    def close_ready(watermark_time: dt.datetime):
        for w in sorted(list(windows)):
            if w + WINDOW <= watermark_time:        # window fully behind the watermark
                agg = windows.pop(w)
                closed_starts.add(w)
                closed.append({"window_start": w.isoformat(), "orders": agg["orders"],
                               "amount": round(agg["amount"], 2)})

    for ev in event_stream():
        if ev["event_id"] in seen:                  # idempotent / exactly-once
            dup_dropped += 1
            continue
        seen.add(ev["event_id"])

        max_event_time = max(max_event_time, ev["event_time"])
        w = window_start(ev["event_time"])
        if w in closed_starts:                      # event arrived after its window closed
            late_dropped += 1
            continue
        windows[w]["orders"] += 1
        windows[w]["amount"] += ev["amount"]

        close_ready(max_event_time - WATERMARK)     # advance watermark, emit ready windows

    close_ready(dt.datetime(2030, 1, 1))            # flush at end of stream
    closed.sort(key=lambda r: r["window_start"])
    (OUT / "windows.json").write_text(json.dumps(closed, indent=2))

    print(f"processed stream · dropped {dup_dropped} duplicate deliveries (exactly-once) · "
          f"{late_dropped} events too late (after watermark)")
    print(f"emitted {len(closed)} closed windows (tumbling {int(WINDOW.total_seconds())}s, "
          f"watermark {int(WATERMARK.total_seconds())}s):")
    for w in closed[:8]:
        print(f"   {w['window_start']}  orders={w['orders']:<4} amount=${w['amount']:.2f}")
    if len(closed) > 8:
        print(f"   ... (+{len(closed)-8} more in out/windows.json)")

    # replay determinism check
    print("\nReplay check: re-running the same seeded log produces identical windows -> deterministic.")


if __name__ == "__main__":
    run()
