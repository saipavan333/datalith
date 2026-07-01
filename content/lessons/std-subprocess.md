# subprocess — run external commands — deep dive

Data pipelines constantly shell out — invoking `aws`, `dbt`, a compression tool, or another script. `subprocess` is the right, safe way to do that from Python. The whole game is: pass arguments as a **list** (not a shell string), check the exit code, and capture output.

@@diagram:subprocess-flow

## The one call to remember

```python
import subprocess

result = subprocess.run(
    ["aws", "s3", "cp", src, dst],   # a LIST of args — no shell parsing
    capture_output=True,             # grab stdout + stderr
    text=True,                       # decode bytes → str
    check=True,                      # raise CalledProcessError on non-zero exit
    timeout=300,                     # don't hang forever
)
print(result.stdout)
```

- `result.stdout` / `result.stderr` — the captured output (strings, with `text=True`).
- `result.returncode` — the exit code (0 = success).
- `check=True` raises `CalledProcessError` if the command fails, so errors surface instead of being silently ignored.

## Why you pass a list, not a string (security)

```python
# DANGEROUS — the shell interprets the string; a crafted filename can inject commands
subprocess.run(f"rm {user_path}", shell=True)      # NEVER with untrusted input

# SAFE — the args go straight to the program, the shell is bypassed entirely
subprocess.run(["rm", user_path])
```

With `shell=True`, the command string is parsed by the shell, so input like `"; rm -rf /"` executes. Passing an argument **list** (the default, `shell=False`) sends each argument literally to the program — no injection surface. Only use `shell=True` for trusted commands that genuinely need shell features (pipes, globbing), and never with user input.

## Handling failures and output

```python
try:
    r = subprocess.run(["dbt", "run"], capture_output=True, text=True, check=True)
except subprocess.CalledProcessError as e:
    log.error("dbt failed (%s): %s", e.returncode, e.stderr)
    raise
except subprocess.TimeoutExpired:
    log.error("dbt timed out")
    raise
```

For large or streaming output, use `Popen` and read incrementally rather than buffering everything in memory.

## Real DE uses

Triggering CLI tools (`aws`, `gcloud`, `dbt`, `great_expectations`), running a packaged binary as a pipeline step, calling a shell utility you don't have a Python equivalent for, or orchestrating a sub-script. Inside a pipeline, always `check=True` + capture output + log on failure, so a failed sub-command fails the task loudly.

## Cheat sheet

| Goal | How |
|---|---|
| run + check + capture | `run([...], capture_output=True, text=True, check=True)` |
| exit code | `result.returncode` |
| output | `result.stdout`, `result.stderr` |
| raise on failure | `check=True` → `CalledProcessError` |
| timeout | `timeout=seconds` → `TimeoutExpired` |
| stream large output | `subprocess.Popen(...)` + read in a loop |
| **avoid** | `shell=True` with untrusted input (injection) |

**Rules:** args as a list, `check=True`, set a `timeout`, capture and log output, never `shell=True` on user input.

## Practice

1. Why does `subprocess.run(["rm", path])` resist injection while `shell=True` with an f-string doesn't?
2. Write a call that runs `gzip file.csv`, raises on failure, and logs stderr.
3. When is `shell=True` actually appropriate, and what precaution must hold?
