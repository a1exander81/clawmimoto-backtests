'use client'

import { useState, useEffect } from 'react'

export default function ComparisonTable() {
  const [session, setSession] = useState(null)
  const [manual, setManual] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, mRes] = await Promise.all([
          fetch('/api/metadata/session'),
          fetch('/api/metadata/manual'),
        ])
        const s = await sRes.json()
        const m = await mRes.json()
        setSession(s)
        setManual(m)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  if (!session || !manual) return <div>Loading...</div>

  const rows = [
    { label: "Total Trades", session: session.total_trades, manual: manual.total_trades },
    { label: "Total PnL (USDT)", session: `$${session.total_pnl.toFixed(2)}`, manual: `$${manual.total_pnl.toFixed(2)}` },
    { label: "Win Rate", session: `${session.win_rate.toFixed(1)}%`, manual: `${manual.win_rate.toFixed(1)}%` },
    { label: "Sharpe Ratio", session: "—", manual: "—" }, // TODO
    { label: "Max Drawdown", session: "—", manual: "—" },
  ]

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #333' }}>
          <th style={{ textAlign: 'left', padding: '0.75rem' }}>Metric</th>
          <th style={{ textAlign: 'right', padding: '0.75rem', color: '#00ff9d' }}>Session Mode</th>
          <th style={{ textAlign: 'right', padding: '0.75rem', color: '#ff6b6b' }}>Manual Mode</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #222' }}>
            <td style={{ padding: '0.75rem' }}>{row.label}</td>
            <td style={{ textAlign: 'right', padding: '0.75rem' }}>{row.session}</td>
            <td style={{ textAlign: 'right', padding: '0.75rem' }}>{row.manual}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
