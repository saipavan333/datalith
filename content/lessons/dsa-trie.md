# Tries: prefix trees for strings — the complete guide

A **trie** (prefix tree) stores strings by **shared prefixes**, giving **O(key-length)** lookup and — its superpower — efficient **prefix search** and **longest-prefix match**, which hashing fundamentally can't do. It's the structure behind autocomplete, IP routing, and dictionary/tokenization matching. This chapter covers it and when to reach for it.

@@diagram:dsa-trie

## 1. What a trie is

A **trie** is a tree where **each edge is a character** and a **path from the root spells a string**. Strings sharing a **common prefix share the same path** until they diverge. The root is the empty string; nodes can be marked as **word-ends**.

## 2. Operations & complexity

- **Insert / lookup** a string of length **L**: walk **L** edges → **O(L)**, **independent of n** (the number of stored strings) — versus O(L·log n) for a balanced tree.
- **Shared prefixes stored once** — `cat` and `car` share the `ca` path, saving space when many strings share prefixes.

## 3. The superpower: prefix & longest-prefix queries

- **Prefix search / autocomplete** — walk to the prefix node, then **collect its subtree** to get all strings with that prefix. A **hash set can't** do this (it'd scan everything).
- **Longest-prefix match** — **IP routing** stores network prefixes in a trie and finds the **longest matching prefix** for an address in O(address length) — the basis of forwarding.
- **Ordered traversal** — an in-order walk yields strings in lexicographic order.

## 4. Variants

- **Radix / Patricia trie** — compresses chains of single-child nodes into one edge → **space-efficient**; used in **routing tables** and key-value stores.
- **Suffix tree / suffix array** — for **substring** search.
- **Ternary search trie** — a memory-leaner trie variant.
You rarely implement these, but the **concept** explains autocomplete and routing.

## 5. Trie vs hash set

| | Hash set | Trie |
|---|---|---|
| Membership | O(1) exact | O(L) |
| Prefix search | **No** | **Yes** |
| Longest-prefix match | No | Yes |
| Ordered traversal | No | Yes |
| Memory | Compact | More (pointers per char) |

Use a **trie** when you need **prefix operations**; a **hash set** for plain exact membership.

## 6. DE relevance

- **Autocomplete / search** suggestions.
- **IP / longest-prefix routing** (networking, load balancers, partition/path routing).
- **Dictionary / tokenization matching** (NLP/ETL parsing, keyword/stopword matching, gazetteers).
- **String-key indexing** and **string interning**.
- A common **interview** structure ("implement an autocomplete / word dictionary / longest-prefix").

## 7. Gotchas

- **Using a hash set for prefix queries** — it can't; use a trie.
- **Memory** — a naive trie has many pointers; use a **radix/compressed** trie for large dictionaries.
- **Ranking** — autocomplete needs **frequency/popularity** ranking; store scores (often **precompute top-K per node** for speed).
- **Unicode / large alphabets** — child maps (not fixed arrays) keep memory reasonable.
- **Substring (not prefix) search** — needs suffix structures, not a plain trie.
- **Over-engineering** — for tiny/static sets, simpler structures may suffice.

## Scenario — instant autocomplete

A search box's **autocomplete** stores the dictionary in a **trie**, with a **frequency** score per word (and often a **precomputed top-K** at each node). As the user types `ca`, the engine walks root→c→a (**O(2)**) to the `ca` node and returns its cached **top-K completions** — `cat`, `car`, `card`, … — ranked by popularity, **instantly**. A hash set of words couldn't answer "all words starting with `ca`" without scanning everything. The same structure (as a **radix trie**) powers **IP routing**: a router finds the **longest-prefix match** for a destination address in O(address length) to decide forwarding. Shared prefixes are stored once. Recognizing "this is a **prefix** problem → **trie**" — and adding frequency ranking / per-node top-K for autocomplete — is the takeaway, and a frequent interview ask.

## Practice

1. How does a trie represent strings, and why is lookup O(L) regardless of n?
2. What can a trie do that a hash set cannot (prefix, longest-prefix, ordered)?
3. How does autocomplete use a trie, and how do you rank suggestions?
4. What is longest-prefix match, and where is it used (IP routing)?
5. Compare a trie and a hash set across membership, prefix, order, memory.
6. What variants exist (radix/Patricia, suffix tree) and what are they for?
7. List DE uses of tries and when NOT to use one.
