#!/usr/bin/env python3
"""
Commit backtest results to GitHub repository.
Creates a commit with date-based message and pushes to origin/master.
"""

import subprocess
import sys
from pathlib import Path
from datetime import datetime
import os


BASE = Path(__file__).parent.parent
BACKTESTS_DIR = BASE / "backtests"
GIT_REMOTE = "origin"


def run_cmd(cmd: list, cwd=None, check=True):
    """Run shell command."""
    result = subprocess.run(cmd, cwd=cwd or BASE, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"ERROR: {' '.join(cmd)}")
        print(result.stderr)
        sys.exit(1)
    return result


def commit_and_push(period: str):
    """Commit all changes in backtests/<period>/ and push."""
    print(f"Committing backtest results for period: {period}")

    # 1. Check period exists
    period_dir = BACKTESTS_DIR / period
    if not period_dir.exists():
        print(f"ERROR: {period_dir} not found")
        sys.exit(1)

    # 2. Git add
    run_cmd(["git", "add", str(period_dir)])

    # 3. Commit
    date = datetime.now().strftime("%Y-%m-%d %H:%M")
    commit_msg = f"chore: backtest results for {period} ({date})"
    run_cmd(["git", "commit", "-m", commit_msg])

    # 4. Push
    print("Pushing to GitHub...")
    run_cmd(["git", "push", GIT_REMOTE, "master"])
    print("✅ Pushed successfully")

    # 5. Get commit SHA
    sha = run_cmd(["git", "rev-parse", "--short", "HEAD"]).stdout.strip()
    print(f"Commit SHA: {sha}")
    return sha


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 commit_to_github.py <period>  (e.g. 2026-03)")
        sys.exit(1)
    period = sys.argv[1]
    commit_and_push(period)
