# SQLAlchemy ORM — the complete guide

The ORM (Object-Relational Mapper) lets you work with **Python objects** instead of raw rows: define classes, create
and modify objects, and SQLAlchemy generates the SQL. This guide covers declarative models, the Session and unit of
work, querying, relationships, loading strategies (and the N+1 problem), cascades, and Alembic migrations — with
scenarios. (It builds on the Core guide's Engine.)

## 1. Classes map to tables

@@diagram:orm-mapping

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, create_engine

class Base(DeclarativeBase):
    pass

class Customer(Base):
    __tablename__ = 'customers'
    id:    Mapped[int] = mapped_column(primary_key=True)
    name:  Mapped[str]
    email: Mapped[str | None]                                  # nullable
    orders: Mapped[list['Order']] = relationship(back_populates='customer')

class Order(Base):
    __tablename__ = 'orders'
    id:          Mapped[int]   = mapped_column(primary_key=True)
    amount:      Mapped[float]
    customer_id: Mapped[int]   = mapped_column(ForeignKey('customers.id'))
    customer:    Mapped['Customer'] = relationship(back_populates='orders')

engine = create_engine('postgresql+psycopg://u:pw@host/db')
Base.metadata.create_all(engine)        # create tables that don't exist
```

`Mapped[...]` declares the Python type; `mapped_column(...)` sets column options (primary key, FK, defaults, unique).

## 2. The Session — your unit of work

The **Session** tracks every object you add or change and flushes them as **one transaction** on `commit()`:

```python
from sqlalchemy.orm import Session

with Session(engine) as s:
    c = Customer(name='Ada', email='ada@x.com')
    s.add(c)
    s.commit()                  # INSERT happens here
    c.id                        # now populated

    c.email = 'new@x.com'       # tracked change
    s.commit()                  # UPDATE

    s.delete(c); s.commit()     # DELETE
```

## 3. Querying with `select`

Modern SQLAlchemy (2.0) uses `select()` + `session.scalars()`:

```python
from sqlalchemy import select, func

s.get(Customer, 1)                                   # fetch by primary key
s.scalars(select(Customer).where(Customer.name == 'Ada')).all()
s.scalars(select(Customer).where(Customer.name.like('A%')).order_by(Customer.id)).all()
s.scalars(select(Customer).limit(10).offset(20)).all()

# aggregates and joins
s.execute(select(func.sum(Order.amount)).where(Order.amount > 0)).scalar()
s.execute(select(Customer.name, func.count(Order.id))
          .join(Order).group_by(Customer.name)).all()
```

## 4. Relationships

`relationship()` + `ForeignKey` model associations and let you navigate objects:

```python
with Session(engine) as s:
    ada = Customer(name='Ada')
    ada.orders.append(Order(amount=99.5))   # the FK is set for you
    s.add(ada); s.commit()                   # both rows inserted in one transaction

    cust = s.get(Customer, ada.id)
    [o.amount for o in cust.orders]          # navigate the relationship
    cust.orders[0].customer.name             # …and back
```

**Many-to-many** uses an association table:

```python
from sqlalchemy import Table, Column
tags = Table('post_tags', Base.metadata,
             Column('post_id', ForeignKey('posts.id')),
             Column('tag_id',  ForeignKey('tags.id')))
class Post(Base):
    ...
    tags: Mapped[list['Tag']] = relationship(secondary=tags)
```

## 5. Loading strategies & the N+1 problem

Relationships are **lazy** by default: accessing `customer.orders` fires a separate query each time. Looping over many
customers then triggers **N+1 queries** — slow. Fix with **eager loading**:

```python
from sqlalchemy.orm import selectinload, joinedload

# fetch all customers AND their orders efficiently
s.scalars(select(Customer).options(selectinload(Customer.orders))).all()
s.scalars(select(Order).options(joinedload(Order.customer))).all()
```

- `selectinload` — a second IN query for the related rows (great for collections).
- `joinedload` — a single JOIN (great for many-to-one).

## 6. Cascades and defaults

```python
orders: Mapped[list['Order']] = relationship(
    back_populates='customer', cascade='all, delete-orphan')   # delete orders with the customer

created: Mapped[datetime] = mapped_column(server_default=func.now())
status:  Mapped[str]      = mapped_column(default='new')
```

## 7. Migrations with Alembic

Schema changes are versioned with **Alembic** so environments stay in sync:

```bash
alembic init migrations
alembic revision --autogenerate -m "add email to customers"
alembic upgrade head        # apply;  alembic downgrade -1 to revert
```

## 8. Scenario A — create related records atomically

```python
with Session(engine) as s:
    customer = Customer(name='Ada Lovelace', email='ada@x.com')
    customer.orders = [Order(amount=120.0), Order(amount=45.5)]
    s.add(customer)
    s.commit()                  # 1 customer + 2 orders, one transaction
```

## 9. Scenario B — a report query without N+1

```python
from sqlalchemy.orm import selectinload
with Session(engine) as s:
    stmt = (select(Customer)
            .options(selectinload(Customer.orders))
            .where(Customer.created > cutoff))
    for c in s.scalars(stmt):                 # orders already loaded — no extra queries
        print(c.name, sum(o.amount for o in c.orders))
```

## 10. Core vs ORM — when to use which

- **ORM** — application backends, stateful data, anything where modeling **objects and relationships** is natural.
- **Core** — bulk ETL movement: explicit SQL, fast `executemany`, streamed reads.

Many systems use both: Core for the heavy data pipes, the ORM for metadata/state tables.

## 11. Gotchas

- Forgetting `commit()` means changes are never saved (and the Session expires objects after commit by default — re-access reloads them).
- Lazy loading after the Session closes raises `DetachedInstanceError` — load what you need (eagerly) inside the Session.
- The N+1 problem is the most common ORM performance bug — reach for eager loading in loops.

## 12. Practice

1. Define `Customer` and `Order` models with a one-to-many relationship.
2. Create a customer with two orders and commit them in one transaction.
3. Query customers named like 'A%', ordered by id, returning objects.
4. Eager-load each customer's orders to avoid N+1 in a reporting loop.

The ORM turns rows into objects and a Session into a unit of work — powerful for app data and relationships, while Core
stays the tool for bulk movement.
