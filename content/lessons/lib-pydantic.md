# Pydantic — the complete guide

Pydantic is the standard for data validation in Python (it powers FastAPI). You declare a typed **model**, and Pydantic
checks and coerces every input against it at the **boundary** of your system — turning untrusted data into guaranteed-
valid objects, or raising a precise error. This guide covers models, field types and constraints, validators, nested
models, serialization, settings, and integration, with scenarios.

## 1. The boundary idea

@@diagram:pydantic-flow

Validate **at the edge** — the moment data arrives from an API, file, or queue. Inside the boundary you work with
objects you *know* are valid; outside, bad data is turned away with a clear reason. Far better than scattering `if`
checks everywhere.

```bash
pip install pydantic        # v2; pydantic-settings for BaseSettings
```

## 2. Defining a model

```python
from pydantic import BaseModel, Field, field_validator
from datetime import date

class Order(BaseModel):
    id: int
    amount: float = Field(gt=0)                 # must be positive
    currency: str = Field(min_length=3, max_length=3)
    order_date: date
    note: str | None = None                     # optional, defaults to None

    @field_validator('currency')
    @classmethod
    def upper(cls, v: str) -> str:
        return v.upper()
```

## 3. Field types and constraints

```python
from pydantic import Field, EmailStr, HttpUrl, conint, constr
from typing import Literal
from decimal import Decimal

age: int = Field(ge=0, le=120)                   # range
name: str = Field(min_length=1, max_length=100)
price: Decimal = Field(max_digits=10, decimal_places=2)
email: EmailStr                                  # validated email
website: HttpUrl                                 # validated URL
status: Literal['new', 'paid', 'shipped']        # enum-like
tags: list[str] = Field(default_factory=list)    # safe mutable default
score: float = Field(default=0.0, ge=0, le=1)
```

Common field options: `gt/ge/lt/le` (numbers), `min_length/max_length` (strings/lists), `pattern` (regex),
`default`/`default_factory`, `alias`.

## 4. Validators

```python
from pydantic import field_validator, model_validator

class Signup(BaseModel):
    password: str
    confirm: str

    @field_validator('password')                 # validate ONE field
    @classmethod
    def strong(cls, v):
        if len(v) < 8: raise ValueError('too short')
        return v

    @model_validator(mode='after')               # validate the WHOLE model
    def passwords_match(self):
        if self.password != self.confirm:
            raise ValueError('passwords do not match')
        return self
```

## 5. Nested models

Models compose, so you validate complex JSON in one call:

```python
class Address(BaseModel):
    city: str
    zip: str = Field(pattern=r'^\d{5}$')

class Customer(BaseModel):
    name: str
    address: Address                  # nested
    orders: list[Order] = []          # list of models

Customer.model_validate(json_dict)    # validates the whole tree
```

## 6. Parsing and serializing

```python
Order.model_validate({'id': 1, 'amount': 50, 'currency': 'usd', 'order_date': '2024-03-01'})
Order.model_validate_json('{"id": 1, ...}')     # from a JSON string
o.model_dump()                                   # -> dict
o.model_dump(exclude_none=True, by_alias=True)
o.model_dump_json()                              # -> JSON string
```

**Coercion vs strict:** by default Pydantic coerces compatible types (`"50"` → `50.0`); use
`model_config = ConfigDict(strict=True)` (or `Field(strict=True)`) to reject mismatches.

## 7. Errors — the quarantine pattern

Invalid data raises a structured `ValidationError` listing every failing field:

```python
from pydantic import ValidationError

good, bad = [], []
for rec in raw_records:
    try:
        good.append(Order.model_validate(rec))
    except ValidationError as e:
        bad.append({'record': rec, 'errors': e.errors()})   # field-level reasons
load(good); write_quarantine(bad)                            # nothing lost
```

This catches **schema drift** (an upstream rename or type change) loudly and immediately.

## 8. Computed fields, aliases, config

```python
from pydantic import computed_field, ConfigDict, Field

class Item(BaseModel):
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)
    qty: int
    price: float
    unit_name: str = Field(alias='unitName')     # accept external camelCase

    @computed_field                               # derived, included in dump
    @property
    def total(self) -> float:
        return self.qty * self.price
```

## 9. Settings from the environment

`BaseSettings` (in `pydantic-settings`) reads and validates configuration from **env vars** — typed, checked config
instead of scattered `os.environ` lookups:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_url: str
    batch_size: int = 1000
    debug: bool = False
    model_config = {'env_prefix': 'APP_'}        # reads APP_DB_URL, APP_BATCH_SIZE, ...

settings = Settings()        # raises if APP_DB_URL is missing/invalid
```

## 10. Integration

- **FastAPI** uses models as request/response schemas with auto-generated docs.
- **SQLAlchemy** — validate with Pydantic at the boundary, persist with the ORM (or use SQLModel, which combines them).
- v2's core is compiled **Rust**, so validating millions of records adds little overhead — you can afford to check every row.

## 11. Scenario A — validate a batch at ingestion

```python
from pydantic import BaseModel, Field, ValidationError
from datetime import date

class Event(BaseModel):
    user_id: int = Field(gt=0)
    action: str
    amount: float = Field(ge=0)
    ts: date

clean, rejects = [], []
for raw in incoming:
    try: clean.append(Event.model_validate(raw))
    except ValidationError as e: rejects.append((raw, e.errors()))
warehouse.load([e.model_dump() for e in clean])
deadletter.write(rejects)
```

## 12. Scenario B — a shared data contract

```python
# shared_models.py — imported by BOTH the producer and the consumer
class OrderEvent(BaseModel):
    order_id: int
    amount: float = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
# producer validates output, consumer validates input -> drift fails at the boundary
```

## 13. Gotchas

- Hints become validation, but a plain class attribute without a type is **not** a field — annotate everything.
- Use `default_factory` for mutable defaults (`list`, `dict`), never a literal `[]`/`{}`.
- Coercion is on by default; turn on strict mode where you need exact types.

## 14. Practice

1. Define an `Order` model with a positive `amount` and a 3-letter `currency`, and validate a dict.
2. Add a cross-field rule that `end_date >= start_date` with `model_validator`.
3. Validate a batch and collect invalid rows with their error details.
4. Load typed config from environment variables with `BaseSettings`.

Validate at the boundary with Pydantic and everything downstream gets simpler — you're always working with data you
know is clean, and schema drift fails loudly instead of silently corrupting your tables.
