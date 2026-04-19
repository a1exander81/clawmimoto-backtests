import { useState, useEffect } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ShieldCheck } from "lucide-react"

export default function ComparisonTable({ session, manual }) {
  const [sessionHistory, setSessionHistory] = useState([])
  const [manualHistory, setManualHistory] = useState([])

  useEffect(() => {
    if (!session || !manual) return

    const fetchHistory = (mode) =>
      fetch(`/api/backtest/${mode}`)
        .then(r => r.ok ? r.json() : [])
        .then(trades => {
          let cumulative = 0
          return trades.map(t => {
            cumulative += t.profit_pct / 100 || 0
            return { value: cumulative }
          })
        })

    Promise.all([
      fetchHistory('session'),
      fetchHistory('manual')
    ]).then(([s, m]) => {
      setSessionHistory(s)
      setManualHistory(m)
    })
  }, [session, manual])

  if (!session || !manual) return null
  
  const metrics = [
    { key: 'win_rate', label: 'Win Rate', suffix: '%' },
    { key: 'total_pnl_pct', label: 'Net Profit', suffix: '%', type: 'pnl' },
    { key: 'max_drawdown_pct', label: 'Max Drawdown', suffix: '%', type: 'negative' },
    { key: 'sharpe_ratio', label: 'Sharpe Index' },
    { key: 'total_trades', label: 'Positions' },
  ]

  const formatValue = (val) => {
    if (val === undefined || val === null) return 'N/A'
    return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Metric Analysis</TableHead>
            <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Session</TableHead>
            <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Manual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map(m => {
            const sVal = session[m.key]
            const mVal = manual[m.key]
            return (
              <TableRow key={m.key} className="border-border/50 hover:bg-solana-cyan/5 transition-colors group">
                <TableCell className="py-3 text-[11px] font-medium text-muted-foreground group-hover:text-foreground flex items-center gap-2">
                  {m.type === 'pnl' && <ShieldCheck className="h-3 w-3 text-solana-cyan opacity-40 group-hover:opacity-100" />}
                  {m.label}
                </TableCell>
                <TableCell className={cn(
                  "text-right py-3 font-mono text-xs font-bold",
                  m.type === 'pnl' ? (sVal > 0 ? "text-solana-cyan" : "text-destructive") : "text-foreground"
                )}>
                  {formatValue(sVal)}{m.suffix || ''}
                </TableCell>
                <TableCell className={cn(
                  "text-right py-3 font-mono text-xs font-bold opacity-60 group-hover:opacity-100 transition-opacity",
                  m.type === 'pnl' ? (mVal > 0 ? "text-solana-cyan" : "text-destructive") : "text-foreground"
                )}>
                  {formatValue(mVal)}{m.suffix || ''}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="pt-4 border-t border-border/20">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Integrity Benchmarks</h3>
        <div className="grid grid-cols-2 gap-4">
          <SparkCard label="Session Strategy" data={sessionHistory} color="#14f195" />
          <SparkCard label="Manual Baseline" data={manualHistory} color="#9945ff" />
        </div>
      </div>
    </div>
  )
}

function SparkCard({ label, data, color }) {
  return (
    <div className="bg-[#0b0e12]/40 border border-border/50 p-3 rounded-lg hover:border-solana-cyan/30 transition-all duration-300">
      <div className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60 mb-2">{label}</div>
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis hide domain={['auto', 'auto']} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
