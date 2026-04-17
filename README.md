# Clawmimoto Backtests

Transparent, verifiable backtest results for the Clawmimoto trading bot.

## 🔍 What's Inside

- **Session mode** (`Claw5MSniper`) — trades only during market opens (NY/Tokyo/London)
- **Manual mode** (`Claw5MSniperManual`) — trades 24/7 without session filters
- **Period:** March 2026 (1 month)
- **Pairs:** BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT
- **Timeframe:** 5-minute candles

## 📁 Structure

```
backtests/2026-03/
├── session/
│   ├── trades.jsonl        # All executed trades (Freqtrade format)
│   ├── metadata.json       # Summary stats (PnL, win rate, Sharpe, max DD)
│   └── equity_curve.csv    # Daily equity curve
├── manual/
│   ├── trades.jsonl
│   ├── metadata.json
│   └── equity_curve.csv
└── pairs/                  # Historical 5m data (optional, not tracked)
```

## 🚀 Quick Start

### Run Backtest (VPS)
```bash
cd /data/.openclaw/workspace/clawmimoto-backtests
python3 scripts/run_backtest.py
```
*Requires Freqtrade installed and BingX API keys in `.env`.*

### Generate Mock Data (Demo)
```bash
python3 scripts/generate_mock_data.py
```

### Push to GitHub
```bash
python3 scripts/commit_to_github.py 2026-03
```

### Anchor on Solana
```bash
python3 scripts/anchor_on_solana.py 2026-03 <commit_sha>
```
*Requires Solana CLI and funded wallet (~0.02 SOL).*

## 🌐 Frontend

Deployed at: https://clawmimoto-backtests.vercel.app

Shows:
- TradingView-style candlestick chart (daily OHLC)
- Volume histogram
- Session vs Manual metrics comparison
- "Powered by OpenClaw Analytics • Fueled by Freqtrade"

## 📊 Metrics (Mock Data — Demo)

| Metric | Session | Manual |
|--------|---------|--------|
| Total PnL | +12.4% | +8.1% |
| Win Rate | 58.2% | 52.7% |
| Sharpe Ratio | 1.85 | 1.32 |
| Max Drawdown | -4.2% | -6.8% |

*Replace with real backtest results by running `run_backtest.py`.*

## 🔗 Attribution

Backtest engine powered by [Freqtrade](https://www.freqtrade.io/). Data format compatible with Freqtrade exports.

## 📝 Notes

- All trades use **isolated margin** (BingX perpetuals)
- **1–2% margin** per trade, 50–100% RRR targets
- **Trailing stop** engages at +50% profit
- Session mode trades only at market opens: NY 21:30 SGT, Tokyo 08:00/11:30, London 16:00
