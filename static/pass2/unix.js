/* Datalith pass 2 — Track 8: Unix & the shell. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- unix-intro */
  P["unix-intro"] = {
    simple: [
      "The **shell** is a program that reads commands you type and runs them. On Linux and Mac it is usually **bash** or **zsh**. Servers, containers and cloud machines are run this way, often with no screen at all.",
      "Files sit in one big tree that starts at `/` (the **root**). `pwd` shows where you are, `ls` lists what's here, and `cd` moves you.",
      "A path starting with `/` is **absolute** (from the root). Any other path is **relative** to where you are now. `..` means the folder above, `~` means your home folder.",
    ],
    analogy: {
      text: "Think of a big building with floors, rooms and cupboards.",
      left: "Building", right: "Filesystem",
      map: [
        ["The front entrance", "`/` the root"],
        ["Your own office", "`~` your home folder"],
        ["\"Where am I?\" on the floor map", "`pwd`"],
        ["Looking around the room", "`ls`"],
        ["Walking to another room", "`cd /data/raw`"],
        ["\"Go up one floor\"", "`cd ..`"],
      ],
      breaks: "a building has one way to each room. In Unix a file can also be reached through links (`ln -s`), so two paths can point to the same data.",
    },
    svg: () => {
      let b = t(240, 22, "The filesystem is one tree from /", { bold: true, size: 14 });
      b += box(200, 36, 80, 30, "/", null, "acc", { mono: true });
      const L1 = [["home", 40], ["data", 200], ["etc", 360]];
      L1.forEach(([n, x]) => { b += arrow(240, 66, x + 40, 90); b += box(x, 92, 80, 30, n, null, "plain", { mono: true, size: 13 }); });
      b += arrow(80, 122, 80, 144); b += box(30, 146, 100, 30, "ria", "~ for Ria", "vio", { mono: true, size: 12.5, size2: 10 });
      b += arrow(240, 122, 190, 146); b += arrow(240, 122, 290, 146);
      b += box(150, 148, 80, 30, "raw", null, "plain", { mono: true, size: 13 }); b += box(250, 148, 80, 30, "clean", null, "plain", { mono: true, size: 13 });
      b += arrow(190, 178, 190, 198); b += box(126, 200, 128, 30, "orders.csv", null, "good", { mono: true, size: 12.5 });
      b += t(240, 254, "absolute: /data/raw/orders.csv", { mono: true, size: 12.5, fill: C.goodT });
      b += t(240, 274, "from /data/clean, relative: ../raw/orders.csv", { mono: true, size: 12, fill: C.dim });
      return svg(480, 290, b, "Unix directory tree with absolute and relative paths");
    },
    caption: "Everything hangs off /. An absolute path starts there; a relative path starts where you are.",
    oneline: "The shell runs your typed commands, and every file lives somewhere in one tree that starts at /.",
  };

  /* ---------------------------------------------------------------- unix-pipes */
  const PIPE = [["cat access.log", ["GET /a 200", "GET /b 500", "GET /a 200", "GET /c 500", "GET /b 500"]], ["| grep ' 500'", ["GET /b 500", "GET /c 500", "GET /b 500"]], ["| awk '{print $2}'", ["/b", "/c", "/b"]], ["| sort", ["/b", "/b", "/c"]], ["| uniq -c", ["2 /b", "1 /c"]]];
  P["unix-pipes"] = {
    simple: [
      "Every program has three streams: **stdin** (input), **stdout** (normal output) and **stderr** (error messages).",
      "A **pipe** `|` connects one program's stdout to the next one's stdin, so small tools join into a chain: `cat log | grep 500 | sort | uniq -c`.",
      "**Redirection** sends streams to files: `> out.txt` overwrites, `>> out.txt` appends, `2> err.txt` captures errors, and `2>&1` merges errors into normal output.",
    ],
    analogy: {
      text: "Think of a water filter jug with several layers.",
      left: "Water filter", right: "Shell pipeline",
      map: [
        ["Water poured in at the top", "stdin of the first command"],
        ["Each filter layer", "One small command"],
        ["Water flowing from one layer to the next", "The `|` pipe"],
        ["The glass you fill", "`> result.txt`"],
        ["The overflow spout for dirt", "stderr, kept separate"],
      ],
      breaks: "water goes through layers one after another. Commands in a pipeline all run at the same time, each working on lines as they arrive, so a pipeline can start output before the input file is fully read.",
    },
    svg: () => P["unix-pipes"]._fig(4),
    _fig: k => {
      let b = t(240, 20, "Count server errors per page", { bold: true, size: 14 });
      PIPE.forEach(([c], i) => { b += box(10 + i * 94, 34, 88, 34, c.replace("| ", ""), null, i <= k ? "acc" : "ghost", { mono: true, size: c.length > 14 ? 7.8 : c.length > 12 ? 9 : 11 }); if (i < 4) b += arrow(98 + i * 94, 51, 104 + i * 94, 51, { sw: 1.4 }); });
      const out = PIPE[k][1];
      b += t(240, 94, "output after: " + PIPE.slice(0, k + 1).map(p => p[0].split(" ")[0] === "|" ? p[0].split(" ")[1] : p[0].split(" ")[0]).join(" | "), { size: 12, fill: C.dim, mono: true });
      out.forEach((l, j) => { b += box(130, 106 + j * 30, 220, 26, l, null, k === 4 ? "good" : "plain", { mono: true, size: 12.5, r: 4 }); });
      return svg(480, 106 + 5 * 30 + 12, b, "Data at each stage of a shell pipeline");
    },
    caption: "Each tool does one small job; the pipe hands its output straight to the next tool.",
    ix: el => choice(el, { label: "Show output after", options: ["cat", "grep", "awk", "sort", "uniq -c"], value: 0 }, i => ({
      svg: P["unix-pipes"]._fig(i),
      note: ["Five raw log lines.", "grep keeps only lines containing \" 500\".", "awk splits on spaces and prints field 2, the path.", "sort puts equal lines next to each other.", "uniq -c only merges <b>neighbouring</b> duplicates, which is why sort comes first."][i],
    })),
    oneline: "Pipes join small commands into a chain, and redirection sends their output into files.",
  };

  /* ---------------------------------------------------------------- unix-text */
  P["unix-text"] = {
    simple: [
      "Three tools handle most text work on the command line, even on files too big to open in an editor.",
      "**grep** finds lines that match a pattern. **sed** edits text as it streams past, for example replacing one word with another. **awk** splits each line into fields and lets you print, filter or add them up.",
      "`awk -F, '$3 > 1000 {s += $3} END {print s}' sales.csv` adds up column 3 for rows over 1,000, in one pass, using almost no memory.",
    ],
    analogy: {
      text: "Think of three helpers at a mail-sorting room.",
      left: "Mail room", right: "Text tool",
      map: [
        ["Pulls out every letter for Pune", "`grep Pune`"],
        ["Crosses out \"Bombay\" and writes \"Mumbai\" on each letter", "`sed 's/Bombay/Mumbai/g'`"],
        ["Reads the postcode box and tallies parcels", "`awk -F, '{print $4}'`"],
        ["They never keep the whole mail bag", "Streaming, line by line"],
      ],
      breaks: "the helpers read addresses, not meaning. `awk -F,` splits on every comma, so a quoted CSV field like \"Rao, Om\" breaks the columns. Use a real CSV tool (csvkit, DuckDB, Python) for quoted CSV.",
    },
    svg: () => {
      let b = t(240, 22, "sales.csv through grep, sed and awk", { bold: true, size: 14 });
      b += table(16, 40, ["line"], [["Pune,Bombay Rd,1200"], ["Goa,Main St,800"], ["Pune,Hill Rd,2500"]], { cw: [170], rh: 26, size: 11.5 });
      b += arrow(190, 92, 210, 92);
      b += box(214, 44, 120, 32, "grep '^Pune'", null, "acc", { mono: true, size: 11.5 });
      b += box(214, 82, 120, 32, "sed s/Rd/Road/", null, "vio", { mono: true, size: 11.5 });
      b += box(214, 120, 120, 32, "awk sum $3", null, "warn", { mono: true, size: 11.5 });
      b += arrow(336, 60, 356, 60); b += arrow(336, 98, 356, 98); b += arrow(336, 136, 356, 136);
      b += t(360, 64, "2 Pune lines", { a: "start", size: 11.5 });
      b += t(360, 102, "Bombay Road", { a: "start", size: 11.5, mono: true });
      b += t(360, 140, "3700", { a: "start", size: 12.5, mono: true, fill: C.goodT, bold: true });
      b += t(240, 188, "grep: find lines.  sed: change text.  awk: work with columns.", { size: 12.5, fill: C.dim });
      b += t(240, 210, "All three stream: a 50 GB file needs almost no RAM.", { size: 12.5, fill: C.dim });
      return svg(480, 226, b, "grep filters lines, sed edits text, awk works with fields");
    },
    caption: "grep picks lines, sed rewrites text, awk splits fields and calculates, all while streaming.",
    oneline: "grep finds lines, sed changes text, and awk works with columns, all streaming through huge files.",
  };

  /* ---------------------------------------------------------------- unix-permissions */
  const MODES = ["755", "644", "600", "750", "777"];
  const rwx = d => ["r", "w", "x"].map((c, i) => (d >> (2 - i)) & 1 ? c : "-").join("");
  P["unix-permissions"] = {
    simple: [
      "Every file has an **owner**, a **group**, and permissions for three kinds of people: the owner (**u**ser), the **g**roup, and everyone else (**o**thers).",
      "Each gets three switches: **r** read, **w** write, **x** execute (run it, or enter it if it's a folder). `ls -l` shows them as `rwxr-xr-x`.",
      "`chmod 640 file` sets them with digits: read is 4, write is 2, execute is 1, added up per person. `ps` and `top` show running **processes**; `kill` stops one.",
    ],
    analogy: {
      text: "Think of a house with keys for family, friends and strangers.",
      left: "House keys", right: "Permissions",
      map: [
        ["The owner who holds every key", "user (u)"],
        ["Family members", "group (g)"],
        ["Everyone on the street", "others (o)"],
        ["Look through the window / change the furniture / walk in", "r / w / x"],
        ["Changing who gets which key", "`chmod`, `chown`"],
      ],
      breaks: "a house has one owner. Unix also has root, the superuser, who can open any door whatever the permissions say; that's why jobs should not run as root.",
    },
    svg: () => P["unix-permissions"]._fig(0),
    _fig: i => {
      const m = MODES[i], ds = m.split("").map(Number);
      let b = t(240, 22, "chmod " + m + " load.sh   ->   -" + ds.map(rwx).join(""), { bold: true, size: 13.5, mono: true });
      [["user", "acc"], ["group", "vio"], ["others", "warn"]].forEach(([who, k], j) => {
        const x = 20 + j * 150;
        b += box(x, 40, 140, 30, who + "  =  " + ds[j], null, k, { size: 13 });
        ["r", "w", "x"].forEach((c, q) => {
          const on = (ds[j] >> (2 - q)) & 1;
          b += box(x + q * 47, 80, 42, 42, on ? c : "-", String([4, 2, 1][q]), on ? "good" : "ghost", { mono: true, size: 16, size2: 11 });
        });
      });
      const warn = m === "777" ? "Anyone can change this file. Never use 777 on scripts or credentials." : m === "600" ? "Only the owner can read it: right for keys and .env files." : m === "755" ? "Usual for scripts and folders: everyone runs, only the owner edits." : m === "644" ? "Usual for data files: everyone reads, only the owner writes." : "Owner edits and runs; the group can run; others get nothing.";
      b += box(20, 140, 440, 40, warn, null, m === "777" ? "bad" : "plain", { size: 12, bold: false });
      return svg(480, 194, b, "How octal permission digits map to rwx bits");
    },
    caption: "Each digit is the sum of r=4, w=2 and x=1 for one class of user.",
    ix: el => choice(el, { label: "chmod", options: MODES, value: 1 }, i => ({ svg: P["unix-permissions"]._fig(i), note: "Each digit adds 4 (read), 2 (write) and 1 (execute) for user, group, then others." })),
    oneline: "Each file says what its owner, group and everyone else may read, write or run.",
  };

  /* ---------------------------------------------------------------- unix-scripting */
  P["unix-scripting"] = {
    simple: [
      "A **shell script** is a text file of commands that runs top to bottom, so you can repeat a task with one word.",
      "The first line, `#!/usr/bin/env bash`, says which program runs it. `$1`, `$2` are the arguments, `\"$VAR\"` reads a variable, and `if` / `for` add logic.",
      "Start scripts with `set -euo pipefail`: stop on any error (`-e`), on unset variables (`-u`) and on a failure anywhere in a pipe (`pipefail`). Without it, a failed step is ignored and the script keeps going.",
    ],
    analogy: {
      text: "Think of a recipe card for a robot cook.",
      left: "Robot recipe", right: "Shell script",
      map: [
        ["\"This card is for the robot\" at the top", "The shebang line"],
        ["\"Use whichever fruit I hand you\"", "`$1` arguments"],
        ["\"If the milk is sour, stop\"", "`set -e` and `if` checks"],
        ["Steps followed in order", "Commands run top to bottom"],
      ],
      breaks: "a robot that drops an egg would stop. Bash, by default, keeps going after a failed command, which is why `set -euo pipefail` is the first thing to write.",
    },
    svg: () => {
      let b = t(240, 22, "Same script, with and without set -e", { bold: true, size: 14 });
      const steps = ["download.sh", "unzip (fails)", "load_to_db", "rm raw/*"];
      [["no set -e", 20, false], ["set -euo pipefail", 250, true]].forEach(([h, x, safe]) => {
        b += t(x + 105, 48, h, { size: 12.5, mono: true, bold: true, fill: safe ? C.goodT : C.badT });
        steps.forEach((s, i) => {
          const y = 58 + i * 42, ran = !safe || i <= 1;
          b += box(x, y, 210, 32, s, null, i === 1 ? "bad" : ran ? (safe ? "good" : i > 1 ? "warn" : "good") : "ghost", { mono: true, size: 12.5 });
          if (i < 3) b += arrow(x + 105, y + 32, x + 105, y + 42, { sw: 1.2 });
        });
      });
      b += t(125, 246, "loads nothing, deletes the raw files", { size: 11.5, fill: C.badT });
      b += t(355, 246, "stops at the failure, exit code 1", { size: 11.5, fill: C.goodT });
      return svg(480, 262, b, "Script behaviour after a failed step with and without set -e");
    },
    caption: "Without set -e the script runs on past the failure and deletes data; with it, the script stops.",
    oneline: "A shell script is a file of commands; start it with set -euo pipefail so failures stop it.",
  };

  /* ---------------------------------------------------------------- unix-loops */
  P["unix-loops"] = {
    simple: [
      "Loops repeat commands. `for f in raw/*.csv; do gzip \"$f\"; done` runs once per file.",
      "`while read -r line; do ...; done < list.txt` runs once per line of a file. `until` repeats until a condition becomes true, which is handy for waiting: `until curl -sf $URL; do sleep 5; done`.",
      "Always quote `\"$f\"`. File names with spaces otherwise split into two words and the command breaks.",
    ],
    analogy: {
      text: "Think of a postman's round.",
      left: "Post round", right: "Shell loop",
      map: [
        ["Visit each house on the list", "`for f in *.csv`"],
        ["Read the next address card until the pile runs out", "`while read -r line`"],
        ["Knock again until someone answers", "`until ...; do sleep 5; done`"],
        ["Skip a house with a \"no mail\" sign", "`continue`"],
        ["Stop the round in a storm", "`break`"],
      ],
      breaks: "a postman reads a house number as one thing. The shell splits unquoted text on spaces, so \"Q3 sales.csv\" becomes two arguments unless you write `\"$f\"`.",
    },
    svg: () => {
      let b = t(240, 22, "for f in raw/*.csv; do gzip \"$f\"; done", { bold: true, size: 13, mono: true });
      b += box(20, 44, 120, 46, "glob expands", "raw/*.csv", "acc", { mono2: true });
      b += arrow(142, 67, 170, 67);
      ["a.csv", "b.csv", "Q3 sales.csv"].forEach((f, i) => { b += box(174, 40 + i * 36, 130, 30, f, null, "plain", { mono: true, size: 12 }); b += arrow(306, 55 + i * 36, 330, 55 + i * 36, { sw: 1.2 }); b += box(334, 40 + i * 36, 130, 30, "gzip \"$f\"", null, "good", { mono: true, size: 12 }); });
      b += box(20, 160, 444, 40, "unquoted $f: gzip Q3 sales.csv -> 2 wrong arguments", null, "bad", { mono: true, size: 11.5 });
      b += t(240, 226, "One pass of the loop body per matched file.", { size: 12.5, fill: C.dim });
      return svg(480, 242, b, "A for loop over globbed files");
    },
    caption: "The glob expands into a list of names, and the loop body runs once for each.",
    oneline: "Shell loops repeat a command for every file, line or retry, and quoting keeps names in one piece.",
  };

  /* ---------------------------------------------------------------- unix-automation */
  const CRON = [["*/15 * * * *", "every 15 minutes", ["00:00", "00:15", "00:30", "00:45"]], ["0 2 * * *", "every day at 02:00", ["Mon 02:00", "Tue 02:00", "Wed 02:00", "Thu 02:00"]], ["0 9 * * 1-5", "09:00 Monday to Friday", ["Mon 09:00", "Tue 09:00", "Wed 09:00", "Thu 09:00"]], ["30 1 1 * *", "01:30 on the 1st of each month", ["1 Jan 01:30", "1 Feb 01:30", "1 Mar 01:30", "1 Apr 01:30"]]];
  P["unix-automation"] = {
    simple: [
      "**cron** is the built-in Unix scheduler. It runs commands at set times with no one logged in.",
      "Each line in a **crontab** has five time fields, then the command: minute, hour, day of month, month, day of week. `0 2 * * *` means \"at 02:00 every day\".",
      "cron gives jobs a tiny environment: a short `PATH`, no profile, and the server's time zone. Use full paths, log the output, and stop runs from overlapping (for example with `flock`).",
    ],
    analogy: {
      text: "Think of an alarm clock with five dials.",
      left: "Alarm clock", right: "cron line",
      map: [
        ["Minute dial, hour dial", "Fields 1 and 2"],
        ["Date dial and month dial", "Fields 3 and 4"],
        ["Weekday dial", "Field 5 (0 or 7 = Sunday)"],
        ["A dial set to \"any\"", "`*`"],
        ["\"Every 15 minutes\" ring", "`*/15`"],
      ],
      breaks: "an alarm wakes you even if yesterday's alarm is still ringing. cron does the same: if a job takes longer than its interval, a second copy starts on top of the first.",
    },
    svg: () => P["unix-automation"]._fig(1),
    _fig: i => {
      const [expr, say, next] = CRON[i], parts = expr.split(" ");
      let b = t(240, 22, expr + "  /path/to/job.sh >> job.log 2>&1", { bold: true, size: 12, mono: true });
      ["minute", "hour", "day of month", "month", "day of week"].forEach((n, j) => { b += box(16 + j * 92, 40, 84, 50, parts[j], n, parts[j] === "*" ? "ghost" : "acc", { mono: true, size: 15, size2: 10.5 }); });
      b += box(16, 104, 448, 34, say, null, "vio", { size: 13.5 });
      b += t(240, 162, "next runs", { size: 12, fill: C.dim, bold: true });
      next.forEach((n, j) => { b += box(16 + j * 115, 172, 103, 30, n, null, "good", { mono: true, size: 12 }); });
      b += t(240, 228, "Times are in the server's time zone.", { size: 12, fill: C.faint });
      return svg(480, 242, b, "The five fields of a cron expression and its next runs");
    },
    caption: "Read the fields left to right: minute, hour, day of month, month, day of week.",
    ix: el => choice(el, { label: "Schedule", options: CRON.map(c => c[0]), value: 0 }, i => ({ svg: P["unix-automation"]._fig(i), note: CRON[i][1] + ". A <code>*</code> means any value; <code>a-b</code> is a range; <code>*/n</code> is every n." })),
    oneline: "cron runs a command on a timetable written as five fields: minute, hour, day, month, weekday.",
  };

  /* ---------------------------------------------------------------- unix-de */
  P["unix-de"] = {
    simple: [
      "Data engineers use the command line to glue tools together and to poke at data quickly.",
      "**curl** calls an HTTP API. **jq** filters and reshapes JSON. **ssh** logs into a remote machine and **scp** or **rsync** copies files there. **gzip**, **zstd** and **tar** compress and bundle.",
      "Chained together, `curl -s $API | jq -r '.items[].id' | wc -l` checks an API's result count in one line, without writing a script.",
    ],
    analogy: {
      text: "Think of a pocket multi-tool.",
      left: "Multi-tool", right: "CLI toolkit",
      map: [
        ["The phone to call a supplier", "`curl`"],
        ["Tweezers to pick out one splinter", "`jq '.items[].id'`"],
        ["A key to the storeroom across town", "`ssh`, `scp`, `rsync`"],
        ["Vacuum bags for packing", "`gzip`, `zstd`, `tar`"],
      ],
      breaks: "a multi-tool is for quick fixes. Long-lived pipelines need retries, logging, tests and an orchestrator, so move a one-liner into Python or a proper job once others depend on it.",
    },
    svg: () => {
      let b = t(240, 22, "curl -s $API | jq -r '.items[].id' | wc -l", { bold: true, size: 13, mono: true });
      b += box(16, 44, 130, 56, "curl", "HTTP GET, JSON out", "acc", { mono: true, size2: 11 });
      b += arrow(148, 72, 172, 72);
      b += box(176, 44, 130, 56, "jq", "pick .items[].id", "vio", { mono: true });
      b += arrow(308, 72, 332, 72);
      b += box(336, 44, 128, 56, "wc -l", "count lines", "good", { mono: true });
      b += box(16, 124, 210, 50, "rsync -az out/ host:/in/", "copy only changed files", "plain", { mono: true, size: 12, size2: 11 });
      b += box(254, 124, 210, 50, "tar -czf logs.tgz logs/", "bundle and compress", "plain", { mono: true, size: 12, size2: 11 });
      b += t(240, 204, "Small tools, joined by pipes, answer quick questions.", { size: 12.5, fill: C.dim });
      return svg(480, 220, b, "A curl to jq to wc pipeline and two file-moving commands");
    },
    caption: "curl fetches, jq picks fields, wc counts; rsync and tar move and pack files.",
    oneline: "curl, jq, ssh, rsync and gzip are the command-line glue between data tools.",
  };

  /* ---------------------------------------------------------------- unix-interview-prep */
  P["unix-interview-prep"] = {
    simple: [
      "This page collects the whole Unix track for quick revision.",
      "Interview questions cluster in four areas: moving around files, joining tools with pipes and redirection, text tools (grep, sed, awk), and running things safely (permissions, scripts, cron).",
      "The best answers show a one-liner and then explain why it works and where it breaks.",
    ],
    analogy: {
      text: "Think of a driving test.",
      left: "Driving test", right: "Unix interview",
      map: [
        ["Knowing the roads", "Paths and navigation"],
        ["Joining traffic smoothly", "Pipes and redirection"],
        ["Parking in a tight spot", "A precise grep/awk one-liner"],
        ["Checking mirrors before moving", "`set -euo pipefail`, permissions"],
      ],
      breaks: "a driving test has a fixed route. Interviewers often hand you a messy log file and ask you to find something, so practise on real logs, not just flashcards.",
    },
    svg: () => {
      let b = t(240, 22, "Four areas a Unix interview checks", { bold: true, size: 14 });
      const A = [["Files", "acc", "pwd, ls, cd, find"], ["Pipes", "vio", "|, >, >>, 2>&1"], ["Text", "warn", "grep, sed, awk, sort"], ["Safety", "good", "chmod, set -e, cron"]];
      A.forEach(([h, k, s], i) => { const x = 16 + (i % 2) * 228, y = 40 + Math.floor(i / 2) * 80; b += box(x, y, 220, 66, h, s, k, { mono2: true, size2: 12 }); });
      b += t(240, 222, "Show the one-liner, then say why it works.", { size: 12.5, fill: C.dim });
      return svg(480, 238, b, "Four areas a Unix interview covers");
    },
    caption: "Revise by area, and practise on a real log file.",
    oneline: "Know your way around files, pipes, text tools and safe scripting, and explain each one-liner.",
  };
})();
