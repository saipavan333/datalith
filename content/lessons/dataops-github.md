# GitHub — the complete guide

GitHub hosts your Git repositories and adds the collaboration layer where data teams actually work together: pull
requests, code review, issues, and CI/CD automation. This guide covers getting a repo, the GitHub flow, pull requests
and review in depth, branching strategies, resolving conflicts, and GitHub Actions — with scenarios.

## 1. Getting a repo

```bash
# you can push to it (you're a collaborator):
git clone https://github.com/org/repo.git

# you can't push (open source) — FORK on GitHub, then clone your fork:
git clone https://github.com/you/repo.git
git remote add upstream https://github.com/org/repo.git   # track the original
git fetch upstream && git merge upstream/main             # stay in sync
```

Use **SSH** (`git@github.com:org/repo.git`) or a **personal access token** for auth — never your password.

## 2. The GitHub flow

@@diagram:github-flow

The standard loop that keeps `main` always deployable and every change reviewed:

1. **Branch** off `main`: `git switch -c feature/clean-orders`
2. Commit your work and **push** the branch: `git push -u origin feature/clean-orders`
3. Open a **Pull Request (PR)** — proposes merging your branch into `main`.
4. **Review + CI:** teammates review; GitHub Actions runs tests automatically.
5. **Merge** when approved and green; **delete** the branch.

## 3. Pull requests in depth

A good PR is small and self-explanatory:

- **Title + description** — what changed and why; link the issue (`Closes #42`).
- **Draft PR** — open early for feedback before it's done.
- **Reviewers** — request the right people; **CODEOWNERS** can auto-assign.
- **Checks** — CI status shows inline; merging is blocked until it's green.
- **Merge options:**
  - **Merge commit** — keeps every commit + a merge commit.
  - **Squash and merge** — combine the branch into one tidy commit (popular default).
  - **Rebase and merge** — linear history, no merge commit.

## 4. Code review

Reviewers leave **line comments**, propose **suggestions** (one-click apply), and then **Approve** or **Request
changes**. Good review is about correctness, clarity, tests, and data-contract impact — not nitpicking style (let a
linter do that). As an author: keep PRs small, respond to every comment, and push fixes as new commits so reviewers see
just the delta.

## 5. Branching strategies

- **GitHub Flow / trunk-based** *(modern default)* — short-lived feature branches merged to `main` frequently; `main`
  is always deployable, often auto-deployed. Best for continuous delivery and data pipelines.
- **GitFlow** — long-lived `develop`, `release/*`, and `hotfix/*` branches; heavier, suited to versioned product
  releases, usually overkill for data teams.

Keep branches **short-lived** to minimize conflicts and integration pain.

## 6. Merge conflicts

When two branches change the same lines, Git can't auto-merge:

```python
<<<<<<< HEAD
amount = price * 1.2          # your version
=======
amount = price * (1 + tax)    # main's version
>>>>>>> main
```

Resolve by editing to the correct result (delete the markers), then:

```bash
git add resolved_file.py
git commit                    # finish the merge
# (or, if rebasing:)  git rebase --continue
```

Update a stale branch cleanly with a rebase:

```bash
git fetch origin
git rebase origin/main        # replay your commits on the latest main
# fix any conflicts, then:
git push --force-with-lease   # safe force-push (won't clobber others' work)
```

## 7. GitHub Actions — CI/CD automation

Workflows live in `.github/workflows/*.yml` and run on events:

```yaml
name: ci
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: ruff check .            # lint
      - run: pytest                  # unit tests
      - run: dbt test               # data tests
```

Key pieces:

- **`on:`** — triggers (`pull_request`, `push`, `schedule:` cron, `workflow_dispatch` for manual).
- **jobs → steps** — each step runs a command or a reusable **action** (`uses:`).
- **Matrix** — test across versions: `strategy: { matrix: { python: ["3.11","3.12"] } }`.
- **Secrets** — `${{ secrets.DB_PASSWORD }}` (set in repo settings; never hard-code).
- **Caching** — `actions/cache` to speed up dependency installs.
- **Artifacts** — upload build outputs/test reports between jobs.

## 8. Protecting `main`

**Branch protection rules** enforce quality:

- Require a **pull request** before merging (no direct pushes).
- Require **status checks** (CI) to pass.
- Require **N approvals** and dismiss stale ones on new commits.
- Require branches to be **up to date** before merging.

This is what makes "every change is reviewed and tested before it reaches `main`" a guarantee, not a hope.

## 9. Issues & Projects

**Issues** track bugs and tasks (with labels, assignees, milestones); **Projects** are kanban boards over issues/PRs.
Reference them from commits/PRs (`Fixes #17`) to auto-close on merge.

## 10. Scenario A — contribute a change end to end

```bash
git switch -c fix/null-amounts
# ...edit, commit...
git push -u origin fix/null-amounts
# open a PR on GitHub: title, description "Closes #88", request reviewers
# CI runs pytest + dbt test on the PR
# address review comments with new commits
# reviewer approves, checks are green -> Squash and merge -> branch deleted
```

## 11. Scenario B — set up CI on a data repo

```yaml
# .github/workflows/data-ci.yml
on: { pull_request: { branches: [main] } }
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: ruff check . && pytest
      - run: dbt deps && dbt build --target ci   # build + data tests on a CI schema
```

Then add a branch-protection rule requiring this check to pass.

## 12. Gotchas

- Use `--force-with-lease`, never plain `--force` — it refuses to overwrite work you haven't seen.
- Don't commit secrets; if you do, rotate the secret (history is forever) and scrub it.
- Keep PRs small — giant PRs get rubber-stamped, not reviewed.

## 13. Practice

1. List the GitHub-flow steps from branch to merged change.
2. Write a GitHub Actions workflow that runs `pytest` and `dbt test` on every PR.
3. Your branch conflicts with `main`. Update it cleanly and push safely.
4. Name three branch-protection rules that enforce review + tested merges.

GitHub turns Git into a team sport: every change becomes a reviewed, automatically-tested pull request — the single
most important habit separating amateur data scripts from professional, trustworthy pipelines.
