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
  const url = `${githubRaw}/backtests/${period}/${mode}/metadata.json`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    res.status(200).json(data)
  } catch (error) {
    console.error('Failed to fetch metadata:', error)
    res.status(500).json({ error: 'Failed to load metadata' })
  }
}
