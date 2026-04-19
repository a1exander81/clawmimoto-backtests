const BINANCE_SPOT_URL = process.env.NEXT_PUBLIC_BINANCE_SPOT_URL || "https://api.binance.com"
const BINANCE_FUTURES_URL = process.env.NEXT_PUBLIC_BINANCE_FUTURES_URL || "https://fapi.binance.com"

/**
 * Fetch latest ticker price from Binance (Spot or Futures)
 */
export async function getBinanceTicker(symbol = "", type = "spot") {
  try {
    const baseUrl = type === "futures" ? BINANCE_FUTURES_URL : BINANCE_SPOT_URL
    const endpoint = type === "futures" ? "/fapi/v1/ticker/price" : "/api/v3/ticker/price"
    const s = symbol.replace(/-/g, '')
    const url = `${baseUrl}${endpoint}${s ? `?symbol=${s}` : ''}`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Binance ${type} Status: ${response.status}`)
    const data = await response.json()
    
    // Normalize response to { symbol: 'BTC-USDT', price: 'float' }
    const format = (t) => ({
      symbol: t.symbol.includes('USDT') ? t.symbol.replace('USDT', '-USDT') : t.symbol,
      price: t.price
    })

    if (Array.isArray(data)) return data.map(format)
    return [format(data)]
  } catch (error) {
    console.error(`Binance ${type} Ticker Error:`, error)
    return null
  }
}

/**
 * Fetch a single candle (used for spot verification)
 */
export async function getBinanceKlines(symbol, startTime, endTime, interval = '1m', type = "spot") {
  try {
    const baseUrl = type === "futures" ? BINANCE_FUTURES_URL : BINANCE_SPOT_URL
    const endpoint = type === "futures" ? "/fapi/v1/klines" : "/api/v3/klines"
    const s = symbol.replace(/-/g, '')
    const url = `${baseUrl}${endpoint}?symbol=${s}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Binance Klines Status: ${response.status}`)
    const data = await response.json()
    
    if (data && data[0]) {
      const [openTime, open, high, low, close, volume] = data[0]
      return { 
        open: parseFloat(open), 
        high: parseFloat(high), 
        low: parseFloat(low), 
        close: parseFloat(close), 
        volume: parseFloat(volume), 
        openTime 
      }
    }
    return null
  } catch (error) {
    console.error("Binance Klines Error:", error)
    return null
  }
}

/**
 * Robust paginated Kline fetching for historical ranges
 */
export async function getPaginatedKlines(symbol, startTime, endTime, interval = '5m', type = "spot") {
  const baseUrl = type === "futures" ? BINANCE_FUTURES_URL : BINANCE_SPOT_URL
  const endpoint = type === "futures" ? "/fapi/v1/klines" : "/api/v3/klines"
  const s = symbol.replace(/-/g, '')
  let allKlines = []
  let currentStart = startTime

  try {
    while (currentStart < endTime) {
      const url = `${baseUrl}${endpoint}?symbol=${s}&interval=${interval}&startTime=${currentStart}&endTime=${endTime}&limit=1000`
      const response = await fetch(url)
      if (!response.ok) break
      
      const data = await response.json()
      if (!data || data.length === 0) break
      
      const formatted = data.map(k => ({
        time: k[0] / 1000, // Seconds for Lightweight Charts
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }))
      
      allKlines = [...allKlines, ...formatted]
      
      // Look at the last kline to find the next startTime
      const lastKline = data[data.length - 1]
      currentStart = lastKline[6] + 1 // last kline's closeTime + 1ms
      
      // Avoid infinite loop if range is huge (safety cap)
      if (allKlines.length > 5000) break
    }
    return allKlines
  } catch (error) {
    console.error("Paginated Klines Error:", error)
    return []
  }
}
