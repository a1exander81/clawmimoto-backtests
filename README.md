# Clawmimoto Backtests

Public repository for verifiable backtest data comparing Session vs Manual trading modes.

## Structure

```
backtests/
├── session/          # Session mode backtests
│   └── 2026-03/
│       ├── trades.jsonl
│       └── metadata.json
├── manual/           # Manual mode backtests
│   └── 2026-03/
│       ├── trades.jsonl
│       └── metadata.json
└── archives/         # Older runs (compressed)
```

Each backtest run produces:
- `trades.jsonl` — one JSON object per trade (newline-delimited)
- `metadata.json` — summary stats + Solana anchor TX (once submitted)

## Fields (per trade)

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Trade sequence number |
| `timestamp` | ISO8601 | Entry time (UTC) |
| `mode` | "session" \| "manual" | Trading mode |
| `side` | "long" \| "short" | Direction |
| `order_type` | "market" \| "limit" | Order type |
| `pair` | string | Trading pair (e.g., "BTC/USDT") |
| `entry_price` | float | Entry price (USDT) |
| `tp` | float | Take-profit price |
| `sl` | float | Stop-loss price |
| `exit_price` | float | Exit price |
| `pnl_pct` | float | % PnL (positive = profit) |
| `pnl_abs` | float | Absolute PnL (USDT) |
| `duration_min` | integer | Hold time in minutes |

## Verification

After backtest completion:
1. Commit JSON files to this repo
2. Get commit SHA
3. Submit SHA + metadata hash to Solana (coming soon)
4. Frontend will display "Verified on-chain" badge

---

*Built by Clawmimoto — Freqtrade-powered trading bot*
