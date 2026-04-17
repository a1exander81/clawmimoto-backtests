#!/usr/bin/env python3
import subprocess, sys, json
from pathlib import Path

BASE = Path(__file__).parent.parent

def run_cmd(cmd, capture=True):
    result = subprocess.run(cmd, capture_output=capture, text=True)
    if result.returncode != 0:
        print(f"ERROR: {' '.join(cmd)}")
        print(result.stderr)
        sys.exit(1)
    return result

def anchor_commit(period, commit_sha, keypair_path=None):
    if keypair_path is None:
        keypair_path = str(Path.home() / ".config" / "solana" / "id.json")
    if not Path(keypair_path).exists():
        print(f"ERROR: Solana keypair not found at {keypair_path}")
        sys.exit(1)
    print("Checking SOL balance...")
    balance = run_cmd(["solana","balance","--keypair",keypair_path]).stdout.strip()
    print(f"Current balance: {balance}")
    memo = f"ClawmimotoBacktest:{period}:{commit_sha}"
    print(f"Anchoring: {memo}")
    cmd = [
        "solana","transfer","--keypair",keypair_path,
        "--recipient",json.loads(open(keypair_path).read())["publicKey"],
        "--amount","0.01","--allow-unfunded-recipient",
        "--fee-payer",keypair_path,"--memo",memo,
        "--url","https://api.mainnet-beta.solana.com",
    ]
    result = run_cmd(cmd)
    tx_sig = result.stdout.strip().split()[-1]
    print(f"✅ Anchored! Tx: {tx_sig}")
    print(f"Explorer: https://explorer.solana.com/tx/{tx_sig}?cluster=mainnet-beta")
    return tx_sig

if __name__=="__main__":
    if len(sys.argv)<3:
        print("Usage: python3 scripts/anchor_on_solana.py <period> <commit_sha>")
        sys.exit(1)
    anchor_commit(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv)>3 else None)
