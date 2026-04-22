export default async function handler(req, res) {
  const { mode } = req.query
  const validModes = ['session', 'manual', 'live']
  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' })
  }
  const period = mode === 'live'
    ? new Date().toISOString().slice(0, 7)
    : '2026-04'
  const githubRaw = process.env.NEXT_PUBLIC_GITHUB_RAW ||
    'https://raw.githubusercontent.com/a1exander81/clawmimoto-backtests/main'
  const url = `${githubRaw}/backtests/${period}/${mode}/trades.jsonl`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = await response.text()
    res.setHeader('Content-Type', 'application/jsonl')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    res.status(200).send(text)
  } catch (error) {
    console.error('Failed to fetch trades:', error)
    res.status(500).json({ error: 'Failed to load trades' })
  }
}
