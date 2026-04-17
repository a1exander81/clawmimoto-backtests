import Head from 'next/head'
import TradingChart from '../components/TradingChart'
import ComparisonTable from '../components/ComparisonTable'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Clawmimoto Backtests — Verifiable Performance</title>
        <meta name="description" content="Session vs Manual backtest results anchored on Solana" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          🦀 Clawmimoto Backtests
        </h1>
        <p className={styles.subtitle}>
          Verifiable trading performance — Session mode vs Manual mode
        </p>

        <section className={styles.section}>
          <h2>📈 Trading Activity Chart</h2>
          <TradingChart />
        </section>

        <section className={styles.section}>
          <h2>📊 Performance Metrics</h2>
          <ComparisonTable />
        </section>

        <footer className={styles.footer}>
          <p>
            Data stored on <a href="https://github.com/a1exander81/clawmimoto-backtests" target="_blank" rel="noopener noreferrer">GitHub</a> • 
            Anchored on <a href="https://solscan.io" target="_blank" rel="noopener noreferrer">Solana</a>
          </p>
          <p className={styles.attribution}>
            Powered by <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer">OpenClaw Analytics</a> • Fueled by <a href="https://freqtrade.io" target="_blank" rel="noopener noreferrer">Freqtrade</a>
          </p>
          <p className={styles.disclaimer}>
            Past performance does not guarantee future results. Trading carries risk.
          </p>
        </footer>
      </main>
    </div>
  )
}
