"""Datalith — FastAPI backend.

Serves the single-page app and a small API:
  GET  /api/curriculum      the full roadmap (tracks -> modules -> lessons)
  GET  /api/lesson/{id}     optional deep-dive markdown for a lesson
  GET  /api/sql/schema      the sample tables + a starter query
  POST /api/sql             run a learner's SQL on a throwaway database
  POST /api/assistant       AI doubt-solver (stubbed until you add a key)
  GET  /healthz             liveness probe
"""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app import __version__
from app.assistant import answer as assistant_answer
from app.sampledb import STARTER_SQL, run_sql, schema_summary

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
STATIC = ROOT / "static"
LESSONS = CONTENT / "lessons"


class NoCacheStaticFiles(StaticFiles):
    """Serve static assets with no-cache headers so edits (updated diagrams,
    CSS, JS) always reach the browser instead of being served from a stale cache."""

    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response


app = FastAPI(title="Datalith", version=__version__)


@app.middleware("http")
async def _no_cache(request, call_next):
    """Belt-and-suspenders: stamp EVERY response (API JSON + static assets +
    index.html) with no-cache, so a server restart + a normal browser refresh
    always shows the latest curriculum, diagrams, interview questions, and code."""
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# ----------------------------- API models -----------------------------
class SqlRequest(BaseModel):
    query: str


class AssistantRequest(BaseModel):
    question: str
    lesson_id: str = ""


# ----------------------------- API routes ------------------------------
@app.get("/healthz")
def healthz():
    return {"status": "ok", "version": __version__}


@app.get("/api/curriculum")
def curriculum():
    path = CONTENT / "curriculum.json"
    if not path.exists():
        raise HTTPException(status_code=500, detail="curriculum.json missing")
    return JSONResponse(json.loads(path.read_text(encoding="utf-8")))


@app.get("/api/lesson/{lesson_id}")
def lesson(lesson_id: str):
    """Optional long-form markdown for a lesson (the JSON content is always shown;
    this adds a deeper dive when a `<id>.md` file exists)."""
    safe = lesson_id.replace("/", "").replace("\\", "").replace("..", "")
    path = LESSONS / f"{safe}.md"
    if not path.exists():
        return {"id": lesson_id, "markdown": ""}
    return {"id": lesson_id, "markdown": path.read_text(encoding="utf-8")}


@app.get("/api/interview/{lesson_id}")
def interview(lesson_id: str):
    """FAANG/Goldman-style interview Q&A for a lesson, served from content/interview.json.
    Read fresh each call so new questions appear on refresh without a server restart."""
    safe = lesson_id.replace("/", "").replace("\\", "").replace("..", "")
    path = CONTENT / "interview.json"
    if not path.exists():
        return {"id": lesson_id, "questions": []}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {"id": lesson_id, "questions": data.get(safe, [])}


@app.get("/api/cheatsheet/{track_id}")
def cheatsheet(track_id: str):
    """Per-track cheat sheet markdown from content/cheatsheets/{track_id}.md."""
    safe = track_id.replace("/", "").replace("\\", "").replace("..", "")
    path = CONTENT / "cheatsheets" / f"{safe}.md"
    if not path.exists():
        return {"id": track_id, "markdown": ""}
    return {"id": track_id, "markdown": path.read_text(encoding="utf-8")}


@app.get("/api/sql/schema")
def sql_schema():
    return {"tables": schema_summary(), "starter": STARTER_SQL}


@app.post("/api/sql")
def sql(req: SqlRequest):
    return run_sql(req.query)


@app.post("/api/assistant")
def assistant(req: AssistantRequest):
    """AI doubt-solver. Works offline by answering from the course content, and
    auto-upgrades to a real LLM when an API key is set (see app/assistant.py)."""
    return assistant_answer(req.question, req.lesson_id)


# --------------------------- static frontend ---------------------------
@app.get("/")
def index():
    return FileResponse(
        STATIC / "index.html",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
    )


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    # browsers auto-request /favicon.ico; serve the SVG icon so it's a 200, not a 404
    return FileResponse(STATIC / "favicon.svg", media_type="image/svg+xml")


app.mount("/", NoCacheStaticFiles(directory=STATIC, html=True), name="static")
