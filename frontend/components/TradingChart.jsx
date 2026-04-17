'use client'

import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, HistogramSeries, Time } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#e0e0e0',
      },
      grid: {
        vertLines: { color: '#222' },
        horzLines: { color: '#222' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#00bcd4', width: 1 },
        horzLine: { color: '#00bcd4', width: 1 },
      },
      rightPriceScale: {
        borderColor: '#333',
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    candlestickSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff9d',
      downColor: '#ff6b6b',
      borderVisible: false,
      wickUpColor: '#00ff9d',
      wickDownColor: '#ff6b6b',
    })

    volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chartRef.current = chart

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: 500 })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [sessionRes, manualRes] = await Promise.all([
          fetch('/api/backtest/session?period=2026-03'),
          fetch('/api/backtest/manual?period=2026-03'),
        ])
        const session = await sessionRes.json()
        const manual = await manualRes.json()

        // Build candlestick data from trades (simulate OHLC from entry/exit)
        // For demo, we'll aggregate by day
        const sessionCandles = aggregateToCandles(session.trades)
        const manualCandles = aggregateToCandles(manual.trades)

        if (candlestickSeriesRef.current && volumeSeriesRef.current) {
          candlestickSeriesRef.current.setData(sessionCandles)
          volumeSeriesRef.current.setData(sessionCandles.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(0,255,157,0.5)' : 'rgba(255,107,107,0.5)',
          })))
        }
      } catch (e) {
        console.error("Failed to load chart data", e)
      }
    }
    loadData()
  }, [])

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <div ref={chartContainerRef} style={{ width: '100%', height: 500 }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}>
        <span style={{ color: '#00ff9d' }}>● Session Mode</span>
        <span style={{ color: '#ff6b6b' }}>● Manual Mode</span>
      </div>
    </div>
  )
}

function aggregateToCandles(trades) {
  // Group trades by date and simulate OHLC from entry/exit prices
  const daily = {}
  for (const t of trades) {
    const date = t.timestamp.split('T')[0]
    if (!daily[date]) {
      daily[date] = { opens: [], highs: [], lows: [], closes: [], volume: 0 }
    }
    daily[date].opens.push(t.entry_price)
    daily[date].highs.push(max(t.entry_price, t.exit_price, t.tp, t.sl))
    daily[date].lows.push(min(t.entry_price, t.exit_price, t.tp, t.sl))
    daily[date].closes.push(t.exit_price)
    daily[date].volume += 1  # count trades as volume proxy
  }

  return Object.entries(daily).map(([date, d]) => ({
    time: date as Time,
    open: d.opens[0],
    high: Math.max(...d.highs),
    low: Math.min(...d.lows),
    close: d.closes[d.closes.length - 1],
    volume: d.volume,
  })).sort((a, b) => a.time.localeCompare(b.time))
}

function max(...nums) {
  return Math.max(...nums.filter(n => n > 0))
}
function min(...nums) {
  const filtered = nums.filter(n => n > 0)
  return filtered.length ? Math.min(...filtered) : 0
}
