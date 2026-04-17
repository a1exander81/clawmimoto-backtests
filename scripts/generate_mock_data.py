#!/usr/bin/env python3
"""
Generate mock backtest data (Freqtrade-compatible) for demo purposes.
Creates realistic-looking trades for Session and Manual modes.
Output: JSONL + metadata
"""

import json
import random
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE = Path(__file__).parent.parent / "backtests" / "2026-03"
PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"]

def random_timestamp(start, end):
    """Random datetime between start and end."""
    delta = end - start
    int_delta = delta.total_seconds()
    random_second = random.uniform(0, int_delta)
    return (start + timedelta(seconds=random_second)).replace(tzinfo=timezone.utc)

def generate_trades(mode: str, num_trades: int = 120):
    """Generate mock trades for one mode."""
    trades = []
    start_date = datetime(2026, 3, 1, 0, 0, 0, tzinfo=timezone.utc)
    end_date = datetime(2026, 3, 31, 23, 59, 59, tzinfo=timezone.utc)

    for i in range(num_trades):
        # Randomize trade parameters
        pair = random.choice(PAIRS)
        side = random.choice(["long", "short"])
        order_type = random.choice(["market", "limit"])
        entry = random.uniform(100, 100000) if "BTC" in pair else random.uniform(10, 10000)
        # RRR ~1.5-2.5
        if side == "long":
            tp = entry * (1 + random.uniform(0.015, 0.035))
            sl = entry * (1 - random.uniform(0.008, 0.018))
        else:
            tp = entry * (1 - random.uniform(0.015, 0.035))
            sl = entry * (1 + random.uniform(0.008, 0.018))
        # 60% win rate
        win = random.random() < 0.6
        exit_price = tp if win else sl
        pnl_pct = (exit_price - entry) / entry * 100 if side == "long" else (entry - exit_price) / entry * 100
        if not win:
            pnl_pct = -abs(pnl_pct)
        pnl_abs = pnl_pct / 100 * 100  # $100 stake per trade (for mock)
        duration = random.randint(5, 120)  # 5-120 minutes

        ts = random_timestamp(start_date, end_date)

        trade = {
            "id": i + 1,
            "timestamp": ts.isoformat(),
            "mode": mode,
            "side": side,
            "order_type": order_type,
            "pair": pair,
            "entry_price": round(entry, 2),
            "tp": round(tp, 2),
            "sl": round(sl, 2),
            "exit_price": round(exit_price, 2),
            "pnl_pct": round(pnl_pct, 2),
            "pnl_abs": round(pnl_abs, 2),
            "duration_min": duration,
        }
        trades.append(trade)

    # Sort by timestamp
    trades.sort(key=lambda t: t["timestamp"])
    return trades

def main():
    # Session mode
    session_dir = BASE / "session"
    session_dir.mkdir(parents=True, exist_ok=True)
    session_trades = generate_trades("session", num_trades=110)
    with open(session_dir / "trades.jsonl", "w") as f:
        for t in session_trades:
            f.write(json.dumps(t) + "\n")

    session_meta = build_metadata("Claw5MSniper", "session", session_trades)
    with open(session_dir / "metadata.json", "w") as f:
        json.dump(session_meta, f, indent=2)

    # Manual mode
    manual_dir = BASE / "manual"
    manual_dir.mkdir(parents=True, exist_ok=True)
    manual_trades = generate_trades("manual", num_trades=140)
    with open(manual_dir / "trades.jsonl", "w") as f:
        for t in manual_trades:
            f.write(json.dumps(t) + "\n")

    manual_meta = build_metadata("Claw5MSniperManual", "manual", manual_trades)
    with open(manual_dir / "metadata.json", "w") as f:
        json.dump(manual_meta, f, indent=2)

    print(f"✅ Generated {len(session_trades)} session + {len(manual_trades)} manual trades")
    print(f"📂 Output: {BASE}")

def build_metadata(strategy_name, mode, trades):
    total_pnl = sum(t["pnl_abs"] for t in trades)
    wins = [t for t in trades if t["pnl_abs"] > 0]
    win_rate = len(wins) / len(trades) * 100 if trades else 0
    total = sum(t["pnl_abs"] for t in trades)
    # Simple Sharpe approximation (assume 0 risk-free)
    if trades:
        returns = [t["pnl_abs"] for t in trades]
        mean_return = sum(returns) / len(returns)
        std_return = (sum((r - mean_return)**2 for r in returns) / len(returns))**0.5
        sharpe = mean_return / std_return if std_return > 0 else 0
    else:
        sharpe = 0

    return {
        "strategy": strategy_name,
        "mode": mode,
        "period_start": "2026-03-01T00:00:00Z",
        "period_end": "2026-03-31T23:59:59Z",
        "timeframe": "5m",
        "pairs": PAIRS,
        "total_trades": len(trades),
        "total_pnl": round(total_pnl, 2),
        "win_rate": round(win_rate, 2),
        "sharpe_ratio": round(sharpe, 2),
        "max_drawdown": round(random.uniform(8, 18), 2),  # plausible DD
        "profit_factor": round(random.uniform(1.2, 2.0), 2),
        "initial_balance": 10000,
        "final_balance": round(10000 + total_pnl, 2),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "note": "Mock data for demo — replace with real Freqtrade backtest results",
    }

if __name__ == "__main__":
    main()
