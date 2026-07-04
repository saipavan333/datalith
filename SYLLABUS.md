# Datalith — Full Syllabus

_27 tracks · 148 modules · 546 lessons · 472 deep-dive tutorials · 1601 practice problems · 1389 quiz questions · 506 lessons with diagrams_


Every lesson has a plain-English concept, a worked example, key points, a quiz, and practice problems with full solutions (SQL lessons include a live in-browser SQL playground). Lessons marked 🖼 include a diagram; lessons marked 📖 have a deep-dive tutorial under `content/lessons/`.

> This file is generated from `content/curriculum.json` by `scripts/gen_syllabus.py` — do not hand-edit; re-run the script after changing the curriculum.


## 1. 🧱 Foundations of Data
_11 lessons — What data engineering really is, and the raw ingredients: bytes, files, and formats._

### Getting your bearings

- **What is a Data Engineer?** (9 min · 4 practice) 🖼 📖 — The role that builds and operates the systems moving and shaping data — how it differs from data scientists and analysts, and what skills it spans.
- **Structured, semi-structured & unstructured data** (9 min · 4 practice) 🖼 📖 — The three shapes of data — tables, JSON/logs, and text/images — how they differ, and how data engineers handle each.
- **Files & formats — CSV, JSON, Parquet** (10 min · 4 practice) 🖼 📖 — Why the file format you pick (row-based CSV/JSON vs columnar Parquet) hugely affects analytics speed, cost, and size.

### How data really works

- **Bits, bytes & character encodings** (9 min · 4 practice) 🖼 📖 — The physical units of data and how text becomes bytes — bits/bytes, ASCII vs UTF-8, and why encoding mismatches cause garbled data.
- **OLTP vs OLAP — two very different jobs** (10 min · 4 practice) 🖼 📖 — The fundamental split between transactional systems (run the business) and analytical systems (understand the business) — and why they're built oppositely.
- **The data lifecycle — source to insight** (9 min · 4 practice) 🖼 📖 — The end-to-end journey of data through a platform — generate, ingest, store, transform, serve, analyze — and how every track in this curriculum maps to a stage.
- **Data quality — the six dimensions** (10 min · 4 practice) 🖼 📖 — What makes data trustworthy: the six dimensions of quality, how to measure them, and why quality is foundational to every data decision.

### Bytes, formats & systems

- **Compression — gzip, Snappy, Zstd & columnar** (9 min · 4 practice) 🖼 📖 — Why and how data is compressed: the ratio-vs-speed trade-off, common codecs, splittability, and why columnar formats compress so well.
- **Serialization formats — Avro, Protobuf, JSON** (9 min · 4 practice) 🖼 📖 — How data structures become bytes for storage/transmission: text vs binary, schema vs schemaless, and when to use JSON, Avro, or Protobuf.
- **Distributed systems — the basics every DE needs** (11 min · 4 practice) 🖼 📖 — Why data systems span many machines and the core ideas that follow: partitioning, replication, consistency, fault tolerance, and the network as the bottleneck.

### Interview prep

- **Foundations interview prep & cheat sheet** (15 min · 2 practice) 📖 — Consolidated rapid-review for the whole Foundations track: a master cheat sheet, every high-frequency interview question with model answers, and a mock-interview warm-up.


## 2. 🗃️ Database Systems (DBMS)
_11 lessons — How database management systems actually work — types, architecture, transactions/ACID, concurrency, recovery, storage, and query processing. The CS foundations under every data tool._

### DBMS foundations

- **What is a DBMS (and why not just files)?** (11 min · 3 practice) 🖼 📖 — A DBMS manages data for many users and apps with integrity, concurrency, and querying — solving everything raw files can't.
- **Types of DBMS** (12 min · 3 practice) 🖼 📖 — Relational, document, key-value, column-family, graph, hierarchical/network, NewSQL, time-series/vector — what each is and where it fits.
- **DBMS architecture & components** (13 min · 3 practice) 🖼 📖 — Inside a DBMS: the query processor, storage engine, transaction manager, buffer pool, and catalog — and how a query flows through them.
- **Three-schema architecture & data independence** (11 min · 3 practice) 🖼 📖 — External, conceptual, and internal levels — and why separating them lets you change storage or logical design without breaking apps.

### Transactions & reliability

- **Transactions & ACID** (12 min · 3 practice) 🖼 📖 — A transaction is an all-or-nothing unit of work; ACID (atomicity, consistency, isolation, durability) is what makes it safe.
- **Concurrency control & isolation levels** (13 min · 3 practice) 🖼 📖 — How a DBMS lets many transactions run at once without corruption — locks vs MVCC, the read anomalies, and the isolation levels that trade safety for speed.
- **Recovery & write-ahead logging** (11 min · 3 practice) 🖼 📖 — How a DBMS survives crashes: the write-ahead log, REDO/UNDO, and checkpoints — the mechanism behind durability and atomicity.

### Storage & queries

- **Storage & indexing** (12 min · 3 practice) 🖼 📖 — Pages, the buffer pool, and indexes (B-tree, hash) — how a DBMS lays out data and finds rows fast.
- **Query processing & optimization** (12 min · 3 practice) 🖼 📖 — How SQL becomes a fast execution plan: parsing, the optimizer's cost-based plan choice, and why the same query has many possible plans.
- **Users, security & the DBA** (10 min · 3 practice) 🖼 📖 — Authentication, authorization (GRANT/roles), the catalog, backups, and what a database administrator actually does.

### Interview prep

- **DBMS interview prep & cheat sheet** (10 min · 3 practice) 📖 — The DBMS fundamentals interviewers test — ACID, isolation levels, indexing, normalization basics, architecture — on one page.


## 3. 🧮 RDBMS & the Relational Model
_10 lessons — The relational model in depth — relations, keys, integrity, relational algebra, ER design, normalization, and how real RDBMSs implement ACID. The theory that makes SQL make sense._

### The relational model

- **The relational model — relations, tuples, domains** (11 min · 3 practice) 🖼 📖 — A table is a relation: a set of tuples over typed attributes. The simple math that underlies every SQL database.
- **Keys — identifying rows & linking tables** (12 min · 3 practice) 🖼 📖 — Super, candidate, primary, composite, and foreign keys — how relations identify rows and connect to each other.
- **Integrity constraints** (10 min · 3 practice) 🖼 📖 — Entity, referential, and domain integrity — the rules an RDBMS enforces so data stays correct automatically.
- **Relational algebra — the operators behind SQL** (12 min · 3 practice) 🖼 📖 — Select, project, join, union, intersect, difference, product, rename — the operations SQL compiles down to.

### Designing relational schemas

- **ER modeling → relational mapping** (12 min · 3 practice) 🖼 📖 — Entity-Relationship diagrams (entities, relationships, attributes, cardinality) and how to turn them into tables with keys.
- **Normalization — 1NF to BCNF** (13 min · 3 practice) 🖼 📖 — Removing redundancy and anomalies step by step: 1NF, 2NF, 3NF, BCNF — what each fixes, with examples.

### RDBMS in practice

- **How an RDBMS implements ACID** (12 min · 3 practice) 🖼 📖 — Inside a real RDBMS: transactions, isolation levels, MVCC vs locking, and the WAL — how the theory becomes a working engine.
- **Indexes & join algorithms** (11 min · 3 practice) 🖼 📖 — How RDBMSs find rows fast (B-tree indexes) and combine tables (nested-loop, hash, merge joins).
- **RDBMS vs NoSQL — choosing the right store** (11 min · 3 practice) 🖼 📖 — When the relational model is the right choice and when NoSQL/NewSQL fits — by data shape, consistency, scale, and access pattern.

### Interview prep

- **RDBMS interview prep & cheat sheet** (10 min · 3 practice) 📖 — The relational-model essentials interviewers probe — keys, normalization, integrity, relational algebra, ACID internals — on one page.


## 4. 🗄️ Databases & SQL
_28 lessons — The relational model and SQL — the single most important skill in data engineering. Practice live in the SQL Playground._

### Querying single tables

- **The relational model & how a query runs** (12 min · 3 practice) 🖼 📖 — Tables, rows, columns, keys and NULL; SQL's sublanguages; and the logical order a query is actually evaluated in.
- **SELECT — columns, expressions, aliases & DISTINCT** (11 min · 3 practice) 🖼 📖 — Choose and compute columns: column lists vs *, arithmetic & string expressions, AS aliases, literals, and DISTINCT.
- **Sorting & limiting — ORDER BY, LIMIT, top-N & pagination** (10 min · 3 practice) 🖼 📖 — Order results by one or many keys, control NULL placement, take the top N, and paginate with LIMIT/OFFSET (and why keyset paging scales better).
- **Filtering rows — WHERE, IN, BETWEEN, LIKE & NULL** (12 min · 4 practice) 🖼 📖 — Every way to keep the rows you want: comparison & logical operators with precedence, IN, BETWEEN, LIKE patterns, and the NULL/three-valued-logic traps.
- **Aggregates & GROUP BY** (12 min · 3 practice) 🖼 📖 — Summarize rows into groups: COUNT/SUM/AVG/MIN/MAX, COUNT(*) vs COUNT(col) vs COUNT(DISTINCT), grouping by one or many columns, and how NULLs behave.
- **HAVING — filtering groups (WHERE vs HAVING)** (10 min · 3 practice) 🖼 📖 — Filter aggregated groups with HAVING, understand exactly why it differs from WHERE, and combine WHERE + GROUP BY + HAVING in the right order.

### Combining tables

- **Joins — combining tables on a key** (13 min · 3 practice) 🖼 📖 — Why data lives in many tables and how JOIN stitches it back: the join key, ON vs USING, multi-table chains, join-then-aggregate, and the fan-out (grain) trap.
- **Join types — INNER, LEFT/RIGHT/FULL, CROSS, SELF & anti-joins** (13 min · 3 practice) 🖼 📖 — Pick the right join: INNER vs the OUTER joins (and their NULLs), CROSS products, SELF joins, and the semi/anti-join patterns for 'has/has-no match'.
- **Set operations — UNION, INTERSECT & EXCEPT** (9 min · 3 practice) 🖼 📖 — Stack and compare whole result sets vertically: UNION vs UNION ALL, INTERSECT, EXCEPT, the column-compatibility rules, and the dedup cost.
- **Subqueries — scalar, IN, EXISTS & correlated** (12 min · 3 practice) 🖼 📖 — Queries inside queries: scalar subqueries, IN/ANY/ALL, derived tables in FROM, and correlated EXISTS/NOT EXISTS — plus when to prefer a join or CTE.
- **CTEs — WITH clauses & recursion** (12 min · 3 practice) 🖼 📖 — Name subquery results with WITH for readable, reusable, top-to-bottom queries — chain multiple steps, and recurse over hierarchies and sequences.

### Analytic SQL

- **Window functions — OVER, PARTITION BY & ranking** (14 min · 3 practice) 🖼 📖 — Compute across related rows without collapsing them: the OVER clause, PARTITION BY, and the ranking family (ROW_NUMBER, RANK, DENSE_RANK, NTILE).
- **GROUPING SETS, ROLLUP & CUBE** (10 min · 3 practice) 🖼 📖 — Compute many grouping levels — detail, subtotals, grand totals, and all combinations — in one query with GROUPING SETS, ROLLUP and CUBE.
- **Analytic functions — LAG/LEAD, running totals & dedup** (13 min · 3 practice) 🖼 📖 — The day-to-day analytic patterns: LAG/LEAD for period-over-period, frames for running totals and moving averages, FIRST/LAST_VALUE, and ROW_NUMBER dedup.
- **CASE & conditional logic** (10 min · 3 practice) 🖼 📖 — If/then inside SQL: searched vs simple CASE, bucketing and labeling, conditional aggregation (pivot with CASE), and the COALESCE/NULLIF shortcuts.
- **Pivoting — rows to columns & back** (10 min · 4 practice) 🖼 📖 — Reshape data: pivot rows into columns with conditional aggregation (and the PIVOT operator), and unpivot columns back into rows.

### Functions & data types

- **NULL handling & three-valued logic** (11 min · 3 practice) 🖼 📖 — The one concept behind countless SQL bugs: NULL = unknown, three-valued logic, IS NULL / IS DISTINCT FROM, COALESCE/NULLIF, and how NULLs behave in filters, aggregates, joins, ordering and uniqueness.
- **String functions & pattern matching** (11 min · 3 practice) 🖼 📖 — Clean and parse text in SQL: concat, case, trim, substring, replace, position, split, padding, and regex — the toolkit for taming messy source data.
- **Dates, times & time zones** (12 min · 3 practice) 🖼 📖 — Work with time correctly: current time, date arithmetic with intervals, EXTRACT and DATE_TRUNC for rollups, formatting/parsing, diffs, and the time-zone rules every DE must know.
- **JSON & semi-structured data** (11 min · 3 practice) 🖼 📖 — Query JSON inside SQL: JSON vs JSONB, extracting fields and nested paths, unnesting arrays, building JSON, indexing, and when columns beat a JSON blob.

### Defining & changing data

- **DDL, DML, data types & constraints** (13 min · 3 practice) 🖼 📖 — Define and change data: CREATE/ALTER/DROP, INSERT/UPDATE/DELETE, choosing data types, and the constraints (PK, FK, UNIQUE, NOT NULL, CHECK, DEFAULT) that protect integrity.
- **Normalization — 1NF through BCNF** (12 min · 3 practice) 🖼 📖 — Organize tables to kill redundancy and update anomalies: functional dependencies, 1NF/2NF/3NF/BCNF in plain English, and when to deliberately denormalize.
- **Views & materialized views** (14 min · 3 practice) 🖼 📖 — Save a query as a reusable virtual table: plain views for abstraction/security, materialized views for pre-computed speed, and how each refreshes.
- **Stored procedures, functions & triggers** (15 min · 4 practice) 🖼 📖 — Server-side logic in the database: procedures vs functions (UDFs), parameters and control flow, triggers and their pitfalls, and when this helps vs hurts.

### Performance & reliability

- **Indexes — B-trees, composite, covering & costs** (13 min · 3 practice) 🖼 📖 — How indexes turn scans into lookups: the B-tree, composite/leftmost-prefix, covering indexes, clustered vs non-clustered, B-tree vs hash, and the write-cost trade-off.
- **Transactions, ACID & isolation levels** (13 min · 3 practice) 🖼 📖 — Group operations atomically: ACID, COMMIT/ROLLBACK, the read anomalies (dirty/non-repeatable/phantom), the four isolation levels, and locking vs MVCC.
- **EXPLAIN & query optimization** (12 min · 3 practice) 🖼 📖 — Read what the engine actually does: EXPLAIN/ANALYZE, scan and join strategies, spotting the bottleneck, the role of statistics, and the standard fixes.

### Interview prep

- **SQL interview prep & cheat sheet** (15 min · 1 practice) 📖 — Consolidated rapid-review for the whole SQL track: master cheat sheet, rapid-fire Q&A, and a 10-question mock interview.


## 5. 📐 Data Modeling & Warehousing
_24 lessons — Design tables that are easy and fast to analyse — star schemas, slowly changing dimensions, warehouse vs lake._

### Modeling for analytics

- **Normalization vs denormalization for analytics** (10 min · 3 practice) 🖼 📖 — OLTP normalizes for integrity; analytics denormalizes for speed. Why the same data is modeled oppositely in operational systems and warehouses.
- **Star schemas — the analytics workhorse** (11 min · 3 practice) 🖼 📖 — Why a central fact surrounded by denormalized dimensions is the default analytics design: simple joins, fast queries, intuitive for BI — plus the conformed-dimension bus.
- **Slowly Changing Dimensions (SCD)** (12 min · 3 practice) 🖼 📖 — How dimensions change over time without losing history: SCD Type 1 (overwrite), Type 2 (versioned rows — the key one), Type 3 (previous-value column), and how to query them.
- **Warehouse vs Lake vs Lakehouse** (11 min · 3 practice) 🖼 📖 — The three analytical storage paradigms: the structured warehouse (schema-on-write), the flexible lake (schema-on-read), and the lakehouse that combines them.
- **MPP & Greenplum — parallel analytical databases** (14 min · 3 practice) 🖼 📖 — How massively parallel (MPP) shared-nothing warehouses like Greenplum spread data across segments to run one query on many machines at once — and how to model for them.

### Dimensional modelling in depth

- **Facts, dimensions & grain** (12 min · 3 practice) 🖼 📖 — The heart of dimensional modeling: fact tables (measurements) vs dimension tables (context), declaring the grain first, additive measures, and the three fact-table types.
- **Surrogate vs natural keys** (10 min · 3 practice) 🖼 📖 — Why warehouses key dimensions on meaningless surrogate integers rather than business keys — stability, SCD2, performance — and how the two keys coexist.
- **Denormalization — breaking the rules on purpose** (10 min · 3 practice) 🖼 📖 — When and how to duplicate data deliberately for read speed: pre-joining, wide tables, the costs (storage, update complexity), and keeping it consistent.

### Modeling philosophies & the serving layer

- **Inmon vs Kimball — two warehouse philosophies** (11 min · 4 practice) 🖼 📖 — The two classic approaches to building a warehouse: Inmon's top-down normalized enterprise hub feeding marts, vs Kimball's bottom-up dimensional marts unified by conformed dimensions.
- **Data Vault — modeling for change & auditability** (11 min · 4 practice) 🖼 📖 — An agile, audit-focused modeling style built from Hubs (business keys), Links (relationships) and Satellites (history) — designed to absorb change and load in parallel.
- **Advanced dimension techniques** (11 min · 4 practice) 🖼 📖 — The dimensional patterns beyond the basics: role-playing, junk, degenerate, bridge, and mini-dimensions — each solving a specific real-world modeling problem.
- **The semantic / metrics layer** (10 min · 4 practice) 🖼 📖 — Define business metrics once, centrally, so every tool computes them identically — ending the 'every dashboard defines revenue differently' problem.
- **The serving layer — semantic/metrics layer & BI** (15 min · 3 practice) 🖼 📖 — How gold marts reach decision-makers: a governed semantic/metrics layer that defines each metric once, served to Power BI, Looker, Tableau and APIs so every dashboard shows the same number.

### Data Vault 2.0

- **Data Vault 2.0 — why it exists** (13 min · 3 practice) 🖼 📖 — The enterprise-warehouse problem Data Vault solves — integrating many changing sources with full auditability and agility — and the layered architecture that delivers it, versus Kimball and Inmon.
- **Hubs, Links & Satellites** (14 min · 3 practice) 🖼 📖 — The three (and only three) building blocks of a Data Vault — Hubs for business keys, Links for relationships, Satellites for context and history — and how their separation absorbs change.
- **Hash keys, hashdiff & loading patterns** (15 min · 3 practice) 🖼 📖 — Data Vault 2.0's defining mechanics: hash keys that replace sequence surrogates (enabling parallel loads), the hashdiff for cheap change detection, and the insert-only, idempotent load pattern.
- **Business Vault, PITs & Bridges** (14 min · 3 practice) 🖼 📖 — Why querying the raw vault is slow, and the business-vault structures that fix it: computed satellites for soft business rules, and PIT and bridge tables that turn range-joins into fast equi-joins.
- **Building & automating Data Vault (and when to use it)** (14 min · 3 practice) 🖼 📖 — A worked customer/order vault, automating Data Vault with dbt (AutomateDV, datavault4dbt), building marts on top, and the honest decision of when Data Vault is — and isn't — the right tool.

### Schema variants & aggregates

- **Snowflake schema & normalizing dimensions** (9 min · 3 practice) 🖼 📖 — When to normalize dimensions into sub-tables: the snowflake schema, its trade-offs vs the star, and the narrow cases where it's worth the extra joins.
- **Warehouse schema types — compared** (14 min · 3 practice) 🖼 📖 — Star vs snowflake vs galaxy vs One Big Table — what each is, with examples, and exactly when to use which.
- **Galaxy schema (fact constellation)** (12 min · 3 practice) 🖼 📖 — Multiple fact tables sharing conformed dimensions — how real warehouses model several business processes together.
- **One Big Table (OBT) & wide tables** (10 min · 4 practice) 🖼 📖 — The fully-denormalized extreme: one wide pre-joined table with everything, why columnar warehouses love it, and its trade-offs vs the star.
- **Aggregate & summary tables** (9 min · 4 practice) 🖼 📖 — Pre-compute common rollups so dashboards read small summaries instead of scanning billion-row facts — with incremental refresh and aggregate navigation.

### Interview prep

- **Data Modeling interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review for the Data Modeling track: high-frequency answers and a 10-question mock interview.


## 6. 🐍 Python for Data Engineering
_60 lessons — The language that glues every pipeline together — from basics to working with files and APIs._

### Python you'll actually use

- **Data types — numbers, strings, booleans & None** (12 min · 4 practice) 🖼 📖 — Python's core scalar types, type conversion, dynamic typing, and truthiness.
- **Collections — lists, tuples, dictionaries & sets** (14 min · 4 practice) 🖼 📖 — Python's four built-in containers: when to use each, and their key operations.
- **Loops — for, while & loop control** (12 min · 4 practice) 🖼 📖 — Every way Python repeats work: for, range, while, break/continue/pass, for-else, nested loops, enumerate & zip.
- **Functions — parameters, return, scope & lambdas** (12 min · 3 practice) 🖼 📖 — Package reusable logic: parameters, defaults, return values, *args/**kwargs, scope, and lambdas.
- **Lambda functions — small anonymous functions** (11 min · 4 practice) 🖼 📖 — One-line anonymous functions: syntax, when to use them (especially sort keys), map/filter, limits, and the late-binding gotcha.
- **Files & I/O — reading and writing data** (11 min · 4 practice) 🖼 📖 — Read and write files safely: context managers, modes, encoding, line-by-line streaming, and pathlib.

### Python for data work

- **Comprehensions — list, dict, set & generator** (11 min · 4 practice) 🖼 📖 — Build and transform collections in one readable line — the Pythonic alternative to loop-and-append.
- **Strings & text processing** (12 min · 4 practice) 🖼 📖 — Create, index, slice, and transform text: methods, f-strings, immutability, and a taste of regex.
- **Error handling — try / except / else / finally** (12 min · 4 practice) 🖼 📖 — Catch and handle errors cleanly: exception types, raising your own, and failing safely in pipelines.
- **JSON & CSV — parsing the formats you'll meet daily** (11 min · 4 practice) 🖼 📖 — Read and write the two most common data formats with Python's built-in json and csv modules.
- **Dates & time — datetime, parsing & timezones** (11 min · 4 practice) 🖼 📖 — Parse and format timestamps, do date arithmetic, and avoid the timezone bugs that bite everyone.
- **Iterators & generators — processing data lazily** (12 min · 4 practice) 🖼 📖 — Stream huge datasets one item at a time with generators (yield) instead of loading everything into memory.
- **Functional Python — map, filter, reduce & higher-order functions** (10 min · 4 practice) 🖼 📖 — A compact, composable style for transforming data — and the mindset behind Spark transformations.

### Professional Python

- **Classes & objects (OOP)** (14 min · 4 practice) 🖼 📖 — Bundle data and behaviour into classes: __init__, self, methods, inheritance, dunder methods, and dataclasses.
- **Virtual environments & dependencies** (10 min · 4 practice) 🖼 📖 — Isolate each project's packages and pin versions so your code is reproducible everywhere.
- **Testing with pytest** (11 min · 4 practice) 🖼 📖 — Automated checks that prove your code works — and keep working as you change it.

### Engineering-grade Python

- **Decorators & context managers** (12 min · 4 practice) 🖼 📖 — Wrap functions to add behaviour (retries, timing, caching) and guarantee cleanup with the with-statement.
- **Concurrency — threads, processes & async (the GIL)** (13 min · 4 practice) 🖼 📖 — Do many things at once and pick the right tool: threading for I/O, multiprocessing for CPU, asyncio for scale.
- **Logging & configuration** (10 min · 4 practice) 🖼 📖 — Replace print() with real logging, and keep settings/secrets out of your code.
- **Connecting Python to databases** (11 min · 4 practice) 🖼 📖 — Query databases safely: parameterized queries, connection pools, and bulk loads — never string-built SQL.
- **Ingesting data from REST APIs** (11 min · 4 practice) 🖼 📖 — Pull data from web APIs reliably: pagination, rate limits, retries with backoff, auth, and incremental loads.

### The Python standard library

- **os & sys — talking to the operating system** (13 min · 4 practice) 🖼 📖 — Read environment variables, work with files and folders, and control the running program.
- **pathlib — modern file paths** (12 min · 4 practice) 🖼 📖 — The clean, object-oriented way to build paths, find files, and read/write — across any OS.
- **re — regular expressions for text** (14 min · 4 practice) 🖼 📖 — A mini-language for finding, extracting, validating, and cleaning patterns in text.
- **collections — specialized containers** (12 min · 4 practice) 🖼 📖 — Counter, defaultdict, deque, and namedtuple make common data tasks cleaner and faster.
- **itertools & functools — iterator & function tools** (13 min · 4 practice) 🖼 📖 — Lazy iterators for memory-light pipelines, plus tools for caching and composing functions.
- **subprocess — run external commands** (12 min · 4 practice) 🖼 📖 — Call other programs (git, dbt, aws, shell tools) from Python and capture their output safely.
- **argparse — command-line interfaces** (12 min · 4 practice) 🖼 📖 — Turn a script into a real CLI tool with arguments, options, defaults, and auto-generated help.
- **shutil, glob, tempfile & compression** (12 min · 4 practice) 🖼 📖 — High-level file operations: copy/move/archive, pattern-find files, safe temp space, and gzip/zip.
- **typing & dataclasses — type hints & clean records** (13 min · 4 practice) 🖼 📖 — Annotate types to catch bugs and aid editors, and generate tidy record classes with no boilerplate.

### NumPy — numerical computing

- **NumPy — the ndarray, dtypes & memory** (13 min · 4 practice) 🖼 📖 — Why NumPy is fast: a contiguous block of one dtype, with views that share memory.
- **NumPy — vectorization, ufuncs & broadcasting** (13 min · 4 practice) 🖼 📖 — Replace Python loops with array expressions; broadcasting combines different shapes without copying.
- **NumPy — indexing, aggregation & reshaping** (13 min · 4 practice) 🖼 📖 — Select with slices/masks, summarize along axes, reshape, and find positions — axis is the key idea.

### pandas — the DataFrame

- **pandas — Series, DataFrame & the Index** (14 min · 4 practice) 🖼 📖 — The two core objects, the Index that aligns them, dtypes, and fast columnar I/O.
- **pandas — selecting, filtering & assigning** (14 min · 4 practice) 🖼 📖 — [] vs .loc vs .iloc, boolean filtering, safe assignment, and adding columns the vectorized way.
- **pandas — groupby & split-apply-combine** (14 min · 4 practice) 🖼 📖 — Group rows by a key, apply an aggregation, and combine — plus transform, filter, and why apply is slow.
- **pandas — merge, join, concat & reshape** (15 min · 4 practice) 🖼 📖 — SQL-style joins, stacking with concat, and reshaping between wide and long (pivot/melt).
- **pandas — time series, dtypes & performance** (15 min · 4 practice) 🖼 📖 — Datetime indexing and resampling, plus the memory/speed tricks that keep pandas usable at scale.

### Apache Arrow & Parquet

- **Apache Arrow — the columnar memory format** (13 min · 4 practice) 🖼 📖 — Arrow arrays, tables, types and zero-copy interop — the in-memory standard the whole stack shares.
- **Parquet & datasets with PyArrow** (13 min · 4 practice) 🖼 📖 — Write and read Parquet with row groups, statistics, projection/predicate pushdown, and partitioned datasets.

### Polars — fast DataFrames

- **Polars — DataFrames, Series & I/O** (13 min · 4 practice) 🖼 📖 — Create, read, and manipulate Polars DataFrames — fast, Arrow-based, multithreaded, no index.
- **Polars — the expression API** (13 min · 4 practice) 🖼 📖 — Expressions are the heart of Polars: composable, parallel column logic used in four contexts.
- **Polars — lazy execution & performance** (13 min · 4 practice) 🖼 📖 — Build a query plan, let the optimizer push filters down and parallelize, and stream larger-than-RAM data.

### DuckDB & Dask

- **DuckDB — the in-process engine** (13 min · 4 practice) 🖼 📖 — A serverless, columnar OLAP database that queries Parquet, CSV, pandas, and Arrow in place.
- **DuckDB — analytical SQL & integration** (13 min · 4 practice) 🖼 📖 — The full analytical SQL surface, S3/extensions, and how DuckDB plugs into the modern stack.
- **Dask — parallel & out-of-core dataframes** (13 min · 4 practice) 🖼 📖 — Scale pandas/NumPy to many cores and bigger-than-RAM data with a lazy, partitioned task graph.

### Databases, validation & ingestion

- **SQLAlchemy Core — Engine, pooling & SQL expressions** (13 min · 4 practice) 🖼 📖 — The Engine and connection pool, parameterized SQL, the Core expression language, transactions, and bulk I/O.
- **SQLAlchemy ORM — models, sessions & relationships** (13 min · 4 practice) 🖼 📖 — Map Python classes to tables, work with objects via a Session, and model relationships and migrations.
- **Pydantic — data validation & models** (13 min · 4 practice) 🖼 📖 — Define typed models that validate and coerce data at the boundary — the standard for data contracts in Python.
- **Requests & httpx — calling HTTP APIs** (13 min · 4 practice) 🖼 📖 — The staple for ingesting from REST APIs — sessions, timeouts, retries, rate limits, and pagination.
- **Great Expectations — data quality** (13 min · 4 practice) 🖼 📖 — Declarative "expectations" that validate data and gate pipelines, with human-readable Data Docs.

### Cloud & orchestration

- **boto3 — the AWS SDK for Python** (13 min · 4 practice) 🖼 📖 — Talk to every AWS service from Python: S3 objects, presigned URLs, pagination, and credentials.
- **fsspec, s3fs & gcsfs — one filesystem API** (12 min · 4 practice) 🖼 📖 — A single, portable interface over local disk and every cloud — and the engine pandas/Polars use for s3://.
- **Prefect — modern Python orchestration** (13 min · 4 practice) 🖼 📖 — Turn plain Python functions into scheduled, observable, auto-retrying workflows — code-first orchestration.
- **Apache Beam — unified batch & streaming** (13 min · 4 practice) 🖼 📖 — One programming model for both batch and streaming, portable across runners like Dataflow, Spark, and Flink.

### Utilities & visualization

- **Faker — realistic synthetic data** (12 min · 4 practice) 🖼 📖 — Generate names, addresses, emails, dates and more for tests, demos, and seeding dev databases.
- **openpyxl & XlsxWriter — read & write Excel** (13 min · 4 practice) 🖼 📖 — Read, edit, and create .xlsx files — cells, formulas, styles, multiple sheets, and charts.
- **matplotlib — the foundation of Python plotting** (13 min · 4 practice) 🖼 📖 — The Figure/Axes model and the full set of plot types, labels, sub-plots, and styling.
- **seaborn — statistical visualization** (12 min · 4 practice) 🖼 📖 — DataFrame-aware statistical plots in one line: distributions, categories, relationships, and matrices.

### Interview prep

- **Python interview prep & cheat sheet** (15 min · 1 practice) 📖 — Consolidated rapid-review for the whole Python track: master cheat sheet, rapid-fire Q&A, and a 10-question mock interview.


## 7. 🐚 Unix & Shell Scripting
_9 lessons — The command line every data engineer lives in: files, pipes, text tools, permissions, scripts, cron, and the CLI for data._

### The command line

- **The command line & the filesystem** (12 min · 4 practice) 🖼 📖 — What the shell is, how to navigate the file tree, and the core file commands you'll use every day.
- **Pipes, redirection & stdin/stdout/stderr** (12 min · 4 practice) 🖼 📖 — The Unix philosophy: small tools composed with pipes and redirection into powerful one-liners.
- **Text processing — grep, sed & awk** (13 min · 4 practice) 🖼 📖 — The command-line power trio for searching, editing, and reshaping text and CSV data at scale.
- **Files, permissions & processes** (12 min · 4 practice) 🖼 📖 — Who can read/write/run a file, and how to see and control running programs.

### Scripting & automation

- **Shell scripting — automating with bash** (14 min · 4 practice) 🖼 📖 — Turn commands into reusable scripts: variables, conditionals, loops, arguments, and failing safely.
- **Shell loops — for, while & until** (13 min · 4 practice) 🖼 📖 — Repeat commands over files, lines, and ranges with for/while/until, plus break and continue.
- **Scheduling & automation with cron** (11 min · 4 practice) 🖼 📖 — Run jobs automatically on a schedule, and avoid the classic cron gotchas.
- **The command line for data engineering** (12 min · 4 practice) 🖼 📖 — The everyday CLI toolkit that glues data tools together: curl, ssh/scp, jq, compression, and pipelines.

### Interview prep

- **Unix & Shell interview prep & cheat sheet** (12 min · 1 practice) 📖 — Consolidated rapid-review for the Unix & Shell track: master cheat sheet, rapid-fire Q&A, and a 10-question mock interview.


## 8. 🧩 NoSQL & Unstructured Data
_12 lessons — When tables aren't the answer: key-value, document, and wide-column stores._

### Beyond the relational table

- **The NoSQL families** (11 min · 4 practice) 🖼 — Why NoSQL exists and the four families — key-value, document, wide-column, graph — each trading relational features for scale, flexibility, or a specific access pattern.
- **CAP — the trade-off of distributed data** (10 min · 4 practice) 🖼 📖 — Why a distributed datastore can't have it all: Consistency, Availability, and Partition tolerance — and since partitions happen, the real choice is C vs A (and PACELC's latency angle).

### The NoSQL families

- **Document & key-value stores** (11 min · 4 practice) 🖼 — Two of the most-used NoSQL families up close: key-value's blazing-fast key lookups, and document stores' flexible, queryable JSON — when and how to use each.
- **Wide-column & graph databases** (11 min · 4 practice) 🖼 — Two specialized families: wide-column stores (Cassandra) built for massive write-heavy scale by partition key, and graph databases (Neo4j) built for relationship traversals.
- **Sharding & replication at scale** (11 min · 4 practice) 🖼 — The two mechanisms behind scalable distributed databases: sharding (split data across nodes for capacity/throughput) and replication (copy data for availability and read scale).

### Engines, consistency & specialized stores

- **Storage engines — B-trees vs LSM trees** (12 min · 4 practice) 🖼 — The two dominant on-disk structures: B-trees (read-optimized, in-place updates — RDBMS) and LSM trees (write-optimized via memtables + immutable SSTables + compaction — Cassandra/RocksDB).
- **Tunable consistency & quorums** (11 min · 4 practice) 🖼 — How distributed stores let you dial consistency per operation using quorums: the R + W > N rule, consistency levels, and the mechanisms (read repair, hinted handoff) that heal replicas.
- **Time-series databases** (10 min · 4 practice) 🖼 — Databases purpose-built for timestamped data: high-ingest append-only writes, time-range queries, automatic downsampling/retention, and heavy compression.
- **Search engines & vector databases** (11 min · 4 practice) 🖼 — Two stores for finding things by meaning: search engines (Elasticsearch) with inverted indexes for full-text relevance, and vector databases for embedding-based similarity (semantic search, RAG).

### Caching & NoSQL modeling

- **Caching patterns with Redis** (11 min · 4 practice) 🖼 — Redis as the Swiss-army in-memory store: rich data structures, the cache-aside pattern, TTL/eviction, and uses beyond caching — queues, rate-limiting, leaderboards, pub/sub.
- **Query-first data modeling for NoSQL** (11 min · 4 practice) 🖼 — The opposite of relational design: model around your access patterns, denormalize and duplicate freely, embed what you read together, and write data multiple ways to serve multiple queries.

### Interview prep

- **NoSQL interview prep & cheat sheet** (12 min · 1 practice) 📖 — Consolidated rapid-review for the NoSQL track: high-frequency answers and a 10-question mock interview.


## 9. ⚡ Big Data & Apache Spark
_23 lessons — Process data too big for one machine. (Hands-on Spark coding lives in the SparkQuest app.)_

### The evolution of Big Data

- **The evolution of Big Data (the story)** (14 min · 3 practice) 🖼 📖 — How we got here in four eras — and why each new technology existed to fix the previous era's limits.
- **The Hadoop era — GFS, MapReduce & the ecosystem** (14 min · 3 practice) 🖼 📖 — How Google's papers became Hadoop, what HDFS + MapReduce + YARN actually did, and why the ecosystem grew around them.
- **Hadoop — HDFS, YARN, MapReduce & the ecosystem** (16 min · 6 practice) 🖼 📖 — Hadoop in depth: HDFS internals (NameNode/DataNode, the write & read paths, rack-aware replication, HA), YARN internals (ResourceManager/NodeManager/ApplicationMaster, the job-submission flow, schedulers), the ecosystem, and the cloud shift — and why the ideas persist.
- **MapReduce — the programming model** (16 min · 6 practice) 🖼 📖 — The full MapReduce pipeline: InputSplits & RecordReaders, the Mapper lifecycle, partitioner, combiner, the shuffle/sort internals, the Reducer phases, joins, counters, and exactly why it's slow — the model that still underlies every distributed shuffle.
- **Spark, NoSQL & the streaming revolution** (14 min · 3 practice) 🖼 📖 — Why Spark beat MapReduce, how NoSQL scaled flexible data, and how Kafka + Flink ended the batch-only world.
- **Cloud, the lakehouse & today (2026)** (13 min · 3 practice) 🖼 📖 — How the cloud separated storage from compute, why table formats created the lakehouse, and where Big Data stands in 2026.

### Thinking at scale

- **What makes data 'big'? Scale & distribution** (10 min · 3 practice) 🖼 — When data outgrows one machine: the Vs (volume, velocity, variety), scale-up vs scale-out, and why distributed processing (parallelism + fault tolerance on commodity hardware) is the answer.
- **Spark's big picture: cluster, DataFrames, lazy work & the shuffle** (11 min · 3 practice) 🖼 — The mental model that ties everything together: driver + executors + cluster manager, data in partitions, the DataFrame API optimized by Catalyst, lazy evaluation, and the shuffle as the cost center.

### How Spark works

- **Transformations vs actions & lazy evaluation** (11 min · 3 practice) 🖼 📖 — Why nothing runs until you ask: lazy transformations build a DAG, actions trigger it, the optimizer exploits the whole plan — and each action recomputes unless you cache.
- **Partitions & the shuffle** (12 min · 3 practice) 🖼 📖 — Parallelism's unit and its biggest cost: how partitions drive parallel tasks, what triggers a shuffle, right-sizing partitions, repartition vs coalesce, and skew.
- **DataFrames & Spark SQL** (11 min · 3 practice) 🖼 — The high-level API you'll actually use: typed columns and functions, groupBy/agg, joins, the DataFrame↔SQL equivalence, and how Catalyst makes both fast.
- **Why Spark beat MapReduce** (9 min · 3 practice) 🖼 — The leap from Hadoop MapReduce to Spark: in-memory processing vs disk-between-steps, a richer DAG of operations, and one unified engine for batch, SQL, streaming and ML.

### Advanced Spark & the ecosystem

- **Join strategies — broadcast, sort-merge & shuffle-hash** (12 min · 3 practice) 🖼 📖 — How Spark physically joins tables and how to pick the fast path: broadcast hash join for small×large, sort-merge for large×large, and handling join skew.
- **Tuning & Adaptive Query Execution** (11 min · 3 practice) 🖼 — The practical Spark tuning checklist — shuffle, broadcast, caching, partitions, UDFs — and how AQE re-optimizes the plan at runtime so you tune less by hand.
- **Spark Structured Streaming** (11 min · 3 practice) 🖼 📖 — Streaming as an unbounded table with the same DataFrame API: the micro-batch model, sources/sinks, event-time windows + watermarks, output modes, and checkpointing for exactly-once.
- **Beyond Spark — Flink, Trino & friends** (9 min · 3 practice) 🖼 — Spark isn't the only engine: Flink for true low-latency streaming, Trino/Presto for interactive federated SQL, and where Dask/Ray fit — and how to choose.
- **Hive & HiveQL — SQL on the lake + the metastore** (15 min · 6 practice) 🖼 📖 — Hive in depth: its architecture (driver/compiler/optimizer/execution engine + metastore), HiveQL DDL/DML, managed vs external tables, static & dynamic partitioning, bucketing, ORC/Parquet & SerDes, the optimizations (partition pruning, predicate pushdown, vectorization, map joins, CBO), Hive ACID, and Hive vs Spark SQL vs Trino.
- **Scala for Spark** (15 min · 6 practice) 🖼 📖 — Scala in depth for Spark: the language essentials (immutability, type inference, functions as values, case classes, pattern matching, traits, collections, Option), why Spark is written in it, the three Spark APIs in Scala (RDD/DataFrame/typed Dataset[T]), Scala UDFs, sbt packaging, and a precise PySpark comparison.

### Spark internals & deployment

- **RDDs — Spark's resilient foundation** (10 min · 3 practice) 🖼 📖 — The low-level abstraction under every DataFrame: partitioned, immutable datasets whose lineage gives fault tolerance — plus narrow vs wide dependencies and why DataFrames are now preferred.
- **UDFs & memory management** (10 min · 3 practice) 🖼 — Why Python UDFs are slow (and pandas UDFs the fix), and how executor memory works — execution vs storage, spill, and the real causes of OOM.
- **Running Spark — submit, cluster & deploy modes** (9 min · 3 practice) 🖼 — How a Spark app actually runs: spark-submit, the cluster managers, client vs cluster deploy mode, local mode, and how a job becomes jobs → stages → tasks.

### PySpark in depth

- **PySpark — the complete guide** (20 min · 3 practice) 🖼 📖 — A practical end-to-end PySpark reference: SparkSession, reading/writing, the DataFrame API (columns, functions, groupBy, joins, windows), nulls/dates/strings, UDFs, caching, and PySpark vs pandas.

### Interview prep

- **Spark & Big Data interview prep & cheat sheet** (15 min · 1 practice) 📖 — Consolidated rapid-review for the Spark track: high-frequency answers and a 10-question mock interview.


## 10. 🔧 Pipelines & Orchestration
_20 lessons — Turn one-off scripts into reliable, scheduled pipelines with Airflow-style DAGs._

### Building reliable pipelines

- **ETL vs ELT** (11 min · 4 practice) 🖼 📖 — The two orderings of extract/transform/load, why the cloud flipped the default from ETL to ELT, and when each still fits.
- **Orchestration fundamentals — DAGs, scheduling & dependencies** (13 min · 4 practice) 🖼 📖 — Coordinate the many tasks of a pipeline: model them as a DAG, schedule, handle dependencies, retries, and backfills.
- **DAGs & orchestration with Airflow** (11 min · 4 practice) 🖼 — Why pipelines are modeled as DAGs, what an orchestrator gives you (scheduling, dependencies, retries, visibility), and the anatomy of an Airflow DAG.
- **Idempotency & backfills** (11 min · 4 practice) 🖼 📖 — Why re-running a pipeline must produce the same result, the techniques that make it so (overwrite-by-partition, MERGE, deterministic outputs), and how backfills depend on it.

### Operating pipelines

- **Scheduling, triggers & catchup** (10 min · 3 practice) 🖼 — How pipelines decide when to run: cron/interval schedules, event/sensor triggers, the logical date, and catchup vs backfill.
- **Incremental vs full loads** (11 min · 4 practice) 🖼 📖 — Reload everything vs process only what changed: change-detection strategies (high-watermark, CDC, partitions), late-arriving data, and the trade-offs.
- **Monitoring, alerting & data observability** (10 min · 4 practice) 🖼 — Knowing your pipelines work: what to monitor (freshness, volume, schema, quality, latency), SLAs/SLOs, effective alerting, and data observability.

### Orchestration & tooling

- **Airflow in depth — operators, sensors, XComs & executors** (13 min · 4 practice) 🖼 📖 — Under Airflow's hood: the scheduler/executor/metadata-DB architecture, operators & the TaskFlow API, sensors, XComs, hooks/connections, executor types, and the best practices that keep DAGs healthy.
- **dbt & analytics engineering** (13 min · 4 practice) 🖼 📖 — The transform layer of the modern stack: models & ref() lineage, sources, materializations, tests, docs, snapshots and macros — bringing software engineering to SQL transformations.
- **Ingestion & EL tools — Fivetran, Airbyte & CDC** (11 min · 4 practice) 🖼 — Getting data in: managed connectors (Fivetran/Airbyte), log-based Change Data Capture, batch vs streaming ingestion, and the build-vs-buy trade-off.
- **Enterprise ETL & DataStage — parallel jobs and modernization** (14 min · 3 practice) 🖼 📖 — How enterprise ETL tools like IBM DataStage build parallel, visual data pipelines — the stages, the parallelism, and how teams modernize them to Spark/dbt.
- **Reverse ETL & data activation** (9 min · 3 practice) 🖼 — Pushing modeled warehouse data back into operational tools (CRM, ads, Slack) so business teams act on it — the warehouse as the source of truth for operations too.

### dbt — analytics engineering

- **dbt — the analytics engineering workflow** (14 min · 3 practice) 🖼 📖 — What dbt is and why it changed data work: software-engineering discipline (version control, tests, docs, modularity) for the T in ELT — and how dbt Core, dbt Cloud, and the new Fusion engine fit together.
- **Models, ref() & the DAG** (14 min · 3 practice) 🖼 📖 — How models, ref(), and source() compose into a dependency graph dbt runs in order — plus the staging → intermediate → marts layering that keeps projects clean.
- **Materializations, incremental & snapshots** (15 min · 3 practice) 🖼 📖 — How dbt persists a model — view, table, incremental, or ephemeral — when to use each, incremental strategies for huge tables, and snapshots for SCD2 history.
- **Tests, contracts & data quality** (14 min · 3 practice) 🖼 📖 — dbt's quality toolkit: generic and singular data tests, unit tests for logic, source freshness, model contracts, and how `dbt build` halts the pipeline before bad data reaches marts.
- **Deploy & operate dbt (CI, Mesh, lineage)** (14 min · 3 practice) 🖼 📖 — Running dbt in production: dev vs prod environments, Slim CI that rebuilds only what changed, orchestration options, auto-generated docs and column-level lineage, dbt Mesh for big orgs, and observability.

### Orchestration choices & testing

- **Beyond Airflow — Dagster, Prefect & asset-based orchestration** (10 min · 3 practice) 🖼 — The next-generation orchestrators and the shift from task-centric to asset-centric thinking: Dagster's software-defined assets, Prefect's dynamic flows, and when each fits.
- **Testing data pipelines** (11 min · 4 practice) 🖼 — How to trust a pipeline before and after it runs: unit tests for transform logic, data tests/assertions, schema tests, end-to-end checks, data diffs, and CI for data.

### Interview prep

- **Pipelines & Orchestration interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review for the Pipelines track: high-frequency answers and a 10-question mock interview.


## 11. 🌊 Streaming & Real-Time
_13 lessons — Process data the moment it arrives — Kafka, event time, and exactly-once._

### Real-time foundations

- **Batch vs streaming** (10 min · 4 practice) 🖼 — Processing a chunk on a schedule vs processing each event as it arrives: the latency/complexity trade-off, when each fits, and the micro-batch middle ground.
- **Kafka — the durable event log** (11 min · 4 practice) 🖼 — The backbone of most streaming systems: Kafka as a distributed, durable, replayable append-only log that decouples producers from consumers — topics, producers/consumers, and why it's everywhere.

### Getting streaming right

- **Event time vs processing time & windows** (11 min · 4 practice) 🖼 — Why correct streaming aggregations use when an event happened, not when it was processed — plus tumbling, sliding, and session windows.
- **Watermarks & late data** (11 min · 4 practice) 🖼 📖 — How streaming engines decide a time window is 'done': watermarks bound lateness, trigger finalization, free state, and define what counts as too-late.
- **Delivery guarantees — at-least-once vs exactly-once** (11 min · 4 practice) 🖼 📖 — The three delivery semantics (at-most-once, at-least-once, exactly-once), what each means for loss and duplication, and how exactly-once is actually achieved.

### Streaming platforms & patterns

- **Kafka internals — partitions, consumer groups & offsets** (12 min · 4 practice) 🖼 📖 — How Kafka scales and stays ordered/durable: topics split into partitions, keys for routing, brokers & replication, consumer groups for parallelism, and offsets for replay.
- **Lambda vs Kappa architecture** (10 min · 4 practice) 🖼 — Two ways to combine real-time and historical processing: Lambda's parallel batch + speed layers vs Kappa's single streaming pipeline with replay — and why the field trends toward Kappa.
- **Stateful stream processing** (11 min · 4 practice) 🖼 📖 — Why many streaming operations must remember the past, where that state lives, how it's kept fault-tolerant with checkpoints, and how to keep it from growing forever.
- **Schema registry & evolution** (10 min · 4 practice) 🖼 — How streaming systems keep producers and consumers compatible as event formats change: serialization formats, a central schema registry, and compatibility rules.

### Advanced streaming

- **Joins in streaming — stream-stream & stream-table** (11 min · 4 practice) 🖼 — Combining streams: stream-stream joins within a time window (buffered state, watermark eviction) and stream-table joins that enrich events with a changing lookup table.
- **Backpressure & scaling consumers** (10 min · 4 practice) 🖼 — What happens when data arrives faster than you can process it: detecting consumer lag, the ways to handle backpressure, and how to scale streaming consumers.
- **Building a streaming pipeline end-to-end** (11 min · 4 practice) 🖼 📖 — Putting it together: source → stream processor → sink, with event time/watermarks, exactly-once via checkpoints, schemas, and lag monitoring — a reference real-time architecture.

### Interview prep

- **Streaming & Real-Time interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review for the Streaming track: high-frequency answers and a 10-question mock interview.


## 12. 🏞️ The Lakehouse
_13 lessons — Reliable, database-like tables on cheap storage — Delta Lake and Apache Iceberg._

### Modern table formats

- **Why the lakehouse exists** (10 min · 4 practice) 🖼 📖 — The lakehouse combines the data lake's cheap, flexible storage with the warehouse's reliability and performance — fixing the weaknesses of both.
- **Time travel & MERGE** (10 min · 4 practice) 🖼 📖 — How the transaction log turns a table into a versioned history you can query, roll back, and audit — plus transactional MERGE updates/deletes that raw lakes couldn't do.

### Lakehouse tables in depth

- **Table formats — what they are (Delta, Iceberg, Hudi)** (11 min · 4 practice) 🖼 📖 — The metadata/transaction-log layer that turns a directory of Parquet files into a real ACID table — the core idea behind Delta Lake, Apache Iceberg, and Apache Hudi.
- **Schema evolution & enforcement** (10 min · 4 practice) 🖼 — How lakehouse tables change shape safely over time — enforcing schema on write, evolving it (add/rename/drop), and why this beats a bare lake's schema chaos.
- **The medallion architecture — complete guide** (18 min · 4 practice) 🖼 📖 — Organizing lakehouse data into bronze (raw), silver (cleaned/conformed), and gold (modeled/aggregated) layers — progressive refinement that balances flexibility and quality.

### Lakehouse engineering

- **Partitioning & Z-ordering — data layout for speed** (11 min · 4 practice) 🖼 — How the physical arrangement of files makes lakehouse queries fast or slow: partitioning for pruning, Z-ordering/clustering for file skipping, right file sizes, and avoiding over-partitioning.
- **Catalogs & the metastore** (11 min · 4 practice) 🖼 — The directory that lets engines find lakehouse tables and governs access: the metastore/catalog, from Hive Metastore to Glue, Unity Catalog, and Iceberg REST catalogs.
- **Delta vs Iceberg vs Hudi — compared** (11 min · 4 practice) 🖼 — How the three table formats differ in origin, design, and sweet spots — and why they're converging — so you can choose deliberately.
- **Streaming & CDC into the lakehouse** (11 min · 4 practice) 🖼 — Continuously landing events and database changes into lakehouse tables: streaming writes, MERGE-based CDC, the small-files problem, exactly-once via the log, and auto-compaction.
- **Maintaining lakehouse tables — OPTIMIZE, VACUUM & the log** (11 min · 4 practice) 🖼 — Keeping lakehouse tables fast and lean: compaction (OPTIMIZE/Z-order), VACUUM to reclaim storage (and its time-travel trade-off), and log/metadata upkeep.

### Table formats in depth

- **Delta Lake in depth** (12 min · 4 practice) 🖼 📖 — Inside Delta: the _delta_log transaction log (JSON commits + checkpoints), how ACID works via optimistic concurrency, and the features (MERGE, OPTIMIZE/Z-order, deletion vectors, liquid clustering).
- **Apache Iceberg in depth** (12 min · 4 practice) 🖼 📖 — Inside Iceberg: the metadata tree (metadata file → manifest list → manifests → data files), snapshots, hidden partitioning, partition evolution, and why it's the engine-agnostic favorite.

### Interview prep

- **Lakehouse interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review for the Lakehouse track: high-frequency answers and a 10-question mock interview.


## 13. ☁️ Cloud Data Engineering
_16 lessons — Where modern data lives: object storage, cloud warehouses, and serverless pipelines._

### Cloud foundations

- **Why cloud? Cloud fundamentals** (10 min · 1 practice) 🖼 📖 — What the cloud is and why nearly all modern data platforms run on it — on-prem vs cloud, the value proposition, and deployment models.
- **Service models — IaaS, PaaS, SaaS** (10 min · 1 practice) 🖼 📖 — The most useful cloud framework — how much of the stack you manage vs the provider — explaining every cloud product from raw VMs to ready-made apps.
- **Cloud architecture — regions, AZs & shared responsibility** (11 min · 1 practice) 🖼 📖 — The cloud's physical and responsibility map: regions and availability zones for reliability, the shared responsibility model for security, and the well-architected pillars.

### Core services

- **Object storage (S3 & friends)** (11 min · 4 practice) 🖼 📖 — The foundation of the cloud data platform: massively scalable, durable, cheap object storage — how it differs from a filesystem, storage tiers, and why it decouples storage from compute.
- **Compute — VMs, containers & serverless** (11 min · 4 practice) 🖼 📖 — The spectrum of cloud compute from full-control VMs to zero-management serverless: what each is, the control-vs-management trade-off, and where each fits in data engineering.
- **Server vs serverless — the complete decision guide** (16 min · 3 practice) 🖼 📖 — When to run your own servers vs go serverless — the why, where, who, and how, with the cost/control/cold-start trade-offs that decide real architectures.
- **Cloud warehouses & serverless** (10 min · 4 practice) 🖼 📖 — How cloud data warehouses (Snowflake, BigQuery, Redshift) reinvented analytics: decoupled elastic compute, columnar MPP, pay-per-use, and serverless query engines.

### Security, networking & cost

- **Security & IAM basics** (11 min · 4 practice) 🖼 📖 — How the cloud controls who can do what: identities, policies, and resources; authentication vs authorization; least privilege; roles over keys; and encryption.
- **Cloud networking & data movement** (10 min · 4 practice) 🖼 📖 — How data moves in the cloud and why it costs: regions and availability zones, VPCs and private endpoints, and the egress charges that make 'keep compute near the data' a rule.
- **Cloud cost & FinOps thinking** (11 min · 4 practice) 🖼 📖 — Why cloud bills surprise teams and how data engineers control them: the cost drivers (compute, storage, egress, data scanned) and FinOps practices (visibility, right-sizing, scale-to-zero, spot, lifecycle).

### Providers & platforms

- **AWS vs GCP vs Azure — the data services map** (11 min · 4 practice) 🖼 📖 — The same data-engineering capabilities under three sets of names: object storage, warehouse, processing, streaming, orchestration, and serverless across AWS, GCP, and Azure.
- **Cloud warehouses — Snowflake, BigQuery, Redshift** (10 min · 4 practice) 🖼 📖 — How the three leading cloud warehouses differ in architecture and billing — Snowflake's virtual warehouses, BigQuery's serverless model, Redshift's clusters — so you can choose.
- **Managed Spark & processing services** (10 min · 4 practice) 🖼 📖 — Running Spark without managing clusters: Databricks, EMR, Dataproc, and serverless Spark — what 'managed' removes, and the spectrum from self-hosted to serverless.
- **Serverless & event-driven data pipelines** (10 min · 4 practice) 🖼 📖 — Building pipelines from functions that fire on events: serverless functions, event triggers, serverless orchestration and query, and the pros/cons vs always-on clusters.
- **The Databricks lakehouse platform** (10 min · 4 practice) 🖼 📖 — Databricks as a unified platform: managed Spark, Delta Lake, Unity Catalog, notebooks/jobs, SQL warehouses, and ML — the company that coined 'lakehouse' bundling the stack.

### Interview prep

- **Cloud Data Engineering interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review for the Cloud track: high-frequency answers and a 10-question mock interview.


## 14. 🏔️ Snowflake — complete course
_31 lessons — Become great at Snowflake for data engineering: architecture, warehouses & cost, loading & continuous ingestion, performance, security & governance, and the modern stack (Snowpark, Iceberg, Dynamic Tables, Cortex)._

### Snowflake for Data Engineering

- **Snowflake architecture — the three layers** (13 min · 3 practice) 🖼 📖 — Snowflake's defining design — fully decoupled storage and compute across three layers (cloud services, virtual warehouses, centralized storage) — and the micro-partitions that make queries fast with no indexes to manage.
- **Virtual warehouses — sizing, scaling & cost** (14 min · 3 practice) 🖼 📖 — How to size warehouses (T-shirt sizes and credits), the crucial difference between scaling UP and OUT, auto-suspend/resume, per-second billing, and the levers that control a Snowflake bill.
- **Loading & continuous ingestion** (14 min · 3 practice) 🖼 📖 — Every way to get data into Snowflake by latency — COPY INTO from stages, Snowpipe auto-ingest, Snowpipe Streaming rows, and Streams + Tasks and Dynamic Tables for CDC and declarative pipelines.
- **Time Travel, cloning & micro-partition magic** (13 min · 3 practice) 🖼 📖 — The features that fall out of immutable micro-partitions — Time Travel to query/restore the past, zero-copy cloning for instant free environments, Fail-safe, and clustering for big-table pruning.
- **Snowpark, Iceberg, Dynamic Tables & Cortex AI** (14 min · 3 practice) 🖼 📖 — Snowflake as a full modern data platform — Python transformations with Snowpark, open lakehouse tables with Iceberg, declarative pipelines with Dynamic Tables, and LLMs in SQL with Cortex — all in one place.

### SQL deep-dives, security, performance & sharing

- **SQL & semi-structured data (VARIANT/JSON)** (13 min · 2 practice) 🖼 📖 — Snowflake queries JSON, Avro, Parquet and XML as first-class SQL using the VARIANT type. Learn schema-on-read path access, PARSE_JSON, OBJECT/ARRAY, and LATERAL FLATTEN to explode nested data into rows.
- **Security & RBAC (roles, masking, row policies)** (13 min · 2 practice) 🖼 📖 — Snowflake security is role-based: privileges go to roles, roles to users, and roles inherit down a hierarchy. Layer on dynamic masking policies, row access policies, network policies, and SSO/MFA for defense in depth.
- **Performance tuning & cost** (14 min · 2 practice) 🖼 📖 — Snowflake performance comes from pruning micro-partitions, leaning on three cache layers, and right-sizing warehouses. Learn clustering keys, the Query Profile, materialized views, search optimization, and multi-cluster scaling.
- **Data sharing & Marketplace** (12 min · 2 practice) 🖼 📖 — Snowflake's Secure Data Sharing gives other accounts live, read-only access to your data with no copying and no pipelines. Learn shares, reader accounts, cross-region/cloud sharing, and the Marketplace.
- **Capstone — an end-to-end Snowflake platform** (14 min · 2 practice) 🖼 📖 — Assemble the whole Snowflake course into one platform: ingestion (Snowpipe/Streaming/Dynamic Tables), raw→staging→marts modeling with VARIANT + relational, per-workload warehouses, RBAC + policies, performance tuning, sharing, and Snowpark/Cortex.

### Ingestion in depth

- **Snowpipe — continuous file ingestion** (16 min · 3 practice) 🖼 📖 — Snowpipe is its own discipline: continuous, serverless, micro-batch file loading. This lesson covers auto-ingest vs the REST API, the per-cloud notification wiring, the serverless cost model, file-sizing, dedup/reload semantics, and how to monitor and unstick a pipe in production.
- **COPY INTO & stages — bulk loading** (15 min · 2 practice) 🖼 📖 — COPY is the foundation every other ingestion method builds on. This lesson covers stages and storage integrations, file formats, the full COPY option set (ON_ERROR, VALIDATION_MODE, FORCE, PURGE, transforms), load-metadata dedup, file-sizing, and parallelism.
- **Snowpipe Streaming — row-level ingestion** (14 min · 2 practice) 🖼 📖 — When minutes aren't fast enough, Snowpipe Streaming writes rows directly into tables — no files. This lesson covers channels, the SDK and Kafka connector, offset tokens for exactly-once, the cost model, and exactly when to choose it over file-based Snowpipe.
- **Dynamic Tables — declarative pipelines** (14 min · 2 practice) 🖼 📖 — Dynamic Tables let you declare the target query and a freshness target; Snowflake builds the dependency DAG and refreshes incrementally. This lesson covers target lag, incremental vs full refresh, chaining, monitoring, and when to use them over streams+tasks or materialized views.
- **Streams & Tasks — CDC pipelines** (15 min · 2 practice) 🖼 📖 — Streams capture row-level change (CDC); tasks run SQL on a schedule or trigger. Together they build incremental pipelines with full control. This lesson covers stream types and metadata columns, offset semantics, task scheduling, task DAGs, and the canonical MERGE pattern.

### Performance in depth

- **Micro-partitions & pruning** (13 min · 2 practice) 🖼 📖 — Everything Snowflake does to scan less starts here. This lesson covers how tables are physically stored as immutable, columnar micro-partitions, the min/max metadata that drives pruning, the pruning ratio in the Query Profile, natural clustering by load order, and why there are no indexes.
- **Clustering keys & reclustering** (14 min · 2 practice) 🖼 📖 — When natural load-order pruning isn't enough on a large table, a clustering key co-locates rows so queries prune more. This lesson covers choosing keys, reading SYSTEM$CLUSTERING_INFORMATION (average_depth), automatic reclustering and its cost, and when NOT to cluster.
- **Caching — the three layers** (12 min · 2 practice) 🖼 📖 — The fastest query is the one you don't run. Snowflake caches at three levels — result cache, warehouse local-disk cache, and remote storage — and knowing how each behaves (especially around suspend) is a real tuning lever.
- **Materialized views** (12 min · 2 practice) 🖼 📖 — A materialized view precomputes and incrementally maintains a heavy single-table rollup, so repeated queries are instant — and the optimizer can auto-rewrite queries to use it. This lesson covers what MVs can and can't do, their cost, and MV vs Dynamic Table vs result cache.
- **Search Optimization Service** (11 min · 2 practice) 🖼 📖 — Clustering helps range/filter pruning; it doesn't help finding one needle in a huge table. The Search Optimization Service builds a search access path for selective point lookups on high-cardinality columns. This lesson covers when it helps, its cost, and clustering vs Search Optimization.
- **Reading the Query Profile** (13 min · 2 practice) 🖼 📖 — Tuning blind wastes time and money. The Query Profile tells you exactly which lever to pull. This lesson teaches the four signals to read — pruning ratio, spilling, exploding joins, and time-per-operator — and the fix each points to.

### Security & governance in depth

- **The RBAC model & role design** (14 min · 2 practice) 🖼 📖 — Snowflake access control is role-based with inheritance. This lesson covers the system roles, the grant chain, the professional functional/access-role pattern that scales, future grants, ownership, and the USAGE chain that trips everyone up.
- **Dynamic Data Masking** (12 min · 2 practice) 🖼 📖 — A masking policy rewrites a column's value at query time based on the caller's role or context — protecting PII with one governed copy, no duplication. This lesson covers full and conditional masking, applying policies via tags, and the gotchas.
- **Row Access Policies** (12 min · 2 practice) 🖼 📖 — Where masking hides columns, a row access policy hides rows — restricting which rows a role can see, enforced on every query. This lesson covers the mapping-table pattern, combining with masking, multi-tenant/region isolation, and performance.
- **Object tags & tag-based governance** (12 min · 2 practice) 🖼 📖 — Tags classify data by meaning, and binding policies to tags lets governance scale with the data instead of your effort. This lesson covers tags, tag-based masking/row policies, classification, tag lineage, discovery, and cost attribution.
- **Network policies & authentication** (12 min · 2 practice) 🖼 📖 — Perimeter and identity: network policies restrict where logins come from, and authentication (SSO, OAuth, key-pair, MFA) proves who's connecting. This lesson covers each, plus secure views, PrivateLink, and the service-account pattern.

### Modern platform in depth

- **Snowpark — Python/Scala in Snowflake** (14 min · 2 practice) 🖼 📖 — Snowpark lets you write Python/Java/Scala that executes inside Snowflake, next to the data — DataFrames, UDFs/UDTFs, stored procedures, and ML. This lesson covers the model, when to use it over SQL, and the cost/performance implications.
- **Iceberg tables — the open lakehouse** (13 min · 2 practice) 🖼 📖 — Iceberg tables let Snowflake operate on open Apache Iceberg data in your own cloud storage — no lock-in, shareable with Spark/Trino/Flink. This lesson covers external volumes, managed vs unmanaged (the who-writes decision), catalogs, and when to use Iceberg vs native tables.
- **Cortex — AI & ML in SQL** (13 min · 2 practice) 🖼 📖 — Cortex brings LLMs and ML to SQL with no infrastructure: LLM functions (complete/summarize/sentiment), ML functions (forecast/anomaly/classification), Cortex Analyst (NL→SQL), and Cortex Search (RAG). This lesson covers what's available, cost, and when to use it vs Snowpark ML.
- **Hybrid Tables (Unistore) — OLTP + analytics** (11 min · 2 practice) 🖼 📖 — Hybrid Tables bring row-store, primary-key, indexed transactional workloads to Snowflake — so operational point lookups/upserts run on the same platform as analytics. This lesson covers what they are, how they differ from standard tables, and when to use them.
- **Apps & data products — Streamlit, Native Apps, Clean Rooms** (11 min · 2 practice) 🖼 📖 — Snowflake isn't only a warehouse — you can build and distribute on it. This lesson covers Streamlit in Snowflake (interactive apps on governed data), Native Apps (package and monetize data+logic), and Data Clean Rooms (privacy-preserving collaboration).


## 15. 🧱 Databricks — complete course
_37 lessons — Become great at Databricks for data engineering: the lakehouse & Delta Lake, the platform & Photon, Unity Catalog governance, Lakeflow pipelines, performance & cost, and end-to-end medallion architecture._

### Databricks for Data Engineering

- **The Lakehouse & Delta Lake** (14 min · 3 practice) 🖼 📖 — What a lakehouse is — the cheap, open storage of a data lake plus the ACID reliability and governance of a warehouse — and how Delta Lake delivers it with a transaction log, time travel, MERGE, OPTIMIZE and Iceberg interop.
- **Platform, clusters & Photon** (13 min · 3 practice) 🖼 📖 — How Databricks is built — the Databricks-managed control plane vs the compute plane in your cloud — plus cluster types (all-purpose, job, SQL warehouse, serverless), the Photon engine, and how you pay (DBUs).
- **Unity Catalog — governance & the 3-level namespace** (13 min · 3 practice) 🖼 📖 — Databricks' unified governance layer — the catalog.schema.table namespace, centralized access control, automatic lineage and audit, external locations/volumes, and Delta Sharing — all consistent across every workspace and cloud.
- **Lakeflow — ingestion, pipelines & jobs** (14 min · 3 practice) 🖼 📖 — Databricks' unified data-engineering stack: Lakeflow Connect (managed ingestion), Lakeflow Declarative Pipelines (formerly Delta Live Tables — declarative SQL/Python with data-quality expectations), and Lakeflow Jobs (orchestration) — plus Auto Loader and Real-Time Mode.
- **Medallion architecture on Databricks (end to end)** (14 min · 3 practice) 🖼 📖 — The bronze → silver → gold pattern as a real Databricks pipeline — Auto Loader into bronze, expectations-gated silver, business-ready gold — built with Lakeflow Declarative Pipelines, and an honest guide to when Databricks fits.

### Spark, streaming, SQL, ML & DataOps

- **Spark & PySpark — DataFrames & optimization** (14 min · 2 practice) 🖼 📖 — Spark is the engine under Databricks. Learn the DataFrame API, lazy transformations vs actions, how jobs split into stages and tasks at shuffles, and the optimizations that matter: Catalyst, AQE, Photon, broadcast joins, caching, and skew handling.
- **Structured Streaming** (13 min · 2 practice) 🖼 📖 — Structured Streaming uses the same DataFrame API for unbounded data. Learn readStream/writeStream, sources like Auto Loader and Kafka, triggers, checkpointing for exactly-once, watermarks for late data, and Delta as a streaming source/sink.
- **Databricks SQL & BI** (12 min · 2 practice) 🖼 📖 — Databricks SQL serves BI directly on the lakehouse: serverless SQL warehouses with Photon, ANSI SQL on Delta/Unity Catalog, dashboards and alerts, and connectors for Power BI and Tableau — no separate warehouse to copy into.
- **Machine learning — MLflow, Feature Store, serving** (13 min · 2 practice) 🖼 📖 — Databricks runs the full ML lifecycle on the lakehouse: MLflow for experiment tracking and a model registry, a Feature Store for consistent features, AutoML, and Mosaic AI for model serving and GenAI — all governed by Unity Catalog, next to the data.
- **Capstone — DataOps with Asset Bundles & CI/CD** (14 min · 2 practice) 🖼 📖 — Ship Databricks pipelines like software: define jobs, Lakeflow pipelines, and clusters as code with Databricks Asset Bundles, version in Git, test in CI, and deploy across dev/staging/prod — over the full lakehouse stack governed by Unity Catalog.

### Spark in depth

- **Spark execution — Jobs, Stages & Tasks** (14 min · 2 practice) 🖼 📖 — Everything about Spark performance starts with how it actually runs: lazy transformations build a DAG, an action submits a Job, the driver splits it into Stages at shuffle boundaries, and each Stage runs as Tasks (one per partition) on executor slots. This is the mental model the rest of the module builds on.
- **Join strategies & the shuffle** (14 min · 2 practice) 🖼 📖 — A join's cost is almost entirely its shuffle. This lesson covers the shuffle mechanics and the three join strategies — broadcast hash, sort-merge, and shuffle-hash — how Spark (and AQE) chooses, the broadcast threshold, and how to force the right one.
- **Catalyst, AQE & Photon** (13 min · 2 practice) 🖼 📖 — The three optimizers that make Spark fast: Catalyst rewrites your plan before running, Adaptive Query Execution re-optimizes it using real runtime stats, and Photon is the vectorized C++ engine that executes it. Knowing what each does — and how to read the plan — is core Databricks performance literacy.

### Delta Lake in depth

- **Delta Lake & the transaction log** (14 min · 2 practice) 🖼 📖 — Delta Lake adds ACID transactions to Parquet on object storage — and it does it with one mechanism: an ordered transaction log. This lesson covers the _delta_log, how reads replay it into a consistent snapshot, optimistic concurrency, checkpoints, and why the log (not the files) is the source of truth.
- **Time travel & versioning** (12 min · 2 practice) 🖼 📖 — Because the log is versioned and data files are immutable, every commit is a queryable version of the table. This lesson covers VERSION/TIMESTAMP AS OF, DESCRIBE HISTORY, RESTORE, retention, and the practical uses — audit, debugging, rollback, and reproducible reads.
- **MERGE, upserts & CDC** (14 min · 2 practice) 🖼 📖 — MERGE is the operation a plain data lake can't do safely — and the heart of incremental loads. This lesson covers MERGE INTO syntax (matched/not-matched clauses), SCD Type 1 & 2 patterns, applying CDC, deduplication, idempotency, and MERGE performance.
- **OPTIMIZE, Z-ORDER & liquid clustering** (12 min · 2 practice) 🖼 📖 — Fix the small-file problem with OPTIMIZE bin-packing, lay data out for data skipping with Z-ORDER or (preferably) liquid clustering, and let auto-optimize keep tables tidy without manual jobs.
- **VACUUM, retention & deletion vectors** (11 min · 2 practice) 🖼 📖 — Reclaim storage from tombstoned files with VACUUM, understand how retention bounds time travel, and use deletion vectors to delete/update rows without rewriting whole files.
- **Change Data Feed (CDC)** (11 min · 2 practice) 🖼 📖 — Capture row-level inserts, updates, and deletes between Delta versions with Change Data Feed, and use it to drive incremental Silver→Gold pipelines without full re-scans.
- **Schema enforcement, evolution & constraints** (12 min · 2 practice) 🖼 📖 — Delta rejects schema-violating writes by default (enforcement), lets you grow the schema deliberately (evolution), and enforces data quality with NOT NULL/CHECK constraints and generated columns.

### Structured Streaming in depth

- **The streaming model & triggers** (12 min · 2 practice) 🖼 📖 — Spark treats a stream as an unbounded, ever-growing table and runs your batch-style query incrementally on each micro-batch — controlled by triggers and shaped by output modes.
- **Sources, sinks & exactly-once checkpointing** (12 min · 2 practice) 🖼 📖 — The checkpoint — committed offsets plus operator state plus a write-ahead log — is what makes Structured Streaming fault-tolerant and, with replayable sources and idempotent sinks, exactly-once.
- **Event time, windows & watermarks** (13 min · 2 practice) 🖼 📖 — Aggregate by when events happened (event time), not when they arrived; watermarks tell the engine how long to wait for late data before finalizing windows and dropping their state.
- **Stateful streaming: joins, dedup, aggregations** (13 min · 2 practice) 🖼 📖 — Operations that remember across micro-batches — aggregations, stream-stream joins, deduplication, and custom state — live in a checkpointed state store, bounded by watermarks.
- **Auto Loader — incremental file ingestion** (12 min · 2 practice) 🖼 📖 — Auto Loader (cloudFiles) incrementally ingests new files from cloud storage exactly once, scales to millions of files, and infers and evolves schema — the standard way to load files into the lakehouse.
- **Lakeflow Declarative Pipelines (DLT)** (12 min · 2 practice) 🖼 📖 — Declare your Bronze/Silver/Gold tables and data-quality expectations; the platform infers the dependency graph and handles orchestration, incremental processing, retries, autoscaling, and monitoring.

### Unity Catalog & governance in depth

- **The object model & three-level namespace** (12 min · 2 practice) 🖼 📖 — Unity Catalog governs all your data from one regional metastore using a three-level namespace — catalog.schema.object — with managed and external tables, views, volumes, and functions.
- **Securables, privileges & grants** (12 min · 2 practice) 🖼 📖 — Unity Catalog secures a hierarchy of objects with SQL GRANTs that inherit downward; ownership confers full control, and groups make it manageable.
- **External locations, credentials & volumes** (12 min · 2 practice) 🖼 📖 — Storage credentials hold the cloud identity, external locations bind a credential to a governed path, and volumes govern non-tabular files — so UC mediates all cloud access instead of raw keys.
- **Lineage, audit, tags & discovery** (11 min · 2 practice) 🖼 📖 — Once data is in Unity Catalog you get automatic column-level lineage, a full audit log, tags and comments for classification, and queryable metadata — governance without bolt-on tools.
- **Row filters, column masks & dynamic views** (12 min · 2 practice) 🖼 📖 — Enforce fine-grained access — different rows and masked columns per user — with row-filter and column-mask policies attached to a table, or with dynamic views, instead of copying data per audience.
- **Delta Sharing, Marketplace & clean rooms** (11 min · 2 practice) 🖼 📖 — Delta Sharing is an open protocol to share live data across organizations and platforms without copying it; it powers the Databricks Marketplace and privacy-safe clean rooms.

### DataOps & platform in depth

- **Clusters, Photon & serverless compute** (12 min · 2 practice) 🖼 📖 — A Databricks cluster is one driver coordinating many workers; Photon accelerates SQL/DataFrame work, autoscaling and auto-termination control cost, and the cluster type (job/all-purpose/serverless) is a key cost lever.
- **Workflows: orchestrating jobs** (11 min · 2 practice) 🖼 📖 — Databricks Workflows (Jobs) orchestrate multi-task DAGs with dependencies, retries, scheduling/triggers, notifications, and per-task compute — native orchestration without a separate scheduler.
- **Git, Asset Bundles & CI/CD** (12 min · 2 practice) 🖼 📖 — Version notebooks and jobs in Git via Repos, package code + jobs + config as a Databricks Asset Bundle, and deploy the same definition to dev/staging/prod through CI/CD — reproducible, reviewed releases.
- **Cost optimization** (11 min · 2 practice) 🖼 📖 — Databricks cost = DBUs × rate × time; the big levers are killing idle clusters (auto-terminate), using ephemeral job clusters and spot workers, enabling Photon, right-sizing, and attributing spend with tags.
- **Performance tuning with the Spark UI** (13 min · 2 practice) 🖼 📖 — Most Spark slowness is skew, spill, shuffle, or small files; diagnose the real bottleneck in the Spark UI, then apply the matching fix — AQE, broadcast joins, repartition/salting, OPTIMIZE, caching, or Photon.


## 16. ☁️ AWS for Data Engineering — complete course
_45 lessons — Become great at data engineering on AWS: the serverless-lakehouse stack — S3 + Glue Data Catalog + Athena + Redshift + Kinesis — with real syntax, cost levers, and when to use which service. (More modules — EMR, streaming, orchestration, Lake Formation — coming next.)_

### Core AWS data services

- **The AWS data stack & service map** (13 min · 2 practice) 🖼 📖 — AWS gives you building blocks, not one product. Learn the modern serverless-lakehouse pattern — S3 + Glue Catalog + Athena + Redshift + Kinesis + Lake Formation — the three-zone flow, and how to pick the right engine for a workload.
- **S3 — the data-lake foundation** (13 min · 2 practice) 🖼 📖 — S3 is the durable, cheap, open storage every AWS data pipeline is built on. Learn buckets and prefixes, partitioning, storage classes and lifecycle, security and encryption, columnar formats, and S3 Tables (managed Iceberg).
- **Glue — Data Catalog, crawlers & Spark ETL** (14 min · 2 practice) 🖼 📖 — AWS Glue is the serverless catalog + ETL engine of the AWS lake. Learn the Data Catalog (the shared metastore), crawlers, Glue Spark jobs (DynamicFrames vs DataFrames), job bookmarks for incremental loads, Data Quality, and zero-ETL.
- **Athena — serverless SQL on the lake (pay per scan)** (13 min · 2 practice) 🖼 📖 — Athena runs serverless Trino/Presto SQL directly on S3 via the Glue Catalog — no clusters. Because you pay per terabyte scanned, the whole game is scanning less: partitioning, partition projection, columnar Parquet, CTAS, and Iceberg.
- **Redshift — the cloud data warehouse** (14 min · 2 practice) 🖼 📖 — Redshift is AWS's MPP columnar warehouse for sustained, high-concurrency BI. Learn the leader/compute architecture, RA3 vs Serverless, the core tuning levers (distribution & sort keys), COPY, Spectrum, streaming ingestion and Zero-ETL.

### Processing, streaming, orchestration & governance

- **EMR — managed Spark/Hadoop at scale** (13 min · 2 practice) 🖼 📖 — EMR runs Spark, Hive, Presto and HBase on managed clusters that read and write S3. Learn the node roles, why compute is decoupled from storage, transient clusters and Spot, EMR Serverless, and when EMR beats Glue.
- **Kinesis — real-time streaming** (13 min · 2 practice) 🖼 📖 — Kinesis ingests real-time data. Learn Data Streams (shards, ordering, replay), producers and consumers, Firehose (the no-code path to S3/Redshift), shard scaling, and Kinesis vs MSK (Kafka).
- **Lambda, Step Functions & MWAA — orchestration** (13 min · 2 practice) 🖼 📖 — How AWS runs and coordinates pipeline work without servers: Lambda for event-driven tasks, Step Functions for state-machine workflows with retries, MWAA for managed Airflow DAGs, and EventBridge for events and schedules.
- **Lake Formation — central governance** (12 min · 2 practice) 🖼 📖 — Lake Formation is the permission layer over the lake: register S3 locations, then grant fine-grained (table/column/row/cell) and tag-based access that every engine — Athena, Redshift, EMR, Spark — enforces. The basis of SageMaker Lakehouse.
- **DynamoDB & DMS — operational data into the lake** (12 min · 2 practice) 🖼 📖 — Two ways operational data reaches analytics: DynamoDB (serverless NoSQL) with Streams/Zero-ETL feeding the lake, and DMS (Database Migration Service) doing full-load + CDC from relational sources into S3/Redshift.
- **Capstone — a reference AWS data platform** (14 min · 2 practice) 🖼 📖 — Assemble everything into one coherent platform: ingestion (Zero-ETL/DMS/Kinesis), an S3 lakehouse cataloged by Glue, processing with Glue/EMR, serving via Athena and Redshift, governed by Lake Formation, orchestrated by Step Functions/MWAA — plus IaC, cost and monitoring.

### S3 in depth

- **Data-lake layout: zones, prefixes & partitioning** (12 min · 2 practice) 🖼 📖 — S3 has no real folders — prefixes are your partition scheme. Lay the lake out in raw/clean/curated zones with Hive-style partitioned prefixes and right-sized columnar files so engines prune and scan cheaply.
- **Storage classes & lifecycle policies** (11 min · 2 practice) 🖼 📖 — Match each object's storage class to how often it's accessed — Standard, Infrequent Access, the Glacier tiers — and automate transitions/expiry with lifecycle policies or let Intelligent-Tiering do it.
- **Security: policies, encryption & access** (12 min · 2 practice) 🖼 📖 — Control access with layered IAM and bucket policies, keep Block Public Access on, encrypt at rest (SSE-S3/KMS) and in transit, and use access points and VPC endpoints for scalable, private access.
- **Performance, scale & multipart upload** (11 min · 2 practice) 🖼 📖 — S3 scales nearly infinitely if you spread requests across prefixes; use multipart upload for large objects, read only needed bytes with S3 Select/byte-range, and retry throttling with backoff.
- **Event-driven S3: notifications & replication** (10 min · 2 practice) 🖼 📖 — S3 can emit an event when objects are created so serverless pipelines react instantly (no polling), and replicate data cross-region or cross-bucket for DR, latency, or aggregation.

### Glue in depth

- **The Glue Data Catalog (central metastore)** (11 min · 2 practice) 🖼 📖 — The Glue Data Catalog is the lake's shared, Hive-compatible metastore — databases, tables, and partitions defining schema and S3 location — that Athena, Redshift Spectrum, EMR, and Glue ETL all read from.
- **Crawlers: schema & partition inference** (11 min · 2 practice) 🖼 📖 — Crawlers scan S3, infer schema and partitions via classifiers, and register tables in the Data Catalog — convenient automation, but with cost and mis-inference pitfalls that often make explicit DDL or partition projection better.
- **Glue ETL: Spark jobs & DynamicFrames** (12 min · 2 practice) 🖼 📖 — Glue runs serverless Spark ETL: DynamicFrames tolerate messy, changing schemas (with transforms like ApplyMapping and Relationalize), convert to DataFrames for full Spark SQL, and you pay per DPU with no clusters to manage.
- **Job bookmarks, triggers & workflows** (11 min · 2 practice) 🖼 📖 — Job bookmarks let Glue jobs process only new data each run (incremental, no reprocessing), while triggers and workflows chain crawlers and jobs into scheduled or event-driven pipelines.
- **Data Quality, DataBrew & interactive sessions** (10 min · 2 practice) 🖼 📖 — Glue is more than ETL: Glue Data Quality enforces rules (DQDL) with metrics, DataBrew offers no-code visual data prep, and interactive sessions let you develop Spark jobs in notebooks — all around the same catalog.

### Athena in depth

- **The engine: serverless SQL & pay-per-scan** (11 min · 2 practice) 🖼 📖 — Athena is serverless Trino over the Glue Catalog — no infrastructure, ANSI SQL on S3, billed per byte scanned. That pricing model makes 'scan less data' the single most important optimization.
- **Partitioning & partition projection** (12 min · 2 practice) 🖼 📖 — Partitions let Athena prune to relevant S3 prefixes and scan far less; partition projection computes partitions from a path pattern so you skip ADD PARTITION/crawlers entirely and new data is queryable instantly.
- **CTAS, INSERT INTO & SQL ELT** (11 min · 2 practice) 🖼 📖 — CREATE TABLE AS SELECT and INSERT INTO let Athena do ELT in pure SQL — converting raw data into optimized, partitioned, columnar tables and appending to them — without any separate ETL engine.
- **Performance & cost optimization** (12 min · 2 practice) 🖼 📖 — Because Athena bills per byte scanned, performance and cost are the same problem: use columnar+compressed formats, partition and prune, compact files, select only needed columns, bucket/sort on hot keys, and govern with workgroups.
- **Federated queries, Iceberg & UDFs** (11 min · 2 practice) 🖼 📖 — Athena goes beyond S3: federated queries join data in RDS/DynamoDB/Redshift in place via Lambda connectors, Iceberg tables bring ACID updates/time-travel to the lake, and Lambda UDFs plus Spark extend what you can do from SQL.

### Redshift in depth

- **Architecture: leader, compute nodes & slices** (12 min · 2 practice) 🖼 📖 — Redshift is a columnar MPP warehouse: a leader node plans queries and aggregates results while compute nodes (divided into slices) process data in parallel, with RA3 separating compute from managed storage.
- **Distribution styles (KEY/ALL/EVEN/AUTO)** (12 min · 2 practice) 🖼 📖 — Distribution style decides which slice each row lands on. Choosing it well co-locates joined rows to avoid network shuffles — the single biggest driver of Redshift query performance.
- **Sort keys & zone maps** (11 min · 2 practice) 🖼 📖 — Sort keys physically order rows so each 1 MB block's min/max (zone map) lets Redshift skip blocks that can't match a filter — like an index for range/equality predicates. Compound vs interleaved suit different query patterns.
- **Spectrum: query the lake from Redshift** (11 min · 2 practice) 🖼 📖 — Redshift Spectrum runs Redshift SQL directly over S3 via the Glue Catalog, so you keep hot data in the warehouse, leave cold/huge data in the lake, and join across both — without loading everything into Redshift.
- **Loading: COPY, UNLOAD, VACUUM & ANALYZE** (11 min · 2 practice) 🖼 📖 — Load data with COPY (massively parallel from S3, not row-by-row INSERTs), export with UNLOAD, and keep tables healthy with VACUUM (reclaim/re-sort) and ANALYZE (stats) — much of which modern Redshift now automates.
- **Serverless, WLM, concurrency scaling & MVs** (11 min · 2 practice) 🖼 📖 — Redshift Serverless removes cluster sizing (auto-scaling RPUs, pay per use); WLM routes and prioritizes workloads; concurrency scaling bursts extra capacity under load; and materialized views plus result caching cut repeated work.

### Kinesis & streaming in depth

- **Kinesis Data Streams: shards & ordering** (12 min · 2 practice) 🖼 📖 — Kinesis Data Streams is a durable, replayable log made of shards; the partition key routes each record to a shard (giving per-key ordering), throughput scales with shard count, and a bad key creates hot shards.
- **Firehose: managed delivery** (10 min · 2 practice) 🖼 📖 — Amazon Data Firehose is fully managed, shardless delivery: it buffers streaming data, optionally transforms and converts it to Parquet, and loads it into S3, Redshift, OpenSearch, and more — no infrastructure to manage.
- **Streaming analytics with Managed Flink** (11 min · 2 practice) 🖼 📖 — Amazon Managed Service for Apache Flink runs real stream processing — event-time windows, watermarks, stateful joins and aggregations, exactly-once — over Kinesis/MSK, for real-time metrics, anomaly detection, and enrichment.
- **MSK (managed Kafka) vs Kinesis** (10 min · 2 practice) 🖼 📖 — Amazon MSK is managed Apache Kafka — the open-source streaming standard with a rich ecosystem and portability — while Kinesis is AWS-native and simpler. Choose MSK for Kafka compatibility/ecosystem, Kinesis for AWS-native simplicity.

### Lake Formation governance in depth

- **The Lake Formation permissions model** (11 min · 2 practice) 🖼 📖 — Lake Formation layers simple GRANT-style permissions (database/table/column) over the Glue Catalog, so you govern lake access centrally instead of hand-managing S3 bucket policies and IAM per dataset.
- **LF-Tags & fine-grained access** (12 min · 2 practice) 🖼 📖 — LF-Tags (tag-based access control) let you grant on tags instead of thousands of individual objects, and data filters provide column-, row-, and cell-level security so different principals see different parts of the same table.
- **Cross-account sharing & data mesh** (11 min · 2 practice) 🖼 📖 — Lake Formation (with Resource Access Manager) shares catalog data across AWS accounts with fine-grained, governed grants and no copies — the foundation for a data mesh where domains own and share data products.
- **Engine enforcement & setup** (10 min · 2 practice) 🖼 📖 — Every AWS analytics engine (Athena, Redshift Spectrum, EMR, Glue) enforces Lake Formation permissions by asking LF for access and receiving only the permitted columns/rows — one consistent policy across all engines, with credential vending.

### Orchestration & compute in depth

- **EMR & EMR Serverless: managed Spark** (12 min · 2 practice) 🖼 📖 — EMR runs big-data frameworks (Spark, Hive, Presto, HBase) in three forms — EC2 clusters (max control + spot), EMR Serverless (no cluster ops), and EMR on EKS (Spark on Kubernetes) — for heavy/complex jobs where Glue's simplicity isn't enough.
- **Step Functions: serverless orchestration** (11 min · 2 practice) 🖼 📖 — AWS Step Functions is the native serverless orchestrator: define a state machine that chains AWS services with branching, parallel/Map, built-in retries and catch, and visual monitoring — ideal for AWS-centric workflows.
- **MWAA: managed Airflow** (10 min · 2 practice) 🖼 📖 — Amazon MWAA runs managed Apache Airflow — AWS operates the scheduler, workers, and web UI while you write Python DAGs — for complex, cross-system orchestration where you want Airflow's ecosystem, portability, and existing skills.
- **Lambda for data engineering** (10 min · 2 practice) 🖼 📖 — AWS Lambda is the event-driven glue of data pipelines: short, serverless functions triggered by S3/Kinesis/EventBridge that do light transforms or validation and trigger the heavy engines — bounded by a 15-minute limit, so offload big work to Glue/EMR.
- **Choosing an orchestrator** (10 min · 2 practice) 🖼 📖 — Match the orchestrator to the job: Step Functions for AWS-native serverless workflows, MWAA for complex/cross-system Airflow DAGs and portability, Glue Workflows for Glue-centric pipelines, and EventBridge+Lambda for lightweight event-driven triggers.


## 17. 🟦 GCP for Data Engineering — complete course
_31 lessons — Become great at data engineering on Google Cloud: the BigQuery-centered serverless lakehouse — GCS, BigQuery (deep), Dataflow, Dataproc, Pub/Sub, Composer, Dataform, Datastream/Bigtable and Dataplex — with real syntax and when to use what._

### Core GCP data services

- **The GCP data stack & service map** (13 min · 2 practice) 🖼 📖 — Google Cloud's data stack centers on BigQuery. Learn the building blocks — GCS, BigQuery, Dataflow, Dataproc, Pub/Sub, Composer, Dataform, Datastream, Dataplex — the two canonical pipelines, and how to pick the right service.
- **Cloud Storage — the data-lake foundation** (12 min · 2 practice) 🖼 📖 — GCS is the durable, cheap object store under every GCP data pipeline. Learn buckets and prefixes, storage classes and lifecycle, location and security, and how BigLake surfaces GCS data as BigQuery tables.
- **BigQuery — the serverless lakehouse** (15 min · 2 practice) 🖼 📖 — BigQuery is GCP's serverless analytics engine. Learn its decoupled storage/compute architecture (Colossus + Dremel + slots), datasets and tables, loading and streaming, external/BigLake/Iceberg tables, BigQuery Omni, and BQML.
- **BigQuery — performance & cost** (13 min · 2 practice) 🖼 📖 — BigQuery cost and speed come down to scanning less and choosing the right pricing model. Learn partitioning, clustering, on-demand vs capacity (slots/reservations), BI Engine, materialized views, and query best practices.
- **Dataflow — Apache Beam (batch + streaming)** (14 min · 2 practice) 🖼 📖 — Dataflow is serverless Apache Beam — one programming model for both batch and streaming. Learn PCollections and transforms, event-time windowing and watermarks, the Pub/Sub→Dataflow→BigQuery pattern, templates, and Dataflow vs Dataproc.

### Processing, streaming, orchestration & governance

- **Dataproc — managed Spark/Hadoop** (12 min · 2 practice) 🖼 📖 — Dataproc runs Spark, Hadoop, Hive and Presto on managed clusters that read GCS. Learn the node roles, ephemeral clusters with the GCS connector, preemptible workers, Dataproc Serverless, and when to use it over Dataflow or BigQuery.
- **Pub/Sub — global messaging & streaming** (12 min · 2 practice) 🖼 📖 — Pub/Sub is GCP's serverless event backbone. Learn topics and subscriptions, push vs pull, fan-out, ordering keys, at-least-once vs exactly-once, dead-letter topics, and how it feeds Dataflow.
- **Cloud Composer — managed Airflow** (12 min · 2 practice) 🖼 📖 — Cloud Composer runs Apache Airflow for you. Learn DAGs and operators, the GCP-native operators (BigQuery, Dataflow, Dataproc), scheduling and backfills, sensors and retries, and when to use Composer vs Workflows vs Dataform's scheduler.
- **Dataform — ELT in BigQuery (dbt-style)** (13 min · 2 practice) 🖼 📖 — Dataform brings software engineering to BigQuery SQL: SQLX models, ref()-based dependency graphs, incremental tables, assertions as tests, tags, and Git-based version control — all native to BigQuery.
- **Datastream & Bigtable — CDC and NoSQL** (12 min · 2 practice) 🖼 📖 — Two operational-data services: Datastream (serverless CDC from relational databases into BigQuery/GCS) and Bigtable (wide-column NoSQL for massive low-latency workloads). Learn what each is for and how they feed analytics.
- **Dataplex — govern the lakehouse** (12 min · 2 practice) 🖼 📖 — Dataplex is the governance plane over GCS + BigQuery: organize data into lakes/zones, auto-catalog and profile it, track lineage, run data-quality scans, and enforce policy tags and row-level security — the basis of a governed data mesh.
- **Capstone — a reference GCP data platform** (14 min · 2 practice) 🖼 📖 — Assemble the whole GCP stack: ingest (Datastream/DTS/Pub/Sub+Dataflow), a GCS+BigQuery lakehouse, transform with Dataform/Dataflow/Dataproc, serve via BigQuery+Looker, govern with Dataplex, orchestrate with Composer — plus IaC, cost and security.

### BigQuery in depth

- **Architecture: Dremel, slots & separated storage/compute** (12 min · 2 practice) 🖼 📖 — BigQuery is fully serverless: columnar storage (Colossus/Capacitor) is decoupled from massively-parallel compute (Dremel slots) connected by the Jupiter network, so storage and compute scale independently with no clusters to manage.
- **Partitioning & clustering** (12 min · 2 practice) 🖼 📖 — Partitioning prunes whole partitions (by date/ingestion-time/integer range) and clustering sorts rows within partitions on up to four columns so the engine skips blocks — together the top levers to cut bytes scanned (cost and latency).
- **Pricing & cost control** (11 min · 2 practice) 🖼 📖 — BigQuery bills compute two ways — on-demand (per TB scanned) or capacity (reserved/autoscaling slots via editions) — plus storage; control cost with partitioning/clustering, column selection, materialized views, BI Engine, and maximum-bytes-billed guardrails.
- **Loading & streaming ingestion** (11 min · 2 practice) 🖼 📖 — Batch-load from GCS (Parquet/Avro/CSV/JSON) with free load jobs, stream in real time via the Storage Write API, or query data in place with external/BigLake tables — choosing by latency, cost, and whether data should live in BigQuery.
- **Query optimization** (12 min · 2 practice) 🖼 📖 — Because BigQuery bills bytes scanned, optimization means scanning less (select needed columns, filter on partition/cluster keys, avoid SELECT *) and shuffling smart for big joins (denormalize/nested data, broadcast small joins, approximate aggregations) — guided by the query execution plan.
- **Materialized views, BI Engine, BQML & BigLake** (11 min · 2 practice) 🖼 📖 — BigQuery is a platform, not just a query engine: materialized views precompute aggregations, BI Engine accelerates dashboards in memory, BigQuery ML trains and predicts in SQL, and BigLake governs and queries open data across clouds.

### Dataflow (Apache Beam) in depth

- **The Beam model: unified batch + streaming** (12 min · 2 practice) 🖼 📖 — Apache Beam is a unified, portable programming model: a pipeline is a DAG of PCollections (datasets) transformed by PTransforms, and the SAME code runs over bounded (batch) or unbounded (streaming) data on any runner — Dataflow being GCP's serverless runner.
- **Windowing, watermarks & triggers** (13 min · 2 practice) 🖼 📖 — Beam's streaming power is its event-time model: windows bucket unbounded data by event time, watermarks track event-time progress, and triggers decide when to emit results — giving full control over the completeness-vs-latency trade-off.
- **Core transforms: ParDo, GroupByKey, Combine** (11 min · 2 practice) 🖼 📖 — Beam pipelines are built from composable transforms: ParDo (per-element processing), GroupByKey/CoGroupByKey (grouping/joins), Combine (aggregations), side inputs (broadcast lookups), and stateful DoFns with timers for advanced streaming.
- **The Dataflow runner: serverless autoscaling** (11 min · 2 practice) 🖼 📖 — Dataflow is the fully-managed, serverless runner for Beam: it provisions and autoscales workers, fuses stages, dynamically rebalances stragglers, and offloads shuffle and streaming state to managed services — you submit a pipeline and it runs, no clusters.
- **Templates & choosing Dataflow** (10 min · 2 practice) 🖼 📖 — Dataflow templates package pipelines so they can be launched by parameters (including Google-provided no-code templates), and the key judgment is when to use Dataflow (streaming/complex Beam) vs Dataproc (Spark), BigQuery/Dataform (SQL ELT), or a direct Pub/Sub→BigQuery path.

### Pub/Sub in depth

- **Topics, subscriptions & fan-out** (11 min · 2 practice) 🖼 📖 — Pub/Sub is GCP's global, serverless messaging backbone: publishers send to a topic, and each subscription gets its own copy of every message (fan-out), decoupling producers from consumers with auto-scaling, at-least-once delivery.
- **Delivery: pull/push, ack, ordering & exactly-once** (12 min · 2 practice) 🖼 📖 — Pub/Sub delivers at-least-once by default — subscribers ack within a deadline or messages are redelivered — with opt-in ordering keys, exactly-once delivery, dead-letter topics for poison messages, and retention/replay (seek) to reprocess.
- **Streaming ingestion patterns** (10 min · 2 practice) 🖼 📖 — Pub/Sub is the front door for streaming on GCP: events flow into a topic, then either a Dataflow pipeline (for transforms/windowing) or a direct BigQuery subscription (for simple ingest) lands them for real-time analytics.

### Cloud Storage in depth

- **GCS: classes, lifecycle, security & events** (12 min · 2 practice) 🖼 📖 — Cloud Storage is GCP's object store and data-lake foundation: one global namespace with strong consistency, storage classes by access frequency (Standard→Nearline→Coldline→Archive), lifecycle/Autoclass automation, IAM-based security, versioning/retention, and event notifications to Pub/Sub.

### Dataproc, orchestration & governance in depth

- **Dataproc: managed Spark/Hadoop** (11 min · 2 practice) 🖼 📖 — Dataproc runs managed Spark/Hadoop on GCP for lift-and-shift of existing OSS code, using ephemeral clusters (spin up, run, delete) with preemptible VMs and GCS storage for low cost — or Dataproc Serverless; choose it over Dataflow when you have existing Spark/skills.
- **Cloud Composer: managed Airflow** (10 min · 2 practice) 🖼 📖 — Cloud Composer is managed Apache Airflow on GCP — AWS-of-GCP's MWAA equivalent — for complex, cross-system orchestration via Python DAGs; Cloud Workflows is the lighter serverless option for simple service orchestration.
- **Dataform: SQL ELT in BigQuery** (10 min · 2 practice) 🖼 📖 — Dataform brings dbt-style software engineering to BigQuery SQL: define SQLX models with ref()-based dependencies, incremental builds, assertions (tests), and Git/CI-CD, and Dataform compiles a dependency DAG and runs the SQL in BigQuery — serverless ELT, no data movement.
- **Dataplex: lakehouse governance** (10 min · 2 practice) 🖼 📖 — Dataplex unifies governance across GCS and BigQuery: organize data into logical lakes/zones, auto-catalog and discover metadata with lineage, enforce data-quality rules, and centralize security/policy — governing the whole lakehouse from one control plane.


## 18. 🛠️ DataOps & Infrastructure
_16 lessons — Ship pipelines like software: containers, version control, CI/CD, and monitoring._

### Engineering discipline

- **Git — version control fundamentals** (13 min · 4 practice) 🖼 📖 — Track every change to your code: the staging model, commits, branches, and the core command workflow.
- **GitHub — collaboration, pull requests & Actions** (13 min · 4 practice) 🖼 📖 — Collaborate through pull requests and code review, pick a branching strategy, and automate with GitHub Actions.
- **CI/CD for data pipelines** (13 min · 4 practice) 🖼 📖 — Automatically test every change and deploy merged changes safely — the assembly line for data code.
- **Containers (Docker) & reproducibility** (10 min · 4 practice) 🖼 — Packaging code with its dependencies into portable, reproducible containers — solving 'works on my machine' and making data jobs run identically everywhere.

### DataOps in practice

- **Data testing in CI/CD** (11 min · 4 practice) 🖼 📖 — Building automated test gates into the pipeline: unit tests for logic, data tests/assertions, schema and data-diff checks, run in CI so bad changes never reach production.
- **Infrastructure as code** (11 min · 4 practice) 🖼 — Defining cloud infrastructure in version-controlled, declarative code (Terraform) instead of clicking consoles — for reproducible, reviewable, automatable environments.
- **Data observability & SLAs** (11 min · 4 practice) 🖼 📖 — Knowing the health of your data, not just your jobs: the pillars (freshness, volume, schema, distribution, lineage), SLAs/SLOs, and tools that catch bad data before consumers do.
- **Monitoring, alerting & on-call for data** (10 min · 4 practice) 🖼 — Operating data systems in production: what to monitor, effective alerting without fatigue, on-call and incident response, and runbooks/postmortems.

### Platform & release engineering

- **Containers & Kubernetes for data** (11 min · 4 practice) 🖼 — Orchestrating containers at scale with Kubernetes: pods, scheduling, scaling, self-healing — and how data tools (Spark, Airflow) run on K8s.
- **Data contracts** (10 min · 4 practice) 🖼 — Formal agreements on data shape and semantics between producers and consumers — enforced like an API, so upstream changes don't silently break downstream.
- **Secrets & configuration management** (10 min · 4 practice) 🖼 — Handling credentials and config safely: never hard-code secrets, use secrets managers and roles, separate config from code, and inject per environment.
- **Environments & safe releases** (10 min · 4 practice) 🖼 — Using separate dev/staging/prod environments and release strategies (blue-green, canary, feature flags) to ship data changes without breaking production.

### The DE craft & career

- **Design docs & RFCs for data systems** (12 min · 3 practice) 🖼 📖 — How senior data engineers align on a system before building it — the design doc / RFC, its sections, the options trade-off table that drives the decision, and the ADR that records the why.
- **Stakeholder communication & the translation job** (12 min · 3 practice) 🖼 📖 — A data engineer's real job is translation — turning fuzzy business asks into metric definitions, schemas, and pipelines, and communicating clearly with analysts, scientists, PMs and engineers.
- **The DE career map — leveling, resume & negotiation** (12 min · 3 practice) 🖼 📖 — How data-engineering careers progress from junior to staff — what each level owns — and how to build a resume, portfolio and negotiation that reflect it.

### Interview prep

- **DataOps & Infrastructure interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review for the DataOps track: high-frequency answers and a 10-question mock interview.


## 19. 🛡️ Data Quality, Governance & Security
_11 lessons — Make data trustworthy, discoverable, and safe — the things that separate pros from amateurs._

### Trust & safety

- **Data quality — validate & quarantine** (11 min · 4 practice) 🖼 — The dimensions of data quality, how to check them automatically, and what to do with bad data — validate at the boundary and quarantine rather than corrupt or block.
- **PII, security & governance** (11 min · 4 practice) 🖼 — Protecting personal and sensitive data: what PII is, the principles (minimize, classify, control, encrypt, audit), and why governance is everyone's responsibility.

### Governing data responsibly

- **Data lineage & catalogs** (11 min · 4 practice) 🖼 📖 — Two pillars of discoverability and trust: lineage (what feeds what) for impact/root-cause analysis, and the data catalog for finding, understanding, and governing data.
- **Privacy law & compliance (GDPR, PII)** (11 min · 4 practice) 🖼 📖 — What privacy regulations require of data engineers: GDPR's core principles and rights, the engineering capabilities they demand (deletion, access, consent, minimization), and why non-compliance is costly.
- **Access control & data masking** (11 min · 4 practice) 🖼 — Controlling who sees what at fine granularity: RBAC/ABAC, row- and column-level security, and masking/tokenization techniques to expose only what each user needs.

### Enterprise governance

- **Data mesh — decentralizing data ownership** (11 min · 4 practice) 🖼 — An organizational approach to scaling data: domain-owned data products, self-serve platform, federated governance, and data-as-a-product — vs the central-team bottleneck.
- **Master data management** (10 min · 4 practice) 🖼 — Creating a single, trusted source of truth for core business entities (customers, products) across systems — matching, merging, and a golden record to end conflicting data.
- **Encryption & key management** (11 min · 4 practice) 🖼 — Protecting data with cryptography: encryption at rest and in transit, symmetric vs asymmetric, and the key-management hierarchy (KMS, envelope encryption, rotation) that makes it real.
- **Compliance frameworks — GDPR, HIPAA, SOC 2 & more** (10 min · 4 practice) 🖼 — The major regulatory and certification frameworks a data platform may need to satisfy, what each covers, and the common engineering controls that span them.
- **Data classification & retention** (10 min · 4 practice) 🖼 — Tagging data by sensitivity to drive controls automatically, and lifecycle/retention policies that keep data only as long as needed — for compliance, cost, and risk.

### Interview prep

- **Governance, Quality & Security interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review for the Governance track: high-frequency answers and a 10-question mock interview.


## 20. 🚀 Performance & Optimization
_7 lessons — Make pipelines and queries fast and cheap: measure first, scan less, tune Spark, lay out data well, cache, and right-size._

### Tuning fundamentals

- **The performance mindset — measure, then optimize** (10 min · 4 practice) 🖼 📖 — Find the real bottleneck before tuning, and remember every optimization is 'do less work'.
- **SQL & query optimization** (12 min · 4 practice) 🖼 📖 — Make the database read less data: read the plan, index, partition, project, and filter early.
- **Spark performance tuning** (13 min · 4 practice) 🖼 📖 — Manage shuffle, skew, and partitions — and let AQE, broadcast joins, and caching do the heavy lifting.

### Data layout, caching & cost

- **Data layout — partitioning, file sizing & compaction** (12 min · 4 practice) 🖼 📖 — How data is physically laid out in files is often the biggest performance lever in a lake or warehouse.
- **Caching & pre-computation** (11 min · 4 practice) 🖼 📖 — Don't recompute the same expensive result — cache it or pre-aggregate it.
- **Cost & scaling efficiency** (11 min · 4 practice) 🖼 📖 — In the cloud, performance and cost are the same lever — scan less, right-size compute, and don't move data.

### Interview prep

- **Performance & Optimization interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review: high-frequency answers and a mock interview.


## 21. 🤖 Machine Learning for Data Engineers
_15 lessons — _

### ML foundations

- **Where data engineering meets ML** (13 min · 4 practice) 🖼 📖 — The ML lifecycle and the data engineer's job in it — because ML is mostly data engineering.
- **Machine learning fundamentals** (10 min · 1 practice) 🖼 📖 — What machine learning actually is — supervised vs unsupervised, classification vs regression — so you know what data and infrastructure each kind needs.
- **Exploratory Data Analysis (EDA)** (11 min · 1 practice) 🖼 📖 — Profiling data before modeling — shape, missing values, distributions, outliers, correlations, target balance — to catch quality issues and inform cleaning and features.

### Data for ML

- **Data for ML: splits, leakage & labels** (13 min · 4 practice) 🖼 📖 — Get the data right: correct train/val/test splits, avoid leakage, and source quality labels.
- **Preprocessing data for ML** (11 min · 1 practice) 🖼 📖 — Turning raw data into a clean numeric matrix models need — imputing missing values, encoding categoricals, scaling numerics — without leaking from train to test.
- **Feature engineering & feature stores** (14 min · 4 practice) 🖼 📖 — Turn raw data into model inputs, and serve them consistently for training and inference with a feature store.

### Modeling & evaluation

- **Common ML algorithms** (11 min · 1 practice) 🖼 📖 — A data engineer's survey of the algorithms you'll support — regression, trees, ensembles, clustering, neural nets — and the data and compute each one needs.
- **Model evaluation & metrics** (12 min · 1 practice) 🖼 📖 — How models are judged — train/val/test splits, cross-validation, classification and regression metrics, and overfitting — so you can build evaluation and monitoring.
- **Training pipelines & experiment tracking** (13 min · 4 practice) 🖼 📖 — Make training reproducible and automated — a pipeline that pulls features, trains, evaluates, and registers.

### Production & MLOps

- **Model registry & versioning** (12 min · 4 practice) 🖼 📖 — The system of record for trained models: versions, stages, lineage, and a promotion workflow.
- **Model serving: batch & online inference** (13 min · 4 practice) 🖼 📖 — Two ways to deliver predictions — scheduled batch scoring and low-latency real-time APIs.
- **MLOps: CI/CD, monitoring & drift** (13 min · 4 practice) 🖼 📖 — Operate models in production: automate training/deploy, and monitor for drift and decay.

### Modern ML data

- **Embeddings & vector databases** (14 min · 4 practice) 🖼 📖 — Turn text/images into vectors, store them in a vector database, and power semantic search and RAG.
- **RAG data pipelines — retrieval-augmented generation** (13 min · 2 practice) 🖼 📖 — How data engineers build the pipelines behind RAG — indexing documents into a vector store (load, chunk, embed) and serving retrieval at query time — plus the quality levers, freshness, and evaluation that make it a real data-engineering problem.

### Interview prep

- **ML for Data Engineers interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review: high-frequency answers and a mock interview.


## 22. 🤖 Agentic AI for Data Engineers
_11 lessons — Build with the 2026 agentic stack — MCP, A2A, LangGraph/CrewAI/Claude Agent SDK — and apply it to real data work: self-healing pipelines, text-to-SQL, and quality agents._

### Agentic foundations

- **What is an agentic system?** (13 min · 3 practice) 🖼 📖 — An agent = an LLM that reasons, calls tools, observes results, and loops until a goal is met — not a one-shot chatbot.
- **Anatomy: tools, memory & planning** (15 min · 3 practice) 🖼 📖 — The four parts of every agent — LLM reasoning core, tools (function calling), memory, and planning — and how they fit.

### Protocols (the 2026 standards)

- **MCP — Model Context Protocol** (15 min · 3 practice) 🖼 📖 — The open standard (Anthropic → Linux Foundation) for connecting agents to tools & data — write one server, every agent can use it.
- **A2A & multi-agent protocols** (12 min · 3 practice) 🖼 📖 — A2A lets agents delegate to each other (horizontal), while MCP connects an agent to tools (vertical) — complementary layers.

### Frameworks & orchestration

- **Agent frameworks compared (2026)** (16 min · 3 practice) 🖼 📖 — LangGraph, Claude Agent SDK, CrewAI, AutoGen/AG2, LlamaIndex, Pydantic AI — what each is best at, chosen by your constraint.
- **Multi-agent orchestration** (15 min · 3 practice) 🖼 📖 — An orchestrator coordinating specialist agents (ingestion, transform, quality, repair) — the production pattern for agentic pipelines.

### Agentic data engineering in practice

- **Self-healing & autonomous pipelines** (16 min · 3 practice) 🖼 📖 — The flagship 2026 use case — agents that detect anomalies, diagnose root cause, and auto-fix or escalate.
- **Text-to-SQL & code-gen agents** (15 min · 3 practice) 🖼 📖 — Natural-language → validated SQL/pipeline code (Databricks Genie Code, Snowflake Cortex Code) — with the guardrails that make it trustworthy.
- **Data quality & contract agents** (13 min · 3 practice) 🖼 📖 — Agents that continuously validate data, enforce contracts, quarantine bad records, and trigger corrective action.
- **Guardrails, evaluation & governance** (14 min · 3 practice) 🖼 📖 — Make agents safe to trust: permissions, validation, evals, cost limits, and human-in-the-loop — because agents can be confidently wrong.

### Interview prep

- **Agentic AI interview prep & cheat sheet** (12 min · 3 practice) 📖 — The agentic concepts now showing up in 50LPA+ DE interviews — distilled to a one-page review with likely questions.


## 23. 🎯 System Design & Interview Mastery
_19 lessons — Put it all together: design end-to-end pipelines and ace the senior interview._

### Designing & interviewing

- **A framework for any pipeline design** (11 min · 4 practice) 🖼 — A repeatable structure for designing (and interviewing on) any data system: clarify requirements, then walk data characteristics, ingestion, storage, processing, serving, scale, and trade-offs.
- **Choosing batch vs streaming (and cost)** (10 min · 4 practice) 🖼 — The most consequential design fork: when low-latency streaming is truly needed vs when simpler, cheaper batch suffices — and the cost/complexity implications.

### The design method

- **Capacity & cost estimation** (11 min · 4 practice) 🖼 📖 — Back-of-the-envelope sizing: estimating data volume, throughput, storage, and cost so your design is grounded in numbers, not hand-waving.
- **Trade-offs — latency, cost & complexity** (11 min · 4 practice) 🖼 — The unavoidable tensions in every data design: latency vs cost vs complexity (and consistency/freshness vs accuracy) — there's no free lunch, only deliberate choices.
- **Worked example — design an analytics pipeline** (12 min · 4 practice) 🖼 📖 — End-to-end application of the design framework to a concrete problem: an analytics platform for an e-commerce company's BI dashboards.

### Design & interview mastery

- **Choosing the right storage & tool** (11 min · 4 practice) 🖼 — A decision guide for picking the right data store for an access pattern: OLTP database, warehouse, lakehouse, NoSQL family, cache, or search/vector — match the tool to the job.
- **Scaling strategies — vertical, horizontal & caching** (11 min · 4 practice) 🖼 — How to make a system handle more load: scale up (bigger machine), scale out (more machines + partitioning), and cache — with their trade-offs.
- **Worked example — real-time analytics** (12 min · 4 practice) 🖼 — Applying the framework to a low-latency problem: a real-time dashboard/alerting system where streaming genuinely earns its complexity.
- **Acing the DE interview — process & behavioral** (11 min · 4 practice) 🖼 — How data-engineering interviews are structured and how to excel: the technical rounds, the system-design approach, behavioral/STAR answers, and communicating your thinking.

### Distributed systems fundamentals

- **Partitioning & sharding** (11 min · 1 practice) 🖼 📖 — Partitioning (sharding) splits data across nodes so it scales horizontally; choose a key that spreads load evenly AND matches your queries — hash for even point-lookup distribution, range for time/range scans — and the enemy is always skew (a hot key/range causing a straggler).
- **Replication, consistency & CAP** (12 min · 1 practice) 🖼 📖 — Replication keeps copies for availability, durability, and read scale; the CAP theorem says that during a network partition you must trade Consistency vs Availability, and PACELC adds the else-latency-vs-consistency trade — analytics usually tolerate eventual consistency, while financial/exactly-once needs stronger guarantees.
- **Delivery guarantees & idempotency** (11 min · 1 practice) 🖼 📖 — Distributed messaging offers at-most-once (may lose), at-least-once (may duplicate — the common default), or exactly-once (no loss/dup, via dedup/transactions); since most systems are at-least-once, designing idempotent consumers (apply-twice == apply-once) is what makes retries safe.
- **Fault tolerance, backpressure & observability** (11 min · 1 practice) 🖼 📖 — Assume everything fails: use retries with backoff and dead-letter queues for errors, queues/backpressure to absorb spikes, checkpoints + replay to recover, and observability (freshness, volume, quality, lineage + alerts) to detect problems — the operational backbone of a reliable pipeline.

### DE system-design case studies

- **Design a data warehouse / lakehouse platform** (13 min · 1 practice) 🖼 📖 — The most common DE design: clarify the requirements (BI/analytics, hourly-fresh, moderate-to-large volume), then build sources → ingestion (batch + CDC) → a medallion lakehouse (bronze→silver→gold, Delta/Iceberg) → warehouse/serving → BI/ML, with orchestration, governance, and observability — and state the batch-vs-streaming and one-copy-many-engines trade-offs.
- **Design a real-time metrics pipeline** (12 min · 1 practice) 🖼 📖 — When low latency IS required: events → a durable log (Kafka/Pub/Sub) → a stream processor doing event-time windowed aggregation (with watermarks and exactly-once) → a fast serving store (OLAP/Redis) → dashboards, plus a lake archive for replay/history (Kappa) — designed for the streaming concerns: windows, watermarks, idempotency, and backpressure.
- **Design a CDC ingestion system** (12 min · 1 practice) 🖼 📖 — To replicate an operational database into the lake/warehouse without heavy queries: read the DB's transaction log (CDC via Debezium/Datastream) → stream change events through Kafka → apply them with an idempotent MERGE (upsert by primary key) into a mirror table — with an initial snapshot then incremental, per-key ordering, delete/schema-change handling, and exactly-once via dedup.
- **Design a data quality & observability system** (11 min · 1 practice) 🖼 📖 — To keep data trustworthy: embed quality gates (rules/expectations on freshness, volume, schema, nulls/ranges/uniqueness) into pipelines — pass → publish, fail → quarantine + alert — and track the four observability signals (freshness, volume, quality, lineage) with metrics, SLAs, and on-call alerting, treating data as a product.
- **Worked example — event tracking & recommendations** (12 min · 4 practice) 🖼 — A capstone design tying batch, streaming, storage, ML, and serving together: an event-tracking pipeline feeding a recommendation system.

### Interview prep

- **System Design interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review: high-frequency answers and a mock interview.


## 24. 🎯 Interview Question Bank (50LPA+)
_25 lessons — A research-backed bank of real questions from FAANG, Goldman Sachs and major banks — organized by round and by company (per-company playbooks for 16 top employers - Amazon, Google, Meta, Microsoft, Netflix, Databricks, Uber, Airbnb, LinkedIn, Apple, Stripe, plus banks/finance: Goldman Sachs, JPMorgan, Morgan Stanley, Capital One, Bloomberg), with detailed solutions, code, and links to the matching tutorials._

### How the loop works

- **The 50LPA+ interview loop (how it works)** (12 min · 3 practice) 🖼 📖 — The real 2026 structure at FAANG, Goldman & banks — the rounds, what each tests, and how to prepare per stage.

### Technical rounds

- **SQL round — question bank** (22 min · 4 practice) 🖼 📖 — Easy→hard SQL asked at Goldman, Meta, Amazon & banks — window functions, CTEs, gaps-and-islands, dedup — with full solutions.
- **Coding & DSA round — question bank** (20 min · 4 practice) 📖 — Python data-structures & algorithms as asked in CoderPad screens — plus DE-flavored problems (dedupe streams, merge sorted files), with solutions.
- **Data modeling round — question bank** (20 min · 4 practice) 🖼 📖 — Schema design, star vs snowflake, SCD Type 1/2, fact grain, late-arriving data — the round Meta weights most — with worked answers.
- **Big data & Spark round — question bank** (20 min · 4 practice) 🖼 📖 — Spark internals asked at Goldman, banks & FAANG — shuffles, skew, joins, partitioning, OOM, AQE — with precise answers.

### Design & behavioral

- **System & pipeline design round — question bank** (24 min · 4 practice) 🖼 📖 — The design round decoded — a repeatable 6-step method, plus full worked designs (e-commerce warehouse, fraud streaming, CDC, and a 2026 LLM/RAG pipeline).
- **Behavioral & leadership round — question bank** (16 min · 4 practice) 📖 — The scored behavioral round — STAR, Amazon Leadership Principles, Goldman values — with example questions and answer frameworks.

### Company playbooks (full loop)

- **Company playbooks: Google, Meta, Amazon, Goldman, JPMorgan** (18 min · 3 practice) 📖 — Round-by-round breakdown per company — what each weights, the format, and how to tailor your prep.
- **Amazon - DE interview playbook** (15 min · 2 practice) — Amazon's data-engineer loop (SQL-heavy technical screen + onsite: SQL, coding/ETL, data modeling, system design, and Leadership-Principles behavioral) with signature questions, answers, and links to the concepts.
- **Google - DE interview playbook** (14 min · 2 practice) — Google's DE loop (an online SQL+Python assessment, then a 4-5 round onsite) with a BigQuery/GCP flavor - SQL depth, coding, data modeling, and large-scale system design - plus signature questions, answers, and concept links.
- **Meta - DE interview playbook** (14 min · 2 practice) — Meta's DE loop (a technical phone with ~25 min SQL + ~25 min Python, then an onsite of product sense, SQL/ETL, data modeling, and behavioral) with its product-analytics flavor - signature questions, answers, and concept links.
- **Microsoft - DE interview playbook** (14 min · 2 practice) — Microsoft's DE loop (online assessment/technical screen, then a 4-5 round 'as-appropriate' onsite) with an Azure flavor - SQL, coding/DSA, data modeling, Azure system design, and growth-mindset behavioral - with signature questions, answers, and concept links.
- **Netflix - DE interview playbook** (14 min · 2 practice) — Netflix's senior-heavy DE loop (recruiter, technical screen, then an onsite of strong SQL, dimensional modeling, big-data pipeline design, and a rigorous culture/behavioral) with its Iceberg/Spark/Presto stack flavor - signature questions, answers, and concept links.
- **Databricks - DE interview playbook** (15 min · 2 practice) — Databricks' DE loop (technical screen with SQL + Spark, then an onsite of Spark internals, Delta Lake, lakehouse/medallion design, SQL, and behavioral) - the deepest Spark-performance and Delta questions of any company, with answers, code, and concept links.
- **Uber - DE interview playbook** (14 min · 2 practice) — Uber's DE loop (technical screen with SQL + Python, then an onsite of advanced SQL, marketplace data modeling, real-time pipeline/system design, coding, and behavioral) with its streaming-heavy Kafka/Flink/Hive/Presto stack - signature questions, answers, and concept links.
- **Airbnb - DE interview playbook** (14 min · 2 practice) — Airbnb's DE loop (SQL-heavy technical screen, then an onsite of advanced SQL, dimensional modeling, data quality/metrics, pipeline/Airflow design, and behavioral) - reflecting its Airflow + metrics-layer + data-quality culture, with questions, answers, and concept links.
- **LinkedIn - DE interview playbook** (14 min · 2 practice) — LinkedIn's DE loop (technical screen with SQL + coding, then a CS-heavy onsite of SQL, DSA coding, data modeling, streaming/pipeline system design, and values-based behavioral) reflecting its Kafka-origin streaming stack - questions, answers, code, and concept links.
- **Apple - DE interview playbook** (13 min · 2 practice) — Apple's team-dependent DE loop (technical screen, then an 'as-appropriate' onsite of SQL, Spark/coding, data modeling, pragmatic system design, and behavioral) with a privacy/quality bent - signature questions, answers, and concept links.
- **Stripe - DE interview playbook** (14 min · 2 practice) — Stripe's DE loop (practical technical screen, then an onsite of SQL, real-world coding, financial data modeling, correctness-obsessed system design, and operating-principles behavioral) where idempotency, exactly-once, and reconciliation are the whole game - questions, answers, code, and concept links.
- **Goldman Sachs - DE interview playbook** (15 min · 2 practice) — Goldman Sachs' DE loop (HackerRank OA, then a DSA phone screen, then a 3-5 round onsite: SQL, Python coding, Spark/big-data internals, data modeling/architecture, and values-based behavioral) with signature questions, answers, code, and concept links.
- **JPMorgan Chase - DE interview playbook** (15 min · 2 practice) — JPMorgan's DE loop (recruiter, a long technical round on Java/Python + Big Data + AWS with hands-on PySpark, then an exec/manager round) - broad and practical, with signature questions, answers, code, and concept links.
- **Morgan Stanley - DE interview playbook** (14 min · 2 practice) — Morgan Stanley's DE loop (recruiter, a DE-fundamentals technical phone, then 3-5 back-to-back finals: SQL, Python coding, ETL/system design, and behavioral + hiring manager) with a finance-domain flavor - signature questions, answers, code, and concept links.
- **Capital One - DE interview playbook** (14 min · 2 practice) — Capital One's DE loop (CodeSignal gateway assessment, recruiter, then a back-to-back 'Power Day' of coding, a business case study, and behavioral/job-fit) - AWS-heavy with a signature business-case round - with questions, answers, code, and concept links.
- **Bloomberg - DE interview playbook** (14 min · 2 practice) — Bloomberg's DE loop (a CoderPad technical phone, optional OA, then a 3-5 round onsite of practical DE+coding, Python/Pandas data manipulation, system design, and behavioral) - the most selective, production-code-bar DE loop - with questions, answers, code, and concept links.
- **Interview bank prep & cheat sheet** (12 min · 3 practice) 📖 — A consolidated study plan and one-page cheat sheet across all rounds — your final review before the loop.


## 25. 🏗️ Capstone Projects
_16 lessons — _

### Real-world pipelines

- **Capstone: API ingestion to a queryable lake** (16 min · 4 practice) 🖼 📖 — Combine Requests, Pydantic, Polars, fsspec/S3 and DuckDB into one batch ELT pipeline.
- **Capstone: files to a published report** (15 min · 4 practice) 🖼 📖 — Turn raw files into a stakeholder deliverable with DuckDB, seaborn/matplotlib, and openpyxl.
- **Capstone: an orchestrated, quality-gated pipeline** (16 min · 4 practice) 🖼 📖 — Wrap extract/validate/transform/load in a Prefect flow with retries, a data-quality gate, and a schedule.
- **Capstone: synthetic data & engine benchmark** (14 min · 4 practice) 🖼 📖 — Generate data with Faker, then benchmark pandas vs Polars vs DuckDB to know when to use which.
- **Capstone: a real-time streaming pipeline** (16 min · 4 practice) 🖼 📖 — Process events the moment they arrive — Kafka, a stream processor with windows, and a live serving sink.
- **Capstone: analytics engineering with dbt** (16 min · 4 practice) 🖼 📖 — Build a tested, documented warehouse in layers with dbt — sources to staging to marts.
- **Capstone: a medallion lakehouse** (16 min · 4 practice) 🖼 📖 — Turn a raw lake into a reliable lakehouse with bronze/silver/gold layers on Delta/Iceberg.
- **Capstone: change data capture to the lake** (15 min · 4 practice) 🖼 📖 — Keep a lake in sync with a source database in near-real-time using log-based CDC.
- **Capstone: feature store to served model** (17 min · 4 practice) 🖼 📖 — The whole ML track in one project — ingest, features, training, registry, serving, and monitoring.
- **Capstone: RAG ingestion pipeline (docs → vectors)** (18 min · 4 practice) 🖼 📖 — Turn documents into a searchable vector index for LLMs — the #1 new data-engineering workload of 2025-26.
- **Capstone: an open Iceberg lakehouse** (17 min · 4 practice) 🖼 📖 — Build a multi-engine open lakehouse on Apache Iceberg + a REST catalog — the settled 2026 architecture.
- **Capstone: data contracts & shift-left quality** (15 min · 4 practice) 🖼 📖 — Stop breaking changes at the source: enforce schema + SLA contracts in CI before bad data ships.
- **Capstone: real-time analytics serving** (16 min · 4 practice) 🖼 📖 — Serve sub-second, high-concurrency analytics straight from streaming events with a real-time OLAP store.
- **Capstone: data observability & FinOps** (15 min · 4 practice) 🖼 📖 — Make the platform trustworthy and cost-aware: monitor the 5 data-health pillars and attribute spend per pipeline.
- **Capstone: a big-bank data platform (your stack, end to end)** (20 min · 3 practice) 🖼 📖 — The flagship showcase — DataStage ETL, GCS, PySpark/Databricks, streaming, Greenplum, dbt, contracts and CI/CD combined into one runnable bank pipeline across batch and streaming.

### Interview prep

- **Capstone projects interview prep & cheat sheet** (13 min · 1 practice) 📖 — Consolidated rapid-review: high-frequency answers and a mock interview.


## 26. 🧮 DSA for Data Engineering
_16 lessons — The data structures & algorithms that actually matter for data engineering — complexity at scale, hashing/dedup, sorting & external merge, heaps/top-K, probabilistic structures (Bloom/HLL/Count-Min), storage-engine trees (B-tree/LSM), graphs/DAGs for pipeline scheduling, and the SQL/coding patterns DE interviews ask._

### Complexity & core structures

- **Big-O & complexity for data workloads** (11 min · 2 practice) 🖼 📖 — Big-O describes how cost grows with data size; at scale the exponent dominates, so choosing algorithms (especially join strategies) by complexity — and minding memory (spill) and network (shuffle) — is what keeps pipelines fast.
- **Hash maps & sets: dedup, group-by, joins** (11 min · 2 practice) 🖼 📖 — Hash tables give ~O(1) insert/lookup and are the single most-used structure in data work — the basis of GROUP BY, DISTINCT/deduplication, frequency counts, and hash joins (build a map of one side, probe with the other).
- **Two pointers & sliding windows** (10 min · 2 practice) 🖼 📖 — Two-pointer and sliding-window techniques turn nested-loop O(n·k) work into a single O(n) pass by maintaining a moving range with incremental updates — the algorithmic basis of rolling aggregates, sessionization, and top-N-per-window.

### Sorting, heaps & selection

- **Sorting & external merge sort** (11 min · 2 practice) 🖼 📖 — Sorting is O(n log n) and everywhere in DE (ORDER BY, sort-merge joins, deduplication); when data exceeds memory, external merge sort makes in-memory sorted runs and merges them — the basis of distributed sort and the Spark shuffle.
- **Merging k sorted streams** (9 min · 1 practice) 🖼 📖 — Merging k sorted inputs into one sorted output with a min-heap is O(n log k) — the merge phase of external sort and the way to combine sorted runs, sorted partitions, or ordered streams efficiently.
- **Heaps & top-K selection** (10 min · 1 practice) 🖼 📖 — A heap (priority queue) gives O(log n) insert and O(1) min/max access; the headline DE use is top-K — keep a size-K min-heap to find the K largest of n items in O(n log K) time and O(K) memory, without sorting everything.

### Probabilistic & hashing structures at scale

- **Bloom filters: membership at scale** (11 min · 2 practice) 🖼 📖 — A Bloom filter answers set membership ('have I seen this?') in a tiny bit array with NO false negatives and tunable false positives — used to skip expensive lookups/joins for keys that are definitely absent (LSM-trees, dedup, caches).
- **HyperLogLog: approximate distinct counts** (11 min · 2 practice) 🖼 📖 — HyperLogLog estimates COUNT(DISTINCT) — cardinality — in a fixed few kilobytes with ~1-2% error, and its sketches merge across partitions; it's how APPROX_COUNT_DISTINCT works in BigQuery/Spark/Redshift for unique counts at massive scale.
- **Count-Min Sketch: approximate frequencies** (10 min · 1 practice) 🖼 📖 — Count-Min Sketch estimates per-key frequencies in fixed memory (a grid of counters + hashes), never under-counting — used to find heavy hitters / hot keys in a massive stream without storing every key's exact count.
- **Consistent hashing: partitioning & rebalancing** (10 min · 1 practice) 🖼 📖 — Consistent hashing places keys and nodes on a ring so that adding/removing a node moves only ~1/N of the keys (not everything) — the basis for scalable sharding, distributed caches, and rebalancing in systems like Cassandra/DynamoDB.

### Storage-engine & tree structures

- **B-tree vs LSM-tree: the two storage engines** (12 min · 2 practice) 🖼 📖 — The two dominant storage-engine designs make opposite trade-offs: B-trees update in place for read-optimized random access (most RDBMS/SQL indexes), while LSM-trees buffer and append for write-optimized sequential writes (Cassandra/RocksDB/HBase) — the fundamental read-vs-write-amplification choice behind every index.
- **Tries: prefix trees for strings** (9 min · 1 practice) 🖼 📖 — A trie (prefix tree) stores strings by shared prefixes, giving O(key-length) lookup and efficient prefix search — the structure behind autocomplete, IP/longest-prefix routing, dictionary/prefix matching, and tokenization.

### Graphs & DAGs for pipelines

- **Topological sort: scheduling pipeline DAGs** (11 min · 1 practice) 🖼 📖 — A topological sort orders the nodes of a DAG so every task comes after its dependencies — exactly how orchestrators (Airflow, Dataform, dbt, Spark) schedule pipeline DAGs; and the same algorithm detects cycles (circular dependencies = no valid order).
- **Graph traversal: lineage & reachability** (10 min · 1 practice) 🖼 📖 — BFS and DFS traverse a graph in O(V+E) to answer reachability questions; in DE these are data-lineage and dependency problems — 'what feeds this table?' (upstream), 'what breaks if I change it?' (downstream), shortest dependency paths, and impact analysis.

### SQL patterns & interview strategy

- **Algorithmic patterns in SQL** (11 min · 1 practice) 🖼 📖 — The DSA patterns map directly to SQL: window functions ARE the algorithms — ROW_NUMBER for dedup/top-N-per-group, frames for sliding windows, running sums for prefix sums, LAG/LEAD for sessionization (gaps-and-islands), and recursive CTEs for graph/DAG traversal.
- **DE coding interview patterns & strategy** (11 min · 1 practice) 🖼 📖 — DE coding interviews lean on a handful of patterns — hashing (dedup/group), two pointers/sliding window (ranges), heaps (top-K), sort/merge (order), graphs (dependencies), and sketches (scale) — plus a strategy: clarify, examples, brute force then optimize, state complexity, test edge cases.


## 27. 📈 Data Visualization & Diagrams
_16 lessons — Turn data into charts that tell the truth clearly, and draw the architecture, ER, flow and sequence diagrams data engineers use to design and communicate systems._

### Data visualization

- **Choosing the right chart** (9 min · 2 practice) 🖼 📖 — Match the chart to the question you're answering - comparison, trend, distribution, relationship, or part-to-whole - so the takeaway is obvious at a glance.
- **Comparison & ranking: the bar chart** (9 min · 2 practice) 🖼 📖 — The bar chart is the workhorse for comparing values across categories - sort it, start at zero, and it reads instantly.
- **Trends over time: the line chart** (8 min · 2 practice) 🖼 📖 — For change over continuous time, the line chart shows direction and rate at a glance; keep the time axis ordered and proportional.
- **Distributions: histogram, box & violin** (9 min · 2 practice) 🖼 📖 — To show the shape and spread of one variable - center, spread, skew, outliers - use a histogram, box plot, or violin, each with different trade-offs.
- **Relationships: the scatter plot** (8 min · 2 practice) 🖼 📖 — To see whether two numeric variables move together, use a scatter plot; add size/color for more variables; use hexbin/density when points overlap.
- **Part-to-whole & flows** (8 min · 2 practice) 🖼 📖 — To show how parts make up a whole - or how quantities flow between stages - use stacked bars/treemaps and sankey/funnel/waterfall, and avoid the pie trap.
- **Visualization principles & pitfalls** (9 min · 2 practice) 🖼 📖 — Charts can mislead as easily as inform - zero baselines, honest scales, intentional color, and less chartjunk keep them truthful and clear.

### Diagrams for data engineers

- **Architecture & data-flow diagrams** (9 min · 2 practice) 🖼 📖 — The boxes-and-arrows diagram that shows how a data system fits together - components, data stores, and how data moves - plus the data-flow diagram (DFD) for the transform view.
- **ER diagrams & schema notation** (9 min · 2 practice) 🖼 📖 — The entity-relationship diagram documents tables, their keys, and how they relate using crow's-foot notation - the standard for OLTP schema design and understanding source systems.
- **Star schema diagrams** (8 min · 2 practice) 🖼 📖 — The diagram at the heart of dimensional modeling - a central fact table surrounded by dimension tables - is how you communicate and design an analytics warehouse.
- **Pipeline DAGs** (8 min · 2 practice) 🖼 📖 — The directed acyclic graph is how orchestrators (Airflow, dbt, Dagster) represent a pipeline - tasks as nodes, dependencies as edges - and how you reason about order, parallelism, and failure.
- **Sequence diagrams** (8 min · 2 practice) 🖼 📖 — When the question is 'what talks to what, in what order?', a sequence diagram shows actors as lifelines and messages flowing down in time - ideal for API/event flows and debugging distributed interactions.
- **C4 model & diagramming in interviews** (10 min · 2 practice) 🖼 📖 — The C4 model gives diagrams consistent zoom levels - Context, Container, Component, Code - and provides the method for whiteboarding a data system in a design interview.

### Diagrams as code (Mermaid)

- **Mermaid: diagrams as code (flowcharts)** (9 min · 2 practice) 🖼 📖 — Mermaid turns plain text into diagrams - a flowchart is a few lines in a fenced code block that render to SVG in GitHub, docs, and this app. Version-controlled, diffable, no binary image files.
- **Mermaid for data diagrams (sequence, ER, state, gantt)** (9 min · 2 practice) 🖼 📖 — Beyond flowcharts, Mermaid draws the other diagrams DEs use - sequence, ER, state, and gantt - all from text, so every diagram type from this track can be diagrams-as-code.
- **Mermaid in practice: embedding & when to use it** (8 min · 2 practice) 🖼 📖 — Where Mermaid renders, how to embed it, tooling to author it, and when diagrams-as-code is the right call versus a dedicated drawing tool.

