#!/usr/bin/env python3
"""
Run 1-month backtest for both Session and Manual modes.
Outputs: JSONL trade logs + metadata JSON
"""

import os
import sys
import json
import subprocess
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path

# ── Config ──
BACKTEST_ROOT = Path(__file__).parent.parent / "backtests"
PERIOD_START = "2026-03-01"
PERIOD_END = "2026-03-31"
TIMEFRAME = "5m"
PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"]
FREQTRADE_PATH = Path(__file__).parent.parent / "clawmimoto-bot"  # path to freqtrade config
DRY_RUN_WALLET = 10000

def run_freqtrade_backtest(strategy_name: str, output_dir: Path):
    """Run freqtrade backtest and export to JSONL."""
    print(f"🔬 Running backtest: {strategy_name}")

    # Build command
    cmd = [
        "python3", "-m", "freqtrade", "backtesting",
        "--strategy", strategy_name,
        "--timerange", f"{PERIOD_START.replace('-','')}-{PERIOD_END.replace('-','')}",
        "--timeframe", TIMEFRAME,
        "--dry-run-wallet", str(DRY_RUN_WALLET),
        "--export", "trades",
        "--exportfilename", str(output_dir / "trades.csv"),
    ]
    # Add config overrides
    config_path = FREQTRADE_PATH / "configs" / "config.json"
    user_config = FREQTRADE_PATH / "configs" / "config.local.json"
    if config_path.exists():
        cmd.extend(["--config", str(config_path)])
    if user_config.exists():
        cmd.extend(["--config", str(user_config)])

    print(f"   CMD: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=FREQTRADE_PATH, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Backtest failed: {result.stderr[-500:]}")
        return None

    print(f"✅ Backtest complete. Parsing CSV...")
    csv_path = output_dir / "trades.csv"
    if not csv_path.exists():
        print(f"❌ No trades.csv at {csv_path}")
        return None

    # Parse CSV
    df = pd.read_csv(csv_path)
    trades = []
    for _, row in df.iterrows():
        trade = {
            "id": int(row["trade_id"]) if "trade_id" in row else 0,
            "timestamp": row.get("open_date", ""),
            "mode": "session" if strategy_name == "Claw5MSniper" else "manual",
            "side": "long" if row.get("is_short", 0) == 0 else "short",
            "order_type": row.get("order_type", "market").lower(),
            "pair": row.get("pair", ""),
            "entry_price": float(row.get("open_rate", 0)),
            "tp": float(row.get("max_rate", 0)) if "max_rate" in row else 0,
            "sl": float(row.get("min_rate", 0)) if "min_rate" in row else 0,
            "exit_price": float(row.get("close_rate", 0)),
            "pnl_pct": float(row.get("profit_ratio", 0)) * 100,
            "pnl_abs": float(row.get("profit_abs", 0)),
            "duration_min": int(row.get("duration", 0)) if "duration" in row else 0,
        }
        trades.append(trade)

    # Write JSONL
    jsonl_path = output_dir / "trades.jsonl"
    with open(jsonl_path, "w") as f:
        for t in trades:
            f.write(json.dumps(t) + "\n")

    print(f"   📄 {len(trades)} trades → {jsonl_path.name}")

    # Build metadata
    total_pnl = sum(t["pnl_abs"] for t in trades)
    wins = [t for t in trades if t["pnl_abs"] > 0]
    win_rate = len(wins) / len(trades) * 100 if trades else 0
    metadata = {
        "strategy": strategy_name,
        "period_start": PERIOD_START,
        "period_end": PERIOD_END,
        "timeframe": TIMEFRAME,
        "pairs": PAIRS,
        "total_trades": len(trades),
        "total_pnl": round(total_pnl, 2),
        "win_rate": round(win_rate, 2),
        "initial_balance": DRY_RUN_WALLET,
        "final_balance": DRY_RUN_WALLET + total_pnl,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    meta_path = output_dir / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"   📋 Metadata saved")

    return metadata

def main():
    base = BACKTEST_ROOT / PERIOD_START
    base.mkdir(parents=True, exist_ok=True)

    modes = [
        ("Claw5MSniper", base / "session"),
        ("Claw5MSniperManual", base / "manual"),
    ]

    results = {}
    for strategy_name, out_dir in modes:
        out_dir.mkdir(parents=True, exist_ok=True)
        meta = run_freqtrade_backtest(strategy_name, out_dir)
        if meta:
            results[strategy_name] = meta

    # Comparison summary
    print("\n📊 Backtest Summary")
    print("-" * 60)
    for strat, meta in results.items():
        mode = "Session" if "Sniper" == strat else "Manual"
        print(f"{mode:8s} | Trades: {meta['total_trades']:4d} | PnL: ${meta['total_pnl']:>10,.2f} | Win: {meta['win_rate']:>5.1f}%")

    print("\n✅ All backtests complete. Ready to commit & anchor.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
