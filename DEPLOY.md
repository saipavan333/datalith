# Put DataForge Academy online (free, always-on)

The app is now a **static site** — it runs entirely in the browser, so it can be hosted
free, forever, with no server. Everything still works: lessons, diagrams, quizzes,
interview Q&A, cheat sheets, the **SQL playground** (runs SQLite in your browser), and the
**AI mentor** (answers from the course content in your browser).

You picked **auto-deploy from GitHub**: you push the project to GitHub once, and from then
on every change you push republishes the site automatically.

---

## Step 1 — Put the project on GitHub (one time)

Easiest way if you don't use the command line: install **GitHub Desktop**
(https://desktop.github.com), then:

1. Sign in with a free GitHub account.
2. **File → Add local repository →** choose this folder
   (`...\Projects\AI\DataForge-Academy`). If it says it's not a repository, click
   **"create a repository"** and then **Publish repository** (keep it Public so free
   hosting works).
3. That's it — your code is on GitHub.

Prefer the command line? From inside the project folder:

```bash
git init
git add .
git commit -m "DataForge Academy"
git branch -M main
# create an empty repo named dataforge-academy on github.com first, then:
git remote add origin https://github.com/<your-username>/dataforge-academy.git
git push -u origin main
```

---

## Step 2 — Turn on hosting

### Option A — GitHub Pages (simplest; only needs your GitHub account)

This repo already includes the deploy workflow (`.github/workflows/deploy-pages.yml`), so
you just flip Pages on:

1. On GitHub, open your repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Done. Open the **Actions** tab and wait ~1 minute for the green check.
4. Your site is live at:
   **`https://<your-username>.github.io/dataforge-academy/`**

(The first deploy can take a couple of minutes. After that it's instant for visitors.)

### Option B — Cloudflare Pages or Netlify (faster, nicer URL)

If you'd rather have a snappier URL like `dataforge-academy.pages.dev`:

1. Go to **Cloudflare Pages** (pages.cloudflare.com) **or Netlify** (app.netlify.com),
   sign in, and choose **"Import / Connect a Git repository."**
2. Pick your `dataforge-academy` repo.
3. Build settings: **Framework preset = None**, **Build command = (leave empty)**,
   **Output / Publish directory = `.`** (a single dot — the project root).
4. Click **Deploy**. You get a live URL in under a minute.

Both options **auto-redeploy** whenever you push to GitHub.

---

## Step 3 — Updating the site later

Make your edits, then just push:

```bash
git add .
git commit -m "what changed"
git push
```

The site rebuilds itself in about a minute. No other steps.

(With GitHub Desktop: edit files → **Commit to main** → **Push origin**.)

---

## Preview locally before publishing

You don't need anything installed except Python:

```bash
python run.py
```

Then open **http://localhost:8000**. This serves the site exactly as it appears online.
Tip: open it via this address — don't double-click `index.html` directly, because browsers
block a file from loading the course content unless it's served over `http://`.

---

## Optional — your own domain

On any of the hosts above you can add a custom domain (e.g. `learn.yoursite.com`) for free
in the host's **Domains** settings — just follow their prompt to add one DNS record.

---

## Notes

- **No monthly cost, no cold starts.** A static site is served from a global CDN, so it's
  always on and loads instantly.
- **The SQL playground** downloads a small SQLite engine (~1 MB) the first time you run a
  query; after that it's cached.
- **Privacy:** everything runs in the visitor's browser — no data is sent to any server.
- The old `app/` FastAPI backend is left in place but is no longer needed; `run.py` now
  serves the static site. If you ever want the optional "plug in a real LLM key" assistant,
  that's the one feature that needs a server (see `app/assistant.py`).
