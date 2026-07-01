# The 50LPA+ interview loop (how it works)

This bank is built from how data-engineering interviews actually run in 2026 at FAANG, Goldman Sachs and major banks
for senior / 50LPA+ bands. Learn the map first, then drill each round's question set.

@@diagram:de-interview-loop

## The stages, end to end

| Stage | Format | What it tests |
|---|---|---|
| Recruiter screen | 30-60 min call | fit, motivation, band, basic tech background |
| **Technical screen** | CoderPad, ~60 min | **1 SQL + 1 coding** — the first real gate |
| Onsite: SQL | 45-60 min | multi-join, window functions, CTEs, optimization |
| Onsite: Coding/DSA | 45-60 min | Python arrays/strings/trees/graphs/heaps |
| Onsite: Data modeling | 45-60 min | grain, star/snowflake, SCD, late data |
| Onsite: System design | 45-60 min | pipeline/warehouse design + trade-offs |
| Onsite: Behavioral | 45-60 min | STAR; LPs (Amazon); values (Goldman) |
| (+ Big-data/Spark) | 45-60 min | shuffles, skew, joins (common at banks) |

## Timing per company (typical)

- **Google** — recruiter → 1-2 phone screens → onsite of 4-5 rounds (45-60 min). Coding rigor + design; BigQuery/GCP helps.
- **Meta** — recruiter → screen → onsite of 4 technical + 1 behavioral (often one day). **Data modeling weighted most**, via product-sense.
- **Amazon** — recruiter → OA/screen → the loop. **Leadership Principles in every round** (bring 12-15 stories); Bar Raiser.
- **Goldman Sachs** — CoderPad + hard SQL + distributed systems (Spark/Hadoop) + values behavioral.
- **JPMorgan Chase** — recruiter → technical (Python/CS, sometimes Java/concurrency) → 4-5 short onsite rounds + case study + 'why finance'.

## 2026 shifts to prepare for

- Design prompts now include **LLM/RAG pipelines** ("process 10K docs/day with rate limits, retries, cost budgets").
- Interviewers test **architecture trade-off reasoning** and **cloud fluency** over rote definitions.
- Data contracts, lakehouse (Iceberg), and real-time OLAP show up in design discussions.

## How to use this bank

Each round below is a lesson with a difficulty-tagged question set (Easy → Medium → Hard) and **detailed solutions**.
The inline **Interview** panel on each lesson shows real, company-tagged questions. Work the rounds in order, then use
the **prep & cheat sheet** lesson for final review. Mock interview 2-3 times before the loop.
