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
          background: { color: 'transparent' },
          textColor: '#8b949e',
          fontFamily: "'Inter', sans-serif",
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

      const manualSeries = chart.addLineSeries({
        color: '#dc1fff', // Solana Magenta
        lineWidth: 2,
        title: 'Manual Baseline',
        priceLineVisible: false,
      })
      
      const sessionSeries = chart.addLineSeries({
        color: '#14f195', // Solana Cyan
        lineWidth: 3,
        title: 'Session Engine',
        priceLineVisible: true,
        lastValueVisible: true,
      })

      // Convert candle data to line data
      const sessionLine = sessionData.map(d => ({ time: d.time.getTime() / 1000, value: d.close }))
      const manualLine = manualData.map(d => ({ time: d.time.getTime() / 1000, value: d.close }))

      manualSeries.setData(manualLine)
      sessionSeries.setData(sessionLine)

      chart.timeScale().fitContent()

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
