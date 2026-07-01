# Classes & objects (OOP) — the complete guide

Object-oriented programming groups data and the behaviour that acts on it into
**classes**. In data engineering you'll use classes to model pipeline steps,
connections, and configs. This guide covers everything from `__init__` to dataclasses,
with examples and practice.

## 1. Class vs object

@@diagram:class-object

A **class** is a blueprint; an **object** (instance) is one thing built from it. The
class defines *what every instance has and can do*; each object holds its own values.

## 2. Defining a class

```python
class Customer:
    def __init__(self, name, country):   # constructor — runs at creation
        self.name = name                 # instance attributes
        self.country = country

    def greeting(self):                  # a method
        return f"Hi, {self.name}"

c = Customer("Ava", "India")             # create an instance
c.name           # 'Ava'       (attribute)
c.greeting()     # 'Hi, Ava'   (method)
```

- **`__init__`** is the constructor — Python calls it automatically when you write
  `Customer(...)`, to set up the new object.
- **`self`** is the specific object the method is working on. Every method takes it
  first; `c.greeting()` passes `c` as `self`.
- **Attributes** hold data (`self.name`); **methods** are functions in the class.

## 3. Instance vs class attributes

```python
class Account:
    bank = "DataForge Bank"      # CLASS attribute — shared by all instances
    def __init__(self, owner):
        self.owner = owner       # INSTANCE attribute — per object

a = Account("Ava")
a.owner    # 'Ava'  (its own)
a.bank     # 'DataForge Bank' (shared)
```

## 4. Dunder ("magic") methods

Special `__name__` methods customise built-in behaviour:

```python
class Money:
    def __init__(self, amount):
        self.amount = amount
    def __str__(self):                 # what print() shows
        return f"${self.amount:.2f}"
    def __repr__(self):                # the debug form (in lists, REPL)
        return f"Money({self.amount})"
    def __eq__(self, other):           # makes == work
        return self.amount == other.amount

print(Money(5))        # $5.00
Money(5) == Money(5)   # True
```

## 5. Inheritance

A class can extend another, reusing its code and overriding parts:

```python
class Vip(Customer):
    def __init__(self, name, country, tier):
        super().__init__(name, country)   # call the parent constructor
        self.tier = tier
    def greeting(self):                   # override
        return f"Welcome back, {self.name} ({self.tier})"

Vip("Raj", "India", "gold").greeting()    # 'Welcome back, Raj (gold)'
```

`super()` accesses the parent class. Prefer **composition** (an object holding other
objects) over deep inheritance hierarchies when modelling gets complex.

## 6. @property, @staticmethod, @classmethod

```python
class Circle:
    def __init__(self, r):
        self.r = r
    @property
    def area(self):                  # call like an attribute: c.area (no parens)
        return 3.14159 * self.r ** 2
    @staticmethod
    def unit():                      # no self — a utility on the class
        return Circle(1)
    @classmethod
    def from_diameter(cls, d):       # alternative constructor
        return cls(d / 2)
```

## 7. dataclasses (less boilerplate)

For classes that mostly hold fields, `@dataclass` writes `__init__`, `__repr__`, and
`__eq__` for you:

```python
from dataclasses import dataclass

@dataclass
class Source:
    name: str
    rows: int
    def is_big(self) -> bool:
        return self.rows > 1_000_000

s = Source("orders", 5_000_000)
s.is_big()     # True
print(s)       # Source(name='orders', rows=5000000)  — free __repr__
```

## 8. When to use classes in data engineering

Use a class when grouping **state + behaviour** keeps code clean: a pipeline step (a
`Transformer` with a `run()` method), a database connection wrapper, a config object, a
custom exception. For one-off data shuffling, plain functions + dicts/dataclasses are
often enough — don't over-engineer with deep class hierarchies.

## Practice

1. **Rectangle.** Class with `__init__(width, height)` and `area()`.
2. **dataclass.** Convert a `Product(name, price)` class to a dataclass.
3. **Inheritance.** `DiscountedProduct` subclass adding `final_price(pct)`.
4. **self.** Explain what `self` is and why methods need it.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"What's the difference between a class and an object, and what does `__init__` do?"*

A class is the blueprint defining attributes and methods; an object is a specific
instance built from it, with its own attribute values. `__init__` is the constructor —
it runs automatically when you create an object to initialise its attributes, with
`self` referring to that new object.
