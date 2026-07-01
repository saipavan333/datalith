# The command line & filesystem — the complete guide

Data engineers live on the command line — tools, servers, and automation all run
there. This guide gets you fluent in navigating the filesystem and the core file
commands, with examples and practice.

## 1. What the shell is

The **shell** (bash, zsh) is a program that reads commands you type and runs them. You
get a **prompt**, type a command, press Enter. It's faster than clicking, scriptable,
and works over SSH on remote servers where there's no GUI.

## 2. The filesystem is a tree

@@diagram:filesystem-tree

Everything lives under the **root `/`**. Folders (directories) contain files and other
folders, forming a tree. Your **home** directory (`/home/you` or `~`) is your personal
space.

## 3. Navigating

```bash
pwd            # print working directory — where am I?
ls             # list contents
ls -lah        # long listing, all files (incl. hidden), human-readable sizes
cd data        # change into ./data
cd /var/log    # change to an absolute path
cd ..          # up one level
cd ~           # home
cd -           # back to the previous directory
```

## 4. Paths: absolute vs relative

- **Absolute** paths start at root: `/home/ava/data/orders.csv` — unambiguous anywhere.
- **Relative** paths start from where you are: `data/orders.csv`.
- Shortcuts: `~` home, `.` current dir, `..` parent, `*` wildcard (`ls *.csv`).

## 5. Files and folders

```bash
mkdir reports             # make a directory
mkdir -p data/2025/05     # make nested dirs (parents too)
touch notes.txt           # create empty file / update timestamp
cp a.txt b.txt            # copy a file
cp -r src/ backup/        # copy a folder (recursive)
mv a.txt archive/         # move
mv old.txt new.txt        # rename
rm old.txt                # DELETE — no undo!
rm -r tmp/                # delete a folder and its contents
```

⚠️ `rm` has **no recycle bin**. Double-check with `pwd`/`ls` first, and be very careful
with `rm -rf` and variables (`rm -rf "$DIR/"` becomes `rm -rf /` if `$DIR` is empty).

## 6. Looking inside files

```bash
cat file.txt          # print the whole file
less file.txt         # scroll a big file (q to quit, / to search)
head -20 file.txt     # first 20 lines
tail -20 file.txt     # last 20 lines
tail -f app.log       # follow live as lines are added (Ctrl+C to stop)
wc -l file.txt        # count lines
```

`tail -f` on a log is how you watch a running job.

## 7. Getting help and finding things

```bash
man ls                # the manual page (q to quit)
ls --help             # quick option summary
find . -name "*.csv"  # find files by name under the current dir
find /data -mtime -1  # files modified in the last day
which python3         # where a command lives
```

## 8. Productivity

- **Tab** auto-completes file/command names — use it constantly.
- **Up/Down arrows** recall previous commands; **Ctrl+R** searches history.
- **Ctrl+C** cancels a running command; **Ctrl+L** clears the screen.
- Combine commands with `&&` (run next only if previous succeeded): `cd build && make`.

## Practice

1. **Relative nav.** From `/home/ava`, go into `projects/etl`, then back home.
2. **Watch a log.** Show the last 50 lines of `app.log` and follow it live.
3. **Nested mkdir.** Create `data/2025/05` in one command, then a file inside it.
4. **Danger.** Why is `rm -rf data/` risky and how do you reduce the risk?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"You SSH into a fresh server. How do you orient yourself and inspect a data file?"*

`pwd` to see where you are, `ls -lah` to list files and sizes, `cd` into the data dir,
`head`/`less` to peek at a file, `tail -f` to watch a job's log, and `find`/`du -sh *`
to locate large files. Navigation (pwd/ls/cd), paths (absolute vs relative), and the
view commands (cat/less/head/tail) are the daily core.
