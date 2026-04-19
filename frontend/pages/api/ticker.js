import { fetchAllMarketPrices } from "@/lib/market-service"

export default async function handler(req, res) {
  try {
    const market = await fetchAllMarketPrices()
    
    // Add extra metadata for the UI HUD
    const formatted = {
      prices: market.prices,
      sources: market.sources,
      timestamp: market.timestamp,
      source: Object.values(market.sources)[0] || "Multiple" // Primary display source
    }

    res.status(200).json(formatted)
  } catch (error) {
    console.error("Ticker API critical error:", error)
    res.status(500).json({ error: error.message })
  }
}
