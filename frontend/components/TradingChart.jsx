import { useEffect, useRef, useState } from 'react'
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ShieldCheck, Crosshair, Zap, Calendar, AlertCircle, BarChart3 } from "lucide-react"

export default function TradingChart({ sessionMeta, manualMeta }) {
  const chartContainerRef = useRef(null)
  const [hoverData, setHoverData] = useState(null)
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [verification, setVerification] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!chartContainerRef.current || !sessionMeta || !manualMeta) return

    const initChart = async () => {
      const { createChart } = await import('lightweight-charts')
      
      const buildSeriesData = (meta) =>
        fetch(`/api/backtest/${meta.mode}`)
          .then(r => r.ok ? r.json() : [])
          .then(trades => {
            const lineData = []
            const markers = []

            trades.forEach((t) => {
              const time = new Date(t.entry_ts).getTime() / 1000
              lineData.push({ time, value: t.exit_price, ...t })
              
              if (t.is_win) {
                markers.push({
                  time,
                  position: 'aboveBar',
                  color: '#14f195',
                  shape: 'arrowUp',
                  text: 'WIN',
                })
              } else {
                markers.push({
                  time,
                  position: 'belowBar',
                  color: '#ff4d4d',
                  shape: 'arrowDown',
                  text: 'LOSS',
                })
              }
            })
            
            return { 
              line: lineData.sort((a, b) => a.time - b.time),
              markers: markers.sort((a, b) => a.time - b.time),
              trades: trades.sort((a, b) => a.entry_ts - b.entry_ts)
            }
          })

      const [sessionData, manualData] = await Promise.all([
        buildSeriesData(sessionMeta),
        buildSeriesData(manualMeta)
      ])

      // Find time range for candle fetching (buffer included)
      const allTrades = [...sessionData.trades, ...manualData.trades].sort((a, b) => a.entry_ts - b.entry_ts)
      if (allTrades.length === 0) return

      const startTime = allTrades[0].entry_ts - 3600000 // 1h before
      const endTime = allTrades[allTrades.length - 1].entry_ts + 3600000 // 1h after
      const symbol = allTrades[0].pair || "BTC-USDT"

      // Fetch real historical candles
      const candles = await fetch(`/api/candles?symbol=${symbol}&startTime=${startTime}&endTime=${endTime}`)
        .then(r => r.ok ? r.json() : [])

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { color: 'transparent' },
          textColor: 'rgba(139, 148, 158, 0.8)',
          fontFamily: "'Inter', sans-serif",
        },
        grid: {
          vertLines: { color: 'rgba(30, 35, 43, 0.05)' },
          horzLines: { color: 'rgba(30, 35, 43, 0.05)' },
        },
        crosshair: {
          mode: 1,
          vertLine: { width: 1, color: '#14f195', style: 2, labelVisible: false },
          horzLine: { width: 1, color: '#14f195', style: 2, labelVisible: false },
        },
        rightPriceScale: { borderColor: 'rgba(30, 35, 43, 0.1)', visible: true },
        timeScale: { borderColor: 'rgba(30, 35, 43, 0.1)', timeVisible: true },
      })

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#14f195',
        downColor: '#ff4d4d',
        borderVisible: false,
        wickUpColor: '#14f195',
        wickDownColor: '#ff4d4d',
      })

      const manualSeries = chart.addLineSeries({
        color: 'rgba(153, 69, 255, 0.4)',
        lineWidth: 2,
        title: 'Manual Baseline',
        lastValueVisible: false,
        priceLineVisible: false,
      })
      
      const sessionSeries = chart.addLineSeries({
        color: '#14f195',
        lineWidth: 3,
        title: 'Session Engine',
        lastValueVisible: true,
      })

      candleSeries.setData(candles)
      candleSeries.setMarkers(sessionData.markers)
      manualSeries.setData(manualData.line)
      sessionSeries.setData(sessionData.line)

      chart.timeScale().fitContent()

      // Hover Tooltip logic
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || param.point === undefined || !param.seriesData.get(sessionSeries)) {
          setHoverData(null)
          return
        }
        
        const data = sessionData.line.find(d => d.time === param.time)
        if (data) {
          setHoverData({
            time: new Date(param.time * 1000).toLocaleString(),
            price: data.value,
            profit: data.profit_pct,
            pair: data.pair
          })
        }
      })

      // Click for Verification Receipt
      chart.subscribeClick((param) => {
        if (!param.time || !param.seriesData.get(sessionSeries)) return
        const trade = sessionData.line.find(d => d.time === param.time)
        if (trade) {
          setSelectedTrade(trade)
          setIsDialogOpen(true)
          verifyTrade(trade)
        }
      })

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth })
        }
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
      }
    }

    const cleanup = initChart()
    return () => {
      cleanup.then(fn => fn && fn())
    }
  }, [sessionMeta, manualMeta])

  const verifyTrade = async (trade) => {
    setVerifying(true)
    setVerification(null)
    try {
      const resp = await fetch('/api/verify-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade })
      })
      const data = await resp.json()
      setVerification(data)
    } catch (e) {
      console.error("Verification failed", e)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="relative w-full h-[500px] group">
      {/* Tactical HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <HuDItem label="MAX DRAWDOWN" value={`${(sessionMeta?.max_drawdown_pct || 0).toFixed(2)}%`} color="text-destructive" />
        <HuDItem label="WIN RATIO" value={`${(sessionMeta?.win_rate || 0).toFixed(1)}%`} color="text-solana-cyan" />
        <HuDItem label="SHARPE" value={(sessionMeta?.sharpe_ratio || 0).toFixed(2)} />
      </div>

      {/* Hover Tooltip HUD */}
      {hoverData && (
        <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-md border border-solana-cyan/20 p-3 rounded-lg flex flex-col gap-1 min-w-[140px] shadow-lg shadow-solana-cyan/5">
          <div className="text-[10px] font-black uppercase text-muted-foreground">{hoverData.time}</div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span>PRICE:</span>
            <span className="text-foreground">{hoverData.price.toFixed(4)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span>ROI:</span>
            <span className={hoverData.profit > 0 ? "text-solana-cyan" : "text-destructive"}>
              {hoverData.profit.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Verification Receipt Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#030508] border-border/40 text-foreground max-w-sm shadow-2xl shadow-solana-cyan/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-black">
              <ShieldCheck className={cn("h-4 w-4", verification?.isEntryPossible ? "text-solana-cyan" : "text-solana-purple")} />
              Trade Verification
            </DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
              Chain-Linked | ID: {selectedTrade?.verifiable_id}
            </DialogDescription>
          </DialogHeader>

          {verifying ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-surface-lv3 border-t-solana-cyan"></div>
              <span className="text-[10px] font-mono tracking-widest animate-pulse">FETCHING HISTORICAL TRUTH...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/10">
                <ReceiptItem label="PAIR" value={selectedTrade?.pair} icon={<Crosshair className="h-3 w-3" />} />
                <ReceiptItem label="TIMESTAMP" value={new Date(selectedTrade?.entry_ts).toLocaleTimeString()} icon={<Calendar className="h-3 w-3" />} />
                <ReceiptItem label="ENTRY PRICE" value={selectedTrade?.entry_price.toFixed(4)} />
                <ReceiptItem label="EXIT PRICE" value={selectedTrade?.exit_price.toFixed(4)} />
              </div>

              {/* Real Historical Execution Section */}
              <div className="bg-surface-lv2/50 rounded-lg p-3 border border-border/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> Historical Context
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-solana-cyan/10 text-solana-cyan">via {verification?.source}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <ReceiptItem label="MARKET HIGH" value={verification?.marketHigh?.toFixed(4)} />
                  <ReceiptItem label="MARKET LOW" value={verification?.marketLow?.toFixed(4)} />
                </div>

                <div className="pt-2 border-t border-border/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">Slippage Delta</span>
                    <span className={cn("text-xs font-mono font-bold", Math.abs(verification?.slippagePct) > 0.1 ? "text-destructive" : "text-solana-cyan")}>
                      {verification?.slippagePct > 0 ? '+' : ''}{verification?.slippagePct}%
                    </span>
                  </div>
                  {verification?.isEntryPossible ? (
                    <div className="flex items-center gap-1 text-[9px] text-solana-cyan font-black">
                      <ShieldCheck className="h-3 w-3" /> VERIFIED
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[9px] text-destructive font-black">
                      <AlertCircle className="h-3 w-3" /> MISMATCH
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[9px] text-center text-muted-foreground font-mono opacity-40">
                BLOCK CONTEXT: {selectedTrade?.verifiable_id?.toUpperCase()}...0x8F
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div ref={chartContainerRef} className="w-full h-full cursor-crosshair" />
    </div>
  )
}

function HuDItem({ label, value, color = "text-foreground" }) {
  return (
    <div className="bg-background/40 backdrop-blur-sm border border-border/50 px-3 py-1.5 rounded flex flex-col leading-tight">
      <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/80">{label}</span>
      <span className={cn("text-xs font-mono font-bold", color)}>{value}</span>
    </div>
  )
}

function ReceiptItem({ label, value, icon, color = "text-foreground" }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-extrabold uppercase tracking-widest scale-90 origin-left">
        {icon}
        {label}
      </div>
      <div className={cn("text-xs font-mono font-black", color)}>{value}</div>
    </div>
  )
}
