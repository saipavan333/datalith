# argparse — command-line interfaces — deep dive

A pipeline script that hard-codes its inputs is a script you can only run one way. `argparse` (standard library, no dependencies) turns a script into a proper CLI tool: typed arguments, defaults, validation, and an auto-generated `--help`. It's how you make a job reusable across dates, environments, and tables.

@@diagram:argparse-flow

## The basic shape

```python
import argparse

def main():
    p = argparse.ArgumentParser(description="Load a table for a given date.")
    p.add_argument("table")                                  # positional (required)
    p.add_argument("--date", required=True, help="YYYY-MM-DD")
    p.add_argument("--limit", type=int, default=1000)        # typed + default
    p.add_argument("--dry-run", action="store_true")         # boolean flag
    p.add_argument("--env", choices=["dev", "prod"], default="dev")
    args = p.parse_args()

    run(args.table, args.date, limit=args.limit, dry_run=args.dry_run, env=args.env)

if __name__ == "__main__":
    main()
```

```bash
python load.py orders --date 2024-03-15 --limit 5000 --env prod
python load.py --help        # argparse generates usage + help automatically
```

## The argument types you'll define

- **Positional** — `add_argument("table")` — required, order-based.
- **Optional** — `add_argument("--date")` — named, with `required=`, `default=`.
- **Typed** — `type=int` / `type=float` — argparse converts and validates.
- **Flags** — `action="store_true"` — presence = `True` (e.g. `--dry-run`).
- **Choices** — `choices=[...]` — restrict to allowed values (rejects others with a clear error).
- **Multiple** — `nargs="+"` — accept a list (`--tables a b c`).

## Subcommands for multi-action tools

```python
sub = p.add_subparsers(dest="cmd", required=True)
ext = sub.add_parser("extract"); ext.add_argument("--source")
ld  = sub.add_parser("load");    ld.add_argument("--table")
# python tool.py extract --source api      |     python tool.py load --table orders
```

## The pattern that makes scripts both runnable and testable

Put logic in functions, parse args in `main()`, and guard with `if __name__ == "__main__":`. That way the file runs as a CLI **and** can be imported in tests (where you call the functions directly with arguments, no argparse). Separating "parse the CLI" from "do the work" is what keeps it testable.

## argparse vs click / typer

`argparse` is stdlib and universal but verbose. `click` and `typer` are third-party and more ergonomic (decorators, type-hints-to-CLI, less boilerplate). For a simple script, `argparse` is perfect and dependency-free; for a rich multi-command CLI, `typer`/`click` save effort. Know `argparse` — it's everywhere and always available.

## Cheat sheet

| Need | Code |
|---|---|
| parser | `argparse.ArgumentParser(description=...)` |
| required positional | `add_argument("table")` |
| optional + default | `add_argument("--limit", type=int, default=10)` |
| required flag | `add_argument("--date", required=True)` |
| boolean | `add_argument("--dry-run", action="store_true")` |
| restrict values | `add_argument("--env", choices=["dev","prod"])` |
| list of values | `add_argument("--ids", nargs="+")` |
| subcommands | `p.add_subparsers(dest="cmd")` |
| parse | `args = p.parse_args()` |

## Practice

1. Add a `--start` and `--end` date argument that are both required and typed.
2. Why does `choices=` improve a CLI over validating the value yourself afterward?
3. Write the `if __name__ == "__main__":` guard and explain why it aids testing.
