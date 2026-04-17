export default async function handler(req, res) {
  const { mode } = req.query
  if (!['session','manual'].includes(mode)) return res.status(400).json({error:'Invalid mode'})
  const period = '2026-03'
  const githubRaw = process.env.NEXT_PUBLIC_GITHUB_RAW || 'https://raw.githubusercontent.com/a1exander81/clawmimoto-backtests/main'
  const url = `${githubRaw}/backtests/${period}/${mode}/metadata.json`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Failed:', error)
    res.status(500).json({error:'Failed to load metadata'})
  }
}
