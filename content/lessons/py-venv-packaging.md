# Virtual environments & dependencies — the complete guide

Reproducible environments are what turn "works on my machine" into "works everywhere" —
essential when your code runs on CI and production servers. This guide covers
virtualenvs, pinning, modern tooling, and Docker, with examples and practice.

## 1. The problem: dependency conflicts

Different projects need different library versions. Project A wants `pandas==1.5`,
Project B wants `pandas==2.0`. Installed **globally**, only one can win — they conflict.

## 2. Virtual environments — isolation

A **virtual environment** is an isolated folder with its own Python and packages, so
each project keeps its own dependencies:

```bash
python -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate
pip install pandas requests
# ... work ...
deactivate
```

Now `pip install` only affects this project. (Add `.venv/` to `.gitignore` — never
commit it.)

## 3. Pin dependencies for reproducibility

Record exactly what's installed so others recreate it:

```bash
pip freeze > requirements.txt        # writes pinned versions: pandas==2.0.1, ...
```

Anyone (teammate, CI, server) recreates the identical environment:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

**Why pin exact versions?** An unpinned `pandas` may install a newer, breaking version
months later, so the same code behaves differently in prod than on your machine. Pinning
guarantees every environment runs the same libraries.

## 4. pyproject.toml — the modern standard

`pyproject.toml` is the standard project config (replacing setup.py): it declares the
project, its dependencies, and build settings in one file.

```toml
[project]
name = "my-pipeline"
dependencies = ["pandas>=2.0", "requests"]
```

## 5. Poetry / uv — dependency managers with lock files

**Poetry** and **uv** manage the venv *and* dependencies, and produce a **lock file**
(`poetry.lock` / `uv.lock`) pinning the entire dependency tree (including transitive
deps) for fully reproducible installs:

```bash
uv add pandas            # adds to pyproject + lock, installs
uv sync                  # recreate the exact environment from the lock file
```

A lock file goes further than `requirements.txt` by pinning sub-dependencies too.

## 6. Docker — package the whole environment

A virtualenv isolates Python packages, but not the Python version, OS libraries, or
system tools. **Docker** packages the **entire environment** into a portable image:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "run.py"]
```

The same image runs identically on a laptop, CI, and production — the strongest
reproducibility, and the standard for deploying data jobs (often on Kubernetes).

## 7. The ladder of reproducibility

`virtualenv + requirements.txt` → `pyproject.toml + lock file (Poetry/uv)` → `Docker
image`. Each rung pins more of the environment. Pick the level your project needs.

## Practice

1. **Two-project conflict** — what does a virtualenv solve?
2. **Capture deps** so a teammate gets the same setup.
3. **Why pin exact versions** for production?
4. **Docker vs venv** — what extra does Docker reproduce?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you make a Python project reproducible across machines?"*

Use a **virtual environment** per project (isolated packages), **pin exact versions** in
`requirements.txt` or a **lock file** (Poetry/uv pins transitive deps too) so installs
are identical everywhere, and for full reproducibility ship a **Docker image** that
packages the Python version, libraries, and OS dependencies. This turns "works on my
machine" into "works in dev, CI, and prod."
