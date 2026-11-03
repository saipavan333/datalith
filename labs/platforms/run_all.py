"""Run every platform lab and save its output to labs/platforms/outputs/<lab>.txt.

  pip install duckdb deltalake     (deltalake is only needed for delta_log_lab.py)
  python labs/platforms/run_all.py
"""
import pathlib
import subprocess
import sys

here = pathlib.Path(__file__).parent
out = here / "outputs"
out.mkdir(exist_ok=True)
ok = fail = 0
for lab in sorted(here.glob("*.py")):
    if lab.name == "run_all.py":
        continue
    r = subprocess.run([sys.executable, str(lab)], capture_output=True, text=True, encoding="utf-8")
    (out / f"{lab.stem}.txt").write_text(r.stdout + (("\n--- stderr ---\n" + r.stderr) if r.returncode else ""), encoding="utf-8")
    status = "PASS" if r.returncode == 0 else "FAIL"
    ok += r.returncode == 0
    fail += r.returncode != 0
    print(f"{status}  {lab.name}")
print(f"\n{ok} passed, {fail} failed")
sys.exit(1 if fail else 0)
