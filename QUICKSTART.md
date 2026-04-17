# Clawmimoto Backtests — Quickstart

## 1️⃣ Clone & Setup
git clone https://github.com/a1exander81/clawmimoto-backtests.git
cd clawmimoto-backtests

## 2️⃣ Generate Mock Data
python3 scripts/generate_mock_data.py

## 3️⃣ Deploy Frontend
cd frontend
npm install
npx vercel --prod

## 📁 Layout
clawmimoto-backtests/
├── backtests/2026-03/{session,manual}/
├── frontend/
├── scripts/
├── strategies/
└── README.md
