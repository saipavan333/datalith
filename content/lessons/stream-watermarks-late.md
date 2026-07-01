# Watermarks & late data — the hard part of streaming

Windowing in streaming is easy until you ask one question: *when is a window done?*
Events arrive late and out of order, so you can never be 100% sure you've seen them
all. Watermarks are how streaming systems make a principled decision anyway.

## The problem, concretely

You count "orders per minute" by event time. The 10:00–10:01 window should hold all
orders that *happened* in that minute. But a customer's phone was offline and uploads
its 10:00 order at 10:08. If you closed and reported the 10:00 window at 10:01, that
order is missing. If you wait forever for stragglers, you never report anything.

## The watermark

A **watermark** is the system's moving estimate of "I've now seen all events up to
event-time T." It's typically:

```
watermark = (max event time seen so far) − (allowed lateness, e.g. 5 min)
```

As events flow in, the max event time climbs, dragging the watermark up behind it.
When the watermark passes the **end of a window**, the engine declares that window
complete, emits its result, and can release its memory.

```
event times seen:  ...10:00  10:03  10:06  10:07
max seen = 10:07,  lateness = 5m  →  watermark = 10:02
=> windows ending at or before 10:02 are now finalised
```

## Allowed lateness is a dial

The lateness grace period trades two things:

- **Longer** lateness → you catch more stragglers (**completeness**) but wait longer
  to report and hold window state in memory longer (**higher latency, more memory**).
- **Shorter** lateness → you report fast and cheap, but drop more late events.

There is no universally right value — it depends on how late your sources realistically
run and how much correctness you need.

## What happens to events after the watermark?

An event whose time is *older* than the current watermark is **late data**. You pick
a policy:

- **Drop it** (default in many systems) — simple, slightly lossy.
- **Side output** — route late events elsewhere for inspection or batch correction.
- **Update the result** — if your sink supports it, re-open the window and emit a
  correction (more complex, exactly-once-friendly sinks help here).

## Why event time, not processing time

If you windowed by **processing time** (when the system handled the event), the late
10:00 order would land in the 10:08 window — wrong twice (10:00 undercounts, 10:08
overcounts). Event-time windows + watermarks are what make streaming results match
reality despite messy arrival. This distinction is the most common streaming
interview question.

## Connection to delivery guarantees

Watermarks decide *when* to emit; **checkpoints** + idempotent/transactional sinks
decide *correctness across failures* (exactly-once). They're complementary: a robust
streaming job uses event-time windows with watermarks **and** checkpoints so a crash
mid-window doesn't double-count or lose data.

## Interview check

> *"How does a streaming system know a time window is finished if data can arrive
> late?"*

A watermark — max event time minus an allowed-lateness grace period. When it passes
the window's end, the window is finalised; later events are handled by a late-data
policy. Mentioning the latency-vs-completeness trade-off of the lateness setting
shows real depth.
