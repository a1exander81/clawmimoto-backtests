#!/usr/bin/env python3
"""
Generate realistic mock backtest data for demo purposes.
Creates trades.jsonl + metadata.json + equity_curve.csv
for both Session and Manual modes.
"""

import json
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
from pathlib import Path


BASE = Path(__file__).parent.parent
PERIOD = "2026-03"
PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"]
SEED = 42
random.seed(SEED)
np.random.seed(SEED)


def generate_trades(mode: str, count: int) -> list:
    """Generate mock trade list."""
    trades = []
    base_time = datetime(2026, 3, 1, tzinfo=timezone.utc)

    for i in range(count):
        # Random pair
        pair = random.choice(PAIRS)

        # Entry time (5m aligned)
        entry_offset = i * timedelta(minutes=15)  # ~15 min between trades
        entry_ts = int((base_time + entry_offset).timestamp() * 1000)

        # Hold time: 5M to 2H
        hold_minutes = random.randint(5, 120)
        exit_ts = entry_ts + hold_minutes * 60 * 1000

        # Prices (simulate 5m scalping)
        base_price = {"BTC/USDT": 70000, "ETH/USDT": 2200, "SOL/USDT": 85, "BNB/USDT": 620}[pair]
        entry_price = base_price * (1 + random.uniform(-0.01, 0.01))

        # Outcome
        is_win = random.random() < 0.58 if mode == "session" else random.random() < 0.53
        if is_win:
            pct = random.uniform(0.5, 2.5)   # +0.5% to +2.5%
        else:
            pct = random.uniform(-2.0, -0.5) # -0.5% to -2.0%
        exit_price = entry_price * (1 + pct / 100)

        amount = random.uniform(0.5, 2.0)   # contract size
        stake = 10000 * random.uniform(0.01, 0.02)  # 1–2% margin
        profit_abs = stake * (pct / 100)
        fee_open = stake * 0.0004  # 0.04% taker
        fee_close = stake * 0.0004
        net_profit = profit_abs - fee_open - fee_close

        trade = {
            "pair": pair,
            "entry_ts": entry_ts,
            "exit_ts": exit_ts,
            "entry_price": round(entry_price, 2),
            "exit_price": round(exit_price, 2),
            "amount": round(amount, 6),
            "stake_amount": round(stake, 2),
            "fee_open": round(fee_open, 4),
            "fee_close": round(fee_close, 4),
            "profit_abs": round(net_profit, 2),
            "profit_pct": round(pct, 2),
            "is_win": is_win,
            "session": random.choice(["NY", "TKY", "LDN"]) if mode == "session" else "ANY",
        }
        trades.append(trade)

    return trades


def build_metadata(trades: list, mode: str) -> dict:
    """Build summary metadata."""
    wins = [t for t in trades if t["is_win"]]
    losses = [t for t in trades if not t["is_win"]]
    total_pnl = sum(t["profit_abs"] for t in trades)
    win_rate = len(wins) / len(trades) * 100 if trades else 0

    # Build equity curve
    df = pd.DataFrame(trades)
    df["entry_dt"] = pd.to_datetime(df["entry_ts"], unit="ms", utc=True)
    df.sort_values("entry_dt", inplace=True)
    equity = (1 + df["profit_pct"] / 100).cumprod()
    equity.index = df["entry_dt"]
    equity_daily = equity.resample("1D").last().ffill()

    # Max drawdown
    rollmax = equity_daily.cummax()
    dd = (equity_daily - rollmax) / rollmax
    max_dd = dd.min() * 100 if not dd.empty else 0.0

    # Sharpe (daily returns)
    daily_rets = equity_daily.pct_change().dropna()
    sharpe = (daily_rets.mean() / daily_rets.std() * np.sqrt(365)) if len(daily_rets) > 1 else 0.0

    return {
        "strategy": "Claw5MSniper" if mode == "session" else "Claw5MSniperManual",
        "mode": mode,
        "timerange": "2026-03",
        "pairs": PAIRS,
        "total_trades": len(trades),
        "win_rate": round(win_rate, 2),
        "total_pnl_pct": round(total_pnl, 2),
        "max_drawdown_pct": round(max_dd, 2),
        "sharpe_ratio": round(sharpe, 2),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def main():
    print("Generating mock backtest data...")

    for mode, count in [("session", 110), ("manual", 140)]:
        trades = generate_trades(mode, count)
        meta = build_metadata(trades, mode)

        out_dir = BASE / "backtests" / PERIOD / mode
        out_dir.mkdir(parents=True, exist_ok=True)

        # Write trades.jsonl
        with open(out_dir / "trades.jsonl", "w") as f:
            for t in trades:
                f.write(json.dumps(t) + "\n")

        # Write metadata.json
        with open(out_dir / "metadata.json", "w") as f:
            json.dump(meta, f, indent=2)

        # Write equity_curve.csv
        df = pd.DataFrame(trades)
        df["entry_dt"] = pd.to_datetime(df["entry_ts"], unit="ms", utc=True)
        df.sort_values("entry_dt", inplace=True)
        equity = (1 + df["profit_pct"] / 100).cumprod()
        equity.index = df["entry_dt"]
        equity_daily = equity.resample("1D").last().ffill()
        equity_daily.name = "equity"
        equity_daily.to_csv(out_dir / "equity_curve.csv")

        print(f"✓ {mode}: {len(trades)} trades → {out_dir}")

    print("✅ Mock data generated.")


if __name__ == "__main__":
    main()
