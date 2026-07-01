# DataForge Academy

**Zero to world-class Data Engineer — in plain English.**

A clean, professional, local tutor application that teaches the **entire data
engineering landscape** — from databases and SQL all the way through Python, data
modeling, big data, streaming, the lakehouse, the cloud, DataOps, governance, and
system-design interviews — with every concept explained simply, a real-world
example, key takeaways, an instant-feedback quiz, and a **live SQL playground**.

---

## Run it (two commands)

You need **Python 3.10+**. From this folder:

```bash
pip install -r requirements.txt
python run.py
```

Then open **http://localhost:8000** in your browser.

> Prefer uvicorn directly? `uvicorn app.main:app --port 8000`

---

## What's inside

- **13 tracks, 173 lessons** covering the full DE roadmap end to end:
  Foundations · Databases & SQL · Python · Data Modeling & Warehousing · NoSQL ·
  Big Data & Spark · Pipelines & Orchestration · Streaming · The Lakehouse ·
  Cloud · DataOps · Governance & Security · System Design & Interview Mastery.
  Every track is deep (9–21 lessons): SQL spans SELECT → joins → CTEs → window
  functions → transactions/isolation → indexing & query tuning → normalization →
  views → JSON; Spark covers lazy evaluation, partitions/shuffle, join strategies,
  AQE, Structured Streaming, the Hadoop ecosystem, and Flink/Trino; plus storage
  engines (LSM), Kafka internals, Lambda/Kappa, table formats, cloud warehouses,
  data mesh, MDM, compliance, capacity estimation, and more.
- **40 clean diagrams** — joins, star/snowflake schema, window vs GROUP BY, partitions
  & shuffle, the medallion & lakehouse, CAP, ETL/ELT, streaming windows & watermarks,
  Lambda/Kappa, LSM trees, Kafka, CDC, encryption, data mesh, cache-aside, Delta log,
  and more — rendered inline next to the explanation, and *embedded inside the
  in-depth tutorials* too.
- **Plain-English lessons** — each with *the idea simply*, a *real-world example*,
  *key takeaways*, and a *quiz* with instant, explained feedback.
- **32 "Go deeper" in-depth tutorials**, including full step-by-step guides to
  **PySpark, dbt, Delta Lake, Apache Iceberg, Databricks, CI/CD for data, Data Vault,
  dimensional modeling, data warehousing, data lakes, end-to-end streaming, and
  database internals** — each with code, embedded diagrams, and an "interview check" —
  plus deep-dives on window functions, joins, CTEs, query tuning, watermarks,
  exactly-once, table formats, CAP, capacity estimation, and more.
- **A hands-on exercise in every track (13)** — a real problem with a hint and a
  reveal-able worked solution; SQL exercises open a starter straight in the playground.
- **Printable interview cheat sheet** — a one-click, print-optimized summary of the
  highest-yield facts across all 13 tracks plus rapid-fire Q&A (topbar → 📄 Cheat
  Sheet, or open `static/cheatsheet.html`; Ctrl/Cmd+P to save as PDF).
- **Live SQL Playground** — write real SQL and run it against a sample shop
  database (customers, products, orders, order_items). Runs single queries *and*
  multi-statement scripts (CREATE + INSERT + SELECT, even a money-transfer
  transaction). Every run uses a fresh, throwaway database, so nothing can break.
  Lessons can pre-load a query for you.
- **Progress tracking** — mark lessons complete; your progress is saved in your
  browser and shown as a ring in the top bar and counts per track.
- **Search**, **light/dark theme**, and a clean responsive layout.
- **AI Mentor drawer** — works out of the box, no setup. It answers your questions
  from the course itself (it finds the most relevant lessons and explains them in
  plain English), and knows which lesson you're viewing for context. Add an API
  key to upgrade it to a full AI model (below).

---

## Upgrade the AI mentor to a full model (optional)

The mentor already works offline by answering from the course content. To let it
answer **any** question free-form, set **one** environment variable before starting
the app — **no code changes needed**. The app auto-detects it and grounds the model
in the relevant lessons.

```bash
# OpenAI            (optional: OPENAI_MODEL, default gpt-4o-mini)
setx OPENAI_API_KEY "sk-..."

# Anthropic         (optional: ANTHROPIC_MODEL, default claude-3-5-haiku-latest)
setx ANTHROPIC_API_KEY "sk-ant-..."

# Ollama — local & free, runs on your machine
setx OLLAMA_MODEL "llama3"
```

On macOS/Linux use `export VAR=value` instead of `setx`. Restart the app and the
drawer upgrades automatically; if a model call ever fails, it falls back to the
built-in course answers. All the logic lives in **`app/assistant.py`**.

---

## Add your own lessons

All content lives in **`content/curriculum.json`**. Each lesson is just:

```json
{
  "id": "unique-id",
  "title": "Lesson title",
  "summary": "One-line summary.",
  "concept": "Plain-English explanation (markdown: **bold**, `code`, lists).",
  "example": "A concrete real-world example.",
  "keypoints": ["takeaway 1", "takeaway 2"],
  "tryit": "SELECT ...",            // optional: pre-loads the SQL Playground
  "quiz": [{ "q": "...", "options": ["..."], "answer": 1, "explain": "..." }]
}
```

Want a longer write-up for a lesson? Drop a markdown file at
`content/lessons/<lesson-id>.md` and it appears as a **"Go deeper"** section
automatically.

---

## Project layout

```
dataforge-academy/
  app/
    main.py        FastAPI app + API routes
    sampledb.py    sample SQLite DB for the SQL playground
  content/
    curriculum.json   all tracks, modules, lessons, quizzes
    lessons/          optional deep-dive markdown per lesson
  static/
    index.html · styles.css · app.js   the single-page frontend
    diagrams.js · diagrams2.js         40 inline-SVG concept diagrams
    cheatsheet.html                    printable interview cheat sheet
  run.py · requirements.txt
```

Built as a companion to **SparkQuest** (the hands-on Spark coding app) — DataForge
is the broad, plain-English academy across *all* of data engineering.
