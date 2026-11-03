/* Datalith pass 2 — Track 6: Python for Data Engineering (part 1 of 3). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- py-types-structures */
  const TRUTH = [["0", false], ["42", true], ['""', false], ['"0"', true], ["[]", false], ["[0]", true], ["None", false], ["0.0", false]];
  P["py-types-structures"] = {
    simple: [
      "Every value in Python has a **type**, and the type decides what you can do with it. You can add two numbers, but adding a number to a word is an error.",
      "The four you meet first: **int** (whole numbers of any size), **float** (decimals, stored approximately), **str** (text) and **bool** (`True` or `False`). **None** means \"no value here\", like an empty cell.",
      "Python is **dynamically typed**: a name is a label stuck on a value, and the label can move to a value of another type later.",
    ],
    analogy: {
      text: "Think of labelled jars in a kitchen.",
      left: "Kitchen jars", right: "Python",
      map: [
        ["What is inside the jar: sugar, rice, salt", "The value's type: int, float, str"],
        ["A sticky note with a name on the jar", "A variable name"],
        ["Moving the sticky note to a different jar", "Rebinding `x = 'hi'` after `x = 5`"],
        ["An empty jar on the shelf", "`None`"],
        ["Measuring rice by the cup, never exact grains", "float: close, not exact (`0.1 + 0.2`)"],
      ],
      breaks: "a jar can be refilled with something else, but most Python values can't change. `x = x + 1` makes a new int and moves the label; it doesn't change the old 5.",
    },
    svg: () => {
      let b = t(240, 20, "Names are labels; values carry the type", { bold: true, size: 14 });
      b += box(20, 44, 90, 34, "x", null, "acc", { mono: true });
      b += box(20, 104, 90, 34, "y", null, "acc", { mono: true });
      b += box(20, 164, 90, 34, "z", null, "acc", { mono: true });
      b += box(200, 40, 130, 42, "5", "int", "good", { mono: true });
      b += box(200, 100, 130, 42, "0.30000000000000004", "float", "warn", { mono: true, size: 10 });
      b += box(200, 160, 130, 42, "None", "NoneType", "plain", { mono: true });
      b += arrow(112, 61, 198, 61); b += arrow(112, 121, 198, 121); b += arrow(112, 181, 198, 181);
      b += box(350, 40, 116, 42, "'hi'", "str", "vio", { mono: true });
      b += line(112, 50, 140, 33, { dash: true, stroke: C.vioS }) + line(140, 33, 408, 33, { dash: true, stroke: C.vioS }) + arrow(408, 33, 408, 39, { stroke: C.vioS });
      b += t(408, 104, "x = 'hi' later", { size: 11.5, fill: C.vioT });
      b += t(408, 120, "moves the label", { size: 11.5, fill: C.vioT });
      b += t(240, 232, "y = 0.1 + 0.2: floats are binary approximations", { size: 12.5, fill: C.dim });
      return svg(480, 250, b, "Variables as labels pointing at typed values");
    },
    caption: "A name points at a value. Rebinding moves the arrow; the type belongs to the value.",
    ix: el => choice(el, { label: "Is it truthy?", options: TRUTH.map(r => r[0]), value: 0 }, i => {
      const [v, tr] = TRUTH[i];
      let b = box(20, 20, 160, 50, v, "the value", "plain", { mono: true });
      b += arrow(182, 45, 228, 45, { label: "bool()" });
      b += box(232, 20, 228, 50, tr ? "True" : "False", tr ? "runs the if-block" : "skips the if-block", tr ? "good" : "bad", { mono: true });
      b += t(240, 100, "Falsy: 0, 0.0, '', [], {}, set(), None, False", { size: 12.5, fill: C.dim, mono: true });
      b += t(240, 120, "Everything else is truthy.", { size: 12.5, fill: C.dim });
      const notes = { '"0"': "A string holding the character 0 is not empty, so it is truthy. Check <code>s == '0'</code> if that is what you mean.", "[0]": "A list with one item is not empty, even if the item is 0.", "0.0": "Zero of any numeric type is falsy.", "None": "Use <code>x is None</code> when you mean \"missing\", because <code>if not x</code> also catches 0 and ''." };
      return { svg: svg(480, 136, b, "Truthiness of a value"), note: notes[v] || (tr ? "Non-zero numbers and non-empty containers are truthy." : "Zero and empty containers are falsy.") };
    }),
    oneline: "Every Python value has a type, and a variable is just a name tag pointing at one.",
  };

  /* ---------------------------------------------------------------- py-collections */
  P["py-collections"] = {
    simple: [
      "A **collection** holds many values in one variable. Python has four built in, and picking the right one makes code faster and clearer.",
      "A **list** `[ ]` keeps order and can change. A **tuple** `( )` keeps order but is fixed once made. A **dict** `{key: value}` finds a value by its key. A **set** `{ }` holds unique values with no order.",
      "Dicts and sets use **hashing**, so checking `x in s` takes about the same time for 10 items or 10 million. A list has to look at items one by one.",
    ],
    analogy: {
      text: "Think of four ways to store things at home.",
      left: "At home", right: "Collection",
      map: [
        ["A shopping list you can add to and cross off", "list: ordered, changeable"],
        ["Your date of birth printed on an ID card", "tuple: ordered, fixed"],
        ["A phone's contacts: look up by name", "dict: key to value"],
        ["A guest list where nobody appears twice", "set: unique members"],
        ["Contacts jump straight to \"Ria\"", "Hash lookup: no scanning"],
      ],
      breaks: "a phone sorts contacts alphabetically; a dict doesn't sort keys. Since Python 3.7 a dict keeps the order you inserted keys, which is different from sorted order.",
    },
    svg: () => {
      let b = t(240, 22, "Same question, \"is 'om' in it?\"", { bold: true, size: 14 });
      b += t(20, 52, "list: check one by one", { a: "start", size: 12.5, fill: C.badT, bold: true });
      ["ria", "jay", "eli", "om"].forEach((v, i) => { b += box(20 + i * 70, 62, 62, 32, v, null, i === 3 ? "good" : "plain", { mono: true, size: 13 }); if (i < 3) b += arrow(84 + i * 70, 78, 88 + i * 70, 78); });
      b += t(316, 84, "4 checks", { a: "start", size: 12.5, fill: C.dim });
      b += t(20, 128, "set / dict: hash the key, jump to its slot", { a: "start", size: 12.5, fill: C.goodT, bold: true });
      b += box(20, 140, 90, 34, "hash('om')", null, "acc", { mono: true, size: 12 });
      b += arrow(112, 157, 160, 157, { label: "slot 2" });
      [0, 1, 2, 3].forEach(i => { b += box(166 + i * 70, 140, 62, 34, i === 2 ? "om" : ["ria", "", "", "jay"][i], "slot " + i, i === 2 ? "good" : "ghost", { mono: true, size: 12, size2: 10 }); });
      b += t(240, 206, "1 check, whatever the size", { size: 12.5, fill: C.dim });
      b += t(240, 228, "Average O(1) for sets and dicts, O(n) for lists", { size: 12.5, fill: C.dim });
      return svg(480, 244, b, "Membership test: list scans, set hashes");
    },
    caption: "A list scans until it finds the item; a set or dict hashes the item and goes straight to its slot.",
    ix: el => slider(el, { label: "Items in the collection", min: 1, max: 7, value: 3, fmt: v => (10 ** v).toLocaleString("en-US") }, v => {
      const n = 10 ** v, worst = n, bw = 400;
      let b = t(20, 30, "list: worst case checks", { a: "start", size: 12.5, fill: C.badT, bold: true });
      const lw = Math.max(6, bw * v / 7);
      b += `<rect x="20" y="40" width="${lw}" height="26" rx="4" style="fill:${C.bad};stroke:${C.badS}"/>`;
      b += t(20, 86, worst.toLocaleString("en-US") + " comparisons", { a: "start", size: 12.5, fill: C.tx, mono: true });
      b += t(20, 120, "set: checks", { a: "start", size: 12.5, fill: C.goodT, bold: true });
      b += `<rect x="20" y="130" width="6" height="26" rx="3" style="fill:${C.good};stroke:${C.goodS}"/>`;
      b += t(20, 176, "about 1 hash + 1 compare", { a: "start", size: 12.5, fill: C.tx, mono: true });
      b += t(460, 200, "bar length is on a log scale", { a: "end", size: 11, fill: C.faint });
      return { svg: svg(480, 212, b, "List vs set lookup cost"), note: v >= 5 ? "At this size, dedupe or lookup in a loop over a list becomes the slowest part of a pipeline. Build a set once, then test against it." : "Small lists are fine. The gap grows with every extra item." };
    }),
    oneline: "Lists keep order, tuples stay fixed, dicts look things up by key, and sets keep only unique items.",
  };

  /* ---------------------------------------------------------------- py-functions-loops */
  P["py-functions-loops"] = {
    simple: [
      "A **loop** repeats a block of code so you don't write it a thousand times.",
      "A **for** loop goes through each item of something: a list, a file, a `range(5)`. A **while** loop keeps going as long as a condition is true, so you must make sure it becomes false.",
      "`break` leaves the loop early. `continue` skips to the next item. `enumerate` gives you a counter, and `zip` walks two lists side by side.",
    ],
    analogy: {
      text: "Think of a teacher marking a pile of exam papers.",
      left: "Marking papers", right: "Loop",
      map: [
        ["Take the next paper off the pile", "`for paper in pile:`"],
        ["A blank paper: skip it", "`continue`"],
        ["Found a cheat sheet: stop marking", "`break`"],
        ["\"Keep marking until the bell rings\"", "`while not bell:`"],
        ["Writing 1, 2, 3 on each paper", "`enumerate(pile, start=1)`"],
      ],
      breaks: "a teacher notices a pile that never shrinks. A `while` loop whose condition never turns false runs forever, and nothing warns you.",
    },
    svg: () => {
      let b = t(240, 22, "for row in rows:", { bold: true, size: 14, mono: true });
      b += box(170, 36, 140, 36, "next item?", null, "acc");
      b += arrow(240, 72, 240, 94, { label: "yes", dx: 18, dy: 4 });
      b += box(140, 96, 200, 36, "if bad: continue", null, "warn", { mono: true, size: 13 });
      b += arrow(240, 132, 240, 152);
      b += box(140, 154, 200, 36, "if stop: break", null, "bad", { mono: true, size: 13 });
      b += arrow(240, 190, 240, 210);
      b += box(140, 212, 200, 36, "process(row)", null, "plain", { mono: true, size: 13 });
      b += line(140, 230, 100, 230); b += line(100, 230, 100, 54); b += arrow(100, 54, 168, 54);
      b += line(140, 114, 116, 114, { stroke: C.warnS }); b += t(70, 110, "continue", { size: 11.5, fill: C.warnT });
      b += line(312, 54, 400, 54); b += arrow(400, 54, 400, 262, { label: "no more", dx: 30 });
      b += line(340, 172, 380, 172, { stroke: C.badS }); b += arrow(380, 172, 396, 172, { stroke: C.badS }); b += t(360, 164, "break", { size: 11.5, fill: C.badT });
      b += box(330, 264, 140, 30, "after the loop", null, "good", { size: 13 });
      return svg(480, 306, b, "Control flow of a for loop with continue and break");
    },
    caption: "continue jumps back to fetch the next item; break leaves the loop at once.",
    oneline: "A loop repeats work for each item, and break and continue let you leave early or skip one.",
  };

  /* ---------------------------------------------------------------- py-functions */
  P["py-functions"] = {
    simple: [
      "A **function** is a named recipe: you write the steps once and use them many times by calling its name.",
      "You give it inputs called **parameters**, and it hands back a result with `return`. Without `return` it gives back `None`.",
      "Names made inside a function are **local**: they exist only while it runs. That keeps one function from tripping over another's variables.",
    ],
    analogy: {
      text: "Think of a juice machine at a shop.",
      left: "Juice machine", right: "Function",
      map: [
        ["Its name: \"orange press\"", "`def press(fruit, size='M'):`"],
        ["Fruit you put in", "Arguments"],
        ["Medium cup unless you ask", "Default parameter"],
        ["Juice that comes out", "`return` value"],
        ["Pulp stays inside the machine", "Local variables vanish after the call"],
      ],
      breaks: "a machine always makes a fresh cup. A default like `def f(x, seen=[])` is created once and shared by every call, so items pile up. Use `seen=None` and create the list inside.",
    },
    svg: () => {
      let b = t(240, 22, "total = add_tax(100, rate=0.18)", { bold: true, size: 13.5, mono: true });
      b += box(20, 50, 110, 50, "100", "price", "acc", { mono: true });
      b += box(20, 116, 110, 50, "0.18", "rate", "acc", { mono: true });
      b += arrow(132, 75, 170, 100); b += arrow(132, 141, 170, 120);
      b += `<rect x="172" y="44" width="170" height="130" rx="10" style="fill:none;stroke:${C.vioS};stroke-width:1.6;stroke-dasharray:5 4"/>`;
      b += t(257, 64, "local scope", { size: 12, fill: C.vioT, bold: true });
      b += box(184, 76, 146, 36, "tax = price*rate", null, "plain", { mono: true, size: 12 });
      b += box(184, 124, 146, 36, "return price+tax", null, "vio", { mono: true, size: 12 });
      b += arrow(344, 142, 382, 142);
      b += box(386, 118, 80, 48, "118.0", "total", "good", { mono: true });
      b += t(240, 204, "tax exists only during the call.", { size: 12.5, fill: C.dim });
      b += t(240, 224, "Inputs in, one value out, nothing leaks.", { size: 12.5, fill: C.dim });
      return svg(480, 240, b, "Arguments flow into a function's local scope and a return value comes out");
    },
    caption: "Arguments enter the function's own scope; only the returned value comes back out.",
    oneline: "A function is a named recipe: give it inputs, it does the steps, and it returns a result.",
  };

  /* ---------------------------------------------------------------- py-lambdas */
  const PEOPLE = [["Ria", 31], ["Om", 24], ["Jay", 45], ["Eli", 28]];
  P["py-lambdas"] = {
    simple: [
      "A **lambda** is a tiny function with no name, written on one line: `lambda x: x * 2`.",
      "It can hold only one expression, and that expression's value is returned. No loops, no statements, no `return` keyword.",
      "Its best use is as a quick rule passed to another function, like telling `sorted` what to sort by: `sorted(rows, key=lambda r: r['age'])`.",
    ],
    analogy: {
      text: "Think of a sticky note you hand to a helper sorting a stack of forms.",
      left: "Sorting forms", right: "lambda as a sort key",
      map: [
        ["The helper who does the sorting", "`sorted()`"],
        ["Sticky note: \"look at the age box\"", "`key=lambda r: r[1]`"],
        ["You don't file the note away with a name", "Anonymous: no `def`"],
        ["Throw the note away after", "Used once, inline"],
      ],
      breaks: "a note is read when you hand it over. A lambda reads outside variables when it runs, not when it is made. Lambdas made in a loop all see the loop's last value unless you bind it: `lambda x, n=n: x + n`.",
    },
    svg: () => {
      let b = t(240, 22, "sorted(people, key=lambda p: p[1])", { bold: true, size: 13, mono: true });
      b += table(20, 44, ["name", "age"], PEOPLE, { cw: [80, 60], rh: 28 });
      b += arrow(164, 100, 196, 100);
      b += box(200, 74, 110, 52, "key(p)", "p -> p[1]", "vio", { mono: true, mono2: true });
      b += arrow(314, 100, 334, 100);
      const s = PEOPLE.slice().sort((a, c) => a[1] - c[1]);
      b += table(338, 44, ["name", "age"], s.map(r => [r[0], String(r[1])]), { cw: [70, 52], rh: 28, hl: { 0: "good" } });
      b += t(240, 210, "The lambda maps each row to the value to compare.", { size: 12.5, fill: C.dim });
      return svg(480, 226, b, "A lambda used as a sort key");
    },
    caption: "sorted calls the lambda on every row and orders the rows by what it returns.",
    ix: el => {
      const keys = [["p[1]", (a, c) => a[1] - c[1]], ["-p[1]", (a, c) => c[1] - a[1]], ["p[0]", (a, c) => a[0].localeCompare(c[0])], ["len(p[0])", (a, c) => a[0].length - c[0].length]];
      choice(el, { label: "key=lambda p:", options: keys.map(k => k[0]), value: 2 }, i => {
        const s = PEOPLE.slice().sort(keys[i][1]);
        let b = t(240, 24, "sorted(people, key=lambda p: " + keys[i][0] + ")", { mono: true, size: 12.5 });
        b += table(140, 40, ["name", "age"], s.map(r => [r[0], String(r[1])]), { cw: [110, 90], rh: 28, hl: { 0: "good" } });
        return { svg: svg(480, 190, b, "Sorted result"), note: i === 3 ? "Om, then three 3-letter names. <code>sorted</code> is <b>stable</b>: ties keep their original order (Ria, Jay, Eli)." : i === 1 ? "Negating the key sorts descending. <code>reverse=True</code> does the same and works for strings too." : "The rows come out in the order of the values the lambda returns." };
      });
    },
    oneline: "A lambda is a one-line, nameless function, handy as a quick rule like a sort key.",
  };

  /* ---------------------------------------------------------------- py-files-apis */
  P["py-files-apis"] = {
    simple: [
      "Pipelines read and write files all day. Python's `open()` gives you a **file object** to read from or write to.",
      "Always open files with `with open(path, encoding='utf-8') as f:`. The `with` block closes the file for you, even if an error happens halfway.",
      "Read big files **line by line** (`for line in f:`). Python then holds one line in memory at a time, so a 50 GB log works on a laptop.",
    ],
    analogy: {
      text: "Think of borrowing a book from a library.",
      left: "Library book", right: "File I/O",
      map: [
        ["Check the book out", "`open()`"],
        ["Read one page at a time", "`for line in f:` streaming"],
        ["Photocopy the whole book first", "`f.read()`: everything in memory"],
        ["Self-return box that always takes it back", "`with` closes the file"],
        ["The book is in Hindi, not English", "`encoding=` must match the bytes"],
      ],
      breaks: "a library book is either out or in. Writes to a file are buffered, so another program may not see your data until the file is flushed or closed.",
    },
    svg: () => {
      let b = t(240, 22, "Streaming a 50 GB file with constant memory", { bold: true, size: 14 });
      b += box(20, 44, 110, 150, "disk", "50 GB log", "plain");
      for (let i = 0; i < 6; i++) b += line(30, 120 + i * 10, 120, 120 + i * 10, { stroke: C.boxS });
      b += arrow(132, 90, 186, 90, { label: "1 line" });
      b += box(190, 60, 120, 60, "for line in f:", "one line in RAM", "acc", { mono: true, size: 12.5 });
      b += arrow(312, 90, 352, 90);
      b += box(356, 60, 110, 60, "write out", "or count", "good");
      b += box(190, 144, 276, 50, "f.read() would need 50 GB of RAM", null, "bad", { size: 12.5 });
      b += t(240, 222, "with ... as f: closes the file even after an error", { size: 12.5, fill: C.dim });
      return svg(480, 238, b, "Line-by-line file streaming versus reading everything into memory");
    },
    caption: "Iterating over a file pulls one line at a time; f.read() loads the whole file into memory.",
    oneline: "Open files with `with`, name the encoding, and stream big files line by line.",
  };

  /* ---------------------------------------------------------------- py-comprehensions */
  P["py-comprehensions"] = {
    simple: [
      "A **comprehension** builds a new list, dict or set from an old one in a single line.",
      "Read `[x * 2 for x in nums if x > 0]` as: \"for each x in nums, if x is above 0, keep x times 2\".",
      "Use round brackets instead, `(x * 2 for x in nums)`, and you get a **generator** that makes values one at a time instead of building the whole list in memory.",
    ],
    analogy: {
      text: "Think of a fruit sorting belt at a juice factory.",
      left: "Fruit belt", right: "Comprehension part",
      map: [
        ["Fruit arriving on the belt", "`for x in nums`"],
        ["A worker throws out the bruised ones", "`if x > 0`"],
        ["A machine peels each kept fruit", "`x * 2` (the expression)"],
        ["The basket at the end", "`[ ]` list, `{ }` set or dict"],
        ["A tap that pours juice only when you hold a cup", "`( )` generator"],
      ],
      breaks: "the belt order on the page is backwards: the expression is written first even though it runs last. If a comprehension needs more than one `for` and one `if`, a normal loop is easier to read.",
    },
    svg: () => {
      let b = t(240, 22, "[x * 2 for x in nums if x > 0]", { bold: true, size: 14, mono: true });
      b += table(20, 46, ["nums"], [["3"], ["-1"], ["5"], ["0"]], { cw: [70], rh: 28, strike: { 1: true, 3: true } });
      b += arrow(94, 102, 136, 102);
      b += box(140, 78, 120, 48, "if x > 0", "filter", "warn", { mono: true });
      b += arrow(262, 102, 296, 102);
      b += box(300, 78, 80, 48, "x * 2", "map", "acc", { mono: true });
      b += arrow(382, 102, 400, 102);
      b += table(404, 60, ["out"], [["6"], ["10"]], { cw: [60], rh: 28, hl: { 0: "good", 1: "good" } });
      b += badge(55, 190, 1); b += t(75, 195, "iterate", { a: "start", size: 12.5, fill: C.dim });
      b += badge(200, 190, 2); b += t(220, 195, "filter", { a: "start", size: 12.5, fill: C.dim });
      b += badge(340, 190, 3); b += t(360, 195, "transform", { a: "start", size: 12.5, fill: C.dim });
      return svg(480, 214, b, "List comprehension as iterate, filter, transform");
    },
    caption: "Each item passes the filter, then the expression, then lands in the new list.",
    oneline: "A comprehension is a one-line loop that filters and transforms items into a new collection.",
  };

  /* ---------------------------------------------------------------- py-strings-format */
  P["py-strings-format"] = {
    simple: [
      "A **string** is text: a sequence of characters like `'Hyderabad'`. Each character has a position, starting at 0.",
      "Strings are **immutable**: methods like `.upper()` or `.strip()` return a new string and leave the old one as it was.",
      "**f-strings** put values into text: `f\"{city} has {n:,} rows\"` gives `Hyderabad has 1,200 rows`.",
    ],
    analogy: {
      text: "Think of a row of letter beads on a string.",
      left: "Bead necklace", right: "Python string",
      map: [
        ["Bead 0, bead 1, bead 2 ...", "Index `s[0]`, `s[1]`"],
        ["Counting from the clasp at the far end", "Negative index `s[-1]`"],
        ["Cutting out beads 2 to 4", "Slice `s[2:5]` (stop is excluded)"],
        ["Can't swap a bead; you thread a new necklace", "Immutable: methods return new strings"],
      ],
      breaks: "a bead is one letter, but some \"letters\" on screen are more than one character, like emoji with skin tones. `len()` counts code points, not what you see.",
    },
    svg: () => {
      let b = t(240, 22, "s = 'PYTHON'", { bold: true, size: 14, mono: true });
      "PYTHON".split("").forEach((ch, i) => {
        const x = 60 + i * 60, sel = i >= 1 && i < 4;
        b += box(x, 50, 52, 44, ch, null, sel ? "acc" : "plain", { mono: true, size: 18 });
        b += t(x + 26, 114, String(i), { size: 12.5, fill: C.goodT, mono: true });
        b += t(x + 26, 40, String(i - 6), { size: 11.5, fill: C.faint, mono: true });
      });
      b += t(30, 114, "index", { size: 11.5, fill: C.goodT, a: "middle" });
      b += t(30, 40, "neg", { size: 11.5, fill: C.faint });
      b += t(240, 150, "s[1:4]  ->  'YTH'   (start included, stop excluded)", { size: 13, mono: true, fill: C.accT });
      b += t(240, 176, "s[-1]  ->  'N'      s[::-1]  ->  'NOHTYP'", { size: 13, mono: true, fill: C.tx });
      b += t(240, 206, "s.lower() returns a new string; s is unchanged.", { size: 12.5, fill: C.dim });
      return svg(480, 222, b, "String indexing and slicing");
    },
    caption: "Positions count from 0 on the left and from -1 on the right; a slice includes start and stops before stop.",
    oneline: "A string is a fixed row of characters you can index, slice and turn into new strings.",
  };

  /* ---------------------------------------------------------------- py-errors */
  const PATHS = ["no error", "ValueError", "TypeError"];
  P["py-errors"] = {
    simple: [
      "When Python hits a problem, like turning `'abc'` into a number, it **raises an exception** and stops.",
      "Wrap risky code in `try:`. If a matching error happens, the `except` block runs instead of crashing. `else` runs only when no error happened, and `finally` runs every time.",
      "Catch the specific errors you expect. A bare `except:` also hides real bugs, so a broken pipeline looks like a working one.",
    ],
    analogy: {
      text: "Think of a trapeze artist with a safety net.",
      left: "Circus act", right: "try / except",
      map: [
        ["The trick itself", "`try:` block"],
        ["The net that catches a fall", "`except ValueError:`"],
        ["Bow to the crowd if no fall", "`else:`"],
        ["Pack up the ropes, fall or not", "`finally:` (close files, connections)"],
        ["A net only under the swing, not the cannon", "Each `except` catches only its type"],
      ],
      breaks: "a net catches you only in this tent. An exception not caught here travels up to whoever called this function, and up again, until something catches it or the program stops.",
    },
    svg: () => P["py-errors"]._fig(1),
    _fig: i => {
      const run = { 0: [1, 0, 0, 1, 1], 1: [1, 1, 0, 0, 1], 2: [1, 0, 0, 0, 1] }[i];
      const rows = [["try:", "qty = int(rec['qty'])"], ["except ValueError:", "log bad number"], ["except KeyError:", "log missing field"], ["else:", "save(qty)"], ["finally:", "conn.close()"]];
      let b = "";
      rows.forEach(([k, v], j) => {
        const y = 16 + j * 44, on = run[j], kind = !on ? "ghost" : j === 0 && i === 2 ? "bad" : j === 1 && i === 1 ? "warn" : j === 4 ? "vio" : "good";
        b += box(20, y, 190, 36, k, null, kind, { mono: true, size: 13 });
        b += t(224, y + 23, v, { a: "start", size: 12.5, mono: true, fill: on ? C.tx : C.faint });
      });
      b += i === 2 ? box(20, 240, 446, 40, "TypeError: no except matches", "finally runs, then the error goes up to the caller", "bad", { size: 13, size2: 11.5 }) : box(20, 240, 446, 40, i ? "Handled: the pipeline carries on" : "Clean run", null, "good", { size: 13 });
      return svg(480, 292, b, "Which blocks of try/except/else/finally run");
    },
    caption: "On a ValueError the except block runs and else is skipped; finally runs on every path.",
    ix: el => choice(el, { label: "What happens inside try?", options: PATHS, value: 0 }, i => ({
      svg: P["py-errors"]._fig(i),
      note: ["try succeeds, so <b>else</b> runs, then <b>finally</b>.", "qty is 'abc', so int() raises ValueError: the matching <b>except</b> runs, else is skipped, <b>finally</b> still runs.", "rec['qty'] is None, so int() raises TypeError. Neither except matches: <b>finally</b> runs, then the error keeps travelling up to the caller."][i],
    })),
    oneline: "try runs risky code, except catches the errors you expect, and finally always cleans up.",
  };

  /* ---------------------------------------------------------------- py-json-csv */
  P["py-json-csv"] = {
    simple: [
      "**CSV** (comma-separated values) is a table in plain text: one row per line, commas between columns. **JSON** (JavaScript Object Notation) is text for nested data: objects with keys, lists inside lists.",
      "Python's built-in `csv` and `json` modules read both into lists and dicts. `json.loads` turns text into Python objects; `json.dumps` goes back.",
      "Both are text, so every value arrives as a string or a few simple types. Dates, decimals and types are your job to check.",
    ],
    analogy: {
      text: "Think of a class register and a family tree.",
      left: "Paper records", right: "File format",
      map: [
        ["Class register: same columns for every pupil", "CSV: flat rows"],
        ["Family tree: children inside parents", "JSON: nesting"],
        ["Column titles at the top of the register", "CSV header row"],
        ["A name with a comma, like \"Rao, Om\"", "CSV quoting: `\"Rao, Om\"`"],
      ],
      breaks: "a register shows numbers as numbers. CSV has no types at all: `007` and `7` are different strings, and only your code decides which one is right.",
    },
    svg: () => {
      let b = t(120, 24, "orders.csv", { bold: true, size: 13.5, mono: true });
      b += box(16, 34, 210, 92, null, null, "plain");
      ["id,city,amount", "1,Pune,450", '2,"Rao, Om",90'].forEach((l, i) => { b += t(26, 58 + i * 24, l, { a: "start", mono: true, size: 12.5, fill: i ? C.tx : C.accT }); });
      b += t(360, 24, "order.json", { bold: true, size: 13.5, mono: true });
      b += box(246, 34, 220, 92, null, null, "plain");
      ['{"id": 1,', ' "items": [{"sku": "A1"},', '           {"sku": "B2"}]}'].forEach((l, i) => { b += t(254, 58 + i * 24, l, { a: "start", mono: true, size: 11.5 }); });
      b += arrow(120, 128, 120, 160, { label: "csv.DictReader", dx: 54, dy: 4 });
      b += arrow(356, 128, 356, 160, { label: "json.load", dx: 40, dy: 4 });
      b += box(16, 164, 210, 46, "{'id': '1', ...}", "every value is a str", "warn", { mono: true, size: 12 });
      b += box(246, 164, 220, 46, "{'id': 1, 'items': [...]}", "int, list, dict kept", "good", { mono: true, size: 12 });
      return svg(480, 224, b, "Reading CSV and JSON into Python objects");
    },
    caption: "CSV gives flat rows of strings; JSON keeps nesting and a few basic types.",
    oneline: "CSV is a flat text table and JSON is nested text, and Python's csv and json modules read both.",
  };

  /* ---------------------------------------------------------------- py-dates */
  P["py-dates"] = {
    simple: [
      "The `datetime` module handles dates and times. `datetime.now(timezone.utc)` is the current moment in UTC (Coordinated Universal Time, the world's reference clock).",
      "A datetime with no time zone attached is **naive**: Python can't know which country's 9 a.m. it means. One with a zone is **aware**.",
      "Store and compare times in UTC, and convert to a local zone only when showing them to people.",
    ],
    analogy: {
      text: "Think of one football match watched live in three countries.",
      left: "Live match", right: "datetime",
      map: [
        ["The kick-off moment itself", "One instant, stored in UTC"],
        ["Clock on the wall in Delhi, London, New York", "The same instant in different zones"],
        ["\"It starts at 8\" with no city named", "A naive datetime"],
        ["Clocks jumping an hour in March", "Daylight saving time (DST) rules"],
      ],
      breaks: "the match happens once, but India has no daylight saving and New York does, so the gap between them changes during the year. Use `zoneinfo` zone names, not fixed offsets.",
    },
    svg: () => P["py-dates"]._fig(20),
    _fig: h => {
      const zones = [["UTC", 0, "acc"], ["Asia/Kolkata", 5.5, "good"], ["America/New_York", -5, "warn"]];
      let b = t(240, 22, "One instant: 15 Jan 2026, " + String(h).padStart(2, "0") + ":00 UTC", { bold: true, size: 13.5 });
      zones.forEach(([z, off, k], i) => {
        const y = 40 + i * 58;
        let m = h * 60 + off * 60, day = 15;
        if (m < 0) { m += 1440; day = 14; } if (m >= 1440) { m -= 1440; day = 16; }
        const hh = String(Math.floor(m / 60)).padStart(2, "0"), mm = String(m % 60).padStart(2, "0");
        b += box(20, y, 190, 46, z, (off >= 0 ? "UTC+" : "UTC") + off.toString().replace(".5", ":30"), k, { mono: true, size: 13 });
        b += arrow(212, y + 23, 252, y + 23);
        b += box(256, y, 210, 46, day + " Jan  " + hh + ":" + mm, day !== 15 ? "different calendar day" : "same day", "plain", { mono: true });
      });
      b += t(240, 228, "New York is UTC-5 in January (EST), UTC-4 in summer (EDT).", { size: 12, fill: C.dim });
      return svg(480, 244, b, "One UTC instant shown in three time zones");
    },
    caption: "The stored instant never changes; only how each zone displays it does.",
    ix: el => slider(el, { label: "Hour in UTC", min: 0, max: 23, value: 14, fmt: v => String(v).padStart(2, "0") + ":00" }, h => ({
      svg: P["py-dates"]._fig(h),
      note: h >= 19 ? "In India it is already the next day. Daily partitions cut on local dates and on UTC dates hold different rows." : h < 5 ? "In New York it is still the previous day." : "All three zones agree on the date at this hour.",
    })),
    oneline: "Store times in UTC with the zone attached, and convert to local time only for display.",
  };

  /* ---------------------------------------------------------------- py-iterators-generators */
  P["py-iterators-generators"] = {
    simple: [
      "An **iterator** hands out items one at a time when asked with `next()`. A `for` loop just keeps asking until it is told \"no more\".",
      "A **generator** is the easy way to write one: a function that uses `yield` instead of `return`. Each `yield` hands out one item and pauses the function until the next request.",
      "Because items are made on demand, a generator can walk a billion rows while holding only one in memory.",
    ],
    analogy: {
      text: "Think of a tap versus a filled water tank.",
      left: "Water", right: "Python",
      map: [
        ["A tank filled up before you drink", "A list: everything built first"],
        ["A tap: water flows only while you hold the glass", "A generator: values made on request"],
        ["Turning the tap on for one more glass", "`next(gen)`"],
        ["The tap pauses between glasses", "`yield` pauses the function"],
        ["The source runs dry", "`StopIteration`; the loop ends"],
      ],
      breaks: "you can turn a tap on again tomorrow. A generator runs once: after it is used up, looping over it again gives nothing. Make a new one if you need a second pass.",
    },
    svg: () => {
      let b = t(240, 22, "def read_rows(f):  for line in f:  yield parse(line)", { bold: true, size: 11.5, mono: true });
      b += box(20, 48, 120, 46, "for row in gen", "asks next()", "acc", { mono: true, size: 12 });
      b += box(320, 48, 146, 46, "generator", "runs to next yield", "vio");
      b += arrow(142, 62, 318, 62, { label: "next()" });
      b += arrow(318, 82, 142, 82, { label: "one row", dy: 16, stroke: C.goodS });
      b += box(320, 120, 146, 40, "paused at yield", null, "ghost", { size: 12.5 });
      b += arrow(393, 96, 393, 118);
      b += t(240, 192, "Memory: 1 row at a time, not the whole file", { size: 12.5, fill: C.goodT, bold: true });
      b += t(240, 214, "After the last row it raises StopIteration.", { size: 12.5, fill: C.dim });
      return svg(480, 230, b, "A for loop pulling values from a paused generator");
    },
    caption: "Each next() wakes the generator, which runs to its next yield, hands back one value and pauses.",
    ix: el => slider(el, { label: "Rows to process", min: 3, max: 9, value: 6, fmt: v => "10^" + v }, v => {
      const rows = 10 ** v, bytes = 200, listMB = rows * bytes / 1e6;
      const fmtB = x => x >= 1e6 ? (x / 1e6).toFixed(0) + " TB" : x >= 1e3 ? (x / 1e3).toFixed(1) + " GB" : x.toFixed(1) + " MB";
      let b = t(20, 28, "list of rows (about 200 bytes each)", { a: "start", size: 12.5, fill: C.badT, bold: true });
      b += `<rect x="20" y="38" width="${Math.max(6, 440 * (v - 2) / 7)}" height="26" rx="4" style="fill:${C.bad};stroke:${C.badS}"/>`;
      b += t(20, 84, fmtB(listMB) + " held at once", { a: "start", size: 12.5, mono: true });
      b += t(20, 118, "generator", { a: "start", size: 12.5, fill: C.goodT, bold: true });
      b += `<rect x="20" y="128" width="6" height="26" rx="3" style="fill:${C.good};stroke:${C.goodS}"/>`;
      b += t(20, 174, "about 200 bytes per row in flight", { a: "start", size: 12.5, mono: true });
      b += t(460, 196, "bar length on a log scale; real Python objects cost more", { a: "end", size: 11, fill: C.faint });
      return { svg: svg(480, 208, b, "List versus generator memory"), note: listMB > 16000 ? "That list would not fit in a 16 GB laptop's memory. The generator would still run." : "Fine as a list at this size, but the generator's memory stays flat as rows grow." };
    }),
    oneline: "A generator makes items one at a time when asked, so it can stream data far bigger than memory.",
  };

  /* ---------------------------------------------------------------- py-functional */
  P["py-functional"] = {
    simple: [
      "**Functional** style means building work out of functions that take data in and return new data, without changing anything outside.",
      "`map(f, items)` applies `f` to every item. `filter(test, items)` keeps items that pass. `functools.reduce(f, items)` folds items into one value, like a running total.",
      "A **higher-order function** is one that takes or returns another function. `sorted(key=...)` and decorators are everyday examples.",
    ],
    analogy: {
      text: "Think of an assembly line in a toy factory.",
      left: "Toy factory", right: "Functional tool",
      map: [
        ["A painting station that paints every toy", "`map`"],
        ["An inspector who removes broken toys", "`filter`"],
        ["Packing all toys into one box, one by one", "`reduce`"],
        ["Swapping in a different paint station", "Passing a different function"],
      ],
      breaks: "a factory line can't go back. In Python 3, `map` and `filter` return lazy iterators, so the work happens only when something reads them, and only once.",
    },
    svg: () => {
      let b = t(240, 22, "reduce(add, map(sq, filter(is_even, [1..6])))", { bold: true, size: 12, mono: true });
      const st = [["[1,2,3,4,5,6]", "input", "plain"], ["[2,4,6]", "filter even", "warn"], ["[4,16,36]", "map square", "acc"], ["56", "reduce +", "good"]];
      st.forEach(([v, l, k], i) => {
        const y = 40 + i * 50;
        b += box(130, y, 220, 38, v, l, k, { mono: true, size: 13 });
        if (i < 3) b += arrow(240, y + 38, 240, y + 50);
      });
      b += t(240, 252, "Each step returns new data; nothing is changed in place.", { size: 12.5, fill: C.dim });
      return svg(480, 266, b, "filter, map and reduce as a pipeline");
    },
    caption: "filter drops odd numbers, map squares the rest, reduce adds them into one value.",
    oneline: "map changes every item, filter keeps some, and reduce folds them all into one answer.",
  };
})();
