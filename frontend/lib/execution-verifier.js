import { getBinanceKlines } from "./exchanges/binance"
import { getOKXCandles } from "./exchanges/okx"
import { getAsterDEXKlines } from "./exchanges/asterdex"

export async function verifyTradeExecution(trade) {
  const { symbol, entry_ts, entry_price, exit_ts, exit_price } = trade
  
  // Normalized symbol for exchanges (e.g. BTC-USDT to BTCUSDT)
  const normSymbol = symbol.replace(/-/g, '')
  
  // We prioritize Binance for historical truth as it has the deepest liquidity
  const verifiers = [
    { name: "Binance", fetcher: (start, end) => getBinanceKlines(symbol, start, end) },
    { name: "OKX", fetcher: (start, end) => getOKXCandles(symbol, start, end) },
    { name: "AsterDEX", fetcher: (start, end) => getAsterDEXKlines(symbol, start, end) }
  ]

  let marketData = null
  let sourceName = ""

  for (const v of verifiers) {
    try {
      // 1 minute range around entry
      marketData = await v.fetcher(entry_ts, entry_ts + 60000)
      if (marketData) {
        sourceName = v.name
        break
      }
    } catch (e) {
      console.warn(`Verification fallback: ${v.name} failed`)
    }
  }

  if (!marketData) return { verified: false, error: "Market data unavailable for verification" }

  const entryLow = parseFloat(marketData.low)
  const entryHigh = parseFloat(marketData.high)
  
  // Integrity Logic: Check if reported entry price is within the actual 1m candle range
  const isEntryPossible = entry_price >= entryLow && entry_price <= entryHigh
  
  // Calculate relative slippage compared to candle mid
  const candleMid = (entryLow + entryHigh) / 2
  const slippagePct = ((entry_price - candleMid) / candleMid) * 100

  return {
    verified: true,
    source: sourceName,
    marketLow: entryLow,
    marketHigh: entryHigh,
    isEntryPossible,
    slippagePct: parseFloat((slippagePct || 0).toFixed(4)),
    timestamp: marketData.openTime
  }
}
