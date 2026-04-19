import { useEffect, useRef } from 'react'
import styles from '../styles/Home.module.css'

export default function TradingChart({ sessionMeta, manualMeta }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartContainerRef.current || !sessionMeta || !manualMeta) return

    let cleanup = null

    const initChart = async () => {
      // ✅ FIX 1: Import createChart directly — never use next/dynamic on a function
      const { createChart } = await import('lightweight-charts')

      // ✅ FIX 2: Helper to build EQUITY CURVE (cumulative PnL %), not raw price
      const buildEquityCurve = async (mode) => {
        const res = await fetch(`/api/backtest/${mode}`)
        if (!res.ok) throw new Error(`Failed to fetch ${mode} trades`)
        const text = await res.text()

        const trades = text
          .split('\n')
          .filter(Boolean)
          .map(line => JSON.parse(line))
          .sort((a, b) => new Date(a.exit_ts || a.entry_ts) - new Date(b.exit_ts || b.entry_ts))

        // ✅ FIX 3: Build cumulative equity as % growth from trade PnL
        let cumulative = 0
        const curve = []

        trades.forEach(t => {
          const ts = new Date(t.exit_ts || t.entry_ts)
          // Normalize to day bucket (midnight UTC)
          const dayTs = Math.floor(ts.setUTCHours(0, 0, 0, 0) / 1000) // ✅ FIX 4: seconds, not ms

          const pnlPct = t.profit_pct ?? ((t.exit_price - t.entry_price) / t.entry_price * 100)
          cumulative += pnlPct

          const existing = curve.find(d => d.time === dayTs)
          if (existing) {
            existing.value = cumulative // overwrite with latest cumulative for that day
          } else {
            curve.push({ time: dayTs, value: parseFloat(cumulative.toFixed(4)) })
          }
        })

        return curve.sort((a, b) => a.time - b.time)
      }

      const [sessionCurve, manualCurve] = await Promise.all([
        buildEquityCurve(sessionMeta.mode || 'session'),
        buildEquityCurve(manualMeta.mode || 'manual'),
      ])

      // ✅ FIX 5: Guard — don't render if no data
      if (!sessionCurve.length && !manualCurve.length) {
        console.warn('No equity curve data to render')
        return
      }

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { color: 'transparent' },
          textColor: '#8b949e',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        },
        grid: {
          vertLines: { color: 'rgba(30, 35, 43, 0.4)' },
          horzLines: { color: 'rgba(30, 35, 43, 0.4)' },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: '#14f195',
            style: 2,
            labelBackgroundColor: '#14f195',
          },
          horzLine: {
            width: 1,
            color: '#14f195',
            style: 2,
            labelBackgroundColor: '#14f195',
          },
        },
        rightPriceScale: {
          borderColor: 'rgba(30, 35, 43, 0.8)',
          visible: true,
        },
        timeScale: {
          borderColor: 'rgba(30, 35, 43, 0.8)',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      })

      // Store ref for resize handler
      chartRef.current = chart

      const manualSeries = chart.addLineSeries({
        color: '#dc1fff',
        lineWidth: 2,
        title: 'Manual Baseline',
        priceLineVisible: false,
        lastValueVisible: true,
        // ✅ Show % on price axis
        priceFormat: { type: 'custom', formatter: val => val.toFixed(2) + '%' },
      })

      const sessionSeries = chart.addLineSeries({
        color: '#14f195',
        lineWidth: 3,
        title: 'Session Engine',
        priceLineVisible: true,
        lastValueVisible: true,
        priceFormat: { type: 'custom', formatter: val => val.toFixed(2) + '%' },
      })

      // ✅ FIX 6: Only set data if the array is non-empty
      if (manualCurve.length) manualSeries.setData(manualCurve)
      if (sessionCurve.length) sessionSeries.setData(sessionCurve)

      chart.timeScale().fitContent()

      // ✅ FIX 7: Proper resize handler with ref guard
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          })
        }
      }
      window.addEventListener('resize', handleResize)

      // Return cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
        chartRef.current = null
      }
    }

    // ✅ FIX 8: Proper async cleanup — no more .then(fn => fn && fn()) race condition
    initChart()
      .then(fn => { cleanup = fn })
      .catch(err => console.error('[TradingChart] Init failed:', err))

    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [sessionMeta, manualMeta])

  return (
    <div className={styles.chartWrapperInner}>
      <div ref={chartContainerRef} className={styles.chartInstance} />
      <div className={styles.chartLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDotSession}></span>
          <span>Session Engine</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDotManual}></span>
          <span>Manual Baseline</span>
        </div>
      </div>
    </div>
  )
}
