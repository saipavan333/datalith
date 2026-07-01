# Files, permissions & processes — the complete guide

Two everyday operations skills: controlling **who can do what** to files, and managing
**running programs**. This guide covers permissions, ownership, and process control,
with examples and practice.

## 1. Reading permissions

`ls -l` shows each file's permissions, owner, and group:

```
-rwxr-xr--  1 ava  data  2048  May 1 10:00  script.sh
│└┬┘└┬┘└┬┘
│ │  │  └ others: r--  (read only)
│ │  └──── group:  r-x  (read, execute)
│ └─────── owner:  rwx  (read, write, execute)
└───────── type: - file, d directory, l link
```

Three permission sets — **owner**, **group**, **others** — each with **read (r)**,
**write (w)**, **execute (x)**.

## 2. Changing permissions — chmod

**Symbolic:**

```bash
chmod +x script.sh        # add execute (for everyone)
chmod u+x,g-w file        # owner +execute, group -write
chmod -R 755 dir/         # recursive
```

**Numeric** (r=4, w=2, x=1; sum per set):

```bash
chmod 644 file            # rw-r--r--  (owner rw, others r)
chmod 755 script.sh       # rwxr-xr-x  (owner all, others r+x)
chmod 600 secret.key      # rw-------  (owner only)
```

The most common need: a "Permission denied" when running your script → `chmod +x`.

## 3. Ownership — chown

```bash
chown ava file            # change owner (often needs sudo)
chown ava:data file       # change owner and group
chown -R ava:data dir/    # recursive
```

## 4. Processes

A running program is a **process** with a **PID** (process id):

```bash
ps aux                    # all processes (USER, PID, %CPU, %MEM, COMMAND)
ps aux | grep python      # find yours
top        (or htop)      # live, sorted by CPU/memory (q to quit)
pgrep -f load.py          # get PIDs by name
```

## 5. Stopping processes (signals)

```bash
kill 1234                 # SIGTERM — ask it to stop gracefully (default)
kill -9 1234              # SIGKILL — force kill (last resort, no cleanup)
pkill -f load.py          # kill by name
```

Prefer `kill` (graceful) so the process can flush/clean up; use `-9` only if it won't
respond.

## 6. Background & long-running jobs

```bash
long_job &                # run in background (returns the prompt)
nohup long_job &          # keep running after you log out
jobs                      # list background jobs
fg %1 ; bg %1             # bring to foreground / resume in background
disown                    # detach a job from the shell
```

For interactive long sessions, **tmux** or **screen** keep your work alive across
disconnects.

## 7. Exit codes

Every command returns an **exit code**: **0 = success**, non-zero = failure.

```bash
./load.sh
echo $?                   # 0 if it worked
./load.sh && echo "ok"    # run echo only on success
./load.sh || alert        # run alert only on failure
```

Scripts and pipelines branch on these to decide whether to continue, retry, or abort.

## Practice

1. **Make runnable.** Fix "Permission denied" on `./backup.sh`.
2. **Find & stop.** Get the PID of `python load.py` and stop it gracefully.
3. **Survive logout.** Run a long job that keeps going after you disconnect.
4. **Exit codes.** What does `echo $?` tell you and why does it matter in scripts?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"A scheduled script fails with 'Permission denied', and another job is stuck — how do
> you handle each?"*

For "Permission denied" on a script, add the execute bit (`chmod +x script.sh`) or run
it via `bash script.sh`. For a stuck job, find it (`ps aux | grep` / `top`), then
`kill <PID>` to stop it gracefully (`kill -9` only if it won't respond). Check exit
codes (`$?`, 0 = success) so the pipeline reacts correctly.
