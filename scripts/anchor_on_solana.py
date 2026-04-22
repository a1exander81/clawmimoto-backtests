#!/usr/bin/env python3
"""
Anchor backtest commit hash on Solana blockchain via memo program.
Uses solana CLI to send a small transaction with a memo.
Cost: ~0.01 SOL
"""

import subprocess
import sys
import json
from pathlib import Path


BASE = Path(__file__).parent.parent


def run_cmd(cmd: list, capture=True):
    """Run shell command."""
    result = subprocess.run(cmd, capture_output=capture, text=True)
    if result.returncode != 0:
        print(f"ERROR: {' '.join(cmd)}")
        print(result.stderr)
        sys.exit(1)
    return result


def anchor_commit(period: str, commit_sha: str, keypair_path: str = None):
    """
    Anchor commit hash on Solana using memo program.

    Args:
        period: e.g. "2026-03"
        commit_sha: full or short commit hash
        keypair_path: path to keypair.json (default: ~/.config/solana/id.json)
    """
    if keypair_path is None:
        keypair_path = str(Path.home() / ".config" / "solana" / "id.json")

    # Check keypair exists
    if not Path(keypair_path).exists():
        print(f"ERROR: Solana keypair not found at {keypair_path}")
        print("Run: solana-keygen new --outfile ~/.config/solana/id.json")
        sys.exit(1)

    # Check balance
    print("Checking SOL balance...")
    balance = run_cmd(["solana", "balance", "--keypair", keypair_path]).stdout.strip()
    print(f"Current balance: {balance}")
    if "0.0" in balance or float(balance.split()[0]) < 0.02:
        print("WARNING: Low balance. Need ~0.02 SOL for tx fee.")
        resp = input("Continue anyway? (y/n): ")
        if resp.lower() != "y":
            sys.exit(0)

    # Build memo message
    memo = f"ClawmimotoBacktest:{period}:{commit_sha}"

    print(f"Anchoring: {memo}")
    print("Signing and sending transaction...")

    # Send 0.01 SOL to self with memo
    cmd = [
        "solana", "transfer",
        "--keypair", keypair_path,
        "--recipient", json.loads(open(keypair_path).read())["publicKey"],
        "--amount", "0.01",
        "--allow-unfunded-recipient",
        "--fee-payer", keypair_path,
        "--memo", memo,
        "--url", "https://api.mainnet-beta.solana.com",
    ]

    result = run_cmd(cmd)
    tx_sig = result.stdout.strip().split()[-1]
    print(f"✅ Anchored! Tx signature: {tx_sig}")
    print(f"Explorer: https://explorer.solana.com/tx/{tx_sig}?cluster=mainnet-beta")
    return tx_sig


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 anchor_on_solana.py <period> <commit_sha> [keypair_path]")
        print("Example: python3 anchor_on_solana.py 2026-03 abc123 ~/.config/solana/id.json")
        sys.exit(1)
    period = sys.argv[1]
    commit_sha = sys.argv[2]
    keypair = sys.argv[3] if len(sys.argv) > 3 else None
    anchor_commit(period, commit_sha, keypair)
