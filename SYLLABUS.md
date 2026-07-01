# DataForge Academy — Full Syllabus

_17 tracks · 250 lessons · 155 deep-dive tutorials · 958 practice problems · 705 quiz questions · 191 lessons with diagrams_


Every lesson has a plain-English concept, a worked example, key points, a quiz, and multiple practice problems with full solutions (SQL lessons include a live in-browser SQL playground). Lessons marked 🖼 include an SVG diagram; lessons marked 📖 have a deep-dive tutorial under `content/lessons/`.


## 1. 🧱 Foundations of Data  
_10 lessons — The bedrock every data engineer needs: the role itself, data types & file formats, encodings & compression, OLTP vs OLAP, the data lifecycle, serialization, distributed-systems basics, and data quality — the concepts everything else builds on._


### Getting your bearings

- **What is a Data Engineer?** (9 min · 4 practice) — The role that builds and operates the systems moving and shaping data — how it differs from data scientists and analysts, and what skills it spans.
- **Structured, semi-structured & unstructured data** (9 min · 4 practice) — The three shapes of data — tables, JSON/logs, and text/images — how they differ, and how data engineers handle each.
- **Files & formats — CSV, JSON, Parquet** (10 min · 4 practice) 🖼 — Why the file format you pick (row-based CSV/JSON vs columnar Parquet) hugely affects analytics speed, cost, and size.


### How data really works

- **Bits, bytes & character encodings** (9 min · 4 practice) — The physical units of data and how text becomes bytes — bits/bytes, ASCII vs UTF-8, and why encoding mismatches cause garbled data.
- **OLTP vs OLAP — two very different jobs** (10 min · 4 practice) 🖼 📖 — The fundamental split between transactional systems (run the business) and analytical systems (understand the business) — and why they're built oppositely.
- **The data lifecycle — source to insight** (9 min · 4 practice) 🖼 — The end-to-end journey of data through a platform — generate, ingest, store, transform, serve, analyze — and how every track in this curriculum maps to a stage.


### Bytes, formats & systems

- **Compression — gzip, Snappy, Zstd & columnar** (9 min · 4 practice) — Why and how data is compressed: the ratio-vs-speed trade-off, common codecs, splittability, and why columnar formats compress so well.
- **Serialization formats — Avro, Protobuf, JSON** (9 min · 4 practice) — How data structures become bytes for storage/transmission: text vs binary, schema vs schemaless, and when to use JSON, Avro, or Protobuf.
- **Distributed systems — the basics every DE needs** (11 min · 4 practice) — Why data systems span many machines and the core ideas that follow: partitioning, replication, consistency, fault tolerance, and the network as the bottleneck.


### Data quality foundations

- **Data quality — the six dimensions** (10 min · 4 practice) 🖼 — What makes data trustworthy: the six dimensions of quality, how to measure them, and why quality is foundational to every data decision.


## 2. 🗄️ Databases & SQL  
_27 lessons — Master SQL end to end — from the relational model and single-table queries to joins, window functions, transactions, indexing and query tuning — the language every data engineer lives in._


### Querying single tables

- **The relational model & how a query runs** (12 min · 3 practice) 🖼 📖 — Tables, rows, columns, keys and NULL; SQL's sublanguages; and the logical order a query is actually evaluated in.
- **SELECT — columns, expressions, aliases & DISTINCT** (11 min · 3 practice) 📖 — Choose and compute columns: column lists vs *, arithmetic & string expressions, AS aliases, literals, and DISTINCT.
- **Sorting & limiting — ORDER BY, LIMIT, top-N & pagination** (10 min · 3 practice) 📖 — Order results by one or many keys, control NULL placement, take the top N, and paginate with LIMIT/OFFSET (and why keyset paging scales better).
- **Filtering rows — WHERE, IN, BETWEEN, LIKE & NULL** (12 min · 4 practice) 📖 — Every way to keep the rows you want: comparison & logical operators with precedence, IN, BETWEEN, LIKE patterns, and the NULL/three-valued-logic traps.
- **Aggregates & GROUP BY** (12 min · 3 practice) 🖼 📖 — Summarize rows into groups: COUNT/SUM/AVG/MIN/MAX, COUNT(*) vs COUNT(col) vs COUNT(DISTINCT), grouping by one or many columns, and how NULLs behave.
- **HAVING — filtering groups (WHERE vs HAVING)** (10 min · 3 practice) 🖼 📖 — Filter aggregated groups with HAVING, understand exactly why it differs from WHERE, and combine WHERE + GROUP BY + HAVING in the right order.


### Combining tables

- **Joins — combining tables on a key** (13 min · 3 practice) 🖼 📖 — Why data lives in many tables and how JOIN stitches it back: the join key, ON vs USING, multi-table chains, join-then-aggregate, and the fan-out (grain) trap.
- **Join types — INNER, LEFT/RIGHT/FULL, CROSS, SELF & anti-joins** (13 min · 3 practice) 🖼 📖 — Pick the right join: INNER vs the OUTER joins (and their NULLs), CROSS products, SELF joins, and the semi/anti-join patterns for 'has/has-no match'.
- **Set operations — UNION, INTERSECT & EXCEPT** (9 min · 3 practice) 🖼 📖 — Stack and compare whole result sets vertically: UNION vs UNION ALL, INTERSECT, EXCEPT, the column-compatibility rules, and the dedup cost.
- **Subqueries — scalar, IN, EXISTS & correlated** (12 min · 3 practice) 📖 — Queries inside queries: scalar subqueries, IN/ANY/ALL, derived tables in FROM, and correlated EXISTS/NOT EXISTS — plus when to prefer a join or CTE.
- **CTEs — WITH clauses & recursion** (12 min · 3 practice) 🖼 📖 — Name subquery results with WITH for readable, reusable, top-to-bottom queries — chain multiple steps, and recurse over hierarchies and sequences.


### Analytic SQL

- **Window functions — OVER, PARTITION BY & ranking** (14 min · 3 practice) 🖼 📖 — Compute across related rows without collapsing them: the OVER clause, PARTITION BY, and the ranking family (ROW_NUMBER, RANK, DENSE_RANK, NTILE).
- **GROUPING SETS, ROLLUP & CUBE** (10 min · 3 practice) 🖼 📖 — Compute many grouping levels — detail, subtotals, grand totals, and all combinations — in one query with GROUPING SETS, ROLLUP and CUBE.
- **Analytic functions — LAG/LEAD, running totals & dedup** (13 min · 3 practice) 🖼 📖 — The day-to-day analytic patterns: LAG/LEAD for period-over-period, frames for running totals and moving averages, FIRST/LAST_VALUE, and ROW_NUMBER dedup.
- **CASE & conditional logic** (10 min · 3 practice) 📖 — If/then inside SQL: searched vs simple CASE, bucketing and labeling, conditional aggregation (pivot with CASE), and the COALESCE/NULLIF shortcuts.
- **Pivoting — rows to columns & back** (10 min · 4 practice) 🖼 📖 — Reshape data: pivot rows into columns with conditional aggregation (and the PIVOT operator), and unpivot columns back into rows.


### Functions & data types

- **NULL handling & three-valued logic** (11 min · 3 practice) 🖼 📖 — The one concept behind countless SQL bugs: NULL = unknown, three-valued logic, IS NULL / IS DISTINCT FROM, COALESCE/NULLIF, and how NULLs behave in filters, aggregates, joins, ordering and uniqueness.
- **String functions & pattern matching** (11 min · 3 practice) 📖 — Clean and parse text in SQL: concat, case, trim, substring, replace, position, split, padding, and regex — the toolkit for taming messy source data.
- **Dates, times & time zones** (12 min · 3 practice) 📖 — Work with time correctly: current time, date arithmetic with intervals, EXTRACT and DATE_TRUNC for rollups, formatting/parsing, diffs, and the time-zone rules every DE must know.
- **JSON & semi-structured data** (11 min · 3 practice) 🖼 📖 — Query JSON inside SQL: JSON vs JSONB, extracting fields and nested paths, unnesting arrays, building JSON, indexing, and when columns beat a JSON blob.


### Defining & changing data

- **DDL, DML, data types & constraints** (13 min · 3 practice) 🖼 📖 — Define and change data: CREATE/ALTER/DROP, INSERT/UPDATE/DELETE, choosing data types, and the constraints (PK, FK, UNIQUE, NOT NULL, CHECK, DEFAULT) that protect integrity.
- **Normalization — 1NF through BCNF** (12 min · 3 practice) 🖼 📖 — Organize tables to kill redundancy and update anomalies: functional dependencies, 1NF/2NF/3NF/BCNF in plain English, and when to deliberately denormalize.
- **Views & materialized views** (10 min · 3 practice) 🖼 📖 — Save a query as a reusable virtual table: plain views for abstraction/security, materialized views for pre-computed speed, and how each refreshes.
- **Stored procedures, functions & triggers** (10 min · 4 practice) 📖 — Server-side logic in the database: procedures vs functions (UDFs), parameters and control flow, triggers and their pitfalls, and when this helps vs hurts.


### Performance & reliability

- **Indexes — B-trees, composite, covering & costs** (13 min · 3 practice) 🖼 📖 — How indexes turn scans into lookups: the B-tree, composite/leftmost-prefix, covering indexes, clustered vs non-clustered, B-tree vs hash, and the write-cost trade-off.
- **Transactions, ACID & isolation levels** (13 min · 3 practice) 🖼 📖 — Group operations atomically: ACID, COMMIT/ROLLBACK, the read anomalies (dirty/non-repeatable/phantom), the four isolation levels, and locking vs MVCC.
- **EXPLAIN & query optimization** (12 min · 3 practice) 🖼 📖 — Read what the engine actually does: EXPLAIN/ANALYZE, scan and join strategies, spotting the bottleneck, the role of statistics, and the standard fixes.


## 3. 🐍 Python for Data Engineering  
_59 lessons — _


### Python you'll actually use

- **Data types — numbers, strings, booleans & None** (12 min · 4 practice) 📖 — Python's core scalar types, type conversion, dynamic typing, and truthiness.
- **Collections — lists, tuples, dictionaries & sets** (14 min · 4 practice) 📖 — Python's four built-in containers: when to use each, and their key operations.
- **Loops — for, while & loop control** (12 min · 4 practice) 📖 — Every way Python repeats work: for, range, while, break/continue/pass, for-else, nested loops, enumerate & zip.
- **Functions — parameters, return, scope & lambdas** (12 min · 3 practice) 📖 — Package reusable logic: parameters, defaults, return values, *args/**kwargs, scope, and lambdas.
- **Lambda functions — small anonymous functions** (11 min · 4 practice) 🖼 📖 — One-line anonymous functions: syntax, when to use them (especially sort keys), map/filter, limits, and the late-binding gotcha.
- **Files & I/O — reading and writing data** (11 min · 4 practice) 📖 — Read and write files safely: context managers, modes, encoding, line-by-line streaming, and pathlib.


### Python for data work

- **Comprehensions — list, dict, set & generator** (11 min · 4 practice) 📖 — Build and transform collections in one readable line — the Pythonic alternative to loop-and-append.
- **Strings & text processing** (12 min · 4 practice) 📖 — Create, index, slice, and transform text: methods, f-strings, immutability, and a taste of regex.
- **Error handling — try / except / else / finally** (12 min · 4 practice) 📖 — Catch and handle errors cleanly: exception types, raising your own, and failing safely in pipelines.
- **JSON & CSV — parsing the formats you'll meet daily** (11 min · 4 practice) 📖 — Read and write the two most common data formats with Python's built-in json and csv modules.
- **Dates & time — datetime, parsing & timezones** (11 min · 4 practice) 📖 — Parse and format timestamps, do date arithmetic, and avoid the timezone bugs that bite everyone.
- **Iterators & generators — processing data lazily** (12 min · 4 practice) 🖼 📖 — Stream huge datasets one item at a time with generators (yield) instead of loading everything into memory.
- **Functional Python — map, filter, reduce & higher-order functions** (10 min · 4 practice) 📖 — A compact, composable style for transforming data — and the mindset behind Spark transformations.


### Professional Python

- **Classes & objects (OOP)** (14 min · 4 practice) 🖼 📖 — Bundle data and behaviour into classes: __init__, self, methods, inheritance, dunder methods, and dataclasses.
- **Virtual environments & dependencies** (10 min · 4 practice) 📖 — Isolate each project's packages and pin versions so your code is reproducible everywhere.
- **Testing with pytest** (11 min · 4 practice) 📖 — Automated checks that prove your code works — and keep working as you change it.


### Engineering-grade Python

- **Decorators & context managers** (12 min · 4 practice) 📖 — Wrap functions to add behaviour (retries, timing, caching) and guarantee cleanup with the with-statement.
- **Concurrency — threads, processes & async (the GIL)** (13 min · 4 practice) 🖼 📖 — Do many things at once and pick the right tool: threading for I/O, multiprocessing for CPU, asyncio for scale.
- **Logging & configuration** (10 min · 4 practice) 📖 — Replace print() with real logging, and keep settings/secrets out of your code.
- **Connecting Python to databases** (11 min · 4 practice) 📖 — Query databases safely: parameterized queries, connection pools, and bulk loads — never string-built SQL.
- **Ingesting data from REST APIs** (11 min · 4 practice) 📖 — Pull data from web APIs reliably: pagination, rate limits, retries with backoff, auth, and incremental loads.


### The Python standard library

- **os & sys — talking to the operating system** (13 min · 4 practice) 🖼 📖 — Read environment variables, work with files and folders, and control the running program.
- **pathlib — modern file paths** (12 min · 4 practice) 🖼 — The clean, object-oriented way to build paths, find files, and read/write — across any OS.
- **re — regular expressions for text** (14 min · 4 practice) 🖼 📖 — A mini-language for finding, extracting, validating, and cleaning patterns in text.
- **collections — specialized containers** (12 min · 4 practice) 🖼 📖 — Counter, defaultdict, deque, and namedtuple make common data tasks cleaner and faster.
- **itertools & functools — iterator & function tools** (13 min · 4 practice) 🖼 — Lazy iterators for memory-light pipelines, plus tools for caching and composing functions.
- **subprocess — run external commands** (12 min · 4 practice) 🖼 — Call other programs (git, dbt, aws, shell tools) from Python and capture their output safely.
- **argparse — command-line interfaces** (12 min · 4 practice) 🖼 — Turn a script into a real CLI tool with arguments, options, defaults, and auto-generated help.
- **shutil, glob, tempfile & compression** (12 min · 4 practice) — High-level file operations: copy/move/archive, pattern-find files, safe temp space, and gzip/zip.
- **typing & dataclasses — type hints & clean records** (13 min · 4 practice) 🖼 — Annotate types to catch bugs and aid editors, and generate tidy record classes with no boilerplate.


### NumPy — numerical computing

- **NumPy — the ndarray, dtypes & memory** (13 min · 4 practice) 🖼 — Why NumPy is fast: a contiguous block of one dtype, with views that share memory.
- **NumPy — vectorization, ufuncs & broadcasting** (13 min · 4 practice) 🖼 📖 — Replace Python loops with array expressions; broadcasting combines different shapes without copying.
- **NumPy — indexing, aggregation & reshaping** (13 min · 4 practice) 🖼 — Select with slices/masks, summarize along axes, reshape, and find positions — axis is the key idea.


### pandas — the DataFrame

- **pandas — Series, DataFrame & the Index** (14 min · 4 practice) 🖼 — The two core objects, the Index that aligns them, dtypes, and fast columnar I/O.
- **pandas — selecting, filtering & assigning** (14 min · 4 practice) 🖼 — [] vs .loc vs .iloc, boolean filtering, safe assignment, and adding columns the vectorized way.
- **pandas — groupby & split-apply-combine** (14 min · 4 practice) 🖼 📖 — Group rows by a key, apply an aggregation, and combine — plus transform, filter, and why apply is slow.
- **pandas — merge, join, concat & reshape** (15 min · 4 practice) 🖼 📖 — SQL-style joins, stacking with concat, and reshaping between wide and long (pivot/melt).
- **pandas — time series, dtypes & performance** (15 min · 4 practice) 🖼 — Datetime indexing and resampling, plus the memory/speed tricks that keep pandas usable at scale.


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


## 4. 🐚 Unix & Shell Scripting  
_8 lessons — _


### The command line

- **The command line & the filesystem** (12 min · 4 practice) 🖼 📖 — What the shell is, how to navigate the file tree, and the core file commands you'll use every day.
- **Pipes, redirection & stdin/stdout/stderr** (12 min · 4 practice) 🖼 📖 — The Unix philosophy: small tools composed with pipes and redirection into powerful one-liners.
- **Text processing — grep, sed & awk** (13 min · 4 practice) 📖 — The command-line power trio for searching, editing, and reshaping text and CSV data at scale.
- **Files, permissions & processes** (12 min · 4 practice) 📖 — Who can read/write/run a file, and how to see and control running programs.


### Scripting & automation

- **Shell scripting — automating with bash** (14 min · 4 practice) 🖼 📖 — Turn commands into reusable scripts: variables, conditionals, loops, arguments, and failing safely.
- **Shell loops — for, while & until** (13 min · 4 practice) 🖼 📖 — Repeat commands over files, lines, and ranges with for/while/until, plus break and continue.
- **Scheduling & automation with cron** (11 min · 4 practice) 🖼 📖 — Run jobs automatically on a schedule, and avoid the classic cron gotchas.
- **The command line for data engineering** (12 min · 4 practice) 📖 — The everyday CLI toolkit that glues data tools together: curl, ssh/scp, jq, compression, and pipelines.


## 5. 📐 Data Modeling & Warehousing  
_14 lessons — Design data for analytics: dimensional modeling, star/snowflake schemas, slowly changing dimensions, Data Vault, and the warehouse/lake/lakehouse — how to structure data so it's correct, fast, and easy to query._


### Modeling for analytics

- **Normalization vs denormalization for analytics** (10 min · 3 practice) 🖼 — OLTP normalizes for integrity; analytics denormalizes for speed. Why the same data is modeled oppositely in operational systems and warehouses.
- **Star schemas — the analytics workhorse** (11 min · 3 practice) 🖼 📖 — Why a central fact surrounded by denormalized dimensions is the default analytics design: simple joins, fast queries, intuitive for BI — plus the conformed-dimension bus.
- **Slowly Changing Dimensions (SCD)** (12 min · 3 practice) 🖼 📖 — How dimensions change over time without losing history: SCD Type 1 (overwrite), Type 2 (versioned rows — the key one), Type 3 (previous-value column), and how to query them.
- **Warehouse vs Lake vs Lakehouse** (11 min · 3 practice) 🖼 📖 — The three analytical storage paradigms: the structured warehouse (schema-on-write), the flexible lake (schema-on-read), and the lakehouse that combines them.


### Dimensional modelling in depth

- **Facts, dimensions & grain** (12 min · 3 practice) 🖼 📖 — The heart of dimensional modeling: fact tables (measurements) vs dimension tables (context), declaring the grain first, additive measures, and the three fact-table types.
- **Surrogate vs natural keys** (10 min · 3 practice) — Why warehouses key dimensions on meaningless surrogate integers rather than business keys — stability, SCD2, performance — and how the two keys coexist.
- **Denormalization — breaking the rules on purpose** (10 min · 3 practice) 🖼 — When and how to duplicate data deliberately for read speed: pre-joining, wide tables, the costs (storage, update complexity), and keeping it consistent.


### Modeling approaches

- **Inmon vs Kimball — two warehouse philosophies** (11 min · 4 practice) 🖼 — The two classic approaches to building a warehouse: Inmon's top-down normalized enterprise hub feeding marts, vs Kimball's bottom-up dimensional marts unified by conformed dimensions.
- **Data Vault — modeling for change & auditability** (11 min · 4 practice) 🖼 📖 — An agile, audit-focused modeling style built from Hubs (business keys), Links (relationships) and Satellites (history) — designed to absorb change and load in parallel.
- **Advanced dimension techniques** (11 min · 4 practice) — The dimensional patterns beyond the basics: role-playing, junk, degenerate, bridge, and mini-dimensions — each solving a specific real-world modeling problem.
- **The semantic / metrics layer** (10 min · 4 practice) 🖼 — Define business metrics once, centrally, so every tool computes them identically — ending the 'every dashboard defines revenue differently' problem.


### More modeling patterns

- **Snowflake schema & normalizing dimensions** (9 min · 3 practice) 🖼 — When to normalize dimensions into sub-tables: the snowflake schema, its trade-offs vs the star, and the narrow cases where it's worth the extra joins.
- **One Big Table (OBT) & wide tables** (10 min · 4 practice) 🖼 — The fully-denormalized extreme: one wide pre-joined table with everything, why columnar warehouses love it, and its trade-offs vs the star.
- **Aggregate & summary tables** (9 min · 4 practice) — Pre-compute common rollups so dashboards read small summaries instead of scanning billion-row facts — with incremental refresh and aggregate navigation.


## 6. 🧩 NoSQL & Unstructured Data  
_11 lessons — Beyond the relational table: key-value, document, wide-column and graph stores, CAP & tunable consistency, sharding/replication, LSM storage engines, time-series, search & vector DBs, and query-first modeling — choosing the right store for the access pattern._


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
- **Time-series databases** (10 min · 4 practice) — Databases purpose-built for timestamped data: high-ingest append-only writes, time-range queries, automatic downsampling/retention, and heavy compression.
- **Search engines & vector databases** (11 min · 4 practice) 🖼 — Two stores for finding things by meaning: search engines (Elasticsearch) with inverted indexes for full-text relevance, and vector databases for embedding-based similarity (semantic search, RAG).


### Caching & NoSQL modeling

- **Caching patterns with Redis** (11 min · 4 practice) 🖼 — Redis as the Swiss-army in-memory store: rich data structures, the cache-aside pattern, TTL/eviction, and uses beyond caching — queues, rate-limiting, leaderboards, pub/sub.
- **Query-first data modeling for NoSQL** (11 min · 4 practice) 🖼 — The opposite of relational design: model around your access patterns, denormalize and duplicate freely, embed what you read together, and write data multiple ways to serve multiple queries.


## 7. ⚡ Big Data & Apache Spark  
_18 lessons — Process data too big for one machine with Apache Spark — the execution model, DataFrames, the shuffle, joins, tuning, PySpark and streaming, the way real data engineers use it._


### Thinking at scale

- **What makes data 'big'? Scale & distribution** (10 min · 3 practice) 🖼 — When data outgrows one machine: the Vs (volume, velocity, variety), scale-up vs scale-out, and why distributed processing (parallelism + fault tolerance on commodity hardware) is the answer.
- **Spark's big picture: cluster, DataFrames, lazy work & the shuffle** (11 min · 3 practice) 🖼 — The mental model that ties everything together: driver + executors + cluster manager, data in partitions, the DataFrame API optimized by Catalyst, lazy evaluation, and the shuffle as the cost center.


### How Spark works

- **Transformations vs actions & lazy evaluation** (11 min · 3 practice) 🖼 📖 — Why nothing runs until you ask: lazy transformations build a DAG, actions trigger it, the optimizer exploits the whole plan — and each action recomputes unless you cache.
- **Partitions & the shuffle** (12 min · 3 practice) 🖼 📖 — Parallelism's unit and its biggest cost: how partitions drive parallel tasks, what triggers a shuffle, right-sizing partitions, repartition vs coalesce, and skew.
- **DataFrames & Spark SQL** (11 min · 3 practice) 🖼 — The high-level API you'll actually use: typed columns and functions, groupBy/agg, joins, the DataFrame↔SQL equivalence, and how Catalyst makes both fast.
- **MapReduce — the programming model** (16 min · 6 practice) 🖼 📖 — The full MapReduce pipeline: InputSplits & RecordReaders, the Mapper lifecycle, partitioner, combiner, the shuffle/sort internals, the Reducer phases, joins, counters, and exactly why it's slow — the model that still underlies every distributed shuffle.
- **Why Spark beat MapReduce** (9 min · 3 practice) 🖼 — The leap from Hadoop MapReduce to Spark: in-memory processing vs disk-between-steps, a richer DAG of operations, and one unified engine for batch, SQL, streaming and ML.


### Spark internals & the ecosystem

- **Join strategies — broadcast, sort-merge & shuffle-hash** (12 min · 3 practice) 🖼 📖 — How Spark physically joins tables and how to pick the fast path: broadcast hash join for small×large, sort-merge for large×large, and handling join skew.
- **Tuning & Adaptive Query Execution** (11 min · 3 practice) 🖼 — The practical Spark tuning checklist — shuffle, broadcast, caching, partitions, UDFs — and how AQE re-optimizes the plan at runtime so you tune less by hand.
- **Spark Structured Streaming** (11 min · 3 practice) 🖼 📖 — Streaming as an unbounded table with the same DataFrame API: the micro-batch model, sources/sinks, event-time windows + watermarks, output modes, and checkpointing for exactly-once.
- **Hadoop — HDFS, YARN, MapReduce & the ecosystem** (16 min · 6 practice) 🖼 📖 — Hadoop in depth: HDFS internals (NameNode/DataNode, the write & read paths, rack-aware replication, HA), YARN internals (ResourceManager/NodeManager/ApplicationMaster, the job-submission flow, schedulers), the ecosystem, and the cloud shift — and why the ideas persist.
- **Beyond Spark — Flink, Trino & friends** (9 min · 3 practice) — Spark isn't the only engine: Flink for true low-latency streaming, Trino/Presto for interactive federated SQL, and where Dask/Ray fit — and how to choose.
- **Hive & HiveQL — SQL on the lake + the metastore** (15 min · 6 practice) 🖼 📖 — Hive in depth: its architecture (driver/compiler/optimizer/execution engine + metastore), HiveQL DDL/DML, managed vs external tables, static & dynamic partitioning, bucketing, ORC/Parquet & SerDes, the optimizations (partition pruning, predicate pushdown, vectorization, map joins, CBO), Hive ACID, and Hive vs Spark SQL vs Trino.
- **Scala for Spark** (15 min · 6 practice) 🖼 📖 — Scala in depth for Spark: the language essentials (immutability, type inference, functions as values, case classes, pattern matching, traits, collections, Option), why Spark is written in it, the three Spark APIs in Scala (RDD/DataFrame/typed Dataset[T]), Scala UDFs, sbt packaging, and a precise PySpark comparison.


### Spark internals & operations

- **RDDs — Spark's resilient foundation** (10 min · 3 practice) 🖼 📖 — The low-level abstraction under every DataFrame: partitioned, immutable datasets whose lineage gives fault tolerance — plus narrow vs wide dependencies and why DataFrames are now preferred.
- **UDFs & memory management** (10 min · 3 practice) 🖼 — Why Python UDFs are slow (and pandas UDFs the fix), and how executor memory works — execution vs storage, spill, and the real causes of OOM.
- **Running Spark — submit, cluster & deploy modes** (9 min · 3 practice) 🖼 — How a Spark app actually runs: spark-submit, the cluster managers, client vs cluster deploy mode, local mode, and how a job becomes jobs → stages → tasks.


### PySpark in depth

- **PySpark — the complete guide** (20 min · 3 practice) 🖼 📖 — A practical end-to-end PySpark reference: SparkSession, reading/writing, the DataFrame API (columns, functions, groupBy, joins, windows), nulls/dates/strings, UDFs, caching, and PySpark vs pandas.


## 8. 🔧 Pipelines & Orchestration  
_13 lessons — Move data reliably and repeatably: ETL vs ELT, orchestration with DAGs (Airflow, Dagster, Prefect), idempotency & backfills, incremental loads, dbt, ingestion/CDC, and testing & monitoring — the craft of production data pipelines._


### Building reliable pipelines

- **ETL vs ELT** (11 min · 4 practice) 🖼 📖 — The two orderings of extract/transform/load, why the cloud flipped the default from ETL to ELT, and when each still fits.
- **Orchestration fundamentals — DAGs, scheduling & dependencies** (13 min · 4 practice) 🖼 📖 — Coordinate the many tasks of a pipeline: model them as a DAG, schedule, handle dependencies, retries, and backfills.
- **DAGs & orchestration with Airflow** (11 min · 4 practice) 🖼 — Why pipelines are modeled as DAGs, what an orchestrator gives you (scheduling, dependencies, retries, visibility), and the anatomy of an Airflow DAG.
- **Idempotency & backfills** (11 min · 4 practice) 🖼 📖 — Why re-running a pipeline must produce the same result, the techniques that make it so (overwrite-by-partition, MERGE, deterministic outputs), and how backfills depend on it.


### Operating pipelines

- **Scheduling, triggers & catchup** (10 min · 3 practice) 🖼 — How pipelines decide when to run: cron/interval schedules, event/sensor triggers, the logical date, and catchup vs backfill.
- **Incremental vs full loads** (11 min · 4 practice) 🖼 📖 — Reload everything vs process only what changed: change-detection strategies (high-watermark, CDC, partitions), late-arriving data, and the trade-offs.
- **Monitoring, alerting & data observability** (10 min · 4 practice) — Knowing your pipelines work: what to monitor (freshness, volume, schema, quality, latency), SLAs/SLOs, effective alerting, and data observability.


### Orchestration & tooling

- **Airflow in depth — operators, sensors, XComs & executors** (13 min · 4 practice) 🖼 📖 — Under Airflow's hood: the scheduler/executor/metadata-DB architecture, operators & the TaskFlow API, sensors, XComs, hooks/connections, executor types, and the best practices that keep DAGs healthy.
- **dbt & analytics engineering** (13 min · 4 practice) 🖼 📖 — The transform layer of the modern stack: models & ref() lineage, sources, materializations, tests, docs, snapshots and macros — bringing software engineering to SQL transformations.
- **Ingestion & EL tools — Fivetran, Airbyte & CDC** (11 min · 4 practice) 🖼 — Getting data in: managed connectors (Fivetran/Airbyte), log-based Change Data Capture, batch vs streaming ingestion, and the build-vs-buy trade-off.
- **Reverse ETL & data activation** (9 min · 3 practice) 🖼 — Pushing modeled warehouse data back into operational tools (CRM, ads, Slack) so business teams act on it — the warehouse as the source of truth for operations too.


### Orchestration choices & testing

- **Beyond Airflow — Dagster, Prefect & asset-based orchestration** (10 min · 3 practice) 🖼 — The next-generation orchestrators and the shift from task-centric to asset-centric thinking: Dagster's software-defined assets, Prefect's dynamic flows, and when each fits.
- **Testing data pipelines** (11 min · 4 practice) — How to trust a pipeline before and after it runs: unit tests for transform logic, data tests/assertions, schema tests, end-to-end checks, data diffs, and CI for data.


## 9. 🌊 Streaming & Real-Time  
_12 lessons — Process data the moment it arrives: batch vs streaming, Kafka, event time & watermarks, delivery guarantees, stateful processing, stream joins, and Lambda/Kappa architectures — building correct, low-latency real-time pipelines._


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


### Build a streaming pipeline

- **Building a streaming pipeline end-to-end** (11 min · 4 practice) 🖼 📖 — Putting it together: source → stream processor → sink, with event time/watermarks, exactly-once via checkpoints, schemas, and lag monitoring — a reference real-time architecture.


## 10. 🏞️ The Lakehouse  
_12 lessons — Warehouse reliability on cheap object storage: table formats (Delta, Iceberg, Hudi) that add ACID, time travel and schema to files, the medallion architecture, data layout, catalogs, and table maintenance — the modern data platform._


### Modern table formats

- **Why the lakehouse exists** (10 min · 4 practice) 🖼 📖 — The lakehouse combines the data lake's cheap, flexible storage with the warehouse's reliability and performance — fixing the weaknesses of both.
- **Time travel & MERGE** (10 min · 4 practice) 🖼 📖 — How the transaction log turns a table into a versioned history you can query, roll back, and audit — plus transactional MERGE updates/deletes that raw lakes couldn't do.


### Lakehouse tables in depth

- **Table formats — what they are (Delta, Iceberg, Hudi)** (11 min · 4 practice) 🖼 📖 — The metadata/transaction-log layer that turns a directory of Parquet files into a real ACID table — the core idea behind Delta Lake, Apache Iceberg, and Apache Hudi.
- **Schema evolution & enforcement** (10 min · 4 practice) 🖼 — How lakehouse tables change shape safely over time — enforcing schema on write, evolving it (add/rename/drop), and why this beats a bare lake's schema chaos.
- **The medallion architecture** (10 min · 4 practice) 🖼 📖 — Organizing lakehouse data into bronze (raw), silver (cleaned/conformed), and gold (modeled/aggregated) layers — progressive refinement that balances flexibility and quality.


### Lakehouse engineering

- **Partitioning & Z-ordering — data layout for speed** (11 min · 4 practice) 🖼 — How the physical arrangement of files makes lakehouse queries fast or slow: partitioning for pruning, Z-ordering/clustering for file skipping, right file sizes, and avoiding over-partitioning.
- **Catalogs & the metastore** (11 min · 4 practice) 🖼 — The directory that lets engines find lakehouse tables and governs access: the metastore/catalog, from Hive Metastore to Glue, Unity Catalog, and Iceberg REST catalogs.
- **Delta vs Iceberg vs Hudi — compared** (11 min · 4 practice) 🖼 — How the three table formats differ in origin, design, and sweet spots — and why they're converging — so you can choose deliberately.
- **Streaming & CDC into the lakehouse** (11 min · 4 practice) 🖼 — Continuously landing events and database changes into lakehouse tables: streaming writes, MERGE-based CDC, the small-files problem, exactly-once via the log, and auto-compaction.


### Lakehouse operations

- **Maintaining lakehouse tables — OPTIMIZE, VACUUM & the log** (11 min · 4 practice) 🖼 — Keeping lakehouse tables fast and lean: compaction (OPTIMIZE/Z-order), VACUUM to reclaim storage (and its time-travel trade-off), and log/metadata upkeep.


### Table formats in depth

- **Delta Lake in depth** (12 min · 4 practice) 🖼 📖 — Inside Delta: the _delta_log transaction log (JSON commits + checkpoints), how ACID works via optimistic concurrency, and the features (MERGE, OPTIMIZE/Z-order, deletion vectors, liquid clustering).
- **Apache Iceberg in depth** (12 min · 4 practice) 🖼 📖 — Inside Iceberg: the metadata tree (metadata file → manifest list → manifests → data files), snapshots, hidden partitioning, partition evolution, and why it's the engine-agnostic favorite.


## 11. ☁️ Cloud Data Engineering  
_11 lessons — Build data systems on the cloud: object storage, warehouses, compute options, IAM/security, networking & egress, cost/FinOps, serverless pipelines, and the AWS/GCP/Azure data service map — the platform every modern data engineer runs on._


### The cloud building blocks

- **Object storage (S3 & friends)** (11 min · 4 practice) 🖼 📖 — The foundation of the cloud data platform: massively scalable, durable, cheap object storage — how it differs from a filesystem, storage tiers, and why it decouples storage from compute.
- **Cloud warehouses & serverless** (10 min · 4 practice) 🖼 — How cloud data warehouses (Snowflake, BigQuery, Redshift) reinvented analytics: decoupled elastic compute, columnar MPP, pay-per-use, and serverless query engines.


### Running on the cloud

- **Compute — VMs, containers & serverless** (11 min · 4 practice) 🖼 — The spectrum of cloud compute from full-control VMs to zero-management serverless: what each is, the control-vs-management trade-off, and where each fits in data engineering.
- **Cloud cost & FinOps thinking** (11 min · 4 practice) 📖 — Why cloud bills surprise teams and how data engineers control them: the cost drivers (compute, storage, egress, data scanned) and FinOps practices (visibility, right-sizing, scale-to-zero, spot, lifecycle).
- **Security & IAM basics** (11 min · 4 practice) 🖼 — How the cloud controls who can do what: identities, policies, and resources; authentication vs authorization; least privilege; roles over keys; and encryption.


### Cloud platforms & services

- **Cloud warehouses — Snowflake, BigQuery, Redshift** (10 min · 4 practice) 🖼 — How the three leading cloud warehouses differ in architecture and billing — Snowflake's virtual warehouses, BigQuery's serverless model, Redshift's clusters — so you can choose.
- **Managed Spark & processing services** (10 min · 4 practice) 🖼 — Running Spark without managing clusters: Databricks, EMR, Dataproc, and serverless Spark — what 'managed' removes, and the spectrum from self-hosted to serverless.
- **AWS vs GCP vs Azure — the data services map** (11 min · 4 practice) 🖼 📖 — The same data-engineering capabilities under three sets of names: object storage, warehouse, processing, streaming, orchestration, and serverless across AWS, GCP, and Azure.
- **Cloud networking & data movement** (10 min · 4 practice) — How data moves in the cloud and why it costs: regions and availability zones, VPCs and private endpoints, and the egress charges that make 'keep compute near the data' a rule.


### Serverless data

- **Serverless & event-driven data pipelines** (10 min · 4 practice) 🖼 — Building pipelines from functions that fire on events: serverless functions, event triggers, serverless orchestration and query, and the pros/cons vs always-on clusters.


### Platforms in depth

- **The Databricks lakehouse platform** (10 min · 4 practice) 🖼 📖 — Databricks as a unified platform: managed Spark, Delta Lake, Unity Catalog, notebooks/jobs, SQL warehouses, and ML — the company that coined 'lakehouse' bundling the stack.


## 12. 🛠️ DataOps & Infrastructure  
_12 lessons — Apply software-engineering discipline to data: version control & CI/CD, containers & Kubernetes, infrastructure as code, testing, environments & safe releases, secrets, data contracts, and observability/monitoring — running reliable data platforms._


### Engineering discipline

- **Git — version control fundamentals** (13 min · 4 practice) 🖼 📖 — Track every change to your code: the staging model, commits, branches, and the core command workflow.
- **GitHub — collaboration, pull requests & Actions** (13 min · 4 practice) 🖼 📖 — Collaborate through pull requests and code review, pick a branching strategy, and automate with GitHub Actions.
- **CI/CD for data pipelines** (13 min · 4 practice) 🖼 📖 — Automatically test every change and deploy merged changes safely — the assembly line for data code.
- **Containers (Docker) & reproducibility** (10 min · 4 practice) 🖼 — Packaging code with its dependencies into portable, reproducible containers — solving 'works on my machine' and making data jobs run identically everywhere.


### DataOps in practice

- **Data testing in CI/CD** (11 min · 4 practice) 📖 — Building automated test gates into the pipeline: unit tests for logic, data tests/assertions, schema and data-diff checks, run in CI so bad changes never reach production.
- **Infrastructure as code** (11 min · 4 practice) 🖼 — Defining cloud infrastructure in version-controlled, declarative code (Terraform) instead of clicking consoles — for reproducible, reviewable, automatable environments.
- **Data observability & SLAs** (11 min · 4 practice) 📖 — Knowing the health of your data, not just your jobs: the pillars (freshness, volume, schema, distribution, lineage), SLAs/SLOs, and tools that catch bad data before consumers do.


### Platform & release engineering

- **Containers & Kubernetes for data** (11 min · 4 practice) — Orchestrating containers at scale with Kubernetes: pods, scheduling, scaling, self-healing — and how data tools (Spark, Airflow) run on K8s.
- **Data contracts** (10 min · 4 practice) 🖼 — Formal agreements on data shape and semantics between producers and consumers — enforced like an API, so upstream changes don't silently break downstream.
- **Secrets & configuration management** (10 min · 4 practice) — Handling credentials and config safely: never hard-code secrets, use secrets managers and roles, separate config from code, and inject per environment.
- **Environments & safe releases** (10 min · 4 practice) 🖼 — Using separate dev/staging/prod environments and release strategies (blue-green, canary, feature flags) to ship data changes without breaking production.


### Monitoring & on-call

- **Monitoring, alerting & on-call for data** (10 min · 4 practice) — Operating data systems in production: what to monitor, effective alerting without fatigue, on-call and incident response, and runbooks/postmortems.


## 13. 🛡️ Data Quality, Governance & Security  
_10 lessons — Make data trustworthy, compliant, and secure: data quality, lineage & catalogs, PII/privacy law (GDPR/HIPAA), access control & masking, encryption & key management, classification & retention, master data management, and data mesh — the guardrails of a data platform._


### Trust & safety

- **Data quality — validate & quarantine** (11 min · 4 practice) 🖼 — The dimensions of data quality, how to check them automatically, and what to do with bad data — validate at the boundary and quarantine rather than corrupt or block.
- **PII, security & governance** (11 min · 4 practice) 🖼 — Protecting personal and sensitive data: what PII is, the principles (minimize, classify, control, encrypt, audit), and why governance is everyone's responsibility.


### Governing data responsibly

- **Data lineage & catalogs** (11 min · 4 practice) 🖼 — Two pillars of discoverability and trust: lineage (what feeds what) for impact/root-cause analysis, and the data catalog for finding, understanding, and governing data.
- **Privacy law & compliance (GDPR, PII)** (11 min · 4 practice) 📖 — What privacy regulations require of data engineers: GDPR's core principles and rights, the engineering capabilities they demand (deletion, access, consent, minimization), and why non-compliance is costly.
- **Access control & data masking** (11 min · 4 practice) 🖼 — Controlling who sees what at fine granularity: RBAC/ABAC, row- and column-level security, and masking/tokenization techniques to expose only what each user needs.


### Enterprise governance

- **Data mesh — decentralizing data ownership** (11 min · 4 practice) 🖼 — An organizational approach to scaling data: domain-owned data products, self-serve platform, federated governance, and data-as-a-product — vs the central-team bottleneck.
- **Master data management** (10 min · 4 practice) — Creating a single, trusted source of truth for core business entities (customers, products) across systems — matching, merging, and a golden record to end conflicting data.
- **Encryption & key management** (11 min · 4 practice) 🖼 — Protecting data with cryptography: encryption at rest and in transit, symmetric vs asymmetric, and the key-management hierarchy (KMS, envelope encryption, rotation) that makes it real.
- **Compliance frameworks — GDPR, HIPAA, SOC 2 & more** (10 min · 4 practice) — The major regulatory and certification frameworks a data platform may need to satisfy, what each covers, and the common engineering controls that span them.


### Classification & lifecycle

- **Data classification & retention** (10 min · 4 practice) — Tagging data by sensitivity to drive controls automatically, and lifecycle/retention policies that keep data only as long as needed — for compliance, cost, and risk.


## 14. 🚀 Performance & Optimization  
_6 lessons — _


### Tuning fundamentals

- **The performance mindset — measure, then optimize** (10 min · 4 practice) 📖 — Find the real bottleneck before tuning, and remember every optimization is 'do less work'.
- **SQL & query optimization** (12 min · 4 practice) 🖼 📖 — Make the database read less data: read the plan, index, partition, project, and filter early.
- **Spark performance tuning** (13 min · 4 practice) 🖼 📖 — Manage shuffle, skew, and partitions — and let AQE, broadcast joins, and caching do the heavy lifting.


### Data layout, caching & cost

- **Data layout — partitioning, file sizing & compaction** (12 min · 4 practice) 🖼 📖 — How data is physically laid out in files is often the biggest performance lever in a lake or warehouse.
- **Caching & pre-computation** (11 min · 4 practice) 🖼 📖 — Don't recompute the same expensive result — cache it or pre-aggregate it.
- **Cost & scaling efficiency** (11 min · 4 practice) 📖 — In the cloud, performance and cost are the same lever — scan less, right-size compute, and don't move data.


## 15. 🎯 System Design & Interview Mastery  
_10 lessons — Tie it all together: a framework for designing data systems, choosing batch vs streaming, capacity/cost estimation, trade-offs, storage/tool selection, scaling, worked examples, and acing the data-engineering interview._


### Designing & interviewing

- **A framework for any pipeline design** (11 min · 4 practice) 🖼 — A repeatable structure for designing (and interviewing on) any data system: clarify requirements, then walk data characteristics, ingestion, storage, processing, serving, scale, and trade-offs.
- **Choosing batch vs streaming (and cost)** (10 min · 4 practice) — The most consequential design fork: when low-latency streaming is truly needed vs when simpler, cheaper batch suffices — and the cost/complexity implications.


### The design method

- **Capacity & cost estimation** (11 min · 4 practice) 📖 — Back-of-the-envelope sizing: estimating data volume, throughput, storage, and cost so your design is grounded in numbers, not hand-waving.
- **Trade-offs — latency, cost & complexity** (11 min · 4 practice) 🖼 — The unavoidable tensions in every data design: latency vs cost vs complexity (and consistency/freshness vs accuracy) — there's no free lunch, only deliberate choices.
- **Worked example — design an analytics pipeline** (12 min · 4 practice) 🖼 📖 — End-to-end application of the design framework to a concrete problem: an analytics platform for an e-commerce company's BI dashboards.


### Design & interview mastery

- **Choosing the right storage & tool** (11 min · 4 practice) — A decision guide for picking the right data store for an access pattern: OLTP database, warehouse, lakehouse, NoSQL family, cache, or search/vector — match the tool to the job.
- **Scaling strategies — vertical, horizontal & caching** (11 min · 4 practice) 🖼 — How to make a system handle more load: scale up (bigger machine), scale out (more machines + partitioning), and cache — with their trade-offs.
- **Worked example — real-time analytics** (12 min · 4 practice) 🖼 — Applying the framework to a low-latency problem: a real-time dashboard/alerting system where streaming genuinely earns its complexity.
- **Acing the DE interview — process & behavioral** (11 min · 4 practice) — How data-engineering interviews are structured and how to excel: the technical rounds, the system-design approach, behavioral/STAR answers, and communicating your thinking.


### More worked examples

- **Worked example — event tracking & recommendations** (12 min · 4 practice) 🖼 — A capstone design tying batch, streaming, storage, ML, and serving together: an event-tracking pipeline feeding a recommendation system.


## 16. 🤖 Machine Learning for Data Engineers  
_8 lessons — The DE side of ML — data, features, training pipelines, serving, MLOps, and the vector/embedding layer._


### The DE's role in ML

- **Where data engineering meets ML** (13 min · 4 practice) 🖼 📖 — The ML lifecycle and the data engineer's job in it — because ML is mostly data engineering.
- **Data for ML: splits, leakage & labels** (13 min · 4 practice) 🖼 📖 — Get the data right: correct train/val/test splits, avoid leakage, and source quality labels.


### Features & training

- **Feature engineering & feature stores** (14 min · 4 practice) 🖼 📖 — Turn raw data into model inputs, and serve them consistently for training and inference with a feature store.
- **Training pipelines & experiment tracking** (13 min · 4 practice) 🖼 📖 — Make training reproducible and automated — a pipeline that pulls features, trains, evaluates, and registers.


### Deploy & operate

- **Model registry & versioning** (12 min · 4 practice) 🖼 📖 — The system of record for trained models: versions, stages, lineage, and a promotion workflow.
- **Model serving: batch & online inference** (13 min · 4 practice) 🖼 📖 — Two ways to deliver predictions — scheduled batch scoring and low-latency real-time APIs.
- **MLOps: CI/CD, monitoring & drift** (13 min · 4 practice) 🖼 📖 — Operate models in production: automate training/deploy, and monitor for drift and decay.


### Modern ML data

- **Embeddings & vector databases** (14 min · 4 practice) 🖼 📖 — Turn text/images into vectors, store them in a vector database, and power semantic search and RAG.


## 17. 🏗️ Capstone Projects  
_9 lessons — End-to-end pipelines that combine the tools — from API ingestion to a published report._


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
