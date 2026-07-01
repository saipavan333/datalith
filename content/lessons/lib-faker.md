# Faker — the complete guide

Faker generates realistic fake data on demand: names, emails, addresses, dates, companies, text, and hundreds more.
You use it to seed development databases, build demo datasets, and load-test pipelines — all without touching real
customer data. This guide is a full reference: setup, every provider category, seeding, locales, uniqueness, custom
providers, and scenarios for building datasets.

## 1. Setup

```bash
pip install faker
```

```python
from faker import Faker
fake = Faker()            # default locale: en_US
fake.name()               # 'Allison Hill'
fake.email()              # 'donaldgarcia@example.net'
```

@@diagram:faker-providers

You call **providers** — methods grouped by topic. Below is the working catalog.

## 2. Provider reference

**People & identity**
```python
fake.name(); fake.first_name(); fake.last_name(); fake.prefix(); fake.suffix()
fake.name_male(); fake.name_female()
fake.ssn(); fake.passport_number()
```

**Contact & internet**
```python
fake.email(); fake.safe_email(); fake.company_email()
fake.phone_number(); fake.msisdn()
fake.user_name(); fake.password(); fake.url(); fake.domain_name()
fake.ipv4(); fake.ipv6(); fake.mac_address(); fake.user_agent()
```

**Location**
```python
fake.address(); fake.street_address(); fake.city(); fake.state(); fake.state_abbr()
fake.country(); fake.country_code(); fake.zipcode(); fake.postcode()
fake.latitude(); fake.longitude(); fake.local_latlng()
```

**Company & job**
```python
fake.company(); fake.company_suffix(); fake.catch_phrase(); fake.bs()
fake.job()
```

**Dates & times**
```python
fake.date(); fake.time(); fake.date_time()
fake.date_between(start_date='-1y', end_date='today')
fake.date_time_between(start_date='-30d', end_date='now')
fake.date_of_birth(minimum_age=18, maximum_age=90)
fake.unix_time(); fake.future_date(); fake.past_datetime()
```

**Numbers, money, finance**
```python
fake.random_int(min=0, max=100); fake.random_number(digits=5)
fake.pyfloat(min_value=0, max_value=500, right_digits=2)
fake.pydecimal(left_digits=4, right_digits=2)
fake.currency_code(); fake.credit_card_number(); fake.iban()
```

**Text & identifiers**
```python
fake.word(); fake.sentence(); fake.paragraph(); fake.text(max_nb_chars=200)
fake.uuid4(); fake.color_name(); fake.hex_color(); fake.file_name(extension='csv')
```

**Choose from your own data**
```python
fake.random_element(['new', 'paid', 'shipped'])            # one item
fake.random_elements(['a','b','c'], length=2, unique=True) # several
fake.random_sample(['x','y','z','w'])                      # random subset
```

## 3. Reproducibility — seeding

A seed fixes the random sequence so you get the **same data every run** (essential for stable tests):

```python
Faker.seed(42)            # class-level seed
fake = Faker()
fake.name()               # always the same value now
```

## 4. Locales — region-appropriate data

```python
Faker('ja_JP').name()         # Japanese names
Faker('de_DE').address()      # German addresses
Faker('fr_FR').company()      # French companies

# mix several locales (each call randomly picks one)
multi = Faker(['en_US', 'en_GB', 'es_ES'])
multi.name()
```

There are 70+ locales (`en_US`, `en_GB`, `fr_FR`, `de_DE`, `ja_JP`, `zh_CN`, `hi_IN`, …).

## 5. Uniqueness

When a value must be distinct (a primary key, a unique email), use the `.unique` proxy:

```python
ids = [fake.unique.random_int(1000, 9999) for _ in range(500)]   # no duplicates
fake.unique.clear()    # reset the uniqueness memory between datasets
```

(If you exhaust the space — e.g. ask for more unique ints than exist in the range — Faker raises `UniquenessException`.)

## 6. Custom providers

Need domain-specific data? Register your own provider:

```python
from faker.providers import BaseProvider

class SkuProvider(BaseProvider):
    def sku(self):
        return self.random_element(['ELEC', 'HOME', 'TOY']) + '-' + \
               str(self.random_int(1000, 9999))

fake.add_provider(SkuProvider)
fake.sku()       # 'ELEC-4821'
```

## 7. Scenario A — build a synthetic dataset for a pipeline

```python
from faker import Faker
import pandas as pd

fake = Faker(); Faker.seed(0)

def make_customers(n):
    return pd.DataFrame([{
        'customer_id': fake.unique.random_int(100000, 999999),
        'name':        fake.name(),
        'email':       fake.unique.email(),
        'country':     fake.country(),
        'signup_date': fake.date_between('-3y', 'today'),
        'lifetime_value': round(fake.pyfloat(min_value=0, max_value=5000, right_digits=2), 2),
        'is_active':   fake.boolean(chance_of_getting_true=70),
    } for _ in range(n)])

customers = make_customers(10_000)
customers.to_parquet('synthetic_customers.parquet')
```

This gives you 10,000 realistic, reproducible rows to develop and benchmark against before real data exists.

## 8. Scenario B — seed a development database

```python
from faker import Faker
fake = Faker(); Faker.seed(7)

with engine.begin() as conn:
    conn.execute(text("INSERT INTO users (name, email, city) VALUES (:n, :e, :c)"),
                 [{'n': fake.name(), 'e': fake.unique.email(), 'c': fake.city()}
                  for _ in range(1000)])
```

## 9. Scenario C — load-testing volume

```python
# stream a million events without holding them all in memory
def fake_events(n):
    for _ in range(n):
        yield {'ts': fake.unix_time(), 'user': fake.random_int(1, 50_000),
               'action': fake.random_element(['view', 'click', 'buy']),
               'amount': round(fake.pyfloat(0, 200, right_digits=2), 2)}

for batch in chunks(fake_events(1_000_000), 10_000):
    pipeline.load(batch)
```

## 10. Gotchas & cousins

- Faker rows are **statistically independent** — emails don't match names, and there are no referential constraints.
  For distribution-matched or referentially consistent synthetic data, look at **Mimesis** (faster) or **SDV** (learns
  from real data).
- Seed *and* clear `unique` between separate datasets to keep them reproducible and non-overlapping.
- Generating millions of rows is CPU-bound; generate lazily (a generator) and write in batches.

## 11. Practice

1. Build 500 reproducible `(name, email, country)` rows in a DataFrame.
2. Generate 1,000 **unique** integer IDs in the range 10000–99999.
3. Produce German-locale company names.
4. Add a custom provider that returns an order code like `ORD-2024-0042`.

Faker turns "I need realistic test data" into three lines — and keeps real customer data out of your dev and test
environments entirely.
