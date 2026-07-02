# Sequence diagrams — the complete guide

When the question is **"what talks to what, and in what order?"**, you draw a **sequence diagram**: participants as vertical **lifelines**, time flowing **downward**, and **messages as arrows** between them. Where an architecture diagram shows *structure* (what's connected), a sequence diagram shows *behavior* (the ordered interaction) — which is exactly what you need to reason about the distributed, asynchronous systems data engineers build.

@@diagram:dv-sequence

## 1. The notation

- **Lifelines** — one per participant (Client, API, Kafka, Worker, DB), drawn as a box at the top with a vertical line dropping down. The line is that participant's timeline.
- **Messages** — horizontal arrows between lifelines. **Solid** = a call / synchronous request; **dashed** = a return / response or an async message.
- **Time** — strictly **top-to-bottom**. A message drawn lower happens later; vertical position *is* the ordering.
- **Activation bars** (optional) — thin rectangles on a lifeline showing when it's actively processing.

## 2. Structure vs behavior

An architecture box diagram tells you API talks to Kafka talks to a worker. It does **not** tell you the **order**, what's synchronous vs fire-and-forget, or where a response returns. The sequence diagram adds the missing **time axis** — and most distributed-systems bugs (races, wrong ordering, missing acks) live in that time axis.

## 3. Control-flow constructs

- **alt / else** — a branch (cache hit vs miss; success vs error path).
- **loop** — a repeated interaction (poll every minute; retry N times).
- **opt** — an optional step.
- **note** — annotate a condition or an async boundary.

These let one diagram capture the real branching behavior, not just the happy path.

## 4. When data engineers reach for it

- **API / request flows** — trace a request through gateway → service → cache → DB, showing cache-aside logic and where latency accrues.
- **Event-driven pipelines** — producer → topic → consumer → sink, showing acks, async hops, and where a 202 is returned before processing completes.
- **Debugging distributed interactions** — lay out produce/commit/consume/read to expose **ordering and race conditions**.

## 5. Catching race conditions

A sequence diagram forces you to commit to an **exact order**, which is where races hide. Classic example: a service produces an event *and* writes a row; a consumer reads that row when it processes the event. Drawing it top-to-bottom exposes the question: does the **DB write commit before** the event is consumed, or can the **consumer read before the write lands**? If the diagram shows "produce/consume" above "commit", you've found the race — and the fix (transactional outbox, or carry the data in the event) becomes obvious. Time-hiding diagrams (architecture, code) can't surface this.

## 6. Drawing well

Order lifelines to minimize crossing arrows (frequent talkers adjacent); keep time strictly downward; use solid/dashed consistently; annotate async boundaries with a note; and show the **failure/alt path**, not just the success case.

## Gotchas

- **Only the happy path** — real behavior includes errors, retries, timeouts; use alt/loop.
- **Solid vs dashed confusion** — mixing call and return styles makes sync/async unreadable; be consistent.
- **Too many lifelines** — 10 participants is unreadable; focus on the interaction that matters.
- **Ignoring async returns** — forgetting the dashed 202/ack hides that the client didn't wait.
- **No ordering discipline** — if vertical position doesn't reflect time, the diagram lies about sequence.
- **Using it for structure** — it shows behavior over time, not the static component map (that's the architecture diagram).

## Scenario — the "data isn't there yet" bug

A downstream job intermittently reads **missing** data. The team argues in circles until you draw the **sequence diagram**. Lifelines: **OrderService, Kafka, EnrichWorker, DB**. Messages top-to-bottom: OrderService → Kafka (produce `order_created`), Kafka → EnrichWorker (consume), EnrichWorker → DB (read order details) — and separately OrderService → DB (write order details). Laid out in time, the diagram reveals the race: the **event is produced and consumed faster than OrderService commits the order row**, so `EnrichWorker` sometimes reads **before the write lands** → missing data. The picture makes the fix self-evident: either use the **transactional outbox** pattern (write the row and the event in one transaction so the event can't precede the commit) or **embed the order details in the event** so the worker never re-reads the DB. What looked like a flaky, unreproducible bug was a clear ordering gap the moment it was drawn on a time axis — the exact value of a sequence diagram.

## Practice

1. What do lifelines and vertical position represent in a sequence diagram?
2. What's the difference between a solid and a dashed message arrow?
3. How does a sequence diagram differ from an architecture diagram in what it communicates?
4. Which constructs let you show branches and repetition, and give an example of each.
5. Explain how drawing the sequence can expose a race condition between a DB write and an event consumer.
6. Why is showing the failure/alt path (not just the happy path) important?
7. **(Design)** Draw the sequence for a synchronous API read with a cache: Client → API → Cache → DB. Show both a cache **hit** and a cache **miss** (with the DB read and cache backfill) using an alt block, and mark which arrows are calls vs returns.
