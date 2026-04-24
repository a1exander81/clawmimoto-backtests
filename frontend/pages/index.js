

import { useState, useEffect } from 'react'
import Head from 'next/head'

const SUPABASE_URL = "https://aauypnqsmyxzacchbiya.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdXlwbnFzbXl4emFjY2hiaXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Nzg2MDUsImV4cCI6MjA5MjU1NDYwNX0.H8RbnYbUb55jr0RnOVpca2wkYgv_jKs8NuUHjruqWls"

function calcSharpe(trades) {
  if (!trades.length) return 0
  const returns = trades.map(t => t.profit_pct || 0)
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length
  const std = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / returns.length)
  return std === 0 ? 0 : (avg / std) * Math.sqrt(252)
}

function calcMaxDrawdown(trades) {
  let peak = 0, maxDD = 0, cum = 0
  trades.forEach(t => {
    cum += t.profit_pct || 0
    if (cum > peak) peak = cum
    const dd = peak - cum
    if (dd > maxDD) maxDD = dd
  })
  return maxDD
}

function calcAvgDuration(trades) {
  const withDates = trades.filter(t => t.open_date && t.close_date)
  if (!withDates.length) return 0
  const avg = withDates.reduce((sum, t) => {
    const mins = (new Date(t.close_date) - new Date(t.open_date)) / 60000
    return sum + mins
  }, 0) / withDates.length
  return avg
}

async function fetchLiveData() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/trades?is_open=eq.false&order=close_date.desc&limit=200`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    )
    const trades = res.ok ? await res.json() : []
    const wins = trades.filter(t => (t.profit_ratio||0) > 0).length
    const losses = trades.filter(t => (t.profit_ratio||0) <= 0).length
    const total_pnl = trades.reduce((sum,t) => sum + (t.profit_ratio||0), 0)
    const normalized = trades.map(t => ({
      ...t,
      profit_pct: (t.profit_ratio||0)*100,
      win: (t.profit_ratio||0) > 0,
    }))
    const sharpe = calcSharpe(normalized)
    const maxDD = calcMaxDrawdown(normalized)
    const avgDur = calcAvgDuration(normalized)
    const bestTrade = Math.max(...normalized.map(t => t.profit_pct), 0)
    const worstTrade = Math.min(...normalized.map(t => t.profit_pct), 0)
    const meta = {
      total_trades: trades.length,
      winning_trades: wins,
      losing_trades: losses,
      total_pnl_pct: total_pnl * 100,
      avg_pnl_pct: trades.length > 0 ? (total_pnl/trades.length)*100 : 0,
      win_rate: trades.length > 0 ? (wins/trades.length*100) : 0,
      sharpe_ratio: sharpe,
      max_drawdown: maxDD,
      avg_duration_min: avgDur,
      best_trade: bestTrade,
      worst_trade: worstTrade,
      last_updated: new Date().toISOString()
    }
    return { meta, trades: normalized }
  } catch(e) {
    console.error("Supabase error:", e)
    return { meta: null, trades: [] }
  }
}

function StatCard({ label, value, sub, color = '#00D4AA', icon }) {
  const isPositive = typeof value === 'string' && value.startsWith('+')
  const displayColor = isPositive ? '#00D4AA' : color
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 20,
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px ${displayColor}44`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
    }}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: displayColor, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#475569' }}>{sub}</div>}
    </div>
  )
}

function TradeRow({ trade, index }) {
  const isWin = (trade.profit_ratio||0) > 0
  const pnl = trade.profit_pct?.toFixed(2)
  const sessionColors = {
    london: '#3B82F6', ny: '#8B5CF6',
    pre_london: '#F59E0B', manual: '#64748B'
  }
  const sessionColor = sessionColors[trade.session] || '#64748B'
  const dur = trade.open_date && trade.close_date
    ? Math.round((new Date(trade.close_date) - new Date(trade.open_date)) / 60000)
    : '—'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
      gap: 12,
      padding: '0.75rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      alignItems: 'center',
      fontSize: '0.82rem',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          background: isWin ? 'rgba(0,212,170,0.15)' : 'rgba(255,59,92,0.15)',
          color: isWin ? '#00D4AA' : '#FF3B5C',
          padding: '2px 7px', borderRadius: 5,
          fontSize: '0.65rem', fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace'
        }}>{trade.direction}</span>
        <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
          {trade.pair?.replace('/USDT:USDT','').replace('USDT','')}
        </span>
      </div>
      <div style={{ color: sessionColor, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {trade.session?.replace('_',' ') || '—'}
      </div>
      <div style={{ color: isWin ? '#00D4AA' : '#FF3B5C', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
        {isWin ? '+' : ''}{pnl}%
      </div>
      <div style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
        {trade.leverage ? `${trade.leverage}x` : '—'}
      </div>
      <div style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
        {dur !== '—' ? `${dur}m` : '—'}
      </div>
      <div style={{ color: '#64748b', fontSize: '0.68rem' }}>
        {trade.exit_reason?.replace(/_/g,' ') || '—'}
      </div>
    </div>
  )
}

function EquityCurve({ trades }) {
  if (!trades.length) return null
  const ordered = [...trades].reverse()
  let cum = 0
  const points = ordered.map((t,i) => { cum += t.profit_pct||0; return { x:i, y:cum } })
  const minY = Math.min(0,...points.map(p=>p.y))
  const maxY = Math.max(0,...points.map(p=>p.y))
  const range = maxY - minY || 1
  const w=600,h=100
  const toX = x => (x/(points.length-1||1))*w
  const toY = y => h-((y-minY)/range)*h
  const pathD = points.map((p,i) => `${i===0?'M':'L'} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`).join(' ')
  const last = points[points.length-1]?.y||0
  const color = last >= 0 ? '#00D4AA' : '#FF3B5C'
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:100, display:'block' }}>
      <defs>
        <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${w} ${h} L 0 ${h} Z`} fill="url(#eq)"/>
      <path d={pathD} stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round"/>
      <line x1="0" y1={toY(0).toFixed(1)} x2={w} y2={toY(0).toFixed(1)} stroke="rgba(255,255,255,0.08)" strokeDasharray="4"/>
    </svg>
  )
}

const PAGE_SIZE = 20

export default function Dashboard() {
  const [meta, setMeta] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetchLiveData().then(({ meta, trades }) => {
      setMeta(meta)
      setTrades(trades || [])
      setLoading(false)
    })
  }, [])

  const pnlColor = (meta?.total_pnl_pct||0) >= 0 ? '#00D4AA' : '#FF3B5C'
  const totalPages = Math.ceil(trades.length / PAGE_SIZE)
  const pageTrades = trades.slice(page * PAGE_SIZE, (page+1) * PAGE_SIZE)

  const glassPanel = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 20,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
  }

  return (
    <>
      <Head>
        <title>Claw Trader — Live Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      </Head>
      <style jsx global>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#03050D;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:#03050D}
        ::-webkit-scrollbar-thumb{background:#FF5500;border-radius:2px}
      `}</style>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 1.25rem' }}>

        {/* HEADER */}
        <header style={{ padding:'2rem 0 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:'2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
              <span style={{ fontSize:32 }}>🦞</span>
              <h1 style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'clamp(1.8rem,4vw,2.4rem)', letterSpacing:'0.08em', background:'linear-gradient(135deg,#FF5500,#FF8040)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                CLAW TRADER
              </h1>
            </div>
            <p style={{ color:'#475569', fontSize:'0.82rem', fontFamily:'JetBrains Mono,monospace' }}>Live Trading Ledger — Bybit Perpetual Futures</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#00D4AA', animation:'pulse 2s infinite' }}/>
            <span style={{ color:'#00D4AA', fontSize:'0.72rem', fontFamily:'JetBrains Mono,monospace' }}>DRY RUN ACTIVE</span>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'#475569' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>⚡</div>
            <p>Loading live data...</p>
          </div>
        ) : !meta || !trades.length ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'#475569' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📊</div>
            <p>No data available yet.</p>
          </div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:12, marginBottom:'2rem', animation:'fadeIn 0.4s ease' }}>
              <StatCard label="Total P&L" value={`${(meta.total_pnl_pct||0)>=0?'+':''}${(meta.total_pnl_pct||0).toFixed(2)}%`} sub={`${meta.total_trades} trades`} color={pnlColor} icon="💰"/>
              <StatCard label="Win Rate" value={`${(meta.win_rate||0).toFixed(1)}%`} sub={`${meta.winning_trades}W / ${meta.losing_trades}L`} color="#FF5500" icon="🏆"/>
              <StatCard label="Sharpe Ratio" value={(meta.sharpe_ratio||0).toFixed(2)} sub="Risk-adjusted return" color="#8B5CF6" icon="📐"/>
              <StatCard label="Max Drawdown" value={`-${(meta.max_drawdown||0).toFixed(2)}%`} sub="Peak to trough" color="#FF3B5C" icon="📉"/>
              <StatCard label="Avg Duration" value={`${Math.round(meta.avg_duration_min||0)}m`} sub="Per trade" color="#F59E0B" icon="⏱"/>
            </div>

            {/* EQUITY CURVE */}
            <div style={{ ...glassPanel, padding:'1.5rem', marginBottom:'1.5rem', animation:'fadeIn 0.5s ease' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <h2 style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'1.1rem', letterSpacing:'0.05em', color:'#94a3b8' }}>EQUITY CURVE</h2>
                <span style={{ color:pnlColor, fontFamily:'JetBrains Mono,monospace', fontSize:'0.8rem' }}>
                  {(meta.total_pnl_pct||0)>=0?'+':''}{(meta.total_pnl_pct||0).toFixed(2)}%
                </span>
              </div>
              <EquityCurve trades={trades}/>
            </div>

            {/* STRATEGY INFO */}
            <div style={{ ...glassPanel, padding:'1.5rem', marginBottom:'1.5rem', animation:'fadeIn 0.6s ease' }}>
              <h2 style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'1.1rem', letterSpacing:'0.05em', color:'#94a3b8', marginBottom:'1rem' }}>STRATEGY INFO</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:8 }}>
                {[
                  ['Strategy','Claw5MHybrid'],
                  ['Exchange','Bybit Perpetuals'],
                  ['Timeframe','5M + 1H + 4H'],
                  ['Mode','Dry Run'],
                  ['Best Trade',`+${(meta.best_trade||0).toFixed(2)}%`],
                  ['Worst Trade',`${(meta.worst_trade||0).toFixed(2)}%`],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.82rem' }}>
                    <span style={{ color:'#475569' }}>{k}</span>
                    <span style={{ color: k==='Best Trade'?'#00D4AA': k==='Worst Trade'?'#FF3B5C':'#94a3b8', fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TRADE HISTORY */}
            <div style={{ ...glassPanel, padding:'1.5rem', marginBottom:'2rem', animation:'fadeIn 0.7s ease' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
                <h2 style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'1.1rem', letterSpacing:'0.05em', color:'#94a3b8' }}>
                  TRADE HISTORY ({trades.length})
                </h2>
                {totalPages > 1 && (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
                      style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:page===0?'#334155':'#e2e8f0', borderRadius:8, width:32, height:32, cursor:page===0?'not-allowed':'pointer', fontSize:14 }}>←</button>
                    <span style={{ color:'#64748b', fontFamily:'JetBrains Mono,monospace', fontSize:'0.75rem' }}>
                      {page+1} / {totalPages}
                    </span>
                    <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page===totalPages-1}
                      style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:page===totalPages-1?'#334155':'#e2e8f0', borderRadius:8, width:32, height:32, cursor:page===totalPages-1?'not-allowed':'pointer', fontSize:14 }}>→</button>
                  </div>
                )}
              </div>
              <div style={{ overflowX:'auto' }}>
                <div style={{ minWidth:520 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr', gap:12, padding:'0.5rem 1rem', fontSize:'0.65rem', color:'#334155', textTransform:'uppercase', letterSpacing:'0.1em', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:4, fontFamily:'JetBrains Mono,monospace' }}>
                    <span>Pair</span><span>Session</span><span>P&L</span><span>Leverage</span><span>Duration</span><span>Exit</span>
                  </div>
                  {pageTrades.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'2rem', color:'#334155' }}>No trades on this page</div>
                  ) : (
                    pageTrades.map((t,i) => <TradeRow key={t.trade_id||i} trade={t} index={i}/>)
                  )}
                </div>
              </div>
              {totalPages > 1 && (
                <div style={{ textAlign:'center', marginTop:'1rem', color:'#334155', fontSize:'0.72rem', fontFamily:'JetBrains Mono,monospace' }}>
                  Showing {page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE, trades.length)} of {trades.length} trades
                </div>
              )}
            </div>

            <footer style={{ textAlign:'center', padding:'2rem 0', borderTop:'1px solid rgba(255,255,255,0.06)', color:'#334155', fontSize:'0.72rem' }}>
              <p style={{ marginBottom:4 }}>🦞 Powered by <strong style={{ color:'#FF5500' }}>Claw Trader</strong> · Engine: Freqtrade · Exchange: Bybit</p>
              <p>Past performance does not guarantee future results. Trading carries significant risk.</p>
            </footer>
          </>
        )}
      </div>
    </>
  )
}
