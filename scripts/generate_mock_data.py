#!/usr/bin/env python3
import json, random, pandas as pd, numpy as np
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE = Path(__file__).parent.parent
PERIOD = "2026-03"
PAIRS = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT"]
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

def generate_trades(mode, count):
    trades = []
    base_time = datetime(2026,3,1, tzinfo=timezone.utc)
    for i in range(count):
        pair = random.choice(PAIRS)
        entry_offset = i * timedelta(minutes=15)
        entry_ts = int((base_time + entry_offset).timestamp()*1000)
        hold_minutes = random.randint(5,120)
        exit_ts = entry_ts + hold_minutes*60*1000
        base_price = {"BTC/USDT":70000,"ETH/USDT":2200,"SOL/USDT":85,"BNB/USDT":620}[pair]
        entry_price = base_price * (1 + random.uniform(-0.01,0.01))
        is_win = random.random()<0.58 if mode=="session" else random.random()<0.53
        pct = random.uniform(0.5,2.5) if is_win else random.uniform(-2.0,-0.5)
        exit_price = entry_price * (1 + pct/100)
        amount = random.uniform(0.5,2.0)
        stake = 10000 * random.uniform(0.01,0.02)
        profit_abs = stake * (pct/100)
        fee_open = stake*0.0004
        fee_close = stake*0.0004
        net_profit = profit_abs - fee_open - fee_close
trades.append({
            "pair":pair,"entry_ts":entry_ts,"exit_ts":exit_ts,
            "entry_price":round(entry_price,2),"exit_price":round(exit_price,2),
            "amount":round(amount,6),"stake_amount":round(stake,2),
            "fee_open":round(fee_open,4),"fee_close":round(fee_close,4),
            "profit_abs":round(net_profit,2),"profit_pct":round(pct,2),
            "is_win":is_win,
            "session": random.choice(["NY","TKY","LDN"]) if mode=="session" else "ANY",
        })
    return trades

def build_metadata(trades, mode):
    wins = [t for t in trades if t["is_win"]]
    total_pnl = sum(t["profit_abs"] for t in trades)
    win_rate = len(wins)/len(trades)*100 if trades else 0
    df = pd.DataFrame(trades)
    df["entry_dt"] = pd.to_datetime(df["entry_ts"], unit="ms", utc=True)
    df.sort_values("entry_dt", inplace=True)
    equity = (1 + df["profit_pct"]/100).cumprod()
    equity.index = df["entry_dt"]
    equity_daily = equity.resample("1D").last().ffill()
    rollmax = equity_daily.cummax()
    dd = (equity_daily - rollmax) / equity_daily
    max_dd = dd.min()*100 if not dd.empty else 0.0
    daily_rets = equity_daily.pct_change().dropna()
    sharpe = (daily_rets.mean()/daily_rets.std()*np.sqrt(365)) if len(daily_rets)>1 else 0.0
    return {
        "strategy": "Claw5MSniper" if mode=="session" else "Claw5MSniperManual",
        "mode": mode, "timerange":"2026-03", "pairs":PAIRS,
        "total_trades":len(trades), "win_rate":round(win_rate,2),
        "total_pnl_pct":round(total_pnl,2), "max_drawdown_pct":round(max_dd,2),
        "sharpe_ratio":round(sharpe,2),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

def main():
    print("Generating mock backtest data...")
    for mode, count in [("session",110),("manual",140)]:
        trades = generate_trades(mode,count)
        meta = build_metadata(trades,mode)
        out_dir = BASE / "backtests" / PERIOD / mode
        out_dir.mkdir(parents=True, exist_ok=True)
        with open(out_dir/"trades.jsonl","w") as f:
            for t in trades: f.write(json.dumps(t)+"\n")
        with open(out_dir/"metadata.json","w") as f:
            json.dump(meta,f,indent=2)
        df = pd.DataFrame(trades)
        df["entry_dt"] = pd.to_datetime(df["entry_ts"], unit="ms", utc=True)
        df.sort_values("entry_dt", inplace=True)
        equity = (1+df["profit_pct"]/100).cumprod()
        equity.index = df["entry_dt"]
        equity_daily = equity.resample("1D").last().ffill()
        equity_daily.name = "equity"
        equity_daily.to_csv(out_dir/"equity_curve.csv")
        print(f"✓ {mode}: {len(trades)} trades → {out_dir}")
    print("✅ Mock data generated.")

if __name__=="__main__":
    main()
