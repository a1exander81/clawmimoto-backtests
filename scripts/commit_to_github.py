#!/usr/bin/env python3
import subprocess, sys
from pathlib import Path
from datetime import datetime

BASE = Path(__file__).parent.parent
BACKTESTS_DIR = BASE / "backtests"

def run_cmd(cmd, cwd=None, check=True):
    result = subprocess.run(cmd, cwd=cwd or BASE, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"ERROR: {' '.join(cmd)}")
        print(result.stderr)
        sys.exit(1)
    return result

def commit_and_push(period):
    print(f"Committing backtest results for period: {period}")
    period_dir = BACKTESTS_DIR / period
    if not period_dir.exists():
        print(f"ERROR: {period_dir} not found")
        sys.exit(1)
    run_cmd(["git","add",str(period_dir)])
    date = datetime.now().strftime("%Y-%m-%d %H:%M")
    commit_msg = f"chore: backtest results for {period} ({date})"
    run_cmd(["git","commit","-m",commit_msg])
    print("Pushing to GitHub...")
    run_cmd(["git","push","origin","master"])
    print("✅ Pushed successfully")
    sha = run_cmd(["git","rev-parse","--short","HEAD"]).stdout.strip()
    print(f"Commit SHA: {sha}")
    return sha

if __name__=="__main__":
    if len(sys.argv)<2:
print("Usage: python3 scripts/commit_to_github.py <period>")
        sys.exit(1)
    commit_and_push(sys.argv[1])
