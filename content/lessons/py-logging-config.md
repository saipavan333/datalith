# Logging & configuration — the complete guide

Unattended pipelines need to *tell you* what they're doing and *fail diagnosably* —
that's logging. And they need to run unchanged across dev/staging/prod — that's
configuration. This guide covers both, with examples and practice.

## 1. Why not print()?

`print()` has no severity, no timestamps, no way to route or filter output, and can't
capture tracebacks. For anything that runs unattended, use **logging**.

## 2. Basic logging

```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger(__name__)

log.debug("detail for debugging")
log.info("loaded %d rows", n)            # lazy %-formatting
log.warning("source is slow")
log.error("bad record %s", rid, exc_info=True)   # include the traceback
log.critical("pipeline cannot continue")
```

## 3. Levels

`DEBUG < INFO < WARNING < ERROR < CRITICAL`. Set the **threshold** per environment:
DEBUG locally, INFO or WARNING in production. Messages below the threshold are dropped,
so you can turn detail up/down without editing code.

## 4. Handlers — route the output

A logger sends records to one or more **handlers**: console, rotating files, syslog, or
a cloud logging service.

```python
import logging
from logging.handlers import RotatingFileHandler
h = RotatingFileHandler("app.log", maxBytes=10_000_000, backupCount=5)
logging.getLogger().addHandler(h)
```

**Structured (JSON) logs** (e.g. via `python-json-logger`) are machine-parseable, so
monitoring tools can filter and alert on fields.

## 5. Configuration — keep settings out of code

Never hard-code paths, hostnames, credentials, or env-specific values. Read them from
**environment variables** (or a config file) so the *same code* runs everywhere:

```python
import os
DB_URL   = os.environ["DATABASE_URL"]            # required — fail loudly if missing
BATCH    = int(os.environ.get("BATCH_SIZE", "1000"))  # optional with default
DEBUG    = os.environ.get("DEBUG", "").lower() == "true"
```

## 6. Secrets

Credentials are config too, but sensitive. **Never commit them.** Read them from a
**secrets manager** (AWS Secrets Manager, Vault) or injected env vars at runtime,
rotate them, and grant least privilege. A leaked key in git is a top cause of breaches.

## 7. Config files & 12-factor

For richer config, use `.env` files (with `python-dotenv` locally), `pyproject.toml`,
or YAML — but keep **environment-specific** values and **secrets** external. The
"12-factor" principle: store config in the environment, so one build runs in any
environment by changing only its config.

## Practice

1. **Three reasons** logging beats print() in production.
2. **Read BATCH_SIZE** from the environment, default 500, as int.
3. **Where do secrets live** (and not live)?
4. **Log a traceback** when a record fails to parse.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you make a pipeline diagnosable and portable across environments?"*

Use **logging** (leveled, timestamped, routable, with `exc_info` for tracebacks; JSON
for monitoring) instead of print, set the level per environment. Keep all
environment-specific settings and secrets in **external config / env vars / a secrets
manager**, never hard-coded — so the same code runs in dev, staging, and prod by
changing only configuration, with secrets out of source control.
