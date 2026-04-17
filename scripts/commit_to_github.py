#!/usr/bin/env python3
"""
Commit backtest results to GitHub and return commit SHA.
"""

import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime, timezone

BACKTEST_ROOT = Path(__file__).parent.parent
GIT_REPO = BACKTEST_ROOT
GIT_REMOTE = "origin"

def commit_and_push(period: str = "2026-03"):
    """Commit backtest data for a given period and push to GitHub."""
    backtest_dir = BACKTEST_ROOT / "backtests" / period
    if not backtest_dir.exists():
        print(f"❌ No backtest data at {backtest_dir}")
        return None

    os.chdir(GIT_REPO)

    # Configure git user (if not set)
    subprocess.run(["git", "config", "user.email", "bot@clawmimoto.com"], check=False)
    subprocess.run(["git", "config", "user.name", "Clawmimoto Bot"], check=False)

    # Add files
    subprocess.run(["git", "add", f"backtests/{period}/"], check=True)

    # Commit
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    commit_msg = f"feat: add {period} backtest results (Session vs Manual)\n\nPeriod: {period}\nGenerated: {ts}\n"
    result = subprocess.run(["git", "commit", "-m", commit_msg], capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Committed locally")
    else:
        # Maybe nothing to commit?
        if "nothing to commit" in result.stdout or "nothing to commit" in result.stderr:
            print("⚠️  Nothing to commit (already up-to-date)")
            # Get latest commit SHA anyway
            sha = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
            return sha
        else:
            print(f"❌ Commit failed: {result.stderr}")
            return None

    # Push
    result = subprocess.run(["git", "push", GIT_REMOTE, "HEAD"], capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Pushed to GitHub")
    else:
        print(f"❌ Push failed: {result.stderr}")
        return None

    # Get SHA
    sha = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
    print(f"📋 Commit SHA: {sha}")
    return sha

if __name__ == "__main__":
    period = sys.argv[1] if len(sys.argv) > 1 else "2026-03"
    sha = commit_and_push(period)
    if sha:
        print(f"\n✅ Success: {sha}")
        sys.exit(0)
    else:
        print("\n❌ Failed")
        sys.exit(1)
