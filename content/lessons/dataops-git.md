# Git — the complete guide

Git is the foundation of every modern data team. It records the full history of your code, lets you experiment safely
on branches, and makes every change reviewable and reversible. This guide is a working command reference: the mental
model, the everyday workflow, branching, remotes, undoing mistakes, and the recipes you'll actually reach for.

## 1. One-time setup

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase false      # merge on pull (or true to rebase)
git config --list
```

## 2. The mental model: three areas

@@diagram:git-workflow

A file moves through three local areas, then out to a remote:

```
Working directory  --git add-->  Staging area  --git commit-->  Local repo (.git)  --git push-->  Remote
   (your edits)                  (next commit)                   (history)                        (GitHub)
```

The **staging area** is Git's signature idea: you choose exactly which changes go into each commit, so commits stay
small and focused.

## 3. Start a repository

```bash
git init                         # turn the current folder into a repo
git clone <url>                  # copy an existing remote repo (with history)
git clone <url> myproj           # ...into a named folder
```

## 4. The everyday loop

```bash
git status                       # what's changed and what's staged
git add file.py                  # stage one file
git add -A                       # stage everything (new, modified, deleted)
git add -p                       # stage interactively, hunk by hunk
git commit -m "Add tax column"   # record staged changes
git commit -am "msg"             # stage tracked files AND commit (shortcut)
git log --oneline --graph        # compact history with branch graph
git diff                         # unstaged changes
git diff --staged                # staged changes (what will commit)
git show <hash>                  # what a specific commit changed
```

**Good commits** are small, do one thing, and have a clear message (imperative mood: "Add…", "Fix…", "Refactor…").

## 5. Branching

```bash
git branch                       # list branches
git switch -c feature/clean      # create + switch (old: git checkout -b)
git switch main                  # change branch
git merge feature/clean          # merge a branch into the current one
git branch -d feature/clean      # delete a merged branch
git branch -D feature/clean      # force-delete (unmerged)
```

## 6. Remotes — working with GitHub/GitLab

```bash
git remote -v                    # list remotes
git remote add origin <url>
git push -u origin main          # push and set upstream (first time)
git push                         # subsequent pushes
git pull                         # fetch + merge the remote's new commits
git fetch                        # download new commits WITHOUT merging
git push origin --delete oldbr   # delete a remote branch
```

## 7. Undoing things — knowing these removes the fear

```bash
git restore file.py              # discard working-directory edits
git restore --staged file.py     # unstage (keep edits)
git commit --amend -m "msg"      # fix the LAST commit's message/content
git reset --soft HEAD~1          # undo last commit, KEEP changes staged
git reset --mixed HEAD~1         # undo last commit, keep changes unstaged (default)
git reset --hard HEAD~1          # undo last commit AND discard changes  (DANGER, local only)
git revert <hash>                # NEW commit that undoes <hash>  (safe on shared history)
git stash                        # shelve uncommitted edits
git stash pop                    # bring them back
git reflog                       # the safety net: a log of where HEAD has been
```

> **The golden rule:** on **shared** history (anything pushed), use `git revert` (adds a commit). Use `git reset --hard`
> only on **local** commits no one else has. And `git reflog` can recover almost anything — even "lost" commits after a
> bad reset.

## 8. .gitignore

Keep junk and secrets out of history:

```gitignore
__pycache__/
.venv/
.env                  # secrets — never commit
*.parquet             # data files
data/
.DS_Store
.ipynb_checkpoints/
```

(Already committed a file you now want to ignore? `git rm --cached file` then add it to `.gitignore`.)

## 9. Inspecting history

```bash
git log --oneline -10                 # last 10 commits
git log --author="Ada" --since="2 weeks ago"
git log -p path/to/file               # history of one file, with diffs
git blame file.py                     # who last changed each line
git diff main..feature                # what differs between branches
```

## 10. Merge vs rebase

```bash
git merge main                        # combine histories (a merge commit)
git rebase main                       # REPLAY your commits on top of main (linear history)
```

- **Merge** preserves exactly what happened (a merge commit). **Rebase** rewrites your branch onto the latest `main`
  for a clean, linear history. Rebase **only your own un-pushed** commits; never rebase shared history.

## 11. Tags (mark releases)

```bash
git tag v1.0.0                        # lightweight tag
git tag -a v1.0.0 -m "release"        # annotated
git push origin v1.0.0
```

## 12. What a data engineer versions

| In Git | NOT in Git |
|---|---|
| pipeline code, dbt models, SQL | data files (Parquet/CSV) — too big, use a lake |
| Terraform / IaC, configs | secrets — use a vault / env vars |
| notebooks (cleared outputs), tests | credentials, `.env` |
| `.github/workflows` CI | large model binaries — use artifact storage |

## 13. Recipes (scenarios)

```bash
# A) committed a secret in the LAST commit — remove it before pushing
git rm --cached .env && echo '.env' >> .gitignore
git commit --amend --no-edit

# B) "I made a mess, take me back to the last commit"
git restore .                      # discard working edits
# or: git reset --hard HEAD

# C) undo a commit that's ALREADY pushed (safe)
git revert <hash> && git push

# D) recover a commit you lost after a bad reset
git reflog                          # find the hash
git switch -c rescue <hash>

# E) pull but you have local edits in the way
git stash && git pull && git stash pop
```

## 14. Practice

1. Stage only part of a file's changes, then commit them.
   *Answer:* `git add -p` (choose hunks), then `git commit -m "..."`.
2. You committed to `main` but meant to be on a branch. Move the last commit to a new branch.
   *Answer:* `git switch -c feature/x` (brings the commit), then `git switch main && git reset --hard HEAD~1`.
3. Undo a change that's already shared, safely.
   *Answer:* `git revert <hash>` — a new commit that reverses it, preserving history.
4. You "lost" work after `git reset --hard`. Recover it.
   *Answer:* `git reflog` to find the commit hash, then `git switch -c rescue <hash>`.

Internalize the three areas, the add→commit→push loop, branching, and the undo recipes, and Git stops being scary and
becomes the safety net under everything you build.
