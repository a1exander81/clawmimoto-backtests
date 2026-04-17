'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'

export default function BacktestChart() {
  const [sessionData, setSessionData] = useState([])
  const [manualData, setManualData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBoth = async () => {
      try {
        const [sRes, mRes] = await Promise.all([
          fetch('/api/backtest/session?period=2026-03'),
          fetch('/api/backtest/manual?period=2026-03'),
        ])
        const s = await sRes.json()
        const m = await mRes.json()

        if (s.curve && s.curve.length) {
          setSessionData(s.curve.map(c => ({ ...c, mode: 'Session' })))
        }
        if (m.curve && m.curve.length) {
          setManualData(m.curve.map(c => ({ ...c, mode: 'Manual' })))
        }
      } catch (e) {
        console.error("Failed to load", e)
      } finally {
        setLoading(false)
      }
    }
    fetchBoth()
  }, [])

  if (loading) return <div style={{ padding: '2rem' }}>Loading chart...</div>

  // Merge data by date
  const allDates = [...new Set([...sessionData.map(d => d.date), ...manualData.map(d => d.date)])].sort()
  const merged = allDates.map(date => {
    const s = sessionData.find(d => d.date === date)
    const m = manualData.find(d => d.date === date)
    return {
      date,
      session: s?.equity || null,
      manual: m?.equity || null,
    }
  })

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={merged} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
          <YAxis stroke="#888" tick={{ fill: '#888' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Line type="monotone" dataKey="session" stroke="#00ff9d" name="Session Mode" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="manual" stroke="#ff6b6b" name="Manual Mode" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      {merged.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '1rem' }}>
          No backtest data yet. Run backtests and push to GitHub.
        </p>
      )}
    </div>
  )
}
