import { getPaginatedKlines } from "@/lib/exchanges/binance"

export default async function handler(req, res) {
  const { symbol, interval = "5m", startTime, endTime, type = "spot" } = req.query

  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" })
  }

  try {
    const start = startTime ? parseInt(startTime) : Date.now() - 24 * 60 * 60 * 1000
    const end = endTime ? parseInt(endTime) : Date.now()

    console.log(`Fetching candles for ${symbol} from ${new Date(start).toISOString()} to ${new Date(end).toISOString()}`)

    const candles = await getPaginatedKlines(symbol, start, end, interval, type)
    
    // Add cache header for performance (5 mins)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=59')
    res.status(200).json(candles)
  } catch (error) {
    console.error("Candles API error:", error)
    res.status(500).json({ error: error.message })
  }
}
