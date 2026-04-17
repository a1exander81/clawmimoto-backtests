# Clawmimoto Backtests — Quickstart

Get the repo running locally and deploy the frontend in 5 minutes.

## 📦 Prerequisites

- Python 3.9+ (for backtest scripts)
- Node.js 18+ (for frontend)
- Git
- (Optional) Freqtrade installed for real backtests
- (Optional) Solana CLI for anchoring

## 1️⃣ Clone & Setup

```bash
git clone https://github.com/a1exander81/clawmimoto-backtests.git
cd clawmimoto-backtests
```

## 2️⃣ Run Mock Data (Demo)

If you just want to see the frontend with demo data:

```bash
python3 scripts/generate_mock_data.py
```
This creates `backtests/2026-03/{session,manual}/` with realistic mock trades.

## 3️⃣ Deploy Frontend (Vercel)

```bash
cd frontend
npm install
npx vercel --prod
```

Frontend will be live at: `https://clawmimoto-backtests.vercel.app`

## 4️⃣ Run Real Backtest (Optional)

To replace mock data with real Freqtrade backtest:

```bash
# Make sure BingX API keys are in a .env file (copy from clawmimoto-bot/.env)
cp ../clawmimoto-bot/.env .env  # adjust path as needed

# Run backtest (downloads 5m data, runs both strategies)
python3 scripts/run_backtest.py

# Output goes to backtests/2026-03/{session,manual}/

# Push to GitHub
python3 scripts/commit_to_github.py 2026-03

# Vercel auto-redeploys (if connected to GitHub)
```

## 5️⃣ Anchor on Solana (Optional)

Prove immutability by anchoring the commit hash on-chain:

```bash
# Install Solana CLI: https://docs.solana.com/cli/install
# Fund wallet: airdrop 1 SOL to your keypair

python3 scripts/anchor_on_solana.py 2026-03 <commit_sha>
```

Example output:
```
Anchored commit abc123... on Solana:
https://explorer.solana.com/tx/5K7t...
```

## 📁 Project Layout

```
clawmimoto-backtests/
├── backtests/2026-03/
│   ├── session/        ← Session strategy results
│   └── manual/         ← Manual strategy results
├── frontend/           ← Next.js + Recharts dashboard
├── scripts/
│   ├── run_backtest.py     ← Freqtrade runner
│   ├── generate_mock_data.py  ← Demo data generator
│   ├── commit_to_github.py    ← Auto-commit & push
│   └── anchor_on_solana.py    ← Solana memo anchor
├── strategies/
│   ├── claw5m_sniper.py       ← Session strategy
│   └── claw5m_sniper_manual.py ← Manual strategy
└── README.md
```

## 🛠️ Development

**Frontend local dev:**
```bash
cd frontend
npm run dev
# Visit http://localhost:3000
```

**API routes:**
- `GET /api/backtest/session` → returns trades.jsonl for session mode
- `GET /api/backtest/manual` → returns trades.jsonl for manual mode
- `GET /api/metadata/session` → returns metadata.json
- `GET /api/metadata/manual` → returns metadata.json

Data is fetched from GitHub raw URLs (configured in `frontend/pages/api/...`).

## 🤝 Contributing

Backtest logic lives in `strategies/`. Data generation in `scripts/generate_mock_data.py`.

## 📜 License

MIT — part of the ClawForge SaaS empire.

---

**Built with Freqtrade • Deployed on Vercel • Anchored on Solana**
