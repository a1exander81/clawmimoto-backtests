# Clawmimoto Backtests

Public verifiable backtest results for Clawmimoto trading bot.

## Data Storage

- **Full trade logs**: Stored on GitHub (immutable via commit SHA)
- **On-chain anchor**: Each backtest's metadata hash is anchored on Solana for timestamped proof
- **Verification**: Frontend fetches from both sources and hashes match

## Structure

```
backtests/2026-03/
├── session/
│   ├── trades.jsonl      # Newline-delimited JSON trades
│   └── metadata.json     # Summary stats + Solana TX
└── manual/
    ├── trades.jsonl
    └── metadata.json
```

## Running Backtests

```bash
cd scripts
python3 run_backtest.py          # runs both modes for 2026-03
python3 commit_to_github.py 2026-03   # commits + pushes
python3 anchor_on_solana.py 2026-03 <commit_sha>  # anchors on Solana
```

## Frontend

Deployed on Vercel. Shows:
- Session vs Manual PnL curves
- Win rate, Sharpe, max drawdown
- Individual trade list
- Links to raw data on GitHub and Solscan
