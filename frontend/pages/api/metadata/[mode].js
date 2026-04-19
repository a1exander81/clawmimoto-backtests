import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const { mode } = req.query
  if (!['session','manual'].includes(mode)) return res.status(400).json({error:'Invalid mode'})
  
  const period = '2026-03'
  const filePath = path.join(process.cwd(), '..', 'backtests', period, mode, 'metadata.json')

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local metadata not found: ${filePath}`)
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    res.status(200).json(data)
  } catch (error) {
    console.error('Failed to load local metadata:', error)
    res.status(500).json({error: 'Failed to load metadata locally'})
  }
}
