import { getTickerPrice as getBingXTicker } from "./exchanges/bingx"
import { getBinanceTicker } from "./exchanges/binance"
import { getOKXTicker } from "./exchanges/okx"
import { getAsterDEXTicker } from "./exchanges/asterdex"

const PRIORITY_LOGIC = [
  { name: "BingX", fetcher: getBingXTicker },
  { name: "Binance", fetcher: getBinanceTicker },
  { name: "OKX", fetcher: getOKXTicker },
  { name: "AsterDEX", fetcher: getAsterDEXTicker },
]

export async function fetchAllMarketPrices(symbols = ["SOL-USDT", "BTC-USDT", "ETH-USDT", "BNB-USDT"]) {
  const finalPrices = {}
  const sources = {}

  // We attempt to fill the prices for all requested symbols using the priority chain
  for (const exchange of PRIORITY_LOGIC) {
    try {
      const tickers = await Promise.race([
        exchange.fetcher(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
      ])

      if (!tickers || !Array.isArray(tickers)) continue

      tickers.forEach(t => {
        // Only fill if not already filled by a higher priority source
        if (symbols.includes(t.symbol) && !finalPrices[t.symbol]) {
          finalPrices[t.symbol] = t.price
          sources[t.symbol] = exchange.name
        }
      })

      // If all symbols are filled, we can stop early
      if (symbols.every(s => finalPrices[s])) break

    } catch (error) {
      console.warn(`Fallback triggered: ${exchange.name} failed`, error.message)
    }
  }

  return {
    prices: finalPrices,
    sources: sources,
    timestamp: new Date().toISOString()
  }
}
