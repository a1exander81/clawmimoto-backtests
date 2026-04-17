#!/usr/bin/env python3
"""
Run Freqtrade backtest for both Session and Manual strategies.
Outputs trades.jsonl + metadata.json + equity_curve.csv per mode.
"""

import subprocess
import json
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone
import sys


CONFIG_TEMPLATE = {
    "max_open_trades": 3,
    "stake_currency": "USDT",
    "stake_amount": "10000",
    "dry_run": True,
    "dry_run_wallet": 10000,
    "fiat_display_currency": "USD",
    "timeframe": "5m",
    "exchange": {
        "name": "bingx",
        "key": "${BINGX_API_KEY}",
        "secret": "${BINGX_API_SECRET}",
        "ccxt_config": {},
        "ccxt_async_config": {},
        "pair_whitelist": ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"],
    },
    "pairlists": [{"method": "StaticPairList"}],
    "candle_type_def": {"candle_type_def": "futures"},
    "margin_mode": "isolated",
    "leverage": 50.0,
}


def run_freqtrade_backtest(strategy_name: str, timerange: str, out_dir: Path):
    """Run freqtrade backtest and convert output to JSONL."""
    # 1. Write temporary config
    config = CONFIG_TEMPLATE.copy()
    config["strategy"] = strategy_name
    config_file = out_dir / f"config_{strategy_name}.json"
    with open(config_file, "w") as f:
        json.dump(config, f, indent=2)

    # 2. Run freqtrade backtest
    result_file = out_dir / "backtest_result.json"
    cmd = [
        "freqtrade",
        "backtesting",
        "--strategy", strategy_name,
        "--timerange", timerange,
        "--config", str(config_file),
        "--export", "json",
        "--export-filename", str(result_file),
    ]

    print(f"Running: {' '.join(cmd)}")
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"ERROR: {proc.stderr}")
        sys.exit(1)

    # 3. Parse backtest result (Freqtrade exports a list of trades)
    with open(result_file) as f:
        data = json.load(f)

    trades = data.get("trades", [])
    if not trades:
        print("WARNING: No trades generated")
        return [], {}

    # 4. Convert to our JSONL format
    jsonl_lines = []
    for t in trades:
        entry = {
            "pair": t["pair"],
            "entry_ts": t["entry_ts"],
            "exit_ts": t.get("exit_ts"),
            "entry_price": t["entry_price"],
            "exit_price": t.get("exit_price"),
            "amount": t["amount"],
            "stake_amount": t["stake_amount"],
            "fee_open": t.get("fee_open", 0),
            "fee_close": t.get("fee_close", 0),
            "profit_abs": t.get("profit_abs", 0),
            "profit_pct": t.get("profit_pct", 0),
            "is_win": t.get("is_win", False),
            "session": t.get("session_tag", "N/A"),
        }
        jsonl_lines.append(entry)

    # 5. Build metadata
    wins = [t for t in trades if t.get("is_win")]
    losses = [t for t in trades if not t.get("is_win")]
    total_pnl = sum(t.get("profit_abs", 0) for t in trades)
    win_rate = len(wins) / len(trades) if trades else 0

    # Build equity curve (daily)
    df = pd.DataFrame(trades)
    if not df.empty:
        df["entry_dt"] = pd.to_datetime(df["entry_ts"], unit="ms")
        df.set_index("entry_dt", inplace=True)
        equity = (1 + df["profit_pct"] / 100).cumprod()
        equity_daily = equity.resample("1D").last().ffill()
        equity_daily.to_csv(out_dir / "equity_curve.csv", header=["equity"])
    else:
        equity_daily = pd.Series(dtype=float)

    # Max drawdown
    if not equity_daily.empty:
        rollmax = equity_daily.cummax()
        dd = (equity_daily - rollmax) / rollmax
        max_dd = dd.min() * 100
    else:
        max_dd = 0.0

    metadata = {
        "strategy": strategy_name,
        "timerange": timerange,
        "pair_count": len(set(t["pair"] for t in trades)),
        "total_trades": len(trades),
        "win_rate": round(win_rate * 100, 2),
        "total_pnl_pct": round(total_pnl, 2),
        "max_drawdown_pct": round(max_dd, 2),
        "sharpe_ratio": round((total_pnl / len(trades)) / (df["profit_pct"].std() if len(trades) > 1 else 1), 2),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Write outputs
    with open(out_dir / "trades.jsonl", "w") as f:
        for entry in jsonl_lines:
            f.write(json.dumps(entry) + "\n")

    with open(out_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"✓ {strategy_name}: {len(trades)} trades, PnL {metadata['total_pnl_pct']}%")
    return jsonl_lines, metadata


def main():
    period = "2026-03"
    timerange = f"{period}0100-{period}3123"  # full month 5m data

    base = Path(__file__).parent.parent
    session_dir = base / "backtests" / period / "session"
    manual_dir = base / "backtests" / period / "manual"

    session_dir.mkdir(parents=True, exist_ok=True)
    manual_dir.mkdir(parents=True, exist_ok=True)

    print("=== Running Session backtest ===")
    run_freqtrade_backtest("Claw5MSniper", timerange, session_dir)

    print("=== Running Manual backtest ===")
    run_freqtrade_backtest("Claw5MSniperManual", timerange, manual_dir)

    print("\n✅ Done. Results in backtests/2026-03/")


if __name__ == "__main__":
    main()
