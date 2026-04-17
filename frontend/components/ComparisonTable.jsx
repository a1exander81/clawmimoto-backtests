import styles from '../styles/Home.module.css'
export default function ComparisonTable({ session, manual }) {
  if (!session || !manual) return null
  const metrics = [
    { key: 'total_trades', label: 'Total Trades' },
    { key: 'win_rate', label: 'Win Rate', suffix: '%' },
    { key: 'total_pnl_pct', label: 'Total PnL', suffix: '%' },
    { key: 'sharpe_ratio', label: 'Sharpe Ratio' },
    { key: 'max_drawdown_pct', label: 'Max Drawdown', suffix: '%' },
  ]
return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Metric</th>
          <th className={styles.sessionCol}>Session</th>
          <th className={styles.manualCol}>Manual</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map(m => (
          <tr key={m.key}>
            <td>{m.label}</td>
            <td className={styles.sessionCol}>
              {session[m.key]?.toLocaleString()}{m.suffix || ''}
            </td>
            <td className={styles.manualCol}>
              {manual[m.key]?.toLocaleString()}{m.suffix || ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
