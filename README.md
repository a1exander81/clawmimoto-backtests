# Clawmimoto Backtests

Transparent, verifiable backtest results for the Clawmimoto trading bot.

## 🔍 What's Inside

- **Session mode** (`Claw5MSniper`) — trades only during market opens (NY/Tokyo/London)
- **Manual mode** (`Claw5MSniperManual`) — trades 24/7 without session filters
- **Period:** March 2026 (1 month)
- **Pairs:** BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT
- **Timeframe:** 5-minute candles

## 📁 Structure

backtests/2026-03/
├── session/
│   ├── trades.jsonl
│   ├── metadata.json
│   └── equity_curve.csv
├── manual/
│   ├── trades.jsonl
│   ├── metadata.json
│   └── equity_curve.csv

## 🚀 Quick Start

### Generate Mock Data (Demo)
python3 scripts/generate_mock_data.py

### Deploy Frontend (Vercel)
cd frontend
npm install
npx vercel --prod

## 🌐 Frontend

Deployed at: https://clawmimoto-backtests.vercel.app

Shows:
- TradingView-style candlestick chart
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

## 🔗 Attribution

Backtest engine powered by Freqtrade (https://www.freqtrade.io/).

## 📝 Notes

- Isolated margin, 1–2% risk per trade
- Trailing stop engages at +50% profit
- Session mode trades at NY/Tokyo/London opens
