import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'

const createChart = dynamic(() => import('lightweight-charts').then(mod => mod.createChart), { ssr: false })

export default function TradingChart({ sessionMeta, manualMeta }) {
  const chartContainerRef = useRef(null)
useEffect(() => {
    if (!chartContainerRef.current || !sessionMeta || !manualMeta) return
    const initChart = async () => {
      const createChartLib = await createChart
      const buildSeries = (meta) =>
        fetch(`/api/backtest/${meta.mode}`).then(r => r.text()).then(text => {
          const trades = text.split('\n').filter(Boolean).map(JSON.parse)
          const df = []
          trades.forEach(t => {
            const date = new Date(t.entry_ts)
            date.setHours(0, 0, 0, 0)
            const existing = df.find(d => d.time.getTime() === date.getTime())
            if (!existing) {
              df.push({
                time: date,
                open: t.entry_price,
                high: t.entry_price,
                low: t.entry_price,
                close: t.exit_price,
                volume: 1,
              })
            } else {
              existing.high = Math.max(existing.high, t.entry_price, t.exit_price)
              existing.low = Math.min(existing.low, t.entry_price, t.exit_price)
              existing.close = t.exit_price
              existing.volume += 1
            }
          })
          return df.sort((a, b) => a.time - b.time)
        })
      const [sessionData, manualData] = await Promise.all([buildSeries(sessionMeta), buildSeries(manualMeta)])
      const chart = createChartLib(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: { background: { color: '#0f172a' }, textColor: '#e2e8f0' },
        grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#334155' },
        timeScale: { borderColor: '#334155', timeVisible: true },
      })
      const sessionSeries = chart.addCandlestickSeries({
        title: 'Session (green)',
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
      })
      sessionSeries.setData(sessionData)
      const manualSeries = chart.addCandlestickSeries({
        title: 'Manual (orange)',
        upColor: '#f59e0b',
        downColor: '#8b5cf6',
        borderDownColor: '#8b5cf6',
        borderUpColor: '#f59e0b',
        wickDownColor: '#8b5cf6',
        wickUpColor: '#f59e0b',
      })
      manualSeries.setData(manualData)
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        scaleMargins: { top: 0.8, bottom: 0 },
      })
      const volumeData = sessionData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
      }))
      volumeSeries.setData(volumeData)
      chart.timeScale().fitContent()
    }
    initChart()
    return () => { if (chartContainerRef.current) chartContainerRef.current.remove() }
  }, [sessionMeta, manualMeta])
  return (
    <div className={styles.chartContainer}>
      <div ref={chartContainerRef} className={styles.chart} />
      <div className={styles.legend}>
        <span><span className={styles.dotGreen}>●</span> Session</span>
        <span><span className={styles.dotOrange}>●</span> Manual</span>
      </div>
    </div>
  )
}
