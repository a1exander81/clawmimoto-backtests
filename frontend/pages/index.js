import { useState, useEffect } from 'react'
import Head from 'next/head'
import TradingChart from '../components/TradingChart'
import ComparisonTable from '../components/ComparisonTable'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [sessionMeta, setSessionMeta] = useState(null)
  const [manualMeta, setManualMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/metadata/session').then(r => {
        if (!r.ok) throw new Error('Session data failed')
        return r.json()
      }),
      fetch('/api/metadata/manual').then(r => {
        if (!r.ok) throw new Error('Manual data failed')
        return r.json()
      }),
    ]).then(([s, m]) => {
      setSessionMeta(s)
      setManualMeta(m)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load data:', err)
      setError(err.message)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Initializing terminal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Terminal Error</h2>
          <p>{error}</p>
          <p>Check connection to backtest data source.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>CLAWMIMOTO | Backtest Dashboard</title>
        <meta name="description" content="Professional backtest results for Clawmimoto trading bot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>CLAWMIMOTO <span className={styles.subtitle}>ENGINE V2.4</span></h1>
          <p className={styles.subtitle}>5M SCALPING STRATEGY | BACKTEST ANALYTICS</p>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge}>Live Data Feed</span>
          <span className={styles.badge}>BingX Perpetual</span>
          <span className={styles.badge}>Isolated Margin</span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.statusCards}>
          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Total PnL (Session)</span>
            <span className={`${styles.statusValue} ${sessionMeta.total_pnl_pct > 0 ? styles.valuePositive : styles.valueNegative}`}>
              {sessionMeta.total_pnl_pct > 0 ? '+' : ''}{sessionMeta.total_pnl_pct.toFixed(2)}%
            </span>
            <span className={styles.statusTrend}>Cumulative Net</span>
          </div>
          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Win Rate</span>
            <span className={styles.statusValue}>{sessionMeta.win_rate.toFixed(1)}%</span>
            <span className={styles.statusTrend}>Hit Probability</span>
          </div>
          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Sharpe Ratio</span>
            <span className={styles.statusValue}>{sessionMeta.sharpe_ratio.toFixed(2)}</span>
            <span className={styles.statusTrend}>Risk-Adjusted Return</span>
          </div>
          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Total Trades</span>
            <span className={styles.statusValue}>{sessionMeta.total_trades}</span>
            <span className={styles.statusTrend}>Executed in Period</span>
          </div>
        </section>

        <div className={styles.dashboardGrid}>
          <section className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>Equity Performance</h2>
            <TradingChart sessionMeta={sessionMeta} manualMeta={manualMeta} />
          </section>

          <section className={styles.metricsSection}>
            <h2 className={styles.sectionTitle}>Comparative Metrics</h2>
            <ComparisonTable session={sessionMeta} manual={manualMeta} />
          </section>
        </div>

        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>System Specifications</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3>Session Filter</h3>
              <p>Restricts trading to NY/London/Tokyo session overlaps with maximum volatility. Optimized for 3 trades/day maximum.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Risk Module</h3>
              <p>Dynamic position sizing at 1-2% per trade. Hard stop-loss at -20% with trailing take-profit at +50% triggers.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Data Integrity</h3>
              <p>Historical 5M candles pulled from BingX API. Execution engine simulated via internal Freqtrade-native backtester.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.disclaimer}>
            PAST PERFORMANCE IS NOT INDICATIVE OF FUTURE RESULTS. TRADING CRYPTOCURRENCY CARRIES SUBSTANTIAL RISK. DATA PROVIDED BY OPENCLAW ANALYTICS.
          </p>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} CLAWFORGE QUANTITATIVE RESEARCH.
          </p>
        </div>
      </footer>
    </div>
  )
}