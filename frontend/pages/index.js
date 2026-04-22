import { useState, useEffect } from 'react'
import Head from 'next/head'

const GITHUB_RAW = process.env.NEXT_PUBLIC_GITHUB_RAW || 'https://raw.githubusercontent.com/a1exander81/clawmimoto-backtests/main'

async function fetchLiveData() {
  const period = new Date().toISOString().slice(0, 7)
  const base = `${GITHUB_RAW}/backtests/${period}/live`
  try {
    const [metaRes, tradesRes] = await Promise.all([
      fetch(`${base}/metadata.json`),
      fetch(`${base}/trades.jsonl`)
    ])
    const meta = metaRes.ok ? await metaRes.json() : null
    const tradesText = tradesRes.ok ? await tradesRes.text() : ''
    const trades = tradesText.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
    return { meta, trades }
  } catch (e) {
    return { meta: null, trades: [] }
  }
}

function StatCard({ label, value, sub, color = '#00D4AA', icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = color}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#475569' }}>{sub}</div>}
    </div>
  )
}

function TradeRow({ trade, index }) {
  const isWin = trade.win
  const pnl = trade.profit_pct?.toFixed(2)
  const sessionColors = {
    london: '#3B82F6',
    ny: '#8B5CF6',
    pre_london: '#F59E0B',
    manual: '#64748B'
  }
  const sessionColor = sessionColors[trade.session] || '#64748B'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
      gap: 12,
      padding: '0.875rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      alignItems: 'center',
      fontSize: '0.875rem',
      animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          background: isWin ? 'rgba(0,212,170,0.15)' : 'rgba(255,59,92,0.15)',
          color: isWin ? '#00D4AA' : '#FF3B5C',
          padding: '2px 8px',
          borderRadius: 6,
          fontSize: '0.7rem',
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace'
        }}>{trade.direction}</span>
        <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>
          {trade.pair?.replace('/USDT:USDT', '')}
        </span>
      </div>
      <div style={{ color: sessionColor, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{trade.session?.replace('_', ' ')}</div>
      <div style={{ color: isWin ? '#00D4AA' : '#FF3B5C', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{isWin ? '+' : ''}{pnl}%</div>
      <div style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>{trade.leverage}x</div>
      <div style={{ color: '#94a3b8' }}>{trade.duration_min}m</div>
      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{trade.exit_reason?.replace('_', ' ')}</div>
    </div>
  )
}

function EquityCurve({ trades }) {
  if (!trades.length) return null
  let cumulative = 0
  const points = trades.map((t, i) => {
    cumulative += t.profit_pct || 0
    return { x: i, y: cumulative }
  })
  const minY = Math.min(0, ...points.map(p => p.y))
  const maxY = Math.max(0, ...points.map(p => p.y))
  const range = maxY - minY || 1
  const w = 600, h = 120
  const toX = x => (x / (points.length - 1 || 1)) * w
  const toY = y => h - ((y - minY) / range) * h
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x)} ${toY(p.y)}`).join(' ')
  const isPositive = points[points.length - 1]?.y >= 0
  const color = isPositive ? '#00D4AA' : '#FF3B5C'
  return (
    <div style={{ padding: '1rem 0' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 120 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${pathD} L ${w} ${h} L 0 ${h} Z`} fill="url(#eq)"/>
        <path d={pathD} stroke={color} strokeWidth="2" fill="none"/>
        <line x1="0" y1={toY(0)} x2={w} y2={toY(0)} stroke="rgba(255,255,255,0.1)" strokeDasharray="4"/>
      </svg>
    </div>
  )
}

function SessionBreakdown({ sessions }) {
  if (!sessions) return null
  const items = [
    { key: 'pre_london', label: 'Pre-London', color: '#F59E0B', emoji: '🌅' },
    { key: 'london', label: 'London', color: '#3B82F6', emoji: '🇬🇧' },
    { key: 'ny', label: 'New York', color: '#8B5CF6', emoji: '🗽' },
    { key: 'manual', label: 'Manual', color: '#64748B', emoji: '🎯' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {items.map(({ key, label, color, emoji }) => {
        const s = sessions[key]
        if (!s) return null
        return (
          <div key={key} style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${color}33`,
            borderRadius: 12,
            padding: '1rem',
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{emoji}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
            <div style={{ color, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{s.count} trades</div>
            <div style={{ color: s.total_pnl >= 0 ? '#00D4AA' : '#FF3B5C', fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace' }}>
              {s.total_pnl >= 0 ? '+' : ''}{s.total_pnl?.toFixed(2)}%
            </div>
            <div style={{ color: '#475569', fontSize: '0.75rem' }}>{s.win_rate?.toFixed(0)}% WR</div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const [meta, setMeta] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLiveData().then(({ meta, trades }) => {
      setMeta(meta)
      setTrades(trades)
      setLoading(false)
    })
  }, [])

  const pnlColor = meta?.total_pnl_pct >= 0 ? '#00D4AA' : '#FF3B5C'

  return (
    <>
      <Head>
        <title>ClawForge — Live Trading Ledger</title>
        <meta name="description" content="Real-time trading performance dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080C14; color: #e2e8f0; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1rem' }}>
        <header style={{
          padding: '2rem 0 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }}>🦅</span>
              <h1 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FF6B35, #FF3B5C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>ClawForge</h1>
            </div>
            <p style={{ color: '#475569', fontSize: '0.875rem' }}>Live Trading Ledger — Bybit Perpetual Futures</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D4AA', animation: 'pulse 2s infinite' }}/>
            <span style={{ color: '#00D4AA', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>DRY RUN ACTIVE</span>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
            <p>Loading live data...</p>
          </div>
        ) : !meta ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <p>No data available yet.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: '2rem', animation: 'fadeIn 0.4s ease' }}>
              <StatCard label="Total P&L" value={`${meta.total_pnl_pct >= 0 ? '+' : ''}${meta.total_pnl_pct?.toFixed(2)}%`} sub={`${meta.total_trades} trades`} color={pnlColor} icon="💰"/>
              <StatCard label="Win Rate" value={`${meta.win_rate?.toFixed(1)}%`} sub={`Best: +${meta.best_trade?.toFixed(2)}%`} color="#FF6B35" icon="🎯"/>
              <StatCard label="Sharpe Ratio" value={meta.sharpe_ratio?.toFixed(2)} sub="Risk-adjusted" color="#8B5CF6" icon="📐"/>
              <StatCard label="Max Drawdown" value={`-${meta.max_drawdown?.toFixed(2)}%`} sub={`Avg lev: ${meta.avg_leverage?.toFixed(0)}x`} color="#FF3B5C" icon="📉"/>
              <StatCard label="Avg Duration" value={`${meta.avg_duration_min?.toFixed(0)}m`} sub="Per trade" color="#F59E0B" icon="⏱"/>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', color: '#94a3b8' }}>Equity Curve</h2>
                <span style={{ color: pnlColor, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>{meta.period}</span>
              </div>
              <EquityCurve trades={trades} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', animation: 'fadeIn 0.6s ease' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', color: '#94a3b8', marginBottom: '1rem' }}>Session Breakdown</h2>
                <SessionBreakdown sessions={meta.sessions} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', animation: 'fadeIn 0.6s ease' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', color: '#94a3b8', marginBottom: '1rem' }}>Strategy Info</h2>
                {[
                  ['Strategy', 'Claw5MHybrid'],
                  ['Exchange', 'Bybit Perpetuals'],
                  ['Timeframe', '5M + 1H + 4H'],
                  ['Mode', 'Dry Run'],
                  ['Generated', meta.generated_at?.slice(0,10)],
                  ['Worst Trade', `${meta.worst_trade?.toFixed(2)}%`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.875rem' }}>
                    <span style={{ color: '#475569' }}>{k}</span>
                    <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', marginBottom: '2rem', animation: 'fadeIn 0.7s ease', overflowX: 'auto' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', color: '#94a3b8', marginBottom: '1rem' }}>Trade History ({trades.length})</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: 12, padding: '0.5rem 1rem', fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4, minWidth: 500 }}>
                <span>Pair</span><span>Session</span><span>P&L</span><span>Leverage</span><span>Duration</span><span>Exit</span>
              </div>
              <div style={{ minWidth: 500 }}>
                {trades.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#334155' }}>No trades yet</div>
                ) : (
                  [...trades].reverse().map((t, i) => <TradeRow key={t.trade_id || i} trade={t} index={i} />)
                )}
              </div>
            </div>

            <footer style={{ textAlign: 'center', padding: '2rem 0', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#334155', fontSize: '0.75rem' }}>
              <p style={{ marginBottom: 4 }}>🦅 Powered by <strong style={{ color: '#FF6B35' }}>ClawForge</strong> • Engine: Freqtrade • Exchange: Bybit</p>
              <p>Past performance does not guarantee future results. Trading carries significant risk.</p>
            </footer>
          </>
        )}
      </div>
    </>
  )
}
