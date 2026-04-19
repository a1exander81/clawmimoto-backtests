import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const { mode } = req.query
  if (!['session','manual'].includes(mode)) return res.status(400).json({error:'Invalid mode'})
  
  const period = '2026-03'
  // Use absolute path to the backtests directory
  const filePath = path.join(process.cwd(), '..', 'backtests', period, mode, 'trades.jsonl')

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local file not found: ${filePath}`)
    }
    const text = fs.readFileSync(filePath, 'utf8')
    // Convert JSONL to a standard JSON Array
    const trades = text.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line)
      } catch (e) {
        console.warn("Skipping malformed JSONL line:", line)
        return null
      }
    }).filter(Boolean)

    res.status(200).json(trades)
  } catch (error) {
    console.error('Failed to load local trades:', error)
    res.status(500).json({error: 'Failed to load trades locally'})
  }
}
