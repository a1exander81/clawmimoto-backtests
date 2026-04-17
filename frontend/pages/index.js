import { useState, useEffect } from 'react'
import Head from 'next/head'
import TradingChart from '../components/TradingChart'
import ComparisonTable from '../components/ComparisonTable'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [sessionMeta,setSessionMeta]=useState(null)
  const [manualMeta,setManualMeta]=useState(null)
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    Promise.all([
      fetch('/api/metadata/session').then(r=>r.json()),
      fetch('/api/metadata/manual').then(r=>r.json()),
    ]).then(([s,m])=>{setSessionMeta(s);setManualMeta(m);setLoading(false)})
    .catch(err=>{console.error('Failed:',err);setLoading(false)})
  },[])
return (
    <div className={styles.container}>
      <Head><title>Clawmimoto Backtests</title><meta name="description" content="Transparent backtest results" /><link rel="icon" href="/favicon.ico" /></Head>
      <header className={styles.header}><h1 className={styles.title}>Clawmimoto Backtests</h1><p className={styles.subtitle}>Session vs Manual — 5M Scalping Engine</p></header>
      <main className={styles.main}>
        {loading ? <p>Loading...</p> : (
          <>
            <section className={styles.chartSection}><h2>Equity Curve & Trades</h2><TradingChart sessionMeta={sessionMeta} manualMeta={manualMeta} /></section>
            <section className={styles.metricsSection}><h2>Performance Metrics</h2><ComparisonTable session={sessionMeta} manual={manualMeta} /></section>
          </>
        )}
        <footer className={styles.footer}>
          <p>Powered by <a href="https://openclaw.ai" target="_blank" rel="noreferrer">OpenClaw Analytics</a> • Fueled by <a href="https://freqtrade.io" target="_blank" rel="noreferrer">Freqtrade</a></p>
          <p className={styles.disclaimer}>Past performance does not guarantee future results. Trading carries significant risk.</p>
        </footer>
      </main>
    </div>
  )
}
