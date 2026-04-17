import styles from '../styles/Home.module.css'

export default function ComparisonTable({ session, manual }) {
  if (!session || !manual) return null
  
  const metrics = [
    { key: 'total_trades', label: 'Total Trades', type: 'number' },
    { key: 'win_rate', label: 'Win Rate', suffix: '%', type: 'percent' },
    { key: 'total_pnl_pct', label: 'Total PnL', suffix: '%', type: 'pnl' },
    { key: 'sharpe_ratio', label: 'Sharpe Ratio', type: 'number' },
    { key: 'max_drawdown_pct', label: 'Max Drawdown', suffix: '%', type: 'drawdown' },
  ]

  const formatValue = (val, type) => {
    if (val === undefined || val === null) return 'N/A'
    const str = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (type === 'percent' || type === 'pnl') return `${str}`
    return str
  }

  const getPnlClass = (val) => {
    if (val > 0) return styles.valuePositive
    if (val < 0) return styles.valueNegative
    return ''
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.labelCol}>METRIC</th>
            <th className={styles.sessionHeader}>SESSION MODE</th>
            <th className={styles.manualHeader}>MANUAL MODE</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map(m => {
            const sessionVal = session[m.key]
            const manualVal = manual[m.key]
            return (
              <tr key={m.key} className={styles.tableRow}>
                <td className={styles.metricLabel}>{m.label}</td>
                <td className={`${styles.valueCol} ${m.type === 'pnl' ? getPnlClass(sessionVal) : ''}`}>
                  <span className={styles.monoValue}>
                    {formatValue(sessionVal, m.type)}{m.suffix || ''}
                  </span>
                </td>
                <td className={`${styles.valueCol} ${m.type === 'pnl' ? getPnlClass(manualVal) : ''}`}>
                  <span className={styles.monoValue}>
                    {formatValue(manualVal, m.type)}{m.suffix || ''}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
