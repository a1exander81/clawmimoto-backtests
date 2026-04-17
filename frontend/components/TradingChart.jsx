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
        fetch(`/api/backtest/${meta.mode}`)
          .then(r => r.text())
          .then(text => {
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

      const [sessionData, manualData] = await Promise.all([
        buildSeries(sessionMeta),
        buildSeries(manualMeta)
      ])

      const chart = createChartLib(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { color: '#05070a' },
          textColor: '#8b949e',
        },
        grid: {
          vertLines: { color: '#161b22' },
          horzLines: { color: '#161b22' },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: '#38bdf8',
            style: 2,
          },
          horzLine: {
            width: 1,
            color: '#38bdf8',
            style: 2,
          },
        },
        rightPriceScale: {
          borderColor: '#30363d',
          visible: true,
        },
        timeScale: {
          borderColor: '#30363d',
          timeVisible: true,
          secondsVisible: false,
        },
      })

      const manualSeries = chart.addLineSeries({
        color: '#f85149',
        lineWidth: 2,
        title: 'Manual Mode',
      })
      
      const sessionSeries = chart.addLineSeries({
        color: '#3fb950',
        lineWidth: 3,
        title: 'Session Mode',
      })

      // Convert candle data to line data (using close price for equity-like view)
      const sessionLine = sessionData.map(d => ({ time: d.time.getTime() / 1000, value: d.close }))
      const manualLine = manualData.map(d => ({ time: d.time.getTime() / 1000, value: d.close }))

      manualSeries.setData(manualLine)
      sessionSeries.setData(sessionLine)

      chart.timeScale().fitContent()

      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
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
