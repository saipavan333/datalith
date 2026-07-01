"""Datalith — the AI mentor.

Works out of the box with NO setup: a built-in tutor answers from the course
content itself (it finds the most relevant lessons and explains them in plain
English). If you set an API key in the environment, it automatically upgrades to
a real LLM, grounded in the same course content so answers stay on-topic.

Switch on a real model by setting ONE of these before you start the app:

    OpenAI:     setx OPENAI_API_KEY "sk-..."        (optional OPENAI_MODEL)
    Anthropic:  setx ANTHROPIC_API_KEY "sk-ant-..." (optional ANTHROPIC_MODEL)
    Ollama:     setx OLLAMA_MODEL "llama3"          (runs locally & free)

(on macOS/Linux use `export VAR=value`). No code changes needed.
"""
from __future__ import annotations

import json
import os
import re
import urllib.request
from pathlib import Path

CONTENT = Path(__file__).resolve().parents[1] / "content"

_STOP = set("a an the of to is are was were be been being and or but if then so "
            "for with on in at by from as into about over under it its this that "
            "these those i you we they he she do does what which how when why who "
            "whom your my our their can could should would will shall may might "
            "vs versus difference between explain tell me give example examples "
            "work works working use used using mean means".split())


# --------------------------- course retrieval ---------------------------
def _load_lessons() -> list[dict]:
    path = CONTENT / "curriculum.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    out = []
    for t in data.get("tracks", []):
        for m in t.get("modules", []):
            for l in m.get("lessons", []):
                blob = " ".join([
                    l.get("title", ""), l.get("summary", ""), l.get("concept", ""),
                    " ".join(l.get("keypoints", [])), l.get("example", ""),
                ])
                out.append({
                    "id": l.get("id", ""), "title": l.get("title", ""),
                    "track": t.get("title", ""), "concept": l.get("concept", ""),
                    "example": l.get("example", ""), "keypoints": l.get("keypoints", []),
                    "summary": l.get("summary", ""),
                    "_words": _tokenize(blob), "_title_words": _tokenize(l.get("title", "")),
                })
    return out


def _stem(w: str) -> str:
    """Very light stemmer so singular/plural and verb forms match (window/windows,
    watermark/watermarks, generate/generating). Deliberately conservative."""
    for suf in ("ization", "isation", "ingly", "ing", "edly", "ies", "es", "ed", "ly", "s"):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            base = w[: -len(suf)]
            if suf == "ies":
                return base + "y"
            return base
    return w


def _tokenize(text: str) -> list[str]:
    return [_stem(w) for w in re.findall(r"[a-z0-9]+", text.lower())
            if w not in _STOP and len(w) > 1]


_LESSONS_CACHE: list[dict] | None = None
_IDF_CACHE: dict[str, float] | None = None


def _lessons() -> list[dict]:
    global _LESSONS_CACHE, _IDF_CACHE
    if _LESSONS_CACHE is None:
        try:
            _LESSONS_CACHE = _load_lessons()
        except Exception:
            _LESSONS_CACHE = []
        # inverse document frequency: rare words (e.g. "watermark") outweigh
        # common ones (e.g. "data"), so retrieval favours the specific lesson.
        import math
        df: dict[str, int] = {}
        for les in _LESSONS_CACHE:
            for w in set(les["_words"]):
                df[w] = df.get(w, 0) + 1
        n = max(1, len(_LESSONS_CACHE))
        _IDF_CACHE = {w: math.log(1 + n / c) for w, c in df.items()}
    return _LESSONS_CACHE


def _idf(w: str) -> float:
    _lessons()
    return (_IDF_CACHE or {}).get(w, 1.0)


def _retrieve(question: str, lesson_id: str = "", k: int = 3) -> list[dict]:
    qwords = _tokenize(question)
    if not qwords and not lesson_id:
        return []
    scored = []
    for les in _lessons():
        score = 0.0
        wordset = set(les["_words"])
        title = set(les["_title_words"])
        for w in qwords:
            if w in title:
                score += 3.0 * _idf(w)
            elif w in wordset:
                score += 1.0 * _idf(w)
        if lesson_id and les["id"] == lesson_id:
            score += 1.5  # gentle boost for the lesson the user is viewing
        if score > 0:
            scored.append((score, les))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [les for _, les in scored[:k]]


# --------------------------- the local tutor ----------------------------
def _local_reply(question: str, lesson_id: str = "") -> str:
    hits = _retrieve(question, lesson_id, k=3)
    if not hits:
        return ("I couldn't find a lesson that directly covers that yet. Try rephrasing, "
                "or browse the tracks in the sidebar — there are 13 tracks from SQL and "
                "Python through Spark, streaming, the lakehouse, and system design. "
                "Tip: set an API key (see the README) to let me answer free-form questions.")
    best = hits[0]
    parts = [f"**{best['title']}** — {best['track']}", "", best["concept"]]
    if best.get("example"):
        parts += ["", "**Example.** " + best["example"]]
    if best.get("keypoints"):
        parts += ["", "**Key points:**"] + [f"- {kp}" for kp in best["keypoints"]]
    related = [h["title"] for h in hits[1:]]
    if related:
        parts += ["", "_Related lessons:_ " + ", ".join(related) + "."]
    parts += ["", "_(Answered from the course content. Add an API key — see the README — "
              "to ask me anything in free form.)_"]
    return "\n".join(parts)


def _context_block(question: str, lesson_id: str) -> str:
    hits = _retrieve(question, lesson_id, k=3)
    chunks = []
    for h in hits:
        kp = "; ".join(h.get("keypoints", []))
        chunks.append(f"## {h['title']} ({h['track']})\n{h['concept']}\nKey points: {kp}\nExample: {h.get('example','')}")
    return "\n\n".join(chunks)


SYSTEM_PROMPT = (
    "You are the AI mentor inside 'Datalith', a course that teaches data "
    "engineering in plain English. Answer the student's question clearly and simply, "
    "assuming little background and defining any jargon you use. Prefer short paragraphs "
    "and concrete examples. Ground your answer in the provided course excerpts when they "
    "are relevant, and stay focused on data engineering. If the question is outside data "
    "engineering, gently steer back."
)


# --------------------------- LLM providers ------------------------------
def _http_json(url: str, payload: dict, headers: dict, timeout: int = 30) -> dict:
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json", **headers})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _openai_reply(question: str, context: str) -> str:
    key = os.environ["OPENAI_API_KEY"]
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    data = _http_json(
        "https://api.openai.com/v1/chat/completions",
        {"model": model, "temperature": 0.3, "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Course excerpts:\n{context}\n\nQuestion: {question}"},
        ]},
        {"Authorization": f"Bearer {key}"},
    )
    return data["choices"][0]["message"]["content"].strip()


def _anthropic_reply(question: str, context: str) -> str:
    key = os.environ["ANTHROPIC_API_KEY"]
    model = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-haiku-latest")
    data = _http_json(
        "https://api.anthropic.com/v1/messages",
        {"model": model, "max_tokens": 800, "system": SYSTEM_PROMPT, "messages": [
            {"role": "user", "content": f"Course excerpts:\n{context}\n\nQuestion: {question}"},
        ]},
        {"x-api-key": key, "anthropic-version": "2023-06-01"},
    )
    return "".join(b.get("text", "") for b in data.get("content", [])).strip()


def _ollama_reply(question: str, context: str) -> str:
    host = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
    model = os.environ.get("OLLAMA_MODEL", "llama3")
    data = _http_json(
        f"{host}/api/generate",
        {"model": model, "stream": False,
         "prompt": f"{SYSTEM_PROMPT}\n\nCourse excerpts:\n{context}\n\nQuestion: {question}\n\nAnswer:"},
        {}, timeout=60,
    )
    return data.get("response", "").strip()


def _provider() -> str | None:
    forced = os.environ.get("DFA_AI_PROVIDER", "").lower().strip()
    if forced in {"openai", "anthropic", "ollama"}:
        return forced
    if os.environ.get("OPENAI_API_KEY"):
        return "openai"
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "anthropic"
    if os.environ.get("OLLAMA_MODEL"):
        return "ollama"
    return None


# ------------------------------ entry point -----------------------------
def answer(question: str, lesson_id: str = "") -> dict:
    question = (question or "").strip()
    if not question:
        return {"ok": False, "configured": _provider() is not None,
                "reply": "Ask me anything about data engineering and I'll explain it simply."}

    provider = _provider()
    if provider:
        try:
            context = _context_block(question, lesson_id)
            fn = {"openai": _openai_reply, "anthropic": _anthropic_reply, "ollama": _ollama_reply}[provider]
            reply = fn(question, context)
            if reply:
                return {"ok": True, "configured": True, "provider": provider, "reply": reply}
        except Exception as exc:  # network/key/quota problem — fall back gracefully
            fallback = _local_reply(question, lesson_id)
            return {"ok": True, "configured": True, "provider": provider,
                    "reply": fallback + f"\n\n_(Note: the {provider} model couldn't be reached "
                    f"[{type(exc).__name__}], so I answered from the course content.)_"}

    return {"ok": True, "configured": False, "provider": "local", "reply": _local_reply(question, lesson_id)}
