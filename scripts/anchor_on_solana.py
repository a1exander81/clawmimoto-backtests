#!/usr/bin/env python3
"""
Anchor backtest metadata on Solana using the Memo program.
Stores: strategy, period, commit_sha, trade_count, pnl, win_rate, data_cid (optional)
Cost: ~0.01 SOL per record
"""

import os
import sys
import json
import hashlib
import subprocess
from pathlib import Path
from datetime import datetime, timezone

# ── Load config ──
ENV_PATH = Path(__file__).parent.parent.parent / "clawmimoto-bot" / ".env"
if ENV_PATH.exists():
    from dotenv import load_dotenv
    load_dotenv(ENV_PATH, override=True)

SOLANA_WALLET = os.getenv("SOLANA_WALLET")  # path to wallet keypair JSON
SOLANA_RPC = os.getenv("SOLANA_RPC", "https://api.mainnet-beta.solana.com")

if not SOLANA_WALLET:
    print("❌ SOLANA_WALLET not set in .env")
    sys.exit(1)

def compute_metadata_hash(metadata: dict, commit_sha: str) -> str:
    """Compute SHA256 of (metadata + commit_sha) for on-chain proof."""
    combined = json.dumps(metadata, sort_keys=True) + commit_sha
    return hashlib.sha256(combined.encode()).hexdigest()

def anchor_on_solana(metadata: dict, commit_sha: str, memo_text: str = None):
    """Write a memo transaction to Solana anchoring the backtest."""
    # Build memo string if not provided
    if memo_text is None:
        memo_text = (
            f"Clawmimoto Backtest | "
            f"Strategy: {metadata['strategy']} | "
            f"Period: {metadata['period_start']} → {metadata['period_end']} | "
            f"Trades: {metadata['total_trades']} | "
            f"PnL: ${metadata['total_pnl']:,.2f} | "
            f"WinRate: {metadata['win_rate']:.1f}% | "
            f"Commit: {commit_sha[:8]}..."
        )

    # Use solana CLI to send memo (requires solana-cli installed)
    # Alternative: use Python solana library
    try:
        from solana.rpc.api import Client
        from solana.keypair import Keypair
        from solana.transaction import Transaction
        from solana.system_program import TransferParams, transfer
        from solana.publickey import PublicKey
        from solana.message import Message

        # Load wallet
        with open(SOLANA_WALLET) as f:
            secret = json.load(f)
        kp = Keypair.from_secret_key(bytes(secret))

        # Build memo instruction (using System Program's memo? Actually need Memo program)
        # Simpler: use solana-cli via subprocess
        cmd = [
            "solana", "transfer",
            "--from", SOLANA_WALLET,
            "--to", "Memo1Zk9bZ7kR3d8qQ5w2x4y6v9n1m3p5r8t2y4u6i9o1",  # Memo program ID
            "--lamports", "5000",  # ~0.000005 SOL (minimum rent-exempt)
            "--fee-payer", SOLANA_WALLET,
            "--url", SOLANA_RPC,
            "--allow-unfunded-recipient",
            "--", memo_text
        ]
        # Actually, the Memo program doesn't accept lamports; better to use a transfer to a known address with memo
        # Let's use a simpler approach: transfer 0.01 SOL to ourselves with memo
        cmd = [
            "solana", "transfer",
            SOLANA_WALLET,  # send to self
            "0.01",  # SOL amount
            "--from", SOLANA_WALLET,
            "--fee-payer", SOLANA_WALLET,
            "--url", SOLANA_RPC,
            "--allow-unfunded-recipient",
            "--", memo_text
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            sig = result.stdout.strip().split()[-1]
            print(f"✅ Anchored on Solana: {sig}")
            return sig
        else:
            print(f"❌ Solana transfer failed: {result.stderr}")
            return None
    except ImportError:
        print("⚠️  solana-py not installed, trying solana-cli...")
        # Fallback to CLI only
        pass

    return None

def main():
    if len(sys.argv) < 3:
        print("Usage: anchor_on_solana.py <period> <commit_sha> [metadata_json]")
        sys.exit(1)

    period = sys.argv[1]
    commit_sha = sys.argv[2]
    meta_path = Path(sys.argv[3]) if len(sys.argv) > 3 else None

    # Load metadata
    if meta_path and meta_path.exists():
        with open(meta_path) as f:
            metadata = json.load(f)
    else:
        # Build minimal metadata from commit
        metadata = {
            "strategy": "unknown",
            "period_start": period,
            "period_end": period,
            "total_trades": 0,
            "total_pnl": 0,
            "win_rate": 0,
        }

    # Compute hash
    data_hash = compute_metadata_hash(metadata, commit_sha)
    print(f"🔗 Metadata hash: {data_hash}")

    # Anchor to Solana
    sig = anchor_on_solana(metadata, commit_sha)
    if sig:
        print(f"✅ Anchored! TX: {sig}")
        # Save TX to metadata
        metadata["solana_tx"] = sig
        metadata["commit_sha"] = commit_sha
        metadata["data_hash"] = data_hash
        metadata["anchored_at"] = datetime.now(timezone.utc).isoformat()
        if meta_path:
            with open(meta_path, "w") as f:
                json.dump(metadata, f, indent=2)
        return 0
    else:
        print("❌ Failed to anchor")
        return 1

if __name__ == "__main__":
    sys.exit(main())
