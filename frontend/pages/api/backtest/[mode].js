import { NextResponse } from 'next/server'

const GITHUB_RAW = "https://raw.githubusercontent.com/a1exander81/clawmimoto-backtests/main"

export async function GET(req, { params }) {
  const { mode } = params  // "session" or "manual"
  const period = req.nextUrl.searchParams.get('period') || '2026-03'
  const url = `${GITHUB_RAW}/backtests/${period}/${mode}/trades.jsonl`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Not found')
    const text = await res.text()
    const lines = text.trim().split('\n').filter(Boolean)
    const trades = lines.map(line => JSON.parse(line))

    // Build equity curve
    let balance = 10000
    const curve = []
    for (const t of trades) {
      balance += t.pnl_abs
      curve.push({
        date: t.timestamp.split('T')[0],
        equity: balance,
        pnl: t.pnl_abs,
      })
    }

    return NextResponse.json({ trades, curve })
  } catch (e) {
    // Return empty/demo data until backtests are run
    return NextResponse.json({
      trades: [],
      curve: [],
      message: 'No data yet — backtests pending',
    })
  }
}
