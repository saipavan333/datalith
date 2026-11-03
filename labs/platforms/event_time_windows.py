"""Event-time windows, watermarks and late data, the way Dataflow (Apache Beam) and Spark
Structured Streaming both reason about them. Pure Python so every step is visible.

Model: 1-minute tumbling windows on event time. The watermark is the engine's estimate that
"no more events older than W will arrive"; here W = max event time seen - allowed delay.
A window's result is emitted when the watermark passes the window end. Events arriving for a
window that was already closed are LATE: dropped (Spark, after the watermark delay) or
handled by Beam's allowed lateness, which re-fires the window with an updated result.

Sources: https://beam.apache.org/documentation/programming-guide/#watermarks-and-late-data
         https://spark.apache.org/docs/latest/streaming/apis-on-dataframes-and-datasets.html (watermarking)

Run:  python labs/platforms/event_time_windows.py
"""
from collections import defaultdict

WINDOW = 60          # seconds
DELAY = 30           # watermark = max_event_time - 30 s
ALLOWED_LATENESS = 60

# (arrival order) event_time_seconds, user, amount. Phones on a train buffer events: some arrive late.
events = [
    (5, "a", 10), (20, "b", 5), (61, "a", 7), (50, "c", 4),       # 50 is out of order but on time
    (95, "b", 3), (130, "a", 8), (40, "d", 9),                      # 40 arrives after the 0-60 window closed
    (185, "c", 2), (70, "e", 6), (300, "a", 1), (10, "z", 99),     # 10 arrives far too late
]


def run(mode):
    sums, closed, max_t, out = defaultdict(int), set(), 0, []
    for t, user, amt in events:
        w = (t // WINDOW) * WINDOW
        wm = max_t - DELAY
        if w in closed:
            if mode == "beam" and wm < w + WINDOW + ALLOWED_LATENESS:
                sums[w] += amt
                out.append(f"  t={t:3} LATE but within allowed lateness -> re-fire window [{w},{w+WINDOW}) = {sums[w]}")
            else:
                out.append(f"  t={t:3} LATE beyond the limit -> dropped (amount {amt})")
            continue
        sums[w] += amt
        max_t = max(max_t, t)
        wm = max_t - DELAY
        for ws in sorted(sums):
            if ws not in closed and wm >= ws + WINDOW:
                closed.add(ws)
                out.append(f"  watermark {wm:3} passed {ws+WINDOW:3} -> emit window [{ws},{ws+WINDOW}) = {sums[ws]}")
    return out


print("Spark-style (late data after the watermark is dropped):")
print("\n".join(run("spark")))
print("\nBeam-style with allowed lateness = 60 s (late data re-fires the window):")
print("\n".join(run("beam")))
print("\nWhat to look for: t=50 is out of order but on time (the watermark had not passed 60 yet);")
print("t=40 and t=70 are late; Beam's allowed lateness keeps them, Spark drops them; t=10 is too late for both.")
