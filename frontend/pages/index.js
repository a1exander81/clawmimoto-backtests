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
          <p>Syncing Terminal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Link Fault</h2>
          <p>{error}</p>
          <p>Verify data node connectivity.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>CLAWMIMOTO | Terminal</title>
        <meta name="description" content="Obsidian trading dashboard for Clawmimoto backtests" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>CLAWMIMOTO <span>Terminal</span></h1>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge}>Status: Active</span>
          <span className={styles.badge}>Network: Mainnet-Beta</span>
          <span className={styles.badge}>Module: Backtest-V2</span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.statusCards}>
          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Cumulative Profit</span>
            <span className={`${styles.statusValue} ${sessionMeta.total_pnl_pct > 0 ? styles.valuePositive : styles.valueNegative}`}>
              {sessionMeta.total_pnl_pct > 0 ? '+' : ''}{sessionMeta.total_pnl_pct.toFixed(2)}%
            </span>
            <span className={styles.statusTrend}>Total Net Yield</span>
          </div>
          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Win Probability</span>
            <span className={styles.statusValue}>{sessionMeta.win_rate.toFixed(1)}%</span>
            <span className={styles.statusTrend}>Trade Hit Rate</span>
          </div>
          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Risk Multiplier</span>
            <span className={styles.statusValue}>{sessionMeta.sharpe_ratio.toFixed(2)}</span>
            <span className={styles.statusTrend}>Sharpe Coefficient</span>
          </div>
          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Task Execution</span>
            <span className={styles.statusValue}>{sessionMeta.total_trades}</span>
            <span className={styles.statusTrend}>Completed Trades</span>
          </div>
        </section>

        <div className={styles.dashboardGrid}>
          <section className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>Equity Variance</h2>
            <TradingChart sessionMeta={sessionMeta} manualMeta={manualMeta} />
          </section>

          <section className={styles.metricsSection}>
            <h2 className={styles.sectionTitle}>Comparative Analytics</h2>
            <ComparisonTable session={sessionMeta} manual={manualMeta} />
          </section>
        </div>

        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>Engine Protocols</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3>Volatility Filter</h3>
              <p>Trading limited to high-liquidity session overlaps (NY/London). Minimizing slippage through systematic time-weighting.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Execution Logic</h3>
              <p>Isolated margin with 1-2% position sizing. Automated trailing triggers enabled at +50% ROI benchmarks.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Data Validation</h3>
              <p>Aggregated BingX perpetual order book data. Backtest fidelity verified through Freqtrade-native simulation core.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.disclaimer}>
            PROPRIETARY TERMINAL. PAST PERFORMANCE DATA IS NO GUARANTEE OF FUTURE ASSET APPRECIATION. TRADE AT OWN RISK.
          </p>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} CLAWFORGE QUANT RESEARCH | POWERED BY SOLANA DESIGN.
          </p>
        </div>
      </footer>
    </div>
  )
}