import { NextResponse } from 'next/server'

const GITHUB_RAW = "https://raw.githubusercontent.com/a1exander81/clawmimoto-backtests/main"

export async function GET(req, { params }) {
  const { mode } = params
  const period = req.nextUrl.searchParams.get('period') || '2026-03'
  const url = `${GITHUB_RAW}/backtests/${period}/${mode}/metadata.json`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Not found')
    const meta = await res.json()
    return NextResponse.json(meta)
  } catch (e) {
    return NextResponse.json({
      strategy: mode === 'session' ? 'Claw5MSniper' : 'Claw5MSniperManual',
      period_start: period,
      period_end: period,
      total_trades: 0,
      total_pnl: 0,
      win_rate: 0,
      message: 'No metadata yet — run backtest first',
    })
  }
}
